import api from './api'
import { PAGE_SIZE } from '../config/constants'

// ADICIONADO NA AULA 15. As sete chamadas do painel de administração.
//
// Nenhuma é `silent`: as LEITURAS (GET) que falham são mostradas pela tela (o
// 403 "Acesso restrito a administradores." aparece no lugar do conteúdo), e as
// AÇÕES que falham (revisar, bloquear, excluir) viram toast no interceptor.

export function getAdminDashboard() {
  return api.get('/admin/dashboard')
}

// status: 'pending' | 'reviewed' | 'all'
export function getAdminReports(status, page = 1, limit = PAGE_SIZE) {
  return api.get('/admin/reports', { params: { status, page, limit } })
}

// PATCH SEM segundo argumento (sem corpo). Nunca `null`: o Axios mandaria o
// texto "null" e o express.json() responderia 400 (a lição do logout, Aula 14).
export function reviewAdminReport(id) {
  return api.patch(`/admin/reports/${id}/review`)
}

export function getAdminUsers(search, page = 1, limit = PAGE_SIZE) {
  return api.get('/admin/users', { params: { search, page, limit } })
}

export function setUserBlocked(id, isBlocked) {
  return api.patch(`/admin/users/${id}/block`, { isBlocked })
}

export function getAdminTracks(search, page = 1, limit = PAGE_SIZE) {
  return api.get('/admin/tracks', { params: { search, page, limit } })
}

export function deleteAdminTrack(id) {
  return api.delete(`/admin/tracks/${id}`)
}
