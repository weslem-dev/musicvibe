<script setup>
import { computed } from 'vue'
import { resolveCoverUrl, FALLBACK_COVER } from '../utils/media'

// Um card = uma faixa. O pai repete este componente com v-for, passando um
// objeto `track`.
//
// REFATORADO NA AULA 09. Antes, o card INTEIRO era um <router-link> (um <a>
// gigante). Problema: dentro de um <a> não pode haver outro link nem botão
// (HTML inválido, e um clique no botão "Excluir" também dispararia o link e
// navegaria pro detalhe). Agora o card é um <article> e só o TÍTULO é link;
// o truque do ::after (ver CSS) faz o card inteiro continuar clicável sem
// precisar de um <a> envolvendo tudo.
const props = defineProps({
  track: { type: Object, required: true },
  // Autor opcional: no Feed ele aparece; em "Minhas Faixas" e no Perfil
  // Público seria redundante (todas as faixas são da mesma pessoa).
  showAuthor: { type: Boolean, default: true },
})

const coverUrl = computed(() => resolveCoverUrl(props.track.cover))

const authorName = computed(
  () => props.track.author?.fullName || props.track.author?.username || 'Artista desconhecido'
)

function handleImageError(event) {
  event.target.src = FALLBACK_COVER
}
</script>

<template>
  <article class="track-card">
    <img
      :src="coverUrl"
      :alt="`Capa de ${track.title}`"
      class="track-card__cover"
      @error="handleImageError"
    />

    <div class="track-card__info">
      <h3 class="track-card__title">
        <router-link :to="{ name: 'track-detail', params: { id: track.id } }" class="track-card__link">
          {{ track.title }}
        </router-link>
      </h3>

      <!-- Autor clicável: leva ao perfil público. Só aparece se pedido
           (showAuthor) E se a API mandou o autor junto com a faixa. -->
      <router-link
        v-if="showAuthor && track.author"
        :to="{ name: 'public-profile', params: { username: track.author.username } }"
        class="track-card__author"
      >
        {{ authorName }}
      </router-link>

      <!-- Contadores (Aula 10): vêm prontos na própria faixa (colunas
           guardadas no banco), sem nenhuma chamada extra à API. -->
      <div class="track-card__stats">
        <span class="track-card__stat track-card__plays" title="Reproduções">
          <i class="bi bi-play-fill"></i> {{ track.playsCount ?? 0 }}
        </span>
        <span class="track-card__stat track-card__likes" title="Curtidas">
          <i class="bi bi-heart-fill"></i> {{ track.likesCount ?? 0 }}
        </span>
        <span class="track-card__stat track-card__comments" title="Comentários">
          <i class="bi bi-chat-dots-fill"></i> {{ track.commentsCount ?? 0 }}
        </span>
      </div>
    </div>

    <!-- Slot de ações: quem usa o card decide o que vai aqui (Editar,
         Excluir...). O Feed não preenche, e a área nem existe. -->
    <div v-if="$slots.actions" class="track-card__actions">
      <slot name="actions" />
    </div>
  </article>
</template>

<style scoped>
.track-card {
  position: relative; /* referência do ::after do link do título */
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(20, 10, 40, 0.08);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.track-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(20, 10, 40, 0.14);
}

/* Capa de álbum é quadrada: aspect-ratio 1/1 mantém a proporção certa em
   qualquer largura de coluna, sem esticar nem achatar a imagem. */
.track-card__cover {
  display: block;
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  background: #e5e0f7;
}

.track-card__info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.75rem 0.9rem 0.9rem;
}

.track-card__title {
  margin: 0;
  font-size: 1rem;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-card__link {
  color: inherit;
  text-decoration: none;
}

/* "Stretched link": o ::after do link do título é uma camada transparente
   que cobre o card inteiro (position absolute + inset 0, relativo ao
   .track-card). Clicar em qualquer ponto do card cai nessa camada e
   segue o link do título. */
.track-card__link::after {
  content: '';
  position: absolute;
  inset: 0;
}

/* Autor e ações ficam ACIMA da camada (z-index 1), então clicam no que são,
   em vez de cair no link do título. */
.track-card__author {
  position: relative;
  z-index: 1;
  align-self: flex-start;
  max-width: 100%;
  font-size: 0.85rem;
  color: #666;
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-card__author:hover {
  color: var(--brand-color, #7c3aed);
  text-decoration: underline;
}

.track-card__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.2rem 0.8rem;
  margin-top: 0.35rem;
}

.track-card__stat {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8rem;
  color: var(--brand-color, #7c3aed);
  font-weight: 600;
}

.track-card__actions {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 0.5rem;
  padding: 0 0.9rem 0.9rem;
}
</style>
