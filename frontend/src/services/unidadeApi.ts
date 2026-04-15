import axios from 'axios';

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

export interface Unidade {
  id: string;
  nome: string;
}

export const listUnidades = async (): Promise<Unidade[]> => {
  const response = await api.get('/unidades');
  return response.data;
};
