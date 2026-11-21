const express = require('express');
const router = express.Router();
const playlistController = require('./playlistController');
const { createPlaylistValidator } = require('./playlistValidator');
const asyncHandler = require('../../middlewares/asyncHandler');
const isAuthenticated = require('../../middlewares/auth');
const optionalAuth = require('../../middlewares/optionalAuth');

// ADICIONADO NA AULA 13. Só a LEITURA de uma playlist é pública (optionalAuth:
// a pública abre para qualquer um; a privada só para a dona). O resto exige login.
router.get('/my-playlists', isAuthenticated, asyncHandler(playlistController.getMyPlaylists));
router.post('/playlists', isAuthenticated, createPlaylistValidator, asyncHandler(playlistController.createPlaylist));
router.get('/playlists/:id', optionalAuth, asyncHandler(playlistController.getPlaylistDetails));
router.delete('/playlists/:id', isAuthenticated, asyncHandler(playlistController.deletePlaylist));
router.post('/playlists/:id/tracks', isAuthenticated, asyncHandler(playlistController.addTrack));
router.delete('/playlists/:id/tracks/:trackId', isAuthenticated, asyncHandler(playlistController.removeTrack));

// Minhas playlists, cada uma com hasTrack (o modal "Salvar" da faixa).
router.get('/tracks/:trackId/playlists-status', isAuthenticated, asyncHandler(playlistController.getPlaylistsStatus));

module.exports = router;
