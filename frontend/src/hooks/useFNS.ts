import { useQuery } from '@tanstack/react-query';
import { getDespesas, getResumoMunicipio, getConvenios } from '../services/fnsApi';

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
        staleTime: 1000 * 60 * 60, // 1 hora de cache (dados consolidados mudam pouco)
        enabled: !!ibge && !!ano,
    });
};

export const useConvenios = (ano: number, pagina = 1) => {
    return useQuery({
        queryKey: ['fns', 'convenios', ano, pagina],
        queryFn: () => getConvenios(ano, pagina),
        staleTime: 1000 * 60 * 30, // 30 minutos
    });
};
