import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET) {
    console.error('FATAL: JWT_SECRET não definido nas variáveis de ambiente.');
    process.exit(1);
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token de acesso não fornecido' });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido ou expirado' });
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (req as any).user = user;
        next();
    });
};
