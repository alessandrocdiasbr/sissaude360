import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getDespesas, getResumoMunicipio, getConvenios, sincronizarFNS } from '../services/fnsApi';

export const useDespesas = (ano: number, mes: number, pagina = 1) => {
    return useQuery({
        queryKey: ['fns', 'despesas', ano, mes, pagina],
        queryFn: () => getDespesas(ano, mes, pagina),
        staleTime: 1000 * 60 * 15, // 15 minutos de cache
    });
};

export const useResumoMunicipio = (ibge: string, ano: number) => {
    return useQuery({
        queryKey: ['fns', 'resumo', ibge, ano],
        queryFn: () => getResumoMunicipio(ibge, ano),
        staleTime: 1000 * 60 * 60, // 1 hora de cache
        enabled: !!ibge && !!ano,
    });
};

export const useConvenios = (ano: number, situacao?: string, pagina = 1) => {
    return useQuery({
        queryKey: ['fns', 'convenios', ano, situacao ?? 'todas', pagina],
        queryFn: () => getConvenios(ano, situacao, pagina),
        staleTime: 1000 * 60 * 30, // 30 minutos
    });
};

export const useSincronizarFNS = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ ano, ibge }: { ano: number, ibge: string }) => sincronizarFNS(ano, ibge),
        onSuccess: () => {
            // Invalida as queries do FNS para forçar recarregamento após sincronizar
            queryClient.invalidateQueries({ queryKey: ['fns'] });
        },
    });
};
