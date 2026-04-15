const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seeds do SisSaúde360...');

  // 1. Admin
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@sissaude360.local';
  const senhaPlano = process.env.SEED_ADMIN_PASSWORD || 'Admin@360';
  const nome = process.env.SEED_ADMIN_NOME || 'Administrador';

  const senha = await bcrypt.hash(senhaPlano, 10);

  await prisma.usuario.upsert({
    where: { email },
    update: { senha, nome },
    create: { email, nome, senha },
  });

  console.log('✅ Conta de administrador garantida.');

  // 2. Indicadores Previne Brasil
  console.log('\n🌱 Processando Indicadores...');
  try {
    execSync('npx ts-node prisma/seeds/indicadores-seed.ts', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  } catch (e) {
    console.warn('⚠️  Aviso: Erro ao executar indicadores-seed.ts');
  }

  // 3. Fila e Procedimentos
  console.log('\n🌱 Processando Procedimentos e Fila...');
  try {
    execSync('npx ts-node prisma/seeds/fila-seed.ts', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  } catch (e) {
    console.warn('⚠️  Aviso: Erro ao executar fila-seed.ts');
  }

  console.log('\n🎉 Todos os processos de seed concluídos!');
}

main()
  .catch((e) => {
    console.error('❌ Erro crítico no seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
