import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth';
import * as esusController from '../controllers/esus.controller';

const router = Router();
router.use(authenticateToken);

router.get('/test-connection', esusController.testConnection);

router.get('/patients', esusController.getPatients);
router.get('/patients/:cns', esusController.getPatientById);
router.get('/patients/:cns/timeline', esusController.getPatientTimeline);

router.get('/referrals', esusController.getReferrals);
router.get('/referrals/stats', esusController.getReferralStats);
router.get('/referrals/by-specialty', esusController.getReferralsBySpecialty);

router.get('/production', esusController.getProduction);
router.get('/production/by-period', esusController.getProductionByPeriod);

router.get('/indicators', esusController.getIndicators);
router.get('/indicators/:code/history', esusController.getIndicatorHistory);

router.get('/queue', esusController.getQueue);
router.get('/queue/stats', esusController.getQueueStats);
router.post('/queue', esusController.addToQueue);
router.post('/queue/import', esusController.importFromEsus);
router.patch('/queue/:id/status', esusController.updateQueueStatus);

export default router;
