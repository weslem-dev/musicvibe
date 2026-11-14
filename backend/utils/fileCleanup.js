const fs = require('fs');

// ADICIONADO NA AULA 09.
// Apaga UM arquivo do disco sem nunca derrubar quem chamou. ENOENT ("não
// existe") é ignorado de propósito: se o arquivo já sumiu, o objetivo
// (ele não estar lá) já foi cumprido. Qualquer outro erro só é registrado
// no log -- uma falha de limpeza não pode transformar uma operação que deu
// certo (ou um erro que já está sendo tratado) em outro erro.
async function removeFile(filePath) {
    if (!filePath) return;

    try {
        await fs.promises.unlink(filePath);
    } catch (err) {
        if (err.code !== 'ENOENT') {
            console.error('Não foi possível remover o arquivo:', filePath, err.message);
        }
    }
}

// Junta todos os arquivos que o multer salvou NESTA requisição, seja qual
// for o formato que ele usou:
//  - .single('campo')  -> req.file  (um arquivo)
//  - .array('campo')   -> req.files (lista)
//  - .fields([...])    -> req.files (objeto { campo: [arquivos] })
function collectUploadedFiles(req) {
    const files = [];

    if (req.file) {
        files.push(req.file);
    }

    if (Array.isArray(req.files)) {
        files.push(...req.files);
    } else if (req.files) {
        Object.values(req.files).forEach((list) => files.push(...list));
    }

    return files;
}

// Apaga do disco tudo que o multer salvou nesta requisição. É chamado pelo
// errorHandler: quando uma requisição com upload FALHA (permissão negada,
// validação, etc.), o multer já tinha gravado o arquivo antes de qualquer
// checagem rodar -- sem esta limpeza, ele ficaria no disco sem nenhum
// registro no banco apontando pra ele (arquivo órfão).
async function removeUploadedFiles(req) {
    await Promise.all(collectUploadedFiles(req).map((file) => removeFile(file.path)));
}

module.exports = { removeFile, removeUploadedFiles };
