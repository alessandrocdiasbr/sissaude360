import { esusQuery } from '../config/esusDb';
import { DateRangeParams, EsusReferral, ReferralFilters } from '../modules/esus/esus.types';

export async function getAllReferrals(
  filters: ReferralFilters
): Promise<{ data: EsusReferral[]; total: number }> {
  const page = Math.max(Number(filters.page) || 1, 1);
  const limit = Math.min(Math.max(Number(filters.limit) || 20, 1), 100);
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: any[] = [];

  if (filters.specialty) {
    params.push(`%${filters.specialty}%`);
    conditions.push(`e.ds_especialidade_destino ILIKE $${params.length}`);
  }
  if (filters.dateFrom) {
    params.push(filters.dateFrom);
    conditions.push(`e.dt_solicitacao >= $${params.length}`);
  }
  if (filters.dateTo) {
    params.push(filters.dateTo);
    conditions.push(`e.dt_solicitacao <= $${params.length}`);
  }
  if (filters.ine) {
    params.push(filters.ine);
    conditions.push(`p.nu_ine = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await esusQuery<{ total: string }>(
    `SELECT COUNT(*) as total
     FROM tb_fat_encaminhamento e
     LEFT JOIN tb_cidadao c ON c.co_seq_cidadao = e.co_cidadao
     LEFT JOIN tb_prof p ON p.co_seq_prof = e.co_prof
     ${where}`,
    params
  );
  const total = parseInt(countResult.rows[0]?.total || '0', 10);

  params.push(limit, offset);
  const dataResult = await esusQuery<any>(
    `SELECT
       e.co_seq_fat_encaminhamento  AS id,
       c.no_cidadao                 AS "pacienteNome",
       c.nu_cns                     AS "pacienteCns",
       e.ds_especialidade_destino   AS "especialidadeDestino",
       e.co_cid10                   AS cid10,
       e.co_ciap2                   AS ciap2,
       e.ds_hipotese_diagnostica    AS "hipoteseDiagnostica",
       p.no_prof                    AS "profissionalSolicitante",
       p.ds_cbo                     AS cbo,
       e.dt_solicitacao             AS "dtSolicitacao",
       e.ds_classificacao_risco     AS "classificacaoRisco",
       e.no_unidade_saude           AS "unidadeSaude",
       e.ds_observacao              AS observacao
     FROM tb_fat_encaminhamento e
     LEFT JOIN tb_cidadao c ON c.co_seq_cidadao = e.co_cidadao
     LEFT JOIN tb_prof p ON p.co_seq_prof = e.co_prof
     ${where}
     ORDER BY e.dt_solicitacao DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return { data: dataResult.rows, total };
}

export async function getReferralsBySpecialty(): Promise<
  Array<{ especialidade: string; total: number }>
> {
  const result = await esusQuery<any>(
    `SELECT
       ds_especialidade_destino AS especialidade,
       COUNT(*) AS total
     FROM tb_fat_encaminhamento
     WHERE ds_especialidade_destino IS NOT NULL
     GROUP BY ds_especialidade_destino
     ORDER BY total DESC`
  );
  return result.rows.map((r: any) => ({ especialidade: r.especialidade, total: Number(r.total) }));
}

export async function getReferralStats(filters: DateRangeParams): Promise<object> {
  const params: any[] = [];
  const conditions: string[] = [];

  if (filters.dateFrom) { params.push(filters.dateFrom); conditions.push(`dt_solicitacao >= $${params.length}`); }
  if (filters.dateTo) { params.push(filters.dateTo); conditions.push(`dt_solicitacao <= $${params.length}`); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [totalRes, especialidadeRes] = await Promise.all([
    esusQuery<any>(`SELECT COUNT(*) as total FROM tb_fat_encaminhamento ${where}`, params),
    esusQuery<any>(
      `SELECT ds_especialidade_destino AS especialidade, COUNT(*) AS total
       FROM tb_fat_encaminhamento ${where}
       GROUP BY ds_especialidade_destino ORDER BY total DESC LIMIT 10`,
      params
    ),
  ]);

  return {
    total: Number(totalRes.rows[0]?.total || 0),
    porEspecialidade: especialidadeRes.rows.map((r: any) => ({
      especialidade: r.especialidade,
      total: Number(r.total),
    })),
  };
}
