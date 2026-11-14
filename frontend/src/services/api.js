import axios from 'axios'
import { MESSAGES, STORAGE_KEYS } from '../config/constants'
import { useToast } from '../composables/useToast'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

// Anexa o token JWT salvo no login (Aula 04) em toda requisição, se existir.
// Lemos o token direto do localStorage (e não da store do Pinia) porque a
// store importa `api` -- se `api` importasse a store de volta, teríamos uma
// dependência circular entre os dois arquivos.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Padroniza o erro que sai daqui, não importa de onde veio:
// - error.response -> a API respondeu, mas com status de erro (400, 401, 404...).
//   Reaproveita a mensagem já formatada pelo apiResponse.js da API.
// - error.request  -> a requisição saiu, mas nenhuma resposta chegou (API fora do
//   ar ou sem conexão): não existe error.response.data, a mensagem é genérica.
// - else           -> erro raro, na própria montagem da requisição.
function normalizeError(error) {
  if (error.response) {
    const apiError = error.response.data || {}

    return {
      message: apiError.message || MESSAGES.REQUEST_ERROR,
      errors: apiError.errors || [],
      status: error.response.status,
    }
  }

  if (error.request) {
    return { message: MESSAGES.NETWORK_ERROR, errors: [], status: null }
  }

  return { message: MESSAGES.UNEXPECTED_ERROR, errors: [], status: null }
}

// QUEM AVISA O USUÁRIO QUANDO ALGO FALHA (a regra do projeto):
//   - AÇÃO que falha (POST, PUT, DELETE: curtir, seguir, excluir, comentar...)
//     vira TOAST, aqui, num lugar só -- as telas não precisam repetir nada --
//     SALVO se a requisição marcou `silent: true`.
//   - LEITURA que falha (GET) é da TELA: ela decide como mostrar (o `error` do
//     useAsyncData). Um toast por GET falho encheria a tela de avisos toda vez
//     que a API caísse, e a tela já tem um lugar melhor para dizer isso.
//   - FORMULÁRIO que falha (login, cadastro, edição de perfil, criar/editar
//     faixa) mostra o erro NO PRÓPRIO FORMULÁRIO, perto do campo. Por isso esses
//     services marcam `silent: true`: um toast ali seria um segundo aviso do
//     mesmo erro (duplicado) e longe do lugar onde a pessoa está olhando.
//   - 401 (sessão sem token ou expirada) não vira toast: leva ao login.
//
// "Toast para todo erro" seria um erro de design porque dispara avisos que a
// tela já dá (duplicados), para leituras que a tela trata melhor, e em ações
// que a própria pessoa nem espera (um GET de fundo falhando).
//
// Como marcar: `silent` vai no objeto de CONFIGURAÇÃO do Axios, que é o 2º
// argumento em get/delete (`api.get(url, { silent: true })`) e o 3º em
// post/put/patch (`api.post(url, dados, { silent: true })`).
function notifyIfNeeded(error, normalizedError) {
  const config = error.config || {}
  const isAction = (config.method || 'get').toLowerCase() !== 'get'

  if (isAction && config.silent !== true) {
    useToast().error(normalizedError.message)
  }
}

api.interceptors.response.use(
  // Sucesso: "descasca" um nível, cada chamada recebe direto { success, message, data }.
  (response) => response.data,
  (error) => {
    const normalizedError = normalizeError(error)

    // 401 leva ao login (Aula 04): limpa a sessão local e volta pra tela de Login.
    if (normalizedError.status === 401) {
      localStorage.removeItem(STORAGE_KEYS.TOKEN)
      localStorage.removeItem(STORAGE_KEYS.USER)

      if (window.location.pathname !== '/login') {
        window.location.href = `/login?redirect=${window.location.pathname}`
      }

      return Promise.reject(normalizedError)
    }

    notifyIfNeeded(error, normalizedError)

    return Promise.reject(normalizedError)
  }
)

export default api
