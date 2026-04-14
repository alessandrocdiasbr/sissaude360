import React from 'react';
import { ArrowLeft, Wallet, TrendingUp, Filter, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GestaoFinanceira = () => {
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
                        Gestão Financeira
                    </h1>
                    <p className="text-slate-500">Controle orçamentário, repasses e faturamento.</p>
                </div>

                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                        <Filter size={18} /> Filtrar
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20">
                        <Download size={18} /> Exportar Relatório
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="dashboard-card bg-gradient-to-br from-blue-600 to-blue-700 text-white border-none">
                    <div className="flex justify-between items-start mb-4">
                        <Wallet className="opacity-80" />
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Saldo Disponível</span>
                    </div>
                    <h2 className="text-3xl font-bold mb-1">R$ 1.250.000,00</h2>
                    <p className="text-blue-100 text-sm flex items-center gap-1">
                        <TrendingUp size={14} /> +12% em relação ao mês anterior
                    </p>
                </div>

                <div className="dashboard-card">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 block">Repasses FMS</span>
                    <h2 className="text-3xl font-bold text-slate-900 mb-1">R$ 450.200,00</h2>
                    <p className="text-green-600 text-sm font-bold">Processado</p>
                </div>

                <div className="dashboard-card">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 block">Despesas Previstas</span>
                    <h2 className="text-3xl font-bold text-slate-900 mb-1">R$ 310.000,00</h2>
                    <p className="text-yellow-600 text-sm font-bold">Em análise</p>
                </div>
            </div>

            <div className="dashboard-card min-h-[400px] flex items-center justify-center border-dashed border-2">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto">
                        <TrendingUp size={32} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Módulo em Desenvolvimento</h3>
                        <p className="text-slate-500 max-w-sm mx-auto">
                            Estamos preparando ferramentas avançadas de análise financeira e faturamento para o SisSaude360.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GestaoFinanceira;
