import axios from 'axios';
import type { DiarioArtigo, DiarioPreferencia, BuscaManualParams } from '../types/diarioOficial';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  try {
    const sessionData = localStorage.getItem('sissaude360_token');
    if (sessionData && config.headers) {
      const { token } = JSON.parse(sessionData);
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
  } catch (error) {
    console.error('Erro ao ler sessão:', error);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      try {
        localStorage.removeItem('sissaude360_token');
      } finally {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export interface GetArtigosParams {
  fonte?: string;
  busca?: string;
  salvo?: boolean;
  data?: string;
}

export const diarioOficialApi = {
  // Artigos
  getArtigos: async (params?: GetArtigosParams): Promise<DiarioArtigo[]> => {
    const response = await api.get('/diario/artigos', { params });
    return response.data.dados ?? response.data;
  },

  salvarArtigo: async (id: string): Promise<DiarioArtigo> => {
    const response = await api.patch(`/diario/artigos/${id}/salvar`);
    return response.data;
  },

  // Coleta
  coletarDiario: async (): Promise<void> => {
    await api.post('/diario/coletar');
  },

  // Busca manual (sem armazenar)
  buscarManual: async (params: BuscaManualParams): Promise<DiarioArtigo[]> => {
    const response = await api.post('/diario/buscar', params);
    return response.data.dados ?? response.data;
  },

  // Preferências
  getPreferencias: async (): Promise<DiarioPreferencia[]> => {
    const response = await api.get('/diario/preferencias');
    return response.data;
  },

  criarPreferencia: async (dados: { titulo: string; termos: string[]; fontes: string[] }): Promise<DiarioPreferencia> => {
    const response = await api.post('/diario/preferencias', dados);
    return response.data;
  },

  atualizarPreferencia: async (
    id: string,
    dados: { titulo: string; termos: string[]; fontes: string[] }
  ): Promise<DiarioPreferencia> => {
    const response = await api.put(`/diario/preferencias/${id}`, dados);
    return response.data;
  },

  deletarPreferencia: async (id: string): Promise<void> => {
    await api.delete(`/diario/preferencias/${id}`);
  },
};
