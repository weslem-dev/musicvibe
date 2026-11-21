import api from './api'
import { PAGE_SIZE } from '../config/constants'

// ADICIONADO NA AULA 14. As três rotas exigem login (o token vai pelo
// interceptor do api.js).

// Lista paginada, da mais nova para a mais antiga (formato do usePaginatedList).
export function getNotifications(page = 1, limit = PAGE_SIZE) {
  return api.get('/notifications', { params: { page, limit } })
}

// O número do sino: { unreadCount }. É um GET, então uma falha NÃO vira toast
// (o polling erra em silêncio e tenta de novo daqui a 30 s).
export function getUnreadCount() {
  return api.get('/notifications/unread-count')
}

// Idempotente na API. Devolve { id, isRead: true, unreadCount } -- o número já
// calculado DEPOIS da escrita. Falha vira toast (é uma ação).
export function markNotificationAsRead(id) {
  return api.patch(`/notifications/${id}/read`)
}
