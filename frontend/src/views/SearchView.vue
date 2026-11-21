<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TrackCard from '../components/TrackCard.vue'
import { SEARCH } from '../config/constants'
import { useAsyncData } from '../composables/useAsyncData'
import { useDebouncedValue } from '../composables/useDebouncedValue'
import { search } from '../services/searchService'
import { FALLBACK_AVATAR, resolveProfilePicture } from '../utils/media'

// AULA 13: a busca de verdade (faixas e pessoas), com o termo na URL (?q=).
// Alcançabilidade: item "Explorar" da Sidebar e a barra de busca da Navbar.
//
// DUAS defesas contra requisições demais/erradas:
//  - o DEBOUNCE (useDebouncedValue) evita disparar uma busca por tecla: só busca
//    quando a pessoa para de digitar;
//  - o lastCallId (dentro do useAsyncData) evita que uma resposta ATRASADA de um
//    termo antigo apareça por cima da resposta do termo atual.
const route = useRoute()
const router = useRouter()

const EMPTY = { query: '', tracks: [], users: [] }

function queryFromUrl() {
  // ?q=ab&q=cd vira array e ?q[x]=1 vira objeto: só texto conta.
  return typeof route.query.q === 'string' ? route.query.q : ''
}

// typedText = o que o campo mostra (muda a cada tecla). O estado inicial vem da
// URL: um F5 ou um link compartilhado já abre com o termo.
const typedText = ref(queryFromUrl())
const term = useDebouncedValue(typedText, SEARCH.DEBOUNCE_MS)
const normalizedTerm = computed(() => term.value.trim())

const isTooShort = computed(() => {
  const length = typedText.value.trim().length
  return length > 0 && length < SEARCH.MIN_LENGTH
})

// Termo curto não sai para a rede: a resposta vazia já vem pronta.
const { data: results, isLoading, error } = useAsyncData(
  () =>
    normalizedTerm.value.length >= SEARCH.MIN_LENGTH
      ? search(normalizedTerm.value)
      : Promise.resolve({ data: { ...EMPTY, query: normalizedTerm.value } }),
  { watch: normalizedTerm, initialData: EMPTY }
)

// URL -> campo: a barra da Navbar (ou Voltar/Avançar) pode trocar o ?q= com esta
// tela já aberta. Só mexe no campo quando o valor é DIFERENTE do termo atual --
// senão a escrita abaixo voltaria aqui e "brigaria" com o que a pessoa digita.
watch(
  () => route.query.q,
  () => {
    const fromUrl = queryFromUrl()
    if (fromUrl.trim() !== normalizedTerm.value) {
      typedText.value = fromUrl
    }
  }
)

// Termo -> URL: router.REPLACE (e não push), para o botão Voltar sair da busca em
// vez de passar por cada pausa da digitação.
watch(normalizedTerm, (value) => {
  if (value === queryFromUrl().trim()) return
  router.replace({ name: 'search', query: value ? { q: value } : {} })
})

const hasResults = computed(() => results.value.tracks.length > 0 || results.value.users.length > 0)
const showNothingFound = computed(
  () => !isLoading.value && !error.value && results.value.query.length >= SEARCH.MIN_LENGTH && !hasResults.value
)

// Foco no campo ao abrir a tela (por código: ref + onMounted).
const inputRef = ref(null)
onMounted(() => inputRef.value?.focus())

function handleAvatarError(event) {
  event.target.src = FALLBACK_AVATAR
}
</script>

<template>
  <section class="search-page">
    <h1 class="search-page__title"><i class="bi bi-search"></i> Explorar</h1>

    <div class="search-box" role="search">
      <i class="bi bi-search search-box__icon"></i>
      <input
        id="search-input"
        ref="inputRef"
        v-model="typedText"
        type="search"
        class="search-box__input"
        placeholder="Busque por faixas ou pessoas"
        autocomplete="off"
        aria-label="Buscar faixas ou pessoas"
      />
    </div>

    <p v-if="isTooShort" class="search-page__hint">Digite pelo menos {{ SEARCH.MIN_LENGTH }} letras para buscar.</p>

    <p v-if="isLoading" class="search-page__status">Buscando...</p>
    <p v-else-if="error" class="search-page__error" role="alert">{{ error }}</p>

    <template v-else>
      <section v-if="results.users.length" class="search-section">
        <h2>Pessoas</h2>
        <ul class="people">
          <li v-for="person in results.users" :key="person.id">
            <router-link :to="{ name: 'public-profile', params: { username: person.username } }" class="person">
              <img
                :src="resolveProfilePicture(person.profilePicture)"
                :alt="`Foto de ${person.username}`"
                class="person__avatar"
                @error="handleAvatarError"
              />
              <span class="person__info">
                <strong>{{ person.fullName || person.username }}</strong>
                <span class="person__username">@{{ person.username }}</span>
              </span>
            </router-link>
          </li>
        </ul>
      </section>

      <section v-if="results.tracks.length" class="search-section">
        <h2>Faixas</h2>
        <div class="track-grid">
          <TrackCard v-for="track in results.tracks" :key="track.id" :track="track" />
        </div>
      </section>

      <p v-if="showNothingFound" class="search-page__empty">
        Nada encontrado para "<strong>{{ results.query }}</strong>".
      </p>
    </template>
  </section>
</template>

<style scoped>
.search-page__title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem;
  font-size: 1.5rem;
}

.search-page__title i {
  color: var(--brand-color, #7c3aed);
}

.search-box {
  position: relative;
  max-width: 560px;
  margin-bottom: 0.5rem;
}

.search-box__icon {
  position: absolute;
  top: 50%;
  left: 0.9rem;
  color: #888;
  transform: translateY(-50%);
}

.search-box__input {
  box-sizing: border-box;
  width: 100%;
  padding: 0.7rem 0.9rem 0.7rem 2.5rem;
  border: 1px solid #d8d8e0;
  border-radius: 999px;
  background: #fff;
  font: inherit;
}

.search-box__input:focus {
  outline: none;
  border-color: var(--brand-color, #7c3aed);
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15);
}

.search-page__hint,
.search-page__status,
.search-page__empty {
  color: #666;
}

.search-page__error {
  color: #d33;
}

.search-section {
  margin-top: 1.5rem;
}

.search-section h2 {
  margin: 0 0 0.75rem;
  font-size: 1.1rem;
}

.people {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.6rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.person {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.8rem;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(20, 10, 40, 0.06);
  color: inherit;
  text-decoration: none;
}

.person:hover {
  box-shadow: 0 4px 18px rgba(20, 10, 40, 0.12);
}

.person__avatar {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  background: #e5e0f7;
}

.person__info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.person__info strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.person__username {
  font-size: 0.85rem;
  color: var(--brand-color, #7c3aed);
}
</style>
