import api from './api'

// ADICIONADO NA AULA 10.
// Lista pública, dos comentários mais novos para os mais antigos.
export function getComments(trackId) {
  return api.get(`/tracks/${trackId}/comments`)
}

// Exige login. A API devolve o comentário criado JÁ COM o autor, então a
// tela consegue mostrá-lo no topo sem recarregar a lista.
export function createComment(trackId, content) {
  return api.post(`/tracks/${trackId}/comments`, { content })
}
