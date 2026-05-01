import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { esusApi } from '../../services/esusApi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function EsusProduction() {
  const now = new Date();
  const [dateFrom, setDateFrom] = useState(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(now.toISOString().split('T')[0]);
  const [granularity, setGranularity] = useState<'daily' | 'weekly' | 'monthly'>('monthly');

  const { data: professionals, isLoading } = useQuery({
    queryKey: ['esus-production', dateFrom, dateTo],
    queryFn: () => esusApi.production.getByProfessional({ dateFrom, dateTo }).then(r => r.data.data),
  });

  const { data: byPeriod } = useQuery({
    queryKey: ['esus-production-period', dateFrom, dateTo, granularity],
    queryFn: () => esusApi.production.getByPeriod({ dateFrom, dateTo, granularity }).then(r => r.data.data),
  });

  const chartData = (byPeriod || []).map((p: any) => ({
    periodo: new Date(p.periodo).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
    total: p.total,
  }));

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-slate-100">Produção por Profissional</h1>

      <div className="flex flex-wrap gap-3">
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-blue-500" />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-blue-500" />
        <select value={granularity} onChange={e => setGranularity(e.target.value as any)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-blue-500">
          <option value="daily">Diário</option>
          <option value="weekly">Semanal</option>
          <option value="monthly">Mensal</option>
        </select>
      </div>

      {chartData.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <h3 className="font-semibold text-slate-200 mb-4 text-sm">Atendimentos Individuais por Período</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <XAxis dataKey="periodo" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }} />
              <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-slate-400">
              <th className="text-left px-4 py-3">Profissional</th>
              <th className="text-left px-4 py-3">CBO</th>
              <th className="text-right px-4 py-3">Ind.</th>
              <th className="text-right px-4 py-3">Odonto</th>
              <th className="text-right px-4 py-3">Visitas</th>
              <th className="text-right px-4 py-3">Coletivas</th>
              <th className="text-right px-4 py-3">Média/Dia</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="text-center py-8 text-slate-400">Carregando...</td></tr>
            ) : (professionals || []).length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-slate-400">Nenhum dado encontrado.</td></tr>
            ) : (professionals || []).map((p: any) => (
              <tr key={p.cnsProfissional} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                <td className="px-4 py-3 text-slate-200">{p.nomeProfissional}</td>
                <td className="px-4 py-3 text-slate-400 text-xs">{p.cbo}</td>
                <td className="px-4 py-3 text-right text-slate-300">{p.totalAtendimentosIndividuais}</td>
                <td className="px-4 py-3 text-right text-slate-300">{p.totalAtendimentosOdonto}</td>
                <td className="px-4 py-3 text-right text-slate-300">{p.totalVisitasDomiciliares}</td>
                <td className="px-4 py-3 text-right text-slate-300">{p.totalAtividadesColetivas}</td>
                <td className="px-4 py-3 text-right font-semibold text-blue-400">{p.mediaAtendimentosDia}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
