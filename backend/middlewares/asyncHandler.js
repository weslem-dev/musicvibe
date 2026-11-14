// Evita repetir try/catch em toda função async de controller: qualquer
// erro lançado (ou rejeição de Promise) dentro de `fn` é encaminhado
// automaticamente para o `next(err)`, caindo no errorHandler central.
module.exports = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
