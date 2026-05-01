import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { esusApi } from '../../services/esusApi';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';

const STATUS_COLORS = {
  atingido: 'text-green-400 bg-green-900/30 border-green-700',
  em_andamento: 'text-yellow-400 bg-yellow-900/30 border-yellow-700',
  critico: 'text-red-400 bg-red-900/30 border-red-700',
};

const STATUS_BAR = {
  atingido: 'bg-green-500',
  em_andamento: 'bg-yellow-500',
  critico: 'bg-red-500',
};

function IndicatorCard({ ind }: { ind: any }) {
  return (
    <div className={`bg-slate-800 border rounded-xl p-4 ${STATUS_COLORS[ind.status as keyof typeof STATUS_COLORS]}`}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-mono text-slate-500">{ind.code}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[ind.status as keyof typeof STATUS_COLORS]}`}>
          {ind.status === 'atingido' ? 'Atingido' : ind.status === 'em_andamento' ? 'Em andamento' : 'Crítico'}
        </span>
      </div>
      <p className="font-semibold text-slate-100 text-sm mb-1">{ind.name}</p>
      <p className="text-slate-400 text-xs mb-3">{ind.description}</p>
      <p className="text-4xl font-bold text-slate-100 mb-1">{ind.resultado.toFixed(1)}%</p>
      <p className="text-xs text-slate-500 mb-2">{ind.numerador}/{ind.denominador} · meta {ind.meta}%</p>
      <div className="w-full bg-slate-700 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full ${STATUS_BAR[ind.status as keyof typeof STATUS_BAR]}`}
          style={{ width: `${Math.min(ind.resultado / ind.meta * 100, 100)}%` }}
        />
      </div>
    </div>
  );
}

export default function EsusIndicators() {
  const now = new Date();
  const [competencia, setCompetencia] = useState(
    `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
  );
  const [ine, setIne] = useState('');

  const monthInput = `${competencia.substring(0, 4)}-${competencia.substring(4, 6)}`;

  const { data, isLoading } = useQuery({
    queryKey: ['esus-indicators', competencia, ine],
    queryFn: () => esusApi.indicators.getAll({ competencia, ine }).then(r => r.data.data),
  });

  const indicators: any[] = data || [];

  const radarData = indicators.map(ind => ({
    subject: ind.code,
    resultado: ind.resultado,
    meta: ind.meta,
  }));

  const handleMonthChange = (val: string) => {
    setCompetencia(val.replace('-', ''));
  };

  const handleExportCSV = () => {
    const header = 'Código,Indicador,Numerador,Denominador,Resultado (%),Meta (%),Status';
    const rows = indicators.map(i =>
      `${i.code},"${i.name}",${i.numerador},${i.denominador},${i.resultado},${i.meta},${i.status}`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `indicadores_${competencia}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-100">Indicadores Saúde Brasil 360</h1>
        <button onClick={handleExportCSV} className="text-sm px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors">
          Exportar CSV
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <input type="month" value={monthInput} onChange={e => handleMonthChange(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-blue-500" />
        <input type="text" placeholder="INE da equipe (opcional)" value={ine} onChange={e => setIne(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500" />
      </div>

      {isLoading ? (
        <p className="text-slate-400 py-8 text-center">Calculando indicadores...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {indicators.map(ind => <IndicatorCard key={ind.code} ind={ind} />)}
          </div>

          {radarData.length > 0 && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <h3 className="font-semibold text-slate-200 mb-4 text-sm">Radar — Resultado vs Meta</h3>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Radar name="Resultado" dataKey="resultado" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                  <Radar name="Meta" dataKey="meta" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}
