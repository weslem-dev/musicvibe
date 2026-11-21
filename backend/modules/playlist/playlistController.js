const playlistService = require('./playlistService');
const { success } = require('../../middlewares/apiResponse');
const { parseId } = require('../../utils/parseId');

// ADICIONADO NA AULA 13.
// TODO id que vem de req.params ou do corpo passa por parseId ANTES do service:
// a ordem das respostas fica 400 (id mal formado) -> 404 (não existe) ->
// 403 (não é seu).

exports.getMyPlaylists = async (req, res) => {
    const playlists = await playlistService.getUserPlaylists(req.userId);

    return success(res, playlists);
};

exports.createPlaylist = async (req, res) => {
    // title e description já chegam aparados (trim) pelo validador.
    const playlist = await playlistService.createPlaylist(req.userId, req.body);

    return success(res, playlist, 'Playlist criada.', 201);
};

// Pública (optionalAuth): visitante tem req.userId undefined -> null.
exports.getPlaylistDetails = async (req, res) => {
    const playlistId = parseId(req.params.id, 'playlist');

    const { playlist, tracks, isOwner } = await playlistService.getPlaylistById(playlistId, req.userId ?? null);

    return success(res, { ...playlist.toJSON(), tracks, isOwner });
};

exports.deletePlaylist = async (req, res) => {
    const playlistId = parseId(req.params.id, 'playlist');

    await playlistService.deletePlaylist(playlistId, req.userId);

    return success(res, null, 'Playlist excluída.');
};

// 201 quando a faixa ENTROU agora; 200 quando já estava (idempotente).
exports.addTrack = async (req, res) => {
    const playlistId = parseId(req.params.id, 'playlist');
    const trackId = parseId(req.body?.trackId, 'faixa');

    const result = await playlistService.addToPlaylist(playlistId, trackId, req.userId);

    return success(
        res,
        result,
        result.added ? 'Faixa adicionada à playlist.' : 'A faixa já estava nesta playlist.',
        result.added ? 201 : 200
    );
};

exports.removeTrack = async (req, res) => {
    const playlistId = parseId(req.params.id, 'playlist');
    const trackId = parseId(req.params.trackId, 'faixa');

    const result = await playlistService.removeFromPlaylist(playlistId, trackId, req.userId);

    return success(res, result, 'Faixa removida da playlist.');
};

exports.getPlaylistsStatus = async (req, res) => {
    const trackId = parseId(req.params.trackId, 'faixa');

    const playlists = await playlistService.getPlaylistsStatusForTrack(req.userId, trackId);

    return success(res, playlists);
};
