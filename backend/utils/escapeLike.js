// AULA 15: extraído do searchService. Agora são DUAS buscas com LIKE (a pública
// e as do painel de administração); uma cópia em cada lugar seria duas regras
// para manter iguais, e a que ficasse sem escape devolveria TUDO para quem
// digitasse "%%".
//
// No LIKE, % significa "qualquer texto" e _ significa "qualquer caractere". O
// escape põe uma barra antes de \, % e _, e o MySQL passa a tratá-los como texto.
function escapeLike(text) {
    return text.replace(/[\\%_]/g, '\\$&');
}

module.exports = { escapeLike };
