import cron from 'node-cron';
import { importFromEsus } from '../services/esusQueue.service';

async function syncReferrals(days: number) {
  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - days);
  const dateFrom = from.toISOString().split('T')[0];
  const dateTo = now.toISOString().split('T')[0];

  console.log(`[EsusSyncJob] Importando encaminhamentos de ${dateFrom} a ${dateTo}...`);
  try {
    const result = await importFromEsus('REFERRAL', dateFrom, dateTo);
    console.log(`[EsusSyncJob] Concluído: ${result.imported} importados, ${result.skipped} duplicados.`);
  } catch (err: any) {
    console.error('[EsusSyncJob] Erro:', err.message);
  }
}

export function startEsusSyncJobs() {
  // A cada 6 horas: importa encaminhamentos dos últimos 7 dias
  cron.schedule('0 */6 * * *', () => syncReferrals(7), { timezone: 'America/Sao_Paulo' });

  // Diariamente às 00:30: importa encaminhamentos do mês corrente
  cron.schedule('30 0 * * *', () => syncReferrals(31), { timezone: 'America/Sao_Paulo' });

  console.log('[EsusSyncJob] Jobs agendados.');
}
