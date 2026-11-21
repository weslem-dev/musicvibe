<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import TrackCard from '../../components/TrackCard.vue'
import { useAsyncData } from '../../composables/useAsyncData'
import { useAuth } from '../../composables/useAuth'
import { useToast } from '../../composables/useToast'
import { getPlaylistById, removeTrackFromPlaylist } from '../../services/playlistService'

// ADICIONADO NA AULA 13. Detalhe de uma playlist.
// Rota PÚBLICA: a playlist pública abre para qualquer pessoa (inclusive
// visitante, por link); a privada só para a dona -- os outros veem a mensagem da
// API (403), e um id que não existe mostra "não encontrada" (404). Os dois erros
// aparecem NO LUGAR do conteúdo, sem toast (é uma leitura).
const route = useRoute()
const toast = useToast()
const { isAuthenticated } = useAuth()

const { data: playlist, isLoading, error } = useAsyncData(() => getPlaylistById(route.params.id), {
  watch: () => route.params.id,
})

const isOwner = computed(() => playlist.value?.isOwner === true)
const ownerName = computed(() => playlist.value?.owner?.fullName || playlist.value?.owner?.username || '')
const countLabel = computed(() => {
  const count = playlist.value?.tracksCount ?? 0
  return count === 1 ? '1 faixa' : `${count} faixas`
})

// "Remover da playlist" é PESSIMISTA: espera a API e só depois tira o card da
// tela, usando o contador que a API devolveu. Se falhar, o card fica onde está e o
// toast de erro vem do interceptor.
const removingId = ref(null)

async function removeTrack(track) {
  if (removingId.value) return

  removingId.value = track.id

  try {
    const response = await removeTrackFromPlaylist(playlist.value.id, track.id)
    playlist.value.tracks = playlist.value.tracks.filter((item) => item.id !== track.id)
    playlist.value.tracksCount = response.data.tracksCount
    toast.success(response.message)
  } catch {
    // Toast de erro já mostrado pelo interceptor; o card continua.
  } finally {
    removingId.value = null
  }
}
</script>

<template>
  <section class="playlist-detail">
    <p v-if="isLoading" class="playlist-detail__status">Carregando playlist...</p>

    <div v-else-if="error" class="playlist-detail__error">
      <i class="bi bi-lock"></i>
      <p>{{ error }}</p>
      <router-link v-if="isAuthenticated" :to="{ name: 'my-playlists' }">Ir para Minhas Playlists</router-link>
      <router-link v-else to="/">Ir para o início</router-link>
    </div>

    <template v-else-if="playlist">
      <header class="playlist-detail__header">
        <div class="playlist-detail__icon"><i class="bi bi-music-note-list"></i></div>

        <div class="playlist-detail__info">
          <span class="badge" :class="playlist.isPublic ? 'badge--public' : 'badge--private'">
            <i class="bi" :class="playlist.isPublic ? 'bi-globe2' : 'bi-lock-fill'"></i>
            {{ playlist.isPublic ? 'Pública' : 'Privada' }}
          </span>
          <h1>{{ playlist.title }}</h1>
          <p v-if="playlist.description" class="playlist-detail__description">{{ playlist.description }}</p>
          <p class="playlist-detail__meta">
            <span v-if="playlist.owner">
              de
              <router-link :to="{ name: 'public-profile', params: { username: playlist.owner.username } }">
                {{ ownerName }}
              </router-link>
            </span>
            <span>· {{ countLabel }}</span>
          </p>
        </div>
      </header>

      <div v-if="playlist.tracks.length" class="track-grid">
        <TrackCard v-for="track in playlist.tracks" :key="track.id" :track="track">
          <!-- Só a dona remove. Esconder o botão é conforto de interface; quem
               garante é a API (403 para quem não é a dona). -->
          <template v-if="isOwner" #actions>
            <button
              type="button"
              class="remove-action"
              :disabled="removingId === track.id"
              @click="removeTrack(track)"
            >
              <i class="bi bi-dash-circle"></i>
              {{ removingId === track.id ? 'Removendo...' : 'Remover da playlist' }}
            </button>
          </template>
        </TrackCard>
      </div>

      <div v-else class="playlist-detail__empty">
        <i class="bi bi-music-note-beamed"></i>
        <p v-if="isOwner">
          Sua playlist ainda está vazia. Abra uma faixa e use o botão <strong>Salvar</strong> para adicioná-la aqui.
        </p>
        <p v-else>Esta playlist ainda não tem faixas.</p>
      </div>
    </template>
  </section>
</template>

<style scoped>
.playlist-detail__header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1.75rem;
  padding: 1.5rem;
  background: #fff;
  border-radius: 16px;
  border-top: 4px solid var(--brand-color, #7c3aed);
  box-shadow: 0 4px 24px rgba(20, 10, 40, 0.08);
}

.playlist-detail__icon {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 96px;
  height: 96px;
  border-radius: 16px;
  background: #f0ebff;
  color: var(--brand-color, #7c3aed);
  font-size: 2.6rem;
}

.playlist-detail__info {
  min-width: 0;
}

.playlist-detail__info h1 {
  margin: 0.4rem 0 0.3rem;
  font-size: 1.6rem;
  overflow-wrap: anywhere;
}

.playlist-detail__description {
  margin: 0 0 0.4rem;
  color: #444;
  overflow-wrap: anywhere;
}

.playlist-detail__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin: 0;
  font-size: 0.9rem;
  color: #666;
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

.remove-action {
  display: inline-flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.4rem 0.5rem;
  border: 1px solid #d33;
  border-radius: 8px;
  background: transparent;
  color: #d33;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}

.remove-action:hover:not(:disabled) {
  background: #fdf0f0;
}

.remove-action:disabled {
  opacity: 0.6;
  cursor: progress;
}

.playlist-detail__empty,
.playlist-detail__error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 3rem 1rem;
  text-align: center;
  color: #666;
}

.playlist-detail__empty i,
.playlist-detail__error i {
  font-size: 2.4rem;
  color: #b8a8ec;
}

.playlist-detail__empty p,
.playlist-detail__error p {
  max-width: 440px;
  margin: 0;
}

.playlist-detail__status {
  color: #666;
}

@media (max-width: 600px) {
  .playlist-detail__header {
    flex-direction: column;
    text-align: center;
  }

  .playlist-detail__meta {
    justify-content: center;
  }
}
</style>
