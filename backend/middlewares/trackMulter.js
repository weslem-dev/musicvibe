const path = require('path');
const multer = require('multer');

// Grupo A (áudio + capa): dois arquivos, cada um com seu próprio campo e
// pasta de destino -- por isso multer.fields([...]), e não multer.single(...)
// (que só aceita UM campo de arquivo por requisição, como a foto de perfil
// da Aula 05). Cada objeto em .fields() diz "espere um campo chamado X, com
// no máximo N arquivos nele".
const AUDIO_DIR = path.join(__dirname, '..', 'public', 'uploads', 'tracks');
const COVER_DIR = path.join(__dirname, '..', 'public', 'uploads', 'covers');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'audioFile') {
            return cb(null, AUDIO_DIR);
        }
        if (file.fieldname === 'cover') {
            return cb(null, COVER_DIR);
        }
        cb(new Error('Campo de arquivo desconhecido.'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const extension = path.extname(file.originalname).toLowerCase();
        cb(null, `${file.fieldname}-${req.userId}-${uniqueSuffix}${extension}`);
    }
});

// Arquivo em formato errado é erro do CLIENTE: 400, e não o 500 padrão.
function badRequest(message) {
    const error = new Error(message);
    error.status = 400;
    return error;
}

function fileFilter(req, file, cb) {
    // O mimetype que o cliente reporta pra .mp3 nem sempre é confiável (o
    // navegador e o curl nem sempre mandam "audio/mpeg"). Por isso aceitamos
    // também pela extensão do nome original do arquivo, como reforço.
    const audioMimeTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/wave'];
    const audioExtensions = ['.mp3', '.wav'];
    const imageMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

    const extension = path.extname(file.originalname).toLowerCase();

    if (file.fieldname === 'audioFile') {
        const isValidAudio = audioMimeTypes.includes(file.mimetype) || audioExtensions.includes(extension);
        if (!isValidAudio) {
            return cb(badRequest('Formato de áudio inválido. Envie um arquivo MP3 ou WAV.'));
        }
    }

    if (file.fieldname === 'cover') {
        const isValidImage = imageMimeTypes.includes(file.mimetype) || imageExtensions.includes(extension);
        if (!isValidImage) {
            return cb(badRequest('Formato de imagem inválido. Envie um arquivo JPG, PNG ou WEBP.'));
        }
    }

    cb(null, true);
}

// Uma configuração de multer, dois "formatos" de uso:
//  - trackMulter (padrão): .fields([...]) -- upload da faixa, com os DOIS
//    arquivos (áudio + capa) de uma vez (POST /tracks).
//  - trackMulter.coverOnly: .single('cover') -- ADICIONADO NA AULA 09, para a
//    edição (PUT /tracks/:id), em que só a capa pode ser trocada (opcional).
//    O áudio não muda na edição: pra trocar a música, exclui e envia de novo.
const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 20 * 1024 * 1024 } // 20 MB -- cobre tanto o áudio quanto a capa
});

const trackMulter = upload.fields([
    { name: 'audioFile', maxCount: 1 },
    { name: 'cover', maxCount: 1 }
]);

trackMulter.coverOnly = upload.single('cover');

module.exports = trackMulter;
