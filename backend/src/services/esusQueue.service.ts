import { PrismaClient } from '@prisma/client';
import { esusQuery } from '../config/esusDb';
import { CreateQueueItemDto, QueueFilters, UpdateQueueStatusDto } from '../modules/esus/esus.types';

const prisma = new PrismaClient();

const TERMINAL_STATUSES = ['REALIZADO', 'CANCELADO'];

export async function getQueue(filters: QueueFilters) {
  const page = Math.max(Number(filters.page) || 1, 1);
  const limit = Math.min(Math.max(Number(filters.limit) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const where: any = {};
  if (filters.status) where.status = filters.status;
  if (filters.type) where.type = filters.type;
  if (filters.priority) where.priority = filters.priority;
  if (filters.specialty) where.specialty = { contains: filters.specialty, mode: 'insensitive' };
  if (filters.search) {
    where.OR = [
      { patientName: { contains: filters.search, mode: 'insensitive' } },
      { patientCns: { contains: filters.search } },
    ];
  }

  const [total, data] = await Promise.all([
    prisma.esusQueueItem.count({ where }),
    prisma.esusQueueItem.findMany({
      where,
      orderBy: [{ priority: 'asc' }, { requestedAt: 'asc' }],
      skip,
      take: limit,
    }),
  ]);

  return { data, total, page, limit };
}

export async function addToQueue(dto: CreateQueueItemDto) {
  return prisma.$transaction(async (tx) => {
    const item = await tx.esusQueueItem.create({
      data: {
        patientCns: dto.patientCns,
        patientName: dto.patientName,
        type: dto.type,
        description: dto.description,
        specialty: dto.specialty,
        cid10: dto.cid10,
        ciap2: dto.ciap2,
        priority: dto.priority || 'MEDIA',
        sourceEsusId: dto.sourceEsusId,
        requestedByCns: dto.requestedByCns,
        requestedAt: new Date(dto.requestedAt),
        notes: dto.notes,
      },
    });
    await tx.esusQueueAuditLog.create({
      data: { queueItemId: item.id, action: 'created', newStatus: item.status, performedBy: 'system' },
    });
    return item;
  });
}

export async function updateStatus(id: string, dto: UpdateQueueStatusDto) {
  const item = await prisma.esusQueueItem.findUnique({ where: { id } });
  if (!item) throw new Error('Item não encontrado na fila.');
  if (TERMINAL_STATUSES.includes(item.status)) {
    throw new Error(`Status "${item.status}" é terminal e não pode ser alterado.`);
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.esusQueueItem.update({
      where: { id },
      data: {
        status: dto.status,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        notes: dto.notes !== undefined ? dto.notes : item.notes,
      },
    });
    await tx.esusQueueAuditLog.create({
      data: {
        queueItemId: id,
        action: 'status_changed',
        oldStatus: item.status,
        newStatus: dto.status,
        performedBy: dto.performedBy,
        notes: dto.notes,
      },
    });
    return updated;
  });
}

export async function importFromEsus(
  type: string,
  dateFrom: string,
  dateTo: string
): Promise<{ imported: number; skipped: number }> {
  const syncLog = await prisma.esusSyncLog.create({
    data: { syncType: `import_${type}`, status: 'running' },
  });

  let imported = 0;
  let skipped = 0;

  try {
    let rows: any[] = [];

    if (type === 'REFERRAL') {
      const result = await esusQuery<any>(
        `SELECT
           e.co_seq_fat_encaminhamento::text AS source_id,
           c.nu_cns                          AS patient_cns,
           c.no_cidadao                      AS patient_name,
           e.ds_especialidade_destino        AS specialty,
           e.co_cid10                        AS cid10,
           e.co_ciap2                        AS ciap2,
           e.ds_hipotese_diagnostica         AS description,
           e.dt_solicitacao                  AS requested_at,
           p.nu_cns                          AS requested_by_cns
         FROM tb_fat_encaminhamento e
         LEFT JOIN tb_cidadao c ON c.co_seq_cidadao = e.co_cidadao
         LEFT JOIN tb_prof p ON p.co_seq_prof = e.co_prof
         WHERE e.dt_solicitacao BETWEEN $1 AND $2`,
        [dateFrom, dateTo]
      );
      rows = result.rows;
    }

    for (const row of rows) {
      const exists = await prisma.esusQueueItem.findFirst({ where: { sourceEsusId: row.source_id } });
      if (exists) { skipped++; continue; }

      await prisma.esusQueueItem.create({
        data: {
          patientCns: row.patient_cns || '',
          patientName: row.patient_name || 'Não identificado',
          type: 'REFERRAL',
          description: row.description || row.specialty || 'Encaminhamento',
          specialty: row.specialty,
          cid10: row.cid10,
          ciap2: row.ciap2,
          sourceEsusId: row.source_id,
          requestedByCns: row.requested_by_cns,
          requestedAt: row.requested_at ? new Date(row.requested_at) : new Date(),
        },
      });
      imported++;
    }

    await prisma.esusSyncLog.update({
      where: { id: syncLog.id },
      data: { finishedAt: new Date(), recordsFound: rows.length, status: 'success' },
    });
  } catch (err: any) {
    await prisma.esusSyncLog.update({
      where: { id: syncLog.id },
      data: { finishedAt: new Date(), status: 'error', errorMessage: err.message },
    });
    throw err;
  }

  return { imported, skipped };
}

export async function getQueueStats() {
  const [byStatus, byType, byPriority] = await Promise.all([
    prisma.esusQueueItem.groupBy({ by: ['status'], _count: true }),
    prisma.esusQueueItem.groupBy({ by: ['type'], _count: true }),
    prisma.esusQueueItem.groupBy({ by: ['priority'], _count: true }),
  ]);
  return { byStatus, byType, byPriority };
}
