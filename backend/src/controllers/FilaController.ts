import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const RISCO_ORDEM: Record<string, number> = {
  VERMELHO: 6,
  LARANJA: 5,
  AMARELO: 4,
  VERDE: 3,
  AZUL: 2,
  BRANCO: 1,
};

function normalizeRisco(risco: string): string {
  const r = (risco || '').toUpperCase().trim();
  return RISCO_ORDEM[r] ? r : 'VERDE';
}

function normalizeTipo(tipo: string): 'NORMAL' | 'PRIORITARIO' {
  const t = (tipo || '').toUpperCase().trim();
  return t === 'PRIORITARIO' ? 'PRIORITARIO' : 'NORMAL';
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function endOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

export const gerarSenha = async (req: Request, res: Response) => {
  try {
    const { unidadeId, tipo, risco } = req.body as { unidadeId?: string; tipo?: string; risco?: string };
    if (!unidadeId) {
      return res.status(400).json({ erro: 'unidadeId é obrigatório.' });
    }

    const t = normalizeTipo(tipo ?? 'NORMAL');
    const r = normalizeRisco(risco ?? 'VERDE');
    const prefix = t === 'PRIORITARIO' ? 'P' : 'A';

    const now = new Date();
    const inicio = startOfDay(now);
    const fim = endOfDay(now);

    const countHoje = await prisma.ticket.count({
      where: {
        unidadeId,
        tipo: t,
        criadoEm: { gte: inicio, lte: fim },
      },
    });

    const nextNumber = countHoje + 1;
    const senha = `${prefix}${String(nextNumber).padStart(3, '0')}`;

    const ticket = await prisma.ticket.create({
      data: {
        unidadeId,
        tipo: t,
        risco: r,
        senha,
      },
      include: { unidade: true, sala: true },
    });

    res.status(201).json(ticket);
  } catch (error) {
    console.error('[FilaController.gerarSenha] erro:', error);
    res.status(500).json({ erro: 'Erro ao gerar senha.' });
  }
};

export const listarFila = async (req: Request, res: Response) => {
  try {
    const { unidadeId } = req.params as { unidadeId: string };
    if (!unidadeId) {
      return res.status(400).json({ erro: 'unidadeId é obrigatório.' });
    }

    const tickets = await prisma.ticket.findMany({
      where: {
        unidadeId,
        status: { in: ['AGUARDANDO', 'CHAMADO'] },
      },
      include: { sala: true },
    });

    tickets.sort((a, b) => {
      const ra = RISCO_ORDEM[String(a.risco).toUpperCase()] ?? 0;
      const rb = RISCO_ORDEM[String(b.risco).toUpperCase()] ?? 0;
      if (rb !== ra) return rb - ra; // maior risco primeiro
      return new Date(a.criadoEm).getTime() - new Date(b.criadoEm).getTime();
    });

    res.json({ dados: tickets });
  } catch (error) {
    console.error('[FilaController.listarFila] erro:', error);
    res.status(500).json({ erro: 'Erro ao listar fila.' });
  }
};

export const listarSalas = async (req: Request, res: Response) => {
  try {
    const { unidadeId } = req.params as { unidadeId: string };
    if (!unidadeId) {
      return res.status(400).json({ erro: 'unidadeId é obrigatório.' });
    }

    const salas = await prisma.sala.findMany({
      where: { unidadeId, ativo: true },
      orderBy: { numero: 'asc' },
      include: {
        tickets: {
          where: { status: { in: ['CHAMADO', 'EM_ATENDIMENTO'] } },
          orderBy: { chamadoEm: 'desc' },
          take: 1,
        },
      },
    });

    res.json({ dados: salas });
  } catch (error) {
    console.error('[FilaController.listarSalas] erro:', error);
    res.status(500).json({ erro: 'Erro ao listar salas.' });
  }
};

export const chamarProximo = async (req: Request, res: Response) => {
  try {
    const { salaId } = req.params as { salaId: string };
    if (!salaId) {
      return res.status(400).json({ erro: 'salaId é obrigatório.' });
    }

    const sala = await prisma.sala.findUnique({ where: { id: salaId } });
    if (!sala) {
      return res.status(404).json({ erro: 'Sala não encontrada.' });
    }

    const candidatos = await prisma.ticket.findMany({
      where: {
        unidadeId: sala.unidadeId,
        status: 'AGUARDANDO',
      },
    });

    if (candidatos.length === 0) {
      return res.status(404).json({ erro: 'Nenhum ticket aguardando.' });
    }

    candidatos.sort((a, b) => {
      const ra = RISCO_ORDEM[String(a.risco).toUpperCase()] ?? 0;
      const rb = RISCO_ORDEM[String(b.risco).toUpperCase()] ?? 0;
      if (rb !== ra) return rb - ra;
      return new Date(a.criadoEm).getTime() - new Date(b.criadoEm).getTime();
    });

    const proximo = candidatos[0];

    const ticket = await prisma.ticket.update({
      where: { id: proximo.id },
      data: {
        status: 'CHAMADO',
        salaId: sala.id,
        chamadoEm: new Date(),
      },
      include: { sala: true, unidade: true },
    });

    res.json(ticket);
  } catch (error) {
    console.error('[FilaController.chamarProximo] erro:', error);
    res.status(500).json({ erro: 'Erro ao chamar próximo.' });
  }
};

export const iniciarAtendimento = async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params as { ticketId: string };
    if (!ticketId) {
      return res.status(400).json({ erro: 'ticketId é obrigatório.' });
    }

    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data: { status: 'EM_ATENDIMENTO' },
      include: { sala: true, unidade: true },
    });

    res.json(ticket);
  } catch (error) {
    console.error('[FilaController.iniciarAtendimento] erro:', error);
    res.status(500).json({ erro: 'Erro ao iniciar atendimento.' });
  }
};

