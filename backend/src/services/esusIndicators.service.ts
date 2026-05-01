import { esusQuery } from '../config/esusDb';
import { IndicatorCode, IndicatorFilters, IndicatorResult } from '../modules/esus/esus.types';

function parsePeriod(competencia: string): { startDate: string; endDate: string } {
  const year = competencia.substring(0, 4);
  const month = competencia.substring(4, 6);
  const start = `${year}-${month}-01`;
  const lastDay = new Date(Number(year), Number(month), 0).getDate();
  const end = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
  return { startDate: start, endDate: end };
}

function calcStatus(resultado: number, meta: number): 'atingido' | 'em_andamento' | 'critico' {
  if (resultado >= meta) return 'atingido';
  if (resultado >= meta * 0.7) return 'em_andamento';
  return 'critico';
}

function makeResult(
  code: IndicatorCode,
  name: string,
  description: string,
  numerador: number,
  denominador: number,
  meta: number
): IndicatorResult {
  const resultado = denominador > 0 ? Math.round((numerador / denominador) * 1000) / 10 : 0;
  return { code, name, description, numerador, denominador, resultado, meta, status: calcStatus(resultado, meta) };
}

async function ind01(start: string, end: string, ine?: string): Promise<IndicatorResult> {
  const ineFilter = ine ? `AND nu_ine = '${ine.replace(/'/g, "''")}'` : '';
  const [den, num] = await Promise.all([
    esusQuery<any>(
      `SELECT COUNT(DISTINCT nu_cns_cidadao) AS total FROM tb_fat_atendimento_individual
       WHERE co_tipo_atendimento = 'PRENATAL' AND dt_atendimento BETWEEN $1 AND $2 ${ineFilter}`,
      [start, end]
    ),
    esusQuery<any>(
      `SELECT COUNT(*) AS total FROM (
         SELECT nu_cns_cidadao FROM tb_fat_atendimento_individual
         WHERE co_tipo_atendimento = 'PRENATAL' AND dt_atendimento BETWEEN $1 AND $2 ${ineFilter}
         GROUP BY nu_cns_cidadao HAVING COUNT(*) >= 6
       ) sub`,
      [start, end]
    ),
  ]);
  return makeResult('IND_01', 'Pré-natal 6+ consultas', 'Gestantes com 6 ou mais consultas de pré-natal',
    Number(num.rows[0]?.total || 0), Number(den.rows[0]?.total || 0), 60);
}

async function ind02(start: string, end: string, ine?: string): Promise<IndicatorResult> {
  const ineFilter = ine ? `AND nu_ine = '${ine.replace(/'/g, "''")}'` : '';
  const [den, num] = await Promise.all([
    esusQuery<any>(
      `SELECT COUNT(DISTINCT nu_cns_cidadao) AS total FROM tb_fat_atendimento_individual
       WHERE co_tipo_atendimento = 'PRENATAL' AND dt_atendimento BETWEEN $1 AND $2 ${ineFilter}`,
      [start, end]
    ),
    esusQuery<any>(
      `SELECT COUNT(DISTINCT a.nu_cns_cidadao) AS total
       FROM tb_fat_atendimento_individual a
       WHERE a.co_tipo_atendimento = 'PRENATAL' AND a.dt_atendimento BETWEEN $1 AND $2 ${ineFilter}
         AND EXISTS (SELECT 1 FROM tb_fat_exame e WHERE e.nu_cns_cidadao = a.nu_cns_cidadao AND e.co_exame ILIKE '%SIFILIS%')
         AND EXISTS (SELECT 1 FROM tb_fat_exame e WHERE e.nu_cns_cidadao = a.nu_cns_cidadao AND e.co_exame ILIKE '%HIV%')`,
      [start, end]
    ),
  ]);
  return makeResult('IND_02', 'Gestantes testadas sífilis+HIV', 'Gestantes com exame de sífilis e HIV realizados',
    Number(num.rows[0]?.total || 0), Number(den.rows[0]?.total || 0), 60);
}

