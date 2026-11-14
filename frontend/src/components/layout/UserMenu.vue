<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../../composables/useAuth'
import { useClickOutside } from '../../composables/useClickOutside'
import { resolveProfilePicture, FALLBACK_AVATAR } from '../../utils/media'

// ADICIONADO NA AULA 09. Menu suspenso do avatar (Navbar), controlado por
// ESTADO: o dropdown só existe no DOM quando isOpen é true (v-if) -- nada de
// esconder/mostrar com CSS :hover.
const router = useRouter()
const { user, logout } = useAuth()

const isOpen = ref(false)
const menuRoot = ref(null)

const avatarUrl = computed(() => resolveProfilePicture(user.value?.profilePicture))
const displayName = computed(() => user.value?.fullName || user.value?.username || '')

function toggle() {
  isOpen.value = !isOpen.value
}

function close() {
  isOpen.value = false
}

// Fecha ao clicar fora: menuRoot engloba o botão E o dropdown, então clicar
// em qualquer um dos dois não conta como "fora".
useClickOutside(menuRoot, close)

// Fecha com Esc. O listener fica no document porque o foco pode estar em
// qualquer lugar da página quando a pessoa aperta Esc.
function handleKeydown(event) {
  if (event.key === 'Escape') close()
}

onMounted(() => document.addEventListener('keydown', handleKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', handleKeydown))

function handleImageError(event) {
  event.target.src = FALLBACK_AVATAR
}

async function handleLogout() {
  close()
  await logout()
  router.push({ name: 'landing' })
}
</script>

<template>
  <div ref="menuRoot" class="user-menu">
    <button
      type="button"
      class="user-menu__toggle"
      aria-haspopup="menu"
      :aria-expanded="isOpen"
      aria-label="Menu do usuário"
      @click="toggle"
    >
      <img :src="avatarUrl" alt="" class="user-menu__avatar" @error="handleImageError" />
      <i class="bi bi-chevron-down user-menu__chevron" :class="{ 'is-open': isOpen }"></i>
    </button>

    <!-- right: 0 alinha a borda DIREITA do dropdown com a do botão; como o
         avatar fica na ponta direita da Navbar, o menu abre pra esquerda e
         não estoura a tela. -->
    <ul v-if="isOpen" class="user-menu__dropdown" role="menu">
      <li class="user-menu__header">
        <strong>{{ displayName }}</strong>
        <span v-if="user?.username">@{{ user.username }}</span>
      </li>

      <li role="none">
        <router-link to="/profile" role="menuitem" @click="close">
          <i class="bi bi-pencil-square"></i> Editar Perfil
        </router-link>
      </li>
      <li role="none">
        <router-link
          v-if="user?.username"
          :to="{ name: 'public-profile', params: { username: user.username } }"
          role="menuitem"
          @click="close"
        >
          <i class="bi bi-person-circle"></i> Ver Perfil
        </router-link>
      </li>
      <li role="none">
        <router-link to="/my-tracks" role="menuitem" @click="close">
          <i class="bi bi-music-note-list"></i> Minhas Faixas
        </router-link>
      </li>
      <li role="none" class="user-menu__divider">
        <button type="button" role="menuitem" @click="handleLogout">
          <i class="bi bi-box-arrow-right"></i> Sair
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.user-menu {
  position: relative;
}

.user-menu__toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.15rem 0.35rem 0.15rem 0.15rem;
  border: 1px solid transparent;
  border-radius: 999px;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.user-menu__toggle:hover,
.user-menu__toggle[aria-expanded='true'] {
  background: #f0eef7;
}

.user-menu__avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  object-fit: cover;
  background: #e5e0f7;
  border: 2px solid var(--brand-color, #7c3aed);
}

.user-menu__chevron {
  font-size: 0.75rem;
  transition: transform 0.15s ease;
}

.user-menu__chevron.is-open {
  transform: rotate(180deg);
}

.user-menu__dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 50;
  min-width: 210px;
  margin: 0;
  padding: 0.4rem 0;
  list-style: none;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(20, 10, 40, 0.15);
}

.user-menu__header {
  display: flex;
  flex-direction: column;
  padding: 0.5rem 1rem 0.6rem;
  border-bottom: 1px solid #eee;
  font-size: 0.85rem;
  color: #666;
}

.user-menu__header strong {
  color: #1a1a1a;
  font-size: 0.95rem;
}

.user-menu__dropdown a,
.user-menu__dropdown button {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  box-sizing: border-box;
  padding: 0.55rem 1rem;
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
}

.user-menu__dropdown a:hover,
.user-menu__dropdown button:hover {
  background: #f6f3ff;
  color: var(--brand-color, #7c3aed);
}

.user-menu__divider {
  margin-top: 0.3rem;
  padding-top: 0.3rem;
  border-top: 1px solid #eee;
}
</style>
