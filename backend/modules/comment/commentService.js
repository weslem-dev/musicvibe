const sequelize = require('../../config/database');
const Track = require('../track/trackModel');
const User = require('../user/userModel');
const Comment = require('./commentModel');

const AUTHOR_ATTRIBUTES = ['id', 'username', 'fullName', 'profilePicture'];

function httpError(status, message) {
    const error = new Error(message);
    error.status = status;
    return error;
}

// ADICIONADO NA AULA 10.
// Ordem dos parâmetros SEMPRE (userId, trackId, content) -- aqui e no
// controller. userId e trackId são números: trocá-los não dá erro, só grava
// o comentário na faixa errada.
async function createComment(userId, trackId, content) {
    // A linha em `comments` + o contador commentsCount em `tracks` são UMA
    // escrita dupla: transação. Todo comando leva { transaction: t }.
    const created = await sequelize.transaction(async (t) => {
        // TRAVA a linha da faixa antes de qualquer escrita. Sem a trava, cada
        // transação segura uma trava compartilhada na linha da faixa (por causa
        // da chave estrangeira do INSERT em comments) e depois pede a trava
        // exclusiva pra subir commentsCount: duas transações simultâneas ficam
        // esperando uma pela outra (deadlock) e o banco derruba uma delas.
        // Pedindo a exclusiva primeiro, elas entram em fila.
        const track = await Track.findByPk(trackId, {
            attributes: ['id'],
            transaction: t,
            lock: t.LOCK.UPDATE
        });

        if (!track) {
            throw httpError(404, 'Faixa não encontrada.');
        }

        const comment = await Comment.create({ content, userId, trackId }, { transaction: t });
        await Track.increment('commentsCount', { where: { id: trackId }, transaction: t });

        return comment;
    });

    // Devolve o comentário JÁ COM O AUTOR: sem isso, o front receberia um
    // comentário sem nome/foto e teria que recarregar a lista só pra mostrá-lo.
    return Comment.findByPk(created.id, {
        include: [{ model: User, as: 'author', attributes: AUTHOR_ATTRIBUTES }]
    });
}

// Comentários da faixa, dos mais novos para os mais antigos, cada um com autor.
async function listComments(trackId) {
    const track = await Track.findByPk(trackId, { attributes: ['id'] });

    if (!track) {
        throw httpError(404, 'Faixa não encontrada.');
    }

    return Comment.findAll({
        where: { trackId },
        include: [{ model: User, as: 'author', attributes: AUTHOR_ATTRIBUTES }],
        order: [['createdAt', 'DESC'], ['id', 'DESC']]
    });
}

module.exports = { createComment, listComments };
