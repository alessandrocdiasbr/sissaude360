import type { Unidade } from '../services/apsService';

export type StatusFila = 
  'AGUARDANDO' | 'AGENDADO' | 'AGUARDA_REGULADOR' | 
  'ATENDIDO' | 'CANCELADO' | 'FALTA_DOCUMENTOS' | 'DEVOLVIDO';

export type PrioridadeFila = 'URGENCIA' | 'PRIORITARIO' | 'ELETIVA';

export interface HistoricoFila {
  id: string;
  solicitacaoId: string;
  statusAnterior?: StatusFila;
  statusNovo: StatusFila;
  observacao?: string;
  registradoEm: string;
  registradoPor?: string;
}

export interface SolicitacaoFila {
  id: string;
  pacienteNome: string;
  pacienteCns?: string;
  pacienteCpf?: string;
  pacienteNascimento?: string;
  pacienteTelefone?: string;
  procedimentoId: string;
  procedimento: {
    id: string;
    nome: string;
    subCategoria: {
      id: string;
      nome: string;
      categoria: { 
        id: string; 
        nome: string; 
        codigo: string; 
      };
    };
  };
  status: StatusFila;
  prioridade: PrioridadeFila;
  dataSolicitacao: string;
  dataAgendamento?: string;
  dataAtendimento?: string;
  dataAtualizacao: string;
  unidadeOrigemId: string;
  unidadeOrigem: Unidade;
  unidadeDestinoNome?: string;
  medicoSolicitante?: string;
  crmSolicitante?: string;
  observacoes?: string;
  motivoCancelamento?: string;
  historico: HistoricoFila[];
}

export interface CategoriaFila {
  id: string;
  codigo: string;
  nome: string;
  subCategorias: SubCategoriaFila[];
}

export interface SubCategoriaFila {
  id: string;
  codigo: string;
  nome: string;
  categoriaId: string;
  procedimentos: ProcedimentoFila[];
}

export interface ProcedimentoFila {
  id: string;
  codigo?: string;
  nome: string;
  subCategoriaId: string;
  ativo: boolean;
}

export interface EstatisticasFilaResponse {
  porStatus: Record<string, number>;
  porCategoria: Record<string, number>;
  porPrioridade: Record<string, number>;
  tempoMedioEsperaDias: number;
}

export interface FilaParams {
  status?: string;
  categoriaId?: string;
  subCategoriaId?: string;
  unidadeOrigemId?: string;
  prioridade?: string;
  dataInicio?: string;
  dataFim?: string;
  busca?: string;
  pagina?: number;
  limite?: number;
}

// Mantendo tipos Manchester para compatibilidade se necessário, mas com prefixo se houver conflito
// O usuário pediu substituição, mas vou manter o que não conflita
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
}
