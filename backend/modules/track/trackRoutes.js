const express = require('express');
const router = express.Router();
const trackController = require('./trackController');
const { uploadTrackValidator, updateTrackValidator, requireTrackFiles, trackIdValidator } = require('./trackValidator');
const asyncHandler = require('../../middlewares/asyncHandler');
const isAuthenticated = require('../../middlewares/auth');
const optionalAuth = require('../../middlewares/optionalAuth'); // ADICIONADO NA AULA 08
const trackMulter = require('../../middlewares/trackMulter');

// Ordem importa: isAuthenticated (req.userId disponível pro nome do
// arquivo) -> trackMulter (lê o multipart/form-data, preenche req.body e
// req.files) -> requireTrackFiles + uploadTrackValidator (só fazem sentido
// depois que req.body/req.files existem) -> controller.
router.post(
    '/tracks',
    isAuthenticated,
    trackMulter,
    requireTrackFiles,
    uploadTrackValidator,
    asyncHandler(trackController.uploadTrack)
);

// ADICIONADO NA AULA 08.
// Detalhe PÚBLICO (qualquer um pode ver/ouvir), mas com optionalAuth: se
// vier um token válido, o service sabe quem está vendo e calcula isOwner.
router.get(
    '/tracks/:id',
    optionalAuth,
    trackIdValidator,
    asyncHandler(trackController.getTrackDetails)
);

// ADICIONADO NA AULA 08.
// Streaming com Range, protegido por login. ATENÇÃO: o player do front-end
// (<audio>) NÃO usa esta rota. Uma tag <audio>/<video>/<img> não consegue
// enviar o cabeçalho Authorization, então não conseguiria passar pelo
// isAuthenticated -- por isso o player aponta pro arquivo estático em
// /uploads/tracks/... (que é público e também atende Range via
// express.static). Resultado, e inconsistência assumida: a rota protegida
// existe, mas o mesmo arquivo continua acessível sem token pela URL estática.
router.get(
    '/tracks/:id/stream',
    isAuthenticated,
    trackIdValidator,
    asyncHandler(trackController.streamTrack)
);

// ADICIONADO NA AULA 09.
// Faixas do usuário logado. Rota fixa ("/my-tracks"), sem :id.
router.get('/my-tracks', isAuthenticated, asyncHandler(trackController.getMyTracks));

// Dados pra pré-preencher o formulário de edição. Só o dono (403 se não é,
// 404 se não existe).
router.get(
    '/tracks/:id/edit',
    isAuthenticated,
    trackIdValidator,
    asyncHandler(trackController.getTrackForEdit)
);

// Edição: texto + capa opcional. Mesma lógica de ordem do POST: auth ->
// multer (só ele lê o multipart e preenche req.body/req.file) -> validadores
// (leem req.body já preenchido) -> controller. Se algo falhar DEPOIS do
// multer (403, 404, 400), a capa nova já está no disco: é o errorHandler que
// apaga esse arquivo órfão.
router.put(
    '/tracks/:id',
    isAuthenticated,
    trackMulter.coverOnly,
    trackIdValidator,
    updateTrackValidator,
    asyncHandler(trackController.updateTrack)
);

// Exclusão: registro + arquivos em disco + contador do usuário.
router.delete(
    '/tracks/:id',
    isAuthenticated,
    trackIdValidator,
    asyncHandler(trackController.deleteTrack)
);

module.exports = router;
