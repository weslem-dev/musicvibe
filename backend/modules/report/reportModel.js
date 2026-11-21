const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
const { REPORT } = require('../../config/constants');

// ADICIONADO NA AULA 14.
// Uma denúncia: uma pessoa (userId) avisa a moderação de que uma faixa (trackId)
// merece revisão, por um dos cinco motivos fixos (ENUM: o banco recusa qualquer
// outro valor, mesmo que o validator falhe).
//
// AULA 15: + status (pending/reviewed) e reviewedAt, para o painel de administração.
//
// trackId é OBRIGATÓRIO. A chave estrangeira vem da associação belongsTo, e,
// para coluna NOT NULL, o padrão do Sequelize é ON DELETE NO ACTION: o banco se
// RECUSA a apagar uma faixa que ainda tem denúncias. Por isso o deleteTrack
// apaga as denúncias antes da faixa.
const Report = sequelize.define('Report',
    {
        id:      { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        userId:  { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
        trackId: { type: DataTypes.INTEGER, allowNull: false },
        reason:  { type: DataTypes.ENUM(...REPORT.REASONS), allowNull: false },
        // AULA 15: situação da denúncia no painel. O defaultValue é o que permite
        // ao sync({ alter: true }) ACRESCENTAR esta coluna NOT NULL a uma tabela
        // que já tem linhas: o banco preenche as antigas com 'pending'. Sem ele,
        // o ALTER TABLE não teria valor para as linhas que já existem.
        status:     { type: DataTypes.ENUM(...Object.values(REPORT.STATUS)), allowNull: false, defaultValue: REPORT.STATUS.PENDING },
        // Quando foi revisada (null enquanto pendente).
        reviewedAt: { type: DataTypes.DATE, allowNull: true }
    },
    {
        timestamps: true,
        tableName: 'reports',
        indexes: [
            // Uma denúncia por pessoa por faixa: é o banco que garante o 409,
            // mesmo com dois cliques simultâneos.
            { unique: true, fields: ['user_id', 'track_id'], name: 'idx_unique_report_user_track' },
            // Achar as denúncias de UMA faixa (exclusão; e a moderação, na Aula 15).
            { fields: ['track_id'], name: 'idx_reports_track_id' },
            // AULA 15: o filtro do painel (pendentes / revisadas) e as contagens
            // do Dashboard buscam por situação.
            { fields: ['status'], name: 'idx_reports_status' }
        ]
    }
);

module.exports = Report;
