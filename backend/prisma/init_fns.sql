-- Script de inicialização das tabelas do módulo Financeiro (FNS)
-- SisSaúde360

CREATE TABLE IF NOT EXISTS fns_despesas (
    id SERIAL PRIMARY KEY,
    codigo_orgao VARCHAR(50) NOT NULL,
    descricao TEXT,
    valor DECIMAL(15, 2) NOT NULL,
    competencia VARCHAR(7) NOT NULL, -- Formato MM/AAAA
    raw_json JSONB,
    importado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uniq_despesa_competencia UNIQUE (codigo_orgao, competencia)
);

CREATE TABLE IF NOT EXISTS fns_transferencias (
    id SERIAL PRIMARY KEY,
    codigo_ibge VARCHAR(7) NOT NULL,
    municipio VARCHAR(150),
    valor DECIMAL(15, 2) NOT NULL,
    bloco VARCHAR(100) NOT NULL,
    ano INTEGER NOT NULL,
    raw_json JSONB,
    importado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uniq_transferencia_ano_bloco UNIQUE (codigo_ibge, ano, bloco)
);

CREATE TABLE IF NOT EXISTS fns_convenios (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(50) NOT NULL,
    objeto TEXT,
    valor_global DECIMAL(15, 2) NOT NULL,
    situacao VARCHAR(100),
    data_inicio DATE,
    data_fim DATE,
    raw_json JSONB,
    importado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uniq_convenio_numero UNIQUE (numero)
);

CREATE INDEX IF NOT EXISTS idx_fns_transferencias_ibge ON fns_transferencias(codigo_ibge);
CREATE INDEX IF NOT EXISTS idx_fns_despesas_competencia ON fns_despesas(competencia);
