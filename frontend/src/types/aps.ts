export interface Unidade {
  id: string;
  nome: string;
  tipo: string;
  endereco?: string;
  telefone?: string;
}

export interface Indicador {
  id: string;
  nome: string;
  peso: number;
  categoria?: string;
  metaRegular: number;
  metaBom: number;
  metaOtimo: number;
}

export interface ProducaoComparativo {
  mes: number;
  indicador: string;
  unidade: string;
  valor2025: number;
  valor2026: number | null;
  evolucao: string;
  status2025: string;
  status2026: string;
}

export interface APSDashboardResponse {
  resumo: ProducaoComparativo[];
  raw: {
    data2025: any[];
    data2026: any[];
  };
}
