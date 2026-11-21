const { verifyToken } = require('../config/jwt');
const User = require('../modules/user/userModel');

function httpError(status, message) {
    const error = new Error(message);
    error.status = status;
    return error;
}

// AULA 15: AUTENTICAÇÃO (quem é você?). Passou a ser ASSÍNCRONO e a consultar o
// banco a cada requisição, em vez de confiar só no que está dentro do token.
//
// Por quê: o token vale por horas e foi emitido no login. Se, depois disso, a
// conta for BLOQUEADA, APAGADA ou o administrador for REBAIXADO, o token antigo
// continuaria dizendo o contrário até expirar. Lendo o banco, a mudança vale na
// PRÓXIMA requisição. Custo: uma consulta por chave primária a cada requisição
// autenticada (barata, pelo índice da PK).
//
// Espera o header "Authorization: Bearer <token>". Como é async, os erros vão
// para o next(err) (o Express 4 não captura a rejeição de uma função async).
async function isAuthenticated(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(httpError(401, 'Token de acesso não informado.'));
    }

    const token = authHeader.split(' ')[1];

    // (a) Primeiro try/catch: SÓ a verificação do token.
    let decoded;
    try {
        decoded = verifyToken(token);
    } catch {
        return next(httpError(401, 'Token inválido ou expirado.'));
    }

    // (f) Segundo try/catch: a consulta ao banco. Um erro aqui (banco fora do ar)
    // NÃO é "token inválido": vai ao errorHandler como erro do servidor.
    try {
        // (b) Só as colunas necessárias, nunca a senha.
        const user = await User.findByPk(decoded.id, { attributes: ['id', 'username', 'isAdmin', 'isBlocked'] });

        // (c) Conta apagada depois do login: o token não vale mais.
        if (!user) {
            return next(httpError(401, 'Usuário não encontrado. Faça login novamente.'));
        }

        // (d) Conta bloqueada: 401 (a sessão deixa de valer; o front leva ao Login).
        if (user.isBlocked) {
            return next(httpError(401, 'Sua conta foi bloqueada. Entre em contato com a administração.'));
        }

        // (e) O papel vem do BANCO, não do token.
        req.user = { id: user.id, username: user.username, isAdmin: user.isAdmin };
        // Mantidos para as rotas antigas (que leem req.userId), sem alteração nelas.
        req.userId = user.id;
        req.isAdmin = user.isAdmin;

        return next();
    } catch (err) {
        return next(err);
    }
}

// AULA 15: AUTORIZAÇÃO por papel (você pode fazer isto?). Precisa vir DEPOIS do
// isAuthenticated: é ele que monta o req.user. Antes dele, req.user não existe
// e TODO mundo, até o administrador, receberia 403.
function isAdmin(req, res, next) {
    if (!req.user?.isAdmin) {
        return next(httpError(403, 'Acesso restrito a administradores.'));
    }

    return next();
}

// Exporta a função como antes (as rotas antigas fazem
// `const isAuthenticated = require('.../auth')` e continuam funcionando) E os
// dois middlewares pelo nome: `const { isAuthenticated, isAdmin } = require(...)`.
module.exports = isAuthenticated;
module.exports.isAuthenticated = isAuthenticated;
module.exports.isAdmin = isAdmin;
