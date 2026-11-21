const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const sequelize = require('../../config/database');
const Track = require('./trackModel');
const User = require('../user/userModel');
const Like = require('../like/likeModel');
const Comment = require('../comment/commentModel');
const Follow = require('../follow/followModel');
const Playlist = require('../playlist/playlistModel');
const PlaylistTrack = require('../playlist/playlistTrackModel');
const Report = require('../report/reportModel'); // AULA 14
const Notification = require('../notification/notificationModel'); // AULA 14
const { PAGINATION } = require('../../config/constants');
const { removeFile } = require('../../utils/fileCleanup');

// Mesmas pastas usadas pelo trackMulter.js -- se mudar, muda só aqui e lá.
const AUDIO_DIR = path.join(__dirname, '..', '..', 'public', 'uploads', 'tracks');
const COVER_DIR = path.join(__dirname, '..', '..', 'public', 'uploads', 'covers');

const AUDIO_MIME_TYPES = {
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav'
};

// Só estes campos do autor saem da API. Listar o que PODE sair (em vez de
// tentar esconder o que não pode) garante que `password` e `email` nunca
// vazem, mesmo se a tabela users ganhar novas colunas no futuro.
const AUTHOR_ATTRIBUTES = ['id', 'username', 'fullName', 'profilePicture'];

function httpError(status, message) {
    const error = new Error(message);
    error.status = status;
    return error;
}

async function createTrack(userId, fields, files) {
    const audioFilename = files.audioFile[0].filename;
    const coverFilename = files.cover[0].filename;

    // As DUAS escritas (a faixa em `tracks` + o contador tracksCount em `users`)
    // acontecem numa transação: ou valem as duas, ou nenhuma. Antes, se o
    // increment falhasse depois do create, a faixa ficava no banco SEM o
    // contador subir -- e o errorHandler ainda apagava os arquivos da faixa
    // (que já estava gravada), deixando um registro apontando pra arquivos que
    // não existem mais. Todo comando aqui dentro leva { transaction: t }.
    const track = await sequelize.transaction(async (t) => {
        const created = await Track.create({
            title: fields.title,
            description: fields.description || null,
            audioFile: audioFilename,
            cover: coverFilename,
            userId
        }, { transaction: t });

        // increment() em vez de ler+salvar evita condição de corrida se dois
        // uploads do mesmo usuário terminarem ao mesmo tempo.
        await User.increment('tracksCount', { where: { id: userId }, transaction: t });

        return created;
    });

    return track;
}

// ADICIONADO NA AULA 08 (corrigido na AULA 09).
// viewerId vem de req.userId (preenchido pelo optionalAuth) -- é undefined
// quando quem pede é um visitante sem login.
async function getTrackDetails(trackId, viewerId) {
    const track = await Track.findByPk(trackId, {
        include: [{ model: User, as: 'author', attributes: AUTHOR_ATTRIBUTES }]
    });

    if (!track) {
        throw httpError(404, 'Faixa não encontrada.');
    }

    // Reaproveita a coluna playsCount (criada na Aula 07) como contador de
    // visualizações/reproduções. Track.increment() faz o UPDATE direto no
    // banco (plays_count = plays_count + 1), mas NÃO atualiza o objeto que já
    // temos em memória.
    await Track.increment('playsCount', { where: { id: trackId } });

    // CORREÇÃO DA AULA 09: na Aula 08 eu somava 1 "na mão" ao valor lido
    // antes do UPDATE (playsCount + 1). Isso só acerta se ninguém mais tiver
    // visto a faixa entre a leitura e o UPDATE; com duas pessoas abrindo a
    // faixa ao mesmo tempo, as duas leriam o mesmo número e a resposta
    // ficaria diferente do que realmente está no banco. reload() relê a linha
    // (com o include do autor) DEPOIS do UPDATE, então a resposta sempre
    // mostra o valor real do banco.
    await track.reload();

    // ADICIONADO NA AULA 10: este visitante/usuário já curtiu a faixa? Sem
    // login (viewerId undefined) é sempre false. Os contadores likesCount e
    // commentsCount já vêm nas colunas da própria faixa.
    let isLiked = false;
    if (viewerId) {
        const like = await Like.findOne({ where: { userId: viewerId, trackId } });
        isLiked = Boolean(like);
    }

    return {
        ...track.toJSON(),
        isOwner: Boolean(viewerId) && track.userId === viewerId,
        isLiked
    };
}

// ADICIONADO NA AULA 08.
// page e limit chegam aqui já tratados por parsePagination (utils/pagination.js,
// chamado no controller): números válidos, com teto. Os valores padrão abaixo
// vêm de PAGINATION (config/constants.js) e só valem se alguém chamar este
// service sem passar nada.
async function getFeedTracks(page = PAGINATION.DEFAULT_PAGE, limit = PAGINATION.DEFAULT_LIMIT) {
    // "Página" é o que o cliente pede; "quantos registros pular" é o que o
    // banco entende. Página 1 não pula nada; página 2 pula uma página inteira
    // de registros; e assim por diante.
    const offset = (page - 1) * limit;

    return Track.findAll({
        include: [{ model: User, as: 'author', attributes: AUTHOR_ATTRIBUTES }],
        // id DESC como desempate: duas faixas criadas no mesmo segundo não
        // podem trocar de lugar entre uma página e outra.
        order: [['createdAt', 'DESC'], ['id', 'DESC']],
        limit,
        offset
    });
}

