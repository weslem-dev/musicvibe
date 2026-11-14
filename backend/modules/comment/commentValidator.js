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

// ADICIONADO NA AULA 10.
// A ORDEM importa: os validadores rodam na sequência em que são escritos.
// .trim() vem PRIMEIRO: ele tira os espaços das pontas, e só então o
// .notEmpty() confere. Se fosse o contrário, "   " (só espaços) seria
// "não vazio" e passaria, para só depois o trim() transformá-lo em "".
exports.createCommentValidator = [
    body('content')
        .trim()
        .notEmpty()
        .withMessage('O comentário não pode ficar vazio.')
        .isLength({ max: VALIDATION.COMMENT_MAX })
        .withMessage(`O comentário deve ter no máximo ${VALIDATION.COMMENT_MAX} caracteres.`),
    validate
];
