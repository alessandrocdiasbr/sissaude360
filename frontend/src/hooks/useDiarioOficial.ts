import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { diarioOficialApi, type GetArtigosParams } from '../services/diarioOficialApi';
import type { BuscaManualParams } from '../types/diarioOficial';

export const useArtigos = (params?: GetArtigosParams) => {
  return useQuery({
    queryKey: ['diario', 'artigos', params],
    queryFn: () => diarioOficialApi.getArtigos(params),
    enabled: true,
    refetchOnWindowFocus: false,
  });
};

export const useSalvarArtigo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => diarioOficialApi.salvarArtigo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diario', 'artigos'] });
    },
  });
};

export const useColetarDiario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => diarioOficialApi.coletarDiario(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diario', 'artigos'] });
    },
  });
};

export const useBuscaManual = () => {
  return useMutation({
    mutationFn: (params: BuscaManualParams) => diarioOficialApi.buscarManual(params),
  });
};

export const usePreferencias = () => {
  return useQuery({
    queryKey: ['diario', 'preferencias'],
    queryFn: () => diarioOficialApi.getPreferencias(),
    enabled: true,
    refetchOnWindowFocus: false,
  });
};

export const useCriarPreferencia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dados: { titulo: string; termos: string[]; fontes: string[] }) =>
      diarioOficialApi.criarPreferencia(dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diario', 'preferencias'] });
    },
  });
};

export const useAtualizarPreferencia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: { titulo: string; termos: string[]; fontes: string[] } }) =>
      diarioOficialApi.atualizarPreferencia(id, dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diario', 'preferencias'] });
    },
  });
};

export const useDeletarPreferencia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => diarioOficialApi.deletarPreferencia(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diario', 'preferencias'] });
    },
  });
};
