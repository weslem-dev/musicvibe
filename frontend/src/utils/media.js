// VITE_API_URL aponta pra "http://localhost:3000/api" -- mas os arquivos
// enviados por upload NÃO ficam sob /api, ficam em /uploads (ver
// express.static em app.js, Aula 05). Por isso usamos VITE_API_BASE_URL
// (sem o /api no final) pra montar a URL desses arquivos.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

const DEFAULT_PROFILE_PICTURE = 'default-profile.png'

/**
 * Monta a URL pública completa de uma foto de perfil a partir do nome do
 * arquivo salvo no banco (campo profilePicture do usuário). Se não vier
 * nenhum nome, cai na foto padrão -- que também existe fisicamente em
 * public/uploads/profiles/default-profile.png no back-end.
 */
export function resolveProfilePicture(filename) {
  const finalFilename = filename || DEFAULT_PROFILE_PICTURE
  return `${API_BASE_URL}/uploads/profiles/${finalFilename}`
}

// ADICIONADO NA AULA 08.
// Capa e áudio de uma faixa SEMPRE apontam pro caminho ESTÁTICO
// (/uploads/...), nunca pra rota protegida /api/tracks/:id/stream. Motivo:
// <img> e <audio> são tags HTML, e uma tag não consegue enviar o cabeçalho
// Authorization -- só o JavaScript (axios) consegue. Uma rota que exige
// token seria, portanto, inalcançável por um src="...". O caminho estático
// é público e o express.static ainda atende requisições Range (206), então
// o player consegue "pular" pra qualquer ponto da música.
export function resolveCoverUrl(filename) {
  return `${API_BASE_URL}/uploads/covers/${filename}`
}

export function resolveAudioUrl(filename) {
  return `${API_BASE_URL}/uploads/tracks/${filename}`
}

// Capa genérica (SVG embutido, não depende de rede) usada quando a imagem
// real falha ao carregar -- sem ela, o navegador mostraria o texto do `alt`
// ou o ícone de imagem quebrada dentro do card.
export const FALLBACK_COVER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <rect width="120" height="120" fill="#e5e0f7"/>
      <path d="M78 28v46.5a14 14 0 1 1-8-12.6V44l-24 5v33.5a14 14 0 1 1-8-12.6V40z" fill="#b8a8ec"/>
    </svg>`
  )

// ADICIONADO NA AULA 09.
// Avatar genérico (SVG embutido) usado quando a foto de perfil falha ao
// carregar -- mesmo papel de FALLBACK_COVER, mas em formato de pessoa.
export const FALLBACK_AVATAR =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
      <rect width="96" height="96" fill="#e5e0f7"/>
      <circle cx="48" cy="38" r="18" fill="#b8a8ec"/>
      <ellipse cx="48" cy="88" rx="32" ry="26" fill="#b8a8ec"/>
    </svg>`
  )
