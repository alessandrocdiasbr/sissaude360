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
    AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FONTES = [
    { id: "DOU", label: "DOU Federal", cor: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
    { id: "DOMG", label: "Diário MG (Estado)", cor: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
    { id: "ALMG", label: "ALMG (Legislativo)", cor: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100" },
    { id: "QD", label: "Municípios MG", cor: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
];

const mockAlertas = [
    {
        id: 1, lido: false, salvo: false, destacado: true, preferencia: "Portarias APS",
        fonte: "DOU", tipo: "PORTARIA",
        titulo: "PORTARIA GM/MS Nº 1.891, DE 14 DE ABRIL DE 2026",
        resumo: "Altera critérios de financiamento da Atenção Primária à Saúde nos municípios com população inferior a 20.000 habitantes.",
        data: "14/04/2026",
        url: "https://www.in.gov.br/consulta/-/google-search?q=PORTARIA+GM/MS+N%C2%BA+1.891"
    },
    {
        id: 2, lido: false, salvo: true, destacado: false, preferencia: "Vigilância Sanitária MG",
        fonte: "DOMG", tipo: "RESOLUÇÃO",
        titulo: "Resolução SES/MG nº 8.023 de 13 de abril de 2026",
        resumo: "Dispõe sobre protocolos de vigilância sanitária para estabelecimentos de saúde no Estado de Minas Gerais.",
        data: "13/04/2026",
        url: "https://www.jornalminasgerais.mg.gov.br/index.php"
    },
    {
        id: 3, lido: true, salvo: false, destacado: false, preferencia: "Portarias APS",
        fonte: "DOU", tipo: "INSTRUÇÃO NORMATIVA",
        titulo: "INSTRUÇÃO NORMATIVA SAPS/MS Nº 44, DE 10 DE ABRIL DE 2026",
        resumo: "Estabelece diretrizes para o monitoramento de indicadores da Estratégia Saúde da Família.",
        data: "10/04/2026",
        url: "https://www.in.gov.br/consulta/-/google-search?q=INSTRUCAO+NORMATIVA+SAPS"
    },
    {
        id: 4, lido: false, salvo: false, destacado: false, preferencia: "Legislação MG",
        fonte: "ALMG", tipo: "LEI",
        titulo: "Lei Estadual nº 24.521/2026 — Atenção à Saúde Mental",
        resumo: "Institui a Política Estadual de Atenção Integral em Saúde Mental no âmbito do SUS-MG.",
        data: "09/04/2026",
        url: "https://www.almg.gov.br/atividade-legislativa/normas-juridicas/"
    },
];

const mockPreferencias = [
    { id: 1, nome: "Portarias APS", termos: ["atenção primária", "APS", "ESF"], fontes: ["DOU"], secao: "1", tipo_doc: "PORTARIA", ativo: true },
    { id: 2, nome: "Vigilância Sanitária MG", termos: ["vigilância sanitária", "VISA"], fontes: ["DOMG"], secao: "all", tipo_doc: "RESOLUÇÃO", ativo: true },
    { id: 3, nome: "Legislação MG", termos: ["saúde", "SUS"], fontes: ["ALMG"], secao: "all", tipo_doc: null, ativo: true },
];

const DiarioOficialMonitor = () => {
    const navigate = useNavigate();
    const [aba, setAba] = useState("alertas");
    const [alertas, setAlertas] = useState(mockAlertas);
    const [preferencias, setPreferencias] = useState(mockPreferencias);
    const [filtroFonte, setFiltroFonte] = useState("todas");
    const [modalAberto, setModalAberto] = useState(false);
    const [prefEditando, setPrefEditando] = useState<any>(null);
    const [form, setForm] = useState<any>({ nome: "", termos: "", fontes: [], secao: "1", tipo_doc: "" });

    const alertasFiltrados = alertas.filter(a => {
        if (aba === "alertas") {
            if (filtroFonte !== "todas" && a.fonte !== filtroFonte) return false;
            return true;
        }
        if (aba === "salvos") return a.salvo;
        if (aba === "destaques") return a.destacado;
        return true;
    });

    const marcarLido = (id: number) => setAlertas(prev =>
        prev.map(a => a.id === id ? { ...a, lido: true } : a)
    );

    const toggleSalvar = (id: number) => setAlertas(prev =>
        prev.map(a => a.id === id ? { ...a, salvo: !a.salvo } : a)
    );

    const toggleDestacar = (id: number) => setAlertas(prev =>
        prev.map(a => a.id === id ? { ...a, destacado: !a.destacado } : a)
    );

    const salvarPreferencia = () => {
        if (!form.nome || !form.termos || form.fontes.length === 0) return;
        const nova = {
            id: prefEditando ? prefEditando.id : Date.now(),
            nome: form.nome,
            termos: form.termos.split(",").map((t: string) => t.trim()).filter(Boolean),
            fontes: form.fontes,
            secao: form.secao,
            tipo_doc: form.tipo_doc || null,
            ativo: true
        };
        if (prefEditando) {
            setPreferencias(prev => prev.map(p => p.id === prefEditando.id ? nova : p));
        } else {
            setPreferencias(prev => [...prev, nova]);
        }
        setModalAberto(false);
    };

    const naoLidos = alertas.filter(a => !a.lido).length;

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
                                    {alertasFiltrados.length}
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

                        <div className="grid grid-cols-1 gap-4">
                            {alertasFiltrados.length === 0 ? (
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
                                alertasFiltrados.map(alerta => (
                                    <div
                                        key={alerta.id}
                                        className={`group bg-white rounded-3xl p-6 border transition-all ${alerta.lido ? "border-slate-100 opacity-80" : "border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200"
                                            }`}
                                    >
                                        <div className="flex flex-col lg:flex-row gap-6">
                                            <div className="flex-1 space-y-4">
                                                <div className="flex flex-wrap gap-2">
                                                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${FONTES.find(f => f.id === alerta.fonte)?.bg
                                                        } ${FONTES.find(f => f.id === alerta.fonte)?.cor
                                                        }`}>
                                                        {FONTES.find(f => f.id === alerta.fonte)?.label}
                                                    </span>
                                                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                                        {alerta.tipo}
                                                    </span>
                                                    <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-lg text-[10px] font-bold flex items-center gap-1">
                                                        <Tag size={10} /> {alerta.preferencia}
                                                    </span>
                                                    {!alerta.lido && (
                                                        <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black animate-pulse uppercase tracking-wider shadow-sm shadow-amber-200/50">
                                                            Novo
                                                        </span>
                                                    )}
                                                </div>

                                                <div>
                                                    <h3 className="text-lg font-extrabold text-slate-900 leading-tight mb-2 group-hover:text-blue-600 transition-colors">
                                                        {alerta.titulo}
                                                    </h3>
                                                    <p className="text-slate-600 text-sm leading-relaxed mb-4">
                                                        {alerta.resumo}
                                                    </p>
                                                    <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                                                        <div className="flex items-center gap-1.5">
                                                            <Clock size={14} />
                                                            Publicado em {alerta.data}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex lg:flex-col items-center justify-end gap-2 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6">
                                                <a
                                                    href={alerta.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex-1 lg:w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 text-center"
                                                >
                                                    LER ÍNTEGRA <ExternalLink size={14} />
                                                </a>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => toggleSalvar(alerta.id)}
                                                        className={`p-2.5 rounded-xl border transition-all ${alerta.salvo
                                                                ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20"
                                                                : "bg-white border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200"
                                                            }`}
                                                        title={alerta.salvo ? "Remover dos salvos" : "Salvar publicação"}
                                                    >
                                                        <Bookmark size={18} fill={alerta.salvo ? "currentColor" : "none"} />
                                                    </button>
                                                    <button
                                                        onClick={() => toggleDestacar(alerta.id)}
                                                        className={`p-2.5 rounded-xl border transition-all ${alerta.destacado
                                                                ? "bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20"
                                                                : "bg-white border-slate-200 text-slate-400 hover:text-amber-500 hover:border-amber-200"
                                                            }`}
                                                        title={alerta.destacado ? "Remover destaque" : "Destacar publicação"}
                                                    >
                                                        <Star size={18} fill={alerta.destacado ? "currentColor" : "none"} />
                                                    </button>
                                                    {!alerta.lido && (
                                                        <button
                                                            onClick={() => marcarLido(alerta.id)}
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
                                ))
                            )}
                        </div>
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
                                    setForm({ nome: "", termos: "", fontes: [], secao: "1", tipo_doc: "" });
                                    setModalAberto(true);
                                }}
                                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20"
                            >
                                <Plus size={18} /> Nova Regra
                            </button>
                        </div>

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
                                                        nome: pref.nome,
                                                        termos: pref.termos.join(", "),
                                                        fontes: pref.fontes,
                                                        secao: pref.secao,
                                                        tipo_doc: pref.tipo_doc || ""
                                                    });
                                                    setModalAberto(true);
                                                }}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                            >
                                                <Settings size={16} />
                                            </button>
                                            <button
                                                onClick={() => setPreferencias(prev => prev.filter(p => p.id !== pref.id))}
                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-bold text-slate-800 mb-2">{pref.nome}</h3>

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
                                        placeholder='Ex: "atenção primária", "recursos", "portaria"'
                                        className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/5 rounded-3xl pl-16 pr-8 py-5 text-lg font-medium outline-none transition-all shadow-inner"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2 text-left">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">De</label>
                                    <input type="date" className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-500/20 rounded-2xl px-6 py-4 outline-none font-bold text-slate-700 transition-all" />
                                </div>
                                <div className="space-y-2 text-left">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Até</label>
                                    <input type="date" className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-500/20 rounded-2xl px-6 py-4 outline-none font-bold text-slate-700 transition-all" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Fontes</label>
                                <div className="flex flex-wrap gap-3">
                                    {FONTES.map(f => (
                                        <label key={f.id} className="cursor-pointer group">
                                            <input type="checkbox" className="hidden peer" defaultChecked />
                                            <div className={`px-6 py-3 rounded-2xl border-2 border-slate-100 text-sm font-bold bg-slate-50 transition-all peer-checked:bg-white peer-checked:border-blue-500 peer-checked:text-blue-600 peer-checked:shadow-lg peer-checked:shadow-blue-500/10 group-hover:bg-white`}>
                                                {f.label}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <button className="w-full py-5 bg-slate-900 hover:bg-black text-white rounded-[2rem] font-black tracking-widest uppercase text-sm transition-all shadow-2xl shadow-slate-900/20">
                                Iniciar Pesquisa Avançada
                            </button>
                        </div>
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
                                    value={form.nome}
                                    onChange={e => setForm((f: any) => ({ ...f, nome: e.target.value }))}
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
                                    onChange={e => setForm((f: any) => ({ ...f, termos: e.target.value }))}
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
                                            onClick={() => {
                                                const newFontes = form.fontes.includes(f.id)
                                                    ? form.fontes.filter((x: string) => x !== f.id)
                                                    : [...form.fontes, f.id];
                                                setForm((prev: any) => ({ ...prev, fontes: newFontes }));
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
                                className="flex-[2] py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.5rem] font-bold shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                            >
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
