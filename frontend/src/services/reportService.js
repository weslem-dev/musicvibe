import api from './api'

// ADICIONADO NA AULA 14. Denunciar uma faixa: { reason } é uma das cinco CHAVES
// de REPORT_REASONS. `silent: true` (3º argumento): é um FORMULÁRIO (o modal),
// então o erro aparece dentro do modal, e não como toast.
export function reportTrack(trackId, reason) {
  return api.post(`/tracks/${trackId}/report`, { reason }, { silent: true })
}
