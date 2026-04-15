import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { criarProducao, getDashboard, getIndicadores, getUnidades } from '../services/apsApi';
import type { ProducaoPayload } from '../types/aps';

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

export const useDashboard = (unidadeId?: string, indicadorId?: string) => {
  return useQuery({
    queryKey: ['aps', 'dashboard', unidadeId, indicadorId],
    queryFn: () => getDashboard(unidadeId, indicadorId),
    staleTime: 1000 * 60 * 15, // 15 minutos
  });
};

export const useCriarProducao = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dados: ProducaoPayload) => criarProducao(dados),
    onSuccess: async () => {
      // Invalida todos os dashboards (com ou sem filtros)
      await queryClient.invalidateQueries({ queryKey: ['aps', 'dashboard'] });
    },
  });
};
