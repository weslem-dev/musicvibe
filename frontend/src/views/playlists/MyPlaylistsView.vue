<script setup>
import { ref } from 'vue'
import BaseButton from '../../components/base/BaseButton.vue'
import BaseModal from '../../components/base/BaseModal.vue'
import CreatePlaylistModal from '../../components/playlists/CreatePlaylistModal.vue'
import { useAsyncData } from '../../composables/useAsyncData'
import { useToast } from '../../composables/useToast'
import { deletePlaylist, getMyPlaylists } from '../../services/playlistService'

// ADICIONADO NA AULA 13. "Minhas Playlists": lista, criar (modal) e excluir
// (confirmação).
//
// Alcançabilidade (ADR-012): esta tela abre pelo item "Minhas Playlists" da
// Sidebar, pelo item do menu do avatar e pelo link "Playlists" da Navbar.
const toast = useToast()

const { data: playlists, isLoading, error } = useAsyncData(() => getMyPlaylists(), { initialData: [] })

// Dois controles de modal, um para cada ação.
const isCreating = ref(false)
const playlistToDelete = ref(null)
const isDeleting = ref(false)

// A playlist nova entra NO TOPO (a lista é da mais nova para a mais antiga), num
// array novo, sem pedir a lista inteira de novo ao servidor.
function handleCreated(playlist) {
  playlists.value = [playlist, ...playlists.value]
  toast.success('Playlist criada.')
}

// Excluir ESPERA a API (não é otimista): a exclusão é irreversível, e a lista só
// muda depois da confirmação. Se falhar, o modal continua aberto e o toast de
// erro vem do interceptor.
async function confirmDelete() {
  const target = playlistToDelete.value
  if (!target) return

  isDeleting.value = true

  try {
    const response = await deletePlaylist(target.id)
    playlists.value = playlists.value.filter((playlist) => playlist.id !== target.id)
    playlistToDelete.value = null
    toast.success(response.message)
  } catch {
    // O toast de erro já foi mostrado pelo interceptor; o modal fica aberto.
  } finally {
    isDeleting.value = false
  }
}

function countLabel(count) {
  return count === 1 ? '1 faixa' : `${count} faixas`
}
</script>

<template>
  <section class="my-playlists">
    <header class="my-playlists__header">
      <div>
        <h1><i class="bi bi-collection"></i> Minhas Playlists</h1>
        <p>Organize as faixas que você quer ouvir de novo.</p>
      </div>
      <BaseButton icon="bi-plus-lg" class="my-playlists__new" @click="isCreating = true">Nova playlist</BaseButton>
    </header>

    <p v-if="isLoading" class="my-playlists__status">Carregando suas playlists...</p>
    <p v-else-if="error" class="my-playlists__error" role="alert">{{ error }}</p>

    <div v-else-if="playlists.length" class="playlist-grid">
      <article v-for="playlist in playlists" :key="playlist.id" class="playlist-card">
        <div class="playlist-card__icon"><i class="bi bi-music-note-list"></i></div>

        <div class="playlist-card__body">
          <h2 class="playlist-card__title">
            <!-- "Link esticado": o ::after deste link cobre o cartão inteiro, então
                 clicar em qualquer ponto abre o detalhe (ver o CSS). -->
            <router-link :to="{ name: 'playlist-detail', params: { id: playlist.id } }" class="playlist-card__link">
              {{ playlist.title }}
            </router-link>
          </h2>

          <div class="playlist-card__meta">
            <span class="badge" :class="playlist.isPublic ? 'badge--public' : 'badge--private'">
              <i class="bi" :class="playlist.isPublic ? 'bi-globe2' : 'bi-lock-fill'"></i>
              {{ playlist.isPublic ? 'Pública' : 'Privada' }}
            </span>
            <span class="playlist-card__count">{{ countLabel(playlist.tracksCount) }}</span>
          </div>

          <p v-if="playlist.description" class="playlist-card__description">{{ playlist.description }}</p>
        </div>

        <!-- O botão fica POR CIMA do link esticado (position: relative + z-index):
             o clique exclui, e não abre o detalhe. -->
        <button type="button" class="playlist-card__delete" title="Excluir playlist" @click="playlistToDelete = playlist">
          <i class="bi bi-trash"></i> Excluir
        </button>
      </article>
    </div>

    <div v-else class="my-playlists__empty">
      <i class="bi bi-collection"></i>
      <p>Você ainda não tem playlists.</p>
      <p class="my-playlists__hint">
        Crie a primeira no botão <strong>Nova playlist</strong> e, no detalhe de qualquer faixa, use
        <strong>Salvar</strong> para colocá-la aqui.
      </p>
    </div>

    <CreatePlaylistModal v-model="isCreating" @created="handleCreated" />

    <BaseModal
      :model-value="playlistToDelete !== null"
      title="Excluir playlist"
      :busy="isDeleting"
      @update:model-value="(value) => { if (!value) playlistToDelete = null }"
    >
      <p>
        Tem certeza que deseja excluir <strong>{{ playlistToDelete?.title }}</strong>?
        As faixas continuam existindo; só a playlist é apagada.
      </p>

      <template #footer>
        <BaseButton variant="secondary" :disabled="isDeleting" @click="playlistToDelete = null">Cancelar</BaseButton>
        <BaseButton variant="danger" :disabled="isDeleting" @click="confirmDelete">
          {{ isDeleting ? 'Excluindo...' : 'Excluir' }}
        </BaseButton>
      </template>
    </BaseModal>
  </section>
