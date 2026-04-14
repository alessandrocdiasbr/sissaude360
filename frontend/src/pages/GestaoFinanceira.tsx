import React, { useState } from 'react';
import { ArrowLeft, Wallet, TrendingUp, Filter, Download, Calendar, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useResumoMunicipio, useDespesas } from '../hooks/useFNS';

const MUNICIPIO_IBGE = '3106200'; // Belo Horizonte como padrão conforme exemplo

const GestaoFinanceira = () => {
    const navigate = useNavigate();
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth] = useState(new Date().getMonth() + 1);

    const { 
        data: resumoData, 
        isLoading: loadingResumo, 
        isError: errorResumo 
    } = useResumoMunicipio(MUNICIPIO_IBGE, selectedYear);

    const { 
        data: despesasData, 
        isLoading: loadingDespesas 
    } = useDespesas(selectedYear, selectedMonth);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    const totalRepasses = resumoData?.dados.reduce((acc, curr) => acc + Number(curr.total), 0) || 0;
    const totalDespesas = despesasData?.paginacao.total || 0; // Exemplo simplificado
    const maiorBloco = resumoData?.dados.reduce((prev, current) => 
        (Number(prev.total) > Number(current.total)) ? prev : current, 
        { bloco: 'N/A', total: 0 }
    );

    if (errorResumo) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 gap-4">
                <AlertCircle size={48} className="text-red-500" />
                <h2 className="text-xl font-bold text-slate-800">Erro ao carregar dados</h2>
                <p>Não foi possível conectar com a API do Fundo Nacional de Saúde.</p>
                <button 
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold"
                >
                    Tentar Novamente
                </button>
            </div>
        );
    }

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
                    <p className="text-slate-500">Repasses FNS e Controle Orçamentário.</p>
                </div>

                <div className="flex gap-3">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                            <Calendar size={18} />
                        </div>
                        <select 
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer"
                        >
                            {[2024, 2025, 2026].map(year => (
                                <option key={year} value={year}>Ano {year}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card 1: Total Repasses */}
                <div className="dashboard-card bg-gradient-to-br from-blue-600 to-blue-700 text-white border-none shadow-xl shadow-blue-500/20">
                    <div className="flex justify-between items-start mb-4">
                        <Wallet className="opacity-80" />
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Total em Repasses ({selectedYear})</span>
                    </div>
                    {loadingResumo ? (
                        <div className="h-9 w-32 bg-white/20 animate-pulse rounded mb-1" />
                    ) : (
                        <h2 className="text-3xl font-bold mb-1">{formatCurrency(totalRepasses)}</h2>
                    )}
                    <p className="text-blue-100 text-sm flex items-center gap-1">
                        <TrendingUp size={14} /> Dados consolidados do FNS
                    </p>
                </div>

                {/* Card 2: Maior Bloco */}
                <div className="dashboard-card border border-slate-100 bg-white hover:border-emerald-200 transition-colors">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 block">Maior Grupo de Repasse</span>
                    {loadingResumo ? (
                        <div className="h-9 w-32 bg-slate-100 animate-pulse rounded mb-1" />
                    ) : (
                        <h2 className="text-2xl font-bold text-slate-900 mb-1">{maiorBloco?.bloco}</h2>
                    )}
                    <p className="text-emerald-600 text-sm font-bold">{formatCurrency(Number(maiorBloco?.total || 0))}</p>
                </div>

                {/* Card 3: Despesas */}
                <div className="dashboard-card border border-slate-100 bg-white">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 block">Registros de Despesas</span>
                    {loadingDespesas ? (
                        <div className="h-9 w-32 bg-slate-100 animate-pulse rounded mb-1" />
                    ) : (
                        <h2 className="text-3xl font-bold text-slate-900 mb-1">{totalDespesas}</h2>
                    )}
                    <p className="text-slate-500 text-sm font-medium">Lotes importados no período</p>
                </div>
            </div>

            <div className="dashboard-card overflow-hidden !p-0 border border-slate-100">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Transferências por Bloco</h3>
                        <p className="text-sm text-slate-500">Detalhamento dos valores recebidos no ano de {selectedYear}.</p>
                    </div>
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors border border-slate-200">
                        <Download size={14} /> PDF
                    </button>
                </div>

                {loadingResumo ? (
                    <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
                        <Loader2 className="animate-spin" />
                        <span className="text-sm font-medium">Carregando demonstrativo...</span>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Bloco de Financiamento</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 text-right">Valor Total Recebido</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 font-medium text-slate-600">
                                {resumoData?.dados.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-6 py-4 text-slate-800 font-semibold">{item.bloco}</td>
                                        <td className="px-6 py-4 text-right font-mono text-emerald-600 bg-emerald-50/30 group-hover:bg-emerald-50/50 transition-colors">
                                            {formatCurrency(Number(item.total))}
                                        </td>
                                    </tr>
                                ))}
                                {resumoData?.dados.length === 0 && (
                                    <tr>
                                        <td colSpan={2} className="px-6 py-12 text-center text-slate-400 italic">
                                            Nenhum repasse encontrado para este município no ano selecionado.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            <tfoot className="bg-slate-50/50">
                                <tr>
                                    <td className="px-6 py-4 font-bold text-slate-900">Total Geral</td>
                                    <td className="px-6 py-4 text-right font-bold text-slate-900 border-t border-slate-200">
                                        {formatCurrency(totalRepasses)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GestaoFinanceira;

