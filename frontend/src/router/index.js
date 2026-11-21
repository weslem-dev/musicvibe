import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useToast } from '../composables/useToast' // AULA 15
import AdminLayout from '../components/layout/AdminLayout.vue' // AULA 15

const routes = [
  { path: '/', name: 'landing', component: () => import('../views/LandingView.vue') },
  { path: '/login', name: 'login', component: () => import('../views/auth/LoginView.vue') },
  { path: '/register', name: 'register', component: () => import('../views/auth/RegisterView.vue') },

  { path: '/feed', name: 'feed', component: () => import('../views/FeedView.vue'), meta: { requiresAuth: true } },
  { path: '/following', name: 'following-feed', component: () => import('../views/FollowingFeedView.vue'), meta: { requiresAuth: true } },
  { path: '/search', name: 'search', component: () => import('../views/SearchView.vue') },

  { path: '/tracks/:id', name: 'track-detail', component: () => import('../views/TrackDetailView.vue') },
  { path: '/tracks/:id/edit', name: 'track-edit', component: () => import('../views/EditTrackView.vue'), meta: { requiresAuth: true } },
  { path: '/upload', name: 'upload', component: () => import('../views/UploadView.vue'), meta: { requiresAuth: true } },
  { path: '/liked', name: 'liked-tracks', component: () => import('../views/LikedTracksView.vue'), meta: { requiresAuth: true } },
  { path: '/my-tracks', name: 'my-tracks', component: () => import('../views/MyTracksView.vue'), meta: { requiresAuth: true } },

  { path: '/profile', name: 'my-profile', component: () => import('../views/profile/MyProfileView.vue'), meta: { requiresAuth: true } },
  { path: '/profile/:username', name: 'public-profile', component: () => import('../views/profile/PublicProfileView.vue') },
  // Aula 11: UMA tela (FollowListView) para as DUAS listas; a prop `kind`, definida aqui
  // em cada rota, diz qual das duas mostrar. Públicas (qualquer pessoa vê as listas).
  { path: '/profile/:username/followers', name: 'follow-followers', component: () => import('../views/profile/FollowListView.vue'), props: { kind: 'followers' } },
  { path: '/profile/:username/following', name: 'follow-following', component: () => import('../views/profile/FollowListView.vue'), props: { kind: 'following' } },

  { path: '/playlists', name: 'my-playlists', component: () => import('../views/playlists/MyPlaylistsView.vue'), meta: { requiresAuth: true } },
  // Aula 13: o detalhe da playlist é PÚBLICO (sem requiresAuth): a playlist pública
  // abre para qualquer pessoa por link; a privada, a própria API recusa (403).
  { path: '/playlists/:id', name: 'playlist-detail', component: () => import('../views/playlists/PlaylistDetailView.vue') },

  // AULA 14: notificações (só logado). O nome 'notifications' é o que o sino usa.
  { path: '/notifications', name: 'notifications', component: () => import('../views/NotificationsView.vue'), meta: { requiresAuth: true } },

  // AULA 15: as quatro rotas planas viraram UMA rota pai com quatro filhas. O pai
  // tem o layout (as abas), o redirect (/admin -> Dashboard) e a meta: as filhas
  // herdam o requiresAuth/requiresAdmin (o beforeEach lê to.meta, que junta a
  // meta do pai com a da filha). Paths das filhas são RELATIVOS (sem barra).
  // A tela placeholder de gêneros (AdminGenresView) saiu: o MusicVibe não tem
  // gêneros, e a quarta aba do painel é a de Denúncias.
  {
    path: '/admin',
    component: AdminLayout,
    redirect: { name: 'admin-dashboard' },
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      { path: 'dashboard', name: 'admin-dashboard', component: () => import('../views/admin/AdminDashboardView.vue') },
      { path: 'reports', name: 'admin-reports', component: () => import('../views/admin/AdminReportsView.vue') },
      { path: 'users', name: 'admin-users', component: () => import('../views/admin/AdminUsersView.vue') },
      { path: 'tracks', name: 'admin-tracks', component: () => import('../views/admin/AdminTracksView.vue') },
    ],
  },

  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('../views/NotFoundView.vue') }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// AULA 15: a guarda passou a usar o RETORNO (sem `next`): devolver uma rota
// redireciona; não devolver nada deixa passar.
router.beforeEach((to) => {
  // useAuth() é chamado AQUI DENTRO, no callback, e não no topo do arquivo:
  // no topo, o Pinia ainda não foi registrado (app.use(pinia) em main.js
  // ainda não rodou) quando este módulo é importado pela primeira vez.
  const { isAuthenticated, user: currentUser } = useAuth()

  // 1) Visitante numa rota que exige login -> Login (e volta depois).
  if (to.meta.requiresAuth && !isAuthenticated.value) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  // 2) AULA 15: logado, mas sem o PAPEL de administrador -> Feed, com aviso.
  //
  // ATENÇÃO: isto é CONFORTO de interface, não segurança. O isAdmin aqui vem do
  // localStorage, que a própria pessoa pode editar ("isAdmin": true). Quem
  // protege os DADOS é a API: o router.use('/admin', isAuthenticated, isAdmin)
  // lê o papel do BANCO e responde 403 para quem não é administrador.
  if (to.meta.requiresAdmin && !currentUser.value?.isAdmin) {
    useToast().error('Você não tem permissão para acessar a administração.')
    return { name: 'feed' }
  }

  return true
})

export default router
