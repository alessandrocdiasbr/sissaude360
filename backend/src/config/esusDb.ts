import { Pool, QueryResult } from 'pg';

const esusPool = new Pool({
  host: process.env.ESUS_DB_HOST,
  port: Number(process.env.ESUS_DB_PORT) || 5433,
  database: process.env.ESUS_DB_NAME,
  user: process.env.ESUS_DB_USER,
  password: process.env.ESUS_DB_PASSWORD,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

esusPool.on('connect', async (client) => {
  await client.query('SET default_transaction_read_only = on');
});

esusPool.on('error', (err) => {
  console.error('[e-SUS DB] Erro no pool de conexão:', err.message);
});

export const esusQuery = async <T = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> => {
  const client = await esusPool.connect();
  try {
    return await client.query<T>(text, params);
  } finally {
    client.release();
  }
};

export const testEsusConnection = async (): Promise<boolean> => {
  try {
    await esusQuery('SELECT 1');
    console.log('[e-SUS DB] Conexão estabelecida com sucesso');
    return true;
  } catch (err: any) {
    console.error('[e-SUS DB] Falha na conexão:', err.message);
    return false;
  }
};

export default esusPool;
