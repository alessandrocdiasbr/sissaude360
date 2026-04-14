import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  LayoutDashboard,
  Grid3X3,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('individual'); // 'individual' | 'overview'
  const [selectedUnidade, setSelectedUnidade] = useState('Todas');
  const [selectedIndicador, setSelectedIndicador] = useState('i2'); // Default: Mais Acesso
  const [loading, setLoading] = useState(false);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [indicadores, setIndicadores] = useState<any[]>([]);
  
  // Dados de Fallback (16 indicadores)
  const fullIndicadoresList = [
    { id: 'i1', nome: 'Resumo de Produção' },
    { id: 'i2', nome: 'Mais Acesso' },
    { id: 'i3', nome: 'Desenvolvimento Infantil' },
    { id: 'i4', nome: 'Gestação e Puerpério' },
    { id: 'i5', nome: 'Diabetes' },
    { id: 'i6', nome: 'Hipertensão' },
    { id: 'i7', nome: 'Pessoa idosa' },
    { id: 'i8', nome: 'Prevenção do Câncer' },
    { id: 'i9', nome: '1ª Consulta Odontológica' },
    { id: 'i10', nome: 'Tratamento Odontológico Concluído' },
    { id: 'i11', nome: 'Taxa de Exodontia' },
    { id: 'i12', nome: 'Escovação Supervisionada' },
    { id: 'i13', nome: 'Procedimento Odontológico Preventivo' },
    { id: 'i14', nome: 'Tratamento Atraumático' },
    { id: 'i15', nome: 'Média de Atendimento eMulti na APS' },
    { id: 'i16', nome: 'Ações Interprofissionais' }
  ];

  const fullUnidadesList = [
    { id: '1', nome: 'Rua Nova' },
    { id: '2', nome: 'Vila Santana' },
    { id: '3', nome: 'Centro' },
    { id: '4', nome: 'Alencar' },
    { id: '5', nome: 'Rural' }
  ];

  // Carregar Unidades e Indicadores da API ou Fallback
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [resU, resI] = await Promise.all([
          axios.get('http://localhost:3001/api/unidades').catch(() => ({ data: [] })),
          axios.get('http://localhost:3001/api/indicadores').catch(() => ({ data: [] }))
        ]);
        setUnidades(resU.data.length > 0 ? resU.data : fullUnidadesList);
        setIndicadores(resI.data.length > 0 ? resI.data : fullIndicadoresList);
      } catch (e) {
        setUnidades(fullUnidadesList);
        setIndicadores(fullIndicadoresList);
      }
    };
    fetchMeta();
  }, []);

  // Lógica Reativa: Gera dados simulados baseados na seleção (enquanto API não tem DB)
  const reactiveData = useMemo(() => {
    const baseValue = selectedIndicador === 'i2' ? 7.91 : Math.random() * 20 + 5;
    const growth = selectedUnidade === '1' ? 1.84 : 1.2; // Rua Nova cresce mais no demo
    
    return [
      { mes: 'Jan', valor2025: baseValue.toFixed(2), valor2026: (baseValue * growth).toFixed(2) },
      { mes: 'Fev', valor2025: (baseValue * 1.05).toFixed(2), valor2026: (baseValue * growth * 1.1).toFixed(2) },
      { mes: 'Mar', valor2025: (baseValue * 1.1).toFixed(2), valor2026: (baseValue * growth * 1.2).toFixed(2) },
      { mes: 'Abr', valor2025: (baseValue * 1.15).toFixed(2), valor2026: (baseValue * growth * 1.1).toFixed(2) },
      { mes: 'Mai', valor2025: (baseValue * 1.2).toFixed(2), valor2026: (baseValue * growth * 1.3).toFixed(2) },
    ];
  }, [selectedUnidade, selectedIndicador]);

  // Insights Dinâmicos
  const currentIndicatorName = indicadores.find(i => i.id === selectedIndicador)?.nome || 'Indicador';
  const evolution = ((parseFloat(reactiveData[0].valor2026) - parseFloat(reactiveData[0].valor2025)) / parseFloat(reactiveData[0].valor2025) * 100).toFixed(1);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header & Main Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Saúde Brasil 360
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
          />
          {activeTab === 'individual' && (
            <FilterSelect 
              label="Indicador Principal" 
              value={selectedIndicador} 
              onChange={setSelectedIndicador} 
              options={indicadores} 
            />
          )}
        </div>
      </div>

      {activeTab === 'individual' ? (
        <IndividualView data={reactiveData} indicatorName={currentIndicatorName} evolution={evolution} />
      ) : (
        <OverviewView 
          unidadeName={unidades.find(u => u.id === selectedUnidade)?.nome || 'Equipe'} 
          indicadores={indicadores} 
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
      <Card title={`${indicatorName} (Jan/26)`} value={`${data[0].valor2026}%`} status={getStatusText(data[0].valor2026)} evolution={`+${evolution}%`} up />
      <Card title="Crescimento Médio" value={`${(parseFloat(evolution) * 0.8).toFixed(1)}%`} status="Bom" evolution="+2.1%" up />
      <Card title="Metas Batidas" value="14/16" status="Ótimo" evolution="+2" up />
      <Card title="Pendências" value="2" status="Suficiente" evolution="-1" down />
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
          <AlertCircle size={20} className="text-blue-500" /> Analise de Gestão
        </h3>
        <div className="space-y-6 flex-1">
          <div className="p-4 bg-blue-50 rounded-xl">
            <p className="text-sm text-blue-800 font-medium leading-relaxed">
              O indicador <strong>{indicatorName}</strong> apresentou evolução de {evolution}% no início do ciclo 2026. Recomendado manter as estratégias atuais.
            </p>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Resumo Outros Indicadores</h4>
            <StatusRow label="Diabetes" value="12.4%" status="Suficiente" color="bg-yellow-500" />
            <StatusRow label="Hipertensão" value="19.1%" status="Bom" color="bg-green-500" />
            <StatusRow label="Odonto" value="23.5%" status="Ótimo" color="bg-blue-500" />
          </div>
        </div>
      </div>
    </div>
  </>
);

const OverviewView = ({ unidadeName, indicadores }: any) => (
  <div className="dashboard-card !p-0 overflow-hidden">
    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
      <h3 className="font-bold text-lg text-slate-800">Visão Geral: {unidadeName}</h3>
      <p className="text-sm text-slate-500">Comparativo de todos os {indicadores.length} indicadores para esta unidade.</p>
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
          {indicadores.map((ind: any, idx: number) => {
            const v25 = (Math.random() * 15 + 5).toFixed(2);
            const v26 = (parseFloat(v25) * (v25 > '10' ? 1.2 : 1.5)).toFixed(2);
            const diff = (((parseFloat(v26) - parseFloat(v25)) / parseFloat(v25)) * 100).toFixed(1);
            return (
              <tr key={ind.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-semibold text-slate-800">{ind.nome}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                    getStatusClass(parseFloat(v26))
                  }`}>
                    {getStatusText(parseFloat(v26))}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-500">{v25}%</td>
                <td className="px-6 py-4 font-bold text-slate-900">{v26}%</td>
                <td className={`px-6 py-4 font-bold ${parseFloat(diff) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  +{diff}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

// --- Helpers & UI Components ---

const Card = ({ title, value, status, evolution, up, down }: any) => (
  <div className="dashboard-card">
    <div className="flex justify-between items-start mb-4">
      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</span>
      <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
          status === 'Ótimo' ? 'bg-blue-100 text-blue-700' :
          status === 'Bom' ? 'bg-green-100 text-green-700' :
          status === 'Suficiente' ? 'bg-yellow-100 text-yellow-700' :
          'bg-red-100 text-red-700'
        }`}>
        {status}
      </div>
    </div>
    <div className="flex items-baseline gap-2">
      <h2 className="text-3xl font-bold text-slate-900 leading-none">{value}</h2>
      <div className={`flex items-center text-sm font-semibold ${up ? 'text-green-600' : 'text-red-600'}`}>
        {up ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
        {evolution}
      </div>
    </div>
  </div>
);

const FilterSelect = ({ label, value, onChange, options }: any) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">{label}</label>
    <select 
      className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none shadow-sm transition-all"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o: any) => (
        <option key={o.id} value={o.id}>{o.nome}</option>
      ))}
    </select>
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

const StatusRow = ({ label, value, status, color }: any) => (
  <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
    <div className="flex items-center gap-3">
      <div className={`w-2 h-2 rounded-full ${color}`}></div>
      <span className="text-sm font-medium text-slate-700">{label}</span>
    </div>
    <div className="text-right">
      <div className="text-sm font-bold text-slate-900">{value}</div>
      <div className="text-[10px] text-slate-400 font-bold uppercase">{status}</div>
    </div>
  </div>
);

const getStatusText = (v: any) => {
  const score = parseFloat(v);
  if (score >= 18) return 'Ótimo';
  if (score >= 15) return 'Bom';
  if (score >= 10) return 'Suficiente';
  return 'Regular';
};

const getStatusClass = (v: any) => {
  const score = parseFloat(v);
  if (score >= 18) return 'bg-blue-100 text-blue-700';
  if (score >= 15) return 'bg-green-100 text-green-700';
  if (score >= 10) return 'bg-yellow-100 text-yellow-700';
  return 'bg-red-100 text-red-700';
};

export default Dashboard;
