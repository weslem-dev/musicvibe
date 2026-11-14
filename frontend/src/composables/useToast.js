import { ref } from 'vue'
import { TOAST_DURATION } from '../config/constants'

// ADICIONADO NA AULA 12. Sistema de toasts (avisos que aparecem e somem sozinhos).
//
// A lista fica FORA da função useToast() (um "singleton"): este arquivo é
// executado UMA vez e `toasts` existe uma vez só para a aplicação inteira.
// Todo mundo que chamar useToast() -- o ToastContainer, que desenha a lista, e
// o interceptor do Axios (services/api.js), que adiciona toasts quando uma
// ação falha -- enxerga a MESMA lista.
//
// Por que não uma store do Pinia: o interceptor do api.js NÃO é um componente,
// e a store de autenticação já importa o api (authService -> api). Se o api.js
// importasse uma store de volta, formaria uma dependência circular -- o mesmo
// motivo pelo qual api.js lê o token direto do localStorage. Um módulo comum
// com estado próprio não precisa de createPinia/app.use nem de nenhum
// contexto do Vue para funcionar, então pode ser chamado de qualquer lugar.
const toasts = ref([])
const timers = new Map()
let nextId = 1

function dismiss(id) {
  clearTimeout(timers.get(id))
  timers.delete(id)
  toasts.value = toasts.value.filter((toast) => toast.id !== id)
}

function show(type, message, duration = TOAST_DURATION[type]) {
  // Anti-duplicata: se já existe um toast IGUAL na tela, em vez de empilhar um
  // segundo só renovamos o tempo do que já está lá.
  const existing = toasts.value.find((toast) => toast.type === type && toast.message === message)

  if (existing) {
    clearTimeout(timers.get(existing.id))
    timers.set(existing.id, setTimeout(() => dismiss(existing.id), duration))
    return existing.id
  }

  const id = nextId++
  toasts.value.push({ id, type, message })
  timers.set(id, setTimeout(() => dismiss(id), duration))

  return id
}

export function useToast() {
  return {
    toasts,
    success: (message, duration) => show('success', message, duration),
    error: (message, duration) => show('error', message, duration),
    info: (message, duration) => show('info', message, duration),
    dismiss,
  }
}
