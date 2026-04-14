const express = require('express');
const router = express.Router();
const controller = require('./fns.controller');
const { authenticateToken } = require('../../middlewares/auth');

// Todas as rotas do FNS protegidas por Auth
router.use(authenticateToken);

// Rotas de Visualização Paginada
router.get('/despesas', controller.listarDespesas);
router.get('/transferencias', controller.listarTransferencias);
router.get('/transferencias/municipio/:ibge/resumo', controller.getResumoMunicipio);
router.get('/convenios', controller.listarConvenios);

module.exports = router;
