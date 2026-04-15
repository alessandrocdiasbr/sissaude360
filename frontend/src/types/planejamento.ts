export interface AcaoSaude {
  id: string;
  titulo: string;
  descricao?: string;
  categoria: 'ACAO' | 'SERVICO' | 'COMPRA' | 'EXPANSAO';
  status: 'PROPOSTO' | 'APROVADO' | 'EM_EXECUCAO' | 'CONCLUIDO' | 'CANCELADO';
  prioridade: 'ALTA' | 'MEDIA' | 'BAIXA';
  responsavel?: string;
  prazo?: string;
  valorEstimado?: number;
  unidadeId?: string;
  unidade?: {
    nome: string;
  };
  criadoEm: string;
  atualizadoEm: string;
}

export interface MetaAnual {
  id: string;
  nome: string;
  eixo: 'ACESSO' | 'QUALIDADE' | 'FINANCEIRO' | 'ESTRUTURA';
  ano: number;
  valorMeta: number;
  valorAtual: number;
  unidade: string;
}

export interface MetasPorEixo {
  [eixo: string]: MetaAnual[];
}
