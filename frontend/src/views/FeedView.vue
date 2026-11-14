<script setup>
import TrackCard from '../components/TrackCard.vue'
import BaseButton from '../components/base/BaseButton.vue'
import { usePaginatedList } from '../composables/usePaginatedList'
import { getFeed } from '../services/trackService'

// Páginas de PAGE_SIZE faixas (config/constants.js); "Carregar mais" acrescenta a
// próxima página à lista e some quando a API devolve menos que PAGE_SIZE.
const { items: tracks, isLoading, error, hasMore, loadMore } = usePaginatedList(getFeed)
</script>

<template>
  <section class="feed-page">
    <header class="feed-header">
      <h1><i class="bi bi-collection-play"></i> Feed</h1>
      <p>As faixas mais recentes da comunidade.</p>
    </header>

    <p v-if="error" class="feed-error" role="alert">{{ error }}</p>

    <div v-if="tracks.length" class="track-grid">
      <TrackCard v-for="track in tracks" :key="track.id" :track="track" />
    </div>

    <p v-else-if="isLoading" class="feed-status">Carregando faixas...</p>

    <p v-else-if="!error" class="feed-status">
      Nenhuma faixa por aqui ainda.
      <router-link to="/upload">Envie a primeira!</router-link>
    </p>

    <div v-if="tracks.length && hasMore" class="feed-more">
      <BaseButton variant="secondary" icon="bi-arrow-down-circle" :disabled="isLoading" @click="loadMore">
        {{ isLoading ? 'Carregando...' : 'Carregar mais' }}
      </BaseButton>
    </div>
  </section>
</template>

<style scoped>
.feed-header h1 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.25rem;
  font-size: 1.5rem;
}

.feed-header h1 i {
  color: var(--brand-color, #7c3aed);
}

.feed-header p {
  margin: 0 0 1.5rem;
  color: #666;
}


.feed-more {
  max-width: 240px;
  margin: 2rem auto 0;
}

.feed-status {
  color: #666;
}

.feed-error {
  color: #d33;
  margin-bottom: 1rem;
}
</style>
