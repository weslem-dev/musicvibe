const path = require('path');
const multer = require('multer');

// Onde as fotos de perfil ficam salvas em disco. O caminho é relativo à raiz
// do projeto (__dirname aqui é a pasta middlewares/, por isso o '..').
const UPLOAD_DIR = path.join(__dirname, '..', 'public', 'uploads', 'profiles');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        // Nome único por upload, no mesmo padrão usado como referência:
        // profile-<userId>-<timestamp>-<numero aleatório><extensão original>.
        // req.userId já existe neste ponto porque isAuthenticated roda ANTES
        // deste middleware na rota (ver userRoutes.js).
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const extension = path.extname(file.originalname).toLowerCase();
        cb(null, `profile-${req.userId}-${uniqueSuffix}${extension}`);
    }
});

function fileFilter(req, file, cb) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.mimetype)) {
        return cb(new Error('Formato de imagem inválido. Envie um arquivo JPG, PNG ou WEBP.'));
    }

    cb(null, true);
}

const profileMulter = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
});

module.exports = profileMulter;
