const { body, query, validationResult } = require('express-validator');
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

exports.registerValidator = [
    // CORREÇÃO DA AULA 10: .trim() PRIMEIRO. Os validadores rodam na ordem em
    // que são escritos; com o trim no fim, o tamanho e o "não vazio" eram
    // conferidos ANTES de tirar os espaços (ex.: "  ab  " passava como 6
    // caracteres, e "   " passava como "não vazio").
    body('username')
        .trim()
        .isLength({ min: VALIDATION.USERNAME_MIN, max: VALIDATION.USERNAME_MAX })
        .withMessage(`O nome de usuário deve ter entre ${VALIDATION.USERNAME_MIN} e ${VALIDATION.USERNAME_MAX} caracteres.`),
    body('email')
        .trim()
        .isEmail()
        .withMessage('Por favor, insira um e-mail válido.')
        .normalizeEmail(),
    body('password')
        .isLength({ min: VALIDATION.PASSWORD_MIN })
        .withMessage(`A senha deve ter pelo menos ${VALIDATION.PASSWORD_MIN} caracteres.`),
    body('confirmPassword')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('As senhas não coincidem.');
            }
            return true;
        }),
    body('fullName')
        .trim()
        .notEmpty()
        .withMessage('O nome completo é obrigatório.'),
    validate
];

exports.loginValidator = [
    body('email')
        .trim()
        .isEmail()
        .withMessage('Por favor, insira um e-mail válido.')
        .normalizeEmail(),
    body('password')
        .notEmpty()
        .withMessage('A senha é obrigatória.'),
    validate
];

// ADICIONADO NA AULA 05.
// fullName e bio são opcionais aqui (o usuário pode querer trocar só a foto),
// por isso .optional() em vez de .notEmpty()/.isLength() direto. bio usa
// VALIDATION.BIO_MAX -- a constante certa para este campo, e não
// USERNAME_MAX ou qualquer outra pensada para outra coisa.
exports.profileUpdateValidator = [
    body('fullName')
        .optional({ checkFalsy: true })
        .trim()
        .notEmpty()
        .withMessage('O nome completo não pode ficar vazio.'),
    body('bio')
        .optional({ checkFalsy: true })
        .isLength({ max: VALIDATION.BIO_MAX })
        .withMessage(`A bio deve ter no máximo ${VALIDATION.BIO_MAX} caracteres.`),
    validate
];

// ADICIONADO NA AULA 08.
// page e limit são opcionais (têm padrão no service), mas, se vierem, precisam
// ser inteiros positivos; limit tem teto pra ninguém pedir a tabela inteira
// de uma vez. toInt() converte o texto da query string em número.
