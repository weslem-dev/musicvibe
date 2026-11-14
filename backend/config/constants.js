module.exports = {
    VALIDATION: {
        USERNAME_MIN: 3,
        USERNAME_MAX: 20,
        PASSWORD_MIN: 6,
        BIO_MAX: 160,
        TITLE_MAX: 100,
        DESCRIPTION_MAX: 500,
        COMMENT_MAX: 500
    },
    // Aula 12: UM tamanho de página só, para os dois feeds (geral e de quem eu
    // sigo). Antes havia DEFAULT_LIMIT: 10 num feed e FOLLOWING_FEED_LIMIT: 12
    // no outro (dois números para o mesmo conceito). Estes valores precisam
    // combinar com PAGE_SIZE do frontend (src/config/constants.js).
    PAGINATION: {
        DEFAULT_PAGE: 1,
        DEFAULT_LIMIT: 12,
        MAX_LIMIT: 50
    }
};
