import { useQuery } from '@tanstack/react-query';
import { esusApi } from '../../services/esusApi';
import { Activity, Users, FileText, ClipboardList, Wifi, WifiOff } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EsusDashboard() {
  const { data: connData } = useQuery({
    queryKey: ['esus-connection'],
    queryFn: () => esusApi.testConnection().then(r => r.data),
    retry: false,
  });

  const { data: queueStats } = useQuery({
    queryKey: ['esus-queue-stats'],
    queryFn: () => esusApi.queue.getStats().then(r => r.data.data),
  });

  const connected = connData?.data?.connected;

  const totalAguardando = queueStats?.byStatus?.find((s: any) => s.status === 'AGUARDANDO')?._count || 0;
  const totalUrgente = queueStats?.byPriority?.find((p: any) => p.priority === 'URGENTE')?._count || 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">e-SUS PEC Analytics</h1>
          <p className="text-slate-400 text-sm mt-1">Dados clínicos, produção e indicadores Saúde Brasil 360</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${connected ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>
          {connected ? <Wifi size={14} /> : <WifiOff size={14} />}
          {connected ? 'e-SUS conectado' : 'e-SUS desconectado'}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Pacientes', icon: <Users size={20} />, to: '/esus/patients', color: 'blue' },
          { label: 'Encaminhamentos', icon: <FileText size={20} />, to: '/esus/referrals', color: 'purple' },
          { label: 'Produção', icon: <Activity size={20} />, to: '/esus/production', color: 'teal' },
          { label: 'Indicadores SB360', icon: <Activity size={20} />, to: '/esus/indicators', color: 'orange' },
        ].map(({ label, icon, to, color }) => (
          <Link key={to} to={to} className={`bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-${color}-500 transition-colors group`}>
            <div className={`w-10 h-10 bg-${color}-900/40 rounded-lg flex items-center justify-center text-${color}-400 mb-3 group-hover:bg-${color}-900/60`}>
              {icon}
            </div>
            <p className="font-medium text-slate-200">{label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/esus/queue" className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-blue-500 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <ClipboardList size={20} className="text-blue-400" />
            <span className="font-semibold text-slate-200">Fila de Regulação</span>
          </div>
          <p className="text-3xl font-bold text-slate-100">{totalAguardando}</p>
          <p className="text-slate-400 text-sm">aguardando regulação</p>
        </Link>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <p className="font-semibold text-slate-200 mb-2">Urgências na Fila</p>
          <p className="text-3xl font-bold text-red-400">{totalUrgente}</p>
          <p className="text-slate-400 text-sm">itens com prioridade urgente</p>
        </div>
      </div>
    </div>
  );
}
