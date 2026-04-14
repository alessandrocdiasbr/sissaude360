import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { apiRoutes } from './routes/api';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api', apiRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`🚀 Server Saúde Brasil 360 running on port ${PORT}`);

  // Iniciar Jobs Agendados
  const { startFNSJob } = require('./jobs/syncFNS');
  startFNSJob();
});