async function ind03(start: string, end: string, ine?: string): Promise<IndicatorResult> {
  const ineFilter = ine ? `AND nu_ine = '${ine.replace(/'/g, "''")}'` : '';
  const [den, num] = await Promise.all([
    esusQuery<any>(
      `SELECT COUNT(DISTINCT c.nu_cns) AS total FROM tb_cidadao c
       WHERE c.dt_nascimento > NOW() - INTERVAL '2 years' AND c.st_ativo = true`,
      []
    ),
    esusQuery<any>(
      `SELECT COUNT(*) AS total FROM (
         SELECT a.nu_cns_cidadao FROM tb_fat_atendimento_individual a
         JOIN tb_cidadao c ON c.nu_cns = a.nu_cns_cidadao
         WHERE c.dt_nascimento > NOW() - INTERVAL '2 years'
           AND a.co_tipo_atendimento = 'PUERICULTURA'
           AND a.dt_atendimento BETWEEN $1 AND $2 ${ineFilter}
         GROUP BY a.nu_cns_cidadao HAVING COUNT(*) >= 2
       ) sub`,
      [start, end]
    ),
  ]);
  return makeResult('IND_03', 'Puericultura 0-2 anos', 'Crianças de 0 a 2 anos com consulta de puericultura',
    Number(num.rows[0]?.total || 0), Number(den.rows[0]?.total || 0), 60);
}

async function ind04(start: string, end: string, ine?: string): Promise<IndicatorResult> {
  const ineFilter = ine ? `AND a.nu_ine = '${ine.replace(/'/g, "''")}'` : '';
  const [den, num] = await Promise.all([
    esusQuery<any>(
      `SELECT COUNT(DISTINCT nu_cns_cidadao) AS total FROM tb_fat_problema_condicao_ativa
       WHERE ds_cid10 ILIKE 'I1%'`,
      []
    ),
    esusQuery<any>(
      `SELECT COUNT(DISTINCT p.nu_cns_cidadao) AS total
       FROM tb_fat_problema_condicao_ativa p
       JOIN tb_fat_atendimento_individual a ON a.nu_cns_cidadao = p.nu_cns_cidadao
       WHERE p.ds_cid10 ILIKE 'I1%'
         AND a.dt_atendimento BETWEEN $1 AND $2 ${ineFilter}
         AND a.vl_pressao_arterial_sistolica IS NOT NULL`,
      [start, end]
    ),
  ]);
  return makeResult('IND_04', 'Hipertensos com PA registrada', 'Hipertensos com pressão arterial aferida no período',
    Number(num.rows[0]?.total || 0), Number(den.rows[0]?.total || 0), 60);
}

async function ind05(start: string, end: string, ine?: string): Promise<IndicatorResult> {
  const ineFilter = ine ? `AND a.nu_ine = '${ine.replace(/'/g, "''")}'` : '';
  const [den, num] = await Promise.all([
    esusQuery<any>(
      `SELECT COUNT(DISTINCT nu_cns_cidadao) AS total FROM tb_fat_problema_condicao_ativa
       WHERE ds_cid10 ILIKE 'E1%'`,
      []
    ),
    esusQuery<any>(
      `SELECT COUNT(DISTINCT p.nu_cns_cidadao) AS total
       FROM tb_fat_problema_condicao_ativa p
       JOIN tb_fat_atendimento_individual a ON a.nu_cns_cidadao = p.nu_cns_cidadao
       WHERE p.ds_cid10 ILIKE 'E1%'
         AND a.dt_atendimento BETWEEN $1 AND $2 ${ineFilter}
         AND a.vl_glicemia IS NOT NULL`,
      [start, end]
    ),
  ]);
  return makeResult('IND_05', 'Diabéticos com glicemia', 'Diabéticos com glicemia registrada no período',
    Number(num.rows[0]?.total || 0), Number(den.rows[0]?.total || 0), 60);
}

