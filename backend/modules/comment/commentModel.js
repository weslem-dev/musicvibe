const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

// ADICIONADO NA AULA 10. Comentário de um usuário numa faixa.
// As associações com User e Track ficam em config/associations.js.
const Comment = sequelize.define('Comment',
    {
        id:      { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        content: { type: DataTypes.TEXT, allowNull: false },
        userId:  { type: DataTypes.INTEGER, allowNull: false },
        trackId: { type: DataTypes.INTEGER, allowNull: false }
    },
    {
        timestamps: true,
        tableName: 'comments'
    }
);

module.exports = Comment;
