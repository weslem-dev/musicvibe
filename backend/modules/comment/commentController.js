const commentService = require('./commentService');
const { success } = require('../../middlewares/apiResponse');

exports.createComment = async (req, res) => {
    // content já chega aparado (trim) pelo validador.
    const comment = await commentService.createComment(
        req.userId,
        req.params.trackId,
        req.body.content
    );

    return success(res, comment, 'Comentário publicado.', 201);
};

exports.listComments = async (req, res) => {
    const comments = await commentService.listComments(req.params.trackId);

    return success(res, comments);
};
