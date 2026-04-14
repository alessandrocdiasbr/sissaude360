import { ArrowLeft, Clock, List, AlertCircle, PlayCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GestaoFila = () => {
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
                        Gestão de Fila
                    </h1>
                    <p className="text-slate-500">Monitoramento em tempo real e gestão de fluxo de pacientes.</p>
                </div>

                <div className="flex gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-xl text-sm font-bold border border-green-100">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Sistema Online
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="dashboard-card border-l-4 border-l-blue-500">
                    <div className="flex justify-between items-start mb-4">
                        <List className="text-blue-500" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aguardando</span>
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-1">24 Pacientes</h2>
                    <p className="text-slate-500 text-sm">Média de 12 min p/ atendimento</p>
                </div>

                <div className="dashboard-card border-l-4 border-l-green-500">
                    <div className="flex justify-between items-start mb-4">
                        <PlayCircle className="text-green-500" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Em Atendimento</span>
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-1">08 Salas</h2>
                    <p className="text-slate-500 text-sm">Capacidade operacional: 80%</p>
                </div>

                <div className="dashboard-card border-l-4 border-l-orange-500">
                    <div className="flex justify-between items-start mb-4">
                        <Clock className="text-orange-500" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tempo Máximo</span>
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-1">45 min</h2>
                    <p className="text-orange-600 text-sm font-bold flex items-center gap-1">
                        <AlertCircle size={14} /> Acima da meta (30 min)
                    </p>
                </div>
            </div>

            <div className="dashboard-card min-h-[400px] flex items-center justify-center border-dashed border-2">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto">
                        <List size={32} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Painel de Chamadas & Triagem</h3>
                        <p className="text-slate-500 max-w-sm mx-auto">
                            A integração com o painel de TV e a classificação de risco (Protocolo de Manchester) está em fase de configuração.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GestaoFila;
