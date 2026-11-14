<script setup>
import { useAuth } from '../../composables/useAuth'
import UserMenu from './UserMenu.vue'

const { isAuthenticated } = useAuth()
</script>

<template>
  <header class="navbar">
    <router-link to="/" class="navbar__brand">
      <i class="bi bi-music-note-beamed"></i> MusicVibe
    </router-link>
    <nav class="navbar__links">
      <router-link to="/search">Buscar</router-link>

      <template v-if="isAuthenticated">
        <router-link to="/feed">Feed</router-link>
        <router-link to="/playlists">Playlists</router-link>
        <!-- Aula 09: "Meu Perfil" e "Sair" saíram da barra e foram pro menu do avatar -->
        <UserMenu />
      </template>
      <template v-else>
        <router-link to="/login">Entrar</router-link>
        <router-link to="/register">Criar Conta</router-link>
      </template>
    </nav>
  </header>
</template>

<style scoped>
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e5e5;
}

.navbar__brand {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 700;
  text-decoration: none;
  color: var(--brand-color, #7c3aed);
}

.navbar__links {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.navbar__links a {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: inherit;
  text-decoration: none;
}

.navbar__links a.router-link-active {
  color: var(--brand-color, #7c3aed);
  font-weight: 600;
}
</style>
