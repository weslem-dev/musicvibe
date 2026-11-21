import { onUnmounted, ref, toValue, watch } from 'vue'

// ADICIONADO NA AULA 13. Devolve uma cópia de `source` que só muda depois de
// `delay` ms SEM novas mudanças. Na busca: enquanto a pessoa digita, cada tecla
// reinicia a contagem; só quando ela PARA por `delay` ms o valor "assenta" -- e só
// então uma requisição sai. Digitar "saudade" sem pausa gera UMA requisição, e
// não sete.
export function useDebouncedValue(source, delay) {
  // Começa já com o valor atual da origem (ex.: o ?q= da URL), sem esperar.
  const debounced = ref(toValue(source))
  let timer = null

  watch(source, (value) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      debounced.value = value
    }, delay)
  })

  // Se a tela sair antes de o tempo acabar, o timer não pode disparar depois.
  onUnmounted(() => clearTimeout(timer))

  return debounced
}
