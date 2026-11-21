const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

// ADICIONADO NA AULA 13. A "coleção" do MusicVibe: uma playlist pertence a UM
// usuário e guarda VÁRIAS faixas; e a mesma faixa pode estar em VÁRIAS
// playlists (de pessoas diferentes). Essa relação muitos-para-muitos fica na
// tabela de junção playlist_tracks (playlistTrackModel.js). As associações
// ficam em config/associations.js.
const Playlist = sequelize.define('Playlist',
    {
        id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        title:       { type: DataTypes.STRING(100), allowNull: false },
        description: { type: DataTypes.STRING(500), allowNull: true },
        // Privada por padrão: só fica pública se a dona marcar.
        isPublic:    { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        // Contador GUARDADO de faixas, sempre atualizado na MESMA transação que
        // cria/apaga a linha da junção.
        tracksCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        userId:      { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' }
    },
    {
        timestamps: true,
        tableName: 'playlists',
        // "Minhas playlists" sempre filtra por user_id.
        indexes: [{ fields: ['user_id'], name: 'idx_playlists_user_id' }]
    }
);

module.exports = Playlist;
