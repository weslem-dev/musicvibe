const express = require('express');
const router = express.Router();
const reportController = require('./reportController');
const { reportValidator } = require('./reportValidator');
const asyncHandler = require('../../middlewares/asyncHandler');
const isAuthenticated = require('../../middlewares/auth');

// ADICIONADO NA AULA 14. Ordem: login (401) -> motivo (400) -> controller
// (id 400 -> 404 -> próprio item 400 -> 409).
router.post('/tracks/:trackId/report', isAuthenticated, reportValidator, asyncHandler(reportController.reportTrack));

module.exports = router;
