const notificationService = require('./notificationService');
const { success } = require('../../middlewares/apiResponse');
const { parsePagination } = require('../../utils/pagination');
const { parseId } = require('../../utils/parseId');

// ADICIONADO NA AULA 14. O userId vem SEMPRE do token (req.userId): ninguém lê
// ou marca as notificações de outra pessoa passando um id na URL.

exports.getMyNotifications = async (req, res) => {
    const { page, limit } = parsePagination(req.query);

    const notifications = await notificationService.getUserNotifications(req.userId, page, limit);

    return success(res, notifications);
};

// Num OBJETO ({ unreadCount: 3 }), e não um número solto: dá para acrescentar
// campos depois sem quebrar quem já usa.
exports.getUnreadCount = async (req, res) => {
    const unreadCount = await notificationService.getUnreadCount(req.userId);

    return success(res, { unreadCount });
};

exports.markAsRead = async (req, res) => {
    const id = parseId(req.params.id, 'notificação');

    const result = await notificationService.markAsRead(id, req.userId);

    return success(res, result, 'Notificação marcada como lida.');
};
