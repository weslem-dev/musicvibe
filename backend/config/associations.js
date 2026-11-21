const User = require('../modules/user/userModel');
const Track = require('../modules/track/trackModel');
const Like = require('../modules/like/likeModel');
const Comment = require('../modules/comment/commentModel');
const Follow = require('../modules/follow/followModel');
const Playlist = require('../modules/playlist/playlistModel');
const PlaylistTrack = require('../modules/playlist/playlistTrackModel');
const Notification = require('../modules/notification/notificationModel'); // ADICIONADO NA AULA 14
const Report = require('../modules/report/reportModel'); // ADICIONADO NA AULA 14

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

// --- Aula 13: playlists (muitos-para-muitos entre Playlist e Track) ---
// Seis associações, cada lado com as suas duas pontas:
//  - a dona: User 1 -- N Playlist;
//  - a junção pelos dois lados: Playlist 1 -- N PlaylistTrack N -- 1 Track.
User.hasMany(Playlist, { foreignKey: 'userId', as: 'playlists', onDelete: 'CASCADE' });
Playlist.belongsTo(User, { foreignKey: 'userId', as: 'owner' });
Playlist.hasMany(PlaylistTrack, { foreignKey: 'playlistId', as: 'entries', onDelete: 'CASCADE' });
PlaylistTrack.belongsTo(Playlist, { foreignKey: 'playlistId', as: 'playlist' });
Track.hasMany(PlaylistTrack, { foreignKey: 'trackId', as: 'playlistEntries', onDelete: 'CASCADE' });
PlaylistTrack.belongsTo(Track, { foreignKey: 'trackId', as: 'track' });

// ADICIONADO NA AULA 14. Só o sentido belongsTo (é ele que cria a chave
// estrangeira na tabela filha, e o ON DELETE sai do allowNull da coluna):
//   notifications.track_id aceita null -> ON DELETE SET NULL
//   reports.track_id é obrigatório     -> ON DELETE NO ACTION
Notification.belongsTo(User, { foreignKey: 'userId', as: 'Recipient' });
Notification.belongsTo(User, { foreignKey: 'actorId', as: 'Actor' });
Notification.belongsTo(Track, { foreignKey: 'trackId', as: 'track' });
Report.belongsTo(User, { foreignKey: 'userId', as: 'Reporter' });
Report.belongsTo(Track, { foreignKey: 'trackId', as: 'track' });

module.exports = { User, Track, Like, Comment, Follow, Playlist, PlaylistTrack, Notification, Report };
