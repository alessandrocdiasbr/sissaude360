const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

pool.on('connect', () => {
    console.log('PostgreSQL: Pool de conexão estabelecido com sucesso.');
});

pool.on('error', (err) => {
    console.error('PostgreSQL: Erro inesperado no pool de conexão', err);
    process.exit(-1);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool
};
