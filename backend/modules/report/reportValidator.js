const { body, validationResult } = require('express-validator');
const { REPORT } = require('../../config/constants');

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

// ADICIONADO NA AULA 14. Primeira defesa do motivo: só as cinco CHAVES passam
// (ausente, outro texto ou o rótulo em português -> 400). A segunda defesa é o
// ENUM da coluna, no banco.
exports.reportValidator = [
    body('reason')
        .isIn(REPORT.REASONS)
        .withMessage('Escolha um motivo válido para a denúncia.'),
    validate
];
