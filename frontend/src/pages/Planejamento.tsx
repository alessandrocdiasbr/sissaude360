import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  ChevronRight, 
  X, 
  Calendar, 
  User, 
  Building2, 
  TrendingUp, 
  Target,
  LayoutDashboard,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAcoes, useMetas, usePlanejamentoMutations } from '../hooks/usePlanejamento';
import { useUnidades } from '../hooks/useUnidades';
import type { AcaoSaude, MetaAnual } from '../types/planejamento';

const Planejamento = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'acoes' | 'metas'>('acoes');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [showModal, setShowModal] = useState(false);

    // Hooks de dados
    const { data: acoes, isLoading: loadingAcoes } = useAcoes();
    const { data: metasAgrupadas, isLoading: loadingMetas } = useMetas(selectedYear);
    const { data: unidades } = useUnidades();
    const { 
      criarAcao, 
      atualizarStatus, 
      atualizarProgresso,
      deletarAcao 
    } = usePlanejamentoMutations();

    // Estado para nova ação
    const [novaAcao, setNovaAcao] = useState<Partial<AcaoSaude>>({
      titulo: '',
      descricao: '',
      categoria: 'ACAO',
      prioridade: 'MEDIA',
      responsavel: '',
      prazo: '',
      valorEstimado: 0,
      unidadeId: ''
    });

    const handleCreateAcao = (e: React.FormEvent) => {
      e.preventDefault();
      criarAcao.mutate(novaAcao, {
        onSuccess: () => {
          setShowModal(false);
          setNovaAcao({
            titulo: '',
            descricao: '',
            categoria: 'ACAO',
            prioridade: 'MEDIA',
            responsavel: '',
            prazo: '',
            valorEstimado: 0,
            unidadeId: ''
          });
        }
      });
    };

    const handleAvancarStatus = (acao: AcaoSaude) => {
      const fluxos: Record<string, string> = {
        'PROPOSTO': 'APROVADO',
        'APROVADO': 'EM_EXECUCAO',
        'EM_EXECUCAO': 'CONCLUIDO'
      };
      
      const novoStatus = fluxos[acao.status];
      if (novoStatus) {
        atualizarStatus.mutate({ id: acao.id, status: novoStatus });
      }
    };

    const handleCancelar = (id: string) => {
      if (window.confirm('Deseja realmente cancelar esta ação?')) {
        atualizarStatus.mutate({ id, status: 'CANCELADO' });
      }
    };

    const formatDate = (dateString?: string) => {
      if (!dateString) return 'Sem prazo';
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR');
    };

    return (
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <button
                        onClick={() => navigate('/admin-planejamento')}
                        className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors mb-2 font-medium group"
                    >
                        <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
                        Voltar para Admin
                    </button>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <LayoutDashboard className="text-blue-600" />
                        Monitor de Planejamento
                    </h1>
                </div>

                {/* Tabs */}
                <div className="bg-white p-1 rounded-2xl border border-slate-200 shadow-sm flex gap-1">
                    <button
                        onClick={() => setActiveTab('acoes')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                            activeTab === 'acoes' 
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                            : 'text-slate-500 hover:bg-slate-50'
                        }`}
                    >
                        Ações e Projetos
                    </button>
                    <button
                        onClick={() => setActiveTab('metas')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                            activeTab === 'metas' 
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                            : 'text-slate-500 hover:bg-slate-50'
                        }`}
                    >
                        Metas Anuais
                    </button>
                </div>
            </div>

            {/* ABA 1: KANBAN */}
            {activeTab === 'acoes' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-x-auto pb-4 custom-scrollbar">
                        <KanbanColumn 
                            title="PROPOSTO" 
                            color="slate"
                            acoes={acoes?.filter(a => a.status === 'PROPOSTO') || []}
                            onAvancar={handleAvancarStatus}
                            onCancelar={handleCancelar}
                            formatDate={formatDate}
                            onAdd={() => setShowModal(true)}
                        />
                        <KanbanColumn 
                            title="APROVADO" 
                            color="blue"
                            acoes={acoes?.filter(a => a.status === 'APROVADO') || []}
                            onAvancar={handleAvancarStatus}
                            onCancelar={handleCancelar}
                            formatDate={formatDate}
                        />
                        <KanbanColumn 
                            title="EM EXECUÇÃO" 
                            color="amber"
                            acoes={acoes?.filter(a => a.status === 'EM_EXECUCAO') || []}
                            onAvancar={handleAvancarStatus}
                            onCancelar={handleCancelar}
                            formatDate={formatDate}
                        />
                        <KanbanColumn 
                            title="CONCLUÍDO" 
                            color="green"
                            acoes={acoes?.filter(a => a.status === 'CONCLUIDO') || []}
                            onAvancar={handleAvancarStatus}
                            onCancelar={handleCancelar}
                            formatDate={formatDate}
                        />
                    </div>
                    
                    {/* Exibir Cancelados separadamente no final se necessário, 
                        ou o usuário não pediu, então vou omitir ou colocar em 
                        uma lista discreta abaixo se houver. */}
                </div>
            )}

            {/* ABA 2: METAS ANUAIS */}
            {activeTab === 'metas' && (
                <div className="space-y-8">
                    <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3">
                            <Calendar className="text-blue-500" />
                            <span className="font-bold text-slate-700">Ano de Referência:</span>
                            <select 
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                className="bg-slate-50 border-none rounded-lg font-bold text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            >
                                <option value={2025}>2025</option>
                                <option value={2026}>2026</option>
                                <option value={2027}>2027</option>
                            </select>
                        </div>
                        <div className="text-slate-500 text-sm">
                            As metas são atualizadas automaticamente ao sair do campo de valor atual.
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {['ACESSO', 'QUALIDADE', 'FINANCEIRO', 'ESTRUTURA'].map((eixo) => (
                            <section key={eixo} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                                    <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                                        <div className={`w-2 h-6 rounded-full ${getEixoColor(eixo)}`} />
                                        EIXO: {eixo}
                                    </h3>
                                    <button className="text-blue-600 hover:text-blue-700 font-bold text-sm flex items-center gap-1">
                                        <Plus size={16} /> Nova Meta
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {metasAgrupadas && metasAgrupadas[eixo]?.map((meta: MetaAnual) => (
                                        <MetaItem 
                                            key={meta.id} 
                                            meta={meta} 
                                            onUpdate={(val) => atualizarProgresso.mutate({ id: meta.id, valorAtual: val })}
                                        />
                                    ))}
                                    {(!metasAgrupadas || !metasAgrupadas[eixo] || metasAgrupadas[eixo].length === 0) && (
                                        <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 text-sm">
                                            Nenhuma meta definida para este eixo em {selectedYear}.
                                        </div>
                                    )}
                                </div>
                            </section>
                        ))}
                    </div>
                </div>
            )}

            {/* MODAL DE CRIAÇÃO */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-300">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Plus className="text-blue-600" /> Nova Ação de Saúde
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateAcao} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-2 space-y-2">
                                    <label className="text-sm font-bold text-slate-600">Título da Ação</label>
                                    <input 
                                        type="text" required
                                        value={novaAcao.titulo}
                                        onChange={e => setNovaAcao({...novaAcao, titulo: e.target.value})}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="Ex: Ampliação da cobertura vacinal em UBS..."
                                    />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <label className="text-sm font-bold text-slate-600">Descrição/Objetivo</label>
                                    <textarea 
                                        rows={3}
                                        value={novaAcao.descricao}
                                        onChange={e => setNovaAcao({...novaAcao, descricao: e.target.value})}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                                        placeholder="Descreva os detalhes da ação..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-600">Categoria</label>
                                    <select 
                                        value={novaAcao.categoria}
                                        onChange={e => setNovaAcao({...novaAcao, categoria: e.target.value as any})}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="ACAO">Ação</option>
                                        <option value="SERVICO">Serviço</option>
                                        <option value="COMPRA">Compra</option>
                                        <option value="EXPANSAO">Expansão</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-600">Prioridade</label>
                                    <select 
                                        value={novaAcao.prioridade}
                                        onChange={e => setNovaAcao({...novaAcao, prioridade: e.target.value as any})}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="BAIXA">Baixa</option>
                                        <option value="MEDIA">Média</option>
                                        <option value="ALTA">Alta</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-600">Responsável</label>
                                    <input 
                                        type="text"
                                        value={novaAcao.responsavel}
                                        onChange={e => setNovaAcao({...novaAcao, responsavel: e.target.value})}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Nome do responsável"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-600">Prazo</label>
                                    <input 
                                        type="date"
                                        value={novaAcao.prazo}
                                        onChange={e => setNovaAcao({...novaAcao, prazo: e.target.value})}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-600">Valor Estimado (R$)</label>
                                    <input 
                                        type="number"
                                        value={novaAcao.valorEstimado}
                                        onChange={e => setNovaAcao({...novaAcao, valorEstimado: Number(e.target.value)})}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-600">Unidade Vinculada</label>
                                    <select 
                                        value={novaAcao.unidadeId}
                                        onChange={e => setNovaAcao({...novaAcao, unidadeId: e.target.value})}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Nenhuma unidade</option>
                                        {unidades?.map(u => (
                                          <option key={u.id} value={u.id}>{u.nome}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button 
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-6 py-4 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-1 px-6 py-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                                >
                                    Criar Ação
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Subcomponentes ---

const KanbanColumn = ({ title, color, acoes, onAvancar, onCancelar, formatDate, onAdd }: any) => {
    const colorClasses: Record<string, string> = {
        slate: 'bg-slate-100 text-slate-700 border-slate-200',
        blue: 'bg-blue-50 text-blue-700 border-blue-100',
        amber: 'bg-amber-50 text-amber-700 border-amber-100',
        green: 'bg-green-50 text-green-700 border-green-100'
    };

    return (
        <div className="flex-1 flex flex-col min-w-[320px] max-w-[400px] h-[calc(100vh-250px)]">
            <div className={`p-4 rounded-2xl border ${colorClasses[color]} mb-4 flex justify-between items-center`}>
                <div className="flex items-center gap-2">
                    <span className="font-black text-sm">{title}</span>
                    <span className="bg-white/50 px-2 py-0.5 rounded-full text-xs font-bold">{acoes.length}</span>
                </div>
                {onAdd && (
                  <button onClick={onAdd} className="p-1 hover:bg-white/50 rounded-lg transition-colors">
                    <Plus size={18} />
                  </button>
                )}
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                {acoes.map((acao: AcaoSaude) => (
                    <AcaoCard 
                        key={acao.id} 
                        acao={acao} 
                        onAvancar={onAvancar} 
                        onCancelar={onCancelar} 
                        formatDate={formatDate}
                    />
                ))}
            </div>
        </div>
    );
};

const AcaoCard = ({ acao, onAvancar, onCancelar, formatDate }: any) => {
    return (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group border-l-4" 
             style={{ borderLeftColor: getPrioridadeColor(acao.prioridade) }}>
            
            <div className="flex flex-wrap gap-2 mb-3">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${getPrioridadeBadge(acao.prioridade)}`}>
                    {acao.prioridade}
                </span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${getCategoriaBadge(acao.categoria)}`}>
                    {acao.categoria}
                </span>
            </div>

            <h4 className="font-bold text-slate-800 mb-4 leading-tight group-hover:text-blue-600 transition-colors">
                {acao.titulo}
            </h4>

            <div className="space-y-2 mb-5">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar size={14} className="text-slate-400" />
                    <span>Prazo: <span className="text-slate-700 font-semibold">{formatDate(acao.prazo)}</span></span>
                </div>
                {acao.unidade && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Building2 size={14} className="text-slate-400" />
                      <span>Unidade: <span className="text-slate-700 font-semibold">{acao.unidade.nome}</span></span>
                  </div>
                )}
                {acao.responsavel && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                      <User size={14} className="text-slate-400" />
                      <span>Resp: <span className="text-slate-700 font-semibold">{acao.responsavel}</span></span>
                  </div>
                )}
            </div>

            <div className="flex gap-2">
                {acao.status !== 'CONCLUIDO' && (
                  <>
                    <button 
                        onClick={() => onAvancar(acao)}
                        className="flex-1 flex items-center justify-center gap-1 bg-blue-50 text-blue-600 py-2 rounded-lg text-xs font-bold hover:bg-blue-600 hover:text-white transition-all"
                    >
                        Avançar <ChevronRight size={14} />
                    </button>
                    <button 
                        onClick={() => onCancelar(acao.id)}
                        className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-red-50 hover:text-red-500 transition-all"
                        title="Cancelar"
                    >
                        <X size={14} />
                    </button>
                  </>
                )}
                {acao.status === 'CONCLUIDO' && (
                  <div className="flex-1 flex items-center justify-center gap-2 py-2 text-green-600 text-xs font-bold bg-green-50 rounded-lg">
                    <CheckCircle2 size={14} /> Concluída
                  </div>
                )}
            </div>
        </div>
    );
};

