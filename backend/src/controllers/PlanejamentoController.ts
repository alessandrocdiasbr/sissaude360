import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// --- Ações de Saúde ---

export const listarAcoes = async (req: Request, res: Response) => {
  try {
    const { categoria, status } = req.query;

    const acoes = await prisma.acaoSaude.findMany({
      where: {
        ...(categoria && { categoria: String(categoria) }),
        ...(status && { status: String(status) }),
      },
      include: {
        unidade: {
          select: {
            nome: true,
          },
        },
      },
      orderBy: {
        criadoEm: 'desc',
      },
    });

    res.json(acoes);
  } catch (error) {
    console.error('Erro ao listar ações:', error);
    res.status(500).json({ error: 'Erro ao listar ações' });
  }
};

export const criarAcao = async (req: Request, res: Response) => {
  try {
    const {
      titulo,
      descricao,
      categoria,
      prioridade,
      responsavel,
      prazo,
      valorEstimado,
      unidadeId,
    } = req.body;

    const acao = await prisma.acaoSaude.create({
      data: {
        titulo,
        descricao,
        categoria,
        prioridade,
        responsavel,
        prazo: prazo ? new Date(prazo) : null,
        valorEstimado: valorEstimado ? Number(valorEstimado) : null,
        unidadeId,
      },
      include: {
        unidade: {
          select: {
            nome: true,
          },
        },
      },
    });

    res.status(201).json(acao);
  } catch (error) {
    console.error('Erro ao criar ação:', error);
    res.status(500).json({ error: 'Erro ao criar ação' });
  }
};

export const atualizarStatus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    const acao = await prisma.acaoSaude.update({
      where: { id },
      data: { status },
    });

    res.json(acao);
  } catch (error) {
    console.error('Erro ao atualizar status da ação:', error);
    res.status(500).json({ error: 'Erro ao atualizar status da ação' });
  }
};

export const atualizarAcao = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const {
      titulo,
      descricao,
      categoria,
      prioridade,
      responsavel,
      prazo,
      valorEstimado,
      unidadeId,
      status,
    } = req.body;

    const acao = await prisma.acaoSaude.update({
      where: { id },
      data: {
        titulo,
        descricao,
        categoria,
        prioridade,
        responsavel,
        prazo: prazo ? new Date(prazo) : null,
        valorEstimado: valorEstimado ? Number(valorEstimado) : null,
        unidadeId,
        status,
      },
    });

    res.json(acao);
  } catch (error) {
    console.error('Erro ao atualizar ação:', error);
    res.status(500).json({ error: 'Erro ao atualizar ação' });
  }
};

export const deletarAcao = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    await prisma.acaoSaude.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar ação:', error);
    res.status(500).json({ error: 'Erro ao deletar ação' });
  }
};

// --- Metas Anuais ---

export const listarMetas = async (req: Request, res: Response) => {
  try {
    const { ano } = req.query;

    const metas = await prisma.metaAnual.findMany({
      where: {
        ...(ano && { ano: Number(ano) }),
      },
      orderBy: {
        eixo: 'asc',
      },
    });

    // O agrupamento por eixo pode ser feito aqui ou no frontend.
    // O usuário pediu "lista agrupada por eixo" na instrução do controller,
    // então vou agrupar aqui para seguir a tarefa à risca.

    const agrupadas = metas.reduce((acc: any, meta) => {
      if (!acc[meta.eixo]) {
        acc[meta.eixo] = [];
      }
      acc[meta.eixo].push(meta);
      return acc;
    }, {});

    res.json(agrupadas);
  } catch (error) {
    console.error('Erro ao listar metas:', error);
    res.status(500).json({ error: 'Erro ao listar metas' });
  }
};

export const criarMeta = async (req: Request, res: Response) => {
  try {
    const { nome, eixo, ano, valorMeta, unidade } = req.body;

    const meta = await prisma.metaAnual.create({
      data: {
        nome,
        eixo,
        ano: Number(ano),
        valorMeta: Number(valorMeta),
        unidade: unidade || '%',
      },
    });

    res.status(201).json(meta);
  } catch (error) {
    console.error('Erro ao criar meta:', error);
    res.status(500).json({ error: 'Erro ao criar meta' });
  }
};

export const atualizarProgresso = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { valorAtual } = req.body;

    const meta = await prisma.metaAnual.update({
      where: { id },
      data: { valorAtual: Number(valorAtual) },
    });

    res.json(meta);
  } catch (error) {
    console.error('Erro ao atualizar progresso da meta:', error);
    res.status(500).json({ error: 'Erro ao atualizar progresso da meta' });
  }
};

export const deletarMeta = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    await prisma.metaAnual.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar meta:', error);
    res.status(500).json({ error: 'Erro ao deletar meta' });
  }
};
