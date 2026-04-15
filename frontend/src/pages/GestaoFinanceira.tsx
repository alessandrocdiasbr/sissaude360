import { useEffect, useMemo, useState } from 'react';
import type React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Download,
  FileJson,
  Loader2,
  Wallet,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useConvenios, useDespesas, useResumoMunicipio } from '../hooks/useFNS';
import type { ConvenioFNS, RespostaPaginada, ResumoBloco } from '../types/fns';

const IBGE_STORAGE_KEY = 'sissaude360_ibge';
const DEFAULT_IBGE = '3106200';

type ConveniosQuery = RespostaPaginada<ConvenioFNS>;

const GestaoFinanceira = () => {
  const navigate = useNavigate();

  // SEÇÃO 1 — Filtros
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [ibge, setIbge] = useState<string>(() => localStorage.getItem(IBGE_STORAGE_KEY) || DEFAULT_IBGE);

  useEffect(() => {
    localStorage.setItem(IBGE_STORAGE_KEY, ibge);
  }, [ibge]);

  const { data: resumoData, isLoading: loadingResumo, isError: errorResumo, refetch: refetchResumo } =
    useResumoMunicipio(ibge, selectedYear);

  const { data: despesasData } = useDespesas(selectedYear, selectedMonth);

  // Convenios: listagem paginada + contador de vigentes
  const [conveniosPage, setConveniosPage] = useState(1);
  const { data: conveniosData, isLoading: loadingConvenios, isError: errorConvenios, refetch: refetchConvenios } =
    useConvenios(selectedYear, undefined, conveniosPage);

  const { data: conveniosVigentesData, isLoading: loadingVigentes } =
    useConvenios(selectedYear, 'vigente', 1);

  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const formatCompactBRL = (value: number) => {
    const abs = Math.abs(value);
    if (abs >= 1_000_000_000) return `R$ ${(value / 1_000_000_000).toFixed(1).replace('.', ',')}B`;
    if (abs >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1).replace('.', ',')}M`;
    if (abs >= 1_000) return `R$ ${(value / 1_000).toFixed(0)}k`;
    return formatCurrency(value);
  };

  // SEÇÃO 2 — Cards de resumo
  const resumoBlocos: ResumoBloco[] = resumoData?.dados ?? [];

  const totalRepasses = useMemo(
    () => resumoBlocos.reduce((acc, curr) => acc + Number(curr.total), 0),
    [resumoBlocos]
  );

  const maiorBloco = useMemo(() => {
    if (resumoBlocos.length === 0) return null;
    return resumoBlocos.reduce((prev, curr) => (Number(prev.total) >= Number(curr.total) ? prev : curr));
  }, [resumoBlocos]);

  const conveniosAtivosCount = conveniosVigentesData?.paginacao.total ?? 0;

  // SEÇÃO 3 — Gráfico
  const chartData = useMemo(
    () =>
      resumoBlocos.map((b) => ({
        bloco: b.bloco.length > 20 ? `${b.bloco.slice(0, 20)}...` : b.bloco,
        total: Number(b.total),
        blocoFull: b.bloco,
      })),
    [resumoBlocos]
  );

  // SEÇÃO 4 — Tabela convênios
  const conveniosRows: ConvenioFNS[] = (conveniosData as ConveniosQuery | undefined)?.dados ?? [];
  const paginacao = (conveniosData as ConveniosQuery | undefined)?.paginacao;

  const formatVigencia = (c: ConvenioFNS) => {
    const ini = c.dataInicio ? new Date(c.dataInicio).toLocaleDateString('pt-BR') : '—';
    const fim = c.dataFim ? new Date(c.dataFim).toLocaleDateString('pt-BR') : '—';
    return `${ini} → ${fim}`;
  };

  const getSituacaoBadge = (situacao: string) => {
    const s = situacao.toLowerCase();
    if (s.includes('vigente')) return 'bg-green-100 text-green-700';
    if (s.includes('susp')) return 'bg-yellow-100 text-yellow-700';
    if (s.includes('encerr') || s.includes('final')) return 'bg-slate-100 text-slate-600';
    return 'bg-slate-100 text-slate-600';
  };

  // SEÇÃO 5 — Exportar
  const handleExport = () => {
    const payload = {
      geradoEm: new Date().toISOString(),
      filtros: { ano: selectedYear, mes: selectedMonth, ibge },
      resumoMunicipio: resumoData ?? null,
      despesas: despesasData ?? null,
      convenios: conveniosData ?? null,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-fns-${selectedYear}-${String(selectedMonth).padStart(2, '0')}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  if (errorResumo) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[320px] text-slate-500 gap-4 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <AlertCircle size={48} className="text-red-500" />
          <h2 className="text-xl font-bold text-slate-800">Erro ao carregar dados do FNS</h2>
          <p className="text-sm text-slate-500 text-center max-w-md">
            Não foi possível carregar o resumo do município. Tente novamente.
          </p>
          <button
            onClick={() => void refetchResumo()}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-sm hover:bg-blue-700 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors mb-2 font-medium group"
          >
            <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
            Voltar ao Hub
          </button>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gestão Financeira</h1>
          <p className="text-slate-500">Repasses FNS e convênios com dados reais.</p>
        </div>

        {/* SEÇÃO 1 — Filtros */}
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-end">
          <SelectWithIcon
            icon={<Calendar size={18} />}
            value={selectedYear}
            onChange={(v) => setSelectedYear(v)}
            options={[2024, 2025, 2026].map((y) => ({ value: y, label: `Ano ${y}` }))}
          />
          <SelectWithIcon
            icon={<Calendar size={18} />}
            value={selectedMonth}
            onChange={(v) => setSelectedMonth(v)}
            options={MONTH_OPTIONS.map((m) => ({ value: m.value, label: m.label }))}
          />
          <div className="flex flex-col gap-1.5 min-w-[220px]">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Código IBGE</label>
            <input
              value={ibge}
              onChange={(e) => setIbge(e.target.value.replace(/\D/g, '').slice(0, 7))}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
              placeholder={DEFAULT_IBGE}
              inputMode="numeric"
            />
          </div>
        </div>
      </div>

      {/* SEÇÃO 2 — Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ResumoCard
          variant="primary"
          title="Repasses Totais"
          subtitle={`Total consolidado (${selectedYear})`}
          icon={<Wallet className="opacity-80" />}
          loading={loadingResumo}
          value={formatCurrency(totalRepasses)}
        />

        <ResumoCard
          variant="default"
          title="Maior Bloco"
          subtitle={maiorBloco?.bloco ?? '—'}
          icon={<div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100" />}
          loading={loadingResumo}
          value={formatCurrency(Number(maiorBloco?.total ?? 0))}
        />

        <ResumoCard
          variant="default"
          title="Convênios Ativos"
          subtitle="Situação: vigente"
          icon={<div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100" />}
          loading={loadingVigentes}
          value={String(conveniosAtivosCount)}
        />
      </div>

      {/* SEÇÃO 3 — Gráfico */}
      <div className="dashboard-card overflow-hidden !p-0 border border-slate-100">
        <div className="p-6 border-b border-slate-100 bg-slate-50/40">
          <h3 className="text-lg font-bold text-slate-800">Transferências por Bloco</h3>
          <p className="text-sm text-slate-500">
            Resumo de blocos de financiamento do município ({ibge}) em {selectedYear}.
          </p>
        </div>

        <div className="p-6">
          {loadingResumo ? (
            <div className="h-[280px] bg-slate-100 animate-pulse rounded-2xl" />
          ) : (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="bloco"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    interval={0}
                    height={60}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    tickFormatter={(v) => formatCompactBRL(Number(v))}
                  />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                    }}
                    formatter={(value: unknown, _name: unknown, props: any) => {
                      const v = Number(value);
                      const full = props?.payload?.blocoFull as string | undefined;
                      return [formatCurrency(v), full ? `Bloco: ${full}` : 'Total'];
                    }}
                  />
                  <Bar dataKey="total" fill="#3b82f6" radius={[8, 8, 0, 0]} barSize={34} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* SEÇÃO 4 — Tabela de Convênios */}
      <div className="dashboard-card overflow-hidden !p-0 border border-slate-100">
        <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/40">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Convênios</h3>
            <p className="text-sm text-slate-500">Listagem paginada dos convênios do MS (ano {selectedYear}).</p>
          </div>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
          >
            <FileJson size={14} /> Exportar Relatório
          </button>
        </div>

        {loadingConvenios ? (
          <div className="p-10 flex items-center justify-center text-slate-400 gap-3">
            <Loader2 className="animate-spin" />
            <span className="text-sm font-medium">Carregando convênios...</span>
          </div>
        ) : errorConvenios ? (
          <div className="p-10 flex items-center justify-center text-slate-500 gap-3">
            <AlertCircle className="text-red-500" />
            <span className="text-sm font-medium">Erro ao carregar convênios.</span>
            <button
              onClick={() => void refetchConvenios()}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-white"
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                  <th className="px-6 py-4">Número</th>
                  <th className="px-6 py-4">Objeto</th>
                  <th className="px-6 py-4">Valor Global</th>
                  <th className="px-6 py-4">Situação</th>
                  <th className="px-6 py-4">Vigência</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {conveniosRows.map((c) => (
                  <tr key={c.numero} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-800 whitespace-nowrap">{c.numero}</td>
                    <td className="px-6 py-4 text-slate-600">
                      <span title={c.objeto}>
                        {c.objeto.length > 60 ? `${c.objeto.slice(0, 60)}...` : c.objeto}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 whitespace-nowrap">
                      {formatCurrency(Number(c.valorGlobal))}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${getSituacaoBadge(c.situacao)}`}>
                        {c.situacao}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">{formatVigencia(c)}</td>
                  </tr>
                ))}
                {conveniosRows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                      Nenhum convênio encontrado para os filtros atuais.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-white">
          <div className="text-xs text-slate-500 font-medium">
            Página {paginacao?.pagina ?? conveniosPage} de {paginacao?.totalPaginas ?? '—'}
          </div>
          <div className="flex gap-2">
            <button
              disabled={conveniosPage <= 1}
              onClick={() => setConveniosPage((p) => Math.max(p - 1, 1))}
              className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              disabled={paginacao ? conveniosPage >= paginacao.totalPaginas : false}
              onClick={() => setConveniosPage((p) => p + 1)}
              className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próximo
            </button>
          </div>
        </div>
      </div>

      {/* Botão auxiliar (mantém a seção 5 explícita no layout) */}
      <div className="flex justify-end">
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-900 text-white font-bold shadow-sm hover:bg-slate-800 transition-colors"
        >
          <Download size={18} /> Exportar Relatório (JSON)
        </button>
      </div>
    </div>
  );
};

