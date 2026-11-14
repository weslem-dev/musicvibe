import { ref } from 'vue'
import { MESSAGES, PAGE_SIZE } from '../config/constants'

// ADICIONADO NA AULA 12. Lista paginada com "Carregar mais" (Feed e Feed de quem
// eu sigo). Cuida de: página atual, acumular as páginas, saber se ainda há mais e
// o estado de carregando/erro.
//
//   const { items: tracks, isLoading, error, hasMore, loadMore } = usePaginatedList(getFeed)
//
// `fetchPage(page, pageSize)` é a função do service. Se a API devolver MENOS que
// pageSize itens, acabou: hasMore vira false. (Por isso PAGE_SIZE precisa ser
// um tamanho que a API realmente aceite: o teto dela é 50.)
export function usePaginatedList(fetchPage, { pageSize = PAGE_SIZE, immediate = true } = {}) {
  const items = ref([])
  const nextPage = ref(1)
  const hasMore = ref(true)
  const isLoading = ref(false)
  const error = ref('')

  async function loadMore() {
    // Trava: sem isso, dois cliques rápidos em "Carregar mais" pediriam a mesma página duas vezes.
    if (isLoading.value || !hasMore.value) return

    isLoading.value = true
    error.value = ''

    try {
      const response = await fetchPage(nextPage.value, pageSize)

      // push(...) ACRESCENTA a página nova ao que já está na tela.
      items.value.push(...response.data)
      hasMore.value = response.data.length === pageSize
      nextPage.value += 1
    } catch (err) {
      error.value = err?.message || MESSAGES.LOAD_ERROR
    } finally {
      isLoading.value = false
    }
  }

  if (immediate) loadMore()

  return { items, isLoading, error, hasMore, loadMore }
}
