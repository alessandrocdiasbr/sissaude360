import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createItem = async (req: Request, res: Response) => {
    try {
        const { nome, descricao, categoria, unidadeMedida, estoqueMinimo } = req.body;
        const item = await prisma.item.create({ 
            data: { 
                nome, 
                descricao, 
                categoria, 
                unidadeMedida, 
                estoqueMinimo: estoqueMinimo ? Number(estoqueMinimo) : 0 
            } 
        });
        res.status(201).json(item);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao cadastrar item.' });
    }
};

export const listItens = async (req: Request, res: Response) => {
    try {
        const itens = await prisma.item.findMany({
            include: { estoques: { include: { unidade: true } } },
            orderBy: { nome: 'asc' }
        });
        res.json(itens);
    } catch (error) {
        res.json([]);
    }
};

export const updateItem = async (req: Request, res: Response) => {
    try {
        const { nome, descricao, categoria, unidadeMedida, estoqueMinimo } = req.body;
        const item = await prisma.item.update({ 
            where: { id: req.params.id as string }, 
            data: { 
                nome, 
                descricao, 
                categoria, 
                unidadeMedida, 
                estoqueMinimo: estoqueMinimo !== undefined ? Number(estoqueMinimo) : undefined 
            } 
        });
        res.json(item);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar.' });
    }
};
