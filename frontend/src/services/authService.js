import api from './api'

// register() em uso desde a Aula 03 (RegisterView.vue).
// `silent: true` (3º argumento do post): erro de FORMULÁRIO aparece no próprio
// formulário, não como toast (ver notifyIfNeeded em api.js).
export function register(payload) {
  return api.post('/register', payload, { silent: true })
}

// login() e logout() entram em uso agora (Aula 04 -> stores/auth.js).
export function login(payload) {
  return api.post('/login', payload, { silent: true })
}

// O logout não tem corpo e é a 3ª posição que recebe a configuração.
// Silencioso: a store limpa a sessão local mesmo se esta chamada falhar, então
// um toast de erro aqui só confundiria.
//
// AULA 14: o 2º argumento é `undefined`, e não `null`. Com `null`, o Axios
// enviava o texto "null" como corpo JSON; o express.json() da API (modo
// estrito) recusava com 400, e, como o cors estava DEPOIS dele no app.js, a
// resposta saía sem o cabeçalho de CORS: o Console mostrava um erro vermelho de
// CORS a cada logout. Com `undefined`, a requisição vai sem corpo nenhum.
export function logout() {
  return api.post('/logout', undefined, { silent: true })
}

// Usa o token salvo (anexado automaticamente pelo interceptor do api.js)
// para buscar os dados completos do usuário logado.
export function getMyProfile() {
  return api.get('/profile/me')
}

// ADICIONADO NA AULA 05.
// Única chamada de toda a aplicação a sobrescrever o Content-Type padrão de
// `api` (application/json, configurado no axios.create de api.js -- ver
// comentário lá). formData é uma instância de FormData (texto + arquivo),
// então precisa ir como multipart/form-data. A instância `api` em si NÃO
// muda: o token continua sendo anexado normalmente pelo interceptor de
// requisição, porque ele roda para toda chamada feita através dela,
// independente do Content-Type de cada uma.
export function updateProfile(formData) {
  return api.put('/profile/me', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    silent: true,
  })
}

// ADICIONADO NA AULA 09.
// Perfil público de qualquer pessoa, com a lista de faixas e `isOwner`. A rota
// é pública (optionalAuth no back-end): o token, se existir, só serve pra a
// API dizer se quem está olhando é o dono do perfil.
export function getPublicProfile(username) {
  return api.get(`/profile/${encodeURIComponent(username)}`)
}
