import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

export const listUsers = async (_req: Request, res: Response) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: { id: true, nome: true, email: true },
      orderBy: { nome: 'asc' },
    });
    res.json(usuarios);
  } catch (err) {
    console.error('[UserController.listUsers]', err);
    res.status(500).json({ error: 'Erro ao listar usuários.' });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { nome, email, senha } = req.body;

    if (!nome?.trim()) return res.status(400).json({ error: 'Nome é obrigatório.' });
    if (!email?.trim()) return res.status(400).json({ error: 'E-mail é obrigatório.' });
    if (!senha || senha.length < 6) return res.status(400).json({ error: 'Senha deve ter ao menos 6 caracteres.' });

    const existe = await prisma.usuario.findUnique({ where: { email } });
    if (existe) return res.status(409).json({ error: 'E-mail já cadastrado.' });

    const hash = await bcrypt.hash(senha, SALT_ROUNDS);
    const usuario = await prisma.usuario.create({
      data: { nome: nome.trim(), email: email.trim().toLowerCase(), senha: hash },
      select: { id: true, nome: true, email: true },
    });

    res.status(201).json(usuario);
  } catch (err) {
    console.error('[UserController.createUser]', err);
    res.status(500).json({ error: 'Erro ao criar usuário.' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nome, email } = req.body;

    if (!nome?.trim()) return res.status(400).json({ error: 'Nome é obrigatório.' });
    if (!email?.trim()) return res.status(400).json({ error: 'E-mail é obrigatório.' });

    const existe = await prisma.usuario.findFirst({
      where: { email: email.trim().toLowerCase(), NOT: { id } },
    });
    if (existe) return res.status(409).json({ error: 'E-mail já em uso por outro usuário.' });

    const usuario = await prisma.usuario.update({
      where: { id },
      data: { nome: nome.trim(), email: email.trim().toLowerCase() },
      select: { id: true, nome: true, email: true },
    });

    res.json(usuario);
  } catch (err: any) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Usuário não encontrado.' });
    console.error('[UserController.updateUser]', err);
    res.status(500).json({ error: 'Erro ao atualizar usuário.' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = (req as any).user;

    if (currentUser?.id === id) {
      return res.status(400).json({ error: 'Você não pode excluir sua própria conta.' });
    }

    await prisma.usuario.delete({ where: { id } });
    res.json({ mensagem: 'Usuário excluído com sucesso.' });
  } catch (err: any) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Usuário não encontrado.' });
    console.error('[UserController.deleteUser]', err);
    res.status(500).json({ error: 'Erro ao excluir usuário.' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { novaSenha } = req.body;

    if (!novaSenha || novaSenha.length < 6) {
      return res.status(400).json({ error: 'Nova senha deve ter ao menos 6 caracteres.' });
    }

    const hash = await bcrypt.hash(novaSenha, SALT_ROUNDS);
    await prisma.usuario.update({
      where: { id },
      data: { senha: hash },
    });

    res.json({ mensagem: 'Senha redefinida com sucesso.' });
  } catch (err: any) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Usuário não encontrado.' });
    console.error('[UserController.resetPassword]', err);
    res.status(500).json({ error: 'Erro ao redefinir senha.' });
  }
};
