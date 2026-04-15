import React, { useState, useMemo, useEffect } from 'react';
import {
  Search, Plus, Filter, Download, ChevronRight, X, 
  Clock, AlertCircle, CheckCircle2, Calendar, User, 
  Stethoscope, Building2, MapPin, History, ChevronLeft,
  MoreVertical, FileText, ArrowRightLeft, RefreshCw,
  LayoutDashboard, Info
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  useSolicitacoes, useEstatisticasFila, useCategorias, 
  useCriarSolicitacao, useAtualizarStatus, useSolicitacao 
} from '../hooks/useFilaRegulacao';
import { useUnidades } from '../hooks/useUnidades';
import type { StatusFila, PrioridadeFila, SolicitacaoFila, FilaParams } from '../types/fila';

// --- Helpers de Estilo ---
const getStatusBadge = (status: StatusFila) => {
  const styles: Record<StatusFila, string> = {
    'AGUARDANDO': 'bg-blue-100 text-blue-700',
    'AGENDADO': 'bg-green-100 text-green-700',
    'AGUARDA_REGULADOR': 'bg-amber-100 text-amber-700',
    'ATENDIDO': 'bg-slate-100 text-slate-600',
    'CANCELADO': 'bg-red-100 text-red-600',
    'FALTA_DOCUMENTOS': 'bg-orange-100 text-orange-700',
    'DEVOLVIDO': 'bg-purple-100 text-purple-700',
  };
  const labels: Record<StatusFila, string> = {
    'AGUARDANDO': 'Aguardando',
    'AGENDADO': 'Agendado',
    'AGUARDA_REGULADOR': 'Aguarda Regulador',
    'ATENDIDO': 'Atendido',
    'CANCELADO': 'Cancelado',
    'FALTA_DOCUMENTOS': 'Falta Documentos',
    'DEVOLVIDO': 'Devolvido',
  };
  return { className: styles[status] || 'bg-gray-100 text-gray-700', label: labels[status] || status };
};

const getPrioridadeCores = (p: PrioridadeFila) => {
  const map: Record<PrioridadeFila, { color: string, label: string }> = {
    'URGENCIA': { color: 'bg-red-500', label: 'Urgência' },
    'PRIORITARIO': { color: 'bg-orange-500', label: 'Prioritário' },
    'ELETIVA': { color: 'bg-blue-500', label: 'Eletiva' },
  };
  return map[p] || map['ELETIVA'];
};

// --- Componentes Principais ---

