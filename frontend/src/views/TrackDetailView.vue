<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import CommentSection from '../components/CommentSection.vue'
import LikeButton from '../components/LikeButton.vue'
import AddToPlaylistModal from '../components/playlists/AddToPlaylistModal.vue'
import ReportTrackModal from '../components/reports/ReportTrackModal.vue'
import { useAuthenticatedAction } from '../composables/useAuthenticatedAction'
import { useAsyncData } from '../composables/useAsyncData'
import { useToast } from '../composables/useToast'
import { getTrackById } from '../services/trackService'
import { formatDate } from '../utils/format'
import { resolveAudioUrl, resolveCoverUrl, FALLBACK_COVER } from '../utils/media'

const route = useRoute()

// Carregamento da faixa. `watch`: o Vue Router reaproveita o MESMO componente
// quando só o :id muda (/tracks/1 -> /tracks/2); o composable recarrega nesses
// casos. 404 (faixa inexistente) e 400 (id mal formado) caem em `error`.
const { data: track, isLoading, error } = useAsyncData(() => getTrackById(route.params.id), {
  watch: () => route.params.id,
})

// Vem da API (true só quando o token enviado é do dono da faixa).
const isOwner = computed(() => track.value?.isOwner === true)

const authorName = computed(
  () => track.value?.author?.fullName || track.value?.author?.username || 'Artista desconhecido'
)

const uploadedAt = computed(() => (track.value ? formatDate(track.value.createdAt) : ''))

// O LikeButton cuida do próprio estado; aqui só espelhamos o resultado na
// faixa pra o resto da tela (ex.: os contadores) ficar coerente.
function handleLikeChange({ liked, count }) {
  track.value.isLiked = liked
  track.value.likesCount = count
}

// Um comentário novo foi publicado: sobe o contador sem recarregar a faixa
// (recarregar somaria mais uma visualização).
function handleCommentCreated() {
  track.value.commentsCount += 1
}

// AULA 13: botão "Salvar" (playlists). Aparece para TODO MUNDO; a cerca do
// useAuthenticatedAction leva o visitante ao login e o traz de volta a esta
// faixa. Para quem está logado, só abre o modal.
const isSaveOpen = ref(false)
const { run: openSave } = useAuthenticatedAction(() => {
  isSaveOpen.value = true
})

// AULA 14: "Denunciar". Só aparece para quem NÃO é o dono (v-if no template; a
// API também recusa com 400). Mesma cerca do "Salvar": visitante vai ao login e
// volta a esta faixa.
const toast = useToast()
const isReportOpen = ref(false)
const { run: openReport } = useAuthenticatedAction(() => {
  isReportOpen.value = true
})

function handleReported(response) {
  isReportOpen.value = false
  toast.success(response.message)
}

function handleCoverError(event) {
  event.target.src = FALLBACK_COVER
}
</script>

