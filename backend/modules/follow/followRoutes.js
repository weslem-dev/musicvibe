const express = require('express');
const router = express.Router();
const followController = require('./followController');
const asyncHandler = require('../../middlewares/asyncHandler');
const isAuthenticated = require('../../middlewares/auth');

// Seguir/deixar de seguir e saber se já sigo: exigem login.
router.post('/users/:userId/toggle-follow', isAuthenticated, asyncHandler(followController.toggleFollow));
router.get('/users/:userId/follow-status', isAuthenticated, asyncHandler(followController.getFollowStatus));

// Listas de seguidores/seguindo: PÚBLICAS (qualquer pessoa vê quem segue quem).
router.get('/users/:userId/followers', asyncHandler(followController.getFollowers));
router.get('/users/:userId/following', asyncHandler(followController.getFollowing));

// Feed só com as faixas de quem eu sigo: exige login. page/limit são tratados por parsePagination (no controller).
router.get('/following-tracks', isAuthenticated, asyncHandler(followController.getFollowingFeed));

module.exports = router;
