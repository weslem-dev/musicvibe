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
var errorHandler = require('./middlewares/errorHandler'); // ADICIONADO NA AULA 03

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
}));

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
