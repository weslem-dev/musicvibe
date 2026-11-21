const { body, validationResult } = require('express-validator');
const { VALIDATION } = require('../../config/constants');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }

    const firstError = errors.array()[0].msg;

    const error = new Error(firstError);
    error.status = 400;
    error.errors = errors.array();
    throw error;
};

// ADICIONADO NA AULA 13.
// title: .trim() ANTES de .notEmpty() (senão "   " passaria como "não vazio").
// description: opcional ("" e null contam como ausente: checkFalsy).
// isPublic: opcional, mas, se vier, tem que ser booleano de verdade (strict):
// "sim", 1 ou "yes" são recusados com 400.
exports.createPlaylistValidator = [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('O título da playlist é obrigatório.')
        .isLength({ min: VALIDATION.PLAYLIST_TITLE_MIN, max: VALIDATION.PLAYLIST_TITLE_MAX })
        .withMessage(`O título da playlist deve ter entre ${VALIDATION.PLAYLIST_TITLE_MIN} e ${VALIDATION.PLAYLIST_TITLE_MAX} caracteres.`),
    body('description')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: VALIDATION.PLAYLIST_DESCRIPTION_MAX })
        .withMessage(`A descrição deve ter no máximo ${VALIDATION.PLAYLIST_DESCRIPTION_MAX} caracteres.`),
    body('isPublic')
        .optional()
        .isBoolean({ strict: true })
        .withMessage('O campo isPublic deve ser verdadeiro ou falso.'),
    validate
];
