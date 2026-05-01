import { esusQuery } from '../config/esusDb';
import { ProductionFilters, ProfessionalProduction } from '../modules/esus/esus.types';

function defaultDateRange(filters: ProductionFilters): { dateFrom: string; dateTo: string } {
  const now = new Date();
  const dateFrom = filters.dateFrom || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const dateTo = filters.dateTo || now.toISOString().split('T')[0];
  return { dateFrom, dateTo };
}

function workDays(from: string, to: string): number {
  const start = new Date(from);
  const end = new Date(to);
  let count = 0;
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) count++;
  }
  return Math.max(count, 1);
}

export async function getProductionByProfessional(
  filters: ProductionFilters
): Promise<ProfessionalProduction[]> {
  const { dateFrom, dateTo } = defaultDateRange(filters);

  const ineFilter = filters.ine ? `AND nu_ine = '${filters.ine.replace(/'/g, "''")}'` : '';

  const [ind, odon, vis, atv] = await Promise.all([
    esusQuery<any>(
      `SELECT nu_cns_prof, no_prof, ds_cbo, no_equipe, nu_ine, COUNT(*) as total
       FROM tb_fat_atendimento_individual
       WHERE dt_atendimento BETWEEN $1 AND $2 ${ineFilter}
       GROUP BY nu_cns_prof, no_prof, ds_cbo, no_equipe, nu_ine`,
      [dateFrom, dateTo]
    ),
    esusQuery<any>(
      `SELECT nu_cns_prof, COUNT(*) as total
       FROM tb_fat_atendimento_odontologico
       WHERE dt_atendimento BETWEEN $1 AND $2
       GROUP BY nu_cns_prof`,
      [dateFrom, dateTo]
    ),
    esusQuery<any>(
      `SELECT nu_cns_prof, COUNT(*) as total
       FROM tb_fat_visita_domiciliar
       WHERE dt_visita BETWEEN $1 AND $2
       GROUP BY nu_cns_prof`,
      [dateFrom, dateTo]
    ),
    esusQuery<any>(
      `SELECT nu_cns_prof_responsavel AS nu_cns_prof, COUNT(*) as total
       FROM tb_fat_atividade_coletiva
       WHERE dt_atividade BETWEEN $1 AND $2
       GROUP BY nu_cns_prof_responsavel`,
      [dateFrom, dateTo]
    ),
  ]);

  const map = new Map<string, ProfessionalProduction>();

  for (const row of ind.rows) {
    map.set(row.nu_cns_prof, {
      cnsProfissional: row.nu_cns_prof,
      nomeProfissional: row.no_prof,
      cbo: row.ds_cbo,
      equipe: row.no_equipe,
      ine: row.nu_ine,
      totalAtendimentosIndividuais: Number(row.total),
      totalAtendimentosOdonto: 0,
      totalVisitasDomiciliares: 0,
      totalAtividadesColetivas: 0,
      totalProcedimentos: 0,
      mediaAtendimentosDia: 0,
    });
  }

  for (const row of odon.rows) {
    const p = map.get(row.nu_cns_prof);
    if (p) p.totalAtendimentosOdonto = Number(row.total);
  }
  for (const row of vis.rows) {
    const p = map.get(row.nu_cns_prof);
    if (p) p.totalVisitasDomiciliares = Number(row.total);
  }
  for (const row of atv.rows) {
    const p = map.get(row.nu_cns_prof);
    if (p) p.totalAtividadesColetivas = Number(row.total);
  }

  const dias = workDays(dateFrom, dateTo);
  for (const p of map.values()) {
    p.mediaAtendimentosDia = Math.round((p.totalAtendimentosIndividuais / dias) * 10) / 10;
  }

  return Array.from(map.values());
}

export async function getProductionByPeriod(filters: {
  ine?: string;
  granularity?: 'daily' | 'weekly' | 'monthly';
  dateFrom?: string;
  dateTo?: string;
}): Promise<any[]> {
  const { dateFrom, dateTo } = defaultDateRange(filters);
  const trunc = filters.granularity === 'daily' ? 'day' : filters.granularity === 'weekly' ? 'week' : 'month';

  const result = await esusQuery<any>(
    `SELECT
       DATE_TRUNC('${trunc}', dt_atendimento) AS periodo,
       COUNT(*) AS total
     FROM tb_fat_atendimento_individual
     WHERE dt_atendimento BETWEEN $1 AND $2
     GROUP BY periodo
     ORDER BY periodo`,
    [dateFrom, dateTo]
  );
  return result.rows.map((r: any) => ({ periodo: r.periodo, total: Number(r.total) }));
}
