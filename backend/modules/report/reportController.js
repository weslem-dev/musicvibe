const reportService = require('./reportService');
const { success } = require('../../middlewares/apiResponse');
const { parseId } = require('../../utils/parseId');

// ADICIONADO NA AULA 14. Responde só o essencial da denúncia criada.
exports.reportTrack = async (req, res) => {
    const trackId = parseId(req.params.trackId, 'faixa');

    const report = await reportService.reportTrack(req.userId, trackId, req.body.reason);

    return success(
        res,
        { id: report.id, trackId: report.trackId, reason: report.reason },
        'Denúncia enviada. Obrigado por avisar.',
        201
    );
};
