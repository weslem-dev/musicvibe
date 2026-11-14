# Funcionalidades e Telas — MusicVibe

| Funcionalidade típica | Tela equivalente | Vale para o MusicVibe? |
|---|---|---|
| Landing / página inicial | `LandingView.vue` | Sim |
| Cadastro e autenticação | `auth/LoginView.vue`, `auth/RegisterView.vue` | Sim |
| Exploração do conteúdo por categoria (Feed) | `FeedView.vue` | Sim — feed "Seguindo" (lançamentos de artistas seguidos) e "Geral" (todas as faixas) |
| Upload/criação do conteúdo principal | `UploadView.vue` | Sim — upload de trechos de música em mp3 (artista/admin) |
| Detalhe de um item do conteúdo principal | `TrackDetailView.vue` | Sim — página da faixa, com player, avaliação e comentários |
| Edição de um item do conteúdo principal | — | Não nesta fase (edição de faixa fica para uma aula futura, se necessário) |
| "Meus itens" (conteúdo publicado pelo próprio usuário) | `MyTracksView.vue` | Sim — faixas enviadas pelo próprio usuário/artista |
| Perfil próprio / perfil público | `profile/MyProfileView.vue`, `profile/PublicProfileView.vue` | Sim — existe "seguir artistas" |
| Listas/favoritos personalizados | `playlists/MyPlaylistsView.vue`, `playlists/PlaylistDetailView.vue` | Sim — criação de playlists personalizadas |
| Busca | `SearchView.vue` | Sim |
| Notificações | — | Não nesta fase |
| Dashboard administrativo | `admin/AdminDashboardView.vue` | Sim — estatísticas de uso |
| Denúncias / moderação | — | Não nesta fase |
| Gerenciamento de usuários (admin) | `admin/AdminUsersView.vue` | Sim — controle de usuários e permissões |
| Gerenciamento do conteúdo principal (admin) | `admin/AdminTracksView.vue`, `admin/AdminGenresView.vue` | Sim — cadastro/gerenciamento de músicas e gêneros |
| Rota não encontrada | `NotFoundView.vue` | Sim |

## Ficha de preparação

| Dado | Seu valor |
|---|---|
| Nome do projeto | MusicVibe |
| Nome de pasta da API | `musicvibe-api` |
| Nome de pasta do frontend | `musicvibe-frontend` |
| Porta da API | 3000 |
| Entidade principal | Faixa (música) |
| Nome do campo de busca da entidade principal (plural, camelCase) | `tracks` |
| Nome do model da entidade principal (singular, PascalCase) | `Track` |
| Nome da tabela (plural, snake_case) | `tracks` |
| Grupo (A ou B) | A — arquivo de áudio + capa separada |
| Nome do campo do arquivo principal | `audioFile` |
| Nome do campo da capa | `cover` |
| Nome da coluna de contagem no User que foi incrementada na Aula 07 | `tracksCount` (já existia desde a Aula 03) |
