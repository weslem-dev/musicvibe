// AULA 15: promove (ou rebaixa) um administrador pelo TERMINAL do servidor.
//
//   node scripts/setAdmin.js <username>       -> vira administrador
//   node scripts/setAdmin.js <username> off   -> deixa de ser
//
// Não existe ROTA para isso de propósito: uma rota que dá poder de administrador
// precisaria, ela mesma, de um administrador (quem cria o primeiro?), e seria o
// alvo mais valioso da API. Quem tem acesso ao servidor e ao .env já é, por
// definição, de confiança. Como o isAuthenticated lê o papel do banco, a mudança
// vale na próxima requisição, mesmo com o token antigo.
// O silêncio (DOTENV_CONFIG_QUIET) evita as dicas que o dotenv 17 imprime.
process.env.DOTENV_CONFIG_QUIET = 'true';
require('dotenv').config();

const sequelize = require('../config/database');
const User = require('../modules/user/userModel');

async function main() {
    const username = process.argv[2];
    const turnOn = process.argv[3] !== 'off';

    if (!username) {
        console.log('Uso: node scripts/setAdmin.js <username> [off]');
        process.exitCode = 1;
        return;
    }

    const user = await User.findOne({ where: { username } });

    if (!user) {
        console.log(`Usuário "${username}" não encontrado.`);
        process.exitCode = 1;
        return;
    }

    await user.update({ isAdmin: turnOn });

    console.log(turnOn
        ? `"${user.username}" agora é administrador.`
        : `"${user.username}" deixou de ser administrador.`);
}

main()
    .catch((err) => {
        console.error(err.message);
        process.exitCode = 1;
    })
    .finally(() => sequelize.close());
