<script setup>
import { useAuth } from '../../composables/useAuth'

// Todo link desta Sidebar aponta pra uma rota com meta.requiresAuth (ver
// router/index.js) -- por isso ela só faz sentido aparecer pra quem já está
// logado. Mostrá-la também deslogado só levaria a cliques que o guarda de
// rota barraria em seguida, redirecionando pro Login.
const { isAuthenticated } = useAuth()
</script>

<template>
  <aside v-if="isAuthenticated" class="sidebar">
    <router-link to="/feed"><i class="bi bi-collection-play"></i> Feed</router-link>
    <router-link to="/following"><i class="bi bi-people"></i> Seguindo</router-link>
    <router-link to="/liked"><i class="bi bi-heart"></i> Curtidas</router-link>
    <router-link to="/my-tracks"><i class="bi bi-music-note-list"></i> Minhas Faixas</router-link>
    <router-link to="/upload"><i class="bi bi-cloud-upload"></i> Enviar Faixa</router-link>
    <router-link to="/playlists"><i class="bi bi-list-ul"></i> Minhas Playlists</router-link>
    <router-link to="/profile"><i class="bi bi-person-circle"></i> Meu Perfil</router-link>
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

.sidebar a.router-link-active {
  color: var(--brand-color, #7c3aed);
  font-weight: 600;
}
</style>
