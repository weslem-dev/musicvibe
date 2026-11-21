<script setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../../composables/useAuth'
import { useNotificationsStore } from '../../stores/notifications'
import UserMenu from './UserMenu.vue'

const { isAuthenticated } = useAuth()
const router = useRouter()

// AULA 14: o sino. A Navbar é quem LIGA e DESLIGA o polling, olhando o login:
// entrou na conta -> startPolling; saiu -> stopPolling. `immediate: true` cobre
// quem já abre a página logado (F5). O startPolling não liga um segundo
// temporizador se já houver um (logins e logouts repetidos = um só).
const notifications = useNotificationsStore()

const unreadCount = computed(() => notifications.unreadCount)
// O selo não estica com números grandes: acima de 99, mostra "99+".
const badgeText = computed(() => (unreadCount.value > 99 ? '99+' : String(unreadCount.value)))
const bellLabel = computed(() =>
  unreadCount.value > 0
    ? `Notificações (${unreadCount.value} ${unreadCount.value === 1 ? 'não lida' : 'não lidas'})`
    : 'Notificações'
)

watch(
  isAuthenticated,
  (loggedIn) => {
    if (loggedIn) notifications.startPolling()
    else notifications.stopPolling()
  },
  { immediate: true }
)

onUnmounted(() => notifications.stopPolling())

// AULA 13: barra de busca. Enter (ou a lupa) leva à tela de Busca já com o termo
// na URL; termo vazio é ignorado; o campo é limpo depois de buscar.
const searchText = ref('')

function submitSearch() {
  const q = searchText.value.trim()
  if (!q) return

  router.push({ name: 'search', query: { q } })
  searchText.value = ''
}
</script>

<template>
  <header class="navbar">
    <router-link to="/" class="navbar__brand">
      <i class="bi bi-music-note-beamed"></i> MusicVibe
    </router-link>
    <!-- Visível para todo mundo, inclusive visitante (a busca é pública). -->
    <form role="search" class="navbar__search" @submit.prevent="submitSearch">
      <input
        v-model="searchText"
        type="search"
        class="navbar__search-input"
        placeholder="Buscar faixas ou pessoas"
        aria-label="Buscar faixas ou pessoas"
      />
      <button type="submit" class="navbar__search-button" aria-label="Buscar">
        <i class="bi bi-search"></i>
      </button>
    </form>

    <nav class="navbar__links">

      <template v-if="isAuthenticated">
        <router-link to="/feed">Feed</router-link>
        <router-link to="/playlists">Playlists</router-link>
        <!-- AULA 14: o sino (só para quem está logado). O aria-label diz o número
             para quem usa leitor de tela; o selo só aparece com não lidas. -->
        <router-link :to="{ name: 'notifications' }" class="navbar__bell" :aria-label="bellLabel" :title="bellLabel">
          <i class="bi bi-bell"></i>
          <span v-if="unreadCount > 0" class="navbar__bell-badge" aria-hidden="true">{{ badgeText }}</span>
        </router-link>
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

.navbar__search {
  display: flex;
  align-items: center;
  flex: 1;
  max-width: 360px;
  margin: 0 1.5rem;
  border: 1px solid #d8d8e0;
  border-radius: 999px;
  background: #fff;
  overflow: hidden;
}

.navbar__search:focus-within {
  border-color: var(--brand-color, #7c3aed);
}

.navbar__search-input {
  flex: 1;
  min-width: 0;
  padding: 0.45rem 0.9rem;
  border: none;
  background: transparent;
  font: inherit;
  font-size: 0.9rem;
}

.navbar__search-input:focus {
  outline: none;
}

.navbar__search-button {
  display: inline-flex;
  padding: 0.45rem 0.85rem;
  border: none;
  background: transparent;
  color: #666;
  cursor: pointer;
}

.navbar__search-button:hover {
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

/* AULA 14: o sino com cara de botão. position: relative é a referência do selo. */
.navbar__links a.navbar__bell {
  position: relative;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border: 1px solid #d8d8e0;
  border-radius: 999px;
  background: #fff;
  font-size: 1.05rem;
}

.navbar__links a.navbar__bell:hover {
  border-color: var(--brand-color, #7c3aed);
  color: var(--brand-color, #7c3aed);
}

/* O selo no canto de cima, à direita (o mesmo que position-absolute top-0
   start-100 translate-middle do Bootstrap: o CENTRO do selo fica no canto). */
.navbar__bell-badge {
  position: absolute;
  top: 0;
  left: 100%;
  transform: translate(-50%, -50%);
  min-width: 1.25rem;
  padding: 0.1rem 0.35rem;
  border-radius: 999px;
  background: #e0245e;
  color: #fff;
  font-size: 0.7rem;
  font-weight: 700;
  line-height: 1.1;
  text-align: center;
}
</style>
