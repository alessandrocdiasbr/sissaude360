import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Clock,
  Loader2,
  PhoneCall,
  Plus,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUnidades } from '../hooks/useAPS';
import { useChamarProximo, useEstatisticasDia, useFilaAtual, useGerarSenha, useSalasAtivas, useFinalizarAtendimento } from '../hooks/useFila';
import type { Ticket, TicketRisco, TicketTipo } from '../types/fila';

const RISCOS: Array<{ value: TicketRisco; label: string; color: string }> = [
  { value: 'VERMELHO', label: 'Vermelho (Imediato)', color: '#dc2626' },
  { value: 'LARANJA', label: 'Laranja (Muito urgente)', color: '#ea580c' },
  { value: 'AMARELO', label: 'Amarelo (Urgente)', color: '#ca8a04' },
  { value: 'VERDE', label: 'Verde (Pouco urgente)', color: '#16a34a' },
  { value: 'AZUL', label: 'Azul (Não urgente)', color: '#2563eb' },
  { value: 'BRANCO', label: 'Branco (Administrativo)', color: '#6b7280' },
];

const getRiscoStyle = (risco: string) => {
  const r = risco.toUpperCase();
  if (r === 'VERMELHO') return { badge: 'bg-red-100 text-red-700', dot: 'bg-red-600' };
  if (r === 'LARANJA') return { badge: 'bg-orange-100 text-orange-700', dot: 'bg-orange-600' };
  if (r === 'AMARELO') return { badge: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-600' };
  if (r === 'VERDE') return { badge: 'bg-green-100 text-green-700', dot: 'bg-green-600' };
  if (r === 'AZUL') return { badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-600' };
  return { badge: 'bg-slate-100 text-slate-600', dot: 'bg-slate-500' };
};

const minutesDiff = (fromIso?: string | null): number => {
  if (!fromIso) return 0;
  const from = new Date(fromIso).getTime();
  const now = Date.now();
  const diffMs = Math.max(now - from, 0);
  return Math.floor(diffMs / 60000);
};

const GestaoFila = () => {
  const navigate = useNavigate();

  const { data: unidades = [], isLoading: loadingUnidades } = useUnidades();
  const [unidadeId, setUnidadeId] = useState<string>('');

  useEffect(() => {
    if (!unidadeId && unidades.length > 0) setUnidadeId(unidades[0].id);
  }, [unidadeId, unidades]);

  const { data: filaData, isLoading: loadingFila } = useFilaAtual(unidadeId);
  const { data: salasData, isLoading: loadingSalas } = useSalasAtivas(unidadeId);
  const { data: statsData, isLoading: loadingStats } = useEstatisticasDia(unidadeId);

  const { mutateAsync: gerarSenhaAsync, isPending: isGerando } = useGerarSenha();
  const { mutateAsync: chamarAsync, isPending: isChamando } = useChamarProximo();
  const { mutateAsync: finalizarAsync, isPending: isFinalizando } = useFinalizarAtendimento();

  const [tipo, setTipo] = useState<TicketTipo>('NORMAL');
  const [risco, setRisco] = useState<TicketRisco>('VERDE');
  const [showSenhaModal, setShowSenhaModal] = useState(false);
  const [senhaGerada, setSenhaGerada] = useState<string>('');

  const fila = filaData?.dados ?? [];
  const salas = salasData?.dados ?? [];

  const aguardando = useMemo(
    () => fila.filter((t) => t.status === 'AGUARDANDO').slice(0, 100),
    [fila]
  );

  // Painel "Em atendimento": vem do endpoint de salas (include take:1)
  const emAtendimentoPorSala = useMemo(() => {
    return salas.map((s) => {
      const current = (s.tickets?.[0] ?? null) as Ticket | null;
      return { sala: s, ticket: current };
    });
  }, [salas]);

  // Timer com setInterval 1000ms
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((v) => (v + 1) % 1000000), 1000);
    return () => window.clearInterval(id);
  }, []);

  const handleEmitir = async () => {
    if (!unidadeId) return;
    const ticket = await gerarSenhaAsync({ unidadeId, tipo, risco });
    setSenhaGerada(ticket.senha);
    setShowSenhaModal(true);
  };

  const handleChamar = async (salaId: string) => {
    if (!unidadeId) return;
    await chamarAsync({ salaId, unidadeId });
  };

  const handleFinalizar = async (ticketId: string) => {
    if (!unidadeId) return;
    await finalizarAsync({ ticketId, unidadeId });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 h-full overflow-y-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors mb-2 font-medium group"
          >
            <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
            Voltar ao Hub
          </button>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gestão de Fila</h1>
          <p className="text-slate-500">Triagem (Protocolo de Manchester) com atualização por polling a cada 15s.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-3 items-start md:items-end">
          <FilterSelect
            label="Unidade"
            value={unidadeId}
            onChange={setUnidadeId}
            loading={loadingUnidades}
            options={unidades.map((u) => ({ id: u.id, nome: u.nome }))}
          />
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-xl text-sm font-bold border border-green-100">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Sistema Online
          </div>
        </div>
      </div>

      {/* Layout 3 colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Esquerda */}
        <div className="space-y-6">
          <div className="dashboard-card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900">Gerar Senha</h3>
                <p className="text-sm text-slate-500">Escolha tipo e risco Manchester.</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <Plus size={18} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <FilterSelect
                label="Tipo"
                value={tipo}
                onChange={(v) => setTipo(v as TicketTipo)}
                options={[
                  { id: 'NORMAL', nome: 'Normal' },
                  { id: 'PRIORITARIO', nome: 'Prioritário' },
                ]}
              />

              <RiscoSelect value={risco} onChange={setRisco} />

              <button
                disabled={!unidadeId || isGerando}
                onClick={handleEmitir}
                className="w-full py-3 bg-slate-900 text-white rounded-2xl font-bold shadow-sm hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isGerando ? <Loader2 className="animate-spin" size={18} /> : <PhoneCall size={18} />}
                Emitir Senha
              </button>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900">Salas Ativas</h3>
                <p className="text-sm text-slate-500">Chame o próximo ticket por sala.</p>
              </div>
            </div>

            {loadingSalas ? (
              <div className="h-24 bg-slate-100 animate-pulse rounded-2xl" />
            ) : salas.length === 0 ? (
              <div className="text-sm text-slate-500">Nenhuma sala ativa cadastrada para esta unidade.</div>
            ) : (
              <div className="space-y-2">
                {salas.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-slate-100 bg-slate-50/30">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">{s.numero}</p>
                      <p className="text-xs text-slate-500 font-medium">{s.tipo}</p>
                    </div>
                    <button
                      onClick={() => handleChamar(s.id)}
                      disabled={isChamando}
                      className="px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-60"
                    >
                      Chamar próximo
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Coluna Central */}
        <div className="dashboard-card">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-900">Em Atendimento</h3>
              <p className="text-sm text-slate-500">Tickets atuais por sala.</p>
            </div>
          </div>

          {loadingSalas ? (
            <div className="h-40 bg-slate-100 animate-pulse rounded-2xl" />
          ) : (
            <div className="space-y-4">
              {emAtendimentoPorSala.map(({ sala, ticket }) => {
                if (!ticket) {
                  return (
                    <div key={sala.id} className="p-4 rounded-2xl border border-slate-100 bg-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{sala.numero}</p>
                          <p className="text-sm text-slate-500 mt-1">Sem atendimento no momento</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-600">Livre</span>
                      </div>
                    </div>
                  );
                }

                const riscoStyle = getRiscoStyle(ticket.risco);
                const startedIso = ticket.chamadoEm ?? ticket.criadoEm;
                const mins = minutesDiff(startedIso);

                return (
                  <div key={sala.id} className="p-4 rounded-2xl border border-slate-100 bg-white">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{sala.numero}</p>
                        <p className="text-4xl font-extrabold text-slate-900 mt-2 tracking-tight">{ticket.senha}</p>
                        <div className="mt-3 flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${riscoStyle.badge}`}>
                            {ticket.risco}
                          </span>
                          <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                            <Clock size={14} />
                            {mins} min
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleFinalizar(ticket.id)}
                        disabled={isFinalizando}
                        className="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 disabled:opacity-60"
                      >
                        Finalizar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Coluna Direita */}
        <div className="space-y-6">
          <div className="dashboard-card !p-0 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/40">
              <h3 className="font-bold text-slate-900">Aguardando</h3>
              <p className="text-sm text-slate-500">Máximo 10 visíveis (scroll).</p>
            </div>

            <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
              {loadingFila ? (
                <div className="p-6">
                  <div className="h-16 bg-slate-100 animate-pulse rounded-2xl" />
                </div>
              ) : (
                <>
                  {aguardando.slice(0, 10).map((t) => {
                    const riscoStyle = getRiscoStyle(t.risco);
                    const mins = minutesDiff(t.criadoEm);
                    return (
                      <div key={t.id} className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                        <div className="min-w-0">
                          <p className="font-extrabold text-slate-900 text-lg">{t.senha}</p>
                          <p className="text-xs text-slate-500 font-medium">{mins} min aguardando</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${riscoStyle.badge}`}>
                          {t.risco}
                        </span>
                      </div>
                    );
                  })}
                  {aguardando.length === 0 && (
                    <div className="p-8 text-center text-slate-400 italic">Nenhum ticket aguardando.</div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <StatCard title="Aguardando" loading={loadingStats} value={statsData?.aguardando ?? 0} />
            <StatCard title="Em atendimento" loading={loadingStats} value={statsData?.emAtendimento ?? 0} />
            <StatCard title="Finalizados hoje" loading={loadingStats} value={statsData?.finalizados ?? 0} />
            <StatCard title="Tempo médio (min)" loading={loadingStats} value={statsData?.tempoMedioMin ?? 0} />
          </div>
        </div>
      </div>

      <SenhaModal open={showSenhaModal} senha={senhaGerada} onClose={() => setShowSenhaModal(false)} />

      {/* pequena dica quando não há salas cadastradas */}
      {salas.length === 0 && !loadingSalas && (
        <div className="text-xs text-slate-500">
          Dica: cadastre salas no banco (tabela Sala) para usar “Chamar próximo”.
        </div>
      )}
    </div>
  );
};

type SelectOption = { id: string; nome: string };
type FilterSelectProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  loading?: boolean;
};

const FilterSelect = ({ label, value, onChange, options, loading }: FilterSelectProps) => (
  <div className="flex flex-col gap-1.5 min-w-[200px]">
    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">{label}</label>
    <div className="relative">
      <select
        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer disabled:opacity-50 shadow-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.nome}
          </option>
        ))}
      </select>
      {loading && (
        <div className="absolute inset-y-0 right-3 flex items-center">
          <Loader2 className="animate-spin text-slate-400" size={16} />
        </div>
      )}
    </div>
  </div>
);

type RiscoSelectProps = { value: TicketRisco; onChange: (v: TicketRisco) => void };
const RiscoSelect = ({ value, onChange }: RiscoSelectProps) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Risco (Manchester)</label>
    <select
      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer shadow-sm"
      value={value}
      onChange={(e) => onChange(e.target.value as TicketRisco)}
    >
      {RISCOS.map((r) => (
        <option key={r.value} value={r.value}>
          {r.label}
        </option>
      ))}
    </select>
    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: RISCOS.find((r) => r.value === value)?.color }} />
      {value}
    </div>
  </div>
);

type StatCardProps = { title: string; value: number; loading: boolean };
const StatCard = ({ title, value, loading }: StatCardProps) => (
  <div className="dashboard-card border border-slate-100 bg-white">
    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">{title}</span>
    {loading ? <div className="h-8 bg-slate-100 animate-pulse rounded" /> : <div className="text-2xl font-extrabold text-slate-900">{value}</div>}
  </div>
);

type SenhaModalProps = { open: boolean; senha: string; onClose: () => void };
const SenhaModal = ({ open, senha, onClose }: SenhaModalProps) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Senha gerada</h3>
            <p className="text-sm text-slate-500 mt-1">Entregue ao paciente.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-50 text-slate-500">
            <X size={18} />
          </button>
        </div>
        <div className="p-10 flex items-center justify-center">
          <div className="text-5xl font-extrabold tracking-[0.2em] text-slate-900">{senha}</div>
        </div>
        <div className="p-6 border-t border-slate-100 bg-slate-50/40 flex items-center justify-end">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl font-bold text-sm bg-blue-600 text-white hover:bg-blue-700">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default GestaoFila;
