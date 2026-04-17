import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Garante que scripts/rotas que importam este módulo tenham env carregado.
// Em dev, o server.ts já chama dotenv.config(), mas em outros entrypoints isso pode não ocorrer.
dotenv.config({ override: true });

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-troque-em-producao';

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('FATAL: JWT_SECRET não definido nas variáveis de ambiente em produção.');
}

if (!process.env.JWT_SECRET) {
  console.warn('⚠️  Aviso: JWT_SECRET não definido. Usando segredo padrão de desenvolvimento.');
}

export const login = async (req: Request, res: Response) => {
  try {
    const { email, senha } = req.body;

    const usuario = await prisma.usuario.findUnique({
      where: { email }
    });

    if (!usuario) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);

    if (!senhaValida) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email }
    });
  } catch (error) {
    console.error('[AuthController.login] erro:', error);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
};
