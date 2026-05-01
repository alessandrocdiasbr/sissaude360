import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  try {
    const session = localStorage.getItem('sissaude360_token');
    if (session && config.headers) {
      const { token } = JSON.parse(session);
      if (token) config.headers['Authorization'] = `Bearer ${token}`;
    }
  } catch {}
  return config;
});

export interface Usuario {
  id: string;
  nome: string;
  email: string;
}

export const usuariosApi = {
  listar: () => api.get<Usuario[]>('/usuarios'),
  criar: (data: { nome: string; email: string; senha: string }) =>
    api.post<Usuario>('/usuarios', data),
  atualizar: (id: string, data: { nome: string; email: string }) =>
    api.put<Usuario>(`/usuarios/${id}`, data),
  excluir: (id: string) => api.delete(`/usuarios/${id}`),
  resetarSenha: (id: string, novaSenha: string) =>
    api.patch(`/usuarios/${id}/reset-senha`, { novaSenha }),
};