// ADICIONADO NA AULA 11.
// Mesmo feed da Aula 08, mas só com as faixas de QUEM O USUÁRIO SEGUE.
async function getFollowingTracks(userId, page = PAGINATION.DEFAULT_PAGE, limit = PAGINATION.DEFAULT_LIMIT) {
    // 1) Quem eu sigo? Só os ids (attributes), já como array de números.
    const follows = await Follow.findAll({
        where: { followerId: userId },
        attributes: ['followingId']
    });
    const followedIds = follows.map((follow) => follow.followingId);

    // 2) Quem não segue ninguém recebe [] JÁ AQUI. `userId IN ()` com lista
    //    vazia não é SQL válido (o Sequelize ainda improvisaria algo como
    //    IN (NULL)), e mesmo quando funciona é uma consulta à toa: o resultado
    //    só pode ser vazio. Responder cedo evita o erro e poupa um acesso ao banco.
    if (followedIds.length === 0) {
        return [];
    }

    const offset = (page - 1) * limit;

    // 3) O mesmo findAll do feed, com um filtro a mais: o autor da faixa
    //    (userId) precisa estar na lista de quem eu sigo.
    return Track.findAll({
        where: { userId: { [Op.in]: followedIds } },
        include: [{ model: User, as: 'author', attributes: AUTHOR_ATTRIBUTES }],
        order: [['createdAt', 'DESC'], ['id', 'DESC']],
        limit,
        offset
    });
}

// ADICIONADO NA AULA 08.
// Devolve só o que a rota de streaming precisa: onde o arquivo está em
// disco, o tamanho dele e o Content-Type certo. Nada de req/res aqui.
async function getTrackAudioFile(trackId) {
    const track = await Track.findByPk(trackId, { attributes: ['id', 'audioFile'] });

    if (!track) {
        throw httpError(404, 'Faixa não encontrada.');
    }

    const filePath = path.join(AUDIO_DIR, track.audioFile);

    let stats;
    try {
        stats = await fs.promises.stat(filePath);
    } catch (err) {
        throw httpError(404, 'Arquivo de áudio não encontrado no servidor.');
    }

    const extension = path.extname(track.audioFile).toLowerCase();

    return {
        filePath,
        size: stats.size,
        mimeType: AUDIO_MIME_TYPES[extension] || 'application/octet-stream'
    };
}

// ADICIONADO NA AULA 09.
// Compartilhada por get-for-edit, update e delete. A ORDEM das duas
// verificações importa:
//   1) "existe?"  -> 404. Se a faixa não existe, não há de quem ser; dizer
//      "você não pode" (403) seria mentir sobre algo que nem existe.
//   2) "é sua?"   -> 403. Só faz sentido perguntar de quem é depois de saber
//      que existe.
// (401, por sua vez, é "não sei quem é você" e já foi resolvido antes, pelo
// isAuthenticated: nem chega aqui.)
// AULA 15: isAdmin (padrão false) libera a checagem de dono -- só o painel de
// administração passa true. A rota comum de excluir não passa nada, então nela
// até o administrador recebe 403 numa faixa de outra pessoa.
async function findOwnedTrack(trackId, userId, isAdmin = false) {
    const track = await Track.findByPk(trackId);

    if (!track) {
        throw httpError(404, 'Faixa não encontrada.');
    }

    if (!isAdmin && track.userId !== userId) {
        throw httpError(403, 'Você não tem permissão para modificar esta faixa.');
    }

    return track;
}

// ADICIONADO NA AULA 09.
// Faixas do usuário logado, da mais nova pra mais antiga.
async function getMyTracks(userId) {
    return Track.findAll({
        where: { userId },
        order: [['createdAt', 'DESC'], ['id', 'DESC']]
    });
}

// ADICIONADO NA AULA 09.
// Dados pra pré-preencher o formulário de edição. Não mexe na contagem de
// visualizações: abrir a EDIÇÃO da própria faixa não é "ver" a faixa.
async function getTrackForEdit(trackId, userId) {
    const track = await findOwnedTrack(trackId, userId);

    return {
        id: track.id,
        title: track.title,
        description: track.description,
        cover: track.cover,
        audioFile: track.audioFile
    };
}

// ADICIONADO NA AULA 09.
// file é req.file (só a capa; undefined se o usuário não trocou a imagem).
async function updateTrack(trackId, userId, fields, file) {
    const track = await findOwnedTrack(trackId, userId);

    const oldCover = track.cover;

    track.title = fields.title;
    track.description = fields.description || null;

    if (file) {
        track.cover = file.filename;
    }

    // BANCO PRIMEIRO, disco depois. Se salvar no banco falhar, nada foi
    // apagado e o registro continua apontando pra um arquivo que existe.
    // Na ordem inversa (apagar do disco e só então salvar), uma falha no
    // banco deixaria o registro apontando pra uma capa que já foi apagada:
    // imagem quebrada e sem como recuperar. Na ordem certa, o pior caso é
    // sobrar um arquivo antigo no disco (lixo inofensivo, que dá pra limpar
    // depois).
    await track.save();

    if (file) {
        await removeFile(path.join(COVER_DIR, oldCover));
    }

    return track;
}

