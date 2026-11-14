# MusicVibe

Plataforma web para publicar e ouvir música autoral. Artistas enviam faixas (áudio + capa), e quem ouve navega pelo feed, abre a faixa no player, curte, comenta e segue artistas.

Projeto full stack desenvolvido ao longo da disciplina de Programação Web na Católica SC, com uma entrega incremental por aula (Aula 02 a Aula 12). A versão publicada aqui é a da Aula 12.

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
- **Busca** de faixas e artistas pela API.

## Decisões técnicas

- **Módulos por funcionalidade** (`user`, `track`, `like`, `comment`, `follow`, `search`), cada um com `routes → controller → service → model`. O controller cuida só do HTTP, e a regra de negócio fica no service.
- **Transações no Sequelize:** quando o service grava o registro e atualiza um contador do autor (ex.: criar faixa + `tracksCount`), as duas escritas acontecem dentro de uma transação. Se uma falhar, nada fica gravado pela metade.
- **Limpeza de arquivos em caso de erro:** o `errorHandler` apaga os arquivos enviados por uma requisição que falhou, para não deixar arquivos órfãos no disco.
- **Paginação blindada:** `utils/pagination.js` normaliza `?page` e `?limit` (valores ausentes, inválidos, zero ou negativos voltam ao padrão) e aplica um teto (`MAX_LIMIT = 50`), evitando `LIMIT` negativo no MySQL e consultas da tabela inteira.
- **Respostas da API padronizadas:** todas seguem o formato `{ success, message, data, errors }`.
- **Front-end sem condição de corrida:** o composable `useAsyncData` numera cada requisição (`lastCallId`) e descarta respostas atrasadas. Assim, ao trocar rápido de perfil, a tela nunca mostra os dados do perfil anterior.
- **Feedback de erro no lugar certo:** ações (curtir, seguir, excluir) avisam por toast via interceptor do Axios, leituras mostram o erro na própria tela e formulários mostram o erro no campo.
- **Atualização otimista** em curtir e seguir: a interface responde na hora e desfaz a mudança se a API falhar.

Mais detalhes em [`docs/decisoes-aula-12.md`](docs/decisoes-aula-12.md).

## Estrutura

```
musicvibe/
├── backend/
│   ├── app.js              # middlewares globais, rotas e sync do banco
│   ├── bin/www             # sobe o servidor HTTP
│   ├── config/             # banco, JWT, associações entre models, constantes
│   ├── middlewares/        # auth, upload (multer), errorHandler, apiResponse
│   ├── modules/            # user, track, like, comment, follow, search
│   └── utils/              # paginação, limpeza de arquivos
├── frontend/
│   └── src/
│       ├── views/          # telas (feed, faixa, upload, perfil, ...)
│       ├── components/     # componentes de base e de domínio
│       ├── composables/    # useAsyncData, useToast, useAuth, usePaginatedList, ...
│       ├── services/       # chamadas à API (Axios)
│       ├── stores/         # Pinia (autenticação)
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
| GET | `/search` | Busca |

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

## Próximos passos

- Playlists, painel administrativo e tela de busca (as rotas do front-end já existem, mas as telas ainda são placeholders).
- Testes automatizados (Jest + Supertest na API).
- Trocar `sequelize.sync({ alter: true })` por migrations.

## Autor

**Weslem Santos**, estudante de Engenharia de Software na Católica SC · [LinkedIn](https://www.linkedin.com/in/weslem-santos-083139212/)
