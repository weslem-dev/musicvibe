// ADICIONADO NA AULA 13 (antes era a função local parseUserId do followController).
//
// Todo id que chega pela URL (req.params) ou pelo corpo (req.body) é TEXTO
// ("5") ou qualquer coisa que o cliente mandou ("abc", "-1", 3.5). Os services
// trabalham com NÚMERO: "5" === 5 é false, e um id inválido viraria uma
// consulta à toa ou um erro 500 lá no banco. A conversão acontece na BORDA (no
// controller), e um valor que não é inteiro positivo para ali com 400.
//
//   parseId(req.params.id, 'playlist')  ->  5   ou  400 "Identificador de playlist inválido."
function parseId(rawValue, label) {
    const id = Number(rawValue);

    // Number('') é 0 e Number(undefined) é NaN: os dois caem aqui, assim como
    // 'abc', negativos e decimais.
    if (rawValue === null || rawValue === '' || !Number.isInteger(id) || id <= 0) {
        const error = new Error(`Identificador de ${label} inválido.`);
        error.status = 400;
        throw error;
    }

    return id;
}

module.exports = { parseId };
