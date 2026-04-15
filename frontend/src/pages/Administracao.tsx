import React, { useState, useEffect } from 'react';
import { ArrowLeft, Building2, Plus, Search, MapPin, Phone, X, Save, Trash2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:3001/api';

const Administracao = () => {
    const navigate = useNavigate();
    const [unidades, setUnidades] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingUnit, setEditingUnit] = useState<any>(null);
    const [formData, setFormData] = useState({
        nome: '',
        tipo: 'UBS',
        endereco: '',
        telefone: ''
    });

    const getHeaders = () => {
        const sessionData = localStorage.getItem('sissaude360_token');
        const headers: any = { 'Content-Type': 'application/json' };
        if (sessionData) {
            try {
                const { token } = JSON.parse(sessionData);
                if (token) headers['Authorization'] = `Bearer ${token}`;
            } catch (e) {}
        }
        return headers;
    };

    const fetchUnidades = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/unidades`, { headers: getHeaders() });
            const data = await res.json();
            if (Array.isArray(data)) {
                setUnidades(data);
            } else {
                console.error('API retornou erro ou formato inválido:', data);
                setUnidades([]);
            }
        } catch (error) {
            console.error('Erro ao buscar unidades:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUnidades();
    }, []);

    const handleOpenModal = (unit: any = null) => {
        if (unit) {
            setEditingUnit(unit);
            setFormData({
                nome: unit.nome,
                tipo: unit.tipo || 'UBS',
                endereco: unit.endereco || '',
                telefone: unit.telefone || ''
            });
        } else {
            setEditingUnit(null);
            setFormData({ nome: '', tipo: 'UBS', endereco: '', telefone: '' });
        }
        setModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const method = editingUnit ? 'PUT' : 'POST';
        const url = editingUnit ? `${API_URL}/unidades/${editingUnit.id}` : `${API_URL}/unidades`;

        try {
            const res = await fetch(url, {
                method,
                headers: getHeaders(),
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setModalOpen(false);
                fetchUnidades();
            } else {
                const error = await res.json();
                alert(error.error || 'Erro ao salvar unidade');
            }
        } catch (error) {
            alert('Erro na comunicação com o servidor');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta unidade?')) return;

        try {
            const res = await fetch(`${API_URL}/unidades/${id}`, { 
                method: 'DELETE',
                headers: getHeaders()
            });
            if (res.ok) fetchUnidades();
        } catch (error) {
            alert('Erro ao excluir unidade');
        }
    };

    const filteredUnidades = unidades.filter(u =>
        u.nome.toLowerCase().includes(search.toLowerCase()) ||
        u.tipo?.toLowerCase().includes(search.toLowerCase())
    );

    const stats = {
        total: unidades.length,
        ubs: unidades.filter(u => u.tipo === 'UBS' || u.tipo === 'ESF').length,
        especialidade: unidades.filter(u => u.tipo === 'Policlínica' || u.tipo === 'Especializada').length,
        urgencia: unidades.filter(u => u.tipo === 'UPA' || u.tipo === 'Hospital').length,
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in slide-in-from-right duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-1">
                    <button
                        onClick={() => navigate('/admin-planejamento')}
                        className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors mb-2 font-medium group"
                    >
                        <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
                        Voltar
                    </button>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        Administração de Unidades
                    </h1>
                    <p className="text-slate-500">Cadastro e gerenciamento das unidades de saúde do município.</p>
                </div>

                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20"
                >
                    <Plus size={18} /> Nova Unidade
                </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard label="Total Unidades" value={stats.total} />
                <StatCard label="UBS / ESF" value={stats.ubs} />
                <StatCard label="Especializadas" value={stats.especialidade} />
                <StatCard label="Hospitais / UPA" value={stats.urgencia} />
            </div>

            {/* List */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                    <h3 className="font-bold text-slate-800">Unidades Cadastradas</h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar unidade..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-64"
                        />
                    </div>
                </div>

                <div className="divide-y divide-slate-50">
                    {loading ? (
                        <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                            <Loader2 className="animate-spin" size={32} />
                            <p className="text-sm font-medium">Carregando unidades...</p>
                        </div>
                    ) : filteredUnidades.length > 0 ? (
                        filteredUnidades.map((unit) => (
                            <UnitItem
                                key={unit.id}
                                unit={unit}
                                onEdit={() => handleOpenModal(unit)}
                                onDelete={() => handleDelete(unit.id)}
                            />
                        ))
                    ) : (
                        <div className="p-12 text-center text-slate-400">
                            Nenhuma unidade encontrada.
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Building2 size={20} className="text-blue-600" />
                                {editingUnit ? 'Editar Unidade' : 'Cadastrar Nova Unidade'}
                            </h3>
                            <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Nome da Unidade</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.nome}
                                        onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                        placeholder="Ex: UBS Santa Luzia"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Tipo de Unidade</label>
                                    <select
                                        value={formData.tipo}
                                        onChange={e => setFormData({ ...formData, tipo: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                    >
                                        <option value="UBS">Unidade Básica de Saúde (UBS)</option>
                                        <option value="ESF">Estratégia Saúde da Família (ESF)</option>
                                        <option value="Policlínica">Policlínica / Especialidades</option>
                                        <option value="UPA">UPA 24h</option>
                                        <option value="Hospital">Hospital Municipal</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Telefone</label>
                                        <input
                                            type="text"
                                            value={formData.telefone}
                                            onChange={e => setFormData({ ...formData, telefone: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                            placeholder="(00) 0000-0000"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">ID Sistema (Opcional)</label>
                                        <input
                                            disabled
                                            value={editingUnit?.id?.substring(0, 8) || 'Automático'}
                                            className="w-full px-4 py-3 bg-slate-200/50 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Endereço Completo</label>
                                    <input
                                        type="text"
                                        value={formData.endereco}
                                        onChange={e => setFormData({ ...formData, endereco: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                        placeholder="Ex: Av. Central, 123 - Centro"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="flex-1 px-6 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2"
                                >
                                    <Save size={18} /> Salvar Alterações
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const StatCard = ({ label, value }: any) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
);

const UnitItem = ({ unit, onEdit, onDelete }: any) => (
    <div className="p-6 hover:bg-slate-50 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between group gap-4">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                <Building2 size={24} />
            </div>
            <div>
                <h4 className="font-bold text-slate-900">{unit.nome}</h4>
                <p className="text-xs text-slate-500 font-medium">{unit.tipo || 'UBS'}</p>
            </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 md:gap-12 text-slate-500">
            <div className="flex items-center gap-2 min-w-[200px]">
                <MapPin size={16} />
                <span className="text-sm truncate max-w-[250px]">{unit.endereco || 'Endereço não cadastrado'}</span>
            </div>
            <div className="flex items-center gap-2">
                <Phone size={16} />
                <span className="text-sm">{unit.telefone || 'S/ Tel'}</span>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={onEdit}
                    className="px-4 py-2 text-blue-600 font-bold text-xs hover:bg-blue-50 rounded-lg transition-all"
                >
                    Editar
                </button>
                <button
                    onClick={onDelete}
                    className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    title="Excluir"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    </div>
);

export default Administracao;