async function ind06(start: string, end: string): Promise<IndicatorResult> {
  const [den, num] = await Promise.all([
    esusQuery<any>(
      `SELECT COUNT(DISTINCT c.nu_cns) AS total FROM tb_cidadao c
       WHERE c.co_sexo = 'F' AND c.st_ativo = true
         AND EXTRACT(YEAR FROM AGE(c.dt_nascimento)) BETWEEN 25 AND 64`,
      []
    ),
    esusQuery<any>(
      `SELECT COUNT(DISTINCT nu_cns_cidadao) AS total FROM tb_fat_procedimento_realizado
       WHERE co_procedimento = '0203010043' AND dt_realizacao BETWEEN $1 AND $2`,
      [start, end]
    ),
  ]);
  return makeResult('IND_06', 'Citopatológico colo útero', 'Mulheres de 25 a 64 anos com exame citopatológico',
    Number(num.rows[0]?.total || 0), Number(den.rows[0]?.total || 0), 30);
}

async function ind07(start: string, end: string, ine?: string): Promise<IndicatorResult> {
  const ineFilter = ine ? `AND nu_ine = '${ine.replace(/'/g, "''")}'` : '';
  const [den, num] = await Promise.all([
    esusQuery<any>(`SELECT COUNT(DISTINCT nu_cns) AS total FROM tb_cidadao WHERE st_ativo = true`, []),
    esusQuery<any>(
      `SELECT COUNT(DISTINCT nu_cns_cidadao) AS total FROM tb_fat_atendimento_odontologico
       WHERE dt_atendimento BETWEEN $1 AND $2 ${ineFilter}`,
      [start, end]
    ),
  ]);
  return makeResult('IND_07', 'Atendimento odontológico', 'Usuários com atendimento odontológico no período',
    Number(num.rows[0]?.total || 0), Number(den.rows[0]?.total || 0), 15);
}

async function ind08(start: string, end: string, ine?: string): Promise<IndicatorResult> {
  const ineFilter = ine ? `AND a.nu_ine = '${ine.replace(/'/g, "''")}'` : '';
  const [den, num] = await Promise.all([
    esusQuery<any>(
      `SELECT COUNT(DISTINCT nu_cns_cidadao) AS total FROM tb_fat_problema_condicao_ativa
       WHERE ds_cid10 ILIKE 'F%'`,
      []
    ),
    esusQuery<any>(
      `SELECT COUNT(*) AS total FROM (
         SELECT p.nu_cns_cidadao FROM tb_fat_problema_condicao_ativa p
         JOIN tb_fat_atendimento_individual a ON a.nu_cns_cidadao = p.nu_cns_cidadao
         WHERE p.ds_cid10 ILIKE 'F%' AND a.dt_atendimento BETWEEN $1 AND $2 ${ineFilter}
         GROUP BY p.nu_cns_cidadao HAVING COUNT(*) >= 2
       ) sub`,
      [start, end]
    ),
  ]);
  return makeResult('IND_08', 'Saúde mental 2+ consultas', 'Usuários com CID-F com 2 ou mais consultas no período',
    Number(num.rows[0]?.total || 0), Number(den.rows[0]?.total || 0), 30);
}

export async function getAllIndicators(filters: IndicatorFilters): Promise<IndicatorResult[]> {
  const { startDate, endDate } = parsePeriod(filters.competencia);
  const ine = filters.ine;
  return Promise.all([
    ind01(startDate, endDate, ine),
    ind02(startDate, endDate, ine),
    ind03(startDate, endDate, ine),
    ind04(startDate, endDate, ine),
    ind05(startDate, endDate, ine),
    ind06(startDate, endDate),
    ind07(startDate, endDate, ine),
    ind08(startDate, endDate, ine),
  ]);
}
