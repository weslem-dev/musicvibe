const Notification = require('./notificationModel');
const User = require('../user/userModel');
const Track = require('../track/trackModel');

// ADICIONADO NA AULA 14.
// Quem agiu aparece só com os dados PÚBLICOS (nunca password, email ou isAdmin);
// a faixa, só com o necessário para a linha da tela (id, título e capa).
const ACTOR_ATTRIBUTES = ['id', 'username', 'fullName', 'profilePicture'];
const TRACK_ATTRIBUTES = ['id', 'title', 'cover'];

function httpError(status, message) {
    const error = new Error(message);
    error.status = status;
    return error;
}

// Chamada DE DENTRO das transações de curtir, comentar e seguir: por isso recebe
// a transação como segundo argumento e a repassa ao create. Sem ela, o INSERT
// iria por OUTRA conexão e ficaria esperando a trava que a própria transação
// segura (a linha da faixa ou do usuário): a requisição trava e, depois de uns
// 50 segundos, responde 500 "Lock wait timeout exceeded".
//
// Ninguém é avisado das PRÓPRIAS ações (curtir a própria faixa, comentar nela).
async function createNotification({ userId, actorId, type, trackId = null }, transaction) {
    if (userId === actorId) {
        return null;
    }

    return Notification.create({ userId, actorId, type, trackId }, { transaction });
}

// O inverso do create, para o "desfazer" (descurtir, deixar de seguir): apaga o
// aviso com os MESMOS quatro dados. trackId = null casa com o aviso de follow
// (o Sequelize transforma { trackId: null } em track_id IS NULL).
async function removeNotification({ userId, actorId, type, trackId = null }, transaction) {
    return Notification.destroy({ where: { userId, actorId, type, trackId }, transaction });
}

// As minhas, da mais nova para a mais antiga (id desempata as do mesmo segundo),
// com quem agiu e a faixa (quando houver).
async function getUserNotifications(userId, page, limit) {
    return Notification.findAll({
        where: { userId },
        include: [
            { model: User, as: 'Actor', attributes: ACTOR_ATTRIBUTES },
            { model: Track, as: 'track', attributes: TRACK_ATTRIBUTES }
        ],
        order: [['createdAt', 'DESC'], ['id', 'DESC']],
        limit,
        offset: (page - 1) * limit
    });
}

// O número do sino: uma contagem só (usa o índice user_id + is_read), sem trazer
// as linhas -- o polling pergunta isto a cada 30 segundos.
async function getUnreadCount(userId) {
    return Notification.count({ where: { userId, isRead: false } });
}

// Idempotente: marcar de novo uma já lida responde 200 com o mesmo número.
// Ordem de sempre: existe? (404) -> é minha? (403).
async function markAsRead(id, userId) {
    const notification = await Notification.findByPk(id, { attributes: ['id', 'userId', 'isRead'] });

    if (!notification) {
        throw httpError(404, 'Notificação não encontrada.');
    }

    if (notification.userId !== userId) {
        throw httpError(403, 'Você não tem permissão para alterar esta notificação.');
    }

    if (!notification.isRead) {
        // ESPERA o update terminar antes de contar: senão a contagem poderia ver
        // a linha ainda como não lida e devolver um número a mais.
        await notification.update({ isRead: true });
    }

    const unreadCount = await getUnreadCount(userId);

    return { id: notification.id, isRead: true, unreadCount };
}

module.exports = { createNotification, removeNotification, getUserNotifications, getUnreadCount, markAsRead };
