import { esusQuery } from '../config/esusDb';
import { EsusPatient, PatientFilters } from '../modules/esus/esus.types';

export async function getAllPatients(
  filters: PatientFilters
): Promise<{ data: EsusPatient[]; total: number }> {
  const page = Math.max(Number(filters.page) || 1, 1);
  const limit = Math.min(Math.max(Number(filters.limit) || 20, 1), 100);
  const offset = (page - 1) * limit;

  const conditions: string[] = ['c.st_ativo = true'];
  const params: any[] = [];

  if (filters.search) {
    params.push(`%${filters.search}%`, filters.search);
    conditions.push(`(c.no_cidadao ILIKE $${params.length - 1} OR c.nu_cns = $${params.length})`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await esusQuery<{ total: string }>(
    `SELECT COUNT(*) as total FROM tb_cidadao c ${where}`,
    params
  );
  const total = parseInt(countResult.rows[0]?.total || '0', 10);

  params.push(limit, offset);
  const dataResult = await esusQuery<any>(
    `SELECT
       c.co_seq_cidadao   AS id,
       c.no_cidadao       AS nome,
       c.nu_cns           AS cns,
       c.nu_cpf           AS cpf,
       c.dt_nascimento    AS "dataNascimento",
       c.co_sexo          AS sexo,
       c.nu_telefone_celular AS telefone,
       c.no_bairro        AS bairro,
       c.ds_logradouro    AS logradouro,
       c.st_ativo         AS ativo
     FROM tb_cidadao c
     ${where}
     ORDER BY c.no_cidadao
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return { data: dataResult.rows, total };
}

export async function getPatientByCns(cns: string): Promise<EsusPatient | null> {
  const result = await esusQuery<any>(
    `SELECT
       co_seq_cidadao   AS id,
       no_cidadao       AS nome,
       nu_cns           AS cns,
       nu_cpf           AS cpf,
       dt_nascimento    AS "dataNascimento",
       co_sexo          AS sexo,
       nu_telefone_celular AS telefone,
       no_bairro        AS bairro,
       ds_logradouro    AS logradouro,
       st_ativo         AS ativo
     FROM tb_cidadao
     WHERE nu_cns = $1`,
    [cns]
  );
  return result.rows[0] || null;
}

export async function getPatientTimeline(cns: string): Promise<any[]> {
  const result = await esusQuery<any>(
    `SELECT
       co_seq_fat_atend_indiv AS id,
       dt_atendimento         AS "dtAtendimento",
       no_prof                AS "nomeProfissional",
       ds_cbo                 AS cbo,
       ds_cid10               AS cid10,
       ds_ciap2               AS ciap2,
       ds_tipo_atendimento    AS "tipoAtendimento"
     FROM tb_fat_atendimento_individual
     WHERE nu_cns_cidadao = $1
     ORDER BY dt_atendimento DESC
     LIMIT 50`,
    [cns]
  );
  return result.rows;
}
