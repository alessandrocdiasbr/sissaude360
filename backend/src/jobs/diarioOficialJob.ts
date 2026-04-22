import cron from 'node-cron';
import diarioOficialService from '../services/DiarioOficialService';

export const startDiarioOficialJob = () => {
  // Run every day at 06:00 AM
  cron.schedule('0 6 * * *', async () => {
    console.log(`[${new Date().toISOString()}] Iniciando coleta de Diários Oficiais...`);
    try {
      await diarioOficialService.executarColeta();
      console.log(`[${new Date().toISOString()}] Coleta de Diários Oficiais concluída.`);
    } catch (err) {
      console.error(`[${new Date().toISOString()}] Erro na coleta de Diários Oficiais:`, err);
    }
  });
  console.log('🗞️ Job Diário Oficial Agendado: Todo dia às 06:00h');
};
