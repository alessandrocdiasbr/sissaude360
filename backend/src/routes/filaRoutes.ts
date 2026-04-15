import { Router } from 'express';
import FilaController from '../controllers/FilaController';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

// Todas as rotas de fila são protegidas
router.use(authenticateToken);

// Listagem e Filtros
router.get('/', FilaController.listarSolicitacoes);
router.get('/estatisticas', FilaController.estatisticas);
router.get('/categorias', FilaController.listarCategorias);
router.get('/procedimentos', FilaController.listarProcedimentos);

// CRUD de Solicitações
router.get('/:id', FilaController.buscarSolicitacao);
router.post('/', FilaController.criarSolicitacao);
router.put('/:id', FilaController.atualizarSolicitacao);
router.patch('/:id/status', FilaController.atualizarStatus);

export default router;
