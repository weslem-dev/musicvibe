import { ref, watch } from 'vue'
import { MESSAGES, PAGE_SIZE } from '../config/constants'

// ADICIONADO NA AULA 12. Lista paginada com "Carregar mais" (Feed, Seguindo,
// Notificações e, desde a Aula 15, as listas do painel). Cuida de: página atual,
// acumular as páginas, saber se ainda há mais e o estado de carregando/erro.
//
//   const { items, isLoading, error, hasMore, loadMore, reload } = usePaginatedList(getFeed)
//
// `fetchPage(page, pageSize)` é a função do service. Se a API devolver MENOS que
// pageSize itens, acabou: hasMore vira false.
//
// AULA 14: `reload()` recomeça da página 1 (o "Atualizar").
//
// AULA 15: terceiro parâmetro { watch }. Quando a fonte observada muda (o filtro
// das Denúncias, o termo da busca), a lista recomeça SOZINHA da página 1:
//
//   usePaginatedList((page) => getAdminReports(statusFilter.value, page), undefined, { watch: statusFilter })
//
// A GUARDA CONTRA A RESPOSTA VELHA: cada recomeço (loadFirstPage) ganha um número
// (lastCallId). Se o filtro mudar de "Pendentes" para "Todas" enquanto a resposta
// de "Pendentes" ainda está a caminho, ela chega com um número antigo e é
// DESCARTADA (no try, no catch e no finally), em vez de pôr na tela a lista do
// filtro anterior. O loadMore guarda o número do início e faz o mesmo.
export function usePaginatedList(
  fetchPage,
  { pageSize = PAGE_SIZE, immediate = true } = {},
  { watch: source = null } = {}
) {
  const items = ref([])
  const nextPage = ref(1)
  const hasMore = ref(true)
  const isLoading = ref(false)
  const error = ref('')

  let lastCallId = 0

  async function loadFirstPage() {
    const callId = ++lastCallId

    items.value = []
    nextPage.value = 1
    hasMore.value = true
    isLoading.value = true
    error.value = ''

    try {
      const response = await fetchPage(1, pageSize)

      if (callId !== lastCallId) return

      items.value = response.data
      hasMore.value = response.data.length === pageSize
      nextPage.value = 2
    } catch (err) {
      if (callId !== lastCallId) return
      error.value = err?.message || MESSAGES.LOAD_ERROR
    } finally {
      if (callId === lastCallId) isLoading.value = false
    }
  }

  async function loadMore() {
    // Trava: sem isso, dois cliques rápidos em "Carregar mais" pediriam a mesma página duas vezes.
    if (isLoading.value || !hasMore.value) return

    const callId = lastCallId
    isLoading.value = true
    error.value = ''

    try {
      const response = await fetchPage(nextPage.value, pageSize)

      // Um recomeço aconteceu no meio do caminho: esta página é da lista velha.
      if (callId !== lastCallId) return

      // push(...) ACRESCENTA a página nova ao que já está na tela.
      items.value.push(...response.data)
      hasMore.value = response.data.length === pageSize
      nextPage.value += 1
    } catch (err) {
      if (callId !== lastCallId) return
      error.value = err?.message || MESSAGES.LOAD_ERROR
    } finally {
      if (callId === lastCallId) isLoading.value = false
    }
  }

  if (source) watch(source, loadFirstPage)

  if (immediate) loadFirstPage()

  // `reload` (Aula 14) é o mesmo recomeço, com o nome que as telas já usam.
  return { items, isLoading, error, hasMore, loadMore, loadFirstPage, reload: loadFirstPage }
}
