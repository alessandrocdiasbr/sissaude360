import React, { useState, useEffect } from 'react';
import {
    ArrowLeft, Package, Plus, Search, Filter,
    ArrowUpCircle, ArrowDownCircle, Info,
    Building2, ClipboardList, Warehouse, Loader2, Save, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:3001/api';

const Almoxarifado = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [itens, setItens] = useState<any[]>([]);
    const [estoque, setEstoque] = useState<any[]>([]);
    const [unidades, setUnidades] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState('central'); // 'central' ou 'unidades'
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('Todos');

    const [itemModalOpen, setItemModalOpen] = useState(false);
    const [movModalOpen, setMovModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);

    const [itemForm, setItemForm] = useState({
        nome: '',
        descricao: '',
        categoria: 'Saúde',
        unidadeMedida: 'Unidade'
    });

    const [movForm, setMovForm] = useState({
        itemId: '',
        unidadeId: 'central',
        tipo: 'ENTRADA',
        quantidade: '',
        observacao: ''
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [itensRes, unidadesRes, estoqueRes] = await Promise.all([
                fetch(`${API_URL}/itens`),
                fetch(`${API_URL}/unidades`),
                fetch(`${API_URL}/estoque?unidadeId=${activeTab}`)
            ]);

            const iData = await itensRes.json();
            const uData = await unidadesRes.json();
            const eData = await estoqueRes.json();

            setItens(Array.isArray(iData) ? iData : []);
            setUnidades(Array.isArray(uData) ? uData : []);
            setEstoque(Array.isArray(eData) ? eData : []);
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const handleCreateItem = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/itens`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(itemForm)
            });
            if (res.ok) {
                setItemModalOpen(false);
                fetchData();
            }
        } catch (error) {
            alert('Erro ao criar item');
        }
    };

    const handleMovimentacao = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/estoque/movimentar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(movForm)
            });
            if (res.ok) {
                setMovModalOpen(false);
                fetchData();
            }
        } catch (error) {
            alert('Erro ao processar movimentação');
        }
    };

    const categories = ['Todos', 'Saúde', 'Curativo', 'Instrumental', 'Papelaria', 'Consumo'];

    const filteredItens = itens.filter(i => {
        const matchesSearch = i.nome.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = filterCategory === 'Todos' || i.categoria === filterCategory;
        return matchesSearch && matchesCategory;
    });

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
                        Voltar ao Início
                    </button>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        Gestão de Almoxarifado
                    </h1>
                    <p className="text-slate-500">Controle de materiais de consumo, instrumental e estoque geral.</p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => setItemModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <Plus size={18} className="text-blue-600" /> Novo Item
                    </button>
                    <button
                        onClick={() => {
                            setMovForm({ ...movForm, tipo: 'ENTRADA' });
                            setMovModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20"
                    >
                        <ArrowUpCircle size={18} /> Entrada de Estoque
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Itens Cadastrados</p>
                    <p className="text-2xl font-bold text-slate-900">{itens.length}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm border-l-4 border-l-amber-400">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Itens com Baixo Estoque</p>
                    <p className="text-2xl font-bold text-slate-900">0</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Movimentações (Mês)</p>
                    <p className="text-2xl font-bold text-slate-900">0</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm border-l-4 border-l-blue-500">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Status Sistema</p>
                    <p className="text-sm font-bold text-emerald-500 flex items-center gap-1 mt-2">
                        ● Online e Sincronizado
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden min-h-[500px]">
                {/* Tabs & Search */}
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-50/50">
                    <div className="flex bg-slate-200/50 p-1 rounded-xl">
                        <button
                            onClick={() => setActiveTab('central')}
                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'central' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Warehouse size={16} className="inline mr-2" /> Central
                        </button>
                        <button
                            onClick={() => setActiveTab('unidades')}
                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'unidades' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Building2 size={16} className="inline mr-2" /> Unidades
                        </button>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Buscar material..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                            />
                        </div>
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer"
                        >
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 text-slate-400 uppercase text-[10px] tracking-widest font-bold border-b border-slate-100">
                                <th className="px-8 py-4">Status</th>
                                <th className="px-8 py-4">Item</th>
                                <th className="px-8 py-4">Categoria</th>
                                <th className="px-8 py-4">Saldo Atual</th>
                                <th className="px-8 py-4">Unidade de Medida</th>
                                <th className="px-8 py-4 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-2 text-slate-400">
                                            <Loader2 className="animate-spin" size={32} />
                                            <span className="text-sm font-medium">Carregando estoque...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredItens.length > 0 ? (
                                filteredItens.map((item) => {
                                    const saldoObj = estoque.find(e => e.itemId === item.id);
                                    const saldo = saldoObj ? saldoObj.quantidade : 0;

                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-8 py-4">
                                                <span className={`w-2 h-2 rounded-full inline-block ${saldo > 10 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : saldo > 0 ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`}></span>
                                            </td>
                                            <td className="px-8 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center font-bold">
                                                        {item.nome.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 leading-none">{item.nome}</p>
                                                        <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-tight">{item.descricao || 'Sem descrição'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-4">
                                                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">{item.categoria}</span>
                                            </td>
                                            <td className="px-8 py-4">
                                                <p className={`text-lg font-bold ${saldo > 0 ? 'text-slate-900' : 'text-rose-500'}`}>{saldo}</p>
                                            </td>
                                            <td className="px-8 py-4 text-sm text-slate-500 font-medium">
                                                {item.unidadeMedida}
                                            </td>
                                            <td className="px-8 py-4 text-center">
                                                <button
                                                    onClick={() => {
                                                        setSelectedItem(item);
                                                        setMovForm({ ...movForm, itemId: item.id });
                                                        setMovModalOpen(true);
                                                    }}
                                                    className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-600 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    Movimentar
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center text-slate-400">
                                        Nenhum material encontrado com os filtros atuais.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal: New Item */}
            {itemModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-xl">
                                <Package size={22} className="text-blue-600" /> Cadastrar Material
                            </h3>
                            <button onClick={() => setItemModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateItem} className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Nome do Material</label>
                                    <input
                                        required
                                        type="text"
                                        value={itemForm.nome}
                                        onChange={e => setItemForm({ ...itemForm, nome: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                        placeholder="Ex: Luvas de Procedimento (G)"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Categoria</label>
                                        <select
                                            value={itemForm.categoria}
                                            onChange={e => setItemForm({ ...itemForm, categoria: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                        >
                                            {categories.filter(c => c !== 'Todos').map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Unidade</label>
                                        <select
                                            value={itemForm.unidadeMedida}
                                            onChange={e => setItemForm({ ...itemForm, unidadeMedida: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                        >
                                            <option value="Unidade">Unidade</option>
                                            <option value="Caixa">Caixa</option>
                                            <option value="Pacote">Pacote</option>
                                            <option value="Frasco">Frasco</option>
                                            <option value="Rolo">Rolo</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Descrição / Especificações</label>
                                    <textarea
                                        value={itemForm.descricao}
                                        onChange={e => setItemForm({ ...itemForm, descricao: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                        placeholder="Ex: Látex, descartável, caixa com 100 unidades."
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setItemModalOpen(false)} className="flex-1 px-6 py-4 border border-slate-100 text-slate-500 rounded-2xl font-bold">Cancelar</button>
                                <button type="submit" className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-500/20">Cadastrar Item</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Movimentação */}
            {movModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-xl">
                                <ClipboardList size={22} className="text-blue-600" /> Movimentar Estoque
                            </h3>
                            <button onClick={() => setMovModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>

                        <form onSubmit={handleMovimentacao} className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-center gap-4">
                                    <Package className="text-blue-600" />
                                    <div>
                                        <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest leading-tight">Material Selecionado</p>
                                        <p className="font-bold text-blue-900">{selectedItem?.nome || 'Selecione abaixo'}</p>
                                    </div>
                                </div>

                                {!selectedItem && (
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Selecionar Material</label>
                                        <select
                                            required
                                            value={movForm.itemId}
                                            onChange={e => setMovForm({ ...movForm, itemId: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                        >
                                            <option value="">Selecione um item...</option>
                                            {itens.map(i => <option key={i.id} value={i.id}>{i.nome}</option>)}
                                        </select>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Destino / Almoxarifado</label>
                                        <select
                                            value={movForm.unidadeId}
                                            onChange={e => setMovForm({ ...movForm, unidadeId: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                        >
                                            <option value="central">Central (Principal)</option>
                                            {unidades.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Operação</label>
                                        <select
                                            value={movForm.tipo}
                                            onChange={e => setMovForm({ ...movForm, tipo: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-blue-600"
                                        >
                                            <option value="ENTRADA">Entrada (+)</option>
                                            <option value="SAIDA">Saída / Consumo (-)</option>
                                            <option value="AJUSTE">Ajuste de Saldo</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Quantidade ({selectedItem?.unidadeMedida || 'Un'})</label>
                                    <input
                                        required
                                        type="number"
                                        step="any"
                                        value={movForm.quantidade}
                                        onChange={e => setMovForm({ ...movForm, quantidade: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xl font-bold"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setMovModalOpen(false)} className="flex-1 px-6 py-4 border border-slate-100 text-slate-500 rounded-2xl font-bold">Voltar</button>
                                <button type="submit" className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2">
                                    <Save size={18} /> Confirmar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Almoxarifado;
