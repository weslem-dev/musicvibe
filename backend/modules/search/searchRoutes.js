const express = require('express');
const router = express.Router();
const searchController = require('./searchController');
const asyncHandler = require('../../middlewares/asyncHandler');

// Busca global. Rota pública.
// AULA 13: agora o controller é async (consulta o banco), então passa pelo
// asyncHandler -- um erro na consulta chega ao errorHandler em vez de virar uma
// Promise rejeitada sem tratamento. (Era a pendência registrada no Checkpoint 2.)
router.get('/search', asyncHandler(searchController.search));

module.exports = router;
