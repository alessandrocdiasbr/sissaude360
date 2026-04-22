import { useState } from 'react';
import {
    ArrowLeft,
    Search,
    Settings,
    Star,
    Bookmark,
    ChevronRight,
    Clock,
    Filter,
    Plus,
    CheckCircle2,
    ExternalLink,
    Tag,
    Bell,
    Trash2,
    AlertCircle,
    RefreshCw,
    Loader2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
    useArtigos,
    useSalvarArtigo,
    usePreferencias,
    useCriarPreferencia,
    useAtualizarPreferencia,
    useDeletarPreferencia,
    useColetarDiario,
    useBuscaManual,
} from '../hooks/useDiarioOficial';
import type { DiarioArtigo, DiarioPreferencia } from '../types/diarioOficial';

const FONTES = [
    { id: "DOU", label: "DOU Federal", cor: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
    { id: "DOMG", label: "Diário MG (Estado)", cor: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
    { id: "ALMG", label: "ALMG (Legislativo)", cor: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100" },
    { id: "QD", label: "Municípios MG", cor: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
];

// UI-only state for local article decorations (read / highlight)
interface LocalArtigoState {
    lido: boolean;
    destacado: boolean;
}

const DiarioOficialMonitor = () => {
    const navigate = useNavigate();
    const [aba, setAba] = useState("alertas");
    const [filtroFonte, setFiltroFonte] = useState("todas");
    const [modalAberto, setModalAberto] = useState(false);
    const [prefEditando, setPrefEditando] = useState<DiarioPreferencia | null>(null);
    const [form, setForm] = useState<{ titulo: string; termos: string; fontes: string[] }>({
        titulo: "",
        termos: "",
        fontes: [],
    });

    // UI-only local state for "lido" and "destacado" (no backend needed)
    const [localState, setLocalState] = useState<Record<string, LocalArtigoState>>({});

    // Busca manual form state
    const [buscaTermos, setBuscaTermos] = useState("");
    const [buscaDataInicio, setBuscaDataInicio] = useState("");
    const [buscaDataFim, setBuscaDataFim] = useState("");
    const [buscaFontesSelecionadas, setBuscaFontesSelecionadas] = useState<string[]>(
        FONTES.map(f => f.id)
    );

    // --- React Query hooks ---
    const artigosQuery = useArtigos(
        filtroFonte !== "todas" ? { fonte: filtroFonte } : undefined
    );
    const preferenciasQuery = usePreferencias();
    const salvarArtigo = useSalvarArtigo();
    const coletarDiario = useColetarDiario();
    const buscaManual = useBuscaManual();
    const criarPreferencia = useCriarPreferencia();
    const atualizarPreferencia = useAtualizarPreferencia();
    const deletarPreferencia = useDeletarPreferencia();

    // Helpers for local UI state
    const getLocalState = (id: string): LocalArtigoState =>
        localState[id] ?? { lido: false, destacado: false };

    const marcarLido = (id: string) =>
        setLocalState(prev => ({
            ...prev,
            [id]: { ...getLocalState(id), lido: true },
        }));

    const toggleDestacar = (id: string) =>
        setLocalState(prev => ({
            ...prev,
            [id]: { ...getLocalState(id), destacado: !getLocalState(id).destacado },
        }));

    // Derived lists
    const artigos: DiarioArtigo[] = artigosQuery.data ?? [];
    const preferencias: DiarioPreferencia[] = preferenciasQuery.data ?? [];

    const artigosFiltrados = artigos.filter(a => {
        const local = getLocalState(a.id);
        if (aba === "salvos") return a.salvo;
        if (aba === "destaques") return local.destacado;
        return true;
    });

    const naoLidos = artigos.filter(a => !getLocalState(a.id).lido).length;

    // Modal save handler
    const salvarPreferencia = () => {
        if (!form.titulo || !form.termos || form.fontes.length === 0) return;

        const termos = form.termos
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);

        if (prefEditando) {
            atualizarPreferencia.mutate(
                { id: prefEditando.id, dados: { titulo: form.titulo, termos, fontes: form.fontes } },
                { onSuccess: () => setModalAberto(false) }
            );
        } else {
            criarPreferencia.mutate(
                { titulo: form.titulo, termos, fontes: form.fontes },
                { onSuccess: () => setModalAberto(false) }
            );
        }
    };

    const handleBuscaManual = () => {
        if (!buscaTermos.trim() || buscaFontesSelecionadas.length === 0) return;
        buscaManual.mutate({
            termos: buscaTermos,
            fontes: buscaFontesSelecionadas,
            dataInicio: buscaDataInicio || undefined,
            dataFim: buscaDataFim || undefined,
        });
    };

    const toggleBuscaFonte = (id: string) => {
        setBuscaFontesSelecionadas(prev =>
            prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
        );
    };

    const isSavingPref = criarPreferencia.isPending || atualizarPreferencia.isPending;

    return (
        <div className="min-h-screen bg-slate-50/50">
            {/* Header Premium */}
            <div className="bg-slate-900 text-white p-6 shadow-2xl">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/admin-planejamento')}
                            className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all group"
                        >
                            <ArrowLeft className="group-hover:-translate-x-0.5 transition-transform" size={20} />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Monitor Estratégico</span>
                                {naoLidos > 0 && (
                                    <span className="bg-rose-500 text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                                        {naoLidos} NOVOS
                                    </span>
                                )}
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight">Diários Oficiais</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/10">
                        <div className="px-4 border-r border-white/10 hidden lg:block">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 text-right">Data de Hoje</p>
                            <p className="text-sm font-medium text-blue-100">
                                {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                            </p>
                        </div>
                        <button
                            onClick={() => coletarDiario.mutate()}
                            disabled={coletarDiario.isPending}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                            title="Disparar coleta manual agora"
                        >
                            {coletarDiario.isPending
                                ? <Loader2 size={16} className="animate-spin" />
                                : <RefreshCw size={16} />
                            }
                            Atualizar Agora
                        </button>
                        <button
                            onClick={() => setAba('preferencias')}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
                        >
                            <Settings size={16} /> Configurar Monitor
                        </button>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex gap-8">
                        {[
                            { id: "alertas", label: "Alertas do Dia", icon: <Bell size={18} /> },
                            { id: "salvos", label: "Salvos", icon: <Bookmark size={18} /> },
                            { id: "destaques", label: "Destaques", icon: <Star size={18} /> },
                            { id: "busca", label: "Busca Manual", icon: <Search size={18} /> },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setAba(tab.id)}
                                className={`flex items-center gap-2 py-4 text-sm font-bold transition-all border-b-2 ${aba === tab.id
                                        ? "text-blue-600 border-blue-600"
                                        : "text-slate-500 border-transparent hover:text-slate-800"
                                    }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6 md:p-8">

                {/* Alerts / Saved / Highlights Section */}
                {(aba === "alertas" || aba === "salvos" || aba === "destaques") && (
                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                {aba === "alertas" && "Publicações Identificadas"}
                                {aba === "salvos" && "Publicações Salvas"}
                                {aba === "destaques" && "Prioridades e Destaques"}
                                <span className="text-sm font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                    {artigosFiltrados.length}
                                </span>
                            </h2>

                            {aba === "alertas" && (
                                <div className="flex items-center gap-3 w-full md:w-auto">
                                    <Filter className="text-slate-400" size={18} />
                                    <select
                                        value={filtroFonte}
                                        onChange={e => setFiltroFonte(e.target.value)}
                                        className="flex-1 md:w-48 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm"
                                    >
                                        <option value="todas">Todas as Fontes</option>
                                        {FONTES.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Loading state */}
                        {artigosQuery.isLoading && (
                            <div className="flex items-center justify-center py-16">
                                <Loader2 size={36} className="animate-spin text-blue-500" />
                            </div>
                        )}

                        {/* Error state */}
                        {artigosQuery.isError && (
                            <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center space-y-3">
                                <AlertCircle className="mx-auto text-rose-500" size={32} />
                                <p className="text-rose-700 font-bold">Erro ao carregar publicações.</p>
                                <button
                                    onClick={() => artigosQuery.refetch()}
                                    className="text-sm text-rose-600 underline hover:no-underline"
                                >
                                    Tentar novamente
                                </button>
                            </div>
                        )}

                        {/* Content */}
                        {!artigosQuery.isLoading && !artigosQuery.isError && (
                            <div className="grid grid-cols-1 gap-4">
                                {artigosFiltrados.length === 0 ? (
                                    <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2rem] p-12 text-center space-y-4">
                                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-300">
                                            <AlertCircle size={32} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-800">Nada encontrado aqui</h3>
                                            <p className="text-sm text-slate-500 max-w-xs mx-auto">
                                                {aba === "salvos" ? "Suas publicações salvas aparecerão aqui." : "Continue monitorando os Diários Oficiais para novas publicações."}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    artigosFiltrados.map(artigo => {
                                        const local = getLocalState(artigo.id);
                                        const dataFormatada = new Date(artigo.dataPublicacao).toLocaleDateString("pt-BR", {
                                            day: "2-digit", month: "2-digit", year: "numeric"
                                        });

                                        return (
                                            <div
                                                key={artigo.id}
                                                className={`group bg-white rounded-3xl p-6 border transition-all ${local.lido ? "border-slate-100 opacity-80" : "border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200"
                                                    }`}
                                            >
                                                <div className="flex flex-col lg:flex-row gap-6">
                                                    <div className="flex-1 space-y-4">
                                                        <div className="flex flex-wrap gap-2">
                                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${FONTES.find(f => f.id === artigo.fonte)?.bg
                                                                } ${FONTES.find(f => f.id === artigo.fonte)?.cor
                                                                }`}>
                                                                {FONTES.find(f => f.id === artigo.fonte)?.label ?? artigo.fonte}
                                                            </span>
                                                            {artigo.secao && (
                                                                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                                                    {artigo.secao}
                                                                </span>
                                                            )}
                                                            {artigo.orgao && (
                                                                <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-lg text-[10px] font-bold flex items-center gap-1">
                                                                    <Tag size={10} /> {artigo.orgao}
                                                                </span>
                                                            )}
                                                            {!local.lido && (
                                                                <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black animate-pulse uppercase tracking-wider shadow-sm shadow-amber-200/50">
                                                                    Novo
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div>
                                                            <h3 className="text-lg font-extrabold text-slate-900 leading-tight mb-2 group-hover:text-blue-600 transition-colors">
                                                                {artigo.titulo}
                                                            </h3>
                                                            {artigo.resumo && (
                                                                <p className="text-slate-600 text-sm leading-relaxed mb-4">
                                                                    {artigo.resumo}
                                                                </p>
                                                            )}
                                                            <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                                                                <div className="flex items-center gap-1.5">
                                                                    <Clock size={14} />
                                                                    Publicado em {dataFormatada}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex lg:flex-col items-center justify-end gap-2 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6">
                                                        {artigo.url && (
                                                            <a
                                                                href={artigo.url}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="flex-1 lg:w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 text-center"
                                                            >
                                                                LER ÍNTEGRA <ExternalLink size={14} />
                                                            </a>
                                                        )}
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => salvarArtigo.mutate(artigo.id)}
                                                                disabled={salvarArtigo.isPending}
                                                                className={`p-2.5 rounded-xl border transition-all ${artigo.salvo
                                                                        ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20"
                                                                        : "bg-white border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200"
                                                                    } disabled:opacity-60`}
                                                                title={artigo.salvo ? "Remover dos salvos" : "Salvar publicação"}
                                                            >
                                                                <Bookmark size={18} fill={artigo.salvo ? "currentColor" : "none"} />
                                                            </button>
                                                            <button
                                                                onClick={() => toggleDestacar(artigo.id)}
                                                                className={`p-2.5 rounded-xl border transition-all ${local.destacado
                                                                        ? "bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20"
                                                                        : "bg-white border-slate-200 text-slate-400 hover:text-amber-500 hover:border-amber-200"
                                                                    }`}
                                                                title={local.destacado ? "Remover destaque" : "Destacar publicação"}
                                                            >
                                                                <Star size={18} fill={local.destacado ? "currentColor" : "none"} />
                                                            </button>
                                                            {!local.lido && (
                                                                <button
                                                                    onClick={() => marcarLido(artigo.id)}
                                                                    className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all"
                                                                    title="Marcar como lido"
                                                                >
                                                                    <CheckCircle2 size={18} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Preferences Section */}
                {aba === "preferencias" && (
                    <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
                        <div className="flex justify-between items-end">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Preferências de Monitoramento</h2>
                                <p className="text-slate-500">Defina os termos e fontes que o sistema deve rastrear automaticamente.</p>
                            </div>
                            <button
                                onClick={() => {
                                    setPrefEditando(null);
                                    setForm({ titulo: "", termos: "", fontes: [] });
                                    setModalAberto(true);
                                }}
                                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20"
                            >
                                <Plus size={18} /> Nova Regra
                            </button>
                        </div>

                        {/* Loading state */}
                        {preferenciasQuery.isLoading && (
                            <div className="flex items-center justify-center py-16">
                                <Loader2 size={36} className="animate-spin text-blue-500" />
                            </div>
                        )}

                        {/* Error state */}
                        {preferenciasQuery.isError && (
                            <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center space-y-3">
                                <AlertCircle className="mx-auto text-rose-500" size={32} />
                                <p className="text-rose-700 font-bold">Erro ao carregar preferências.</p>
                                <button
                                    onClick={() => preferenciasQuery.refetch()}
                                    className="text-sm text-rose-600 underline hover:no-underline"
                                >
                                    Tentar novamente
                                </button>
                            </div>
                        )}

                        {!preferenciasQuery.isLoading && !preferenciasQuery.isError && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {preferencias.map(pref => (
                                    <div key={pref.id} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                                                <Bell size={20} />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        setPrefEditando(pref);
                                                        setForm({
                                                            titulo: pref.titulo,
                                                            termos: pref.termos.join(", "),
                                                            fontes: pref.fontes,
                                                        });
                                                        setModalAberto(true);
                                                    }}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                >
                                                    <Settings size={16} />
                                                </button>
                                                <button
                                                    onClick={() => deletarPreferencia.mutate(pref.id)}
                                                    disabled={deletarPreferencia.isPending}
                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all disabled:opacity-60"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        <h3 className="text-lg font-bold text-slate-800 mb-2">{pref.titulo}</h3>

                                        <div className="space-y-4">
                                            <div className="flex flex-wrap gap-1.5">
                                                {pref.fontes.map(f => (
                                                    <span key={f} className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">
                                                        {f}
                                                    </span>
                                                ))}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Termos Monitorados</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {pref.termos.map((t, idx) => (
                                                        <span key={idx} className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg text-xs font-bold border border-blue-100">
                                                            {t}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Manual Search Section */}
                {aba === "busca" && (
                    <div className="max-w-3xl mx-auto space-y-8 animate-in zoom-in-95 duration-500">
                        <div className="text-center space-y-2">
                            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Busca sob demanda</h2>
                            <p className="text-slate-500">Vasculhe o histórico dos diários oficiais em qualquer período.</p>
                        </div>

                        <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-slate-200/50 border border-slate-100 space-y-8">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">O que você procura?</label>
                                <div className="relative group">
                                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={24} />
                                    <input
                                        type="text"
                                        value={buscaTermos}
                                        onChange={e => setBuscaTermos(e.target.value)}
                                        placeholder='Ex: "atenção primária", "recursos", "portaria"'
                                        className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/5 rounded-3xl pl-16 pr-8 py-5 text-lg font-medium outline-none transition-all shadow-inner"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2 text-left">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">De</label>
                                    <input
                                        type="date"
                                        value={buscaDataInicio}
                                        onChange={e => setBuscaDataInicio(e.target.value)}
                                        className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-500/20 rounded-2xl px-6 py-4 outline-none font-bold text-slate-700 transition-all"
                                    />
                                </div>
                                <div className="space-y-2 text-left">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Até</label>
                                    <input
                                        type="date"
                                        value={buscaDataFim}
                                        onChange={e => setBuscaDataFim(e.target.value)}
                                        className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-500/20 rounded-2xl px-6 py-4 outline-none font-bold text-slate-700 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Fontes</label>
                                <div className="flex flex-wrap gap-3">
                                    {FONTES.map(f => (
                                        <button
                                            key={f.id}
                                            type="button"
                                            onClick={() => toggleBuscaFonte(f.id)}
                                            className={`px-6 py-3 rounded-2xl border-2 text-sm font-bold transition-all ${buscaFontesSelecionadas.includes(f.id)
                                                    ? "bg-white border-blue-500 text-blue-600 shadow-lg shadow-blue-500/10"
                                                    : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-white hover:border-slate-200"
                                                }`}
                                        >
                                            {f.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleBuscaManual}
                                disabled={buscaManual.isPending || !buscaTermos.trim()}
                                className="w-full py-5 bg-slate-900 hover:bg-black disabled:opacity-60 text-white rounded-[2rem] font-black tracking-widest uppercase text-sm transition-all shadow-2xl shadow-slate-900/20 flex items-center justify-center gap-3"
                            >
                                {buscaManual.isPending && <Loader2 size={20} className="animate-spin" />}
                                Iniciar Pesquisa Avançada
                            </button>
                        </div>

                        {/* Busca results */}
                        {buscaManual.isError && (
                            <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 text-center space-y-2">
                                <AlertCircle className="mx-auto text-rose-500" size={28} />
                                <p className="text-rose-700 font-bold text-sm">Erro ao realizar a busca. Tente novamente.</p>
                            </div>
                        )}

                        {buscaManual.isSuccess && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    Resultados
                                    <span className="text-sm font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                        {buscaManual.data.length}
                                    </span>
                                </h3>

                                {buscaManual.data.length === 0 ? (
                                    <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2rem] p-10 text-center space-y-3">
                                        <AlertCircle size={32} className="mx-auto text-slate-300" />
                                        <p className="text-slate-500 font-medium">Nenhuma publicação encontrada para os critérios informados.</p>
                                    </div>
                                ) : (
                                    buscaManual.data.map(artigo => {
                                        const dataFormatada = new Date(artigo.dataPublicacao).toLocaleDateString("pt-BR", {
                                            day: "2-digit", month: "2-digit", year: "numeric"
                                        });
                                        return (
                                            <div key={artigo.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${FONTES.find(f => f.id === artigo.fonte)?.bg} ${FONTES.find(f => f.id === artigo.fonte)?.cor}`}>
                                                        {FONTES.find(f => f.id === artigo.fonte)?.label ?? artigo.fonte}
                                                    </span>
                                                    {artigo.secao && (
                                                        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                                            {artigo.secao}
                                                        </span>
                                                    )}
                                                </div>
                                                <h4 className="text-base font-extrabold text-slate-900 leading-tight mb-2">{artigo.titulo}</h4>
                                                {artigo.resumo && (
                                                    <p className="text-slate-600 text-sm leading-relaxed mb-3">{artigo.resumo}</p>
                                                )}
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                                                        <Clock size={13} /> {dataFormatada}
                                                    </span>
                                                    {artigo.url && (
                                                        <a
                                                            href={artigo.url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="flex items-center gap-1.5 text-xs font-black text-slate-700 hover:text-blue-600 transition-colors"
                                                        >
                                                            LER ÍNTEGRA <ExternalLink size={12} />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal Nova Regra */}
            {modalAberto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setModalAberto(false)} />
                    <div className="relative bg-white rounded-[3rem] p-10 w-full max-w-xl shadow-2xl animate-in zoom-in-95 duration-300 space-y-8 border border-white/20">
                        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                            {prefEditando ? "Editar Regra" : "Nova Regra de Monitoramento"}
                        </h2>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Nome da Regra</label>
                                <input
                                    value={form.titulo}
                                    onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                                    placeholder='Ex: "Legislação de Financiamento"'
                                    className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-500/20 rounded-2xl px-6 py-4 outline-none font-bold text-slate-700 transition-all shadow-inner"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1 flex justify-between">
                                    Palavras-chave
                                    <span className="font-normal normal-case text-slate-400 italic">separadas por vírgula</span>
                                </label>
                                <textarea
                                    value={form.termos}
                                    onChange={e => setForm(f => ({ ...f, termos: e.target.value }))}
                                    placeholder='recursos, suspensão, acréscimo, portaria nº'
                                    rows={3}
                                    className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-500/20 rounded-2xl px-6 py-4 outline-none font-bold text-slate-700 transition-all shadow-inner resize-none"
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Monitorar em quais fontes?</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {FONTES.map(f => (
                                        <button
                                            key={f.id}
                                            type="button"
                                            onClick={() => {
                                                const newFontes = form.fontes.includes(f.id)
                                                    ? form.fontes.filter((x) => x !== f.id)
                                                    : [...form.fontes, f.id];
                                                setForm(prev => ({ ...prev, fontes: newFontes }));
                                            }}
                                            className={`px-4 py-3 rounded-2xl border-2 text-left transition-all ${form.fontes.includes(f.id)
                                                    ? "bg-white border-blue-500 text-blue-600 shadow-lg shadow-blue-500/10"
                                                    : "bg-slate-50 border-transparent text-slate-400 hover:bg-white hover:border-slate-200"
                                                }`}
                                        >
                                            <p className="text-xs font-black uppercase tracking-widest truncate">{f.label}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                onClick={() => setModalAberto(false)}
                                className="flex-1 py-4 text-slate-400 font-bold hover:text-slate-600 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={salvarPreferencia}
                                disabled={isSavingPref}
                                className="flex-[2] py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-[1.5rem] font-bold shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                            >
                                {isSavingPref
                                    ? <Loader2 size={18} className="animate-spin" />
                                    : null
                                }
                                {prefEditando ? "Salvar Alterações" : "Ativar Monitoramento"} <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DiarioOficialMonitor;
