import React, { useState } from 'react';
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
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUnidades, useIndicadores, useAPSPerformance } from '../hooks/useAPS';

const AtencaoPrimaria = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'individual' | 'overview'>('individual');
  const [selectedUnidade, setSelectedUnidade] = useState<string>('Todas');
  const [selectedIndicador, setSelectedIndicador] = useState<string>(''); // Vazio inicialmente para pegar o primeiro da lista

  // Hooks de Dados Reais
  const { data: unidades = [], isLoading: loadingUnidades } = useUnidades();
  const { data: indicadores = [], isLoading: loadingIndicadores } = useIndicadores();
  
  // Ajustar indicador padrão caso nenhum esteja selecionado
  React.useEffect(() => {
    if (!selectedIndicador && indicadores.length > 0) {
      setSelectedIndicador(indicadores[0].id);
    }
  }, [indicadores, selectedIndicador]);

  const { 
    data: performanceData, 
    isLoading: loadingPerformance,
    isError: errorPerformance
  } = useAPSPerformance(
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
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 gap-4">
        <AlertCircle size={48} className="text-red-500" />
        <h2 className="text-xl font-bold text-slate-800">Erro ao carregar indicadores APS</h2>
        <p>Verifique sua conexão ou tente novamente mais tarde.</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold">Tentar Novamente</button>
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

        <div className="flex gap-4">
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
        </div>
      </div>

      {loadingPerformance ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 gap-4">
          <Loader2 className="animate-spin text-blue-600" size={32} />
          <p className="font-medium animate-pulse">Sincronizando com e-SUS APS...</p>
        </div>
      ) : activeTab === 'individual' ? (
        <IndividualView 
          data={resumoDashboard} 
          indicatorName={currentIndicator?.nome || 'Nenhum Selecionado'} 
          evolution={totalEvolucaoMedia} 
        />
      ) : (
        <OverviewView 
          unidadeName={currentUnidade?.nome || 'Todas as Unidades'} 
          resumo={resumoDashboard} 
        />
      )}
    </div>
  );
};

// --- Sub-Views ---

const IndividualView = ({ data, indicatorName, evolution }: any) => (
  <>
    {/* Stats Overview */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card title={`${indicatorName} (2026)`} value={data[0]?.valor2026 ? `${data[0].valor2026}%` : 'N/A'} status={data[0]?.status2026 || 'Pendente'} evolution={`${evolution}%`} up={parseFloat(evolution) >= 0} />
      <Card title="Crescimento Médio" value={`${evolution}%`} status={parseFloat(evolution) > 0 ? 'Bom' : 'Atenção'} evolution={`${evolution}%`} up={parseFloat(evolution) >= 0} />
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

const OverviewView = ({ unidadeName, resumo }: any) => (
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
          {resumo.map((item: any, idx: number) => (
            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-6 py-4 font-semibold text-slate-800">{item.indicador}</td>
              <td className="px-6 py-4">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusClass(item.status2026)}`}>
                  {item.status2026}
                </span>
              </td>
              <td className="px-6 py-4 text-slate-500">{item.valor2025}%</td>
              <td className="px-6 py-4 font-bold text-slate-900">{item.valor2026}%</td>
              <td className={`px-6 py-4 font-bold ${parseFloat(item.evolucao) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {parseFloat(item.evolucao) >= 0 ? '+' : ''}{item.evolucao}%
              </td>
            </tr>
          ))}
          {resumo.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">Nenhum dado de produção encontrado para os filtros selecionados.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

// --- Helpers & UI Components ---

const Card = ({ title, value, status, evolution, up }: any) => (
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

const FilterSelect = ({ label, value, onChange, options, loading }: any) => (
  <div className="flex flex-col gap-1.5 min-w-[180px]">
    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">{label}</label>
    <div className="relative">
      <select 
        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none shadow-sm transition-all appearance-none cursor-pointer disabled:opacity-50"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
      >
        {options.map((o: any) => (
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

const TabButton = ({ active, onClick, label, icon }: any) => (
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

const LegendItem = ({ color, label }: any) => (
  <div className="flex items-center gap-2">
    <div className={`w-3 h-3 ${color} rounded-full shadow-sm`}></div>
    <span className="text-slate-500">{label}</span>
  </div>
);

const getStatusClass = (status: string) => {
  switch (status) {
    case 'Ótimo': return 'bg-blue-100 text-blue-700';
    case 'Bom': return 'bg-green-100 text-green-700';
    case 'Suficiente': return 'bg-yellow-100 text-yellow-700';
    case 'Regular': return 'bg-red-100 text-red-700';
    default: return 'bg-slate-100 text-slate-600';
  }
};

export default AtencaoPrimaria;

