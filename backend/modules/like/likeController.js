const likeService = require('./likeService');
const { success } = require('../../middlewares/apiResponse');

// 201 quando a curtida foi CRIADA; 200 quando foi REMOVIDA.
exports.toggleLike = async (req, res) => {
    const { liked, likesCount } = await likeService.toggleLike(req.userId, req.params.trackId);

    return success(
        res,
        { liked, likesCount },
        liked ? 'Faixa curtida.' : 'Curtida removida.',
        liked ? 201 : 200
    );
};

exports.getLikeStatus = async (req, res) => {
    const status = await likeService.getLikeStatus(req.params.trackId, req.userId);

    return success(res, status);
};

exports.getLikedTracks = async (req, res) => {
    const tracks = await likeService.getLikedTracks(req.userId);

    return success(res, tracks);
};
