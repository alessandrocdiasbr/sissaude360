import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, 
  TrendingUp, 
  Users, 
  FileText, 
  Search, 
  Info, 
  ExternalLink, 
  Plus, 
  X, 
  Save, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend 
} from 'recharts';

import { 
  useIndicadoresAPS, 
  useUnidadesAPS, 
  useResultadoPorIndicador, 
  useResultadoPorEquipe, 
  useEvolucaoAPS, 
  useCriarProducao 
} from '../hooks/useAPS';
import type { 
  ViewAPS, 
  TipoEquipe, 
  StatusAPS 
} from '../services/apsService';

// --- Constantes ---
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

const AtencaoPrimaria = () => {
  const navigate = useNavigate();

  // --- Estados de Filtro ---
  const [view, setView] = useState<ViewAPS>('indicador');
  const [tiposAtivos, setTiposAtivos] = useState<TipoEquipe[]>(['eSF']);
  const [indicadorId, setIndicadorId] = useState<string>('');
  const [unidadeId, setUnidadeId] = useState<string>('');
  const [mes, setMes] = useState<number>(new Date().getMonth() + 1);
  const [ano, setAno] = useState<number>(new Date().getFullYear());
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filtros aplicados (só mudam no clique do botão)
  const [filtrosAplicados, setFiltrosAplicados] = useState({
    view: 'indicador',
    tipos: 'eSF',
    indicadorId: '',
    unidadeId: '',
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear()
  });

  // --- Dados Base ---
  const { data: indicadores = [], isLoading: loadingInds } = useIndicadoresAPS();
  const { data: unidades = [], isLoading: loadingUnits } = useUnidadesAPS();

  // Inicialização de IDs padrão
  useEffect(() => {
    if (indicadores.length > 0 && !indicadorId) {
      setIndicadorId(indicadores[0].id);
      setFiltrosAplicados(prev => ({ ...prev, indicadorId: indicadores[0].id }));
    }
  }, [indicadores, indicadorId]);

  useEffect(() => {
    if (unidades.length > 0 && !unidadeId) {
      setUnidadeId(unidades[0].id);
      setFiltrosAplicados(prev => ({ ...prev, unidadeId: unidades[0].id }));
    }
  }, [unidades, unidadeId]);

  // --- Queries TanStack ---
  const resIndicador = useResultadoPorIndicador({
    indicadorId: filtrosAplicados.indicadorId,
    mes: filtrosAplicados.mes,
    ano: filtrosAplicados.ano,
    tipos: filtrosAplicados.tipos
  }, filtrosAplicados.view === 'indicador' && !!filtrosAplicados.indicadorId);

  const resEquipe = useResultadoPorEquipe({
    unidadeId: filtrosAplicados.unidadeId,
    mes: filtrosAplicados.mes,
    ano: filtrosAplicados.ano
  }, filtrosAplicados.view === 'equipe' && !!filtrosAplicados.unidadeId);

  const resEvolucao = useEvolucaoAPS({
    indicadorId: filtrosAplicados.indicadorId,
    tipos: filtrosAplicados.tipos,
    meses: 8
  }, filtrosAplicados.view === 'competencia' && !!filtrosAplicados.indicadorId);

  // --- Handlers ---
  const handleAplicarFiltros = () => {
    setFiltrosAplicados({
      view,
      tipos: tiposAtivos.join(','),
      indicadorId,
      unidadeId,
      mes,
      ano
    });
  };

  const toggleTipo = (tipo: TipoEquipe) => {
    setTiposAtivos(prev => {
      if (prev.includes(tipo)) {
        return prev.length > 1 ? prev.filter(t => t !== tipo) : prev;
      }
      return [...prev, tipo];
    });
  };

  // Gerar opções de competência (últimos 12 meses)
  const competenciaOptions = useMemo(() => {
    const options = [];
    const agora = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      const a = d.getFullYear();
      const label = formatCompLabel(m, a);
      options.push({ m, a, label });
    }
    return options;
  }, []);

  return (
    <div className="min-h-screen bg-indigo-50/50 p-6 md:p-8 space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <button 
            onClick={() => navigate('/')} 
            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors mb-2 font-bold group text-xs uppercase tracking-widest"
          >
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            Voltar ao Menu Principal
          </button>
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <TrendingUp size={24} />
             </div>
             <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Atenção Primária</h1>
                <p className="text-slate-500 text-sm font-medium">Monitoramento de Desempenho e Indicadores Previne Brasil</p>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-3 px-6 py-4 bg-slate-900 text-white rounded-[1.25rem] font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-95 border-b-4 border-slate-700"
          >
            <Plus size={18} /> Lançar Produção
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl shadow-indigo-500/5 overflow-hidden">
        {/* Navigation Tabs */}
        <div className="bg-slate-50 border-b border-slate-200 p-2 flex gap-2">
          <TabLink active={view === 'competencia'} onClick={() => setView('competencia')} icon={<TrendingUp size={18} />} label="Visão por Competência" />
          <TabLink active={view === 'equipe'} onClick={() => setView('equipe')} icon={<Users size={18} />} label="Visão por Equipe" />
          <TabLink active={view === 'indicador'} onClick={() => setView('indicador')} icon={<FileText size={18} />} label="Visão por Indicador" />
        </div>

        {/* Filters Panel */}
        <div className="p-8 border-b border-slate-100 flex flex-col lg:flex-row items-end gap-6 bg-white">
          <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Tipo de Equipe Chips */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Equipe</label>
              <div className="flex gap-2">
                <TipoChip active={tiposAtivos.includes('eSF')} onClick={() => toggleTipo('eSF')} label="eSF" />
                <TipoChip active={tiposAtivos.includes('eAP')} onClick={() => toggleTipo('eAP')} label="eAP" />
              </div>
            </div>

            {/* Condições Select (Fixo) */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Condição</label>
              <select className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl px-4 font-bold text-slate-600 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer">
                <option>Somente equipes homologadas</option>
              </select>
            </div>

            {/* Indicador Select (Só visões Ind/Comp) */}
            <div className={`space-y-2 transition-opacity ${view === 'equipe' ? 'opacity-30 pointer-events-none' : ''}`}>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Indicador de Saúde</label>
              <select 
                value={indicadorId}
                onChange={e => setIndicadorId(e.target.value)}
                className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl px-4 font-bold text-slate-600 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer truncate"
              >
                {indicadores.map(i => <option key={i.id} value={i.id}>{i.nome}</option>)}
              </select>
            </div>

            {/* Equipe/Competência dependente da visão */}
            <div className="space-y-2">
              {view === 'equipe' ? (
                <>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Equipe de Saúde</label>
                  <select 
                    value={unidadeId}
                    onChange={e => setUnidadeId(e.target.value)}
                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl px-4 font-bold text-slate-600 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer"
                  >
                    {unidades.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                  </select>
                </>
              ) : (
                <>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mês de Referência</label>
                  <select 
                    value={`${mes}-${ano}`}
                    onChange={e => {
                      const [m, a] = e.target.value.split('-').map(Number);
                      setMes(m); setAno(a);
                    }}
                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl px-4 font-bold text-slate-600 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer"
                  >
                    {competenciaOptions.map(opt => <option key={opt.label} value={`${opt.m}-${opt.a}`}>{opt.label}</option>)}
                  </select>
                </>
              )}
            </div>
          </div>

          <button 
            onClick={handleAplicarFiltros}
            className="px-8 h-12 bg-blue-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] hover:bg-blue-800 transition-all shadow-lg shadow-blue-500/10 active:scale-95 min-w-[150px]"
          >
            Aplicar Filtros
          </button>
        </div>

        {/* Results Panel */}
        <div className="p-8 space-y-8">
          {/* Result Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-50 pb-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Resultado</h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                {filtrosAplicados.view === 'indicador' && (
                  <>
                    <p className="text-sm font-medium text-slate-500">Indicador: <span className="text-slate-900 font-bold">{indicadores.find(i => i.id === filtrosAplicados.indicadorId)?.nome}</span></p>
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    <p className="text-sm font-medium text-slate-500">Mês: <span className="text-slate-900 font-bold">{formatCompLabel(filtrosAplicados.mes, filtrosAplicados.ano)}</span></p>
                  </>
                )}
                {filtrosAplicados.view === 'equipe' && (
                  <p className="text-sm font-medium text-slate-500">Equipe: <span className="text-slate-900 font-bold">{unidades.find(u => u.id === filtrosAplicados.unidadeId)?.nome}</span></p>
                )}
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                <p className="text-sm font-medium text-slate-500 text-nowrap">Tipos: <span className="text-slate-900 font-bold">{filtrosAplicados.tipos}</span></p>
                
                {(resIndicador.data?.isPreliminar || resEquipe.data?.isPreliminar || resEvolucao.data?.isPreliminar) && (
                  <span className="ml-2 px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1.5">
                    <Info size={12} /> Dado Preliminar
                  </span>
                )}
              </div>
            </div>

            {filtrosAplicados.view === 'indicador' && (
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Pesquisar equipe..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/5"
                />
              </div>
            )}
          </div>

          {/* Dynamic Content */}
          <div className="min-h-[400px]">
            {view === 'indicador' && (
              <ResultIndicador 
                loading={resIndicador.isLoading} 
                error={resIndicador.isError} 
                data={resIndicador.data} 
                search={search} 
              />
            )}
            {view === 'equipe' && (
              <ResultEquipe 
                loading={resEquipe.isLoading} 
                error={resEquipe.isError} 
                data={resEquipe.data} 
              />
            )}
            {view === 'competencia' && (
              <ResultEvolucao 
                loading={resEvolucao.isLoading} 
                error={resEvolucao.isError} 
                data={resEvolucao.data} 
              />
            )}
          </div>
        </div>

        {/* Footer Score Panel */}
        <ScorePanel 
          indicador={indicadores.find(i => i.id === filtrosAplicados.indicadorId)} 
        />
      </div>

      <LancarProducaoModal 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        indicadores={indicadores}
        unidades={unidades}
      />
    </div>
  );
};

// --- Sub-Components ---

const TabLink = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-3 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-tighter transition-all ${active ? 'bg-white text-blue-600 shadow-sm border border-slate-200 ring-4 ring-slate-100' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
  >
    {icon} {label}
  </button>
);

const TipoChip = ({ active, onClick, label }: any) => (
  <button 
    onClick={onClick}
    className={`h-10 px-6 rounded-xl font-black text-xs transition-all border-2 ${active ? 'bg-blue-50 border-blue-600 text-blue-700' : 'border-slate-200 text-slate-500 bg-white hover:border-slate-400'}`}
  >
    {label}
  </button>
);

const ResultIndicador = ({ loading, error, data, search }: any) => {
  if (loading) return <SkeletonTable />;
  if (error) return <ErrorCard />;
  
  const filteredEquipes = data?.equipes.filter((e: any) => 
    e.equipe.toLowerCase().includes(search.toLowerCase()) || 
    e.ubs.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto border border-slate-100 rounded-3xl">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-[10px] text-slate-400 font-black uppercase tracking-widest border-b border-slate-100">
              <th className="px-8 py-4 w-[50%]">Unidade e Equipe</th>
              <th className="px-8 py-4">Status</th>
              <th className="px-8 py-4 text-right">Pontuação (%)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredEquipes.map((e: any) => (
              <tr key={e.id} className="hover:bg-indigo-50/20 transition-all group">
                <td className="px-8 py-5">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-800 uppercase tracking-tighter group-hover:text-blue-600 transition-colors">{e.ubs}</span>
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-0.5">
                      Equipe: {e.equipe} · <span className="text-blue-500/70">{e.tipo}</span>
                    </span>
                  </div>
                </td>
                <td className="px-8 py-5">
                   {e.status ? (
                     <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusStyle(e.status)}`}>
                        {e.status}
                     </span>
                   ) : (
                     <span className="text-slate-300 font-bold text-xs">—</span>
                   )}
                </td>
                <td className={`px-8 py-5 text-right font-black text-lg tabular-nums ${getValueStyle(e.status)}`}>
                  {e.pontuacao !== null ? e.pontuacao.toFixed(1).replace('.', ',') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs font-bold text-slate-400">Quantidade de itens: {filteredEquipes.length}</p>
    </div>
  );
};

const ResultEquipe = ({ loading, error, data }: any) => {
  if (loading) return <SkeletonTable rows={10} />;
  if (error) return <ErrorCard />;

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto border border-slate-100 rounded-3xl">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-[10px] text-slate-400 font-black uppercase tracking-widest border-b border-slate-100">
              <th className="px-8 py-4 w-[60%]">Indicador de Saúde</th>
              <th className="px-8 py-4 text-center">Status</th>
              <th className="px-8 py-4 text-right">Resultado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data?.indicadores.map((ind: any) => (
              <tr key={ind.id} className="hover:bg-indigo-50/20 transition-all">
                <td className="px-8 py-5">
                  <span className="font-black text-slate-900 uppercase tracking-tighter text-sm">{ind.nome}</span>
                </td>
                <td className="px-8 py-5 text-center">
                  {ind.status ? (
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusStyle(ind.status)}`}>
                      {ind.status}
                    </span>
                  ) : <span className="text-slate-300">—</span>}
                </td>
                <td className="px-8 py-5 text-right">
                  <div className="flex flex-col items-end gap-2">
                    <span className={`font-black text-lg ${getValueStyle(ind.status)} tabular-nums`}>
                      {ind.pontuacao !== null ? `${ind.pontuacao.toFixed(1).replace('.', ',')}%` : '—'}
                    </span>
                    <div className="w-32 bg-slate-100 h-1 rounded-full overflow-hidden">
                       <div 
                         className={`h-full transition-all duration-700 ${getBarColor(ind.status)}`} 
                         style={{ width: `${Math.min(ind.pontuacao || 0, 100)}%` }}
                       />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs font-bold text-slate-400">Total de indicadores: {data?.indicadores.length}</p>
    </div>
  );
};

const ResultEvolucao = ({ loading, error, data }: any) => {
  if (loading) return <SkeletonChart />;
  if (error) return <ErrorCard />;

  const chartData = data?.competencias.map((comp: string, idx: number) => {
     const point: any = { comp };
     data.series.forEach((s: any) => {
       point[s.equipe] = s.dados[idx];
     });
     return point;
  }) || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-4">
         <div>
            <h4 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">{data?.indicador.nome}</h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold text-slate-500 px-2 py-0.5 bg-slate-100 rounded">Jul/25 — Fev/26</span>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-tighter">{data?.series.length} Equipes</span>
            </div>
         </div>
      </div>
      
      <div className="h-[320px] w-full pr-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="5 5" stroke="#f1f5f9" vertical={false} />
            <XAxis 
              dataKey="comp" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: '700' }} 
              dy={15}
            />
            <YAxis 
              domain={[0, 100]} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: '700' }}
              tickFormatter={(v) => `${v}%`}
            />
            <RechartsTooltip content={<CustomTooltip />} />
            <Legend 
               verticalAlign="bottom" 
               height={36} 
               iconType="circle" 
               wrapperStyle={{ paddingTop: '20px', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700 }}
            />
            {data?.series.map((s: any, idx: number) => (
              <Line 
                key={s.unidadeId}
                type="monotone" 
                dataKey={s.equipe} 
                stroke={COLORS[idx % COLORS.length]} 
                strokeWidth={3} 
                dot={{ r: 4, strokeWidth: 0, fill: COLORS[idx % COLORS.length] }}
                activeDot={{ r: 6, strokeWidth: 4, stroke: '#fff' }}
                animationDuration={1500}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-2xl shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 min-w-[200px]">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-50 pb-2">{label}</p>
        <div className="space-y-3">
          {payload.map((p: any) => (
            <div key={p.name} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-tighter truncate max-w-[120px]">{p.name}</span>
              </div>
              <span className="text-xs font-black text-slate-900">{p.value?.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const ScorePanel = ({ indicador }: any) => {
  if (!indicador) return null;
  
  return (
    <div className="p-8 bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-8">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
          <Info size={20} className="text-blue-400" />
        </div>
        <div>
          <h4 className="font-black text-xs uppercase tracking-[0.2em] text-blue-400">Escala de Pontuação</h4>
          <p className="text-lg font-bold tracking-tighter">{indicador.nome}</p>
        </div>
      </div>

      <div className="flex flex-1 flex-wrap justify-end gap-x-12 gap-y-4">
        {indicador.regras?.map((r: any) => (
          <div key={r.status} className="flex items-center gap-3">
             <div className={`w-1 h-8 rounded-full ${getScoreBarColor(r.status)}`} />
             <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{r.label}</p>
               <p className="text-xl font-bold tracking-tighter leading-none">{r.range}</p>
             </div>
          </div>
        ))}
      </div>

      <a 
        href="https://sisaps.saude.gov.br/painelsaps/" 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white flex items-center gap-2 transition-all group"
      >
        <ExternalLink size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        Fonte: SIAPS Oficial
      </a>
    </div>
  );
};

// --- Modais ---

const LancarProducaoModal = ({ open, onClose, indicadores, unidades }: any) => {
  const { mutateAsync, isPending } = useCriarProducao();
  const [formData, setFormData] = useState({
    indicadorId: '',
    unidadeId: '',
    mes: new Date().getMonth() + 1,
    ano: 2026,
    numerador: '',
    denominador: ''
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.indicadorId || !formData.unidadeId || !formData.numerador) return;

    try {
      await mutateAsync({
        ...formData,
        numerador: Number(formData.numerador),
        denominador: Number(formData.denominador) || 1
      });
      onClose();
    } catch (e) {
      alert('Erro ao salvar produção');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                 <Plus size={20} />
              </div>
              <h3 className="font-black text-slate-900 uppercase tracking-tighter text-lg">Lançar Produção</h3>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-400">
              <X size={20} />
           </button>
        </div>

        <form onSubmit={handleSave} className="p-10 space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5 col-span-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Indicador</label>
                 <select 
                    required
                    value={formData.indicadorId}
                    onChange={e => setFormData({...formData, indicadorId: e.target.value})}
                    className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-5 font-bold text-slate-600 outline-none focus:ring-4 focus:ring-blue-500/10"
                 >
                    <option value="">Selecione o indicador...</option>
                    {indicadores.map((i: any) => <option key={i.id} value={i.id}>{i.nome}</option>)}
                 </select>
              </div>

              <div className="space-y-1.5 col-span-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unidade de Lotação</label>
                 <select 
                    required
                    value={formData.unidadeId}
                    onChange={e => setFormData({...formData, unidadeId: e.target.value})}
                    className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-5 font-bold text-slate-600 outline-none focus:ring-4 focus:ring-blue-500/10"
                 >
                    <option value="">Selecione a unidade...</option>
                    {unidades.map((u: any) => <option key={u.id} value={u.id}>{u.nome}</option>)}
                 </select>
              </div>

              <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Numerador</label>
                 <input 
                    required
                    type="number"
                    value={formData.numerador}
                    onChange={e => setFormData({...formData, numerador: e.target.value})}
                    className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-5 font-bold text-slate-600 outline-none focus:ring-4 focus:ring-blue-500/10"
                    placeholder="Ex: 154"
                 />
              </div>

              <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Denominador</label>
                 <input 
                    type="number"
                    value={formData.denominador}
                    onChange={e => setFormData({...formData, denominador: e.target.value})}
                    className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-5 font-bold text-slate-600 outline-none focus:ring-4 focus:ring-blue-500/10"
                    placeholder="Ex: 500"
                 />
              </div>
           </div>

           <div className="flex gap-4 pt-4">
              <button type="button" onClick={onClose} className="flex-1 h-14 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all text-xs">Cancelar</button>
              <button 
                type="submit" 
                disabled={isPending}
                className="flex-1 h-14 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 text-xs flex items-center justify-center gap-2"
              >
                {isPending ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                Salvar Produção
              </button>
           </div>
        </form>
      </div>
    </div>
  );
};

// --- Helpers ---

const formatCompLabel = (m: number, a: number) => {
  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return `${meses[m-1]}/${String(a).slice(2)}`;
};

const getStatusStyle = (status: StatusAPS) => {
  switch (status) {
    case 'OTIMO': return 'bg-blue-100 text-blue-700 ring-2 ring-blue-500/20';
    case 'BOM': return 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500/20';
    case 'SUFICIENTE': return 'bg-amber-100 text-amber-700 ring-2 ring-amber-500/20';
    case 'REGULAR': return 'bg-rose-100 text-rose-700 ring-2 ring-rose-500/20';
    default: return 'bg-slate-100 text-slate-500';
  }
};

const getValueStyle = (status: StatusAPS) => {
  switch (status) {
    case 'OTIMO': return 'text-blue-700';
    case 'BOM': return 'text-emerald-700';
    case 'SUFICIENTE': return 'text-amber-700';
    case 'REGULAR': return 'text-rose-600';
    default: return 'text-slate-400';
  }
};

const getBarColor = (status: StatusAPS) => {
  switch (status) {
    case 'OTIMO': return 'bg-blue-600';
    case 'BOM': return 'bg-emerald-600';
    case 'SUFICIENTE': return 'bg-amber-500';
    case 'REGULAR': return 'bg-rose-500';
    default: return 'bg-slate-200';
  }
};

const getScoreBarColor = (status: StatusAPS) => {
  switch (status) {
    case 'OTIMO': return 'bg-blue-500';
    case 'BOM': return 'bg-emerald-500';
    case 'SUFICIENTE': return 'bg-amber-400';
    case 'REGULAR': return 'bg-rose-500';
    default: return 'bg-slate-500';
  }
};

// --- Skeletons ---

const SkeletonTable = ({ rows = 5 }: { rows?: number }) => (
  <div className="space-y-4 animate-pulse">
    <div className="h-10 bg-slate-100 rounded-xl" />
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="h-16 bg-slate-50 rounded-2xl" />
    ))}
  </div>
);

const SkeletonChart = () => (
  <div className="h-[320px] bg-slate-50 rounded-[2rem] animate-pulse flex items-center justify-center">
    <TrendingUp size={48} className="text-slate-100" />
  </div>
);

const ErrorCard = () => (
   <div className="bg-rose-50 border border-rose-100 p-12 rounded-[2.5rem] text-center flex flex-col items-center gap-4">
      <AlertCircle size={48} className="text-rose-500" />
      <h3 className="text-xl font-black text-rose-900 uppercase">Erro na comunicação</h3>
      <p className="text-rose-700 font-medium">Não foi possível carregar os dados desta visão. Tente novamente em instantes.</p>
   </div>
);

export default AtencaoPrimaria;
