import axios from 'axios';
import * as cheerio from 'cheerio';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ArtigoInput {
  titulo: string;
  corpo?: string;
  resumo?: string;
  fonte: string;
  secao?: string;
  orgao?: string;
  url?: string;
  dataPublicacao: Date;
}

interface DouItem {
  pubName: string;
  urlTitle: string;
  numberPage: string;
  title: string;
  pubDate: string;
  editionNumber: string;
  content: string;
  artType: string;
  hierarchyStr: string;
  hierarchyList: string[];
}

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'pt-BR,pt;q=0.9',
  'Connection': 'keep-alive',
};

const parseDateBR = (str: string): Date => {
  const match = str.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (match) return new Date(`${match[3]}-${match[2]}-${match[1]}`);
  return new Date();
};

const today = (): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const stripHtml = (str: string): string =>
  str.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

const findJsonArrayEnd = (html: string, start: number): number => {
  let depth = 0;
  for (let i = start; i < html.length; i++) {
    if (html[i] === '[' || html[i] === '{') depth++;
    if (html[i] === ']' || html[i] === '}') depth--;
    if (depth === 0) return i;
  }
  return -1;
};

/** Extrai o array JSON de artigos embedado no HTML da página DOU */
const extractDouList = (html: string): DouItem[] => {
  // Strategy 1: find the Liferay/DOU function call that receives the list
  for (const marker of ['createHierarchyPathsBusca(', 'BUSCA_RESULT=(', 'RESULTS=(']) {
    const funcIdx = html.indexOf(marker);
    if (funcIdx === -1) continue;
    const arrStart = html.indexOf('[', funcIdx + marker.length);
    if (arrStart === -1 || arrStart - funcIdx > 50) continue;
    const end = findJsonArrayEnd(html, arrStart);
    if (end === -1) continue;
    try { return JSON.parse(html.substring(arrStart, end + 1)); } catch { /* try next */ }
  }

  // Strategy 2: scan for the outermost JSON array that contains hierarchyList key
  let searchFrom = 0;
  while (true) {
    const keyIdx = html.indexOf('"hierarchyList"', searchFrom);
    if (keyIdx === -1) break;
    // scan backward up to 20000 chars to find outermost [
    let arrStart = -1;
    for (let i = keyIdx; i > Math.max(0, keyIdx - 20000); i--) {
      if (html[i] === '[') { arrStart = i; }
      // stop at likely assignment/call boundaries
      if (arrStart !== -1 && (html[i] === '(' || html[i] === '=' || html[i] === ';')) break;
    }
    if (arrStart === -1) { searchFrom = keyIdx + 1; continue; }
    const end = findJsonArrayEnd(html, arrStart);
    if (end === -1) { searchFrom = keyIdx + 1; continue; }
    try {
      const parsed = JSON.parse(html.substring(arrStart, end + 1));
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].hierarchyList !== undefined) {
        return parsed;
      }
    } catch { /* try next occurrence */ }
    searchFrom = keyIdx + 1;
  }

  return [];
};

/** DOU — Diário Oficial da União */
export async function fetchDOU(termos: string[]): Promise<ArtigoInput[]> {
  const artigos: ArtigoInput[] = [];
  try {
    const query = encodeURIComponent(termos.join(' '));
    const url = `https://www.in.gov.br/consulta/-/buscar/dou?q=${query}&s=todos&exactDate=semana&sortType=0&delta=50&p=1`;

    const response = await axios.get(url, { headers: HEADERS, timeout: 20000 });
    const items = extractDouList(response.data);

    const SECTION_MAP: Record<string, string> = {
      'DO1': 'Seção 1', 'DO2': 'Seção 2', 'DO3': 'Seção 3',
      'DO1E': 'Seção 1 - Extra', 'DO2E': 'Seção 2 - Extra', 'DO3E': 'Seção 3 - Extra',
    };

    for (const item of items) {
      const titulo = item.title?.split('_')[0]?.trim();
      if (!titulo || titulo.length < 5) continue;

      const secaoKey = item.pubName?.split('_')[0] || '';
      const secao = SECTION_MAP[secaoKey] || secaoKey || undefined;
      const orgao = item.hierarchyList?.[0] || item.hierarchyStr?.split('/')?.[0] || undefined;
      const resumo = stripHtml(item.content || '').substring(0, 600) || undefined;
      const urlTitle = item.title?.split('_')[1] || item.urlTitle;
      const artUrl = urlTitle ? `https://www.in.gov.br/web/dou/-/${urlTitle}` : undefined;
      const dataPub = item.pubDate ? parseDateBR(item.pubDate) : today();

      artigos.push({
        titulo,
        resumo,
        fonte: 'DOU',
        secao,
        orgao,
        url: artUrl,
        dataPublicacao: dataPub,
      });
    }
  } catch (err: any) {
    console.error(`[DiarioOficialService] Erro ao buscar DOU:`, err.message);
  }
  return artigos;
}

