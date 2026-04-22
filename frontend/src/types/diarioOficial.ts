export interface DiarioArtigo {
  id: string;
  titulo: string;
  corpo: string | null;
  resumo: string | null;
  fonte: 'DOU' | 'DOMG' | 'ALMG';
  secao: string | null;
  orgao: string | null;
  url: string | null;
  dataPublicacao: string;
  salvo: boolean;
  salvoEm: string | null;
  capturedoEm: string;
}

export interface DiarioPreferencia {
  id: string;
  titulo: string;
  termos: string[];
  fontes: string[];
  ativo: boolean;
  criadoEm: string;
}

export interface BuscaManualParams {
  termos: string;
  fontes: string[];
  dataInicio?: string;
  dataFim?: string;
}
