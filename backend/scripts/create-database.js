/**
 * Conecta ao banco padrão "postgres" e cria o banco cujo nome está em DATABASE_URL,
 * se ainda não existir.
 */
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

function parseDatabaseUrl(databaseUrl) {
  try {
    const u = new URL(databaseUrl.replace(/^postgresql:\/\//i, 'http://'));
    const dbName = u.pathname.replace(/^\//, '').split('?')[0];
    if (!dbName) {
      throw new Error('nome do banco ausente no path da URL');
    }
    return {
      host: u.hostname,
      port: u.port ? Number(u.port) : 5432,
      user: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      dbName,
    };
  } catch (e) {
    throw new Error(`DATABASE_URL inválida: ${e.message}`);
  }
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('Defina DATABASE_URL no arquivo .env');
  }

  const { host, port, user, password, dbName } = parseDatabaseUrl(databaseUrl);

  const client = new Client({
    host,
    port,
    user,
    password,
    database: 'postgres',
  });

  await client.connect();
  try {
    const { rows } = await client.query(
      'SELECT 1 AS ok FROM pg_database WHERE datname = $1',
      [dbName]
    );
    if (rows.length > 0) {
      console.log(`Banco "${dbName}" já existe.`);
      return;
    }
    const safeId = `"${dbName.replace(/"/g, '""')}"`;
    await client.query(`CREATE DATABASE ${safeId}`);
    console.log(`Banco "${dbName}" criado com sucesso.`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
