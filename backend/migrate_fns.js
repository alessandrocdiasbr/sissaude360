const fs = require('fs');
const path = require('path');
const db = require('./src/config/database');

async function runMigration() {
    try {
        console.log('Iniciando migração das tabelas FNS...');
        const sqlPath = path.join(__dirname, 'prisma', 'init_fns.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        await db.query(sql);
        
        console.log('Tabelas FNS criadas com sucesso!');
        process.exit(0);
    } catch (error) {
        console.error('Erro ao executar migração FNS:', error);
        process.exit(1);
    }
}

runMigration();
