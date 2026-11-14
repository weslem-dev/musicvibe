const express = require('express');
const router = express.Router();
const commentController = require('./commentController');
const { createCommentValidator } = require('./commentValidator');
const { trackIdParamValidator } = require('../track/trackValidator');
const asyncHandler = require('../../middlewares/asyncHandler');
const isAuthenticated = require('../../middlewares/auth');

// Comentar: exige login e valida o texto.
router.post(
    '/tracks/:trackId/comments',
    isAuthenticated,
    trackIdParamValidator,
    createCommentValidator,
    asyncHandler(commentController.createComment)
);

// Listar: público (qualquer pessoa lê os comentários).
router.get(
    '/tracks/:trackId/comments',
    trackIdParamValidator,
    asyncHandler(commentController.listComments)
);

module.exports = router;
