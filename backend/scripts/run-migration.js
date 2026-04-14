const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    // Resolve o caminho absoluto para o arquivo de migration
    const sqlPath = path.join(__dirname, '../migrations/20260414_add_unique_constraints.sql');
    
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`Arquivo de migração não encontrado em: ${sqlPath}`);
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('--- Iniciando Migração FNS ---');
    console.log(`Lendo arquivo: ${path.basename(sqlPath)}`);
    
    await client.query(sql);
    
    console.log('✅ Migração executada com sucesso!');
    console.log('As constraints UNIQUE foram aplicadas/verificadas.');
  } catch (err) {
    console.error('❌ Erro ao executar migração:');
    console.error(`  Mensagem: ${err.message}`);
    if (err.detail) console.error(`  Detalhe: ${err.detail}`);
    if (err.hint) console.error(`  Dica: ${err.hint}`);
    if (err.code) console.error(`  Código Postgres: ${err.code}`);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
