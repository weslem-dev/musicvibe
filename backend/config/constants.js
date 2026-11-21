module.exports = {
    VALIDATION: {
        USERNAME_MIN: 3,
        USERNAME_MAX: 20,
        PASSWORD_MIN: 6,
        BIO_MAX: 160,
        TITLE_MAX: 100,
        DESCRIPTION_MAX: 500,
        COMMENT_MAX: 500,
        // Aula 13: playlists (a "coleção" do MusicVibe).
        PLAYLIST_TITLE_MIN: 3,
        PLAYLIST_TITLE_MAX: 100,
        PLAYLIST_DESCRIPTION_MAX: 500
    },
    // Aula 12: UM tamanho de página só, para os dois feeds (geral e de quem eu
    // sigo). Antes havia DEFAULT_LIMIT: 10 num feed e FOLLOWING_FEED_LIMIT: 12
    // no outro (dois números para o mesmo conceito). Estes valores precisam
    // combinar com PAGE_SIZE do frontend (src/config/constants.js).
    PAGINATION: {
        DEFAULT_PAGE: 1,
        DEFAULT_LIMIT: 12,
        MAX_LIMIT: 50
    },
    // Aula 13: busca global (GET /api/search). Termos com menos de MIN_LENGTH
    // letras nem chegam ao banco; o texto é cortado em MAX_LENGTH; e cada lista
    // (faixas e pessoas) devolve no máximo LIMIT resultados.
    SEARCH: {
        MIN_LENGTH: 2,
        MAX_LENGTH: 100,
        LIMIT: 10
    },
    // Aula 14: notificações. Os TIPOS viram o ENUM da coluna `type` (o model usa
    // Object.values(NOTIFICATION.TYPES)), então só existem estes três avisos.
    NOTIFICATION: {
        TYPES: {
            LIKE: 'like',
            COMMENT: 'comment',
            FOLLOW: 'follow'
        }
    },
    // Aula 14: denúncias. Os cinco motivos são FIXOS (iguais em todos os projetos;
    // a Aula 15 lê as denúncias com esta mesma lista). O banco guarda a CHAVE; o
    // front mostra o rótulo em português.
    REPORT: {
        REASONS: ['inappropriate_content', 'harassment', 'spam', 'copyright', 'other'],
        // Aula 15: a situação da denúncia no painel. Toda denúncia nasce pendente;
        // o administrador a marca como revisada.
        STATUS: {
            PENDING: 'pending',
            REVIEWED: 'reviewed'
        }
    },
    // Aula 15: painel de administração. 'all' é só um FILTRO da lista (não é
    // uma situação gravada no banco).
    ADMIN: {
        REPORT_FILTERS: ['pending', 'reviewed', 'all']
    }
};
