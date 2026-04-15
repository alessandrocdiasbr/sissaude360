import axios from 'axios';
import type { AcaoSaude, MetaAnual, MetasPorEixo } from '../types/planejamento';

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

export const planejamentoApi = {
  // Ações
  getAcoes: async (categoria?: string, status?: string): Promise<AcaoSaude[]> => {
    const response = await api.get('/planejamento/acoes', {
      params: { categoria, status },
    });
    return response.data;
  },

  criarAcao: async (dados: Partial<AcaoSaude>): Promise<AcaoSaude> => {
    const response = await api.post('/planejamento/acoes', dados);
    return response.data;
  },

  atualizarStatus: async (id: string, status: string): Promise<AcaoSaude> => {
    const response = await api.patch(`/planejamento/acoes/${id}/status`, { status });
    return response.data;
  },

  atualizarAcao: async (id: string, dados: Partial<AcaoSaude>): Promise<AcaoSaude> => {
    const response = await api.put(`/planejamento/acoes/${id}`, dados);
    return response.data;
  },

  deletarAcao: async (id: string): Promise<void> => {
    await api.delete(`/planejamento/acoes/${id}`);
  },

  // Metas
  getMetas: async (ano: number): Promise<MetasPorEixo> => {
    const response = await api.get('/planejamento/metas', {
      params: { ano },
    });
    return response.data;
  },

  criarMeta: async (dados: Partial<MetaAnual>): Promise<MetaAnual> => {
    const response = await api.post('/planejamento/metas', dados);
    return response.data;
  },

  atualizarProgresso: async (id: string, valorAtual: number): Promise<MetaAnual> => {
    const response = await api.patch(`/planejamento/metas/${id}/progresso`, { valorAtual });
    return response.data;
  },

  deletarMeta: async (id: string): Promise<void> => {
    await api.delete(`/planejamento/metas/${id}`);
  },
};
