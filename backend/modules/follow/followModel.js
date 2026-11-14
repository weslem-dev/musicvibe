const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

// ADICIONADO NA AULA 11. Uma linha = "followerId SEGUE followingId".
// Os dois campos apontam para users; as associações (com apelidos Follower e
// Following) ficam em config/associations.js.
const Follow = sequelize.define('Follow',
    {
        id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        followerId:  { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
        followingId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' }
    },
    {
        timestamps: true,
        tableName: 'follows',
        indexes: [
            // 1) Índice ÚNICO composto: a mesma pessoa não segue a mesma pessoa
            //    duas vezes (garantido pelo BANCO, não só pelo código). Também
            //    serve de índice pra pergunta "QUEM EU SIGO?" (where follower_id = ?):
            //    um índice composto é lido a partir da coluna da ESQUERDA, então
            //    (follower_id, following_id) acelera buscas por follower_id sozinho,
            //    ou pelo par -- mas NÃO por following_id sozinho.
            { unique: true, fields: ['follower_id', 'following_id'], name: 'idx_unique_follow' },
            // 2) Por isso existe o segundo índice: a pergunta "QUEM ME SEGUE?"
            //    (where following_id = ?) não começa pela coluna da esquerda do
            //    primeiro, e sem este índice o banco leria a tabela inteira.
            { fields: ['following_id'], name: 'idx_follows_following_id' }
        ]
    }
);

module.exports = Follow;
