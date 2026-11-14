import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '../composables/useAuth'

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
  { path: '/playlists/:id', name: 'playlist-detail', component: () => import('../views/playlists/PlaylistDetailView.vue'), meta: { requiresAuth: true } },

  { path: '/admin', name: 'admin-dashboard', component: () => import('../views/admin/AdminDashboardView.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/admin/users', name: 'admin-users', component: () => import('../views/admin/AdminUsersView.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/admin/tracks', name: 'admin-tracks', component: () => import('../views/admin/AdminTracksView.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/admin/genres', name: 'admin-genres', component: () => import('../views/admin/AdminGenresView.vue'), meta: { requiresAuth: true, requiresAdmin: true } },

  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('../views/NotFoundView.vue') }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  // useAuth() é chamado AQUI DENTRO, no callback, e não no topo do arquivo:
  // no topo, o Pinia ainda não foi registrado (app.use(pinia) em main.js
  // ainda não rodou) quando este módulo é importado pela primeira vez.
  const { isAuthenticated, isAdmin } = useAuth()

  if (to.meta.requiresAuth && !isAuthenticated.value) {
    return next({ name: 'login', query: { redirect: to.fullPath } })
  }

  if (to.meta.requiresAdmin && !isAdmin.value) {
    return next({ name: 'landing' })
  }

  return next()
})

export default router
