import api from './api'

// ADICIONADO NA AULA 13. As sete chamadas das playlists.

// Minhas playlists, da mais nova para a mais antiga.
export function getMyPlaylists() {
  return api.get('/my-playlists')
}

// Formulário (modal "Nova playlist"): o erro aparece DENTRO do modal, então
// `silent: true` no 3º argumento (a configuração) evita o toast duplicado.
export function createPlaylist(payload) {
  return api.post('/playlists', payload, { silent: true })
}

// Pública para visitante; privada só para a dona (403 para os outros).
export function getPlaylistById(id) {
  return api.get(`/playlists/${id}`)
}

export function deletePlaylist(id) {
  return api.delete(`/playlists/${id}`)
}

// Adicionar: o id da faixa vai NO CORPO.
export function addTrackToPlaylist(playlistId, trackId) {
  return api.post(`/playlists/${playlistId}/tracks`, { trackId })
}

// Remover: o id da faixa vai NA URL.
export function removeTrackFromPlaylist(playlistId, trackId) {
  return api.delete(`/playlists/${playlistId}/tracks/${trackId}`)
}

// Minhas playlists, cada uma com hasTrack para esta faixa (o modal "Salvar").
export function getPlaylistsStatus(trackId) {
  return api.get(`/tracks/${trackId}/playlists-status`)
}
