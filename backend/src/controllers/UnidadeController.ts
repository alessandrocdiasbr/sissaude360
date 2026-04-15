import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createUnidade = async (req: Request, res: Response) => {
    try {
        const { nome, tipo, endereco, telefone } = req.body;
        if (!nome) return res.status(400).json({ error: 'Nome é obrigatório.' });

        // Tentativa de criar com todos os campos
        const unidade = await prisma.unidade.create({
            data: {
                nome: String(nome),
                tipo: String(tipo || 'UBS'),
                endereco: endereco ? String(endereco) : null,
                telefone: telefone ? String(telefone) : null
            }
        });
        res.status(201).json(unidade);
    } catch (error: any) {
        // Fallback: Se colunas novas não existirem, tenta salvar apenas o nome
        try {
            const unidade = await prisma.unidade.create({ data: { nome: String(req.body.nome) } });
            return res.status(201).json(unidade);
        } catch (fallbackError) {
            res.status(500).json({ error: 'Erro ao criar unidade.' });
        }
    }
};

export const listUnidades = async (req: Request, res: Response) => {
    try {
        // Tentativa de buscar todos os campos
        const unidades = await prisma.unidade.findMany({ orderBy: { nome: 'asc' } });
        res.json(unidades);
    } catch (error) {
        try {
            // Fallback: Busca apenas o que é garantido existir no banco legado
            const unidades = await prisma.unidade.findMany({
                select: { id: true, nome: true },
                orderBy: { nome: 'asc' }
            });
            res.json(unidades);
        } catch (fallbackError) {
            res.status(500).json({ error: 'Erro ao listar unidades.' });
        }
    }
};

export const updateUnidade = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const { nome, tipo, endereco, telefone } = req.body;
        const unidade = await prisma.unidade.update({
            where: { id },
            data: { nome, tipo, endereco, telefone }
        });
        res.json(unidade);
    } catch (error) {
        try {
            const id = req.params.id as string;
            const unidade = await prisma.unidade.update({
                where: { id },
                data: { nome: req.body.nome }
            });
            res.json(unidade);
        } catch (fallbackError) {
            res.status(500).json({ error: 'Erro ao atualizar unidade.' });
        }
    }
};

export const deleteUnidade = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        await prisma.unidade.delete({ where: { id } });
        res.json({ message: 'Excluído.' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao excluir.' });
    }
};
