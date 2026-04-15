import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Grid3X3,
  TrendingUp,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Plus,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCriarProducao, useDashboard, useIndicadores, useUnidades } from '../hooks/useAPS';
import type { Indicador, ProducaoComparativo, ProducaoPayload, Unidade } from '../types/aps';

const AtencaoPrimaria = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'individual' | 'overview'>('individual');
  const [selectedUnidade, setSelectedUnidade] = useState<string>('Todas');
  const [selectedIndicador, setSelectedIndicador] = useState<string>(''); // Vazio inicialmente para pegar o primeiro da lista
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Hooks de Dados Reais
  const { data: unidades = [], isLoading: loadingUnidades } = useUnidades();
  const { data: indicadores = [], isLoading: loadingIndicadores } = useIndicadores();
  
  // Ajustar indicador padrão caso nenhum esteja selecionado
  useEffect(() => {
    if (!selectedIndicador && indicadores.length > 0) {
      setSelectedIndicador(indicadores[0].id);
    }
  }, [indicadores, selectedIndicador]);

  const { 
    data: performanceData, 
    isLoading: loadingPerformance,
    isError: errorPerformance,
    refetch: refetchDashboard
  } = useDashboard(
    selectedUnidade === 'Todas' ? undefined : selectedUnidade,
    selectedIndicador || undefined
  );

  const currentIndicator = indicadores.find(i => i.id === selectedIndicador);
  const currentUnidade = unidades.find(u => u.id === selectedUnidade);

  // Valores Consolidados para os Cards do Topo
  const resumoDashboard = performanceData?.resumo || [];
  const totalEvolucaoMedia = resumoDashboard.length > 0
    ? (resumoDashboard.reduce((acc, curr) => acc + parseFloat(curr.evolucao), 0) / resumoDashboard.length).toFixed(1)
    : '0';

  if (errorPerformance) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[320px] text-slate-500 gap-4 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <AlertCircle size={48} className="text-red-500" />
          <h2 className="text-xl font-bold text-slate-800">Não foi possível carregar o dashboard APS</h2>
          <p className="text-sm text-slate-500 text-center max-w-md">
            Pode ser instabilidade momentânea no servidor ou sua conexão. Tente novamente.
          </p>
          <button
            onClick={() => void refetchDashboard()}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-sm hover:bg-blue-700 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 h-full overflow-y-auto">
      {/* Header & Main Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors mb-2 font-medium group"
          >
            <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
            Voltar ao Hub
          </button>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Atenção Primária
          </h1>
          <p className="text-slate-500">Monitoramento Geral de Indicadores de Saúde</p>
        </div>
        
        <div className="flex gap-3 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
          <TabButton active={activeTab === 'individual'} onClick={() => setActiveTab('individual')} label="Análise Individual" icon={<TrendingUp size={16} />} />
          <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} label="Visão Geral Unidade" icon={<Grid3X3 size={16} />} />
        </div>

        <div className="flex gap-4 items-end">
          <FilterSelect 
            label="Unidade/Equipe" 
            value={selectedUnidade} 
            onChange={setSelectedUnidade} 
            options={[{id: 'Todas', nome: 'Todas as Equipes'}, ...unidades]} 
            loading={loadingUnidades}
          />
          {activeTab === 'individual' && (
            <FilterSelect 
              label="Indicador Principal" 
              value={selectedIndicador} 
              onChange={setSelectedIndicador} 
              options={indicadores} 
              loading={loadingIndicadores}
            />
          )}

          <button
            onClick={() => setIsModalOpen(true)}
            className="h-[42px] px-4 rounded-xl bg-slate-900 text-white font-bold text-sm shadow-sm hover:bg-slate-800 transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            Lançar Produção
          </button>
        </div>
      </div>

      {loadingPerformance ? (
        <LoadingSkeleton />
      ) : activeTab === 'individual' ? (
        <IndividualView 
          data={resumoDashboard} 
          indicatorName={currentIndicator?.nome || 'Nenhum Selecionado'}
          indicador={currentIndicator}
          evolution={totalEvolucaoMedia} 
        />
      ) : (
        <OverviewView 
          unidadeName={currentUnidade?.nome || 'Todas as Unidades'} 
          resumo={resumoDashboard} 
          indicadores={indicadores}
        />
      )}

      <LancarProducaoModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        indicadores={indicadores}
        unidades={unidades}
        defaultIndicadorId={selectedIndicador}
        defaultUnidadeId={selectedUnidade === 'Todas' ? '' : selectedUnidade}
        onSuccess={() => {
          setIsModalOpen(false);
          void refetchDashboard();
        }}
      />
    </div>
  );
};

// --- Sub-Views ---

type IndividualViewProps = {
  data: ProducaoComparativo[];
  indicatorName: string;
  evolution: string;
  indicador?: Indicador;
};

const IndividualView = ({ data, indicatorName, evolution, indicador }: IndividualViewProps) => (
  <>
    {/* Stats Overview */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card
        title={`${indicatorName} (2026)`}
        value={typeof data[0]?.valor2026 === 'number' ? `${data[0].valor2026}%` : 'N/A'}
        status={indicador ? getStatusLabelByScore(data[0]?.valor2026 ?? null, indicador) : (data[0]?.status2026 || 'Pendente')}
        evolution={`${evolution}%`}
        up={parseFloat(evolution) >= 0}
      />
      <Card title="Crescimento Médio" value={`${evolution}%`} status={parseFloat(evolution) > 0 ? 'Bom' : 'Regular'} evolution={`${evolution}%`} up={parseFloat(evolution) >= 0} />
      <Card title="Qtde Indicadores" value={data.length} status="Análise" evolution="Ativos" up />
      <Card title="Status do Ciclo" value="Em Foco" status="Suficiente" evolution="Ciclo 2026" up />
    </div>

    {/* Main Charts area */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 dashboard-card !p-8">
        <div className="flex justify-between items-center mb-8">
          <h3 className="font-bold text-lg text-slate-800">Comparativo Anual: {indicatorName}</h3>
          <div className="flex gap-4 text-xs font-medium">
            <LegendItem color="bg-blue-500" label="2026" />
            <LegendItem color="bg-slate-300" label="2025" />
          </div>
        </div>
        
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
              <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="valor2025" name="2025" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={34} />
              <Bar dataKey="valor2026" name="2026" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={34} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="dashboard-card border-l-4 border-l-blue-500 flex flex-col">
        <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2">
          <AlertCircle size={20} className="text-blue-500" /> Análise de Gestão
        </h3>
        <div className="space-y-6 flex-1 text-slate-600 font-medium">
          <div className="p-4 bg-blue-50 rounded-xl">
            <p className="text-sm text-blue-800 leading-relaxed">
              Baseado nos dados reais do <strong>e-SUS</strong>, o desempenho global para <strong>{indicatorName}</strong> reflete a produção consolidada das equipes.
            </p>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ações Recomendadas</h4>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs leading-relaxed">
              • Intensificar as buscas ativas conforme cronograma.<br/><br/>
              • Validar as fichas de atendimento no PEC para garantir o processamento correto.
            </div>
          </div>
        </div>
      </div>
    </div>
  </>
);

type OverviewViewProps = {
  unidadeName: string;
  resumo: ProducaoComparativo[];
  indicadores: Indicador[];
};

const OverviewView = ({ unidadeName, resumo, indicadores }: OverviewViewProps) => {
  // Consolida por indicador (média dos meses do ano 2025/2026)
  const rows = useMemo(() => {
    type Acc = { indicador: string; sum2025: number; cnt2025: number; sum2026: number; cnt2026: number; evolucaoSum: number; evolucaoCnt: number };
    const acc = new Map<string, Acc>();

    for (const item of resumo) {
      const key = item.indicador;
      const prev = acc.get(key) ?? { indicador: key, sum2025: 0, cnt2025: 0, sum2026: 0, cnt2026: 0, evolucaoSum: 0, evolucaoCnt: 0 };

      prev.sum2025 += item.valor2025;
      prev.cnt2025 += 1;

      if (typeof item.valor2026 === 'number') {
        prev.sum2026 += item.valor2026;
        prev.cnt2026 += 1;
      }

      const e = Number(item.evolucao);
      if (!Number.isNaN(e)) {
        prev.evolucaoSum += e;
        prev.evolucaoCnt += 1;
      }

      acc.set(key, prev);
    }

    const result = Array.from(acc.values()).map((a) => {
      const valor2025 = a.cnt2025 ? a.sum2025 / a.cnt2025 : 0;
      const valor2026 = a.cnt2026 ? a.sum2026 / a.cnt2026 : null;
      const evolucao = a.evolucaoCnt ? a.evolucaoSum / a.evolucaoCnt : 0;

      const indicador = indicadores.find((i) => i.nome === a.indicador);
      const status2026 = indicador ? getStatusLabelByScore(valor2026, indicador) : (valor2026 === null ? 'Pendente' : 'Suficiente');

      return { indicador: a.indicador, valor2025, valor2026, evolucao, status2026 };
    });

    return result.sort((a, b) => a.indicador.localeCompare(b.indicador));
  }, [resumo, indicadores]);

  return (
  <div className="dashboard-card !p-0 overflow-hidden">
    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
      <h3 className="font-bold text-lg text-slate-800">Visão Geral: {unidadeName}</h3>
      <p className="text-sm text-slate-500">Comparativo consolidado de indicadores reais para esta visão.</p>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
            <th className="px-6 py-4">Indicador</th>
            <th className="px-6 py-4">Status 2026</th>
            <th className="px-6 py-4">Valor 2025</th>
            <th className="px-6 py-4">Valor 2026</th>
            <th className="px-6 py-4">Variação (%)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {rows.map((item) => (
            <tr key={item.indicador} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-6 py-4 font-semibold text-slate-800">{item.indicador}</td>
              <td className="px-6 py-4">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusClass(item.status2026)}`}>
                  {item.status2026}
                </span>
              </td>
              <td className="px-6 py-4 text-slate-500">{item.valor2025.toFixed(1)}%</td>
              <td className="px-6 py-4 font-bold text-slate-900">{item.valor2026 === null ? 'N/A' : `${item.valor2026.toFixed(1)}%`}</td>
              <td className={`px-6 py-4 font-bold ${item.evolucao >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {item.evolucao >= 0 ? '+' : ''}{item.evolucao.toFixed(1)}%
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">Nenhum dado de produção encontrado para os filtros selecionados.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
  );
};

// --- Helpers & UI Components ---

type CardProps = {
  title: string;
  value: string | number;
  status: string;
  evolution: string;
  up: boolean;
};

const Card = ({ title, value, status, evolution, up }: CardProps) => (
  <div className="dashboard-card group hover:scale-[1.02] transition-all">
    <div className="flex justify-between items-start mb-4">
      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</span>
      <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${getStatusClass(status)}`}>
        {status}
      </div>
    </div>
    <div className="flex items-baseline gap-2">
      <h2 className="text-3xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{value}</h2>
      <div className={`flex items-center text-sm font-semibold ${up ? 'text-green-600' : 'text-red-600'}`}>
        {up ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
        {evolution}
      </div>
    </div>
  </div>
);

type SelectOption = { id: string; nome: string };
type FilterSelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  loading?: boolean;
};

const FilterSelect = ({ label, value, onChange, options, loading }: FilterSelectProps) => (
  <div className="flex flex-col gap-1.5 min-w-[180px]">
    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">{label}</label>
    <div className="relative">
      <select 
        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none shadow-sm transition-all appearance-none cursor-pointer disabled:opacity-50"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>{o.nome}</option>
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

type TabButtonProps = {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactElement;
};

const TabButton = ({ active, onClick, label, icon }: TabButtonProps) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
      active ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
    }`}
  >
    {icon}
    {label}
  </button>
);

type LegendItemProps = { color: string; label: string };
const LegendItem = ({ color, label }: LegendItemProps) => (
  <div className="flex items-center gap-2">
    <div className={`w-3 h-3 ${color} rounded-full shadow-sm`}></div>
    <span className="text-slate-500">{label}</span>
  </div>
);

const getStatusClass = (status: string) => {
  const s = status.toLowerCase();
  if (s.includes('ótimo') || s.includes('otimo')) return 'bg-blue-100 text-blue-700';
  if (s.includes('bom')) return 'bg-green-100 text-green-700';
  if (s.includes('suficiente')) return 'bg-yellow-100 text-yellow-700';
  if (s.includes('regular')) return 'bg-red-100 text-red-700';
  return 'bg-slate-100 text-slate-600';
};

const getStatusLabelByScore = (score: number | null, indicador: Indicador): string => {
  if (score === null) return 'Pendente';
  if (score < indicador.metaRegular) return 'Regular';
  if (score < indicador.metaBom) return 'Suficiente';
  if (score < indicador.metaOtimo) return 'Bom';
  return 'Ótimo';
};

const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: 3 }).map((_, i) => (
      <div
        key={i}
        className="h-28 rounded-2xl bg-slate-200/60 animate-pulse"
      />
    ))}
  </div>
);

