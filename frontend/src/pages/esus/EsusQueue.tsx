import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { esusApi } from '../../services/esusApi';
import { Download, Plus } from 'lucide-react';

const PRIORITY_BADGE: Record<string, string> = {
  URGENTE: 'bg-red-900/40 text-red-400 border-red-700',
  ALTA: 'bg-orange-900/40 text-orange-400 border-orange-700',
  MEDIA: 'bg-yellow-900/40 text-yellow-400 border-yellow-700',
  BAIXA: 'bg-slate-700 text-slate-400 border-slate-600',
};

const TYPE_BADGE: Record<string, string> = {
  REFERRAL: 'bg-purple-900/40 text-purple-400',
  PROCEDURE: 'bg-blue-900/40 text-blue-400',
  EXAM: 'bg-teal-900/40 text-teal-400',
};

const STATUS_LABEL: Record<string, string> = {
  AGUARDANDO: 'Aguardando',
  AGENDADO: 'Agendado',
  REALIZADO: 'Realizado',
  CANCELADO: 'Cancelado',
};

export default function EsusQueue() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState({ status: '', type: '', priority: '', search: '' });
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [importMsg, setImportMsg] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['esus-queue', filters, page],
    queryFn: () => esusApi.queue.getAll({ ...filters, page, limit: 20 }).then(r => r.data.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status, scheduledAt }: any) =>
      esusApi.queue.updateStatus(id, { status, scheduledAt, performedBy: 'usuario' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['esus-queue'] });
      setSelectedId(null);
    },
  });

  const importMutation = useMutation({
    mutationFn: () => esusApi.queue.importFromEsus({ type: 'REFERRAL' }),
    onSuccess: (res) => {
      const { imported, skipped } = res.data.data;
      setImportMsg(`Importados: ${imported} | Duplicados ignorados: ${skipped}`);
      qc.invalidateQueries({ queryKey: ['esus-queue'] });
      setTimeout(() => setImportMsg(''), 5000);
    },
  });

  const items = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 20);

  const handleFilter = (key: string, val: string) => {
    setFilters(f => ({ ...f, [key]: val }));
    setPage(1);
  };

  const daysSince = (date: string) => {
    const d = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
    return d;
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-100">Fila de Regulação</h1>
        <button onClick={() => importMutation.mutate()} disabled={importMutation.isPending}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition-colors disabled:opacity-60">
          <Download size={14} /> {importMutation.isPending ? 'Importando...' : 'Importar do e-SUS'}
        </button>
      </div>

      {importMsg && <div className="bg-green-900/30 border border-green-700 text-green-300 rounded-lg px-4 py-2 text-sm">{importMsg}</div>}

      <div className="flex flex-wrap gap-2">
        <input type="text" placeholder="Buscar paciente ou CNS..." value={filters.search} onChange={e => handleFilter('search', e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500" />
        <select value={filters.status} onChange={e => handleFilter('status', e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-blue-500">
          <option value="">Todos os status</option>
          {Object.keys(STATUS_LABEL).map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
        <select value={filters.type} onChange={e => handleFilter('type', e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-blue-500">
          <option value="">Todos os tipos</option>
          <option value="REFERRAL">Encaminhamento</option>
          <option value="PROCEDURE">Procedimento</option>
          <option value="EXAM">Exame</option>
        </select>
        <select value={filters.priority} onChange={e => handleFilter('priority', e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-blue-500">
          <option value="">Todas as prioridades</option>
          <option value="URGENTE">Urgente</option>
          <option value="ALTA">Alta</option>
          <option value="MEDIA">Média</option>
          <option value="BAIXA">Baixa</option>
        </select>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-slate-400">
              <th className="text-left px-4 py-3">Paciente</th>
              <th className="text-left px-4 py-3">Tipo</th>
              <th className="text-left px-4 py-3">Descrição</th>
              <th className="text-left px-4 py-3">Especialidade</th>
              <th className="text-left px-4 py-3">Prioridade</th>
              <th className="text-right px-4 py-3">Dias</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className="text-center py-8 text-slate-400">Carregando...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-slate-400">Nenhum item na fila.</td></tr>
            ) : items.map((item: any) => (
              <tr key={item.id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                <td className="px-4 py-3">
                  <p className="text-slate-200 font-medium">{item.patientName}</p>
                  <p className="text-slate-500 text-xs font-mono">{item.patientCns}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${TYPE_BADGE[item.type] || ''}`}>
                    {item.type === 'REFERRAL' ? 'Enc.' : item.type === 'EXAM' ? 'Exame' : 'Proc.'}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400 max-w-[180px] truncate">{item.description}</td>
                <td className="px-4 py-3 text-slate-400">{item.specialty || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded border text-xs font-medium ${PRIORITY_BADGE[item.priority] || ''}`}>
                    {item.priority}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-slate-300">{daysSince(item.requestedAt)}</td>
                <td className="px-4 py-3 text-slate-400 text-xs">{STATUS_LABEL[item.status] || item.status}</td>
                <td className="px-4 py-3">
                  {!['REALIZADO', 'CANCELADO'].includes(item.status) && (
                    <button onClick={() => { setSelectedId(item.id); setNewStatus(''); setScheduledAt(''); }}
                      className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 transition-colors">
                      Atualizar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex justify-between items-center px-4 py-3 border-t border-slate-700 text-sm text-slate-400">
            <span>{total} itens</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 bg-slate-700 rounded disabled:opacity-40">←</button>
              <span>{page}/{totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 bg-slate-700 rounded disabled:opacity-40">→</button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de atualização de status */}
      {selectedId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-sm space-y-4">
            <h2 className="font-semibold text-slate-100">Atualizar Status</h2>
            <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm">
              <option value="">Selecione o novo status...</option>
              <option value="AGENDADO">Agendado</option>
              <option value="REALIZADO">Realizado</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
            {newStatus === 'AGENDADO' && (
              <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm" />
            )}
            <div className="flex gap-2 justify-end">
              <button onClick={() => setSelectedId(null)} className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300">Cancelar</button>
              <button disabled={!newStatus || updateMutation.isPending}
                onClick={() => updateMutation.mutate({ id: selectedId, status: newStatus, scheduledAt })}
                className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 rounded-lg text-white disabled:opacity-50">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
