export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface DateRangeParams {
  dateFrom?: string;
  dateTo?: string;
}

export interface PatientFilters extends PaginationParams {
  search?: string;
  ine?: string;
}

export interface EsusPatient {
  id: string;
  nome: string;
  cns: string;
  cpf?: string;
  dataNascimento: string;
  sexo: string;
  telefone?: string;
  bairro?: string;
  logradouro?: string;
  ativo: boolean;
}

export interface ReferralFilters extends PaginationParams, DateRangeParams {
  specialty?: string;
  ine?: string;
}

export interface EsusReferral {
  id: string;
  pacienteNome: string;
  pacienteCns: string;
  especialidadeDestino: string;
  cid10?: string;
  ciap2?: string;
  hipoteseDiagnostica?: string;
  profissionalSolicitante: string;
  cbo?: string;
  dtSolicitacao: string;
  classificacaoRisco?: string;
  unidadeSaude?: string;
  observacao?: string;
}

export interface ProductionFilters extends DateRangeParams {
  ine?: string;
  cbo?: string;
}

export interface ProfessionalProduction {
  cnsProfissional: string;
  nomeProfissional: string;
  cbo: string;
  equipe: string;
  ine: string;
  totalAtendimentosIndividuais: number;
  totalAtendimentosOdonto: number;
  totalVisitasDomiciliares: number;
  totalAtividadesColetivas: number;
  totalProcedimentos: number;
  mediaAtendimentosDia: number;
}

export type IndicatorCode =
  | 'IND_01' | 'IND_02' | 'IND_03' | 'IND_04'
  | 'IND_05' | 'IND_06' | 'IND_07' | 'IND_08';

export interface IndicatorResult {
  code: IndicatorCode;
  name: string;
  description: string;
  numerador: number;
  denominador: number;
  resultado: number;
  meta: number;
  status: 'atingido' | 'em_andamento' | 'critico';
  trend?: number;
}

export interface IndicatorFilters {
  competencia: string;
  ine?: string;
}

export interface QueueFilters extends PaginationParams {
  status?: string;
  type?: string;
  priority?: string;
  specialty?: string;
  search?: string;
}

export interface CreateQueueItemDto {
  patientCns: string;
  patientName: string;
  type: 'PROCEDURE' | 'REFERRAL' | 'EXAM';
  description: string;
  specialty?: string;
  cid10?: string;
  ciap2?: string;
  priority?: 'URGENTE' | 'ALTA' | 'MEDIA' | 'BAIXA';
  sourceEsusId?: string;
  requestedByCns?: string;
  requestedAt: string;
  notes?: string;
}

export interface UpdateQueueStatusDto {
  status: 'AGUARDANDO' | 'AGENDADO' | 'REALIZADO' | 'CANCELADO';
  scheduledAt?: string;
  notes?: string;
  performedBy: string;
}
