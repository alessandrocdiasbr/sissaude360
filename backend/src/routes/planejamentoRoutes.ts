import { Router } from 'express';
import {
  listarAcoes,
  criarAcao,
  atualizarStatus,
  atualizarAcao,
  deletarAcao,
  listarMetas,
  criarMeta,
  atualizarProgresso,
  deletarMeta,
} from '../controllers/PlanejamentoController';

const router = Router();

// Ações
router.get('/acoes', listarAcoes);
router.post('/acoes', criarAcao);
router.patch('/acoes/:id/status', atualizarStatus);
router.put('/acoes/:id', atualizarAcao);
router.delete('/acoes/:id', deletarAcao);

// Metas
router.get('/metas', listarMetas);
router.post('/metas', criarMeta);
router.patch('/metas/:id/progresso', atualizarProgresso);
router.delete('/metas/:id', deletarMeta);

export default router;
