import dotenv from 'dotenv';
dotenv.config({ override: true });

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { apiRoutes } from './routes/api';
import { startFNSJob } from './jobs/syncFNS';
import { startDiarioOficialJob } from './jobs/diarioOficialJob';
import { startEsusSyncJobs } from './jobs/esusSync.job';

const app = express();
const PORT = process.env.PORT || 3001;

// Configuração Dinâmica de CORS
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Normalizar origin: remover barra no final se existir
    const cleanOrigin = origin ? origin.replace(/\/$/, '') : null;
    
    if (!origin || allowedOrigins.includes(cleanOrigin!)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Bloqueado: ${origin} não está na lista permitida:`, allowedOrigins);
      callback(new Error('Origem não permitida pelo CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

app.use('/api', apiRoutes);

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Handler de Erro Global (Deve ser o último middleware)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[Global Error Handler]', err.message);
  res.status(500).json({ erro: 'Erro interno do servidor' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server Monitora Saúde running on port ${PORT}`);

  // Iniciar Jobs Agendados
  startFNSJob();
  startDiarioOficialJob();
  startEsusSyncJobs();
});
