import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { esusApi } from '../../services/esusApi';
import { Search, User } from 'lucide-react';

export default function EsusPatients() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['esus-patients', search, page],
    queryFn: () => esusApi.patients.getAll({ search, page, limit: 20 }).then(r => r.data.data),
  });

  const patients = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-slate-100">Pacientes e-SUS</h1>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por nome ou CNS..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-slate-400">
              <th className="text-left px-4 py-3">Nome</th>
              <th className="text-left px-4 py-3">CNS</th>
              <th className="text-left px-4 py-3">Nascimento</th>
              <th className="text-left px-4 py-3">Sexo</th>
              <th className="text-left px-4 py-3">Telefone</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-8 text-slate-400">Carregando...</td></tr>
            ) : patients.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-slate-400">Nenhum paciente encontrado.</td></tr>
            ) : patients.map((p: any) => (
              <tr key={p.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                <td className="px-4 py-3 flex items-center gap-2 text-slate-200">
                  <User size={14} className="text-slate-500" />{p.nome}
                </td>
                <td className="px-4 py-3 text-slate-400 font-mono">{p.cns}</td>
                <td className="px-4 py-3 text-slate-400">{p.dataNascimento ? new Date(p.dataNascimento).toLocaleDateString('pt-BR') : '-'}</td>
                <td className="px-4 py-3 text-slate-400">{p.sexo === 'M' ? 'Masc.' : p.sexo === 'F' ? 'Fem.' : p.sexo}</td>
                <td className="px-4 py-3 text-slate-400">{p.telefone || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-400">
          <span>{total} pacientes encontrados</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 bg-slate-700 rounded disabled:opacity-40">Anterior</button>
            <span className="px-3 py-1">{page}/{totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 bg-slate-700 rounded disabled:opacity-40">Próximo</button>
          </div>
        </div>
      )}
    </div>
  );
}
