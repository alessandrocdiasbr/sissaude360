-- Migração: Criação das tabelas para o módulo FNS
-- Data: 2026-04-14

-- Tabela de Despesas FNS
CREATE TABLE IF NOT EXISTS fns_despesas (
    id SERIAL PRIMARY KEY,
    codigo_orgao VARCHAR(20),
    descricao TEXT,
    valor DECIMAL(15,2),
    competencia VARCHAR(7), -- Formato MM/AAAA
    raw_json JSONB,
    importado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Transferências FNS
CREATE TABLE IF NOT EXISTS fns_transferencias (
    id SERIAL PRIMARY KEY,
    codigo_ibge VARCHAR(10),
    municipio VARCHAR(100),
    valor DECIMAL(15,2),
    bloco VARCHAR(100),
    ano INTEGER,
    raw_json JSONB,
    importado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Convênios FNS
CREATE TABLE IF NOT EXISTS fns_convenios (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(20) UNIQUE,
    objeto TEXT,
    valor_global DECIMAL(15,2),
    situacao VARCHAR(50),
    data_inicio DATE,
    data_fim DATE,
    raw_json JSONB,
    importado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhor performance de busca
CREATE INDEX IF NOT EXISTS idx_fns_despesas_competencia ON fns_despesas(competencia);
CREATE INDEX IF NOT EXISTS idx_fns_transferencias_ibge ON fns_transferencias(codigo_ibge);
CREATE INDEX IF NOT EXISTS idx_fns_convenios_numero ON fns_convenios(numero);
