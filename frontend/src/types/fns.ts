export interface DespesaFNS {
    id?: number;
    codigoOrgao: string;
    descricao: string;
    valor: number;
    competencia: string;
    importadoEm?: string | Date;
}

export interface TransferenciaFNS {
    id?: number;
    codigoIbge: string;
    municipio: string;
    valor: number;
    bloco: string;
    ano: number;
    importadoEm?: string | Date;
}

export interface ConvenioFNS {
    id?: number;
    numero: string;
    objeto: string;
    valorGlobal: number;
    situacao: string;
    dataInicio?: string | Date;
    dataFim?: string | Date;
}

export interface ResumoBloco {
    bloco: string;
    total: number;
}

export interface PaginacaoInfo {
    total: number;
    pagina: number;
    limite: number;
    totalPaginas: number;
}

export interface RespostaPaginada<T> {
    dados: T[];
    paginacao: PaginacaoInfo;
}
