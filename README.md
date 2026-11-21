# MusicVibe

Plataforma web para publicar e ouvir música autoral. Artistas enviam faixas (áudio + capa), e quem ouve navega pelo feed, abre a faixa no player, curte, comenta e segue artistas.

Projeto full stack desenvolvido ao longo da disciplina de Programação Web na Católica SC, com uma entrega incremental por aula. A versão publicada aqui é a da **Aula 15**.

> A mesma aplicação, reorganizada em **DDD + arquitetura hexagonal** com mensageria, está em [musicvibe-ddd](https://github.com/weslem-dev/musicvibe-ddd).

## Stack

| Camada | Tecnologias |
|---|---|
| Back-end | Node.js, Express, Sequelize, MySQL, JWT, bcrypt, Multer, express-validator |
| Front-end | Vue 3 (Composition API), Vue Router, Pinia, Axios, Vite |

## Funcionalidades

- **Contas:** cadastro, login e logout com JWT, perfil próprio editável (bio e foto) e perfil público.
- **Faixas:** upload de áudio e capa via `multipart/form-data`, com validação de tipo e tamanho; edição e exclusão pelo autor.
- **Streaming:** rota de áudio com suporte a `Range` (HTTP 206), para o player conseguir avançar e retroceder sem baixar o arquivo inteiro.
- **Social:** curtir/descurtir, comentar e seguir/deixar de seguir, com contadores (faixas, seguidores, curtidas, comentários, plays).
- **Feeds:** feed geral e feed de quem eu sigo, paginados.
- **Playlists:** coleções públicas ou privadas, com "Salvar" (marcar em quais playlists a faixa está) e detalhe da playlist.
- **Busca** de faixas e pessoas, com debounce, termo na URL e barra de busca na Navbar.
- **Notificações:** curtidas, comentários e novos seguidores, com sino na Navbar (polling a cada 30 s) e "marcar como lida".
- **Denúncias** de faixas, com cinco motivos fixos.
- **Painel de administração:** Dashboard, revisão de denúncias, bloqueio de usuários e exclusão de faixas, acessível só a administradores.

## Decisões técnicas

- **Módulos por funcionalidade** (`user`, `track`, `like`, `comment`, `follow`, `search`), cada um com `routes → controller → service → model`. O controller cuida só do HTTP, e a regra de negócio fica no service.
- **Transações no Sequelize:** quando o service grava o registro e atualiza um contador do autor (ex.: criar faixa + `tracksCount`), as duas escritas acontecem dentro de uma transação. Se uma falhar, nada fica gravado pela metade.
- **Limpeza de arquivos em caso de erro:** o `errorHandler` apaga os arquivos enviados por uma requisição que falhou, para não deixar arquivos órfãos no disco.
- **Paginação blindada:** `utils/pagination.js` normaliza `?page` e `?limit` (valores ausentes, inválidos, zero ou negativos voltam ao padrão) e aplica um teto (`MAX_LIMIT = 50`), evitando `LIMIT` negativo no MySQL e consultas da tabela inteira.
- **Respostas da API padronizadas:** todas seguem o formato `{ success, message, data, errors }`.
- **Front-end sem condição de corrida:** o composable `useAsyncData` numera cada requisição (`lastCallId`) e descarta respostas atrasadas. Assim, ao trocar rápido de perfil, a tela nunca mostra os dados do perfil anterior.
- **Feedback de erro no lugar certo:** ações (curtir, seguir, excluir) avisam por toast via interceptor do Axios, leituras mostram o erro na própria tela e formulários mostram o erro no campo.
- **Atualização otimista** em curtir, seguir, "Salvar" na playlist e "marcar como lida", com um único helper (`runOptimistic`): a interface responde na hora e desfaz a mudança se a API falhar. As ações do administrador fazem o contrário e esperam o servidor.
- **Contadores guardados e consistentes:** playlists e notificações entram na mesma transação da ação que as gera, com travas de linha numa ordem fixa para evitar deadlock. A exclusão de uma faixa limpa playlists, denúncias e notificações antes de apagá-la.
- **Busca segura:** o `LIKE` escapa `%` e `_` (`utils/escapeLike.js`), então buscar `%%` não devolve a tabela inteira.
- **Autorização que lê o banco:** o `isAuthenticated` confere o usuário no banco a cada requisição. Bloquear uma conta ou rebaixar um administrador vale na hora, mesmo com o token antigo. O painel tem uma única guarda (`router.use('/admin', isAuthenticated, isAdmin)`).

Mais detalhes em [`docs/`](docs): [Aula 12](docs/decisoes-aula-12.md), [Aula 13](docs/decisoes-aula-13.md), [Aula 14](docs/decisoes-aula-14.md) e [Aula 15](docs/decisoes-aula-15.md).

## Estrutura

```
musicvibe/
├── backend/
│   ├── app.js              # middlewares globais, rotas e sync do banco
│   ├── bin/www             # sobe o servidor HTTP
│   ├── config/             # banco, JWT, associações entre models, constantes
│   ├── middlewares/        # auth (isAuthenticated + isAdmin), upload (multer), errorHandler, apiResponse
│   ├── modules/            # user, track, like, comment, follow, search, playlist, notification, report, admin
│   ├── scripts/            # setAdmin.js (promove/rebaixa administrador pelo terminal)
│   └── utils/              # paginação, parseId, escapeLike, limpeza de arquivos
├── frontend/
│   └── src/
│       ├── views/          # telas (feed, faixa, upload, perfil, ...)
│       ├── components/     # componentes de base (BaseModal, ConfirmModal...) e de domínio
│       ├── composables/    # useAsyncData, usePaginatedList, useDebouncedValue, useToast, useAuth, ...
│       ├── services/       # chamadas à API (Axios)
│       ├── stores/         # Pinia (autenticação e notificações)
│       └── router/         # rotas e guards de autenticação
└── docs/
```

## API (principais rotas)

Todas as rotas usam o prefixo `/api`.

| Método | Rota | Descrição |
|---|---|---|
| POST | `/register`, `/login`, `/logout` | Autenticação |
| GET / PUT | `/profile/me` | Perfil do usuário logado |
| GET | `/profile/:username` | Perfil público |
| GET | `/feed`, `/following-tracks` | Feed geral e feed de quem eu sigo |
| POST | `/tracks` | Upload de faixa (áudio + capa) |
| GET / PUT / DELETE | `/tracks/:id` | Detalhe, edição e exclusão |
| GET | `/tracks/:id/stream` | Streaming do áudio com `Range` |
| GET | `/my-tracks`, `/liked-tracks` | Minhas faixas e faixas curtidas |
| POST | `/tracks/:trackId/toggle-like` | Curtir / descurtir |
| GET / POST | `/tracks/:trackId/comments` | Comentários |
| POST | `/users/:userId/toggle-follow` | Seguir / deixar de seguir |
| GET | `/users/:userId/followers`, `/users/:userId/following` | Seguidores e seguindo |
| GET | `/search?q=` | Busca de faixas e pessoas |
| GET / POST | `/my-playlists`, `/playlists` | Minhas playlists e criar |
| GET / DELETE | `/playlists/:id` | Detalhe e exclusão |
| POST / DELETE | `/playlists/:id/tracks`, `/playlists/:id/tracks/:trackId` | Adicionar e remover faixa |
| GET | `/tracks/:trackId/playlists-status` | Em quais das minhas playlists a faixa está |
| GET | `/notifications`, `/notifications/unread-count` | Notificações e número de não lidas |
| PATCH | `/notifications/:id/read` | Marcar como lida |
| POST | `/tracks/:trackId/report` | Denunciar uma faixa |
| GET | `/admin/dashboard` | Painel: números do sistema |
| GET / PATCH | `/admin/reports`, `/admin/reports/:id/review` | Painel: denúncias e revisão |
| GET / PATCH | `/admin/users`, `/admin/users/:id/block` | Painel: usuários e bloqueio |
| GET / DELETE | `/admin/tracks`, `/admin/tracks/:id` | Painel: faixas e exclusão |

## Como executar

Pré-requisitos: Node.js 22+ e MySQL 8.

```bash
# 1. Back-end
cd backend
cp .env.example .env        # preencha DB_* e JWT_SECRET
npm install
npm run dev                 # http://localhost:3000/api

# 2. Front-end (em outro terminal)
cd frontend
cp .env.example .env
npm install
npm run dev                 # http://localhost:5173
```

As tabelas são criadas automaticamente pelo Sequelize na primeira execução (crie antes só o banco vazio: `CREATE DATABASE musicvibe;`).

Para ter um administrador, crie a conta pelo site e promova-a pelo terminal (não existe rota para isso, de propósito):

```bash
cd backend
node scripts/setAdmin.js <username>       # promove
node scripts/setAdmin.js <username> off   # rebaixa
```

## Próximos passos

- Paginação por cursor no lugar do offset (hoje, uma lista que muda entre uma página e a seguinte pode pular itens).
- Revisão de experiência de uso: skeletons, responsividade e acessibilidade do painel no celular.
- Testes automatizados versionados no repositório (Jest + Supertest na API, Vitest no front).
- Trocar `sequelize.sync({ alter: true })` por migrations.

## Autor

**Weslem Santos**, estudante de Engenharia de Software na Católica SC · [LinkedIn](https://www.linkedin.com/in/weslem-santos-083139212/)
