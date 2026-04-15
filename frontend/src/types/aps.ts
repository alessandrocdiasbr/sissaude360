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
  peso?: number | null;
  categoria?: string | null;
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
    data2025: unknown[];
    data2026: unknown[];
  };
}

export interface ProducaoPayload {
  unidadeId: string;
  indicadorId: string;
  mes: number; // 1-12
  ano: 2025 | 2026;
  numerador: number;
  denominador: number;
}