// ADICIONADO NA AULA 09.
// AULA 15: + isAdmin (padrão false). O painel de administração exclui pela MESMA
// função (com true), sem repetir a limpeza das tabelas.
async function deleteTrack(trackId, userId, isAdmin = false) {
    const track = await findOwnedTrack(trackId, userId, isAdmin);

    const { audioFile, cover } = track;

    // Tudo isto precisa acontecer JUNTO ou nada: transação. (Aula 10: agora
    // a faixa pode ter curtidas e comentários, que precisam sair antes dela.)
    // Todo comando leva { transaction }: um que esqueça rodaria fora dela.
    await sequelize.transaction(async (transaction) => {
        // Mesma trava da curtida/comentário: ninguém curte nem comenta a faixa
        // no meio da exclusão (senão ficaria uma curtida/comentário órfão no
        // banco, apontando pra uma faixa que acabou de sumir).
        const locked = await Track.findByPk(trackId, {
            attributes: ['id'],
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        if (!locked) {
            throw httpError(404, 'Faixa não encontrada.');
        }

        // --- AULA 13: a faixa sai de todas as playlists em que estava ---
        // O banco tem ON DELETE CASCADE em playlist_tracks, então as linhas da
        // junção sumiriam sozinhas junto com a faixa. Mas o CASCADE só apaga
        // LINHAS: ele não sabe que playlists.tracks_count é um contador guardado,
        // derivado dessas linhas. Sem este bloco, cada playlist afetada ficaria
        // contando uma faixa que não existe mais.
        //
        // A faixa já está travada acima; nenhuma adição nova pode entrar até o
        // fim desta transação (a adição trava a faixa primeiro). Para manter a
        // mesma ordem de travas do módulo de playlists (faixa -> playlist ->
        // junção) e não cair em deadlock com uma remoção simultânea:
        //  1) descobre as playlists candidatas;
        //  2) trava essas playlists (em ordem de id);
        //  3) relê a junção JÁ COM a trava (pode ter havido uma remoção nesse meio
        //     tempo) e só desconta das playlists que de fato tinham a faixa.
        const candidates = await PlaylistTrack.findAll({ where: { trackId }, attributes: ['playlistId'], transaction });

        if (candidates.length) {
            await Playlist.findAll({
                where: { id: candidates.map((entry) => entry.playlistId) },
                attributes: ['id'],
                order: [['id', 'ASC']],
                transaction,
                lock: transaction.LOCK.UPDATE
            });

            const entries = await PlaylistTrack.findAll({
                where: { trackId },
                attributes: ['playlistId'],
                transaction,
                lock: transaction.LOCK.UPDATE
            });
            const affectedIds = entries.map((entry) => entry.playlistId);

            // Cada playlist tem a faixa no máximo UMA vez (índice único), então
            // descontar 1 de cada playlist afetada é exato.
            if (affectedIds.length) {
                await Playlist.decrement('tracksCount', { where: { id: affectedIds }, transaction });
            }

            await PlaylistTrack.destroy({ where: { trackId }, transaction });
        }

        // --- AULA 14: denúncias e notificações da faixa saem antes dela ---
        // reports.track_id é NOT NULL e a chave estrangeira é NO ACTION: sem esta
        // linha, o banco RECUSA apagar a faixa (500 citando a FK de reports).
        await Report.destroy({ where: { trackId }, transaction });
        // notifications.track_id aceita null e a chave é SET NULL: sem esta
        // linha, a faixa sairia, mas os avisos ficariam ÓRFÃOS (track_id NULL),
        // "curtiu a sua faixa" de uma faixa que não existe mais.
        await Notification.destroy({ where: { trackId }, transaction });

        await Like.destroy({ where: { trackId }, transaction });
        await Comment.destroy({ where: { trackId }, transaction });
        await track.destroy({ transaction });
        // AULA 15: desconta do DONO da faixa (track.userId). Antes era o userId de
        // quem pediu, que só era o dono porque só o dono podia excluir; pelo
        // painel, quem pede é o administrador.
        await User.decrement('tracksCount', { where: { id: track.userId }, transaction });
    });

    // Banco primeiro (já confirmado acima), disco depois: mesma regra do
    // update. Só chega aqui se o banco já deu certo.
    await removeFile(path.join(AUDIO_DIR, audioFile));
    await removeFile(path.join(COVER_DIR, cover));
}

module.exports = {
    createTrack,
    getTrackDetails,
    getFeedTracks,
    getFollowingTracks,
    getTrackAudioFile,
    getMyTracks,
    getTrackForEdit,
    updateTrack,
    deleteTrack
};
