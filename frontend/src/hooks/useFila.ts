import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  chamarProximo,
  estatisticasDia,
  finalizarAtendimento,
  gerarSenha,
  iniciarAtendimento,
  listarFila,
  listarSalas,
} from '../services/filaApi';
import type { GerarSenhaPayload } from '../types/fila';

const POLL_MS = 15000;

export const useFilaAtual = (unidadeId?: string) => {
  return useQuery({
    queryKey: ['fila', 'atual', unidadeId],
    queryFn: () => listarFila(unidadeId!),
    enabled: !!unidadeId,
    refetchInterval: POLL_MS,
  });
};

export const useSalasAtivas = (unidadeId?: string) => {
  return useQuery({
    queryKey: ['fila', 'salas', unidadeId],
    queryFn: () => listarSalas(unidadeId!),
    enabled: !!unidadeId,
    refetchInterval: POLL_MS,
  });
};

export const useEstatisticasDia = (unidadeId?: string) => {
  return useQuery({
    queryKey: ['fila', 'estatisticas', unidadeId],
    queryFn: () => estatisticasDia(unidadeId!),
    enabled: !!unidadeId,
    refetchInterval: POLL_MS,
  });
};

export const useGerarSenha = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: GerarSenhaPayload) => gerarSenha(payload),
    onSuccess: async (ticket) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['fila', 'atual', ticket.unidadeId] }),
        queryClient.invalidateQueries({ queryKey: ['fila', 'estatisticas', ticket.unidadeId] }),
      ]);
    },
  });
};

export const useChamarProximo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ salaId, unidadeId }: { salaId: string; unidadeId: string }) => {
      const chamado = await chamarProximo(salaId);
      // Para cumprir o painel "Em Atendimento" com timer, iniciamos logo em seguida
      const iniciado = await iniciarAtendimento(chamado.id);
      return { ticket: iniciado, unidadeId };
    },
    onSuccess: async ({ unidadeId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['fila', 'atual', unidadeId] }),
        queryClient.invalidateQueries({ queryKey: ['fila', 'salas', unidadeId] }),
        queryClient.invalidateQueries({ queryKey: ['fila', 'estatisticas', unidadeId] }),
      ]);
    },
  });
};

export const useFinalizarAtendimento = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ticketId, unidadeId }: { ticketId: string; unidadeId: string }) => {
      const ticket = await finalizarAtendimento(ticketId);
      return { ticket, unidadeId };
    },
    onSuccess: async ({ unidadeId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['fila', 'atual', unidadeId] }),
        queryClient.invalidateQueries({ queryKey: ['fila', 'salas', unidadeId] }),
        queryClient.invalidateQueries({ queryKey: ['fila', 'estatisticas', unidadeId] }),
      ]);
    },
  });
};

