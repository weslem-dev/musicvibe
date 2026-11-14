<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import BaseButton from './base/BaseButton.vue'
import { LIMITS } from '../config/constants'
import { useAsyncData } from '../composables/useAsyncData'
import { useAuth } from '../composables/useAuth'
import { createComment, getComments } from '../services/commentService'
import { FALLBACK_AVATAR, resolveProfilePicture } from '../utils/media'
import { formatDateTime, formatRelativeTime } from '../utils/format'

// ADICIONADO NA AULA 10. Seção de comentários da tela de Detalhe.

const props = defineProps({
  trackId: { type: [Number, String], required: true },
})

// Avisa o pai (Detalhe) que um comentário foi criado, pra ele atualizar o
// contador da faixa sem recarregar nada.
const emit = defineEmits(['created'])

const route = useRoute()
const { isAuthenticated } = useAuth()

// Lista de comentários (leitura): carregando/erro/dados ficam por conta do
// composable. Se a tela de Detalhe trocar de faixa sem remontar a seção, o
// `watch` recarrega.
const { data: comments, isLoading, error } = useAsyncData(() => getComments(props.trackId), {
  watch: () => props.trackId,
  initialData: [],
})

const content = ref('')
const formError = ref('')
const isSubmitting = ref(false)

const trimmedLength = computed(() => content.value.trim().length)

// Trocar de faixa limpa o que estava sendo digitado.
watch(
  () => props.trackId,
  () => {
    content.value = ''
    formError.value = ''
  }
)

// Validação do CLIENTE (limites em config/constants.js): se falhar, a API nem é chamada.
function validate() {
  if (trimmedLength.value === 0) {
    formError.value = 'Escreva algo antes de enviar o comentário.'
    return false
  }

  if (trimmedLength.value > LIMITS.COMMENT_MAX) {
    formError.value = `O comentário deve ter no máximo ${LIMITS.COMMENT_MAX} caracteres.`
    return false
  }

  return true
}

async function handleSubmit() {
  formError.value = ''

  if (!validate()) return

  isSubmitting.value = true

  try {
    const response = await createComment(props.trackId, content.value.trim())

    // O comentário novo entra NO TOPO da lista que já está na tela (a API
    // ordena do mais novo pro mais antigo, então é coerente), sem recarregar
    // a lista inteira do servidor. Ele já vem com o autor.
    comments.value.unshift(response.data)
    content.value = ''
    emit('created', response.data)
  } catch {
    // Falha da API: o aviso é o TOAST do interceptor (comentar é uma ação). O que
    // a pessoa digitou continua na caixa, pra tentar de novo. `formError` fica só
    // para a validação do cliente acima (evita dois avisos para o mesmo erro).
  } finally {
    isSubmitting.value = false
  }
}

function handleAvatarError(event) {
  event.target.src = FALLBACK_AVATAR
}

function authorName(comment) {
  return comment.author?.fullName || comment.author?.username || 'Usuário'
}
</script>

