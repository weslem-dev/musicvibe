<script setup>
import { useAuthenticatedAction } from '../composables/useAuthenticatedAction'
import { toggleFollow } from '../services/followService'
import { runOptimistic } from '../utils/optimistic'

// ADICIONADO NA AULA 11. Botão Seguir/Seguindo com atualização otimista.
//
// DIFERENÇA para o LikeButton (Aula 10): lá, o botão recebia um VALOR INICIAL
// (initialLiked) e guardava um estado PRÓPRIO. Aqui o estado pertence ao
// PAI (o perfil), porque o contador de seguidores do cartão do perfil precisa
// mudar JUNTO com o botão. Quando duas partes da tela precisam enxergar e
// alterar o mesmo valor, o certo é v-model / defineModel: o pai passa o valor,
// o botão o lê e escreve de volta, e os dois ficam sempre em sincronia.
//
//   <FollowButton
//     :user-id="profile.id"
//     v-model:following="profile.isFollowing"
//     v-model:followers-count="profile.followersCount"
//   />
//
// AULA 12: a "cerca" (visitante -> login; ignora clique enquanto ocupado) vem de
// useAuthenticatedAction, e o aviso de erro é o toast do interceptor.
// AULA 13: os três passos usam runOptimistic (utils/optimistic.js), extraído no
// terceiro caso (o modal "Salvar"). O comportamento não muda.
const props = defineProps({
  userId: { type: [Number, String], required: true },
})

// Dois v-model nomeados (um por valor).
const following = defineModel('following', { type: Boolean, default: false })
const followersCount = defineModel('followersCount', { type: Number, default: 0 })

const { run: toggle, isBusy } = useAuthenticatedAction(() =>
  runOptimistic({
    apply: () => {
      // PASSO 1: guarda o estado anterior, pra poder voltar atrás (rollback).
      const previous = { following: following.value, followersCount: followersCount.value }

      // O NOVO estado fica numa variável LOCAL. Com defineModel, depois de
      // `following.value = x` o valor lido de `following.value` AINDA é o antigo
      // até o pai re-renderizar e devolver a prop atualizada (o defineModel só
      // emite o evento "update"; quem de fato troca o valor é o pai). Por isso o
      // código NUNCA lê following.value logo depois de atribuí-lo: usa nowFollowing.
      const nowFollowing = !previous.following

      // PASSO 2: muda a tela NA HORA (botão e contador do cartão do perfil).
      // Math.max(0, ...) impede o contador de ir para -1.
      following.value = nowFollowing
      followersCount.value = Math.max(0, previous.followersCount + (nowFollowing ? 1 : -1))

      return () => {
        following.value = previous.following
        followersCount.value = previous.followersCount
      }
    },
    request: () => toggleFollow(props.userId),
    // PASSO 3: o servidor confirma e diz o estado FINAL; adotamos o dele.
    confirm: (data) => {
      following.value = data.isFollowing
      followersCount.value = data.followersCount
    },
  })
)
</script>

<template>
  <div class="follow">
    <button
      type="button"
      class="follow__button"
      :class="{ 'is-following': following, 'is-busy': isBusy }"
      :aria-pressed="following"
      :title="following ? 'Deixar de seguir' : 'Seguir'"
      :disabled="isBusy"
      @click="toggle()"
    >
      <i class="bi" :class="following ? 'bi-person-check-fill' : 'bi-person-plus'"></i>
      {{ following ? 'Seguindo' : 'Seguir' }}
    </button>
  </div>
</template>

<style scoped>
.follow {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.35rem;
}

.follow__button {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1.1rem;
  border: 1px solid var(--brand-color, #7c3aed);
  border-radius: 8px;
  background: var(--brand-color, #7c3aed);
  color: #fff;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.follow__button:hover:not(:disabled) {
  background: var(--brand-color-dark, #5b21b6);
}

/* Já seguindo: botão "vazado" (contorno), pra deixar claro que o clique agora
   desfaz. */
.follow__button.is-following {
  background: transparent;
  color: var(--brand-color, #7c3aed);
}

.follow__button.is-following:hover:not(:disabled) {
  background: #f6f3ff;
}

/* Enquanto espera o servidor o botão JÁ mudou (otimista); só reduzimos o
   destaque pra indicar que há uma requisição em andamento. */
.follow__button.is-busy {
  opacity: 0.75;
  cursor: progress;
}

</style>
