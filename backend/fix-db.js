const { Client } = require('pg');

// Usando template1 conforme identificado no token do Prisma
const rawDbUrl = "postgres://postgres:postgres@localhost:51214/template1";

async function fix() {
    console.log('--- FIX DB: ADICIONANDO COLUNAS NO TEMPLATE1 ---');
    const client = new Client({ connectionString: rawDbUrl });

    try {
        await client.connect();
        console.log('Conectado ao template1 com sucesso.');

        await client.query('ALTER TABLE "Unidade" ADD COLUMN IF NOT EXISTS "tipo" TEXT DEFAULT \'UBS\'');
        await client.query('ALTER TABLE "Unidade" ADD COLUMN IF NOT EXISTS "endereco" TEXT');
        await client.query('ALTER TABLE "Unidade" ADD COLUMN IF NOT EXISTS "telefone" TEXT');

        console.log('✅ Colunas adicionadas com sucesso no template1!');
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await client.end();
        process.exit();
    }
}

fix();
