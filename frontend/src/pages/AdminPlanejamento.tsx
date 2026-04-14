import { ArrowLeft, ArrowRight, Building2, CalendarRange, Newspaper } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminPlanejamento = () => {
    const navigate = useNavigate();

    const cards = [
        {
            id: 'administracao',
            title: 'Administração',
            description: 'Gestão de unidades de saúde, equipamentos e recursos institucionais.',
            icon: <Building2 className="text-blue-600" size={24} />,
            path: '/admin-planejamento/admin',
            color: 'blue'
        },
        {
            id: 'planejamento',
            title: 'Planejamento',
            description: 'Cadastro de ações, serviços, plano de compras e expansão da rede.',
            icon: <CalendarRange className="text-indigo-600" size={24} />,
            path: '/admin-planejamento/planejamento',
            color: 'indigo'
        },
        {
            id: 'diario',
            title: 'Diário Oficial',
            description: 'Monitoramento de publicações oficiais e alertas de legislação.',
            icon: <Newspaper className="text-emerald-600" size={24} />,
            path: '/admin-planejamento/diario',
            color: 'emerald'
        }
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="space-y-1">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors mb-2 font-medium group"
                >
                    <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
                    Voltar ao Hub Principal
                </button>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Administração e Planejamento</h1>
                <p className="text-slate-500 text-lg">Gerenciamento estratégico e administrativo do município.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {cards.map((card) => (
                    <div
                        key={card.id}
                        onClick={() => navigate(card.path)}
                        className="group relative bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer overflow-hidden"
                    >
                        <div className={`absolute -right-8 -top-8 w-32 h-32 bg-${card.color}-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700`} />

                        <div className="relative z-10 flex flex-col h-full">
                            <div className="p-4 bg-slate-50 rounded-2xl w-fit mb-6 group-hover:bg-white group-hover:shadow-md transition-all">
                                {card.icon}
                            </div>

                            <div className="space-y-3 mb-8">
                                <h3 className="text-2xl font-bold text-slate-800">{card.title}</h3>
                                <p className="text-slate-500 leading-relaxed">
                                    {card.description}
                                </p>
                            </div>

                            <div className="mt-auto pt-6 border-t border-slate-50 flex justify-between items-center text-sm font-bold text-slate-400 group-hover:text-blue-600 transition-colors">
                                <span>Acessar Área</span>
                                <ArrowRight size={20} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminPlanejamento;
