import { ArrowLeft, CalendarRange, Plus, CheckCircle2, Clock, BarChart3, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Planejamento = () => {
    const navigate = useNavigate();

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
                        Planejamento Estratégico
                    </h1>
                    <p className="text-slate-500">Cadastro de ações, serviços, compras e expansão da rede.</p>
                </div>

                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20">
                        <Plus size={18} /> Novo Plano
                    </button>
                </div>
            </div>

            {/* Planning Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <CategoryCard icon={<CheckCircle2 className="text-green-500" />} title="Ações e Projetos" count={8} color="green" />
                <CategoryCard icon={<Clock className="text-blue-500" />} title="Serviços (Lista)" count={12} color="blue" />
                <CategoryCard icon={<ShoppingCart className="text-orange-500" />} title="Plano de Compras" count={5} color="orange" />
                <CategoryCard icon={<BarChart3 className="text-purple-500" />} title="Expansão" count={3} color="purple" />
            </div>

            <div className="dashboard-card min-h-[400px] flex items-center justify-center border-dashed border-2">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
                        <CalendarRange size={32} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Módulo de Planejamento Ativo</h3>
                        <p className="text-slate-500 max-w-sm mx-auto">
                            Utilize os cards acima para gerenciar as metas e planos de expansão do sistema de saúde.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CategoryCard = ({ icon, title, count, color }: any) => (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group">
        <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-slate-50 rounded-xl group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <span className={`text-xs font-black px-2 py-1 rounded bg-${color}-50 text-${color}-600`}>ATIVOS</span>
        </div>
        <h4 className="font-bold text-slate-800 mb-1">{title}</h4>
        <p className="text-sm text-slate-500">{count} registros encontrados</p>
    </div>
);

export default Planejamento;
