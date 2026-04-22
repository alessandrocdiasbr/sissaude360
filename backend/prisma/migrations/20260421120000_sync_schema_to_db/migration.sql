-- ============================================================
-- Sync schema @@map renames + new models to database
-- ============================================================

-- 1. Rename PascalCase tables to snake_case (@@map directives)
ALTER TABLE "Unidade"   RENAME TO "unidades";
ALTER TABLE "Servidor"  RENAME TO "servidores";
ALTER TABLE "Item"      RENAME TO "itens";
ALTER TABLE "Ticket"    RENAME TO "tickets";
ALTER TABLE "Sala"      RENAME TO "salas";
ALTER TABLE "AcaoSaude" RENAME TO "acoes_saude";

-- 2. Rename primary key indexes
ALTER INDEX "Unidade_pkey"   RENAME TO "unidades_pkey";
ALTER INDEX "Servidor_pkey"  RENAME TO "servidores_pkey";
ALTER INDEX "Item_pkey"      RENAME TO "itens_pkey";
ALTER INDEX "Ticket_pkey"    RENAME TO "tickets_pkey";
ALTER INDEX "Sala_pkey"      RENAME TO "salas_pkey";
ALTER INDEX "AcaoSaude_pkey" RENAME TO "acoes_saude_pkey";

-- 3. Rename unique indexes
ALTER INDEX "Unidade_nome_key" RENAME TO "unidades_nome_key";

-- 4. Add missing columns to Unidade (now unidades)
ALTER TABLE "unidades" ADD COLUMN IF NOT EXISTS "tipoEquipe" TEXT NOT NULL DEFAULT 'eSF';
ALTER TABLE "unidades" ADD COLUMN IF NOT EXISTS "nomeEquipe" TEXT;

-- 5. Add missing columns to Indicador
ALTER TABLE "Indicador" ADD COLUMN IF NOT EXISTS "tipo"             TEXT NOT NULL DEFAULT 'PERCENTUAL';
ALTER TABLE "Indicador" ADD COLUMN IF NOT EXISTS "esquemaPontuacao" TEXT NOT NULL DEFAULT 'PADRAO';

-- 6. Create new tables

-- CategoriaProcedimento
CREATE TABLE "categorias_procedimentos" (
    "id"        TEXT NOT NULL,
    "codigo"    TEXT NOT NULL,
    "nome"      TEXT NOT NULL,
    "descricao" TEXT,
    CONSTRAINT "categorias_procedimentos_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "categorias_procedimentos_codigo_key" ON "categorias_procedimentos"("codigo");

-- SubCategoriaProcedimento
CREATE TABLE "sub_categorias_procedimentos" (
    "id"          TEXT NOT NULL,
    "codigo"      TEXT NOT NULL,
    "nome"        TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,
    CONSTRAINT "sub_categorias_procedimentos_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "sub_categorias_procedimentos_codigo_key" ON "sub_categorias_procedimentos"("codigo");
ALTER TABLE "sub_categorias_procedimentos"
    ADD CONSTRAINT "sub_categorias_procedimentos_categoriaId_fkey"
    FOREIGN KEY ("categoriaId") REFERENCES "categorias_procedimentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Procedimento
CREATE TABLE "procedimentos" (
    "id"             TEXT NOT NULL,
    "codigo"         TEXT,
    "nome"           TEXT NOT NULL,
    "subCategoriaId" TEXT NOT NULL,
    "ativo"          BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "procedimentos_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "procedimentos"
    ADD CONSTRAINT "procedimentos_subCategoriaId_fkey"
    FOREIGN KEY ("subCategoriaId") REFERENCES "sub_categorias_procedimentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- SolicitacaoFila
CREATE TABLE "solicitacoes_fila" (
    "id"                  TEXT NOT NULL,
    "pacienteNome"        TEXT NOT NULL,
    "pacienteCns"         TEXT,
    "pacienteCpf"         TEXT,
    "pacienteNascimento"  TIMESTAMP(3),
    "pacienteTelefone"    TEXT,
    "procedimentoId"      TEXT NOT NULL,
    "status"              TEXT NOT NULL DEFAULT 'AGUARDANDO',
    "dataSolicitacao"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAgendamento"     TIMESTAMP(3),
    "dataAtendimento"     TIMESTAMP(3),
    "dataAtualizacao"     TIMESTAMP(3) NOT NULL,
    "unidadeOrigemId"     TEXT NOT NULL,
    "unidadeDestinoNome"  TEXT,
    "medicoSolicitante"   TEXT,
    "crmSolicitante"      TEXT,
    "prioridade"          TEXT NOT NULL DEFAULT 'ELETIVA',
    "observacoes"         TEXT,
    "motivoCancelamento"  TEXT,
    CONSTRAINT "solicitacoes_fila_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "solicitacoes_fila"
    ADD CONSTRAINT "solicitacoes_fila_procedimentoId_fkey"
    FOREIGN KEY ("procedimentoId") REFERENCES "procedimentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "solicitacoes_fila"
    ADD CONSTRAINT "solicitacoes_fila_unidadeOrigemId_fkey"
    FOREIGN KEY ("unidadeOrigemId") REFERENCES "unidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- HistoricoFila
CREATE TABLE "historico_fila" (
    "id"             TEXT NOT NULL,
    "solicitacaoId"  TEXT NOT NULL,
    "statusAnterior" TEXT,
    "statusNovo"     TEXT NOT NULL,
    "observacao"     TEXT,
    "registradoEm"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "registradoPor"  TEXT,
    CONSTRAINT "historico_fila_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "historico_fila"
    ADD CONSTRAINT "historico_fila_solicitacaoId_fkey"
    FOREIGN KEY ("solicitacaoId") REFERENCES "solicitacoes_fila"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- FNSDespesa
CREATE TABLE "fns_despesas" (
    "id"           SERIAL NOT NULL,
    "codigo_orgao" VARCHAR(50) NOT NULL,
    "descricao"    TEXT,
    "valor"        DECIMAL(15,2) NOT NULL,
    "competencia"  VARCHAR(7) NOT NULL,
    "raw_json"     JSONB,
    "importado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fns_despesas_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "fns_despesas_codigo_orgao_competencia_key" ON "fns_despesas"("codigo_orgao", "competencia");

-- FNSTransferencia
CREATE TABLE "fns_transferencias" (
    "id"           SERIAL NOT NULL,
    "codigo_ibge"  VARCHAR(7) NOT NULL,
    "municipio"    VARCHAR(150),
    "valor"        DECIMAL(15,2) NOT NULL,
    "bloco"        VARCHAR(100) NOT NULL,
    "ano"          INTEGER NOT NULL,
    "raw_json"     JSONB,
    "importado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fns_transferencias_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "fns_transferencias_codigo_ibge_ano_bloco_key" ON "fns_transferencias"("codigo_ibge", "ano", "bloco");

-- FNSConvenio
CREATE TABLE "fns_convenios" (
    "id"           SERIAL NOT NULL,
    "numero"       VARCHAR(50) NOT NULL,
    "objeto"       TEXT,
    "valor_global" DECIMAL(15,2) NOT NULL,
    "situacao"     VARCHAR(100),
    "data_inicio"  DATE,
    "data_fim"     DATE,
    "raw_json"     JSONB,
    "importado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fns_convenios_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "fns_convenios_numero_key" ON "fns_convenios"("numero");
