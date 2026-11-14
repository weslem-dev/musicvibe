const User = require('../modules/user/userModel');
const Track = require('../modules/track/trackModel');
const Like = require('../modules/like/likeModel');
const Comment = require('../modules/comment/commentModel');
const Follow = require('../modules/follow/followModel');

// Centralizado aqui (em vez de dentro de cada model) porque as associações
// são DE DUAS MÃOS: User.hasMany(Track) precisa importar trackModel e
// Track.belongsTo(User) precisa importar userModel. Se cada model declarasse
// sua metade no próprio arquivo, os arquivos se importariam um ao outro
// (referência circular), e dependendo da ordem de carregamento do Node, um
// deles receberia um module.exports ainda incompleto. Aqui, todos os models
// já estão totalmente carregados antes de qualquer associação ser declarada.

// --- Aula 07: faixas ---
User.hasMany(Track, { foreignKey: 'userId', as: 'tracks', onDelete: 'CASCADE' });
Track.belongsTo(User, { foreignKey: 'userId', as: 'author' });

// --- Aula 10: curtidas (nos dois sentidos, com as duas pontas) ---
User.hasMany(Like, { foreignKey: 'userId', as: 'likes', onDelete: 'CASCADE' });
Like.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Track.hasMany(Like, { foreignKey: 'trackId', as: 'likes', onDelete: 'CASCADE' });
Like.belongsTo(Track, { foreignKey: 'trackId', as: 'track' });

// --- Aula 10: comentários ---
User.hasMany(Comment, { foreignKey: 'userId', as: 'comments', onDelete: 'CASCADE' });
Comment.belongsTo(User, { foreignKey: 'userId', as: 'author' });
Track.hasMany(Comment, { foreignKey: 'trackId', as: 'comments', onDelete: 'CASCADE' });
Comment.belongsTo(Track, { foreignKey: 'trackId', as: 'track' });

// --- Aula 11: seguir (usuário <-> usuário) ---
// A tabela follows liga a MESMA tabela (users) duas vezes: uma coluna aponta
// pra quem SEGUE (follower_id) e a outra pra quem É SEGUIDO (following_id).
// Sem apelidos (`as`), o Sequelize não teria como saber qual das duas pontas
// o include devolve -- os dois belongsTo apontariam pro mesmo model User. Os
// apelidos dão nome a cada ponta: Follow.Follower e Follow.Following.
Follow.belongsTo(User, { as: 'Follower', foreignKey: 'followerId', onDelete: 'CASCADE' });
Follow.belongsTo(User, { as: 'Following', foreignKey: 'followingId', onDelete: 'CASCADE' });

module.exports = { User, Track, Like, Comment, Follow };