const GestaoFila = () => {
    // Filtros e Estado
    const [filtros, setFiltros] = useState<FilaParams>({
        pagina: 1,
        limite: 20,
    });
    const [buscaDebounced, setBuscaDebounced] = useState('');
    const [search, setSearch] = useState('');

    // Dados
    const { data: listData, isLoading: loadingList } = useSolicitacoes({ ...filtros, busca: buscaDebounced });
    const { data: stats, isLoading: loadingStats } = useEstatisticasFila();
    const { data: categoriasData } = useCategorias();
    const { data: unidadesData } = useUnidades();

    // Modais e Drawer
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState<string | null>(null);

    // Debounce de busca
    useEffect(() => {
        const timer = setTimeout(() => setBuscaDebounced(search), 400);
        return () => clearTimeout(timer);
    }, [search]);

    const handleExport = () => {
        const json = JSON.stringify(listData?.dados || [], null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `fila_regulacao_${format(new Date(), 'yyyy-MM-dd')}.json`;
        link.click();
    };

    return (
        <div className="flex bg-slate-50 min-h-screen overflow-hidden">
            {/* Sidebar de Filtros (Padrão 280px) */}
            <aside className="w-72 bg-white border-r border-slate-200 overflow-y-auto hidden lg:block sticky top-0 h-screen p-6">
                <div className="flex items-center gap-2 mb-8">
                    <Filter size={20} className="text-slate-400" />
                    <h2 className="font-bold text-slate-800">Filtros Avançados</h2>
                </div>

                <div className="space-y-8">
                    {/* Filtro de Busca */}
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Paciente / CNS</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                            <input 
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar paciente..."
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                            />
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Status</label>
                        <div className="space-y-2">
                            {['AGUARDANDO', 'AGUARDA_REGULADOR', 'AGENDADO', 'FALTA_DOCUMENTOS', 'DEVOLVIDO', 'ATENDIDO', 'CANCELADO'].map(s => (
                                <label key={s} className="flex items-center gap-3 group cursor-pointer">
                                    <input 
                                        type="checkbox"
                                        checked={filtros.status === s}
                                        onChange={() => setFiltros(prev => ({ ...prev, status: prev.status === s ? undefined : s, pagina: 1 }))}
                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
                                    />
                                    <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors font-medium">
                                        {getStatusBadge(s as StatusFila).label}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Prioridade */}
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Prioridade</label>
                        <div className="space-y-2">
                            {['URGENCIA', 'PRIORITARIO', 'ELETIVA'].map(p => (
                                <label key={p} className="flex items-center gap-3 group cursor-pointer">
                                    <input 
                                        type="checkbox"
                                        checked={filtros.prioridade === p}
                                        onChange={() => setFiltros(prev => ({ ...prev, prioridade: prev.prioridade === p ? undefined : p, pagina: 1 }))}
                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
                                    />
                                    <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors font-medium">
                                        {getPrioridadeCores(p as PrioridadeFila).label}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Categorias */}
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Categoria</label>
                        <select 
                            value={filtros.categoriaId || ''}
                            onChange={(e) => setFiltros(prev => ({ ...prev, categoriaId: e.target.value || undefined, subCategoriaId: undefined, pagina: 1 }))}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                        >
                            <option value="">Todas as Categorias</option>
                            {categoriasData?.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                        </select>
                    </div>

                    {/* Período */}
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Período (Entrada)</label>
                        <div className="grid grid-cols-2 gap-2">
                            <input 
                                type="date"
                                value={filtros.dataInicio || ''}
                                onChange={(e) => setFiltros(prev => ({ ...prev, dataInicio: e.target.value || undefined }))}
                                className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                            />
                            <input 
                                type="date"
                                value={filtros.dataFim || ''}
                                onChange={(e) => setFiltros(prev => ({ ...prev, dataFim: e.target.value || undefined }))}
                                className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                            />
                        </div>
                    </div>

                    <button 
                        onClick={() => {
                            setFiltros({ pagina: 1, limite: 20 });
                            setSearch('');
                        }}
                        className="w-full py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors uppercase tracking-widest"
                    >
                        Limpar Filtros
                    </button>
                </div>
            </aside>

            {/* Área Principal */}
            <main className="flex-1 overflow-y-auto h-screen p-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Regulação Assistencial</h1>
                        <p className="text-slate-500 font-medium">Central de gerenciamento de solicitações de procedimentos</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button 
                            onClick={handleExport}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-2xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-all"
                        >
                            <Download size={18} />
                            Exportar
                        </button>
                        <button 
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
                        >
                            <Plus size={18} />
                            Nova Solicitação
                        </button>
                    </div>
                </div>

                {/* Cards de Estatísticas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard 
                        label="Aguardando" 
                        value={stats?.porStatus['AGUARDANDO'] || 0} 
                        icon={<Clock size={20} />} 
                        color="text-blue-600" 
                        bgColor="bg-blue-100"
                        loading={loadingStats}
                    />
                    <StatCard 
                        label="Aguarda Regulador" 
                        value={stats?.porStatus['AGUARDA_REGULADOR'] || 0} 
                        icon={<Stethoscope size={20} />} 
                        color="text-amber-600" 
                        bgColor="bg-amber-100"
                        loading={loadingStats}
                    />
                    <StatCard 
                        label="Falta Documentos" 
                        value={stats?.porStatus['FALTA_DOCUMENTOS'] || 0} 
                        icon={<AlertCircle size={20} />} 
                        color="text-red-600" 
                        bgColor="bg-red-100"
                        loading={loadingStats}
                    />
                    <StatCard 
                        label="Tempo Médio (Espera)" 
                        value={`${stats?.tempoMedioEsperaDias || 0} dias`} 
                        icon={<History size={20} />} 
                        color="text-slate-600" 
                        bgColor="bg-slate-100"
                        loading={loadingStats}
                    />
                </div>

                {/* Lista de Solicitações */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Prioridade</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Paciente</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Procedimento</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Categoria</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Entrada</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loadingList ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={7} className="px-6 py-4"><div className="h-10 bg-slate-100 rounded-xl w-full"></div></td>
                                        </tr>
                                    ))
                                ) : listData?.dados.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">Nenhuma solicitação encontrada para os filtros aplicados.</td>
                                    </tr>
                                ) : (
                                    listData?.dados.map((s: SolicitacaoFila) => (
                                        <tr 
                                            key={s.id} 
                                            onClick={() => setSelectedId(s.id)}
                                            className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center">
                                                    <div className={`w-3 h-3 rounded-full ${getPrioridadeCores(s.prioridade).color} shadow-sm border border-white`} title={s.prioridade} />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-800">{s.pacienteNome}</span>
                                                    <span className="text-xs text-slate-400 font-medium">CNS: {s.pacienteCns || 'Não inf.'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-slate-600 font-semibold">{s.procedimento.nome}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs text-slate-500 font-medium">
                                                    {s.procedimento.subCategoria.categoria.nome} / {s.procedimento.subCategoria.nome.split(' ').slice(0, 2).join(' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusBadge(s.status).className}`}>
                                                    {getStatusBadge(s.status).label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm text-slate-600 font-medium">{format(new Date(s.dataSolicitacao), 'dd/MM/yyyy')}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase">{formatDistanceToNow(new Date(s.dataSolicitacao), { addSuffix: true, locale: ptBR })}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex justify-end items-center gap-2">
                                                    <button 
                                                        onClick={() => setShowStatusModal(s.id)}
                                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                        title="Alterar Status"
                                                    >
                                                        <ArrowRightLeft size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => setSelectedId(s.id)}
                                                        className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                                                        title="Ver Detalhes"
                                                    >
                                                        <MoreVertical size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Paginação */}
                    <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Mostrando <span className="text-slate-900">{listData?.dados.length || 0}</span> de <span className="text-slate-900">{listData?.paginacao.total || 0}</span> registros
                        </p>
                        <div className="flex gap-2">
                            <button 
                                disabled={filtros.pagina === 1}
                                onClick={() => setFiltros(prev => ({ ...prev, pagina: Math.max(1, (prev.pagina || 1) - 1) }))}
                                className="px-4 py-1.5 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white disabled:opacity-40 transition-colors"
                            >
                                Anterior
                            </button>
                            <button 
                                disabled={filtros.pagina === listData?.paginacao.totalPaginas}
                                onClick={() => setFiltros(prev => ({ ...prev, pagina: (prev.pagina || 1) + 1 }))}
                                className="px-4 py-1.5 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white disabled:opacity-40 transition-colors"
                            >
                                Próximo
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* Painel Lateral (Drawer) */}
            <DrawerDetalhes id={selectedId} onClose={() => setSelectedId(null)} onStatusChange={(id) => setShowStatusModal(id)} />

            {/* Modais */}
            <ModalNovoSolicitacao open={showCreateModal} onClose={() => setShowCreateModal(false)} />
            <ModalMudarStatus id={showStatusModal} onClose={() => setShowStatusModal(null)} />
        </div>
    );
};

// --- Subcomponentes ---

const StatCard = ({ label, value, icon, color, bgColor, loading }: any) => (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 flex items-center gap-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
        <div className={`w-14 h-14 rounded-2xl ${bgColor} ${color} flex items-center justify-center flex-shrink-0 border border-white shadow-inner`}>
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            {loading ? <div className="h-7 w-20 bg-slate-100 animate-pulse rounded-lg"></div> : <p className="text-2xl font-extrabold text-slate-900">{value}</p>}
        </div>
    </div>
);

const DrawerDetalhes = ({ id, onClose, onStatusChange }: any) => {
    const { data: s, isLoading } = useSolicitacao(id);

    if (!id) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-white h-screen shadow-2xl animate-slide-left flex flex-col">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center border border-slate-100`}>
                            <FileText size={20} className="text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-slate-800 tracking-tight">Detalhes da Solicitação</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocolo: {id.slice(0,8).toUpperCase()}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors"><X size={20} /></button>
                </div>

                {isLoading ? (
                    <div className="flex-1 p-8 space-y-8 animate-pulse">
                        <div className="h-32 bg-slate-100 rounded-3xl"></div>
                        <div className="h-48 bg-slate-100 rounded-3xl"></div>
                    </div>
                ) : s && (
                    <div className="flex-1 overflow-y-auto p-8 space-y-10">
                        {/* Paciente */}
                        <section className="space-y-4">
                            <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <User size={14} /> Dados do Paciente
                            </h4>
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                <p className="text-xl font-extrabold text-slate-900">{s.pacienteNome}</p>
                                <div className="mt-4 grid grid-cols-2 gap-y-4 gap-x-2">
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase">CNS</p>
                                        <p className="text-sm font-bold text-slate-700">{s.pacienteCns || 'Não informado'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase">Nascimento</p>
                                        <p className="text-sm font-bold text-slate-700">
                                            {s.pacienteNascimento ? format(new Date(s.pacienteNascimento), 'dd/MM/yyyy') : '---'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase">Telefone</p>
                                        <p className="text-sm font-bold text-slate-700">{s.pacienteTelefone || '---'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase">Status</p>
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${getStatusBadge(s.status).className}`}>
                                            {getStatusBadge(s.status).label}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Procedimento */}
                        <section className="space-y-4">
                            <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <Stethoscope size={14} /> Procedimento e Regulação
                            </h4>
                            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                                <div>
                                    <p className="text-lg font-bold text-slate-800">{s.procedimento.nome}</p>
                                    <p className="text-xs text-slate-500 font-medium">{s.procedimento.subCategoria.categoria.nome} › {s.procedimento.subCategoria.nome}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-widest ${getPrioridadeCores(s.prioridade).color}`}>
                                        Prioridade {getPrioridadeCores(s.prioridade).label}
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase">Unidade Origem</p>
                                        <p className="text-xs font-bold text-slate-700">{s.unidadeOrigem.nome}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase">Médico Solicitante</p>
                                        <p className="text-xs font-bold text-slate-700">{s.medicoSolicitante || 'Não inf.'} {s.crmSolicitante ? `(CRM: ${s.crmSolicitante})` : ''}</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Timeline Histórico */}
                        <section className="space-y-4">
                            <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <History size={14} /> Histórico de Status
                            </h4>
                            <div className="relative pl-6 space-y-8 before:absolute before:left-[7px] before:top-2 before:bottom-0 before:w-0.5 before:bg-slate-100">
                                {s.historico.map((h, i) => (
                                    <div key={h.id} className="relative">
                                        <div className={`absolute -left-[23px] top-1 w-3 h-3 rounded-full border-2 border-white ring-2 ${i === 0 ? 'ring-blue-500 bg-blue-500' : 'ring-slate-200 bg-slate-200'}`} />
                                        <p className="text-xs font-bold text-slate-800">
                                            {h.statusNovo}
                                            {h.statusAnterior && <span className="text-slate-400 font-medium ml-2 text-[10px] inline-block">‹ de {h.statusAnterior}</span>}
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                                            {format(new Date(h.registradoEm), "dd/MM 'às' HH:mm", { locale: ptBR })} • Por {h.registradoPor || 'Sistema'}
                                        </p>
                                        {h.observacao && <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl mt-2 italic">"{h.observacao}"</p>}
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                )}

                <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-3">
                    <button 
                        onClick={() => onStatusChange(s.id)}
                        className="flex-1 py-3 bg-blue-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-500/10 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                    >
                        <ArrowRightLeft size={18} /> Alterar Status
                    </button>
                    <button className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl text-sm font-bold hover:bg-slate-100 transition-all">
                        Editar
                    </button>
                </div>
            </div>
        </div>
    );
};

const ModalNovoSolicitacao = ({ open, onClose }: any) => {
    const [step, setStep] = useState(1);
    const [form, setForm] = useState<any>({
        prioridade: 'ELETIVA',
        status: 'AGUARDANDO',
        documentacaoCompleta: true,
    });
    
    const { data: categorias } = useCategorias();
    const { data: unidades } = useUnidades();
    const mutation = useCriarSolicitacao();

    const subCategorias = useMemo(() => {
        return categorias?.find(c => c.id === form.categoriaId)?.subCategorias || [];
    }, [categorias, form.categoriaId]);

    const procedimentos = useMemo(() => {
        return subCategorias?.find(s => s.id === form.subCategoriaId)?.procedimentos || [];
    }, [subCategorias, form.subCategoriaId]);

    const handleSave = async () => {
        try {
            const payload = { ...form };
            if (!payload.documentacaoCompleta) payload.status = 'FALTA_DOCUMENTOS';
            await mutation.mutateAsync(payload);
            setForm({ prioridade: 'ELETIVA', documentacaoCompleta: true });
            setStep(1);
            onClose();
        } catch (e) { alert('Erro ao criar solicitação'); }
    };

    if (!open) return null;

    const steps = [
        { n: 1, label: 'Paciente', icon: <User size={16} /> },
        { n: 2, label: 'Procedimento', icon: <Stethoscope size={16} /> },
        { n: 3, label: 'Finalização', icon: <Info size={16} /> }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header Wizard */}
                <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Nova Solicitação</h3>
                            <p className="text-slate-500 text-sm">Preencha os dados do paciente e procedimento.</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors"><X size={20} /></button>
                    </div>

                    <div className="flex items-center justify-between relative px-4">
                        <div className="absolute left-10 right-10 top-5 h-0.5 bg-slate-200 -z-0" />
                        {steps.map(s => (
                            <div key={s.n} className="relative z-10 flex flex-col items-center gap-2 group">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${step >= s.n ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white border-slate-200 text-slate-400'}`}>
                                    {step > s.n ? <CheckCircle2 size={20} /> : s.icon}
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${step >= s.n ? 'text-blue-600' : 'text-slate-400'}`}>{s.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-10">
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Nome Completo</label>
                                    <input 
                                        type="text" 
                                        value={form.pacienteNome || ''}
                                        onChange={e => setForm({...form, pacienteNome: e.target.value})}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-bold text-slate-800"
                                        placeholder="Ex: João Silva Sauro"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">CNS (15 dígitos)</label>
                                    <input 
                                        type="text" 
                                        maxLength={15}
                                        value={form.pacienteCns || ''}
                                        onChange={e => setForm({...form, pacienteCns: e.target.value.replace(/\D/g, '')})}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-bold"
                                        placeholder="000 0000 0000 0000"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">CPF</label>
                                    <input 
                                        type="text"
                                        value={form.pacienteCpf || ''}
                                        onChange={e => setForm({...form, pacienteCpf: e.target.value})}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-bold"
                                        placeholder="000.000.000-00"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Nascimento</label>
                                    <input 
                                        type="date"
                                        value={form.pacienteNascimento || ''}
                                        onChange={e => setForm({...form, pacienteNascimento: e.target.value})}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Telefone</label>
                                    <input 
                                        type="text"
                                        value={form.pacienteTelefone || ''}
                                        onChange={e => setForm({...form, pacienteTelefone: e.target.value})}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-bold"
                                        placeholder="(00) 00000-0000"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Categoria</label>
                                    <select 
                                        value={form.categoriaId || ''}
                                        onChange={e => setForm({...form, categoriaId: e.target.value, subCategoriaId: '', procedimentoId: ''})}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-bold"
                                    >
                                        <option value="">Selecione...</option>
                                        {categorias?.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Subcategoria</label>
                                    <select 
                                        disabled={!form.categoriaId}
                                        value={form.subCategoriaId || ''}
                                        onChange={e => setForm({...form, subCategoriaId: e.target.value, procedimentoId: ''})}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-bold disabled:opacity-50"
                                    >
                                        <option value="">Selecione...</option>
                                        {subCategorias.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Procedimento</label>
                                    <select 
                                        disabled={!form.subCategoriaId}
                                        value={form.procedimentoId || ''}
                                        onChange={e => setForm({...form, procedimentoId: e.target.value})}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-bold disabled:opacity-50"
                                    >
                                        <option value="">Selecione...</option>
                                        {procedimentos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Prioridade</label>
                                    <select 
                                        value={form.prioridade}
                                        onChange={e => setForm({...form, prioridade: e.target.value})}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-bold"
                                    >
                                        <option value="ELETIVA">Eletiva (Normal)</option>
                                        <option value="PRIORITARIO">Prioritário (Urgente)</option>
                                        <option value="URGENCIA">Urgência (Risco Imediato)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Unidade de Origem</label>
                                    <select 
                                        value={form.unidadeOrigemId || ''}
                                        onChange={e => setForm({...form, unidadeOrigemId: e.target.value})}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-bold"
                                    >
                                        <option value="">Selecione...</option>
                                        {unidades?.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Médico Solicitante</label>
                                    <input 
                                        type="text" 
                                        value={form.medicoSolicitante || ''}
                                        onChange={e => setForm({...form, medicoSolicitante: e.target.value})}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-bold"
                                        placeholder="Nome do médico"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">CRM (Opcional)</label>
                                    <input 
                                        type="text" 
                                        value={form.crmSolicitante || ''}
                                        onChange={e => setForm({...form, crmSolicitante: e.target.value})}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-bold"
                                        placeholder="000000-UF"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-8">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Observações e Justificativa</label>
                                <textarea 
                                    value={form.observacoes || ''}
                                    onChange={e => setForm({...form, observacoes: e.target.value})}
                                    rows={4}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-bold text-sm"
                                    placeholder="Descreva o quadro clínico e motivo da urgência..."
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Local de Referência (Destino)</label>
                                <input 
                                    type="text" 
                                    value={form.unidadeDestinoNome || ''}
                                    onChange={e => setForm({...form, unidadeDestinoNome: e.target.value})}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-bold"
                                    placeholder="Clínica ou Hospital de destino"
                                />
                            </div>
                            <label className="flex items-center gap-4 p-5 bg-blue-50 rounded-3xl border border-blue-100 cursor-pointer transition-all hover:bg-blue-100/50">
                                <input 
                                    type="checkbox" 
                                    checked={form.documentacaoCompleta}
                                    onChange={e => setForm({...form, documentacaoCompleta: e.target.checked})}
                                    className="w-5 h-5 rounded-lg border-blue-300 text-blue-600 focus:ring-blue-500/20"
                                />
                                <div className="flex-1">
                                    <p className="text-sm font-extrabold text-blue-900">Documentação Completa</p>
                                    <p className="text-xs text-blue-600 font-medium italic">Se desmarcado, a solicitação entrará com status "Falta Documentos".</p>
                                </div>
                            </label>
                        </div>
                    )}
                </div>

                {/* Footer Wizard */}
                <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <button 
                        onClick={() => step === 1 ? onClose() : setStep(v => v - 1)}
                        className="px-6 py-3 rounded-2xl font-bold text-sm text-slate-500 hover:bg-slate-100 transition-all flex items-center gap-2"
                    >
                        <ChevronLeft size={18} /> {step === 1 ? 'Cancelar' : 'Anterior'}
                    </button>
                    <button 
                        onClick={() => step === 3 ? handleSave() : setStep(v => v + 1)}
                        disabled={step === 3 && mutation.isPending}
                        className="px-8 py-3 bg-blue-600 text-white rounded-2xl text-sm font-black shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        {mutation.isPending ? <RefreshCw className="animate-spin" size={18} /> : (step === 3 ? <><CheckCircle2 size={18} /> Salvar Solicitação</> : <><ArrowRightLeft size={18} /> Próximo</>)}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ModalMudarStatus = ({ id, onClose }: any) => {
    const { data: s } = useSolicitacao(id);
    const mutation = useAtualizarStatus();
    const [status, setStatus] = useState('');
    const [obs, setObs] = useState('');
    const [motivo, setMotivo] = useState('');
    const [dataAgendamento, setDataAgendamento] = useState('');

    useEffect(() => {
        if (s) setStatus(s.status);
    }, [s]);

    const transicoes: Record<string, string[]> = {
        'AGUARDANDO': ['AGENDADO', 'AGUARDA_REGULADOR', 'FALTA_DOCUMENTOS', 'CANCELADO', 'DEVOLVIDO'],
        'AGUARDA_REGULADOR': ['AGENDADO', 'AGUARDANDO', 'FALTA_DOCUMENTOS', 'CANCELADO', 'DEVOLVIDO'],
        'FALTA_DOCUMENTOS': ['AGUARDANDO', 'CANCELADO'],
        'AGENDADO': ['ATENDIDO', 'CANCELADO', 'AGUARDANDO'],
        'ATENDIDO': [],
        'CANCELADO': [],
        'DEVOLVIDO': ['AGUARDANDO']
    };

    const handleConfirm = async () => {
        if (!status) return;
        try {
            await mutation.mutateAsync({ 
                id: id!, 
                novoStatus: status, 
                observacao: obs,
                motivoCancelamento: motivo,
                dataAgendamento
            });
            onClose();
            setObs('');
            setMotivo('');
            setDataAgendamento('');
        } catch (e) { alert('Erro ao atualizar status'); }
    };

    if (!s) return null;

    const opcoes = transicoes[s.status] || [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden shadow-slate-900/10">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div>
                        <h3 className="font-extrabold text-slate-800 tracking-tight">Alterar Status</h3>
                        <p className="text-xs text-slate-500 font-medium">{s.pacienteNome} • {s.procedimento.nome}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors"><X size={20} /></button>
                </div>

                <div className="p-8 space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Novo Status</label>
                        <select 
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-bold"
                        >
                            <option value={s.status}>{getStatusBadge(s.status as StatusFila).label} (Atual)</option>
                            {opcoes.map(o => <option key={o} value={o}>{getStatusBadge(o as StatusFila).label}</option>)}
                        </select>
                    </div>

                    {status === 'AGENDADO' && (
                        <div className="space-y-4 animate-slide-down">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Data do Agendamento</label>
                                <input 
                                    type="datetime-local"
                                    value={dataAgendamento}
                                    onChange={e => setDataAgendamento(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-bold"
                                />
                            </div>
                        </div>
                    )}

                    {(status === 'CANCELADO' || status === 'DEVOLVIDO') && (
                        <div className="animate-slide-down">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Motivo do Cancelamento/Devolução</label>
                            <textarea 
                                required
                                value={motivo}
                                onChange={e => setMotivo(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-bold text-sm"
                                rows={3}
                                placeholder="Justificativa obrigatória..."
                            />
                        </div>
                    )}

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Observação Adicional</label>
                        <textarea 
                            value={obs}
                            onChange={e => setObs(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-bold text-sm"
                            rows={3}
                            placeholder="Notas da regulação..."
                        />
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold text-sm text-slate-500 hover:bg-slate-200 transition-all">Cancelar</button>
                    <button 
                        onClick={handleConfirm}
                        disabled={mutation.isPending || ( (status === 'CANCELADO' || status === 'DEVOLVIDO') && !motivo )}
                        className="px-8 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-black shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all disabled:opacity-50"
                    >
                        {mutation.isPending ? 'Salvando...' : 'Confirmar Alteração'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GestaoFila;
