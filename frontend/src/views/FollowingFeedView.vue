<script setup>
import TrackCard from '../components/TrackCard.vue'
import BaseButton from '../components/base/BaseButton.vue'
import { usePaginatedList } from '../composables/usePaginatedList'
import { getFollowingTracks } from '../services/followService'

// ADICIONADO NA AULA 11. Feed só com as faixas de QUEM EU SIGO.
//
// Checagem de alcançabilidade (ADR-012): esta tela é alcançada com UM clique
// pelo item "Seguindo" da Sidebar (components/layout/TheSidebar.vue, to="/following"),
// e a rota /following existe em router/index.js (meta.requiresAuth).
//
// A estrutura é a mesma do Feed (usePaginatedList): "Carregar mais" de PAGE_SIZE
// em PAGE_SIZE (config/constants.js).
const { items: tracks, isLoading, error, hasMore, loadMore } = usePaginatedList(getFollowingTracks)
</script>

<template>
  <section class="following-feed">
    <header class="following-feed__header">
      <h1><i class="bi bi-people-fill"></i> Seguindo</h1>
      <p>As faixas mais recentes de quem você segue.</p>
    </header>

    <p v-if="error" class="following-feed__error" role="alert">{{ error }}</p>

    <div v-if="tracks.length" class="track-grid">
      <TrackCard v-for="track in tracks" :key="track.id" :track="track" />
    </div>

    <p v-else-if="isLoading" class="following-feed__status">Carregando faixas...</p>

    <div v-else-if="!error" class="following-feed__empty">
      <i class="bi bi-people"></i>
      <p>Nada por aqui ainda: você não segue ninguém, ou as pessoas que você segue ainda não enviaram faixas.</p>
      <router-link to="/feed">Explorar o Feed</router-link>
    </div>

    <div v-if="tracks.length && hasMore" class="following-feed__more">
      <BaseButton variant="secondary" icon="bi-arrow-down-circle" :disabled="isLoading" @click="loadMore">
        {{ isLoading ? 'Carregando...' : 'Carregar mais' }}
      </BaseButton>
    </div>
  </section>
</template>

<style scoped>
.following-feed__header h1 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.25rem;
  font-size: 1.5rem;
}

.following-feed__header h1 i {
  color: var(--brand-color, #7c3aed);
}

.following-feed__header p {
  margin: 0 0 1.5rem;
  color: #666;
}


.following-feed__more {
  max-width: 240px;
  margin: 2rem auto 0;
}

.following-feed__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  padding: 3rem 1rem;
  text-align: center;
  color: #666;
}

.following-feed__empty i {
  font-size: 2.4rem;
  color: #b8a8ec;
}

.following-feed__empty p {
  max-width: 420px;
  margin: 0;
}

.following-feed__status {
  color: #666;
}

.following-feed__error {
  margin-bottom: 1rem;
  color: #d33;
}
</style>
