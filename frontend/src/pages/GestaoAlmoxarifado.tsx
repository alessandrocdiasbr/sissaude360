import React from 'react';
import { ArrowLeft, Box, Package, AlertTriangle, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GestaoAlmoxarifado = () => {
    const navigate = useNavigate();

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-1">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors mb-2 font-medium group"
                    >
                        <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
                        Voltar ao Hub
                    </button>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        Gestão de Almoxarifado
                    </h1>
                    <p className="text-slate-500">Controle de insumos, medicamentos e estoque central.</p>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar insumo..."
                        className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none w-64 shadow-sm"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="dashboard-card">
                    <div className="flex justify-between items-start mb-4">
                        <Box className="text-blue-600" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total de Itens</span>
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-1">1.284</h2>
                    <p className="text-blue-600 text-sm font-bold">Em conformidade</p>
                </div>

                <div className="dashboard-card border-l-4 border-l-orange-500">
                    <div className="flex justify-between items-start mb-4">
                        <AlertTriangle className="text-orange-500" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estoque Crítico</span>
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-1">12 Itens</h2>
                    <p className="text-orange-600 text-sm font-bold">Requer atenção imediata</p>
                </div>

                <div className="dashboard-card">
                    <div className="flex justify-between items-start mb-4">
                        <Package className="text-green-600" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Entradas (Mês)</span>
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-1">45 Lotes</h2>
                    <p className="text-green-600 text-sm font-bold">+5 novos fornecedores</p>
                </div>
            </div>

            <div className="dashboard-card min-h-[400px] flex items-center justify-center border-dashed border-2">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto">
                        <Package size={32} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Módulo de Estoque em Breve</h3>
                        <p className="text-slate-500 max-w-sm mx-auto">
                            Funcionalidades de inventário, QR Code e rastreabilidade estão sendo preparadas.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GestaoAlmoxarifado;
