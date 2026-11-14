const { error } = require('./apiResponse');
const { removeUploadedFiles } = require('../utils/fileCleanup');

// Middleware de erro central: precisa ter 4 parâmetros (err, req, res, next)
// para o Express reconhecer como error handler, e precisa ser o ÚLTIMO
// app.use() registrado em app.js.
module.exports = async (err, req, res, next) => {
    console.error(err);

    // ADICIONADO NA AULA 09.
    // Se a requisição chegou até aqui com erro, qualquer arquivo que o multer
    // tenha salvo nela virou órfão (não existe registro no banco apontando
    // pra ele). Apaga ANTES de responder, pra quando o cliente receber o
    // erro o disco já estar limpo.
    await removeUploadedFiles(req);

    // Erros do próprio multer (ex.: arquivo grande demais) são culpa do
    // cliente, não do servidor: 400, e não o 500 padrão.
    let statusCode = err.status || (err.name === 'MulterError' ? 400 : 500);
    let message = err.message || 'Ocorreu um erro inesperado.';

    if (err.code === 'LIMIT_FILE_SIZE') {
        message = 'Arquivo muito grande. O limite é de 20 MB por arquivo.';
    }

    const errors = err.errors || [];

    return error(res, message, statusCode, errors);
};
