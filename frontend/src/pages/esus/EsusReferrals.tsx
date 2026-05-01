import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { esusApi } from '../../services/esusApi';

export default function EsusReferrals() {
  const [specialty, setSpecialty] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['esus-referrals', specialty, dateFrom, dateTo, page],
    queryFn: () => esusApi.referrals.getAll({ specialty, dateFrom, dateTo, page, limit: 20 }).then(r => r.data.data),
  });

  const { data: bySpecialty } = useQuery({
    queryKey: ['esus-referrals-specialty'],
    queryFn: () => esusApi.referrals.getBySpecialty().then(r => r.data.data),
  });

  const referrals = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-slate-100">Encaminhamentos</h1>

      <div className="flex flex-wrap gap-3">
        <input type="text" placeholder="Especialidade..." value={specialty} onChange={e => { setSpecialty(e.target.value); setPage(1); }}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500" />
        <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-blue-500" />
        <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-blue-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400">
                <th className="text-left px-4 py-3">Paciente</th>
                <th className="text-left px-4 py-3">Especialidade</th>
                <th className="text-left px-4 py-3">Profissional</th>
                <th className="text-left px-4 py-3">Data</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={4} className="text-center py-8 text-slate-400">Carregando...</td></tr>
              ) : referrals.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-slate-400">Nenhum encaminhamento encontrado.</td></tr>
              ) : referrals.map((r: any) => (
                <tr key={r.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  <td className="px-4 py-3 text-slate-200">{r.pacienteNome}</td>
                  <td className="px-4 py-3 text-slate-300">{r.especialidadeDestino}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{r.profissionalSolicitante}</td>
                  <td className="px-4 py-3 text-slate-400">{r.dtSolicitacao ? new Date(r.dtSolicitacao).toLocaleDateString('pt-BR') : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex justify-between items-center px-4 py-3 border-t border-slate-700 text-sm text-slate-400">
              <span>{total} registros</span>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 bg-slate-700 rounded disabled:opacity-40">←</button>
                <span>{page}/{totalPages}</span>
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 bg-slate-700 rounded disabled:opacity-40">→</button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <h3 className="font-semibold text-slate-200 mb-3 text-sm">Por Especialidade</h3>
          <div className="space-y-2">
            {(bySpecialty || []).slice(0, 10).map((s: any) => (
              <div key={s.especialidade} className="flex justify-between items-center text-sm">
                <span className="text-slate-400 truncate mr-2">{s.especialidade || 'Não informada'}</span>
                <span className="font-semibold text-slate-200 shrink-0">{s.total}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
