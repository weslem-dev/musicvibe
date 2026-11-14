<script setup>
import { ref, watch } from 'vue'
import { useAuthenticatedAction } from '../composables/useAuthenticatedAction'
import { toggleLike } from '../services/likeService'
import { formatCount } from '../utils/format'

// ADICIONADO NA AULA 10. Botão de curtir com ATUALIZAÇÃO OTIMISTA.
//
// Otimista = a tela muda ANTES de o servidor responder, apostando que vai
// dar certo. Os três passos (veja `toggle`):
//   1) guardar o estado anterior;
//   2) mudar a tela na hora;
//   3) confirmar com o servidor -- se der certo, adotar a resposta dele; se
//      der errado, voltar ao estado guardado (rollback).
// Quando NÃO usar: quando o resultado é irreversível ou importante demais pra
// "chutar" (pagamento, exclusão), ou quando o servidor costuma recusar a
// ação e a tela ficaria "mentindo" com frequência.
//
// AULA 12: a "cerca" (visitante vai ao login; ignora clique enquanto ocupado) saiu
// daqui e foi para useAuthenticatedAction, e o aviso de erro virou toast (vem do
// interceptor do Axios): o `catch` agora SÓ desfaz a mudança visual.
//
// Por que o miolo da atualização otimista (os 3 passos) NÃO foi extraído num
// composable: existem só DOIS botões com ele (curtir e seguir), e eles diferem
// no que importa (um estado e um contador num componente, dois v-model no outro).
// Pela "regra dos três" (só se extrai com a terceira repetição, quando já dá para
// ver o que é igual de verdade), copiar duas vezes é mais barato e mais claro do
// que inventar agora uma abstração que talvez nasça com o formato errado.
const props = defineProps({
  trackId: { type: [Number, String], required: true },
  initialLiked: { type: Boolean, default: false },
  initialCount: { type: Number, default: 0 },
})

const emit = defineEmits(['change'])

const liked = ref(props.initialLiked)
const count = ref(props.initialCount)

// O pai (tela de Detalhe) carrega a faixa de forma assíncrona e pode trocar de
// faixa sem remontar este componente: sempre que os valores iniciais mudarem,
// o estado interno acompanha.
watch(
  () => [props.trackId, props.initialLiked, props.initialCount],
  () => {
    liked.value = props.initialLiked
    count.value = props.initialCount
  }
)

const { run: toggle, isBusy } = useAuthenticatedAction(async () => {
  // PASSO 1: guarda o estado anterior, pra poder voltar atrás.
  const previous = { liked: liked.value, count: count.value }

  // PASSO 2: muda a tela NA HORA, sem esperar a rede.
  liked.value = !previous.liked
  count.value = Math.max(0, previous.count + (liked.value ? 1 : -1))

  try {
    // PASSO 3a: o servidor confirma e diz o estado FINAL; adotamos o dele
    // (ele é a fonte da verdade -- o contador pode ter mudado por causa de
    // outras pessoas curtindo ao mesmo tempo).
    const response = await toggleLike(props.trackId)
    liked.value = response.data.liked
    count.value = response.data.likesCount
    emit('change', { liked: liked.value, count: count.value })
  } catch {
    // PASSO 3b: ROLLBACK -- só desfaz a mudança visual. Quem avisa do erro é o toast.
    liked.value = previous.liked
    count.value = previous.count
  }
})
</script>

<template>
  <div class="like">
    <button
      type="button"
      class="like__button"
      :class="{ 'is-liked': liked, 'is-busy': isBusy }"
      :aria-pressed="liked"
      :aria-label="liked ? 'Descurtir' : 'Curtir'"
      :disabled="isBusy"
      @click="toggle()"
    >
      <i class="bi" :class="liked ? 'bi-heart-fill' : 'bi-heart'"></i>
      <span class="like__count">{{ formatCount(count) }}</span>
    </button>
  </div>
</template>

<style scoped>
.like {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.35rem;
}

.like__button {
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
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.like__button i {
  font-size: 1.05rem;
  transition: transform 0.15s ease;
}

.like__button:hover:not(:disabled) {
  border-color: var(--brand-color, #7c3aed);
  color: var(--brand-color, #7c3aed);
}

.like__button.is-liked {
  border-color: var(--brand-color, #7c3aed);
  background: #f6f3ff;
  color: var(--brand-color, #7c3aed);
}

.like__button.is-liked i {
  transform: scale(1.12);
}

/* Enquanto espera o servidor o coração JÁ mudou (otimista); só reduzimos o
   destaque pra indicar que há uma requisição em andamento. */
.like__button.is-busy {
  opacity: 0.75;
  cursor: progress;
}

</style>
