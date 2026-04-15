-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "estoqueMinimo" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "AcaoSaude" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "categoria" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROPOSTO',
    "prioridade" TEXT NOT NULL DEFAULT 'MEDIA',
    "responsavel" TEXT,
    "prazo" TIMESTAMP(3),
    "valorEstimado" DOUBLE PRECISION,
    "unidadeId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcaoSaude_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetaAnual" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "eixo" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "valorMeta" DOUBLE PRECISION NOT NULL,
    "valorAtual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unidade" TEXT NOT NULL DEFAULT '%',

    CONSTRAINT "MetaAnual_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AcaoSaude" ADD CONSTRAINT "AcaoSaude_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE SET NULL ON UPDATE CASCADE;
