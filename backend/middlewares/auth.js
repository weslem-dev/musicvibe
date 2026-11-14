const { verifyToken } = require('../config/jwt');

// Protege rotas que exigem login: espera o header
// "Authorization: Bearer <token>". Lança erro (capturado pelo asyncHandler
// da rota / errorHandler central) em vez de responder direto, pra manter o
// mesmo padrão de tratamento de erro do resto da API.
module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        const error = new Error('Token de acesso não informado.');
        error.status = 401;
        throw error;
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = verifyToken(token);
        req.userId = decoded.id;
        req.isAdmin = decoded.isAdmin;
        next();
    } catch (err) {
        const error = new Error('Token inválido ou expirado.');
        error.status = 401;
        throw error;
    }
};
