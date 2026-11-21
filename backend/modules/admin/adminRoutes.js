const express = require('express');
const router = express.Router();
const adminController = require('./adminController');
const { reportsFilterValidator, blockUserValidator } = require('./adminValidator');
const asyncHandler = require('../../middlewares/asyncHandler');
const { isAuthenticated, isAdmin } = require('../../middlewares/auth');

// ADICIONADO NA AULA 15.
// A GUARDA, numa linha só, para TUDO que começa com /admin: primeiro quem é
// (isAuthenticated: 401), depois se pode (isAdmin: 403). A ordem importa: o
// isAdmin lê o req.user que o isAuthenticated monta. Uma linha só também evita
// esquecer o isAdmin numa rota nova. E como roda antes do 404, até
// /admin/rota-inexistente responde 401/403 (não revela o que existe).
router.use('/admin', isAuthenticated, isAdmin);

router.get('/admin/dashboard', asyncHandler(adminController.getDashboard));

router.get('/admin/reports', reportsFilterValidator, asyncHandler(adminController.getReports));
router.patch('/admin/reports/:id/review', asyncHandler(adminController.reviewReport));

router.get('/admin/users', asyncHandler(adminController.getUsers));
router.patch('/admin/users/:id/block', blockUserValidator, asyncHandler(adminController.setUserBlocked));

router.get('/admin/tracks', asyncHandler(adminController.getTracks));
router.delete('/admin/tracks/:id', asyncHandler(adminController.deleteTrack));

module.exports = router;
