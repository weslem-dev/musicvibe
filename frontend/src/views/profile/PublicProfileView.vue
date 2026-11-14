<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import FollowButton from '../../components/FollowButton.vue'
import TrackCard from '../../components/TrackCard.vue'
import { useAsyncData } from '../../composables/useAsyncData'
import { getPublicProfile } from '../../services/authService'
import { resolveProfilePicture, FALLBACK_AVATAR } from '../../utils/media'

const route = useRoute()

// Navegar de um perfil pra outro (ex.: clicar no autor de um card) reaproveita
// ESTE componente e só troca o :username: o `watch` recarrega o perfil nesses
// casos, sem recarregar a página. 404 (usuário inexistente) cai em `error`.
const { data: profile, isLoading, error } = useAsyncData(() => getPublicProfile(route.params.username), {
  watch: () => route.params.username,
})

// isOwner vem da API (calculado com o token): é o meu próprio perfil?
// Dono -> "Editar Perfil". Todo o resto (logado OU visitante) vê o FollowButton:
// ele mesmo decide o que fazer no clique (o visitante é levado ao login).
const isOwner = computed(() => profile.value?.isOwner === true)

function handleImageError(event) {
  event.target.src = FALLBACK_AVATAR
}
</script>

<template>
  <section class="public-profile">
    <p v-if="isLoading" class="public-profile__status">Carregando perfil...</p>

    <div v-else-if="error" class="public-profile__error">
      <i class="bi bi-person-x"></i>
      <p>{{ error }}</p>
      <router-link to="/">Ir para o início</router-link>
    </div>

    <template v-else-if="profile">
      <header class="public-profile__header">
        <img
          :src="resolveProfilePicture(profile.profilePicture)"
          :alt="`Foto de ${profile.username}`"
          class="public-profile__avatar"
          @error="handleImageError"
        />

        <div class="public-profile__info">
          <h1>{{ profile.fullName || profile.username }}</h1>
          <p class="public-profile__username">@{{ profile.username }}</p>
          <p v-if="profile.bio" class="public-profile__bio">{{ profile.bio }}</p>

          <ul class="public-profile__stats">
            <li><strong>{{ profile.tracksCount }}</strong> faixas</li>
            <!-- Os números viram LINKS para as listas (Aula 11). -->
            <li>
              <router-link :to="{ name: 'follow-followers', params: { username: profile.username } }" class="stat-link">
                <strong>{{ profile.followersCount }}</strong> seguidores
              </router-link>
            </li>
            <li>
              <router-link :to="{ name: 'follow-following', params: { username: profile.username } }" class="stat-link">
                <strong>{{ profile.followingCount }}</strong> seguindo
              </router-link>
            </li>
          </ul>

          <div class="public-profile__actions">
            <router-link v-if="isOwner" to="/profile" class="profile-btn profile-btn--outline">
              <i class="bi bi-pencil-square"></i> Editar Perfil
            </router-link>

            <!-- Dois v-model nomeados: o botão e o contador de seguidores do
                 cartão leem e escrevem os MESMOS dados do perfil, então mudam
                 juntos, na hora. -->
            <FollowButton
              v-else
              :user-id="profile.id"
              v-model:following="profile.isFollowing"
              v-model:followers-count="profile.followersCount"
            />
          </div>
        </div>
      </header>

      <h2 class="public-profile__section-title">Faixas</h2>

      <div v-if="profile.tracks.length" class="track-grid">
        <TrackCard v-for="track in profile.tracks" :key="track.id" :track="track" :show-author="false" />
      </div>

      <p v-else class="public-profile__empty">
        {{ isOwner ? 'Você ainda não enviou nenhuma faixa.' : 'Esta pessoa ainda não enviou nenhuma faixa.' }}
        <router-link v-if="isOwner" to="/upload">Enviar uma faixa</router-link>
      </p>
    </template>
  </section>
</template>

<style scoped>
.public-profile__header {
  display: flex;
  align-items: center;
  gap: 1.75rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #fff;
  border-radius: 16px;
  border-top: 4px solid var(--brand-color, #7c3aed);
  box-shadow: 0 4px 24px rgba(20, 10, 40, 0.08);
}

.public-profile__avatar {
  flex-shrink: 0;
  width: 112px;
  height: 112px;
  border-radius: 50%;
  object-fit: cover;
  background: #e5e0f7;
  border: 3px solid var(--brand-color, #7c3aed);
}

.public-profile__info h1 {
  margin: 0;
  font-size: 1.5rem;
}

.public-profile__username {
  margin: 0.1rem 0 0.6rem;
  color: var(--brand-color, #7c3aed);
  font-weight: 600;
}

.public-profile__bio {
  margin: 0 0 0.75rem;
  line-height: 1.5;
}

.public-profile__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
  margin: 0 0 1rem;
  padding: 0;
  list-style: none;
  color: #666;
  font-size: 0.9rem;
}

.public-profile__stats strong {
  color: #1a1a1a;
}

.stat-link {
  color: inherit;
  text-decoration: none;
}

.stat-link:hover {
  color: var(--brand-color, #7c3aed);
  text-decoration: underline;
}

.profile-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1.1rem;
  border: 1px solid var(--brand-color, #7c3aed);
  border-radius: 8px;
  font: inherit;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
}

.profile-btn--solid {
  background: var(--brand-color, #7c3aed);
  color: #fff;
}

.profile-btn--outline {
  background: transparent;
  color: var(--brand-color, #7c3aed);
}

.public-profile__section-title {
  margin: 0 0 1rem;
  font-size: 1.15rem;
}


.public-profile__empty,
.public-profile__status {
  color: #666;
}

.public-profile__error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 3rem 1rem;
  text-align: center;
  color: #d33;
}

.public-profile__error i {
  font-size: 2.2rem;
}

.public-profile__error p {
  margin: 0;
}

@media (max-width: 600px) {
  .public-profile__header {
    flex-direction: column;
    text-align: center;
  }

  .public-profile__stats {
    justify-content: center;
  }
}
</style>
