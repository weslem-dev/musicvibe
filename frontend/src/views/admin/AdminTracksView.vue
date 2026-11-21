<script setup>
import { computed, ref } from 'vue'
import BaseButton from '../../components/base/BaseButton.vue'
import ConfirmModal from '../../components/base/ConfirmModal.vue'
import { useDebouncedValue } from '../../composables/useDebouncedValue'
import { usePaginatedList } from '../../composables/usePaginatedList'
import { useToast } from '../../composables/useToast'
import { SEARCH } from '../../config/constants'
import { deleteAdminTrack, getAdminTracks } from '../../services/adminService'
import { formatDate } from '../../utils/format'
import { FALLBACK_COVER, resolveCoverUrl } from '../../utils/media'

// ADICIONADO NA AULA 15. Faixas: busca por título e excluir (qualquer faixa).
//
// Alcançabilidade: aba "Faixas" do painel.
const toast = useToast()

const typedText = ref('')
const term = useDebouncedValue(typedText, SEARCH.DEBOUNCE_MS)

const { items, isLoading, error, hasMore, loadMore } = usePaginatedList(
  (page, limit) => getAdminTracks(term.value.trim(), page, limit),
  undefined,
  { watch: term }
)

// A faixa escolhida: o interruptor do modal E o dado dele (como o userToBlock).
const trackToDelete = ref(null)
const isDeleting = ref(false)

const deleteMessage = computed(() =>
  trackToDelete.value
    ? `Excluir "${trackToDelete.value.title}", de @${trackToDelete.value.author?.username}?\n\nSerão apagados também os arquivos de áudio e capa, as curtidas, os comentários, as denúncias e as notificações da faixa, e ela sai de todas as playlists. Não dá para desfazer.`
    : ''
)

function pendingLabel(count) {
  return count === 1 ? '1 denúncia pendente' : `${count} denúncias pendentes`
}

// ESPERA o servidor: a linha só sai da lista DEPOIS do sucesso. Se falhar, o modal
// continua aberto e o toast de erro vem do interceptor.
async function confirmDelete() {
  const target = trackToDelete.value
  if (!target || isDeleting.value) return

  isDeleting.value = true

  try {
    const response = await deleteAdminTrack(target.id)
    items.value = items.value.filter((track) => track.id !== target.id)
    toast.success(response.message)
    trackToDelete.value = null
  } catch {
    // Toast de erro do interceptor; o modal e a linha continuam.
  } finally {
    isDeleting.value = false
  }
}

function handleCoverError(event) {
  event.target.src = FALLBACK_COVER
}
</script>

<template>
  <div class="admin-tracks">
    <label class="admin-search">
      <i class="bi bi-search"></i>
      <input v-model="typedText" type="search" placeholder="Buscar faixa pelo título" aria-label="Buscar faixas" />
    </label>

    <p v-if="isLoading && !items.length" class="admin-status">Carregando faixas...</p>
    <p v-else-if="error && !items.length" class="admin-error" role="alert"><i class="bi bi-lock"></i> {{ error }}</p>

    <template v-else-if="items.length">
      <ul class="track-list">
        <li v-for="track in items" :key="track.id" class="track-row">
          <router-link :to="{ name: 'track-detail', params: { id: track.id } }" class="track-row__thumb">
            <img :src="resolveCoverUrl(track.cover)" :alt="`Capa de ${track.title}`" @error="handleCoverError" />
          </router-link>

          <div class="track-row__body">
            <router-link :to="{ name: 'track-detail', params: { id: track.id } }" class="track-row__title">{{ track.title }}</router-link>
            <span class="track-row__meta">de @{{ track.author?.username }} · {{ formatDate(track.createdAt) }}</span>
            <span class="track-row__meta">{{ track.playsCount }} reproduções · {{ track.likesCount }} curtidas · {{ track.commentsCount }} comentários</span>
            <span v-if="track.pendingReportsCount > 0" class="badge badge--reports">
              <i class="bi bi-flag-fill"></i> {{ pendingLabel(track.pendingReportsCount) }}
            </span>
          </div>

          <button type="button" class="row-action row-action--danger" @click="trackToDelete = track">
            <i class="bi bi-trash"></i> Excluir
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

    <p v-else class="admin-empty"><i class="bi bi-music-note"></i> Nenhuma faixa encontrada.</p>

    <ConfirmModal
      v-if="trackToDelete"
      title="Excluir faixa"
      :message="deleteMessage"
      confirm-label="Excluir faixa"
      :busy="isDeleting"
      @confirm="confirmDelete"
      @close="trackToDelete = null"
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

.track-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.track-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.8rem 1rem;
  border: 1px solid #ececf2;
  border-radius: 12px;
  background: #fff;
}

.track-row__thumb img {
  display: block;
  width: 64px;
  height: 64px;
  border-radius: 8px;
  object-fit: cover;
}

.track-row__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.15rem;
  min-width: 0;
}

.track-row__title {
  color: inherit;
  font-weight: 700;
  text-decoration: none;
  overflow-wrap: anywhere;
}

.track-row__title:hover {
  text-decoration: underline;
}

.track-row__meta {
  font-size: 0.85rem;
  color: #666;
}

.badge--reports {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  margin-top: 0.2rem;
  padding: 0.12rem 0.55rem;
  border-radius: 999px;
  background: #fdeef1;
  color: #c81e45;
  font-size: 0.75rem;
  font-weight: 700;
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
