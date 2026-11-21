const Report = require('./reportModel');
const Track = require('../track/trackModel');

function httpError(status, message) {
    const error = new Error(message);
    error.status = status;
    return error;
}

// ADICIONADO NA AULA 14.
// Ordem: a faixa existe? (404) -> é minha? (400) -> já denunciei? (409).
// Uma escrita só, então não precisa de transação; e o dono da faixa NÃO é
// notificado (a denúncia é para a moderação, não para ele).
async function reportTrack(userId, trackId, reason) {
    const track = await Track.findByPk(trackId, { attributes: ['id', 'userId'] });

    if (!track) {
        throw httpError(404, 'Faixa não encontrada.');
    }

    if (track.userId === userId) {
        throw httpError(400, 'Você não pode denunciar a sua própria faixa.');
    }

    try {
        // findOrCreate pela dupla (userId, trackId): se já existe, created é
        // false -> 409. Denunciar de novo NÃO é idempotente como "adicionar à
        // playlist": a segunda denúncia não pode virar uma nova, nem trocar o
        // motivo da primeira em silêncio, então avisamos o conflito.
        const [report, created] = await Report.findOrCreate({
            where: { userId, trackId },
            defaults: { reason }
        });

        if (!created) {
            throw httpError(409, 'Você já denunciou esta faixa.');
        }

        return report;
    } catch (err) {
        // Dois cliques SIMULTÂNEOS: os dois findOrCreate podem não achar a linha
        // e tentar inserir; o índice único (user_id, track_id) barra o segundo.
        if (err.name === 'SequelizeUniqueConstraintError') {
            throw httpError(409, 'Você já denunciou esta faixa.');
        }
        throw err;
    }
}

module.exports = { reportTrack };
