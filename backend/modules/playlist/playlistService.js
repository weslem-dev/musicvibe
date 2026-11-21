const sequelize = require('../../config/database');
const User = require('../user/userModel');
const Track = require('../track/trackModel');
const Playlist = require('./playlistModel');
const PlaylistTrack = require('./playlistTrackModel');

// Só estes campos de uma pessoa saem da API (nunca password nem email).
const PERSON_ATTRIBUTES = ['id', 'username', 'fullName', 'profilePicture'];

function httpError(status, message) {
    const error = new Error(message);
    error.status = status;
    return error;
}

// ADICIONADO NA AULA 13.
// Para ALTERAR uma playlist (adicionar, remover, excluir): primeiro "existe?"
// (404) e só depois "é sua?" (403). Responder 403 para um id que não existe
// diria que há algo proibido onde não há nada.
async function findOwnedPlaylistOrFail(playlistId, userId) {
    const playlist = await Playlist.findByPk(playlistId);

    if (!playlist) {
        throw httpError(404, 'Playlist não encontrada.');
    }

    if (playlist.userId !== userId) {
        throw httpError(403, 'Você não tem permissão para modificar esta playlist.');
    }

    return playlist;
}

// isPublic === true: só fica pública se vier EXATAMENTE o booleano true. Com
// Boolean(isPublic), o texto "false" viraria verdadeiro (texto não vazio).
async function createPlaylist(userId, { title, description, isPublic }) {
    return Playlist.create({
        title,
        description: description || null,
        isPublic: isPublic === true,
        userId
    });
}

// Da mais nova para a mais antiga. O id DESC desempata: created_at tem precisão
// de segundos, e duas playlists criadas no mesmo segundo teriam datas iguais
// (e trocariam de lugar entre uma chamada e outra).
async function getUserPlaylists(userId) {
    return Playlist.findAll({
        where: { userId },
        order: [['createdAt', 'DESC'], ['id', 'DESC']]
    });
}

// Leitura pública (rota com optionalAuth). currentUserId é null para visitante.
async function getPlaylistById(playlistId, currentUserId = null) {
    const playlist = await Playlist.findByPk(playlistId, {
        include: [{ model: User, as: 'owner', attributes: PERSON_ATTRIBUTES }]
    });

    if (!playlist) {
        throw httpError(404, 'Playlist não encontrada.');
    }

    // currentUserId !== null PRIMEIRO: sem isso, uma playlist cujo userId viesse
    // vazio "pertenceria" a todo visitante (undefined === undefined é true).
    const isOwner = currentUserId !== null && playlist.userId === currentUserId;

    if (!playlist.isPublic && !isOwner) {
        throw httpError(403, 'Esta playlist é privada.');
    }

    // Faixas da playlist, a adicionada mais recentemente primeiro, cada uma com
    // o autor (o card do front mostra o nome do autor).
    const entries = await PlaylistTrack.findAll({
        where: { playlistId },
        include: [{
            model: Track,
            as: 'track',
            include: [{ model: User, as: 'author', attributes: PERSON_ATTRIBUTES }]
        }],
        order: [['createdAt', 'DESC'], ['id', 'DESC']]
    });

    return { playlist, tracks: entries.map((entry) => entry.track), isOwner };
}

