import { useQuery } from '@tanstack/react-query';
import { listUnidades } from '../services/unidadeApi';

export const useUnidades = () => {
  return useQuery({
    queryKey: ['unidades'],
    queryFn: listUnidades,
  });
};
