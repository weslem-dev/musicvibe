import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from './useAuth'

// ADICIONADO NA AULA 12. A "cerca" que os botões de ação social (curtir, seguir)
// repetiam: antes de agir, (1) visitante é levado ao login e volta depois;
// (2) se a ação anterior ainda não terminou, o clique é ignorado.
//
//   const { run: toggle, isBusy } = useAuthenticatedAction(async () => {
//     ...muda a tela, chama a API, e no catch SÓ desfaz a mudança visual...
//   })
//
// Quem avisa o usuário de um erro é o interceptor do Axios (toast); por isso o
// `catch` do botão não precisa mais guardar nem mostrar mensagem nenhuma.
export function useAuthenticatedAction(action) {
  const route = useRoute()
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  const isBusy = ref(false)

  async function run(...args) {
    // Visitante: não chama a API (ela responderia 401). Vai ao login e, pelo
    // ?redirect=, volta pra ESTA tela depois de entrar.
    if (!isAuthenticated.value) {
      router.push({ name: 'login', query: { redirect: route.fullPath } })
      return
    }

    // Trava contra clique duplo: três cliques rápidos viram UMA requisição.
    if (isBusy.value) return

    isBusy.value = true

    try {
      return await action(...args)
    } finally {
      isBusy.value = false
    }
  }

  return { run, isBusy }
}
