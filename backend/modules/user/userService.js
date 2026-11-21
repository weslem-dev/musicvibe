const fs = require('fs');
const path = require('path');
const User = require('./userModel');
const Track = require('../track/trackModel');
const Follow = require('../follow/followModel');
const bcrypt = require('bcryptjs');

// Mesmo caminho usado pelo profileMulter.js -- se um dia isso mudar, muda só
// aqui e lá.
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'public', 'uploads', 'profiles');
const DEFAULT_PROFILE_PICTURE = 'default-profile.png';

async function registerUser(username, email, password, fullName) {
    const emailExists = await User.findOne({ where: { email } });
    const usernameExists = await User.findOne({ where: { username } });
    if (emailExists || usernameExists) {
        // Propositalmente sem `error.status` aqui: sem status definido, o
        // errorHandler cai no padrão 500. Fica assim por enquanto (ver README).
        throw new Error('Este e-mail ou usuário já está cadastrado.');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
        username,
        email,
        password: hashedPassword,
        fullName
    });

    return {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email
    };
}

// ATUALIZADO NA AULA 09: agora devolve também as faixas da pessoa e isOwner.
// viewerId vem de req.userId (optionalAuth) -- undefined pra visitante.
async function getPublicProfile(username, viewerId) {
    const user = await User.findOne({
        where: { username },
        attributes: ['id', 'username', 'fullName', 'bio', 'profilePicture', 'followersCount', 'followingCount', 'tracksCount'],
        include: [{ model: Track, as: 'tracks' }],
        // O order fica no NÍVEL DE CIMA do findOne, apontando pra tabela
        // incluída pelo par { model, as } -- é assim que o Sequelize ordena
        // as faixas aninhadas. Um `order` escrito DENTRO do include é ignorado.
        // id DESC desempata faixas criadas no mesmo segundo.
        order: [
            [{ model: Track, as: 'tracks' }, 'createdAt', 'DESC'],
            [{ model: Track, as: 'tracks' }, 'id', 'DESC']
        ]
    });

    if (!user) {
        const error = new Error('Usuário não encontrado.');
        error.status = 404;
        throw error;
    }

    // ADICIONADO NA AULA 11 (a pendência que a Aula 09 deixou): o visitante/usuário
    // que olha este perfil já SEGUE esta pessoa? Só vale consultar quando há
    // alguém logado E essa pessoa não é o dono do perfil (ninguém segue a si
    // mesmo); nos outros casos a resposta é false, sem gastar uma consulta.
    let isFollowing = false;
    if (viewerId && viewerId !== user.id) {
        const follow = await Follow.findOne({ where: { followerId: viewerId, followingId: user.id } });
        isFollowing = Boolean(follow);
    }

    return {
        ...user.toJSON(),
        isOwner: Boolean(viewerId) && viewerId === user.id,
        isFollowing
    };
}

async function loginUser(email, password) {
    // AULA 15: a mensagem genérica passou a ter status 401 (antes saía como 500,
    // o padrão do errorHandler para um erro sem status).
    const user = await User.findOne({ where: { email } });
    if (!user) {
        const error = new Error('E-mail ou senha inválidos.');
        error.status = 401;
        throw error;
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
        const error = new Error('E-mail ou senha inválidos.');
        error.status = 401;
        throw error;
    }

    // AULA 15: conta bloqueada não entra (403: a pessoa É quem diz ser, mas não
    // tem permissão de usar a conta). A checagem vem DEPOIS da senha: antes dela,
    // qualquer um descobriria, só pelo e-mail, quais contas existem e estão
    // bloqueadas. Com a senha errada, o bloqueado recebe a mesma mensagem genérica.
    if (user.isBlocked) {
        const error = new Error('Sua conta foi bloqueada. Entre em contato com a administração.');
        error.status = 403;
        throw error;
    }

    return {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        profilePicture: user.profilePicture,
        isAdmin: user.isAdmin
    };
}

async function getUserProfile(userId) {
    const user = await User.findByPk(userId, {
        attributes: ['id', 'username', 'email', 'fullName', 'bio', 'profilePicture', 'followersCount', 'followingCount', 'tracksCount', 'isAdmin']
    });

    if (!user) {
        const error = new Error('Usuário não encontrado.');
        error.status = 404;
        throw error;
    }

    return user;
}

// ADICIONADO NA AULA 05.
// userId vem de req.userId (middlewares/auth.js). fields = { fullName, bio },
// já vindo de req.body depois do profileUpdateValidator. file é req.file
// (undefined se o usuário não trocou de foto nesta chamada).
async function updateUserProfile(userId, fields, file) {
    const user = await User.findByPk(userId);

    if (!user) {
        const error = new Error('Usuário não encontrado.');
        error.status = 404;
        throw error;
    }

    if (fields.fullName !== undefined) {
        user.fullName = fields.fullName;
    }

    if (fields.bio !== undefined) {
        user.bio = fields.bio;
    }

    if (file) {
        // Apaga a foto antiga do disco -- mas só se não for a padrão, senão
        // apagaríamos o default-profile.png que todo mundo sem foto usa.
        const oldPicture = user.profilePicture;
        if (oldPicture && oldPicture !== DEFAULT_PROFILE_PICTURE) {
            const oldPicturePath = path.join(UPLOAD_DIR, oldPicture);
            fs.unlink(oldPicturePath, (err) => {
                // Só registra no log -- uma falha aqui (ex.: arquivo já não
                // existia mais) não deve impedir o resto da atualização.
                if (err) {
                    console.error('Não foi possível remover a foto antiga:', err.message);
                }
            });
        }

        user.profilePicture = file.filename;
    }

    await user.save();

    return {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        bio: user.bio,
        profilePicture: user.profilePicture,
        followersCount: user.followersCount,
        followingCount: user.followingCount,
        tracksCount: user.tracksCount,
        isAdmin: user.isAdmin
    };
}

module.exports = { registerUser, getPublicProfile, loginUser, getUserProfile, updateUserProfile };
