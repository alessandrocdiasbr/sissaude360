-- Migração: Adição de constraints UNIQUE para o módulo FNS
-- Data: 2026-04-14

-- Garantir unicidade na tabela de despesas para permitir atualização por órgão e competência
-- Primeiro, removemos registros duplicados se existirem (mantendo o mais recente)
DELETE FROM fns_despesas a USING fns_despesas b
WHERE a.id < b.id 
AND a.codigo_orgao = b.codigo_orgao 
AND a.competencia = b.competencia;

ALTER TABLE fns_despesas 
ADD CONSTRAINT unique_despesa_orgao_competencia UNIQUE (codigo_orgao, competencia);

-- Garantir unicidade na tabela de transferências
-- Única por município, ano e bloco (natureza da transferência)
DELETE FROM fns_transferencias a USING fns_transferencias b
WHERE a.id < b.id 
AND a.codigo_ibge = b.codigo_ibge 
AND a.ano = b.ano
AND a.bloco = b.bloco;

ALTER TABLE fns_transferencias 
ADD CONSTRAINT unique_transferencia_municipio_ano_bloco UNIQUE (codigo_ibge, ano, bloco);
