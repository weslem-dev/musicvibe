const adminService = require('./adminService');
const trackService = require('../track/trackService');
const { success } = require('../../middlewares/apiResponse');
const { parsePagination } = require('../../utils/pagination');
const { parseId } = require('../../utils/parseId');
const { SEARCH } = require('../../config/constants');

// ADICIONADO NA AULA 15. Controller do painel de administração.

// Só aceita TEXTO (?search=a&search=b chega como array e vira ''), sem espaços
// nas pontas e com o mesmo teto da busca pública.
function readSearch(value) {
    return typeof value === 'string' ? value.trim().slice(0, SEARCH.MAX_LENGTH) : '';
}

exports.getDashboard = async (req, res) => {
    const stats = await adminService.getDashboardStats();

    return success(res, stats);
};

exports.getReports = async (req, res) => {
    const { page, limit } = parsePagination(req.query);
    const status = req.query.status || 'pending';

    const reports = await adminService.getReports(status, page, limit);

    return success(res, reports);
};

exports.reviewReport = async (req, res) => {
    const id = parseId(req.params.id, 'denúncia');

    const report = await adminService.reviewReport(id);

    return success(res, report, 'Denúncia marcada como revisada.');
};

exports.getUsers = async (req, res) => {
    const { page, limit } = parsePagination(req.query);

    const users = await adminService.getUsers(readSearch(req.query.search), page, limit);

    return success(res, users);
};

// O adminId vem do TOKEN conferido no banco (req.user.id), nunca do corpo.
exports.setUserBlocked = async (req, res) => {
    const id = parseId(req.params.id, 'usuário');

    const user = await adminService.setUserBlocked(id, req.body.isBlocked, req.user.id);

    return success(res, user, user.isBlocked ? 'Usuário bloqueado.' : 'Usuário desbloqueado.');
};

exports.getTracks = async (req, res) => {
    const { page, limit } = parsePagination(req.query);

    const tracks = await adminService.getTracks(readSearch(req.query.search), page, limit);

    return success(res, tracks);
};

// Reaproveita o deleteTrack (Aula 09) com isAdmin = true: a mesma limpeza das
// tabelas (playlists, denúncias, notificações, curtidas, comentários), o
// contador do dono e os arquivos do disco -- nenhuma linha nova de destroy.
exports.deleteTrack = async (req, res) => {
    const id = parseId(req.params.id, 'faixa');

    await trackService.deleteTrack(id, req.user.id, true);

    return success(res, null, 'Faixa excluída pela administração.');
};
