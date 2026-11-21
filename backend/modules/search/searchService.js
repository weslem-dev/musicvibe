const { Op } = require('sequelize');
const Track = require('../track/trackModel');
const User = require('../user/userModel');
const { SEARCH } = require('../../config/constants');
const { escapeLike } = require('../../utils/escapeLike'); // AULA 15: extraído para utils/

// Camada de acesso a dados da busca. AULA 13: deixou de ser um stub (que
// devolvia listas vazias desde a Aula 02) e passou a consultar o banco.

// Só estes campos de uma pessoa saem da API (nunca password nem email).
const PERSON_ATTRIBUTES = ['id', 'username', 'fullName', 'profilePicture', 'bio'];
const AUTHOR_ATTRIBUTES = ['id', 'username', 'fullName', 'profilePicture'];

// O escapeLike (Aula 13) foi para utils/escapeLike.js na Aula 15: o painel de
// administração também busca com LIKE e usa a MESMA função.

// Faixas cujo TÍTULO contém o termo, mais novas primeiro (id desempata).
// Maiúsculas e minúsculas não importam: a collation da tabela já compara sem
// diferenciar caixa.
async function searchTracks(term) {
    return Track.findAll({
        where: { title: { [Op.like]: `%${escapeLike(term)}%` } },
        include: [{ model: User, as: 'author', attributes: AUTHOR_ATTRIBUTES }],
        order: [['createdAt', 'DESC'], ['id', 'DESC']],
        limit: SEARCH.LIMIT
    });
}

// Pessoas cujo username OU nome completo contém o termo.
async function searchUsers(term) {
    const pattern = `%${escapeLike(term)}%`;

    return User.findAll({
        where: {
            [Op.or]: [
                { username: { [Op.like]: pattern } },
                { fullName: { [Op.like]: pattern } }
            ]
        },
        attributes: PERSON_ATTRIBUTES,
        order: [['username', 'ASC']],
        limit: SEARCH.LIMIT
    });
}

// As duas consultas não dependem uma da outra: rodam EM PARALELO (Promise.all),
// e a resposta chega no tempo da mais lenta, não na soma das duas.
async function globalSearch(term) {
    const [tracks, users] = await Promise.all([searchTracks(term), searchUsers(term)]);

    return { tracks, users };
}

module.exports = { globalSearch, escapeLike };
