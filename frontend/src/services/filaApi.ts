import axios from 'axios';
import type {
  EstatisticasDiaResponse,
  GerarSenhaPayload,
  ListaFilaResponse,
  ListaSalasResponse,
  Ticket,
} from '../types/fila';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const filaApi = axios.create({
  baseURL: API_URL,
});

filaApi.interceptors.request.use((config) => {
  try {
    const sessionData = localStorage.getItem('sissaude360_token');
    if (sessionData && config.headers) {
      const { token } = JSON.parse(sessionData) as { token?: string };
      if (token) config.headers['Authorization'] = `Bearer ${token}`;
    }
  } catch {
    // ignore
  }
  return config;
});

filaApi.interceptors.response.use(
  (r) => r,
  (error) => {
    const status: number | undefined = error?.response?.status;
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

export const listarFila = async (unidadeId: string): Promise<ListaFilaResponse> => {
  const response = await filaApi.get(`/fila/${unidadeId}`);
  return response.data;
};

export const listarSalas = async (unidadeId: string): Promise<ListaSalasResponse> => {
  const response = await filaApi.get(`/fila/${unidadeId}/salas`);
  return response.data;
};

export const estatisticasDia = async (unidadeId: string): Promise<EstatisticasDiaResponse> => {
  const response = await filaApi.get(`/fila/${unidadeId}/estatisticas-dia`);
  return response.data;
};

export const gerarSenha = async (payload: GerarSenhaPayload): Promise<Ticket> => {
  const response = await filaApi.post('/fila/tickets', payload);
  return response.data;
};

export const chamarProximo = async (salaId: string): Promise<Ticket> => {
  const response = await filaApi.post(`/fila/salas/${salaId}/chamar-proximo`);
  return response.data;
};

export const iniciarAtendimento = async (ticketId: string): Promise<Ticket> => {
  const response = await filaApi.post(`/fila/tickets/${ticketId}/iniciar`);
  return response.data;
};

export const finalizarAtendimento = async (ticketId: string): Promise<Ticket> => {
  const response = await filaApi.post(`/fila/tickets/${ticketId}/finalizar`);
  return response.data;
};

export default filaApi;

