const sequelize = require('../../config/database');
const Track = require('../track/trackModel');
const User = require('../user/userModel');
const Like = require('./likeModel');

const AUTHOR_ATTRIBUTES = ['id', 'username', 'fullName', 'profilePicture'];

function httpError(status, message) {
    const error = new Error(message);
    error.status = status;
    return error;
}

// ADICIONADO NA AULA 10.
// Curtir/descurtir com UM endpoint só (toggle). A ordem dos parâmetros é
// SEMPRE (userId, trackId): os dois são números, então trocar um pelo outro
// não dá erro nenhum -- só curte a faixa errada, em nome da pessoa errada.
async function toggleLike(userId, trackId) {
    try {
        // Cada escrita DUPLA (a linha em `likes` + o contador em `tracks`)
        // acontece dentro de uma transação: ou as duas valem, ou nenhuma.
        // ATENÇÃO: todo comando aqui dentro leva { transaction: t }. Um que
        // esqueça rodaria FORA da transação (outra conexão, já confirmado), e
        // não seria desfeito se o resto falhasse.
        return await sequelize.transaction(async (t) => {
            // TRAVA a linha da faixa (SELECT ... FOR UPDATE) logo de cara. Sem
            // isso, dois toggles simultâneos do mesmo usuário leem "a curtida
            // existe", os dois apagam (o segundo apaga 0 linhas, sem erro) e os
            // dois fazem likes_count - 1: o contador desce 2 pra 1 curtida
            // removida. Com a trava, quem chega depois ESPERA a transação
            // anterior terminar e então enxerga o resultado dela. Os próximos
            // comandos só rodam depois de a trava ser obtida.
            const track = await Track.findByPk(trackId, {
                attributes: ['id'],
                transaction: t,
                lock: t.LOCK.UPDATE
            });

            if (!track) {
                throw httpError(404, 'Faixa não encontrada.');
            }

            const existing = await Like.findOne({ where: { userId, trackId }, transaction: t });

            let liked;

            if (existing) {
                await existing.destroy({ transaction: t });
                await Track.decrement('likesCount', { where: { id: trackId }, transaction: t });
                liked = false;
            } else {
                await Like.create({ userId, trackId }, { transaction: t });
                await Track.increment('likesCount', { where: { id: trackId }, transaction: t });
                liked = true;
            }

            // Lê o contador DENTRO da transação, já com o ajuste aplicado.
            const fresh = await Track.findByPk(trackId, { attributes: ['likesCount'], transaction: t });

            return { liked, likesCount: fresh.likesCount };
        });
    } catch (err) {
        // Rede de segurança: com a trava acima isto não deveria acontecer, mas
        // se dois inserts da mesma dupla chegarem ao banco, o índice único
        // composto barra o segundo. Em vez de um 500, devolvemos um erro claro
        // (a transação inteira já foi desfeita, então o contador não ficou
        // torto).
        if (err.name === 'SequelizeUniqueConstraintError') {
            throw httpError(409, 'Sua curtida já está sendo processada. Tente de novo.');
        }
        throw err;
    }
}

// viewerId pode ser undefined (visitante): nesse caso liked é sempre false.
async function getLikeStatus(trackId, viewerId) {
    const track = await Track.findByPk(trackId, { attributes: ['id', 'likesCount'] });

    if (!track) {
        throw httpError(404, 'Faixa não encontrada.');
    }

    let liked = false;

    if (viewerId) {
        const like = await Like.findOne({ where: { userId: viewerId, trackId } });
        liked = Boolean(like);
    }

    return { liked, likesCount: track.likesCount };
}

// Faixas que o usuário curtiu, da curtida mais recente pra mais antiga, cada
// uma com o autor (o card do front precisa do nome do autor).
async function getLikedTracks(userId) {
    const likes = await Like.findAll({
        where: { userId },
        include: [{
            model: Track,
            as: 'track',
            include: [{ model: User, as: 'author', attributes: AUTHOR_ATTRIBUTES }]
        }],
        order: [['createdAt', 'DESC'], ['id', 'DESC']]
    });

    return likes.map((like) => like.track);
}

module.exports = { toggleLike, getLikeStatus, getLikedTracks };
