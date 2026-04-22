CREATE TABLE "diario_oficial_artigos" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "corpo" TEXT,
    "resumo" TEXT,
    "fonte" TEXT NOT NULL,
    "secao" TEXT,
    "orgao" TEXT,
    "url" TEXT,
    "dataPublicacao" DATE NOT NULL,
    "salvo" BOOLEAN NOT NULL DEFAULT false,
    "salvoEm" TIMESTAMP(3),
    "capturedoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "diario_oficial_artigos_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "diario_oficial_artigos_fonte_dataPublicacao_idx" ON "diario_oficial_artigos"("fonte", "dataPublicacao");
CREATE INDEX "diario_oficial_artigos_salvo_idx" ON "diario_oficial_artigos"("salvo");

CREATE TABLE "diario_oficial_preferencias" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "termos" TEXT NOT NULL,
    "fontes" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "diario_oficial_preferencias_pkey" PRIMARY KEY ("id")
);
