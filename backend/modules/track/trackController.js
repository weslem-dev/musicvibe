const fs = require('fs');
const trackService = require('./trackService');
const { success } = require('../../middlewares/apiResponse');

exports.uploadTrack = async (req, res) => {
    const { title, description } = req.body;

    const track = await trackService.createTrack(
        req.userId,
        { title, description },
        req.files
    );

    return success(res, track, 'Faixa enviada com sucesso!', 201);
};

// ADICIONADO NA AULA 08.
// req.userId pode ser undefined (visitante) -- é o optionalAuth que decide.
exports.getTrackDetails = async (req, res) => {
    const track = await trackService.getTrackDetails(req.params.id, req.userId);

    return success(res, track);
};

// ADICIONADO NA AULA 09.
exports.getMyTracks = async (req, res) => {
    const tracks = await trackService.getMyTracks(req.userId);

    return success(res, tracks);
};

exports.getTrackForEdit = async (req, res) => {
    const track = await trackService.getTrackForEdit(req.params.id, req.userId);

    return success(res, track);
};

// req.file existe só quando a capa foi trocada (trackMulter.coverOnly).
exports.updateTrack = async (req, res) => {
    const { title, description } = req.body;

    const track = await trackService.updateTrack(
        req.params.id,
        req.userId,
        { title, description },
        req.file
    );

    return success(res, track, 'Faixa atualizada com sucesso.');
};

exports.deleteTrack = async (req, res) => {
    await trackService.deleteTrack(req.params.id, req.userId);

    return success(res, null, 'Faixa excluída com sucesso.');
};

// Interpreta o cabeçalho "Range: bytes=INICIO-FIM". Devolve { start, end }
// (ambos inclusivos) ou null se o cabeçalho for inválido ou impossível de
// atender pro tamanho deste arquivo. Aceita as três formas válidas de um
// único intervalo: "0-1023", "500-" (até o fim) e "-500" (os últimos 500).
function parseRange(rangeHeader, fileSize) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader);
    if (!match) return null;

    const [, startText, endText] = match;
    if (startText === '' && endText === '') return null;

    let start;
    let end;

    if (startText === '') {
        const suffixLength = parseInt(endText, 10);
        if (suffixLength === 0) return null;
        start = Math.max(fileSize - suffixLength, 0);
        end = fileSize - 1;
    } else {
        start = parseInt(startText, 10);
        end = endText === '' ? fileSize - 1 : Math.min(parseInt(endText, 10), fileSize - 1);
    }

    if (start > end || start >= fileSize) return null;

    return { start, end };
}

// ADICIONADO NA AULA 08.
// Rota de streaming com suporte a Range. Construída por completo, mas o
// player do front-end NÃO a usa (ver comentário em trackRoutes.js).
exports.streamTrack = async (req, res, next) => {
    const { filePath, size, mimeType } = await trackService.getTrackAudioFile(req.params.id);

    res.setHeader('Content-Type', mimeType);
    // Avisa ao cliente que este recurso aceita requisições Range.
    res.setHeader('Accept-Ranges', 'bytes');

    let stream;

    if (!req.headers.range) {
        // Sem Range: devolve o arquivo inteiro (200).
        res.status(200);
        res.setHeader('Content-Length', size);
        stream = fs.createReadStream(filePath);
    } else {
        const range = parseRange(req.headers.range, size);

        if (!range) {
            // 416: o intervalo pedido não existe neste arquivo.
            res.status(416);
            res.setHeader('Content-Range', `bytes */${size}`);
            return res.end();
        }

        // 206 Partial Content: só o pedaço pedido. Content-Range diz qual
        // pedaço é e qual o tamanho total; Content-Length é o tamanho do pedaço.
        res.status(206);
        res.setHeader('Content-Range', `bytes ${range.start}-${range.end}/${size}`);
        res.setHeader('Content-Length', range.end - range.start + 1);
        stream = fs.createReadStream(filePath, { start: range.start, end: range.end });
    }

    stream.on('error', (err) => {
        if (res.headersSent) {
            res.destroy(err);
        } else {
            next(err);
        }
    });

    stream.pipe(res);
};
