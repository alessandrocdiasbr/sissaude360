import React, { useState, useEffect } from 'react';
import {
    ArrowLeft, Users, UserPlus, Search, Building2,
    Phone, Mail, Briefcase, FileText, X, Loader2, Save,
    ChevronRight, MapPin, BadgeCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:3001/api';

const GestaoPessoas = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [unidades, setUnidades] = useState<any[]>([]);
    const [servidores, setServidores] = useState<any[]>([]);
    const [selectedUnidade, setSelectedUnidade] = useState<any>(null);
    const [modalOpen, setModalOpen] = useState(false);

    const [form, setForm] = useState({
        nome: '',
        telefone: '',
        email: '',
        funcao: '',
        formaContratacao: 'Concurso',
        unidadeId: ''
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [uRes, sRes] = await Promise.all([
                fetch(`${API_URL}/unidades`),
                fetch(`${API_URL}/servidores`)
            ]);

            const uData = await uRes.json();
            const sData = await sRes.json();

            setUnidades(Array.isArray(uData) ? uData : []);
            setServidores(Array.isArray(sData) ? sData : []);
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/servidores`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            if (res.ok) {
                setModalOpen(false);
                fetchData();
                setForm({ nome: '', telefone: '', email: '', funcao: '', formaContratacao: 'Concurso', unidadeId: '' });
            }
        } catch (error) {
            alert('Erro ao cadastrar');
        }
    };

    const getServidoresByUnidade = (unidadeId: string) => {
        return servidores.filter(s => s.unidadeId === unidadeId);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in slide-in-from-right duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-1">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors mb-2 font-medium group"
                    >
                        <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
                        Voltar ao Menu
                    </button>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        Gestão de Pessoas
                    </h1>
                    <p className="text-slate-500">Administração de servidores, lotações e regimes de trabalho.</p>
                </div>

                <button
                    onClick={() => setModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20"
                >
                    <UserPlus size={18} /> Novo Cadastro
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-2xl font-black text-slate-900 leading-tight">{servidores.length}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total de Servidores</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                        <BadgeCheck size={24} />
                    </div>
                    <div>
                        <p className="text-2xl font-black text-slate-900 leading-tight">{servidores.filter(s => s.formaContratacao === 'Concurso').length}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Servidores Efetivos</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                        <Building2 size={24} />
                    </div>
                    <div>
                        <p className="text-2xl font-black text-slate-900 leading-tight">{unidades.length}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Unidades de Lotação</p>
                    </div>
                </div>
            </div>

            {/* Unit Cards Grid */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <MapPin size={20} className="text-rose-500" /> Unidades e Equipes
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {loading ? (
                        <div className="col-span-full py-20 flex flex-col items-center gap-3 text-slate-400">
                            <Loader2 className="animate-spin" size={32} />
                            <p className="font-medium">Carregando unidades...</p>
                        </div>
                    ) : unidades.map(u => (
                        <button
                            key={u.id}
                            onClick={() => setSelectedUnidade(selectedUnidade?.id === u.id ? null : u)}
                            className={`p-6 bg-white rounded-2xl border transition-all text-left flex flex-col justify-between h-full group hover:shadow-lg ${selectedUnidade?.id === u.id ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-slate-100 hover:border-blue-300'}`}
                        >
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${selectedUnidade?.id === u.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600'}`}>
                                        {u.nome.charAt(0)}
                                    </div>
                                    <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg uppercase tracking-tighter">{u.tipo}</span>
                                </div>
                                <h3 className="font-bold text-slate-900 text-lg group-hover:text-blue-600 transition-colors">{u.nome}</h3>
                                <p className="text-slate-400 text-xs mt-1 mb-4 flex items-center gap-1 font-medium italic">
                                    {u.endereco || 'Endereço não cadastrado'}
                                </p>
                            </div>
                            <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                                <p className="text-xs font-bold text-slate-500 flex items-center gap-1">
                                    <Users size={14} className="text-slate-400" />
                                    {getServidoresByUnidade(u.id).length} Servidores
                                </p>
                                <ChevronRight size={18} className={`text-slate-300 transition-all ${selectedUnidade?.id === u.id ? 'translate-x-1 text-blue-500' : 'group-hover:translate-x-1 group-hover:text-blue-400'}`} />
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Selected Unit Server List */}
            {selectedUnidade && (
                <div className="animate-in slide-in-from-top duration-500 bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden border-t-4 border-t-blue-600">
                    <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 uppercase tracking-tight">
                                Equipe: {selectedUnidade.nome}
                            </h3>
                            <p className="text-slate-500 text-xs font-bold mt-1">Lista de profissionais lotados nesta unidade</p>
                        </div>
                        <button onClick={() => setSelectedUnidade(null)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-all">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black border-b border-slate-100">
                                    <th className="px-8 py-4">Servidor</th>
                                    <th className="px-8 py-4">Função / Cargo</th>
                                    <th className="px-8 py-4">Regime de Contratação</th>
                                    <th className="px-8 py-4">Contato</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {getServidoresByUnidade(selectedUnidade.id).length > 0 ? (
                                    getServidoresByUnidade(selectedUnidade.id).map(s => (
                                        <tr key={s.id} className="hover:bg-blue-50/30 transition-colors">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold">
                                                        {s.nome.charAt(0)}
                                                    </div>
                                                    <p className="font-bold text-slate-900">{s.nome}</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-tight">
                                                        <Briefcase size={14} className="text-blue-500" />
                                                        {s.funcao}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${s.formaContratacao === 'Concurso' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {s.formaContratacao}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="space-y-1">
                                                    <p className="text-xs text-slate-500 flex items-center gap-2 font-medium">
                                                        <Phone size={12} className="text-slate-400" /> {s.telefone || '(00) 00000-0000'}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 flex items-center gap-2 font-medium italic">
                                                        <Mail size={12} className="text-slate-400" /> {s.email || 'nao@informado.com'}
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-20 text-center text-slate-400">
                                            <Users size={48} className="mx-auto mb-4 opacity-10" />
                                            Nenhum servidor vinculado a esta unidade.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal: Novo Servidor */}
            {modalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-black text-slate-900 flex items-center gap-2 text-xl uppercase tracking-tighter">
                                <UserPlus size={22} className="text-blue-600" /> Novo Servidor
                            </h3>
                            <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5 col-span-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Digite o nome do servidor"
                                        value={form.nome}
                                        onChange={e => setForm({ ...form, nome: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-medium h-14"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Telefone</label>
                                    <input
                                        type="text"
                                        placeholder="(00) 00000-0000"
                                        value={form.telefone}
                                        onChange={e => setForm({ ...form, telefone: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-medium h-14"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
                                    <input
                                        type="email"
                                        placeholder="servidor@email.com"
                                        value={form.email}
                                        onChange={e => setForm({ ...form, email: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-medium h-14"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Função / Cargo</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Ex: Enfermeiro, Médico, ACS..."
                                        value={form.funcao}
                                        onChange={e => setForm({ ...form, funcao: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-medium h-14"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Regime de Contratação</label>
                                    <select
                                        required
                                        value={form.formaContratacao}
                                        onChange={e => setForm({ ...form, formaContratacao: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-bold text-slate-700 h-14 appearance-none"
                                    >
                                        <option value="Concurso">Concurso</option>
                                        <option value="Processo Seletivo">Processo Seletivo</option>
                                        <option value="Contrato Temporário">Contrato Temporário</option>
                                        <option value="Comissão">Comissão</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5 col-span-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unidade de Lotação</label>
                                    <select
                                        required
                                        value={form.unidadeId}
                                        onChange={e => setForm({ ...form, unidadeId: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-bold text-slate-700 h-14 appearance-none"
                                    >
                                        <option value="">Selecione a unidade...</option>
                                        {unidades.map(u => <option key={u.id} value={u.id}>{u.nome} ({u.tipo})</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-8 py-4.5 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all text-xs">Cancelar</button>
                                <button type="submit" className="flex-1 px-8 py-4.5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 text-xs flex items-center justify-center gap-2">
                                    <Save size={18} /> Salvar Servidor
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GestaoPessoas;
