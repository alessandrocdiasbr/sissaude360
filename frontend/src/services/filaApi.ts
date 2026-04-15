import axios from 'axios';
import type { FilaParams, SolicitacaoFila, EstatisticasFilaResponse, CategoriaFila, ProcedimentoFila } from '../types/fila';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const TOKEN_KEY = 'sissaude360_token';

const getAuthHeader = () => {
    const storedData = localStorage.getItem(TOKEN_KEY);
    if (storedData) {
        try {
            const { token } = JSON.parse(storedData);
            return { Authorization: `Bearer ${token}` };
        } catch (e) {
            return {};
        }
    }
    return {};
};

const filaApi = axios.create({
    baseURL: `${API_URL}/fila`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para adicionar o token em todas as requisições
filaApi.interceptors.request.use((config) => {
    const headers = getAuthHeader();
    if (headers.Authorization) {
        config.headers.Authorization = headers.Authorization;
    }
    return config;
});

export const getSolicitacoes = async (params: FilaParams) => {
    const { data } = await filaApi.get('/', { params });
    return data;
};

export const getSolicitacao = async (id: string): Promise<SolicitacaoFila> => {
    const { data } = await filaApi.get(`/${id}`);
    return data;
};

export const getEstatisticasFila = async (): Promise<EstatisticasFilaResponse> => {
    const { data } = await filaApi.get('/estatisticas');
    return data;
};

export const getCategorias = async (): Promise<CategoriaFila[]> => {
    const { data } = await filaApi.get('/categorias');
    return data;
};

export const getProcedimentos = async (subCategoriaId?: string): Promise<ProcedimentoFila[]> => {
    const { data } = await filaApi.get('/procedimentos', { params: { subCategoriaId } });
    return data;
};

export const criarSolicitacao = async (payload: any): Promise<SolicitacaoFila> => {
    const { data } = await filaApi.post('/', payload);
    return data;
};

export const atualizarStatus = async (id: string, payload: { novoStatus: string; observacao?: string; motivoCancelamento?: string; dataAgendamento?: string }) => {
    const { data } = await filaApi.patch(`/${id}/status`, payload);
    return data;
};

export const atualizarSolicitacao = async (id: string, payload: any) => {
    const { data } = await filaApi.put(`/${id}`, payload);
    return data;
};

export default filaApi;
