import api from './api'
import { PAGE_SIZE } from '../config/constants'

// ADICIONADO NA AULA 11.
// Seguir/deixar de seguir com UMA rota (toggle): a API cria a relação se não
// existir e a remove se existir, e devolve { isFollowing, followersCount } já
// com o estado FINAL. userId é o id (número) da pessoa-alvo.
export function toggleFollow(userId) {
  return api.post(`/users/${userId}/toggle-follow`)
}

// Listas públicas. Cada item é uma PESSOA (id, username, fullName, bio,
// profilePicture e os contadores), nunca com senha nem e-mail.
export function getFollowers(userId) {
  return api.get(`/users/${userId}/followers`)
}

export function getFollowing(userId) {
  return api.get(`/users/${userId}/following`)
}

// Feed só com as faixas de quem eu sigo (exige login), paginado como o Feed.
export function getFollowingTracks(page = 1, limit = PAGE_SIZE) {
  return api.get('/following-tracks', { params: { page, limit } })
}
