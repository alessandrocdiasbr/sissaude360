import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getEstoque = async (req: Request, res: Response) => {
    try {
        const estoque = await prisma.estoque.findMany({
            include: { item: true, unidade: true }
        });
        res.json(estoque);
    } catch (error) {
        res.json([]);
    }
};

export const movimentarEstoque = async (req: Request, res: Response) => {
    try {
        const { itemId, unidadeId, tipo, quantidade } = req.body;
        const realUnidadeId = unidadeId === 'central' ? null : unidadeId;
        const fator = (tipo === 'ENTRADA') ? 1 : -1;

        await prisma.movimentacao.create({
            data: { itemId, unidadeId: realUnidadeId, tipo, quantidade: Number(quantidade) }
        });

        const estoqueAtual = await prisma.estoque.findUnique({
            where: { itemId_unidadeId: { itemId, unidadeId: realUnidadeId } }
        });

        if (estoqueAtual) {
            await prisma.estoque.update({
                where: { id: estoqueAtual.id },
                data: { quantidade: { increment: Number(quantidade) * fator } }
            });
        } else {
            await prisma.estoque.create({
                data: { itemId, unidadeId: realUnidadeId, quantidade: Number(quantidade) * fator }
            });
        }
        res.json({ message: 'OK' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao movimentar.' });
    }
};

export const getItensCriticos = async (req: Request, res: Response) => {
    try {
        // O Prisma não suporta comparar campos no 'where' diretamente facilmente sem referenciar o mesmo modelo de forma complexa.
        // Vamos buscar todos e filtrar no código para garantir precisão.
        const todos = await prisma.estoque.findMany({
            include: { item: true, unidade: true }
        });
        
        const filtrados = todos.filter(e => e.item.estoqueMinimo > 0 && e.quantidade <= e.item.estoqueMinimo);
        
        res.json(filtrados);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar itens críticos.' });
    }
};

export const getMovimentacoesMes = async (req: Request, res: Response) => {
    try {
        const agora = new Date();
        const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
        
        const total = await prisma.movimentacao.count({
            where: {
                data: {
                    gte: inicioMes
                }
            }
        });
        
        res.json({ total });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar estatísticas.' });
    }
};