const MetaItem = ({ meta, onUpdate }: { meta: MetaAnual, onUpdate: (val: number) => void }) => {
    const [localValue, setLocalValue] = useState(meta.valorAtual);
    const percent = Math.min((meta.valorAtual / meta.valorMeta) * 100, 100);

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-end">
                <div className="space-y-1">
                    <h5 className="font-bold text-slate-700 text-sm">{meta.nome}</h5>
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <Target size={12} /> Meta: {meta.valorMeta}{meta.unidade}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Atual</span>
                      <input 
                          type="number"
                          value={localValue}
                          onChange={(e) => setLocalValue(Number(e.target.value))}
                          onBlur={() => onUpdate(localValue)}
                          className="w-16 text-right font-black text-blue-600 bg-transparent border-b-2 border-slate-100 focus:border-blue-500 outline-none transition-colors"
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-400">{meta.unidade}</span>
                    <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg text-xs font-black">
                        {percent.toFixed(1)}%
                    </div>
                </div>
            </div>
            
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                <div 
                    className={`h-full transition-all duration-1000 relative ${
                        percent >= 100 ? 'bg-green-500' : percent >= 50 ? 'bg-blue-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${percent}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </div>
            </div>
        </div>
    );
};

// --- Helpers ---

const getEixoColor = (eixo: string) => {
  switch (eixo) {
    case 'ACESSO': return 'bg-blue-500';
    case 'QUALIDADE': return 'bg-green-500';
    case 'FINANCEIRO': return 'bg-amber-500';
    case 'ESTRUTURA': return 'bg-purple-500';
    default: return 'bg-slate-500';
  }
};

const getPrioridadeColor = (prio: string) => {
    switch (prio) {
        case 'ALTA': return '#ef4444';
        case 'MEDIA': return '#f59e0b';
        case 'BAIXA': return '#94a3b8';
        default: return '#cbd5e1';
    }
};

const getPrioridadeBadge = (prio: string) => {
    switch (prio) {
        case 'ALTA': return 'bg-red-50 text-red-600';
        case 'MEDIA': return 'bg-amber-50 text-amber-600';
        case 'BAIXA': return 'bg-slate-50 text-slate-600';
        default: return 'bg-slate-100 text-slate-500';
    }
};

const getCategoriaBadge = (cat: string) => {
    switch (cat) {
        case 'ACAO': return 'bg-blue-50 text-blue-600';
        case 'SERVICO': return 'bg-green-50 text-green-600';
        case 'COMPRA': return 'bg-orange-50 text-orange-600';
        case 'EXPANSAO': return 'bg-purple-50 text-purple-600';
        default: return 'bg-slate-50 text-slate-600';
    }
};

export default Planejamento;
