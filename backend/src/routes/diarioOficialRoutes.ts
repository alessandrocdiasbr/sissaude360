import { Router } from 'express';
import diarioOficialController from '../controllers/DiarioOficialController';

const router = Router();

// Artigos
router.get('/artigos', (req, res) => diarioOficialController.listarArtigos(req, res));
router.patch('/artigos/:id/salvar', (req, res) => diarioOficialController.salvarArtigo(req, res));

// Disparo manual da coleta
router.post('/coletar', (req, res) => diarioOficialController.coletar(req, res));

// Webhook do Ro-DOU (Apprise json://)
router.post('/webhook-rodou', (req, res) => diarioOficialController.webhookRoDOU(req, res));

// Diagnóstico
router.get('/diagnostico', (req, res) => diarioOficialController.diagnostico(req, res));

// Preferências
router.get('/preferencias', (req, res) => diarioOficialController.listarPreferencias(req, res));
router.post('/preferencias', (req, res) => diarioOficialController.criarPreferencia(req, res));
router.put('/preferencias/:id', (req, res) => diarioOficialController.atualizarPreferencia(req, res));
router.delete('/preferencias/:id', (req, res) => diarioOficialController.deletarPreferencia(req, res));

export default router;
