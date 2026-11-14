const followService = require('./followService');
const trackService = require('../track/trackService');
const { success } = require('../../middlewares/apiResponse');
const { parsePagination } = require('../../utils/pagination');

// ADICIONADO NA AULA 11.
// req.params.userId chega como TEXTO ("5"), enquanto req.userId (do token) é
// NÚMERO (5). Em JavaScript, "5" === 5 é false: sem converter, a comparação
// "seguir a si mesmo" nunca daria true e dava pra seguir a si mesmo sem erro.
// A conversão acontece AQUI, na borda (controller), antes de o valor entrar no
// service -- que só trabalha com números.
function parseUserId(value) {
    const id = Number(value);

    if (!Number.isInteger(id) || id <= 0) {
        const error = new Error('Identificador de usuário inválido.');
        error.status = 400;
        throw error;
    }

    return id;
}

exports.toggleFollow = async (req, res) => {
    const targetId = parseUserId(req.params.userId);

    const result = await followService.toggleFollow(req.userId, targetId);

    return success(
        res,
        result,
        result.isFollowing ? 'Você começou a seguir esta pessoa.' : 'Você deixou de seguir esta pessoa.',
        result.isFollowing ? 201 : 200
    );
};

exports.getFollowStatus = async (req, res) => {
    const targetId = parseUserId(req.params.userId);

    const status = await followService.getFollowStatus(req.userId, targetId);

    return success(res, status);
};

exports.getFollowers = async (req, res) => {
    const people = await followService.getFollowers(parseUserId(req.params.userId));

    return success(res, people);
};

exports.getFollowing = async (req, res) => {
    const people = await followService.getFollowing(parseUserId(req.params.userId));

    return success(res, people);
};

// Feed de quem eu sigo. page/limit sempre válidos (parsePagination: o mesmo
// tratamento do feed geral, em um só lugar).
exports.getFollowingFeed = async (req, res) => {
    const { page, limit } = parsePagination(req.query);

    const tracks = await trackService.getFollowingTracks(req.userId, page, limit);

    return success(res, tracks);
};
