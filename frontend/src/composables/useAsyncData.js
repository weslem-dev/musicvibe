import { ref, watch as vueWatch } from 'vue'
import { MESSAGES } from '../config/constants'

// ADICIONADO NA AULA 12. Carrega dados da API para uma tela e cuida do
// "esqueleto" que antes cada tela repetia: estado de carregando, mensagem de
// erro e try/catch/finally.
//
//   const { data: track, isLoading, error } = useAsyncData(
//     () => getTrackById(route.params.id),       // <- uma FUNÇÃO que faz a chamada
//     { watch: () => route.params.id }           // <- recarrega quando isto mudar
//   )
//
// Por que `fetcher` é `() => minhaChamada()` e NÃO `minhaChamada()`:
//   `minhaChamada()` já DISPARA a requisição na hora em que a linha é lida e
//   entrega só o resultado (uma Promise). O composable receberia algo que já
//   está em andamento e não teria como refazer a chamada depois, quando o
//   parâmetro da rota mudar ou quando a tela pedir "tentar de novo". Uma
//   FUNÇÃO deixa o composable decidir QUANDO chamar -- e chamar de novo.
//
// Opções:
//   watch       -> função (getter) que devolve o que, ao mudar, recarrega.
//   immediate   -> busca já ao criar (padrão true).
//   initialData -> valor de `data` antes de chegar (ex.: [] para listas).
//
// O fetcher devolve o corpo da API ({ success, message, data }); `data` guarda
// só o `.data`. Quem precisa de mais de uma chamada devolve { data: ... } montado.
export function useAsyncData(fetcher, { watch: source = null, immediate = true, initialData = null } = {}) {
  const data = ref(initialData)
  // Se vai buscar logo, já começa "carregando": a tela nunca pisca o estado "vazio".
  const isLoading = ref(immediate)
  const error = ref('')

  // Corrida entre respostas: cada chamada recebe um número (callId). Se o usuário
  // troca de perfil/faixa rápido, DUAS requisições ficam em voo e a mais antiga
  // pode terminar DEPOIS da nova -- e, sem proteção, sobrescreveria a tela com os
  // dados da pessoa/faixa anterior (o usuário vê o perfil errado). Só a resposta
  // da chamada MAIS RECENTE (callId === lastCallId) pode escrever na tela.
  let lastCallId = 0

  async function execute() {
    const callId = ++lastCallId

    isLoading.value = true
    error.value = ''
    data.value = initialData

    try {
      const response = await fetcher()

      if (callId !== lastCallId) return // chegou atrasada: descarta

      data.value = response.data
    } catch (err) {
      if (callId !== lastCallId) return

      // Leitura que falha é da TELA: mostramos aqui, sem toast (ver api.js).
      error.value = err?.message || MESSAGES.LOAD_ERROR
    } finally {
      if (callId === lastCallId) isLoading.value = false
    }
  }

  if (source) vueWatch(source, execute)
  if (immediate) execute()

  return { data, isLoading, error, execute }
}
