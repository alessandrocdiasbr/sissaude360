import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as filaApi from '../services/filaApi';
import type { FilaParams } from '../types/fila';

export const useSolicitacoes = (filtros: FilaParams) => {
    return useQuery({
        queryKey: ['solicitacoes', filtros],
        queryFn: () => filaApi.getSolicitacoes(filtros),
        refetchInterval: 30000, // 30 segundos
    });
};

export const useEstatisticasFila = () => {
    return useQuery({
        queryKey: ['fila-estatisticas'],
        queryFn: filaApi.getEstatisticasFila,
        refetchInterval: 60000, // 60 segundos
    });
};

export const useCategorias = () => {
    return useQuery({
        queryKey: ['fila-categorias'],
        queryFn: filaApi.getCategorias,
        staleTime: Infinity, // Dados estáticos
    });
};

export const useSolicitacao = (id: string | null) => {
    return useQuery({
        queryKey: ['solicitacao', id],
        queryFn: () => (id ? filaApi.getSolicitacao(id) : null),
        enabled: !!id,
    });
};

export const useProcedimentos = (subCategoriaId?: string) => {
    return useQuery({
        queryKey: ['procedimentos', subCategoriaId],
        queryFn: () => filaApi.getProcedimentos(subCategoriaId),
        enabled: !!subCategoriaId,
    });
};

export const useCriarSolicitacao = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: filaApi.criarSolicitacao,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['solicitacoes'] });
            queryClient.invalidateQueries({ queryKey: ['fila-estatisticas'] });
        },
    });
};

export const useAtualizarStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...payload }: { id: string; novoStatus: string; observacao?: string; motivoCancelamento?: string; dataAgendamento?: string }) => 
            filaApi.atualizarStatus(id, payload),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['solicitacoes'] });
            queryClient.invalidateQueries({ queryKey: ['fila-estatisticas'] });
            queryClient.invalidateQueries({ queryKey: ['solicitacao', variables.id] });
        },
    });
};

export const useAtualizarSolicitacao = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...payload }: { id: string; [key: string]: any }) => 
            filaApi.atualizarSolicitacao(id, payload),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['solicitacoes'] });
            queryClient.invalidateQueries({ queryKey: ['solicitacao', variables.id] });
        },
    });
};
