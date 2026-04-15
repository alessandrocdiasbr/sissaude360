const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@sissaude360.local';
  const senhaPlano = process.env.SEED_ADMIN_PASSWORD || 'Admin@360';
  const nome = process.env.SEED_ADMIN_NOME || 'Administrador';

  const senha = await bcrypt.hash(senhaPlano, 10);

  await prisma.usuario.upsert({
    where: { email },
    update: { senha, nome },
    create: { email, nome, senha },
  });

  console.log('Conta de acesso criada/atualizada:');
  console.log(`  E-mail: ${email}`);
  console.log(`  Senha:  ${senhaPlano}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
