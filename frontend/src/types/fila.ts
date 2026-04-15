import type { Unidade } from './aps';

export type TicketTipo = 'NORMAL' | 'PRIORITARIO';
export type TicketRisco = 'VERMELHO' | 'LARANJA' | 'AMARELO' | 'VERDE' | 'AZUL' | 'BRANCO';
export type TicketStatus = 'AGUARDANDO' | 'CHAMADO' | 'EM_ATENDIMENTO' | 'FINALIZADO';

export interface Ticket {
  id: string;
  senha: string;
  tipo: TicketTipo;
  risco: TicketRisco;
  status: TicketStatus;
  unidadeId: string;
  salaId?: string | null;
  criadoEm: string;
  chamadoEm?: string | null;
  finalizadoEm?: string | null;
  unidade?: Unidade;
  sala?: Sala | null;
}

export interface Sala {
  id: string;
  numero: string;
  tipo: string;
  ativo: boolean;
  unidadeId: string;
  unidade?: Unidade;
  tickets?: Ticket[]; // backend retorna include take:1 (chamado/em atendimento)
}

export interface ListaFilaResponse {
  dados: Ticket[];
}

export interface ListaSalasResponse {
  dados: Sala[];
}

export interface EstatisticasDiaResponse {
  aguardando: number;
  emAtendimento: number;
  finalizados: number;
  tempoMedioMin: number;
}

export interface GerarSenhaPayload {
  unidadeId: string;
  tipo: TicketTipo;
  risco: TicketRisco;
}