</template>

<style scoped>
.my-playlists__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.my-playlists__header h1 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.25rem;
  font-size: 1.5rem;
}

.my-playlists__header h1 i {
  color: var(--brand-color, #7c3aed);
}

.my-playlists__header p {
  margin: 0;
  color: #666;
}

.my-playlists__new {
  width: auto;
  flex-shrink: 0;
}

.playlist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}

.playlist-card {
  position: relative; /* referência do ::after do link esticado */
  display: flex;
  gap: 0.9rem;
  padding: 1rem;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(20, 10, 40, 0.08);
  transition: box-shadow 0.15s ease, transform 0.15s ease;
}

.playlist-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(20, 10, 40, 0.14);
}

.playlist-card__icon {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 10px;
  background: #f0ebff;
  color: var(--brand-color, #7c3aed);
  font-size: 1.4rem;
}

.playlist-card__body {
  flex: 1;
  min-width: 0;
}

.playlist-card__title {
  margin: 0 0 0.35rem;
  font-size: 1.05rem;
  overflow-wrap: anywhere;
}

.playlist-card__link {
  color: inherit;
  text-decoration: none;
}

/* Link esticado: camada transparente sobre o cartão inteiro. */
.playlist-card__link::after {
  content: '';
  position: absolute;
  inset: 0;
}

.playlist-card__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.85rem;
  color: #666;
}

.playlist-card__description {
  margin: 0.4rem 0 0;
  font-size: 0.88rem;
  color: #555;
  overflow-wrap: anywhere;
}

.playlist-card__delete {
  position: relative; /* acima do ::after do link */
  z-index: 1;
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.35rem 0.6rem;
  border: 1px solid #d33;
  border-radius: 8px;
  background: #fff;
  color: #d33;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}

.playlist-card__delete:hover {
  background: #fdf0f0;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
}

.badge--public {
  background: #e7f6ec;
  color: #2a8f4d;
}

.badge--private {
  background: #f1f0f5;
  color: #555;
}

.my-playlists__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  padding: 3rem 1rem;
  text-align: center;
  color: #666;
}

.my-playlists__empty i {
  font-size: 2.4rem;
  color: #b8a8ec;
}

.my-playlists__empty p {
  margin: 0;
}

.my-playlists__hint {
  max-width: 420px;
  font-size: 0.9rem;
}

.my-playlists__status {
  color: #666;
}

.my-playlists__error {
  color: #d33;
}

@media (max-width: 600px) {
  .my-playlists__header {
    flex-direction: column;
  }
}
</style>
