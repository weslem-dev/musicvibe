const { Op } = require('sequelize');
const User = require('../user/userModel');
const Track = require('../track/trackModel');
const Comment = require('../comment/commentModel');
const Like = require('../like/likeModel');
const Report = require('../report/reportModel');
const { REPORT } = require('../../config/constants');
const { escapeLike } = require('../../utils/escapeLike');

// ADICIONADO NA AULA 15. Regras do painel de administração. Quem chega aqui já
// passou pela guarda (isAuthenticated + isAdmin) no adminRoutes.

// Só dados PÚBLICOS de uma pessoa nas listas de denúncias e de faixas.
const PERSON_ATTRIBUTES = ['id', 'username', 'fullName', 'profilePicture'];
const TRACK_ATTRIBUTES = ['id', 'title', 'cover', 'userId'];

// Na lista de USUÁRIOS do painel o administrador vê mais (e-mail e as flags),
// mas NUNCA a senha: attributes explícito em vez de "tudo menos a senha".
const ADMIN_USER_ATTRIBUTES = [
    'id', 'username', 'email', 'fullName', 'profilePicture',
    'isAdmin', 'isBlocked', 'followersCount', 'followingCount', 'tracksCount', 'createdAt'
];

function httpError(status, message) {
    const error = new Error(message);
    error.status = status;
    return error;
}

// Sete contagens em PARALELO (Promise.all): nenhuma depende da outra.
async function getDashboardStats() {
    const [users, blockedUsers, tracks, comments, likes, pendingReports, reviewedReports] = await Promise.all([
        User.count(),
        User.count({ where: { isBlocked: true } }),
        Track.count(),
        Comment.count(),
        Like.count(),
        Report.count({ where: { status: REPORT.STATUS.PENDING } }),
        Report.count({ where: { status: REPORT.STATUS.REVIEWED } })
    ]);

    return { users, blockedUsers, tracks, comments, likes, pendingReports, reviewedReports };
}

// status: 'pending' | 'reviewed' | 'all' (all = sem filtro).
async function getReports(status, page, limit) {
    const where = status === 'all' ? {} : { status };

    return Report.findAll({
        where,
        attributes: ['id', 'reason', 'status', 'reviewedAt', 'createdAt', 'trackId', 'userId'],
        include: [
            { model: User, as: 'Reporter', attributes: PERSON_ATTRIBUTES },
            {
                model: Track,
                as: 'track',
                attributes: TRACK_ATTRIBUTES,
                include: [{ model: User, as: 'author', attributes: PERSON_ATTRIBUTES }]
            }
        ],
        order: [['createdAt', 'DESC'], ['id', 'DESC']],
        limit,
        offset: (page - 1) * limit
    });
}

// Idempotente: revisar de novo uma já revisada responde 200 com o MESMO
// reviewedAt (não regrava a data).
async function reviewReport(id) {
    const report = await Report.findByPk(id);

    if (!report) {
        throw httpError(404, 'Denúncia não encontrada.');
    }

    if (report.status !== REPORT.STATUS.REVIEWED) {
        await report.update({ status: REPORT.STATUS.REVIEWED, reviewedAt: new Date() });
        // reload(): relê a linha do BANCO. O reviewedAt devolvido passa a ser o
        // que ficou gravado (o MySQL guarda em segundos; o objeto em memória teria
        // milissegundos) -- assim a primeira resposta e a repetição mostram
        // exatamente o mesmo valor.
        await report.reload();
    }

    return { id: report.id, status: report.status, reviewedAt: report.reviewedAt };
}

// Busca em username, e-mail e nome. Texto vazio = sem filtro.
async function getUsers(search, page, limit) {
    const where = search
        ? {
            [Op.or]: [
                { username: { [Op.like]: `%${escapeLike(search)}%` } },
                { email: { [Op.like]: `%${escapeLike(search)}%` } },
                { fullName: { [Op.like]: `%${escapeLike(search)}%` } }
            ]
        }
        : {};

    return User.findAll({
        where,
        attributes: ADMIN_USER_ATTRIBUTES,
        order: [['createdAt', 'DESC'], ['id', 'DESC']],
        limit,
        offset: (page - 1) * limit
    });
}

// Ordem: existe? (404) -> é você mesmo? (400) -> é outro administrador? (403).
// Só grava se mudar (bloquear quem já está bloqueado responde 200 sem escrever).
async function setUserBlocked(targetId, isBlocked, adminId) {
    const user = await User.findByPk(targetId, { attributes: ['id', 'username', 'isAdmin', 'isBlocked'] });

    if (!user) {
        throw httpError(404, 'Usuário não encontrado.');
    }

    if (user.id === adminId) {
        throw httpError(400, 'Você não pode bloquear a sua própria conta.');
    }

    if (user.isAdmin) {
        throw httpError(403, 'Não é possível bloquear outro administrador.');
    }

    if (user.isBlocked !== isBlocked) {
        await user.update({ isBlocked });
    }

    return { id: user.id, username: user.username, isBlocked: user.isBlocked };
}

// As faixas da página, com o autor e quantas denúncias PENDENTES cada uma tem.
// A contagem vem de UMA segunda consulta agrupada, só com os ids desta página
// (em vez de um include com GROUP BY, que se complica com limit/offset e com o
// autor junto).
async function getTracks(search, page, limit) {
    const where = search ? { title: { [Op.like]: `%${escapeLike(search)}%` } } : {};

    const tracks = await Track.findAll({
        where,
        attributes: ['id', 'title', 'cover', 'userId', 'likesCount', 'commentsCount', 'playsCount', 'createdAt'],
        include: [{ model: User, as: 'author', attributes: PERSON_ATTRIBUTES }],
        order: [['createdAt', 'DESC'], ['id', 'DESC']],
        limit,
        offset: (page - 1) * limit
    });

    if (!tracks.length) {
        return [];
    }

    const rows = await Report.findAll({
        where: { trackId: { [Op.in]: tracks.map((track) => track.id) }, status: REPORT.STATUS.PENDING },
        attributes: ['trackId', [Report.sequelize.fn('COUNT', Report.sequelize.col('id')), 'total']],
        group: ['trackId'],
        raw: true
    });

    // trackId -> total. O COUNT chega como texto em alguns drivers: Number().
    const pendingByTrack = new Map(rows.map((row) => [row.trackId, Number(row.total)]));

    return tracks.map((track) => ({
        ...track.toJSON(),
        pendingReportsCount: pendingByTrack.get(track.id) || 0
    }));
}

module.exports = { getDashboardStats, getReports, reviewReport, getUsers, setUserBlocked, getTracks };
