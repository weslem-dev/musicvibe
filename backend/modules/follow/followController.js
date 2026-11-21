const followService = require('./followService');
const trackService = require('../track/trackService');
const { success } = require('../../middlewares/apiResponse');
const { parsePagination } = require('../../utils/pagination');
const { parseId } = require('../../utils/parseId');

// AULA 13: a função local parseUserId virou o utilitário compartilhado
// utils/parseId.js (o módulo de playlists precisa da mesma conversão). Mesma
// regra e mesma mensagem: "Identificador de usuário inválido." (400).

exports.toggleFollow = async (req, res) => {
    const targetId = parseId(req.params.userId, 'usuário');

    const result = await followService.toggleFollow(req.userId, targetId);

    return success(
        res,
        result,
        result.isFollowing ? 'Você começou a seguir esta pessoa.' : 'Você deixou de seguir esta pessoa.',
        result.isFollowing ? 201 : 200
    );
};

exports.getFollowStatus = async (req, res) => {
    const targetId = parseId(req.params.userId, 'usuário');

    const status = await followService.getFollowStatus(req.userId, targetId);

    return success(res, status);
};

exports.getFollowers = async (req, res) => {
    const people = await followService.getFollowers(parseId(req.params.userId, 'usuário'));

    return success(res, people);
};

exports.getFollowing = async (req, res) => {
    const people = await followService.getFollowing(parseId(req.params.userId, 'usuário'));

    return success(res, people);
};

// Feed de quem eu sigo. page/limit sempre válidos (parsePagination: o mesmo
// tratamento do feed geral, em um só lugar).
exports.getFollowingFeed = async (req, res) => {
    const { page, limit } = parsePagination(req.query);

    const tracks = await trackService.getFollowingTracks(req.userId, page, limit);

    return success(res, tracks);
};
