<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAsyncData } from '../../composables/useAsyncData'
import { getPublicProfile } from '../../services/authService'
import { getFollowers, getFollowing } from '../../services/followService'
import { FALLBACK_AVATAR, resolveProfilePicture } from '../../utils/media'

// ADICIONADO NA AULA 11. UMA tela para as DUAS listas (Seguidores e Seguindo).
//
// Quem diz qual das duas é a prop `kind`, definida em cada rota
// (router/index.js): props: { kind: 'followers' } ou { kind: 'following' }.
// As duas rotas apontam para ESTE mesmo componente; o Vue Router reaproveita a
// instância ao trocar de aba, e é o `watch` abaixo que recarrega a lista.
const props = defineProps({
  kind: { type: String, required: true, validator: (value) => ['followers', 'following'].includes(value) },
})

const route = useRoute()
const isFollowers = computed(() => props.kind === 'followers')

// DUAS chamadas EM SEQUÊNCIA. A rota usa o USERNAME (/profile/:username/followers),
// mas a API de listas usa o ID (/users/:id/followers). Então: 1) busca o perfil
// pelo username (e obtém o id); 2) só então busca a lista pelo id. O fetcher
// devolve { data: ... } porque o useAsyncData guarda só o `.data` do que receber.
// Se a pessoa trocar de aba (ou de perfil) rápido, o `lastCallId` do composable
// descarta a resposta atrasada.
const { data, isLoading, error } = useAsyncData(
  async () => {
    const { data: owner } = await getPublicProfile(route.params.username)
    const { data: list } = await (isFollowers.value ? getFollowers(owner.id) : getFollowing(owner.id))

    return { data: { person: owner, people: list } }
  },
  // Recarrega quando muda a ABA (kind) OU a PESSOA (username).
  { watch: () => [props.kind, route.params.username] }
)

const person = computed(() => data.value?.person ?? null)
const people = computed(() => data.value?.people ?? [])
const ownerName = computed(() => person.value?.fullName || person.value?.username || '')

function handleAvatarError(event) {
  event.target.src = FALLBACK_AVATAR
}
</script>

<template>
  <section class="follow-list">
    <p v-if="isLoading" class="follow-list__status">Carregando...</p>

    <div v-else-if="error" class="follow-list__error">
      <i class="bi bi-person-x"></i>
      <p>{{ error }}</p>
      <router-link to="/">Ir para o início</router-link>
    </div>

    <template v-else-if="person">
      <router-link
        :to="{ name: 'public-profile', params: { username: person.username } }"
        class="follow-list__back"
      >
        <i class="bi bi-arrow-left"></i> Voltar ao perfil de {{ ownerName }}
      </router-link>

      <h1 class="follow-list__title">
        {{ isFollowers ? `Seguidores de ${ownerName}` : `Quem ${ownerName} segue` }}
      </h1>

      <!-- Abas: a ativa vem de `kind`. Trocar de aba troca a rota (sem
           recarregar a página); o watch carrega a outra lista. -->
      <nav class="follow-list__tabs" aria-label="Seguidores e seguindo">
        <router-link
          :to="{ name: 'follow-followers', params: { username: person.username } }"
          class="follow-list__tab"
          :class="{ 'is-active': isFollowers }"
        >
          Seguidores <span>({{ person.followersCount }})</span>
        </router-link>
        <router-link
          :to="{ name: 'follow-following', params: { username: person.username } }"
          class="follow-list__tab"
          :class="{ 'is-active': !isFollowers }"
        >
          Seguindo <span>({{ person.followingCount }})</span>
        </router-link>
      </nav>

      <ul v-if="people.length" class="follow-list__items">
        <li v-for="item in people" :key="item.id">
          <router-link :to="{ name: 'public-profile', params: { username: item.username } }" class="person">
            <img
              :src="resolveProfilePicture(item.profilePicture)"
              :alt="`Foto de ${item.username}`"
              class="person__avatar"
              @error="handleAvatarError"
            />
            <span class="person__info">
              <strong class="person__name">{{ item.fullName || item.username }}</strong>
              <span class="person__username">@{{ item.username }}</span>
              <span v-if="item.bio" class="person__bio">{{ item.bio }}</span>
            </span>
          </router-link>
        </li>
      </ul>

      <!-- Estados vazios, com o NOME da pessoa. -->
      <p v-else class="follow-list__empty">
        {{ isFollowers ? `${ownerName} ainda não tem seguidores.` : `${ownerName} ainda não segue ninguém.` }}
      </p>
    </template>
  </section>
</template>

<style scoped>
.follow-list {
  max-width: 640px;
  margin: 0 auto;
}

.follow-list__back {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  text-decoration: none;
}

.follow-list__back:hover {
  text-decoration: underline;
}

.follow-list__title {
  margin: 0 0 1rem;
  font-size: 1.4rem;
}

.follow-list__tabs {
  display: flex;
  gap: 0.25rem;
  margin-bottom: 1.25rem;
  border-bottom: 1px solid #e5e5e5;
}

.follow-list__tab {
  padding: 0.6rem 1.1rem;
  border-bottom: 3px solid transparent;
  color: #666;
  font-weight: 600;
  text-decoration: none;
}

.follow-list__tab span {
  font-weight: 400;
}

.follow-list__tab:hover {
  color: var(--brand-color, #7c3aed);
}

.follow-list__tab.is-active {
  border-bottom-color: var(--brand-color, #7c3aed);
  color: var(--brand-color, #7c3aed);
}

.follow-list__items {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.person {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.75rem 1rem;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(20, 10, 40, 0.06);
  color: inherit;
  text-decoration: none;
  transition: box-shadow 0.15s ease;
}

.person:hover {
  box-shadow: 0 4px 18px rgba(20, 10, 40, 0.12);
}

.person__avatar {
  flex-shrink: 0;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  object-fit: cover;
  background: #e5e0f7;
}

.person__info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.person__name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.person__username {
  font-size: 0.85rem;
  color: var(--brand-color, #7c3aed);
}

.person__bio {
  margin-top: 0.15rem;
  font-size: 0.85rem;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.follow-list__empty,
.follow-list__status {
  padding: 2rem 0;
  text-align: center;
  color: #666;
}

.follow-list__error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 3rem 1rem;
  text-align: center;
  color: #d33;
}

.follow-list__error i {
  font-size: 2.2rem;
}

.follow-list__error p {
  margin: 0;
}
</style>
