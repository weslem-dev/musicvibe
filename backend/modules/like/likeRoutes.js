const express = require('express');
const router = express.Router();
const likeController = require('./likeController');
const { trackIdParamValidator } = require('../track/trackValidator');
const asyncHandler = require('../../middlewares/asyncHandler');
const isAuthenticated = require('../../middlewares/auth');
const optionalAuth = require('../../middlewares/optionalAuth');

// Curtir/descurtir: exige login.
router.post(
    '/tracks/:trackId/toggle-like',
    isAuthenticated,
    trackIdParamValidator,
    asyncHandler(likeController.toggleLike)
);

// Status da curtida: público (visitante recebe liked: false), mas com
// optionalAuth pra saber de quem checar quando houver login.
router.get(
    '/tracks/:trackId/like-status',
    optionalAuth,
    trackIdParamValidator,
    asyncHandler(likeController.getLikeStatus)
);

// Faixas curtidas pelo usuário logado.
router.get('/liked-tracks', isAuthenticated, asyncHandler(likeController.getLikedTracks));

module.exports = router;
