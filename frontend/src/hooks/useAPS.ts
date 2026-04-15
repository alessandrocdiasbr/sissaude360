import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apsService } from '../services/apsService';

export const useIndicadoresAPS = () => {
  return useQuery({
    queryKey: ['aps', 'indicadores'],
    queryFn: apsService.getIndicadores,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
};

export const useUnidadesAPS = () => {
  return useQuery({
    queryKey: ['aps', 'unidades'],
    queryFn: apsService.getUnidades,
    staleTime: 10 * 60 * 1000,
  });
};

export const useResultadoPorIndicador = (params: { indicadorId: string; mes: number; ano: number; tipos: string }, enabled: boolean) => {
  return useQuery({
    queryKey: ['aps', 'resultado-indicador', params],
    queryFn: () => apsService.getResultadoPorIndicador(params),
    enabled,
    refetchOnWindowFocus: false,
  });
};

export const useResultadoPorEquipe = (params: { unidadeId: string; mes: number; ano: number }, enabled: boolean) => {
  return useQuery({
    queryKey: ['aps', 'resultado-equipe', params],
    queryFn: () => apsService.getResultadoPorEquipe(params),
    enabled,
    refetchOnWindowFocus: false,
  });
};

export const useEvolucaoAPS = (params: { indicadorId: string; tipos: string; meses?: number }, enabled: boolean) => {
  return useQuery({
    queryKey: ['aps', 'evolucao', params],
    queryFn: () => apsService.getEvolucao(params),
    enabled,
    refetchOnWindowFocus: false,
  });
};

export const useCriarProducao = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apsService.criarProducao,
    onSuccess: () => {
      // Invalida as queries de resultado para forçar atualização
      queryClient.invalidateQueries({ queryKey: ['aps', 'resultado-indicador'] });
      queryClient.invalidateQueries({ queryKey: ['aps', 'resultado-equipe'] });
      queryClient.invalidateQueries({ queryKey: ['aps', 'evolucao'] });
    },
  });
};