type SelectOption<T extends number> = { value: T; label: string };

type SelectWithIconProps<T extends number> = {
  icon: React.ReactElement;
  value: T;
  onChange: (value: T) => void;
  options: Array<SelectOption<T>>;
};

const SelectWithIcon = <T extends number>({ icon, value, onChange, options }: SelectWithIconProps<T>) => (
  <div className="relative group">
    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">{icon}</div>
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value) as T)}
      className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer shadow-sm"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  </div>
);

type ResumoCardProps = {
  variant: 'primary' | 'default';
  title: string;
  subtitle: string;
  icon: React.ReactElement;
  loading: boolean;
  value: string;
};

const ResumoCard = ({ variant, title, subtitle, icon, loading, value }: ResumoCardProps) => (
  <div
    className={
      variant === 'primary'
        ? 'dashboard-card bg-gradient-to-br from-blue-600 to-blue-700 text-white border-none shadow-xl shadow-blue-500/20'
        : 'dashboard-card border border-slate-100 bg-white'
    }
  >
    <div className="flex justify-between items-start mb-4">
      {icon}
      <span className={`text-[10px] font-bold uppercase tracking-widest ${variant === 'primary' ? 'opacity-80' : 'text-slate-400'}`}>
        {title}
      </span>
    </div>
    {loading ? (
      <div className={`h-8 w-40 rounded ${variant === 'primary' ? 'bg-white/20' : 'bg-slate-100'} animate-pulse mb-2`} />
    ) : (
      <h2 className={`text-3xl font-bold mb-1 ${variant === 'primary' ? 'text-white' : 'text-slate-900'}`}>{value}</h2>
    )}
    <p className={`${variant === 'primary' ? 'text-blue-100' : 'text-slate-500'} text-sm font-medium`}>{subtitle}</p>
  </div>
);

const MONTH_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 1, label: 'Jan' },
  { value: 2, label: 'Fev' },
  { value: 3, label: 'Mar' },
  { value: 4, label: 'Abr' },
  { value: 5, label: 'Mai' },
  { value: 6, label: 'Jun' },
  { value: 7, label: 'Jul' },
  { value: 8, label: 'Ago' },
  { value: 9, label: 'Set' },
  { value: 10, label: 'Out' },
  { value: 11, label: 'Nov' },
  { value: 12, label: 'Dez' },
];

export default GestaoFinanceira;

