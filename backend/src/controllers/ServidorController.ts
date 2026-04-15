import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createServidor = async (req: Request, res: Response) => {
    try {
        const { nome, telefone, email, funcao, formaContratacao, unidadeId } = req.body;
        const servidor = await prisma.servidor.create({
            data: { nome, telefone, email, funcao, formaContratacao, unidadeId }
        });
        res.status(201).json(servidor);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao cadastrar servidor (verifique se a tabela existe).' });
    }
};

export const listServidores = async (req: Request, res: Response) => {
    try {
        const { unidadeId } = req.query;
        const where: any = {};
        if (unidadeId) where.unidadeId = String(unidadeId);

        const servidores = await prisma.servidor.findMany({
            where,
            include: { unidade: true },
            orderBy: { nome: 'asc' }
        });
        res.json(servidores);
    } catch (error) {
        // Fallback: Retorna array vazio se a tabela não existir
        res.json([]);
    }
};

export const updateServidor = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const servidor = await prisma.servidor.update({
            where: { id },
            data: req.body
        });
        res.json(servidor);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar.' });
    }
};

export const deleteServidor = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        await prisma.servidor.delete({ where: { id } });
        res.json({ message: 'Removido.' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao remover.' });
    }
};
