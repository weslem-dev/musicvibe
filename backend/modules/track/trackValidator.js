const { body, param, validationResult } = require('express-validator');
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

// express-validator só enxerga req.body (campos de texto) -- a presença dos
// arquivos (req.files, preenchido pelo trackMulter que roda ANTES deste
// middleware) precisa ser checada à parte, aqui.
exports.requireTrackFiles = (req, res, next) => {
    const files = req.files || {};

    if (!files.audioFile || !files.audioFile[0]) {
        const error = new Error('O arquivo de áudio é obrigatório.');
        error.status = 400;
        throw error;
    }

    if (!files.cover || !files.cover[0]) {
        const error = new Error('A imagem de capa é obrigatória.');
        error.status = 400;
        throw error;
    }

    next();
};

// Regras dos campos de texto da faixa. Valem tanto pro upload (POST) quanto
// pra edição (PUT): título obrigatório, descrição opcional, mesmos limites.
const trackTextRules = [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('O título é obrigatório.')
        .isLength({ max: VALIDATION.TITLE_MAX })
        .withMessage(`O título deve ter no máximo ${VALIDATION.TITLE_MAX} caracteres.`),
    body('description')
        .optional({ checkFalsy: true })
        .isLength({ max: VALIDATION.DESCRIPTION_MAX })
        .withMessage(`A descrição deve ter no máximo ${VALIDATION.DESCRIPTION_MAX} caracteres.`)
];

exports.uploadTrackValidator = [...trackTextRules, validate];

// ADICIONADO NA AULA 09.
exports.updateTrackValidator = [...trackTextRules, validate];

// ADICIONADO NA AULA 08.
// :id precisa ser um inteiro positivo. Um id bem formado mas inexistente
// passa por aqui e vira 404 no service; um id mal formado (ex.: "abc") é
// recusado aqui mesmo, com 400, antes de chegar no banco.
exports.trackIdValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Identificador de faixa inválido.')
        .toInt(),
    validate
];

// ADICIONADO NA AULA 10. Mesma regra do trackIdValidator, mas para rotas em
// que o parâmetro se chama :trackId (/tracks/:trackId/toggle-like, .../comments).
exports.trackIdParamValidator = [
    param('trackId')
        .isInt({ min: 1 })
        .withMessage('Identificador de faixa inválido.')
        .toInt(),
    validate
];
