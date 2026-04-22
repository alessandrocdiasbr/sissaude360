import { Activity, Wallet, Package, Users, ArrowRight, List, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEstatisticasFila } from '../hooks/useFilaRegulacao';

const cards = (totalAguardando: number) => [
  {
    id: 'aps',
    title: 'Atenção Primária',
    description: 'Monitoramento de indicadores de saúde, metas do Previne Brasil e produção das equipes.',
    Icon: Activity,
    path: '/aps',
    stats: { label: 'Indicadores', value: '16 ativos' },
    bar: 'bg-linear-to-r from-blue-500 to-cyan-400',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    badge: 'bg-blue-50 text-blue-700',
    arrowHover: 'group-hover:bg-blue-600',
    linkHover: 'group-hover:text-blue-600',
    glow: 'hover:shadow-blue-500/10',
  },
  {
    id: 'financeiro',
    title: 'Gestão Financeira',
    description: 'Controle de repasses, faturamento SUS, orçamentos e saúde financeira da secretaria.',
    Icon: Wallet,
    path: '/financeiro',
    stats: { label: 'Saldo Previsto', value: 'R$ 1.2M' },
    bar: 'bg-linear-to-r from-emerald-500 to-teal-400',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    badge: 'bg-emerald-50 text-emerald-700',
    arrowHover: 'group-hover:bg-emerald-600',
    linkHover: 'group-hover:text-emerald-600',
    glow: 'hover:shadow-emerald-500/10',
  },
  {
    id: 'almoxarifado',
    title: 'Gestão de Almoxarifado',
    description: 'Controle de estoque central, dispensação de medicamentos e gestão de insumos.',
    Icon: Package,
    path: '/almoxarifado',
    stats: { label: 'Críticos', value: '12 itens' },
    bar: 'bg-linear-to-r from-orange-500 to-amber-400',
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-600',
    badge: 'bg-orange-50 text-orange-700',
    arrowHover: 'group-hover:bg-orange-600',
    linkHover: 'group-hover:text-orange-600',
    glow: 'hover:shadow-orange-500/10',
  },
  {
    id: 'pessoas',
    title: 'Gestão de Pessoas',
    description: 'Gestão de escalas, profissionais de saúde, produtividade e recursos humanos.',
    Icon: Users,
    path: '/pessoas',
    stats: { label: 'Ativos', value: '142 serv.' },
    bar: 'bg-linear-to-r from-violet-500 to-purple-400',
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    badge: 'bg-violet-50 text-violet-700',
    arrowHover: 'group-hover:bg-violet-600',
    linkHover: 'group-hover:text-violet-600',
    glow: 'hover:shadow-violet-500/10',
  },
  {
    id: 'fila',
    title: 'Regulação Assistencial',
    description: 'Regulação de procedimentos: diagnósticos, consultas especializadas e cirurgias.',
    Icon: List,
    path: '/fila',
    stats: { label: 'Aguardando', value: `${totalAguardando} pac.` },
    bar: 'bg-linear-to-r from-rose-500 to-pink-400',
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-600',
    badge: 'bg-rose-50 text-rose-700',
    arrowHover: 'group-hover:bg-rose-600',
    linkHover: 'group-hover:text-rose-600',
    glow: 'hover:shadow-rose-500/10',
  },
  {
    id: 'admin',
    title: 'Admin & Planejamento',
    description: 'Cadastro de unidades, ações, serviços e gestão estratégica da saúde.',
    Icon: Settings,
    path: '/admin-planejamento',
    stats: { label: 'Unidades', value: '24 cad.' },
    bar: 'bg-linear-to-r from-indigo-500 to-blue-400',
    iconBg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    badge: 'bg-indigo-50 text-indigo-700',
    arrowHover: 'group-hover:bg-indigo-600',
    linkHover: 'group-hover:text-indigo-600',
    glow: 'hover:shadow-indigo-500/10',
  },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { data: filaStats } = useEstatisticasFila();
  const totalAguardando = filaStats?.porStatus['AGUARDANDO'] || 0;
  const moduleCards = cards(totalAguardando);

  return (
    <div className="min-h-full bg-linear-to-br from-slate-50 via-white to-blue-50/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-14">

        {/* ── Header ── */}
        <div className="mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-full mb-5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
            </span>
            <span className="text-xs font-semibold text-blue-600 tracking-wide">Sistema Online</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-slate-900 tracking-tight leading-tight">
            Bem-vindo ao{' '}
            <span className="bg-linear-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              Monitora Saúde
            </span>
          </h1>
          <p className="mt-3 text-base sm:text-lg text-slate-500 max-w-2xl leading-relaxed">
            Central de inteligência para gestão pública de saúde.
            Selecione um módulo para iniciar o monitoramento.
          </p>
        </div>

        {/* ── Module Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
          {moduleCards.map((card) => {
            const { Icon } = card;
            return (
              <button
                key={card.id}
                onClick={() => navigate(card.path)}
                className={[
                  'group relative bg-white rounded-2xl border border-slate-100 text-left',
                  'overflow-hidden transition-all duration-300',
                  'hover:-translate-y-1 hover:shadow-xl hover:border-slate-200',
                  card.glow,
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
                ].join(' ')}
              >
                {/* Colored top accent bar */}
                <div className={`h-[3px] w-full ${card.bar}`} />

                <div className="p-6 flex flex-col">
                  {/* Icon + Stats row */}
                  <div className="flex items-start justify-between mb-5">
                    <div
                      className={[
                        'p-3 rounded-xl transition-transform duration-300 group-hover:scale-110',
                        card.iconBg,
                      ].join(' ')}
                    >
                      <Icon className={card.iconColor} size={22} strokeWidth={2} />
                    </div>

                    <div className={`px-3 py-1.5 rounded-xl text-right ${card.badge}`}>
                      <p className="text-[9px] font-black uppercase tracking-[0.15em] opacity-60 leading-none mb-0.5">
                        {card.stats.label}
                      </p>
                      <p className="text-sm font-bold leading-tight">{card.stats.value}</p>
                    </div>
                  </div>

                  {/* Title + Description */}
                  <div className="flex-1 space-y-1.5 mb-6">
                    <h3 className="text-[1.05rem] font-bold text-slate-800 leading-snug">
                      {card.title}
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed line-clamp-3">
                      {card.description}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <span
                      className={[
                        'text-sm font-semibold text-slate-400 transition-colors duration-200',
                        card.linkHover,
                      ].join(' ')}
                    >
                      Acessar Módulo
                    </span>
                    <div
                      className={[
                        'w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400',
                        'transition-all duration-200',
                        card.arrowHover,
                        'group-hover:text-white group-hover:scale-110',
                      ].join(' ')}
                    >
                      <ArrowRight size={15} />
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
