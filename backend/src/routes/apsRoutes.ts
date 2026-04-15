import { Router } from 'express';
import { 
  getResultadoPorIndicador, 
  getResultadoPorEquipe, 
  getEvolucaoPorCompetencia 
} from '../controllers/APSController';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

router.use(authenticateToken);

router.get('/por-indicador', getResultadoPorIndicador);
router.get('/por-equipe', getResultadoPorEquipe);
router.get('/evolucao', getEvolucaoPorCompetencia);

export default router;