// ADICIONAR é IDEMPOTENTE: repetir a mesma chamada deixa o banco igual. A 1ª vez
// cria a linha e sobe o contador; da 2ª em diante nada muda (added: false).
async function addToPlaylist(playlistId, trackId, userId) {
    await findOwnedPlaylistOrFail(playlistId, userId);

    // Linha da junção + contador da playlist: DUAS escritas, uma transação, e
    // todo comando com { transaction: t }.
    //
    // As travas seguem SEMPRE a mesma ordem em todo o módulo -- faixa, depois
    // playlist, depois a junção -- para duas operações simultâneas nunca ficarem
    // esperando uma pela outra (deadlock):
    //  - a faixa é travada para leitura (SHARE): a exclusão da faixa (que a trava
    //    para escrita) espera esta adição terminar, ou esta espera a exclusão e
    //    então descobre que a faixa sumiu (404);
    //  - a playlist é travada para escrita (UPDATE): duas adições na mesma
    //    playlist entram em fila em vez de disputarem o contador.
    return sequelize.transaction(async (t) => {
        const track = await Track.findByPk(trackId, { attributes: ['id'], transaction: t, lock: t.LOCK.SHARE });

        if (!track) {
            throw httpError(404, 'Faixa não encontrada.');
        }

        const playlist = await Playlist.findByPk(playlistId, { transaction: t, lock: t.LOCK.UPDATE });

        if (!playlist) {
            throw httpError(404, 'Playlist não encontrada.');
        }

        const [, created] = await PlaylistTrack.findOrCreate({
            where: { playlistId, trackId },
            transaction: t
        });

        // O increment fica DENTRO do if: sem isso, cada clique repetido somaria 1 e
        // o contador "mentiria" (diria 5 faixas com 1 faixa só).
        if (created) {
            await Playlist.increment('tracksCount', { where: { id: playlistId }, transaction: t });
        }

        // increment() mexe direto no banco; reload() traz o valor atualizado.
        await playlist.reload({ transaction: t });

        return { added: created, tracksCount: playlist.tracksCount };
    });
}

// REMOVER não é idempotente na resposta: se a faixa não está lá, não há o que
// remover (404). O destroy devolve QUANTAS linhas apagou: é isso que decide.
async function removeFromPlaylist(playlistId, trackId, userId) {
    await findOwnedPlaylistOrFail(playlistId, userId);

    return sequelize.transaction(async (t) => {
        const playlist = await Playlist.findByPk(playlistId, { transaction: t, lock: t.LOCK.UPDATE });

        if (!playlist) {
            throw httpError(404, 'Playlist não encontrada.');
        }

        const deleted = await PlaylistTrack.destroy({ where: { playlistId, trackId }, transaction: t });

        if (deleted === 0) {
            throw httpError(404, 'Esta faixa não está na playlist.');
        }

        await Playlist.decrement('tracksCount', { where: { id: playlistId }, transaction: t });
        await playlist.reload({ transaction: t });

        return { removed: true, tracksCount: playlist.tracksCount };
    });
}

// As linhas da junção saem ANTES da playlist (as duas juntas, ou nenhuma).
// As faixas continuam existindo: só deixam de estar nesta playlist.
async function deletePlaylist(playlistId, userId) {
    await findOwnedPlaylistOrFail(playlistId, userId);

    await sequelize.transaction(async (t) => {
        await Playlist.findByPk(playlistId, { attributes: ['id'], transaction: t, lock: t.LOCK.UPDATE });
        await PlaylistTrack.destroy({ where: { playlistId }, transaction: t });
        await Playlist.destroy({ where: { id: playlistId }, transaction: t });
    });
}

// Para o modal "Salvar": TODAS as minhas playlists, cada uma dizendo se já
// contém esta faixa (hasTrack). Duas consultas + um Set, em vez de uma consulta
// por playlist.
async function getPlaylistsStatusForTrack(userId, trackId) {
    const track = await Track.findByPk(trackId, { attributes: ['id'] });

    if (!track) {
        throw httpError(404, 'Faixa não encontrada.');
    }

    const playlists = await getUserPlaylists(userId);

    const entries = await PlaylistTrack.findAll({
        where: { trackId, playlistId: playlists.map((playlist) => playlist.id) },
        attributes: ['playlistId']
    });
    const withTrack = new Set(entries.map((entry) => entry.playlistId));

    return playlists.map((playlist) => ({
        id: playlist.id,
        title: playlist.title,
        isPublic: playlist.isPublic,
        tracksCount: playlist.tracksCount,
        hasTrack: withTrack.has(playlist.id)
    }));
}

module.exports = {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addToPlaylist,
    removeFromPlaylist,
    deletePlaylist,
    getPlaylistsStatusForTrack
};
