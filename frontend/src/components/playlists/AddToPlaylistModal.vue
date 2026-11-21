<script setup>
import { reactive } from 'vue'
import BaseModal from '../base/BaseModal.vue'
import { useAsyncData } from '../../composables/useAsyncData'
import { addTrackToPlaylist, getPlaylistsStatus, removeTrackFromPlaylist } from '../../services/playlistService'
import { runOptimistic } from '../../utils/optimistic'

// ADICIONADO NA AULA 13. Modal "Salvar": uma caixa por playlist minha, já
// marcada se a faixa está nela (hasTrack, vindo da API). Marcar/desmarcar é
// OTIMISTA, linha por linha: a caixa muda na hora e volta atrás se a API falhar
// (o toast de erro vem do interceptor).
const open = defineModel({ type: Boolean, default: false })

const props = defineProps({
  trackId: { type: [Number, String], required: true },
})

// O pai monta este modal com v-if, então cada abertura busca o estado ATUAL no
// servidor (depois de um F5, a caixa marcada continua marcada).
const { data: playlists, isLoading, error } = useAsyncData(() => getPlaylistsStatus(props.trackId), {
  initialData: [],
})

// A "cerca" é POR LINHA: um Set reativo com os ids das playlists que têm uma
// requisição em andamento. Enquanto o id está aqui, a caixa fica desabilitada e
// cliques nela são ignorados -- dois cliques rápidos na MESMA caixa geram uma
// requisição só, mas dá para marcar outra playlist ao mesmo tempo.
const pending = reactive(new Set())

function countLabel(count) {
  return count === 1 ? '1 faixa' : `${count} faixas`
}

function toggle(playlist) {
  if (pending.has(playlist.id)) return

  pending.add(playlist.id)

  // O estado de ANTES fica numa variável local: é ele que decide qual chamada
  // fazer (adicionar ou remover), mesmo depois de o apply já ter invertido a caixa.
  const wasInPlaylist = playlist.hasTrack

  runOptimistic({
    apply: () => {
      const previousCount = playlist.tracksCount

      playlist.hasTrack = !wasInPlaylist
      playlist.tracksCount = Math.max(0, previousCount + (wasInPlaylist ? -1 : 1))

      return () => {
        playlist.hasTrack = wasInPlaylist
        playlist.tracksCount = previousCount
      }
    },
    request: () =>
      wasInPlaylist
        ? removeTrackFromPlaylist(playlist.id, props.trackId)
        : addTrackToPlaylist(playlist.id, props.trackId),
    // A caixa já está certa (foi o que a pessoa pediu e a API aceitou); do servidor
    // só adotamos o CONTADOR, que pode ter mudado por outras ações.
    confirm: (data) => {
      playlist.tracksCount = data.tracksCount
    },
  }).finally(() => pending.delete(playlist.id))
}
</script>

<template>
  <BaseModal v-model="open" title="Salvar na playlist">
    <p v-if="isLoading" class="save-status">Carregando suas playlists...</p>
    <p v-else-if="error" class="save-error" role="alert">{{ error }}</p>

    <ul v-else-if="playlists.length" class="save-list">
      <li v-for="playlist in playlists" :key="playlist.id">
        <label class="save-row" :class="{ 'is-pending': pending.has(playlist.id) }">
          <!-- :checked é ligação SÓ DE IDA (o estado manda na caixa) e @change avisa
               o clique. Com v-model, a caixa mudaria o estado sozinha, antes da
               regra otimista decidir o que fazer (e o rollback não teria como voltar). -->
          <input
            type="checkbox"
            :checked="playlist.hasTrack"
            :disabled="pending.has(playlist.id)"
            @change="toggle(playlist)"
          />
          <span class="save-row__title">{{ playlist.title }}</span>
          <i v-if="!playlist.isPublic" class="bi bi-lock-fill save-row__lock" title="Privada"></i>
          <span class="save-row__count">{{ countLabel(playlist.tracksCount) }}</span>
        </label>
      </li>
    </ul>

    <div v-else class="save-empty">
      <p>Você ainda não tem nenhuma playlist.</p>
      <router-link :to="{ name: 'my-playlists' }" @click="open = false">Criar a primeira playlist</router-link>
    </div>
  </BaseModal>
</template>

<style scoped>
.save-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  max-height: 320px;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
}

.save-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.55rem 0.6rem;
  border-radius: 8px;
  cursor: pointer;
}

.save-row:hover {
  background: #f6f3ff;
}

.save-row input {
  flex-shrink: 0;
  width: 1.05rem;
  height: 1.05rem;
  accent-color: var(--brand-color, #7c3aed);
  cursor: pointer;
}

.save-row.is-pending {
  opacity: 0.7;
  cursor: progress;
}

.save-row__title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.save-row__lock {
  color: #888;
  font-size: 0.85rem;
}

.save-row__count {
  flex-shrink: 0;
  font-size: 0.82rem;
  color: #777;
}

.save-empty {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.4rem;
}

.save-empty p {
  margin: 0;
  color: #666;
}

.save-status {
  color: #666;
}

.save-error {
  color: #d33;
}
</style>
