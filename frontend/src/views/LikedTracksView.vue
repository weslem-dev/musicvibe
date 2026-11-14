<script setup>
import TrackCard from '../components/TrackCard.vue'
import { useAsyncData } from '../composables/useAsyncData'
import { getLikedTracks } from '../services/likeService'

// ADICIONADO NA AULA 11. Faixas que o usuário logado curtiu, da curtida mais
// recente pra mais antiga. A lista é buscada ao ENTRAR na tela: se a pessoa
// descurtir uma faixa no Detalhe e voltar aqui, ela já não aparece.
const { data: tracks, isLoading, error } = useAsyncData(() => getLikedTracks(), { initialData: [] })
</script>

<template>
  <section class="liked">
    <header class="liked__header">
      <h1><i class="bi bi-heart-fill"></i> Faixas Curtidas</h1>
      <p>As faixas que você curtiu.</p>
    </header>

    <p v-if="isLoading" class="liked__status">Carregando suas curtidas...</p>
    <p v-else-if="error" class="liked__error" role="alert">{{ error }}</p>

    <div v-else-if="tracks.length" class="track-grid">
      <TrackCard v-for="track in tracks" :key="track.id" :track="track" />
    </div>

    <div v-else class="liked__empty">
      <i class="bi bi-heart"></i>
      <p>Você ainda não curtiu nenhuma faixa.</p>
      <router-link to="/feed">Explorar o Feed</router-link>
    </div>
  </section>
</template>

<style scoped>
.liked__header h1 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.25rem;
  font-size: 1.5rem;
}

.liked__header h1 i {
  color: var(--brand-color, #7c3aed);
}

.liked__header p {
  margin: 0 0 1.5rem;
  color: #666;
}


.liked__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  padding: 3rem 1rem;
  color: #666;
}

.liked__empty i {
  font-size: 2.4rem;
  color: #b8a8ec;
}

.liked__empty p {
  margin: 0;
}

.liked__status {
  color: #666;
}

.liked__error {
  color: #d33;
}
</style>
