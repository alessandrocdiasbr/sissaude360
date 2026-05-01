import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({ baseURL: `${API_URL}/esus` });

api.interceptors.request.use((config) => {
  try {
    const sessionData = localStorage.getItem('sissaude360_token');
    if (sessionData && config.headers) {
      const { token } = JSON.parse(sessionData);
      if (token) config.headers['Authorization'] = `Bearer ${token}`;
    }
  } catch {}
  return config;
});

export const esusApi = {
  patients: {
    getAll: (params?: Record<string, any>) => api.get('/patients', { params }),
    getById: (cns: string) => api.get(`/patients/${cns}`),
    getTimeline: (cns: string) => api.get(`/patients/${cns}/timeline`),
  },
  referrals: {
    getAll: (params?: Record<string, any>) => api.get('/referrals', { params }),
    getStats: (params?: Record<string, any>) => api.get('/referrals/stats', { params }),
    getBySpecialty: () => api.get('/referrals/by-specialty'),
  },
  production: {
    getByProfessional: (params?: Record<string, any>) => api.get('/production', { params }),
    getByPeriod: (params?: Record<string, any>) => api.get('/production/by-period', { params }),
  },
  indicators: {
    getAll: (params?: Record<string, any>) => api.get('/indicators', { params }),
    getHistory: (code: string, params?: Record<string, any>) => api.get(`/indicators/${code}/history`, { params }),
  },
  queue: {
    getAll: (params?: Record<string, any>) => api.get('/queue', { params }),
    getStats: () => api.get('/queue/stats'),
    add: (data: Record<string, any>) => api.post('/queue', data),
    importFromEsus: (data: Record<string, any>) => api.post('/queue/import', data),
    updateStatus: (id: string, data: Record<string, any>) => api.patch(`/queue/${id}/status`, data),
  },
  testConnection: () => api.get('/test-connection'),
};

export default esusApi;
