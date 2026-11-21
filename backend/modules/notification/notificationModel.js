const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
const { NOTIFICATION } = require('../../config/constants');

// ADICIONADO NA AULA 14.
// Um aviso para quem RECEBE (userId) sobre o que outra pessoa (actorId) fez:
// curtiu ou comentou uma faixa dela, ou passou a segui-la.
//
// trackId é OPCIONAL: o aviso de "seguiu você" não tem faixa (fica null).
// A chave estrangeira de trackId é criada pela associação belongsTo (em
// config/associations.js). Como a coluna aceita null, o padrão do Sequelize
// para ela é ON DELETE SET NULL: se a faixa sumir sem limpar os avisos, a linha
// fica órfã, com track_id NULL (o deleteTrack apaga os avisos antes).
const Notification = sequelize.define('Notification',
    {
        id:      { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        userId:  { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
        actorId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
        type:    { type: DataTypes.ENUM(...Object.values(NOTIFICATION.TYPES)), allowNull: false },
        trackId: { type: DataTypes.INTEGER, allowNull: true },
        isRead:  { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
    },
    {
        timestamps: true,
        tableName: 'notifications',
        indexes: [
            // "As MINHAS não lidas" (o número do sino) e "as minhas" (a lista):
            // o índice composto começa por user_id, então serve às duas buscas.
            { fields: ['user_id', 'is_read'], name: 'idx_notifications_user_read' },
            // Achar os avisos de UMA faixa (a exclusão da faixa apaga todos).
            { fields: ['track_id'], name: 'idx_notifications_track_id' }
        ]
    }
);

module.exports = Notification;
