import { useQuery } from '@tanstack/react-query';
import { getUnidades, getIndicadores, getAPSPerformance } from '../services/apsApi';

export const useUnidades = () => {
  return useQuery({
    queryKey: ['aps', 'unidades'],
    queryFn: getUnidades,
    staleTime: 1000 * 60 * 60, // 1 hora
  });
};

export const useIndicadores = () => {
  return useQuery({
    queryKey: ['aps', 'indicadores'],
    queryFn: getIndicadores,
    staleTime: 1000 * 60 * 60, // 1 hora
  });
};

export const useAPSPerformance = (unidadeId?: string, indicadorId?: string) => {
  return useQuery({
    queryKey: ['aps', 'performance', unidadeId, indicadorId],
    queryFn: () => getAPSPerformance(unidadeId, indicadorId),
    staleTime: 1000 * 60 * 15, // 15 minutos
  });
};
