const { verifyToken } = require('../config/jwt');

// Irmão "permissivo" do middlewares/auth.js (isAuthenticated):
//  - isAuthenticated BLOQUEIA: sem token válido, responde 401 e a rota nem
//    chega a rodar.
//  - optionalAuth NUNCA bloqueia: tenta identificar quem está pedindo e, se
//    conseguir, preenche req.userId/req.isAdmin. Se não houver token, ou ele
//    for inválido/expirado, simplesmente segue em frente como visitante
//    (req.userId fica undefined).
//
// É o que o detalhe da faixa precisa: a rota é pública (qualquer um pode
// ouvir/ver), mas o service precisa saber, quando houver login, se quem está
// vendo é o dono da faixa (isOwner).
module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            const decoded = verifyToken(authHeader.split(' ')[1]);
            req.userId = decoded.id;
            req.isAdmin = decoded.isAdmin;
        } catch (err) {
            // Token inválido ou expirado: não é erro aqui, só trata como visitante.
        }
    }

    next();
};