type LancarProducaoModalProps = {
  open: boolean;
  onClose: () => void;
  indicadores: Indicador[];
  unidades: Unidade[];
  defaultIndicadorId?: string;
  defaultUnidadeId?: string;
  onSuccess: () => void;
};

const LancarProducaoModal = ({
  open,
  onClose,
  indicadores,
  unidades,
  defaultIndicadorId,
  defaultUnidadeId,
  onSuccess,
}: LancarProducaoModalProps) => {
  const { mutateAsync, isPending, isError, error } = useCriarProducao();

  const [indicadorId, setIndicadorId] = useState(defaultIndicadorId ?? '');
  const [unidadeId, setUnidadeId] = useState(defaultUnidadeId ?? '');
  const [numerador, setNumerador] = useState('');
  const [denominador, setDenominador] = useState('');
  const [mes, setMes] = useState<number>(new Date().getMonth() + 1);
  const [ano, setAno] = useState<2025 | 2026>(2026);

  useEffect(() => {
    if (open) {
      setIndicadorId(defaultIndicadorId ?? '');
      setUnidadeId(defaultUnidadeId ?? '');
      setNumerador('');
      setDenominador('');
      setMes(new Date().getMonth() + 1);
      setAno(2026);
    }
  }, [open, defaultIndicadorId, defaultUnidadeId]);

  if (!open) return null;

  const canSubmit =
    indicadorId &&
    unidadeId &&
    numerador.trim().length > 0 &&
    denominador.trim().length > 0 &&
    Number(denominador) > 0;

  const handleSave = async () => {
    const payload: ProducaoPayload = {
      indicadorId,
      unidadeId,
      mes,
      ano,
      numerador: Number(numerador),
      denominador: Number(denominador),
    };
    await mutateAsync(payload);
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Lançar Produção</h3>
            <p className="text-sm text-slate-500 mt-1">Registre numerador e denominador para calcular a pontuação.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-50 text-slate-500">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FilterSelect
              label="Indicador"
              value={indicadorId}
              onChange={setIndicadorId}
              options={indicadores.map((i) => ({ id: i.id, nome: i.nome }))}
              loading={false}
            />
            <FilterSelect
              label="Unidade"
              value={unidadeId}
              onChange={setUnidadeId}
              options={unidades.map((u) => ({ id: u.id, nome: u.nome }))}
              loading={false}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <NumberInput label="Numerador" value={numerador} onChange={setNumerador} />
            <NumberInput label="Denominador" value={denominador} onChange={setDenominador} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MonthSelect value={mes} onChange={setMes} />
            <YearSelect value={ano} onChange={setAno} />
          </div>

          {isError && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl text-sm font-medium">
              <AlertCircle size={18} />
              <span>Falha ao salvar a produção. {error instanceof Error ? error.message : ''}</span>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/40 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:bg-white border border-slate-200">
            Cancelar
          </button>
          <button
            disabled={!canSubmit || isPending}
            onClick={handleSave}
            className="px-4 py-2.5 rounded-xl font-bold text-sm bg-blue-600 text-white shadow-sm hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isPending ? <Loader2 className="animate-spin" size={16} /> : null}
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};

type NumberInputProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
};

const NumberInput = ({ label, value, onChange }: NumberInputProps) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">{label}</label>
    <input
      inputMode="decimal"
      type="number"
      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none shadow-sm transition-all"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      min={0}
    />
  </div>
);

type MonthSelectProps = { value: number; onChange: (v: number) => void };
const MonthSelect = ({ value, onChange }: MonthSelectProps) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Mês</label>
    <select
      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none shadow-sm transition-all appearance-none cursor-pointer"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    >
      {Array.from({ length: 12 }).map((_, idx) => {
        const m = idx + 1;
        return (
          <option key={m} value={m}>
            {m.toString().padStart(2, '0')}
          </option>
        );
      })}
    </select>
  </div>
);

type YearSelectProps = { value: 2025 | 2026; onChange: (v: 2025 | 2026) => void };
const YearSelect = ({ value, onChange }: YearSelectProps) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Ano</label>
    <select
      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none shadow-sm transition-all appearance-none cursor-pointer"
      value={value}
      onChange={(e) => onChange(Number(e.target.value) as 2025 | 2026)}
    >
      <option value={2025}>2025</option>
      <option value={2026}>2026</option>
    </select>
  </div>
);

export default AtencaoPrimaria;

