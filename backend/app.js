var express = require('express');
var path = require('path'); // ADICIONADO NA AULA 05
var logger = require('morgan');
var cors = require('cors');
require('dotenv').config();

var indexRouter = require('./routes/index');
var searchRoutes = require('./modules/search/searchRoutes'); // ADICIONADO NA AULA 02
var userRoutes = require('./modules/user/userRoutes'); // ADICIONADO NA AULA 03
var trackRoutes = require('./modules/track/trackRoutes'); // ADICIONADO NA AULA 07
var likeRoutes = require('./modules/like/likeRoutes'); // ADICIONADO NA AULA 10
var commentRoutes = require('./modules/comment/commentRoutes'); // ADICIONADO NA AULA 10
var followRoutes = require('./modules/follow/followRoutes'); // ADICIONADO NA AULA 11
var playlistRoutes = require('./modules/playlist/playlistRoutes'); // ADICIONADO NA AULA 13
var notificationRoutes = require('./modules/notification/notificationRoutes'); // ADICIONADO NA AULA 14
var reportRoutes = require('./modules/report/reportRoutes'); // ADICIONADO NA AULA 14
var adminRoutes = require('./modules/admin/adminRoutes'); // ADICIONADO NA AULA 15
var errorHandler = require('./middlewares/errorHandler'); // ADICIONADO NA AULA 03

var app = express();

app.use(logger('dev'));
// AULA 14: o cors veio para ANTES dos parsers. Antes ele estava depois do
// express.json(): quando o corpo era inválido (ex.: o logout mandando "null"),
// o parser respondia 400 sem passar pelo cors -- a resposta saía SEM o cabeçalho
// Access-Control-Allow-Origin e o navegador acusava "erro de CORS" no Console,
// escondendo o 400 de verdade. Agora toda resposta, até a de erro, leva o cabeçalho.
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Fotos de perfil enviadas via multer (Aula 05) ficam acessíveis publicamente
// em http://localhost:3000/uploads/profiles/<arquivo>. Precisa vir ANTES das
// rotas da API, no mesmo espírito de middleware global.
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads'))); // ADICIONADO NA AULA 05

app.use('/api', indexRouter);
app.use('/api', searchRoutes); // ADICIONADO NA AULA 02
app.use('/api', userRoutes); // ADICIONADO NA AULA 03
app.use('/api', trackRoutes); // ADICIONADO NA AULA 07
app.use('/api', likeRoutes); // ADICIONADO NA AULA 10
app.use('/api', commentRoutes); // ADICIONADO NA AULA 10
app.use('/api', followRoutes); // ADICIONADO NA AULA 11 (antes do 404 e do errorHandler)
app.use('/api', playlistRoutes); // ADICIONADO NA AULA 13 (antes do 404 e do errorHandler)
app.use('/api', notificationRoutes); // ADICIONADO NA AULA 14 (antes do 404 e do errorHandler)
app.use('/api', reportRoutes); // ADICIONADO NA AULA 14 (antes do 404 e do errorHandler)
app.use('/api', adminRoutes); // ADICIONADO NA AULA 15 (depois das denúncias, antes do 404)

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Rota não encontrada.',
        errors: []
    });
});

// Precisa ser o ÚLTIMO app.use() -- é o que captura os erros lançados
// (ou repassados via asyncHandler) em qualquer rota acima.
app.use(errorHandler); // ADICIONADO NA AULA 03

// Conecta e sincroniza o banco (cria/ajusta as tabelas `users` e `tracks`
// automaticamente a partir dos models). ADICIONADO NA AULA 03
require('./config/associations'); // ADICIONADO NA AULA 07 -- precisa carregar ANTES do sync, senão o Sequelize sincroniza as tabelas sem saber da FK entre elas
var sequelize = require('./config/database');
sequelize.sync({ alter: true })
    .then(() => console.log('Banco de dados sincronizado!'))
    .catch((err) => console.error('Erro ao sincronizar banco:', err));

module.exports = app;
