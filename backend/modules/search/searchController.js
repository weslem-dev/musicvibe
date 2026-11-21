const searchService = require('./searchService');
const { success } = require('../../middlewares/apiResponse');
const { SEARCH } = require('../../config/constants');

// GET /api/search?q=...
// AULA 13: async + await. Sem o await, `results` seria uma Promise, e o
// `...results` abaixo espalharia nada: a resposta viria 200, com o `query`,
// mas SEM as listas.
exports.search = async (req, res) => {
    // ?q=ab&q=cd chega como ARRAY e ?q[x]=1 como OBJETO: .trim() quebraria (500).
    // Só texto é aceito; o resto vira busca vazia.
    const raw = typeof req.query.q === 'string' ? req.query.q : '';
    const query = raw.trim().slice(0, SEARCH.MAX_LENGTH);

    let results = { tracks: [], users: [] };

    // Termo curto demais (0 ou 1 letra) nem chega ao banco.
    if (query.length >= SEARCH.MIN_LENGTH) {
        results = await searchService.globalSearch(query);
    }

    return success(res, { query, ...results });
};
