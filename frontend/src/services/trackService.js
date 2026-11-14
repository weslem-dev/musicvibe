import api from './api'
import { PAGE_SIZE } from '../config/constants'

// Diferente de updateProfile() (Aula 05), aqui NÃO sobrescrevemos o
// Content-Type manualmente: quando o `data` passado pro axios é uma
// instância de FormData, o próprio axios detecta isso e monta o header
// multipart/form-data com o boundary certo sozinho -- sobrescrever à mão
// só é necessário quando, por algum motivo, o axios não consegue inferir
// isso sozinho (não é o caso aqui).
//
// onUploadProgress é repassado direto pra config do axios: durante o envio,
// o axios chama essa função várias vezes com um objeto { loaded, total }.
// loaded = bytes já enviados até agora; total = tamanho total do corpo da
// requisição (nem sempre disponível, por isso quem usa isso precisa checar
// se `total` existe antes de dividir). (loaded / total) * 100 dá a
// porcentagem exibível na barra de progresso.
export function uploadTrack(formData, onUploadProgress) {
  return api.post('/tracks', formData, { onUploadProgress, silent: true })
}

// ADICIONADO NA AULA 08.
// Detalhe de uma faixa. A rota é pública (optionalAuth no back-end): o
// interceptor de api.js anexa o token se existir, e o back-end usa isso só
// pra calcular isOwner -- sem token, a faixa carrega do mesmo jeito.
export function getTrackById(id) {
  return api.get(`/tracks/${id}`)
}

// Uma página do feed. `params` vira a query string (?page=2&limit=12) --
// o axios cuida de montar e codificar a URL.
export function getFeed(page = 1, limit = PAGE_SIZE) {
  return api.get('/feed', { params: { page, limit } })
}

// ADICIONADO NA AULA 09.
// Faixas do usuário logado, da mais nova pra mais antiga.
export function getMyTracks() {
  return api.get('/my-tracks')
}

// Dados pra pré-preencher o formulário de edição (só o dono; 403/404 viram
// erro com a mensagem da API).
export function getTrackForEdit(id) {
  return api.get(`/tracks/${id}/edit`)
}

// formData = título, descrição e (opcional) a capa nova. Como no upload, não
// sobrescrevemos o Content-Type: o axios monta o multipart/form-data com o
// boundary certo sozinho quando recebe um FormData.
export function updateTrack(id, formData) {
  return api.put(`/tracks/${id}`, formData, { silent: true })
}

export function deleteTrack(id) {
  return api.delete(`/tracks/${id}`)
}
