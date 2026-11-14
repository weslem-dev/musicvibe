const { PAGINATION } = require('../config/constants');

// ADICIONADO NA AULA 12.
// Transforma a query string (?page=2&limit=10) em { page, limit } SEMPRE
// válidos, não importa o que o cliente mandou.
//
// Por que existe: antes, cada feed repetia suas próprias regras (e valores
// padrão diferentes). Valores como ?limit=-3 ou ?page=-2 chegariam ao banco
// como LIMIT -3 / OFFSET negativo (erro 500, o MySQL recusa), e ?limit=100000
// pediria o banco inteiro de uma vez. Agora existe um único lugar que decide.
//
// Como funciona a conta:
//   Number.parseInt('abc') devolve NaN, e QUALQUER comparação com NaN é false
//   (NaN >= 1 é false). Então a MESMA comparação `valor >= 1` já recusa, de
//   uma vez, o que está ausente (undefined), o que não é número ('abc'), o
//   zero e os negativos: todos caem no valor padrão, sem if separado para cada
//   caso. (Por isso é `>= 1`: com `> 1`, ?limit=1 seria recusado.)
//
// O teto (MAX_LIMIT) existe para o cliente não conseguir pedir "a tabela
// inteira" com ?limit=100000: uma consulta enorme sobrecarrega o banco e a
// resposta.
function parsePagination(query) {
    const page = Number.parseInt(query.page, 10);
    const limit = Number.parseInt(query.limit, 10);

    return {
        page: page >= 1 ? page : PAGINATION.DEFAULT_PAGE,
        limit: limit >= 1 ? Math.min(limit, PAGINATION.MAX_LIMIT) : PAGINATION.DEFAULT_LIMIT
    };
}

module.exports = { parsePagination };
