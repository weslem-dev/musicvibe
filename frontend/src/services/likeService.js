import api from './api'

// ADICIONADO NA AULA 10.
// Curtir/descurtir com UMA rota só (toggle): a API cria a curtida se não
// existir e remove se existir, e devolve { liked, likesCount } já com o
// estado FINAL -- o front adota essa resposta como verdade.
export function toggleLike(trackId) {
  return api.post(`/tracks/${trackId}/toggle-like`)
}

// Público: visitante recebe liked: false.
export function getLikeStatus(trackId) {
  return api.get(`/tracks/${trackId}/like-status`)
}

// Faixas curtidas pelo usuário logado (cada uma com o autor).
export function getLikedTracks() {
  return api.get('/liked-tracks')
}
