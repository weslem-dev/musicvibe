const sequelize = require('../../config/database');
const User = require('../user/userModel');
const Follow = require('./followModel');

// Só estes campos de uma pessoa saem da API (nunca password nem email).
const PERSON_ATTRIBUTES = ['id', 'username', 'fullName', 'bio', 'profilePicture', 'followersCount', 'followingCount'];

function httpError(status, message) {
    const error = new Error(message);
    error.status = status;
    return error;
}

// ADICIONADO NA AULA 11.
// Seguir/deixar de seguir com UMA rota (toggle). A ordem dos parâmetros é
// SEMPRE (followerId, followingId) = (quem segue, quem é seguido). Os dois
// são números: trocá-los não dá erro, só faz a pessoa errada seguir a outra.
// Os dois ids chegam aqui já como NÚMERO (o controller converte na borda).
async function toggleFollow(followerId, followingId) {
    // 400 antes de tudo: ninguém segue a si mesmo. Esta comparação só funciona
    // se os dois forem do mesmo tipo (number === number).
    if (followerId === followingId) {
        throw httpError(400, 'Você não pode seguir a si mesmo.');
    }

    // 404 antes da transação: não existe quem seguir.
    const exists = await User.findByPk(followingId, { attributes: ['id'] });

    if (!exists) {
        throw httpError(404, 'Usuário não encontrado.');
    }

    try {
        // TRÊS escritas numa só transação: a linha em follows + followersCount
        // de quem é seguido + followingCount de quem segue. Ou valem as três,
        // ou nenhuma. Todo comando leva { transaction: t }.
        return await sequelize.transaction(async (t) => {
            // TRAVA as duas linhas de usuário (SELECT ... FOR UPDATE), SEMPRE em
            // ordem crescente de id. Sem a trava, dois toggles simultâneos do
            // mesmo par poderiam desfazer a linha duas vezes e baixar o contador
            // duas vezes. E a ORDEM fixa evita deadlock: se A segue B ao mesmo
            // tempo em que B segue A, os dois pedem o menor id primeiro, então
            // um espera o outro em vez de ficarem presos um no outro.
            const locked = {};
            for (const id of [followerId, followingId].sort((a, b) => a - b)) {
                locked[id] = await User.findByPk(id, { attributes: ['id'], transaction: t, lock: t.LOCK.UPDATE });
            }

            const target = locked[followingId];

            if (!target) {
                throw httpError(404, 'Usuário não encontrado.');
            }

            const [follow, created] = await Follow.findOrCreate({
                where: { followerId, followingId },
                transaction: t
            });

            if (created) {
                // Começou a seguir: sobe nos DOIS lados -- quem é seguido ganha
                // um SEGUIDOR; quem segue passa a ter mais um SEGUINDO.
                await User.increment('followersCount', { where: { id: followingId }, transaction: t });
                await User.increment('followingCount', { where: { id: followerId }, transaction: t });
            } else {
                await follow.destroy({ transaction: t });
                await User.decrement('followersCount', { where: { id: followingId }, transaction: t });
                await User.decrement('followingCount', { where: { id: followerId }, transaction: t });
            }

            // reload() relê a linha do alvo DEPOIS dos UPDATEs: increment/decrement
            // mexem direto no banco e não atualizam o objeto que está na memória.
            await target.reload({ attributes: ['id', 'followersCount'], transaction: t });

            return { isFollowing: created, followersCount: target.followersCount };
        });
    } catch (err) {
        // Rede de segurança: com a trava isto não deveria acontecer; se dois
        // inserts do mesmo par chegarem ao banco, o índice único composto barra
        // o segundo e a transação inteira é desfeita.
        if (err.name === 'SequelizeUniqueConstraintError') {
            throw httpError(409, 'Esta ação já está sendo processada. Tente de novo.');
        }
        throw err;
    }
}

// followerId pode ser undefined se a rota deixar passar visitante; aqui a rota é
// autenticada. Seguir a si mesmo nunca existe: false.
async function getFollowStatus(followerId, followingId) {
    const exists = await User.findByPk(followingId, { attributes: ['id'] });

    if (!exists) {
        throw httpError(404, 'Usuário não encontrado.');
    }

    if (followerId === followingId) {
        return { isFollowing: false };
    }

    const follow = await Follow.findOne({ where: { followerId, followingId } });

    return { isFollowing: Boolean(follow) };
}

async function assertUserExists(userId) {
    const user = await User.findByPk(userId, { attributes: ['id'] });

    if (!user) {
        throw httpError(404, 'Usuário não encontrado.');
    }
}

// "Lendo em voz alta":
//   getFollowers(userId) = QUEM SEGUE userId -> linhas onde userId é o SEGUIDO
//     (followingId = userId); a pessoa que interessa em cada linha é o FOLLOWER.
//   getFollowing(userId) = QUEM userId SEGUE -> linhas onde userId é quem SEGUE
//     (followerId = userId); a pessoa que interessa em cada linha é o FOLLOWING.
async function getFollowers(userId) {
    await assertUserExists(userId);

    const rows = await Follow.findAll({
        where: { followingId: userId },
        include: [{ model: User, as: 'Follower', attributes: PERSON_ATTRIBUTES }],
        order: [['createdAt', 'DESC'], ['id', 'DESC']]
    });

    // O .map entrega só as PESSOAS (e não as linhas da tabela follows).
    return rows.map((row) => row.Follower);
}

async function getFollowing(userId) {
    await assertUserExists(userId);

    const rows = await Follow.findAll({
        where: { followerId: userId },
        include: [{ model: User, as: 'Following', attributes: PERSON_ATTRIBUTES }],
        order: [['createdAt', 'DESC'], ['id', 'DESC']]
    });

    return rows.map((row) => row.Following);
}

module.exports = { toggleFollow, getFollowStatus, getFollowers, getFollowing };