<template>
  <section class="comments" aria-labelledby="comments-title">
    <h2 id="comments-title" class="comments__title">
      <i class="bi bi-chat-dots"></i> Comentários
      <span class="comments__count">({{ comments.length }})</span>
    </h2>

    <!-- Formulário SÓ para quem está logado. Visitante lê, mas não escreve. -->
    <form v-if="isAuthenticated" class="comments__form" novalidate @submit.prevent="handleSubmit">
      <label for="comment-text" class="comments__label">Escreva um comentário</label>
      <textarea
        id="comment-text"
        v-model="content"
        class="comments__textarea"
        rows="3"
        placeholder="O que você achou desta faixa?"
        :disabled="isSubmitting"
      ></textarea>

      <div class="comments__form-footer">
        <span class="comments__counter" :class="{ 'is-over': trimmedLength > LIMITS.COMMENT_MAX }">
          {{ trimmedLength }}/{{ LIMITS.COMMENT_MAX }}
        </span>
        <div class="comments__submit">
          <BaseButton type="submit" icon="bi-send" :disabled="isSubmitting">
            {{ isSubmitting ? 'Enviando...' : 'Comentar' }}
          </BaseButton>
        </div>
      </div>

      <p v-if="formError" class="comments__error" role="alert">{{ formError }}</p>
    </form>

    <p v-else class="comments__login">
      <router-link :to="{ name: 'login', query: { redirect: route.fullPath } }">Entre</router-link>
      para comentar.
    </p>

    <p v-if="isLoading" class="comments__status">Carregando comentários...</p>
    <p v-else-if="error" class="comments__error" role="alert">{{ error }}</p>
    <p v-else-if="!comments.length" class="comments__status">
      Ainda não há comentários. Seja a primeira pessoa a comentar!
    </p>

    <ul v-else class="comments__list">
      <li v-for="comment in comments" :key="comment.id" class="comment">
        <img
          :src="resolveProfilePicture(comment.author?.profilePicture)"
          alt=""
          class="comment__avatar"
          @error="handleAvatarError"
        />

        <div class="comment__body">
          <div class="comment__header">
            <router-link
              v-if="comment.author"
              :to="{ name: 'public-profile', params: { username: comment.author.username } }"
              class="comment__author"
            >
              {{ authorName(comment) }}
            </router-link>
            <span v-else class="comment__author">{{ authorName(comment) }}</span>

            <time class="comment__time" :datetime="comment.createdAt" :title="formatDateTime(comment.createdAt)">
              {{ formatRelativeTime(comment.createdAt) }}
            </time>
          </div>

          <!-- O texto sai com {{ }}, que ESCAPA o HTML: "<b>oi</b>" aparece
               literalmente como texto. Com v-html, um comentário como
               <img src=x onerror="..."> seria interpretado como HTML e o
               script rodaria no navegador de TODO MUNDO que abrir a faixa
               (XSS). As quebras de linha são preservadas só pelo CSS
               (white-space: pre-line), sem precisar de HTML. -->
          <p class="comment__text">{{ comment.content }}</p>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.comments {
  margin-top: 1.5rem;
  padding: 1.5rem 1.75rem;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(20, 10, 40, 0.08);
}

.comments__title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem;
  font-size: 1.2rem;
}

.comments__title i {
  color: var(--brand-color, #7c3aed);
}

.comments__count {
  font-weight: 400;
  color: #777;
}

.comments__form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.comments__label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
}

.comments__textarea {
  box-sizing: border-box;
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 1px solid #d8d8e0;
  border-radius: 8px;
  font: inherit;
  resize: vertical;
}

.comments__textarea:focus {
  outline: none;
  border-color: var(--brand-color, #7c3aed);
}

.comments__form-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.comments__counter {
  font-size: 0.8rem;
  color: #777;
}

.comments__counter.is-over {
  color: #d33;
  font-weight: 600;
}

.comments__submit {
  width: 160px;
}

.comments__login,
.comments__status {
  margin: 0 0 1rem;
  color: #666;
}

.comments__error {
  margin: 0;
  font-size: 0.88rem;
  color: #d33;
}

.comments__list {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.comment {
  display: flex;
  gap: 0.8rem;
}

.comment__avatar {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  background: #e5e0f7;
}

.comment__body {
  flex: 1;
  min-width: 0;
}

.comment__header {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.6rem;
}

.comment__author {
  font-weight: 600;
  color: #1a1a1a;
  text-decoration: none;
}

a.comment__author:hover {
  color: var(--brand-color, #7c3aed);
  text-decoration: underline;
}

.comment__time {
  font-size: 0.8rem;
  color: #888;
}

/* pre-line: preserva as quebras de linha (\n) do texto digitado, mas junta
   espaços repetidos. overflow-wrap: palavras gigantes (sem nenhum
   espaço) quebram em vez de estourar o card. */
.comment__text {
  margin: 0.2rem 0 0;
  line-height: 1.5;
  white-space: pre-line;
  overflow-wrap: anywhere;
}
</style>
