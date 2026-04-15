import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Funções Auxiliares
 */

function getStatusPontuacao(pontuacao: number, esquema: string): string {
  if (esquema === 'MAIS_ACESSO') {
    if (pontuacao <= 10 || pontuacao > 70) return 'REGULAR';
    if (pontuacao <= 30) return 'SUFICIENTE';
    if (pontuacao <= 50) return 'BOM';
    return 'OTIMO';
  }
  // PADRAO
  if (pontuacao < 30) return 'REGULAR';
  if (pontuacao < 60) return 'SUFICIENTE';
  if (pontuacao < 80) return 'BOM';
  return 'OTIMO';
}

function getRegraPontuacao(esquema: string) {
  if (esquema === 'MAIS_ACESSO') return [
    { status: 'REGULAR',    label: 'Regular',    range: '≤10 ou >70' },
    { status: 'SUFICIENTE', label: 'Suficiente', range: '>10 e ≤30'  },
    { status: 'BOM',        label: 'Bom',        range: '>30 e ≤50'  },
    { status: 'OTIMO',      label: 'Ótimo',      range: '>50 e ≤70'  },
  ];
  return [
    { status: 'REGULAR',    label: 'Regular',    range: '<30'    },
    { status: 'SUFICIENTE', label: 'Suficiente', range: '30 a 60' },
    { status: 'BOM',        label: 'Bom',        range: '60 a 80' },
    { status: 'OTIMO',      label: 'Ótimo',      range: '>80'     },
  ];
}

function formatComp(mes: number, ano: number): string {
  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return `${meses[mes-1]}/${String(ano).slice(2)}`;
}

function isCompetenciaPreliminar(mes: number, ano: number): boolean {
  const agora = new Date();
  const currentMonth = agora.getMonth() + 1;
  const currentYear = agora.getFullYear();
  
  // Mês atual e anterior são preliminares
  if (ano > currentYear) return true;
  if (ano === currentYear && mes >= currentMonth - 1) return true;
  return false;
}

/**
 * Controller Methods
 */

