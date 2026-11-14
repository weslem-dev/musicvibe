const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

// Primeiro model de conteúdo da aplicação além do usuário. A associação com
// User (hasMany/belongsTo) NÃO é declarada aqui -- fica centralizada em
// config/associations.js (ver comentário lá sobre referência circular).
const Track = sequelize.define('Track',
    {
        id:           { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        title:        { type: DataTypes.STRING, allowNull: false },
        description:  { type: DataTypes.STRING(500), allowNull: true },
        audioFile:    { type: DataTypes.STRING, allowNull: false },
        cover:        { type: DataTypes.STRING, allowNull: false },
        userId:       { type: DataTypes.INTEGER, allowNull: false },
        playsCount:   { type: DataTypes.INTEGER, defaultValue: 0 },
        likesCount:   { type: DataTypes.INTEGER, defaultValue: 0 },
        // ADICIONADO NA AULA 10: contador GUARDADO (não calculado). Sempre
        // atualizado na MESMA transação que cria/apaga o comentário.
        commentsCount: { type: DataTypes.INTEGER, defaultValue: 0 }
    },
    {
        timestamps: true,
        tableName: 'tracks'
    }
);

module.exports = Track;
