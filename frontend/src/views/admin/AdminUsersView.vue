<script setup>
import { computed, reactive, ref } from 'vue'
import BaseButton from '../../components/base/BaseButton.vue'
import ConfirmModal from '../../components/base/ConfirmModal.vue'
import { useAuth } from '../../composables/useAuth'
import { useDebouncedValue } from '../../composables/useDebouncedValue'
import { usePaginatedList } from '../../composables/usePaginatedList'
import { useToast } from '../../composables/useToast'
import { SEARCH } from '../../config/constants'
import { getAdminUsers, setUserBlocked } from '../../services/adminService'
import { formatDate } from '../../utils/format'
import { FALLBACK_AVATAR, resolveProfilePicture } from '../../utils/media'

// ADICIONADO NA AULA 15. Usuários: busca e bloquear/desbloquear.
//
// Alcançabilidade: aba "Usuários" do painel.
const toast = useToast()
const { user: currentUser } = useAuth()

// typedText muda a cada tecla; term só depois da pausa (debounce). A lista observa
// o TERM (e não o typedText): uma requisição depois que a pessoa para de digitar.
const typedText = ref('')
const term = useDebouncedValue(typedText, SEARCH.DEBOUNCE_MS)

const { items: users, isLoading, error, hasMore, loadMore } = usePaginatedList(
  (page, limit) => getAdminUsers(term.value.trim(), page, limit),
  undefined,
  { watch: term }
)

const busyIds = reactive(new Set())

// O interruptor do modal E o dado dele: a pessoa escolhida para bloquear.
const userToBlock = ref(null)
const blockMessage = computed(() =>
  userToBlock.value
    ? `Bloquear @${userToBlock.value.username}? A pessoa sai da conta na próxima ação e não consegue entrar de novo até ser desbloqueada. As faixas e o perfil dela continuam visíveis.`
    : ''
)

// ESPERA o servidor. Bloquear passa pelo modal; desbloquear é direto. O modal só
// fecha no SUCESSO: se a API recusar (ou sem rede), ele continua aberto e o toast
// de erro é do interceptor.
async function changeBlocked(user, isBlocked) {
  if (busyIds.has(user.id)) return

  busyIds.add(user.id)

  try {
    const response = await setUserBlocked(user.id, isBlocked)
    user.isBlocked = response.data.isBlocked
    toast.success(response.message)
    userToBlock.value = null
  } catch {
    // Toast de erro do interceptor; o estado da linha não muda.
  } finally {
    busyIds.delete(user.id)
  }
}

function handleAvatarError(event) {
  event.target.src = FALLBACK_AVATAR
}
</script>

<template>
  <div class="admin-users">
    <!-- O campo fica FORA do bloco de carregando: se sumisse a cada busca, perderia o foco. -->
    <label class="admin-search">
      <i class="bi bi-search"></i>
      <input v-model="typedText" type="search" placeholder="Buscar por usuário, e-mail ou nome" aria-label="Buscar usuários" />
    </label>

    <p v-if="isLoading && !users.length" class="admin-status">Carregando usuários...</p>
    <p v-else-if="error && !users.length" class="admin-error" role="alert"><i class="bi bi-lock"></i> {{ error }}</p>

    <template v-else-if="users.length">
      <ul class="user-list">
        <li v-for="user in users" :key="user.id" class="user-row">
          <img :src="resolveProfilePicture(user.profilePicture)" :alt="`Foto de ${user.username}`" class="user-row__avatar" @error="handleAvatarError" />

          <div class="user-row__body">
            <div class="user-row__name">
              <router-link :to="{ name: 'public-profile', params: { username: user.username } }">@{{ user.username }}</router-link>
              <span v-if="user.isAdmin" class="badge badge--admin">Admin</span>
              <span v-if="user.isBlocked" class="badge badge--blocked">Bloqueado</span>
            </div>
            <span class="user-row__meta">{{ user.fullName }} · {{ user.email }}</span>
            <span class="user-row__meta">{{ user.tracksCount }} faixas · desde {{ formatDate(user.createdAt) }}</span>
          </div>

          <span v-if="user.id === currentUser?.id" class="user-row__note">Você</span>
          <span v-else-if="user.isAdmin" class="user-row__note">Administrador</span>
          <button
            v-else-if="user.isBlocked"
            type="button"
            class="row-action"
            :disabled="busyIds.has(user.id)"
            @click="changeBlocked(user, false)"
          >
            <i class="bi bi-unlock"></i> {{ busyIds.has(user.id) ? 'Salvando...' : 'Desbloquear' }}
          </button>
          <button
            v-else
            type="button"
            class="row-action row-action--danger"
            :disabled="busyIds.has(user.id)"
            @click="userToBlock = user"
          >
            <i class="bi bi-slash-circle"></i> Bloquear
          </button>
        </li>
      </ul>

      <p v-if="error" class="admin-error" role="alert">{{ error }}</p>

      <div v-if="hasMore" class="admin-more">
        <BaseButton variant="secondary" icon="bi-arrow-down-circle" :disabled="isLoading" @click="loadMore">
          {{ isLoading ? 'Carregando...' : 'Carregar mais' }}
        </BaseButton>
      </div>
    </template>

    <p v-else class="admin-empty"><i class="bi bi-person-x"></i> Nenhum usuário encontrado.</p>

    <ConfirmModal
      v-if="userToBlock"
      title="Bloquear usuário"
      :message="blockMessage"
      confirm-label="Bloquear"
      :busy="busyIds.has(userToBlock.id)"
      @confirm="changeBlocked(userToBlock, true)"
      @close="userToBlock = null"
    />
  </div>
</template>

<style scoped>
.admin-search {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  max-width: 420px;
  margin-bottom: 1rem;
  padding: 0.5rem 0.9rem;
  border: 1px solid #d8d8e0;
  border-radius: 999px;
  background: #fff;
  color: #777;
}

.admin-search:focus-within {
  border-color: var(--brand-color, #7c3aed);
}

.admin-search input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  font: inherit;
}

.admin-search input:focus {
  outline: none;
}

.user-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.user-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.8rem 1rem;
  border: 1px solid #ececf2;
  border-radius: 12px;
  background: #fff;
}

.user-row__avatar {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.user-row__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.user-row__name {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  font-weight: 700;
}

.user-row__name a {
  color: var(--brand-color, #7c3aed);
  text-decoration: none;
}

.user-row__meta {
  font-size: 0.85rem;
  color: #666;
  overflow-wrap: anywhere;
}

.user-row__note {
  flex-shrink: 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: #888;
}

.badge {
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
}

.badge--admin {
  background: #f0ebff;
  color: var(--brand-color, #7c3aed);
}

.badge--blocked {
  background: #fdeef1;
  color: #c81e45;
}

.row-action {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 0.3rem;
  padding: 0.4rem 0.8rem;
  border: 1px solid var(--brand-color, #7c3aed);
  border-radius: 8px;
  background: #fff;
  color: var(--brand-color, #7c3aed);
  font: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}

.row-action--danger {
  border-color: #d33;
  color: #d33;
}

.row-action:disabled {
  opacity: 0.65;
  cursor: progress;
}

.admin-more {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}

.admin-status,
.admin-empty {
  color: #666;
}

.admin-empty {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.admin-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.2rem;
  border-radius: 12px;
  background: #fdeef1;
  color: #c81e45;
  font-weight: 600;
}
</style>
