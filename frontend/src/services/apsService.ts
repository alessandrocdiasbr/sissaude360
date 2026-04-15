import axios from 'axios';

// --- Tipos Consolidados para evitar erros de resolução de módulo ---
export type StatusAPS = 'OTIMO' | 'BOM' | 'SUFICIENTE' | 'REGULAR';
export type EsquemaPontuacao = 'PADRAO' | 'MAIS_ACESSO';
export type TipoEquipe = 'eAP' | 'eSF';
export type ViewAPS = 'indicador' | 'equipe' | 'competencia';

export interface RegraPontuacao {
  status: StatusAPS;
  label: string;
  range: string;
}

export interface IndicadorAPS {
  id: string;
  nome: string;
  esquemaPontuacao: EsquemaPontuacao;
  regras: RegraPontuacao[];
}

export interface EquipeResultado {
  id: string;
  ubs: string;
  equipe: string;
  tipo: TipoEquipe;
  pontuacao: number | null;
  status: StatusAPS | null;
}

export interface ResultadoPorIndicador {
  indicador: IndicadorAPS;
  competencia: { mes: number; ano: number; label: string };
  isPreliminar: boolean;
  equipes: EquipeResultado[];
}

export interface ResultadoPorEquipe {
  equipe: { id: string; ubs: string; nomeEquipe: string; tipoEquipe: TipoEquipe };
  competencia: { mes: number; ano: number; label: string };
  isPreliminar: boolean;
  indicadores: (IndicadorAPS & { pontuacao: number | null; status: StatusAPS | null })[];
}

export interface EvolucaoSerie {
  unidadeId: string;
  equipe: string;
  ubs: string;
  dados: (number | null)[];
}

export interface APSResultadoEvolucao {
  indicador: IndicadorAPS;
  competencias: string[];
  series: EvolucaoSerie[];
}

// --- Fim dos Tipos ---

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const getHeaders = () => {
  const sessionData = localStorage.getItem('sissaude360_token');
  if (!sessionData) return {};
  try {
    const { token } = JSON.parse(sessionData);
    return { 'Authorization': `Bearer ${token}` };
  } catch (e) {
    return {};
  }
};

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  config.headers = { ...config.headers, ...getHeaders() } as any;
  return config;
});

export const apsService = {
  getIndicadores: async () => {
    const res = await api.get('/indicadores');
    return res.data;
  },

  getUnidades: async () => {
    const res = await api.get('/unidades');
    return res.data;
  },

  getResultadoPorIndicador: async (params: { indicadorId: string; mes: number; ano: number; tipos: string }) => {
    const res = await api.get<ResultadoPorIndicador>('/aps/por-indicador', { params });
    return res.data;
  },

  getResultadoPorEquipe: async (params: { unidadeId: string; mes: number; ano: number }) => {
    const res = await api.get<ResultadoPorEquipe>('/aps/por-equipe', { params });
    return res.data;
  },

  getEvolucao: async (params: { indicadorId: string; tipos: string; meses?: number }) => {
    const res = await api.get<APSResultadoEvolucao>('/aps/evolucao', { params });
    return res.data;
  },

  criarProducao: async (dados: any) => {
    const res = await api.post('/producao', dados);
    return res.data;
  }
};
