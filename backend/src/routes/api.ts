import { Router } from 'express';
import { getDashboardData, createProducao, listUnidades, listIndicadores } from '../controllers/ProducaoController';
import { login } from '../controllers/AuthController';

const router = Router();

// Auth
router.post('/auth/login', login);

// Unidades e Indicadores
router.get('/unidades', listUnidades);
router.get('/indicadores', listIndicadores);

// Produção e Dashboard
router.get('/dashboard', getDashboardData);
router.post('/producao', createProducao);

export { router as apiRoutes };
