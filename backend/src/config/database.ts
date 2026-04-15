import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

pool.on('connect', () => {
    console.log('PostgreSQL: Pool de conexão estabelecido com sucesso.');
});

pool.on('error', (err: Error) => {
    console.error('PostgreSQL: Erro inesperado no pool de conexão', err);
    process.exit(-1);
});

export default {
    query: (text: string, params?: any[]) => pool.query(text, params),
    pool
};
