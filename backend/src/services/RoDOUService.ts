import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const AIRFLOW_BASE = process.env.AIRFLOW_BASE_URL || 'http://rodou-webserver:8080';
const AIRFLOW_USER = process.env.RODOU_USER || 'admin';
const AIRFLOW_PASS = process.env.RODOU_PASSWORD || 'admin';
const DAG_CONF_DIR = process.env.RODOU_DAG_CONF_DIR || '/opt/app/rodou/dag_confs';

const airflowAuth = Buffer.from(`${AIRFLOW_USER}:${AIRFLOW_PASS}`).toString('base64');

const airflow = axios.create({
  baseURL: `${AIRFLOW_BASE}/api/v1`,
  headers: { Authorization: `Basic ${airflowAuth}`, 'Content-Type': 'application/json' },
  timeout: 10000,
});

// ─── Airflow API ────────────────────────────────────────────────────────────

export async function listarDags(): Promise<string[]> {
  const { data } = await airflow.get('/dags?limit=100');
  return (data.dags || []).map((d: any) => d.dag_id as string);
}

export async function acionarDag(dagId: string, conf: Record<string, unknown> = {}): Promise<string> {
  const { data } = await airflow.post(`/dags/${dagId}/dagRuns`, { conf });
  return data.dag_run_id as string;
}

export async function acionarTodasDags(): Promise<{ dagId: string; runId: string }[]> {
  const dags = await listarDags();
  const results: { dagId: string; runId: string }[] = [];
  for (const dagId of dags) {
    try {
      const runId = await acionarDag(dagId);
      results.push({ dagId, runId });
    } catch (err: any) {
      console.error(`[RoDOUService] Falha ao acionar DAG ${dagId}:`, err.message);
    }
  }
  return results;
}

export async function airflowDisponivel(): Promise<boolean> {
  try {
    await airflow.get('/health');
    return true;
  } catch {
    return false;
  }
}

// ─── Parser de webhook ───────────────────────────────────────────────────────

interface ArtigoExtraido {
  titulo: string;
  url?: string;
  resumo?: string;
  orgao?: string;
  secao?: string;
  dataPublicacao: Date;
  fonte: string;
}

const DATE_RE = /(\d{2})\/(\d{2})\/(\d{4})/;
const SECAO_RE = /SE[CÇ][AÃ]O\s+(\d+|EXTRA|SUPLEMENTAR)/i;

function parseDateBR(str: string): Date | null {
  const m = DATE_RE.exec(str);
  if (!m) return null;
  const d = new Date(`${m[3]}-${m[2]}-${m[1]}`);
  return isNaN(d.getTime()) ? null : d;
}

function extractSecao(text: string): string | undefined {
  const m = SECAO_RE.exec(text);
  return m ? `Seção ${m[1]}` : undefined;
}

export function parseWebhookHtml(html: string): ArtigoExtraido[] {
  const $ = cheerio.load(html);
  const artigos: ArtigoExtraido[] = [];

  // Ro-DOU emite um link por artigo apontando para in.gov.br
  $('a[href*="in.gov.br"], a[href*="www.in.gov.br"]').each((_, el) => {
    const $el = $(el);
    const titulo = $el.text().trim();
    if (!titulo || titulo.length < 5) return;

    const url = $el.attr('href') || undefined;

    // Texto do bloco pai (até 600 chars) para extrair metadados
    const $bloco = $el.closest('td, div, p').parent();
    const blocoText = $bloco.text();

    // Data — procura no bloco; fallback = hoje
    const dataParsed = parseDateBR(blocoText) || new Date();

    // Seção
    const secao = extractSecao(blocoText);

    // Órgão — primeira linha de texto antes do link que não é data/seção
    let orgao: string | undefined;
    $bloco.find('b, strong').each((_, b) => {
      const t = $(b).text().trim();
      if (t && !DATE_RE.test(t) && !SECAO_RE.test(t) && t !== titulo) {
        orgao = t.substring(0, 150);
        return false; // break
      }
    });

    // Resumo — texto de <p> próximo que não é o título
    let resumo: string | undefined;
    $bloco.find('p').each((_, p) => {
      const t = $(p).text().trim().replace(/\s+/g, ' ');
      if (t && t !== titulo && t.length > 20) {
        resumo = t.substring(0, 600);
        return false;
      }
    });

    artigos.push({
      titulo,
      url,
      resumo,
      orgao,
      secao,
      dataPublicacao: dataParsed,
      fonte: 'DOU',
    });
  });

  return artigos;
}

// ─── Salvar artigos no banco ─────────────────────────────────────────────────

export async function salvarArtigosWebhook(artigos: ArtigoExtraido[]): Promise<number> {
  let salvos = 0;
  for (const artigo of artigos) {
    try {
      const existe = await prisma.diarioOficialArtigo.findFirst({
        where: { titulo: artigo.titulo, fonte: artigo.fonte, dataPublicacao: artigo.dataPublicacao },
      });
      if (!existe) {
        await prisma.diarioOficialArtigo.create({ data: artigo });
        salvos++;
      }
    } catch (err: any) {
      console.error('[RoDOUService] Erro ao salvar artigo:', err.message);
    }
  }
  return salvos;
}

// ─── Gerador de YAML a partir de preferências ────────────────────────────────

export async function sincronizarYamls(): Promise<void> {
  if (!fs.existsSync(DAG_CONF_DIR)) {
    console.warn(`[RoDOUService] Diretório dag_confs não encontrado: ${DAG_CONF_DIR}`);
    return;
  }

  const preferencias = await prisma.diarioOficialPreferencia.findMany({ where: { ativo: true } });

  for (const pref of preferencias) {
    let termos: string[] = [];
    try { termos = JSON.parse(pref.termos); } catch {
      termos = pref.termos.split(',').map(t => t.trim()).filter(Boolean);
    }
    const fontes: string[] = pref.fontes.split(',').map(f => f.trim()).filter(Boolean);

    // Mapeia fontes do sistema para sources do Ro-DOU
    const sources = fontes
      .map(f => f === 'DOMG' || f === 'ALMG' ? 'QD' : f)
      .filter((v, i, a) => a.indexOf(v) === i);

    const dagId = `pref_${pref.id.replace(/-/g, '_')}`;
    const config = {
      dag: {
        id: dagId,
        description: pref.titulo,
        schedule: '0 8 * * MON-FRI',
        search: {
          sources,
          terms: termos,
          ignore_signature_match: true,
          full_text: false,
        },
        report: {
          notification: [`json://api:3001/api/diario/webhook-rodou`],
          skip_null: true,
        },
      },
    };

    const filePath = path.join(DAG_CONF_DIR, `${dagId}.yml`);
    fs.writeFileSync(filePath, yaml.dump(config), 'utf-8');
    console.log(`[RoDOUService] YAML gerado: ${filePath}`);
  }

  // Remove YAMLs de preferências deletadas (mantém saude_sus.yml)
  const arquivosAtivos = new Set(
    preferencias.map(p => `pref_${p.id.replace(/-/g, '_')}.yml`),
  );
  const arquivos = fs.readdirSync(DAG_CONF_DIR).filter(f => f.startsWith('pref_') && f.endsWith('.yml'));
  for (const arquivo of arquivos) {
    if (!arquivosAtivos.has(arquivo)) {
      fs.unlinkSync(path.join(DAG_CONF_DIR, arquivo));
      console.log(`[RoDOUService] YAML removido: ${arquivo}`);
    }
  }
}

export default { listarDags, acionarDag, acionarTodasDags, airflowDisponivel, parseWebhookHtml, salvarArtigosWebhook, sincronizarYamls };