export const finalizarAtendimento = async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params as { ticketId: string };
    if (!ticketId) {
      return res.status(400).json({ erro: 'ticketId é obrigatório.' });
    }

    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data: { status: 'FINALIZADO', finalizadoEm: new Date() },
      include: { sala: true, unidade: true },
    });

    res.json(ticket);
  } catch (error) {
    console.error('[FilaController.finalizarAtendimento] erro:', error);
    res.status(500).json({ erro: 'Erro ao finalizar atendimento.' });
  }
};

export const estatisticasDia = async (req: Request, res: Response) => {
  try {
    const { unidadeId } = req.params as { unidadeId: string };
    if (!unidadeId) {
      return res.status(400).json({ erro: 'unidadeId é obrigatório.' });
    }

    const now = new Date();
    const inicio = startOfDay(now);
    const fim = endOfDay(now);

    const [aguardando, emAtendimento, finalizadosHoje, finalizadosTickets] = await Promise.all([
      prisma.ticket.count({
        where: { unidadeId, status: { in: ['AGUARDANDO', 'CHAMADO'] }, criadoEm: { gte: inicio, lte: fim } },
      }),
      prisma.ticket.count({
        where: { unidadeId, status: 'EM_ATENDIMENTO', criadoEm: { gte: inicio, lte: fim } },
      }),
      prisma.ticket.count({
        where: { unidadeId, status: 'FINALIZADO', finalizadoEm: { gte: inicio, lte: fim } },
      }),
      prisma.ticket.findMany({
        where: { unidadeId, status: 'FINALIZADO', finalizadoEm: { gte: inicio, lte: fim } },
        select: { criadoEm: true, finalizadoEm: true },
      }),
    ]);

    const tempos = finalizadosTickets
      .map((t) => {
        if (!t.finalizadoEm) return null;
        const diffMs = new Date(t.finalizadoEm).getTime() - new Date(t.criadoEm).getTime();
        return diffMs > 0 ? diffMs / 60000 : 0;
      })
      .filter((v): v is number => v !== null);

    const tempoMedioMin = tempos.length ? Math.round((tempos.reduce((a, b) => a + b, 0) / tempos.length) * 10) / 10 : 0;

    res.json({
      aguardando,
      emAtendimento,
      finalizados: finalizadosHoje,
      tempoMedioMin,
    });
  } catch (error) {
    console.error('[FilaController.estatisticasDia] erro:', error);
    res.status(500).json({ erro: 'Erro ao calcular estatísticas.' });
  }
};

