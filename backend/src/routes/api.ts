import express, { Router } from 'express';
import { getDashboardData, createProducao, listIndicadores } from '../controllers/ProducaoController';
import { login } from '../controllers/AuthController';
import { listUnidades, createUnidade, updateUnidade, deleteUnidade } from '../controllers/UnidadeController';
import { listItens, createItem, updateItem } from '../controllers/ItemController';
import { getEstoque, movimentarEstoque } from '../controllers/EstoqueController';
import { listServidores, createServidor, updateServidor, deleteServidor } from '../controllers/ServidorController';
import fnsRoutes from '../modules/fns/fns.routes';
import { authenticateToken } from '../middlewares/auth';

const router = Router();
router.use(express.json());

// Rota Pública
router.post('/auth/login', login);

// Rotas Protegidas
router.use(authenticateToken);

// Unidades (CRUD Administração)
router.get('/unidades', listUnidades);
router.post('/unidades', createUnidade);
router.put('/unidades/:id', updateUnidade);
router.delete('/unidades/:id', deleteUnidade);

// Almoxarifado (Itens e Estoque)
router.get('/itens', listItens);
router.post('/itens', createItem);
router.put('/itens/:id', updateItem);
router.get('/estoque', getEstoque);
router.post('/estoque/movimentar', movimentarEstoque);

// Gestão de Pessoas (Servidores)
router.get('/servidores', listServidores);
router.post('/servidores', createServidor);
router.put('/servidores/:id', updateServidor);
router.delete('/servidores/:id', deleteServidor);

// APS (Indicadores e Produção)
router.get('/indicadores', listIndicadores);
router.get('/dashboard', getDashboardData);
router.post('/producao', createProducao);

// Módulos
router.use('/fns', fnsRoutes);

export { router as apiRoutes };

