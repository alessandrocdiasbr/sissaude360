-- CreateTable
CREATE TABLE "Unidade" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'UBS',
    "endereco" TEXT,
    "telefone" TEXT,

    CONSTRAINT "Unidade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Servidor" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT,
    "email" TEXT,
    "funcao" TEXT NOT NULL,
    "formaContratacao" TEXT NOT NULL,
    "unidadeId" TEXT NOT NULL,

    CONSTRAINT "Servidor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "categoria" TEXT NOT NULL,
    "unidadeMedida" TEXT NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Estoque" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "unidadeId" TEXT,
    "quantidade" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "Estoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Movimentacao" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "unidadeId" TEXT,
    "tipo" TEXT NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observacao" TEXT,

    CONSTRAINT "Movimentacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Indicador" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "peso" DOUBLE PRECISION DEFAULT 1.0,
    "categoria" TEXT,
    "metaRegular" DOUBLE PRECISION NOT NULL DEFAULT 30,
    "metaBom" DOUBLE PRECISION NOT NULL DEFAULT 60,
    "metaOtimo" DOUBLE PRECISION NOT NULL DEFAULT 90,

    CONSTRAINT "Indicador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Producao" (
    "id" TEXT NOT NULL,
    "unidadeId" TEXT NOT NULL,
    "indicadorId" TEXT NOT NULL,
    "mes" INTEGER NOT NULL,
    "ano" INTEGER NOT NULL,
    "numerador" DOUBLE PRECISION NOT NULL,
    "denominador" DOUBLE PRECISION NOT NULL,
    "pontuacao" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Producao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Unidade_nome_key" ON "Unidade"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Estoque_itemId_unidadeId_key" ON "Estoque"("itemId", "unidadeId");

-- CreateIndex
CREATE UNIQUE INDEX "Indicador_nome_key" ON "Indicador"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Producao_unidadeId_indicadorId_mes_ano_key" ON "Producao"("unidadeId", "indicadorId", "mes", "ano");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- AddForeignKey
ALTER TABLE "Servidor" ADD CONSTRAINT "Servidor_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estoque" ADD CONSTRAINT "Estoque_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estoque" ADD CONSTRAINT "Estoque_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movimentacao" ADD CONSTRAINT "Movimentacao_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producao" ADD CONSTRAINT "Producao_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producao" ADD CONSTRAINT "Producao_indicadorId_fkey" FOREIGN KEY ("indicadorId") REFERENCES "Indicador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
