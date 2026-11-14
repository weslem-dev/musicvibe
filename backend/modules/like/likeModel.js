const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

// ADICIONADO NA AULA 10. Uma linha = "este usuário curtiu esta faixa".
// As associações com User e Track ficam em config/associations.js.
const Like = sequelize.define('Like',
    {
        id:      { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        userId:  { type: DataTypes.INTEGER, allowNull: false },
        trackId: { type: DataTypes.INTEGER, allowNull: false }
    },
    {
        timestamps: true,
        tableName: 'likes',
        indexes: [
            // "Uma pessoa só curte uma vez" garantido pelo BANCO, e não só
            // pelo código. O service até confere antes de inserir, mas dois
            // cliques simultâneos podem passar juntos por essa conferência;
            // quem barra o segundo é este índice único composto (a dupla
            // user_id + track_id não pode se repetir).
            // Os nomes das colunas aqui são os REAIS do banco (snake_case),
            // porque o projeto usa `underscored: true` (config/database.js).
            { unique: true, fields: ['user_id', 'track_id'], name: 'idx_unique_like_user_track' }
        ]
    }
);

module.exports = Like;
