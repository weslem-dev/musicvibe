const { body, query, validationResult } = require('express-validator');
const { ADMIN } = require('../../config/constants');

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

// ADICIONADO NA AULA 15.
// ?status= é opcional (o controller usa 'pending' quando não vier); se vier, só
// os três filtros.
exports.reportsFilterValidator = [
    query('status')
        .optional()
        .isIn(ADMIN.REPORT_FILTERS)
        .withMessage('Filtro inválido. Use pending, reviewed ou all.'),
    validate
];

// isBlocked obrigatório (.exists) e booleano DE VERDADE (strict: o texto "true"
// é recusado). O .bail() para na primeira falha: sem ele, um campo ausente
// geraria duas mensagens.
exports.blockUserValidator = [
    body('isBlocked')
        .exists()
        .withMessage('Informe isBlocked (true ou false).')
        .bail()
        .isBoolean({ strict: true })
        .withMessage('isBlocked deve ser true ou false.'),
    validate
];
