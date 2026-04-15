import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { planejamentoApi } from '../services/planejamentoApi';
import type { AcaoSaude, MetaAnual } from '../types/planejamento';

export const useAcoes = (categoria?: string, status?: string) => {
  return useQuery({
    queryKey: ['planejamento', 'acoes', { categoria, status }],
    queryFn: () => planejamentoApi.getAcoes(categoria, status),
  });
};

export const useMetas = (ano: number) => {
  return useQuery({
    queryKey: ['planejamento', 'metas', ano],
    queryFn: () => planejamentoApi.getMetas(ano),
  });
};

export const usePlanejamentoMutations = () => {
  const queryClient = useQueryClient();

  const criarAcaoMutation = useMutation({
    mutationFn: (dados: Partial<AcaoSaude>) => planejamentoApi.criarAcao(dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planejamento', 'acoes'] });
    },
  });

  const atualizarStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      planejamentoApi.atualizarStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planejamento', 'acoes'] });
    },
  });

  const atualizarAcaoMutation = useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: Partial<AcaoSaude> }) =>
      planejamentoApi.atualizarAcao(id, dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planejamento', 'acoes'] });
    },
  });

  const deletarAcaoMutation = useMutation({
    mutationFn: (id: string) => planejamentoApi.deletarAcao(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planejamento', 'acoes'] });
    },
  });

  const criarMetaMutation = useMutation({
    mutationFn: (dados: Partial<MetaAnual>) => planejamentoApi.criarMeta(dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planejamento', 'metas'] });
    },
  });

  const atualizarProgressoMutation = useMutation({
    mutationFn: ({ id, valorAtual }: { id: string; valorAtual: number }) =>
      planejamentoApi.atualizarProgresso(id, valorAtual),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planejamento', 'metas'] });
    },
  });

  const deletarMetaMutation = useMutation({
    mutationFn: (id: string) => planejamentoApi.deletarMeta(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planejamento', 'metas'] });
    },
  });

  return {
    criarAcao: criarAcaoMutation,
    atualizarStatus: atualizarStatusMutation,
    atualizarAcao: atualizarAcaoMutation,
    deletarAcao: deletarAcaoMutation,
    criarMeta: criarMetaMutation,
    atualizarProgresso: atualizarProgressoMutation,
    deletarMeta: deletarMetaMutation,
  };
};
