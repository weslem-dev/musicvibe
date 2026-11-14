const { parsePagination } = require('../../utils/pagination');
const userService = require('./userService');
const trackService = require('../track/trackService');
const { success } = require('../../middlewares/apiResponse');
const { generateToken } = require('../../config/jwt');

exports.register = async (req, res) => {
    const { username, email, password, fullName } = req.body;

    const newUser = await userService.registerUser(username, email, password, fullName);

    return success(res, newUser, 'Conta criada com sucesso! Faça login para continuar.', 201);
};

exports.getPublicProfile = async (req, res) => {
    const user = await userService.getPublicProfile(req.params.username, req.userId);

    return success(res, user);
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    const user = await userService.loginUser(email, password);
    const token = generateToken({ id: user.id, isAdmin: user.isAdmin });

    return success(res, { token, user }, 'Login realizado com sucesso.');
};

exports.logout = async (req, res) => {
    // Stateless: com JWT puro não há nada para revogar no servidor. O
    // "logout" de verdade acontece no front, apagando o token salvo.
    return success(res, null, 'Logout realizado com sucesso.');
};

exports.getMyProfile = async (req, res) => {
    const user = await userService.getUserProfile(req.userId);

    return success(res, user);
};

// ADICIONADO NA AULA 05.
// req.body vem do multipart/form-data (campos de texto), já validado por
// profileUpdateValidator. req.file (singular -- profileMulter.single(...))
// vem preenchido só quando uma foto nova foi enviada nesta requisição.
exports.updateProfile = async (req, res) => {
    const { fullName, bio } = req.body;

    const updatedUser = await userService.updateUserProfile(
        req.userId,
        { fullName, bio },
        req.file
    );

    return success(res, updatedUser, 'Perfil atualizado com sucesso.');
};

// ADICIONADO NA AULA 08.
// O feed é uma rota do módulo de usuário (/api/feed, protegida por login),
// mas quem sabe buscar as faixas é o trackService -- o controller só repassa
// page/limit (já validados) e devolve a página.
exports.getFeed = async (req, res) => {
    // page/limit sempre válidos (padrão, teto e valores inválidos tratados num só lugar).
    const { page, limit } = parsePagination(req.query);
    const tracks = await trackService.getFeedTracks(page, limit);

    return success(res, tracks);
};
