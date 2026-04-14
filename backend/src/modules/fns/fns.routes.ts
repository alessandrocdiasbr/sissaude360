import { Router } from 'express';
import controller from './fns.controller';
import { authenticateToken } from '../../middlewares/auth';

const router = Router();

// Todas as rotas do FNS protegidas por Auth
router.use(authenticateToken);

// Rotas de Visualização Paginada
router.get('/despesas', controller.listarDespesas.bind(controller));
router.get('/transferencias', controller.listarTransferencias.bind(controller));
router.get('/transferencias/municipio/:ibge/resumo', controller.getResumoMunicipio.bind(controller));
router.get('/convenios', controller.listarConvenios.bind(controller));

export default router;
