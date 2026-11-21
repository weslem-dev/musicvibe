const express = require('express');
const router = express.Router();
const notificationController = require('./notificationController');
const asyncHandler = require('../../middlewares/asyncHandler');
const isAuthenticated = require('../../middlewares/auth');

// ADICIONADO NA AULA 14. As três exigem login.
// unread-count vem ANTES de /:id/read só por clareza (são métodos e caminhos
// diferentes, não há conflito).
router.get('/notifications', isAuthenticated, asyncHandler(notificationController.getMyNotifications));
router.get('/notifications/unread-count', isAuthenticated, asyncHandler(notificationController.getUnreadCount));
router.patch('/notifications/:id/read', isAuthenticated, asyncHandler(notificationController.markAsRead));

module.exports = router;
