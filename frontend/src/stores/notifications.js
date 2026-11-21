import { defineStore } from 'pinia'
import { ref } from 'vue'
import { NOTIFICATIONS } from '../config/constants'
import { getUnreadCount } from '../services/notificationService'

// ADICIONADO NA AULA 14. O número de notificações não lidas (o selo do sino),
// com POLLING: a cada POLL_MS a store pergunta à API, sem a pessoa recarregar.
//
// Quem liga e quem desliga: a Navbar, olhando o isAuthenticated (entrou na conta
// -> startPolling; saiu -> stopPolling). A store nunca liga sozinha.
export const useNotificationsStore = defineStore('notifications', () => {
  const unreadCount = ref(0)

  let timerId = null

  // A CORRIDA DO CONTADOR: cada pergunta ganha um número (callId). Se, enquanto
  // uma resposta do polling ainda está a caminho, a tela de Notificações marcar
  // uma como lida (setUnreadCount com o número NOVO), a resposta velha chegaria
  // depois e sobrescreveria o número certo pelo antigo. Por isso só a resposta
  // da ÚLTIMA pergunta vale, e setUnreadCount também sobe o lastRefreshId:
  // assim ele "vence" qualquer pergunta que já estava no caminho.
  let lastRefreshId = 0

  async function refresh() {
    const callId = ++lastRefreshId

    try {
      const response = await getUnreadCount()

      if (callId === lastRefreshId) {
        unreadCount.value = response.data.unreadCount
      }
    } catch {
      // Silencioso: é uma leitura de fundo. Sem rede, o selo fica com o último
      // número e a próxima volta do polling tenta de novo.
    }
  }

  // Um número que veio de outro lugar (ex.: o unreadCount da resposta do
  // "marcar como lida", ou o -1/+1 otimista da tela).
  function setUnreadCount(value) {
    lastRefreshId += 1
    unreadCount.value = Math.max(0, value)
  }

  // Aba escondida (outra aba em primeiro plano, janela minimizada): não pergunta.
  // Ninguém está vendo o selo, e são requisições a menos para a API.
  // É usada nos DOIS lugares: em cada volta do setInterval e no evento
  // visibilitychange (ao VOLTAR para a aba, pergunta na hora; ao sair, não faz
  // nada).
  function refreshIfVisible() {
    if (document.visibilityState === 'visible') refresh()
  }

  function startPolling() {
    // Já ligado? Não liga um segundo temporizador. Sem este if, cada login (ou
    // cada vez que a Navbar chamasse de novo) somaria um setInterval, e o
    // número seria perguntado 2, 3, 4 vezes a cada 30 s.
    if (timerId !== null) return

    refresh() // a primeira pergunta é IMEDIATA, sem esperar 30 s
    timerId = setInterval(refreshIfVisible, NOTIFICATIONS.POLL_MS)
    // A MESMA referência (refreshIfVisible) vai no add e no remove: com uma
    // arrow escrita de novo, o removeEventListener não acharia o ouvinte.
    document.addEventListener('visibilitychange', refreshIfVisible)
  }

  // Desfaz TUDO: o temporizador, o ouvinte da aba e o número (quem sai da conta
  // não pode ver o selo da conta anterior). Sobe o lastRefreshId para descartar
  // uma resposta que ainda estivesse a caminho.
  function stopPolling() {
    if (timerId !== null) {
      clearInterval(timerId)
      timerId = null
    }

    document.removeEventListener('visibilitychange', refreshIfVisible)
    lastRefreshId += 1
    unreadCount.value = 0
  }

  return { unreadCount, refresh, setUnreadCount, refreshIfVisible, startPolling, stopPolling }
})