<template>
  <section class="detail-page">
    <p v-if="isLoading" class="detail-status">Carregando faixa...</p>

    <div v-else-if="error" class="detail-error">
      <i class="bi bi-exclamation-circle"></i>
      <p>{{ error }}</p>
      <router-link to="/feed">Voltar ao Feed</router-link>
    </div>

    <template v-else-if="track">
      <article class="detail">
        <img
          :src="resolveCoverUrl(track.cover)"
          :alt="`Capa de ${track.title}`"
          class="detail__cover"
          @error="handleCoverError"
        />

        <div class="detail__info">
          <h1 class="detail__title">{{ track.title }}</h1>

          <!-- Autor clicável: leva ao perfil público dele. -->
          <router-link
            v-if="track.author"
            :to="{ name: 'public-profile', params: { username: track.author.username } }"
            class="detail__author"
          >
            <i class="bi bi-person-circle"></i> {{ authorName }}
          </router-link>
          <p v-else class="detail__author"><i class="bi bi-person-circle"></i> {{ authorName }}</p>
          <p class="detail__meta">
            <span><i class="bi bi-play-fill"></i> {{ track.playsCount }} reproduções</span>
            <span><i class="bi bi-heart-fill"></i> {{ track.likesCount }} curtidas</span>
            <span><i class="bi bi-chat-dots-fill"></i> {{ track.commentsCount }} comentários</span>
            <span><i class="bi bi-calendar3"></i> {{ uploadedAt }}</span>
          </p>
          <p v-if="track.description" class="detail__description">{{ track.description }}</p>

          <div class="detail__actions">
            <!-- Visível para TODO MUNDO: o visitante também vê o coração; ao
                 clicar, é levado ao login e volta pra esta faixa. -->
            <LikeButton
              :track-id="track.id"
              :initial-liked="track.isLiked"
              :initial-count="track.likesCount"
              @change="handleLikeChange"
            />

            <button type="button" class="detail__save" @click="openSave()">
              <i class="bi bi-bookmark-plus"></i> Salvar
            </button>

            <!-- AULA 14: invisível para o dono (ninguém denuncia a própria faixa). -->
            <button v-if="!track.isOwner" type="button" class="detail__report" @click="openReport()">
              <i class="bi bi-flag"></i> Denunciar
            </button>

            <!-- Só o dono vê o botão. ATENÇÃO: isto é conforto de interface, NÃO
                 segurança. Esconder o botão não impede ninguém de chamar a rota
                 de edição na mão (URL, curl, DevTools): quem barra é o back-end,
                 com o 403 de PUT/DELETE /tracks/:id. -->
            <router-link
              v-if="isOwner"
              :to="{ name: 'track-edit', params: { id: track.id } }"
              class="detail__edit"
            >
              <i class="bi bi-pencil-square"></i> Editar
            </router-link>
          </div>
        </div>

        <!-- O src aponta pro arquivo ESTÁTICO (/uploads/tracks/...), nunca pra
             /api/tracks/:id/stream: uma tag <audio> não consegue mandar o
             cabeçalho Authorization, então a rota protegida seria inalcançável.
             Mesmo assim dá pra arrastar a barra: o express.static responde
             requisições Range com 206. -->
        <audio
          controls
          preload="metadata"
          class="audio-player"
          :src="resolveAudioUrl(track.audioFile)"
        >
          Seu navegador não suporta o player de áudio.
        </audio>
      </article>

      <CommentSection :track-id="track.id" @created="handleCommentCreated" />

      <!-- Interruptor v-if: o modal só existe enquanto está aberto, e cada abertura
           busca o estado atual das playlists. Fica DENTRO deste bloco, onde a faixa
           já está carregada (track.id existe). -->
      <AddToPlaylistModal v-if="isSaveOpen" v-model="isSaveOpen" :track-id="track.id" />

      <!-- AULA 14: mesmo interruptor v-if (cada abertura começa sem motivo marcado). -->
      <ReportTrackModal v-if="isReportOpen" v-model="isReportOpen" :track-id="track.id" @reported="handleReported" />
    </template>
  </section>
</template>

<style scoped>
.detail-page {
  max-width: 860px;
  margin: 0 auto;
}

.detail {
  display: grid;
  grid-template-columns: minmax(180px, 300px) 1fr;
  gap: 1.5rem 2rem;
  align-items: start;
  background: #fff;
  border-radius: 16px;
  padding: 1.75rem;
  border-top: 4px solid var(--brand-color, #7c3aed);
  box-shadow: 0 4px 24px rgba(20, 10, 40, 0.08);
}

.detail__cover {
  display: block;
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border-radius: 12px;
  background: #e5e0f7;
}

.detail__title {
  margin: 0 0 0.5rem;
  font-size: 1.7rem;
  line-height: 1.2;
}

.detail__author {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0 0 0.75rem;
  font-weight: 600;
  color: var(--brand-color, #7c3aed);
  text-decoration: none;
}

a.detail__author:hover {
  text-decoration: underline;
}

.detail__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 0.75rem;
  margin-top: 1rem;
}

.detail__save {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.45rem 1rem;
  border: 1px solid #d8d8e0;
  border-radius: 999px;
  background: #fff;
  color: #555;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.detail__save:hover {
  border-color: var(--brand-color, #7c3aed);
  color: var(--brand-color, #7c3aed);
}

.detail__report {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.45rem 1rem;
  border: 1px solid #d8d8e0;
  border-radius: 999px;
  background: #fff;
  color: #777;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.detail__report:hover {
  border-color: #d33;
  color: #d33;
}

.detail__edit {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 1rem;
  border: 1px solid var(--brand-color, #7c3aed);
  border-radius: 8px;
  color: var(--brand-color, #7c3aed);
  font-weight: 600;
  text-decoration: none;
}

.detail__edit:hover {
  background: #f6f3ff;
}

.detail__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin: 0 0 1rem;
  font-size: 0.9rem;
  color: #666;
}

.detail__meta span {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}

.detail__description {
  margin: 0;
  line-height: 1.55;
  white-space: pre-line;
}

/* O player ocupa a linha inteira embaixo da capa + informações. */
.audio-player {
  grid-column: 1 / -1;
  width: 100%;
}

.detail-status {
  color: #666;
}

.detail-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 3rem 1rem;
  text-align: center;
  color: #d33;
}

.detail-error i {
  font-size: 2.2rem;
}

.detail-error p {
  margin: 0;
}

@media (max-width: 700px) {
  .detail {
    grid-template-columns: 1fr;
  }
}
</style>