/** DOMG — Jornal Minas Gerais (via IOF DSpace público) */
export async function fetchDOMG(_termos: string[]): Promise<ArtigoInput[]> {
  const artigos: ArtigoInput[] = [];
  try {
    // O novo site (jornalminasgerais.mg.gov.br) requer autenticação JWT.
    // Usamos o repositório DSpace público (jornal.iof.mg.gov.br) com os mais recentes.
    const response = await axios.get(
      'https://jornal.iof.mg.gov.br/xmlui/handle/123456789/1',
      { headers: HEADERS, timeout: 20000 },
    );
    const $ = cheerio.load(response.data);

    const dateRe = /(\d{2})\/(\d{2})\/(\d{4})/;
    $('a[href*="/handle/"]').each((_, el) => {
      const titulo = $(el).text().trim();
      // Only keep entries that look like journal editions (contain a date)
      const dateMatch = dateRe.exec(titulo);
      if (!dateMatch) return;
      const href = $(el).attr('href') || '';
      const artUrl = href.startsWith('http')
        ? href
        : `https://jornal.iof.mg.gov.br${href}`;
      const dataPub = new Date(`${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`);
      artigos.push({
        titulo,
        fonte: 'DOMG',
        url: artUrl,
        dataPublicacao: dataPub,
        orgao: 'Imprensa Oficial de Minas Gerais',
        secao: 'Diário Oficial',
      });
    });
  } catch (err: any) {
    console.error(`[DiarioOficialService] Erro ao buscar DOMG:`, err.message);
  }
  return artigos;
}

/** ALMG — Assembleia Legislativa de Minas Gerais (Diário do Legislativo) */
export async function fetchALMG(_termos: string[]): Promise<ArtigoInput[]> {
  const artigos: ArtigoInput[] = [];
  try {
    // A pesquisa por palavra-chave no site da ALMG não tem API pública acessível.
    // Listamos as edições recentes do Diário do Legislativo como artigos.
    const response = await axios.get(
      'https://www.almg.gov.br/transparencia/diario-do-legislativo/',
      { headers: HEADERS, timeout: 20000 },
    );
    const $ = cheerio.load(response.data);

    $('a[href*="diariolegislativo.almg.gov.br"]').each((_, el) => {
      const href = $(el).attr('href') || '';
      const match = href.match(/\/(\d{4})\/L(\d{4})(\d{2})(\d{2})(E?)\.pdf$/i);
      if (!match) return;

      const [, , year, month, day, extra] = match;
      const datePub = new Date(`${year}-${month}-${day}`);
      const extra_label = extra ? ' (Extra)' : '';
      const titulo = `Diário do Legislativo${extra_label} - ${day}/${month}/${year}`;

      artigos.push({
        titulo,
        fonte: 'ALMG',
        url: href,
        dataPublicacao: datePub,
        orgao: 'Assembleia Legislativa de Minas Gerais',
        secao: 'Diário do Legislativo',
      });
    });

    if (artigos.length === 0) {
      const dataHoje = today();
      $('a[href*="/legislacao/"], a[href*="/normas-juridicas/"]').each((_, el) => {
        const titulo = $(el).text().trim();
        if (!titulo || titulo.length < 5) return;
        const href = $(el).attr('href') || '';
        const artUrl = href.startsWith('http') ? href : `https://www.almg.gov.br${href}`;
        artigos.push({ titulo, fonte: 'ALMG', url: artUrl, dataPublicacao: dataHoje });
      });
    }
  } catch (err: any) {
    console.error(`[DiarioOficialService] Erro ao buscar ALMG:`, err.message);
  }
  return artigos;
}

/** Job principal: apaga não salvos antigos e coleta das fontes ativas */
export async function executarColeta(): Promise<void> {
  const preferencias = await prisma.diarioOficialPreferencia.findMany({ where: { ativo: true } });

  // Apaga artigos não salvos de dias anteriores
  const dataHoje = today();
  await prisma.diarioOficialArtigo.deleteMany({
    where: { salvo: false, dataPublicacao: { lt: dataHoje } },
  });

  if (preferencias.length === 0) {
    console.log('[DiarioOficialService] Nenhuma preferência ativa encontrada.');
    return;
  }

  for (const pref of preferencias) {
    let termos: string[] = [];
    try {
      termos = JSON.parse(pref.termos);
    } catch {
      termos = pref.termos.split(',').map(t => t.trim()).filter(Boolean);
    }

    const fontes = pref.fontes.split(',').map(f => f.trim()).filter(Boolean);

    for (const fonte of fontes) {
      let artigos: ArtigoInput[] = [];
      try {
        if (fonte === 'DOU') artigos = await fetchDOU(termos);
        else if (fonte === 'DOMG') artigos = await fetchDOMG(termos);
        else if (fonte === 'ALMG') artigos = await fetchALMG(termos);
        else continue;
      } catch (err: any) {
        console.error(`[DiarioOficialService] Falha ao buscar ${fonte}:`, err.message);
        continue;
      }

      for (const artigo of artigos) {
        try {
          const exists = await prisma.diarioOficialArtigo.findFirst({
            where: { titulo: artigo.titulo, fonte: artigo.fonte, dataPublicacao: artigo.dataPublicacao },
          });
          if (!exists) await prisma.diarioOficialArtigo.create({ data: artigo });
        } catch (dbErr: any) {
          console.error('[DiarioOficialService] Erro ao salvar artigo:', dbErr.message);
        }
      }

      console.log(`[DiarioOficialService] ${fonte}: ${artigos.length} artigos coletados para "${pref.titulo}"`);
    }
  }
}

export default { fetchDOU, fetchDOMG, fetchALMG, executarColeta };
