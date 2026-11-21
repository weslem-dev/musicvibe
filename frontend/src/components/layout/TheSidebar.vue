<script setup>
import { useAuth } from '../../composables/useAuth'

// Todo link desta Sidebar aponta pra uma rota com meta.requiresAuth (ver
// router/index.js) -- por isso ela só faz sentido aparecer pra quem já está
// logado. Mostrá-la também deslogado só levaria a cliques que o guarda de
// rota barraria em seguida, redirecionando pro Login.
const { isAuthenticated, isAdmin } = useAuth()
</script>

<template>
  <aside v-if="isAuthenticated" class="sidebar">
    <router-link to="/feed"><i class="bi bi-collection-play"></i> Feed</router-link>
    <router-link to="/search"><i class="bi bi-search"></i> Explorar</router-link>
    <router-link to="/following"><i class="bi bi-people"></i> Seguindo</router-link>
    <router-link to="/liked"><i class="bi bi-heart"></i> Curtidas</router-link>
    <router-link to="/my-tracks"><i class="bi bi-music-note-list"></i> Minhas Faixas</router-link>
    <router-link to="/upload"><i class="bi bi-cloud-upload"></i> Enviar Faixa</router-link>
    <router-link to="/playlists"><i class="bi bi-collection"></i> Minhas Playlists</router-link>
    <router-link to="/profile"><i class="bi bi-person-circle"></i> Meu Perfil</router-link>

    <!-- AULA 15: seção Administração, só para quem tem o papel. Aponta para
         /admin, que redireciona para o Dashboard. Esconder é conforto: quem
         protege os dados é a API (403). -->
    <template v-if="isAdmin">
      <p class="sidebar__section">Administração</p>
      <router-link to="/admin"><i class="bi bi-shield-lock"></i> Painel</router-link>
    </template>
  </aside>
</template>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.5rem 1rem;
  width: 190px;
  border-right: 1px solid #e5e5e5;
}

.sidebar a {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: inherit;
  text-decoration: none;
}

.sidebar__section {
  margin: 0.75rem 0 0;
  padding-top: 0.75rem;
  border-top: 1px solid #e5e5e5;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #888;
}

.sidebar a.router-link-active {
  color: var(--brand-color, #7c3aed);
  font-weight: 600;
}
</style>
