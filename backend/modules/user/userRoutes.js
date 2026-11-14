const express = require('express');
const router = express.Router();
const userController = require('./userController');
const { registerValidator, loginValidator, profileUpdateValidator } = require('./userValidator');
const asyncHandler = require('../../middlewares/asyncHandler');
const isAuthenticated = require('../../middlewares/auth');
const optionalAuth = require('../../middlewares/optionalAuth'); // ADICIONADO NA AULA 09
const profileMulter = require('../../middlewares/profileMulter'); // ADICIONADO NA AULA 05

router.post('/register', registerValidator, asyncHandler(userController.register));
router.post('/login', loginValidator, asyncHandler(userController.login));
router.post('/logout', asyncHandler(userController.logout));

// /profile/me precisa vir ANTES de /profile/:username, senão "me" seria
// interpretado como um username.
router.get('/profile/me', isAuthenticated, asyncHandler(userController.getMyProfile));

// ADICIONADO NA AULA 05.
// Ordem importa: isAuthenticated primeiro (profileMulter precisa de
// req.userId pronto pra montar o nome do arquivo), depois profileMulter
// (só ele sabe ler um corpo multipart/form-data e preencher req.body/req.file),
// só então o validador (que lê req.body já preenchido).
router.put(
    '/profile/me',
    isAuthenticated,
    profileMulter.single('profilePicture'),
    profileUpdateValidator,
    asyncHandler(userController.updateProfile)
);

// ATUALIZADO NA AULA 09: continua público, mas com optionalAuth pra o service
// saber se quem está vendo é o próprio dono do perfil (isOwner). Fica DEPOIS
// de /profile/me (ver comentário lá em cima).
router.get('/profile/:username', optionalAuth, asyncHandler(userController.getPublicProfile));

// ADICIONADO NA AULA 08. Feed protegido: sem token, 401.
router.get('/feed', isAuthenticated, asyncHandler(userController.getFeed));

module.exports = router;
