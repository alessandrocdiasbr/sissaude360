import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const INDICADORES = [
  { nome: "Mais Acesso à Atenção Primária à Saúde", esquema: "MAIS_ACESSO" },
  { nome: "Desenvolvimento Infantil", esquema: "PADRAO" },
  { nome: "Gestação e Puerpério", esquema: "PADRAO" },
  { nome: "Diabetes — Acompanhados", esquema: "PADRAO" },
  { nome: "Hipertensão — Acompanhados", esquema: "PADRAO" },
  { nome: "Pessoa Idosa", esquema: "PADRAO" },
  { nome: "Prevenção do Câncer", esquema: "PADRAO" },
  { nome: "1ª Consulta Odontológica", esquema: "PADRAO" },
  { nome: "Tratamento Odontológico Concluído", esquema: "PADRAO" },
  { nome: "Taxa de Exodontia", esquema: "PADRAO" },
  { nome: "Escovação Supervisionada", esquema: "PADRAO" },
  { nome: "Procedimento Odontológico Preventivo", esquema: "PADRAO" },
  { nome: "Tratamento Atraumático", esquema: "PADRAO" },
  { nome: "Média Atend. eMulti na APS", esquema: "PADRAO" },
  { nome: "Ações Interprofissionais", esquema: "PADRAO" },
  { nome: "Resumo de Produção", esquema: "PADRAO" }
];

async function main() {
  console.log('🌱 Iniciando seed de indicadores Previne Brasil...');

  for (const ind of INDICADORES) {
    await prisma.indicador.upsert({
      where: { nome: ind.nome },
      update: { esquemaPontuacao: ind.esquema },
      create: {
        nome: ind.nome,
        esquemaPontuacao: ind.esquema,
        tipo: "PERCENTUAL",
        categoria: "Previne Brasil"
      }
    });
  }

  console.log('✅ 16 Indicadores processados com sucesso.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
