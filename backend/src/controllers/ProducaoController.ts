import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getDashboardData = async (req: Request, res: Response) => {
  try {
    const { unidadeId, indicadorId } = req.query;

    const query: any = {};
    if (unidadeId) query.unidadeId = String(unidadeId);
    if (indicadorId) query.indicadorId = String(indicadorId);

    const producoes = await prisma.producao.findMany({
      where: query,
      include: {
        unidade: true,
        indicador: true,
      },
      orderBy: [
        { ano: 'asc' },
        { mes: 'asc' }
      ]
    });

    // Lógica de agrupamento por ano para comparação
    const data2025 = producoes.filter(p => p.ano === 2025);
    const data2026 = producoes.filter(p => p.ano === 2026);

    // Se estivermos filtrando por indicador único, pegamos o tipo dele
    let isAbsoluto = false;
    if (indicadorId) {
       const ind = await prisma.indicador.findUnique({ where: { id: String(indicadorId) } });
       isAbsoluto = ind?.tipo === 'ABSOLUTO';
    }

    const comparativo = data2025.map(p25 => {
      const p26 = data2026.find(p => p.mes === p25.mes && p.unidadeId === p25.unidadeId && p.indicadorId === p25.indicadorId);
      
      const val25 = p25.pontuacao;
      const val26 = p26 ? p26.pontuacao : null;

      let evolucao = null;
      if (val26 !== null && val25 > 0) {
        evolucao = ((val26 - val25) / val25) * 100;
      } else if (val26 !== null && val25 === 0 && val26 > 0) {
        evolucao = 100; 
      }

      return {
        mes: p25.mes,
        indicador: p25.indicador.nome,
        indicadorTipo: p25.indicador.tipo,
        unidade: p25.unidade.nome,
        valor2025: val25,
        valor2026: val26,
        evolucao: evolucao !== null ? evolucao.toFixed(2) : '0',
        status2025: getStatus(val25, p25.indicador),
        status2026: p26 ? getStatus(val26!, p25.indicador) : 'Sem Dados'
      };
    });

    res.json({
      resumo: comparativo,
      raw: { data2025, data2026 }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar dados do dashboard' });
  }
};

const getStatus = (score: number, indicador: any) => {
  if (score >= indicador.metaOtimo) return 'Ótimo';
  if (score >= indicador.metaBom) return 'Bom';
  if (score >= indicador.metaRegular) return 'Suficiente';
  return 'Regular';
};

export const createProducao = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    
    // Buscar indicador para saber o tipo
    const indicador = await prisma.indicador.findUnique({
      where: { id: data.indicadorId }
    });

    if (!indicador) throw new Error('Indicador não encontrado');

    const pontuacao = indicador.tipo === 'ABSOLUTO' 
      ? data.numerador 
      : (data.numerador / (data.denominador || 1)) * 100;

    const producao = await prisma.producao.create({
      data: {
        ...data,
        pontuacao: pontuacao
      }
    });
    res.status(201).json(producao);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao criar registro de produção' });
  }
};

export const listUnidades = async (req: Request, res: Response) => {
  const unidades = await prisma.unidade.findMany();
  res.json(unidades);
};

export const listIndicadores = async (req: Request, res: Response) => {
  const indicadores = await prisma.indicador.findMany();
  res.json(indicadores);
};
