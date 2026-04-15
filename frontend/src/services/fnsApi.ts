import axios from 'axios';
import type { ConvenioFNS, DespesaFNS, RespostaPaginada, ResumoBloco } from '../types/fns';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const fnsApi = axios.create({
    baseURL: API_URL,
});

// Interceptor para adicionar o token JWT
fnsApi.interceptors.request.use((config) => {
    try {
        const sessionData = localStorage.getItem('sissaude360_token');
        if (sessionData && config.headers) {
            const { token } = JSON.parse(sessionData);
            if (token) {
                config.headers['Authorization'] = `Bearer ${token}`;
            }
        }
    } catch (error) {
        console.error('Erro ao ler sessão para o FNS:', error);
    }
    return config;
});

// Interceptor para forçar logout em 401/403
fnsApi.interceptors.response.use(
  (response) => response,
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

export const getDespesas = async (
  ano: number,
  mes: number,
  pagina = 1,
  limite = 20
): Promise<RespostaPaginada<DespesaFNS>> => {
    const response = await fnsApi.get('/fns/despesas', {
        params: { ano, mes, pagina, limite }
    });
    return response.data;
};

export const getResumoMunicipio = async (ibge: string, ano: number): Promise<{ dados: ResumoBloco[] }> => {
    const response = await fnsApi.get(`/fns/transferencias/municipio/${ibge}/resumo`, {
        params: { ano }
    });
    return response.data;
};

export const getConvenios = async (
  ano: number,
  situacao?: string,
  pagina = 1,
  limite = 20
): Promise<RespostaPaginada<ConvenioFNS>> => {
    const response = await fnsApi.get('/fns/convenios', {
        params: { ano, situacao, pagina, limite }
    });
    return response.data;
};

export const sincronizarFNS = async (ano: number, ibge: string): Promise<any> => {
    const response = await fnsApi.post('/fns/sincronizar', { ano, ibge });
    return response.data;
};

export default fnsApi;