export const getResultadoPorIndicador = async (req: Request, res: Response) => {
  try {
    const { indicadorId, mes, ano, tipos } = req.query;
    if (!indicadorId || !mes || !ano) {
      return res.status(400).json({ error: 'Parâmetros indicadorId, mes e ano são obrigatórios.' });
    }

    const m = parseInt(mes as string);
    const a = parseInt(ano as string);
    const tiposArray = tipos ? (tipos as string).split(',') : ['eSF'];

    const indicador = await prisma.indicador.findUnique({
      where: { id: indicadorId as string }
    });

    if (!indicador) return res.status(404).json({ error: 'Indicador não encontrado.' });

    const unidades = await prisma.unidade.findMany({
      where: { tipoEquipe: { in: tiposArray } },
      orderBy: { nome: 'asc' }
    });

    const producoes = await prisma.producao.findMany({
      where: {
        indicadorId: indicadorId as string,
        mes: m,
        ano: a,
        unidadeId: { in: unidades.map(u => u.id) }
      }
    });

    const equipes = unidades.map(u => {
      const prod = producoes.find(p => p.unidadeId === u.id);
      const pontuacao = prod ? prod.pontuacao : null;
      const status = pontuacao !== null ? getStatusPontuacao(pontuacao, indicador.esquemaPontuacao) : null;

      return {
        id: u.id,
        ubs: u.nome,
        equipe: u.nomeEquipe || 'Equipe não identificada',
        tipo: u.tipoEquipe,
        pontuacao,
        status
      };
    });

    // Ordenar por pontuação DESC (nulos por último)
    equipes.sort((a, b) => {
      if (a.pontuacao === null) return 1;
      if (b.pontuacao === null) return -1;
      return b.pontuacao - a.pontuacao;
    });

    res.json({
      indicador: {
        id: indicador.id,
        nome: indicador.nome,
        esquemaPontuacao: indicador.esquemaPontuacao,
        regras: getRegraPontuacao(indicador.esquemaPontuacao)
      },
      competencia: { mes: m, ano: a, label: formatComp(m, a) },
      isPreliminar: isCompetenciaPreliminar(m, a),
      equipes
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar resultados por indicador.' });
  }
};

export const getResultadoPorEquipe = async (req: Request, res: Response) => {
  try {
    const { unidadeId, mes, ano } = req.query;
    if (!unidadeId || !mes || !ano) {
      return res.status(400).json({ error: 'Parâmetros unidadeId, mes e ano são obrigatórios.' });
    }

    const m = parseInt(mes as string);
    const a = parseInt(ano as string);

    const unidade = await prisma.unidade.findUnique({
      where: { id: unidadeId as string }
    });

    if (!unidade) return res.status(404).json({ error: 'Unidade não encontrada.' });

    const indicadores = await prisma.indicador.findMany({
      orderBy: { nome: 'asc' }
    });

    const producoes = await prisma.producao.findMany({
      where: {
        unidadeId: unidadeId as string,
        mes: m,
        ano: a
      }
    });

    const resultados = indicadores.map(ind => {
      const prod = producoes.find(p => p.indicadorId === ind.id);
      const pontuacao = prod ? prod.pontuacao : null;
      const status = pontuacao !== null ? getStatusPontuacao(pontuacao, ind.esquemaPontuacao) : null;

      return {
        id: ind.id,
        nome: ind.nome,
        esquemaPontuacao: ind.esquemaPontuacao,
        regras: getRegraPontuacao(ind.esquemaPontuacao),
        pontuacao,
        status
      };
    });

    res.json({
      equipe: {
        id: unidade.id,
        ubs: unidade.nome,
        nomeEquipe: unidade.nomeEquipe || 'Equipe não identificada',
        tipoEquipe: unidade.tipoEquipe
      },
      competencia: { mes: m, ano: a, label: formatComp(m, a) },
      isPreliminar: isCompetenciaPreliminar(m, a),
      indicadores: resultados
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar resultados por equipe.' });
  }
};

export const getEvolucaoPorCompetencia = async (req: Request, res: Response) => {
  try {
    const { indicadorId, tipos, meses } = req.query;
    if (!indicadorId) return res.status(400).json({ error: 'indicadorId é obrigatório.' });

    const numMeses = meses ? parseInt(meses as string) : 8;
    const tiposArray = tipos ? (tipos as string).split(',') : ['eSF'];

    const indicador = await prisma.indicador.findUnique({
      where: { id: indicadorId as string }
    });

    if (!indicador) return res.status(404).json({ error: 'Indicador não encontrado.' });

    // Gerar competências (mês/ano)
    const comps: { mes: number; ano: number; label: string }[] = [];
    const agora = new Date();
    for (let i = numMeses - 1; i >= 0; i--) {
      const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      const a = d.getFullYear();
      comps.push({ mes: m, ano: a, label: formatComp(m, a) });
    }

    const unidades = await prisma.unidade.findMany({
      where: { tipoEquipe: { in: tiposArray } }
    });

    const series = await Promise.all(unidades.map(async u => {
      const dados = await Promise.all(comps.map(async c => {
        const prod = await prisma.producao.findUnique({
          where: {
            unidadeId_indicadorId_mes_ano: {
              unidadeId: u.id,
              indicadorId: indicadorId as string,
              mes: c.mes,
              ano: c.ano
            }
          }
        });
        return prod ? prod.pontuacao : null;
      }));

      return {
        unidadeId: u.id,
        equipe: u.nomeEquipe || 'Equipe s/ nome',
        ubs: u.nome,
        dados
      };
    }));

    res.json({
      indicador: {
        id: indicador.id,
        nome: indicador.nome,
        esquemaPontuacao: indicador.esquemaPontuacao
      },
      competencias: comps.map(c => c.label),
      series
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao carregar evolução.' });
  }
};
