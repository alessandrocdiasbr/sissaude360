export interface DespesaFNS {
  id?: number;
  codigoOrgao: string;
  descricao: string;
  valor: number;
  competencia: string;
  rawJson?: unknown;
  importadoEm?: Date;
}

export interface TransferenciaFNS {
  id?: number;
  codigoIbge: string;
  municipio: string;
  valor: number;
  bloco: string;
  ano: number;
  rawJson?: unknown;
  importadoEm?: Date;
}

export interface ConvenioFNS {
  id?: number;
  numero: string;
  objeto: string;
  valorGlobal: number;
  situacao: string;
  dataInicio: string | Date;
  dataFim: string | Date;
  rawJson?: unknown;
  importadoEm?: Date;
}

export interface PaginacaoParams {
  pagina?: number;
  limite?: number;
}

export interface RespostaPaginada<T> {
  dados: T[];
  paginacao: {
    total: number;
    pagina: number;
    limite: number;
    totalPaginas: number;
  };
}
