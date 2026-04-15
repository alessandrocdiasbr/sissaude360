import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth';
import {
  chamarProximo,
  estatisticasDia,
  finalizarAtendimento,
  gerarSenha,
  iniciarAtendimento,
  listarFila,
  listarSalas,
} from '../controllers/FilaController';

const router = Router();

// Todas as rotas protegidas
router.use(authenticateToken);

router.post('/tickets', gerarSenha);
router.get('/:unidadeId', listarFila);
router.get('/:unidadeId/salas', listarSalas);
router.get('/:unidadeId/estatisticas-dia', estatisticasDia);

router.post('/salas/:salaId/chamar-proximo', chamarProximo);
router.post('/tickets/:ticketId/iniciar', iniciarAtendimento);
router.post('/tickets/:ticketId/finalizar', finalizarAtendimento);

export default router;

