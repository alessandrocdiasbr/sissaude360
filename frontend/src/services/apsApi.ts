import axios from 'axios';
import type { Unidade, Indicador, APSDashboardResponse, ProducaoPayload } from '../types/aps';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const apsApi = axios.create({
  baseURL: API_URL,
});

// Interceptor para autenticação JWT
apsApi.interceptors.request.use((config) => {
  try {
    const sessionData = localStorage.getItem('sissaude360_token');
    if (sessionData && config.headers) {
      const { token } = JSON.parse(sessionData);
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
  } catch (error) {
    console.error('Erro ao processar token de autenticação:', error);
  }
  return config;
});

export const getUnidades = async (): Promise<Unidade[]> => {
  const response = await apsApi.get('/unidades');
  return response.data;
};

export const getIndicadores = async (): Promise<Indicador[]> => {
  const response = await apsApi.get('/indicadores');
  return response.data;
};

export const getDashboard = async (unidadeId?: string, indicadorId?: string): Promise<APSDashboardResponse> => {
  const response = await apsApi.get('/dashboard', {
    params: { unidadeId, indicadorId }
  });
  return response.data;
};

export const criarProducao = async (dados: ProducaoPayload): Promise<void> => {
  await apsApi.post('/producao', dados);
};

export default apsApi;
