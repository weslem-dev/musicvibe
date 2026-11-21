const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

// ADICIONADO NA AULA 13. Tabela de JUNÇÃO: uma linha = "esta faixa está nesta
// playlist". Uma relação muitos-para-muitos não cabe numa coluna de nenhuma das
// duas tabelas (uma playlist tem N faixas e uma faixa está em N playlists), por
// isso ela ganha uma tabela só dela.
const PlaylistTrack = sequelize.define('PlaylistTrack',
    {
        id:         { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        playlistId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'playlists', key: 'id' }, onDelete: 'CASCADE' },
        trackId:    { type: DataTypes.INTEGER, allowNull: false, references: { model: 'tracks', key: 'id' }, onDelete: 'CASCADE' }
    },
    {
        timestamps: true,
        tableName: 'playlist_tracks',
        indexes: [
            // 1) ÚNICO composto: a mesma faixa não entra duas vezes na mesma
            //    playlist (garantido pelo banco). Por começar por playlist_id, também
            //    acelera "quais faixas estão NESTA playlist?" (o detalhe).
            { unique: true, fields: ['playlist_id', 'track_id'], name: 'idx_unique_playlist_track' },
            // 2) Simples em track_id: acelera a pergunta pelo outro lado, "em quais
            //    playlists ESTA faixa está?" (o status do modal "Salvar" e a exclusão
            //    da faixa). O índice composto não serve para ela, porque só é lido a
            //    partir da coluna da esquerda.
            { fields: ['track_id'], name: 'idx_playlist_tracks_track_id' }
        ]
    }
);

module.exports = PlaylistTrack;
