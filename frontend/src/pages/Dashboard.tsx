import {
  Activity,
  Wallet,
  Package,
  Users,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Clock,
  List,
  Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useEstatisticasFila } from '../hooks/useFilaRegulacao';

const Dashboard = () => {
  const navigate = useNavigate();
  const { data: filaStats } = useEstatisticasFila();

  const totalAguardando = filaStats?.porStatus['AGUARDANDO'] || 0;

  const cards = [
    // ... outros cards ...
    {
      id: 'aps',
      title: 'Atenção Primária',
      description: 'Monitoramento de indicadores de saúde, metas do Previne Brasil e produção das equipes.',
      icon: <Activity className="text-blue-600" size={24} />,
      path: '/aps',
      color: 'blue',
      stats: { label: 'Indicadores', value: '16 ativos', color: 'text-blue-600' }
    },
    {
      id: 'financeiro',
      title: 'Gestão Financeira',
      description: 'Controle de repasses, faturamento SUS, orçamentos e saúde financeira da secretaria.',
      icon: <Wallet className="text-emerald-600" size={24} />,
      path: '/financeiro',
      color: 'emerald',
      stats: { label: 'Saldo Previsto', value: 'R$ 1.2M', color: 'text-emerald-600' }
    },
    {
      id: 'almoxarifado',
      title: 'Gestão de Almoxarifado',
      description: 'Controle de estoque central, dispensação de medicamentos e gestão de insumos.',
      icon: <Package className="text-orange-600" size={24} />,
      path: '/almoxarifado',
      color: 'orange',
      stats: { label: 'Críticos', value: '12 itens', color: 'text-orange-600' }
    },
    {
      id: 'pessoas',
      title: 'Gestão de Pessoas',
      description: 'Gestão de escalas, profissionais de saúde, produtividade e recursos humanos.',
      icon: <Users className="text-purple-600" size={24} />,
      path: '/pessoas',
      color: 'purple',
      stats: { label: 'Ativos', value: '142 serv.', color: 'text-purple-600' }
    },
    {
      id: 'fila',
      title: 'Regulação Assistencial',
      description: 'Regulação de procedimentos: diagnósticos, consultas especializadas e cirurgias.',
      icon: <List className={`text-rose-600`} size={24} />,
      path: '/fila',
      color: 'rose',
      stats: { label: 'Aguardando', value: `${totalAguardando} pac.`, color: 'text-rose-600' }
    },
    {
      id: 'admin',
      title: 'Admin & Planejamento',
      description: 'Cadastro de unidades, ações, serviços e gestão estratégica da saúde.',
      icon: <Settings className="text-indigo-600" size={24} />,
      path: '/admin-planejamento',
      color: 'indigo',
      stats: { label: 'Unidades', value: '24 cad.', color: 'text-indigo-600' }
    }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500">
      {/* Welcome Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          Olá, Bem-vindo ao <span className="text-blue-600">Monitora Saúde</span>
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl">
          Sua central de inteligência para gestão pública de saúde. Selecione um módulo abaixo para iniciar o monitoramento.
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {cards.map((card) => (
          <div
            key={card.id}
            onClick={() => navigate(card.path)}
            className="group relative bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 transition-all cursor-pointer overflow-hidden"
          >
            {/* Background Decoration */}
            <div className={`absolute -right-8 -top-8 w-32 h-32 bg-${card.color}-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700`} />

            <div className="relative z-10 flex flex-col h-full">
              <div className="flex justify-between items-start mb-6">
                <div className={`p-4 bg-${card.color}-50 rounded-2xl group-hover:bg-${card.color}-600 group-hover:text-white transition-colors duration-300`}>
                  {card.icon}
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{card.stats.label}</span>
                  <span className={`text-sm font-bold ${card.stats.color}`}>{card.stats.value}</span>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                <h3 className="text-2xl font-bold text-slate-800">{card.title}</h3>
                <p className="text-slate-500 leading-relaxed">
                  {card.description}
                </p>
              </div>

              <div className="mt-auto pt-6 border-t border-slate-50 flex justify-between items-center">
                <span className="text-sm font-bold text-slate-400 group-hover:text-blue-600 transition-colors">Acessar Módulo</span>
                <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <ArrowRight size={20} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Insights / Global Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        <InsightCard
          icon={<TrendingUp className="text-blue-500" size={20} />}
          title="Desempenho Geral"
          value="84.2%"
          trend="+2.4% vs mês ant."
        />
        <InsightCard
          icon={<AlertCircle className="text-orange-500" size={20} />}
          title="Pendências Médias"
          value="14"
          trend="-3 esta semana"
        />
        <InsightCard
          icon={<Clock className="text-purple-500" size={20} />}
          title="Tempo Médio Fila"
          value="12 min"
          trend="Estável"
        />
      </div>
    </div>
  );
};

const InsightCard = ({ icon, title, value, trend }: any) => (
  <div className="bg-white/50 backdrop-blur-sm border border-slate-100 rounded-2xl p-6 flex items-center gap-4">
    <div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-slate-50 flex items-center justify-center">
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-bold text-slate-900">{value}</span>
        <span className="text-[10px] font-medium text-slate-500">{trend}</span>
      </div>
    </div>
  </div>
);

export default Dashboard;
