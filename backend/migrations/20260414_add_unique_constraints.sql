-- Migração: Adição de constraints UNIQUE para o módulo FNS
-- Data: 2026-04-14

ALTER TABLE fns_despesas
  ADD CONSTRAINT IF NOT EXISTS uq_despesas_orgao_competencia
  UNIQUE (codigo_orgao, competencia);

ALTER TABLE fns_transferencias
  ADD CONSTRAINT IF NOT EXISTS uq_transferencias_ibge_ano_bloco
  UNIQUE (codigo_ibge, ano, bloco);
