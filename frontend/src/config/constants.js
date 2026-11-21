// ADICIONADO NA AULA 12 (Checkpoint 2).
// Todos os "números e textos soltos" do frontend moram aqui, para ter UM lugar
// onde mudar. Os LIMITS e o PAGE_SIZE precisam combinar com a API
// (backend/config/constants.js): se um mudar, o outro muda junto.

// Chaves do localStorage. Antes estavam escritas à mão em api.js (2 vezes) e em
// stores/auth.js; um erro de digitação numa delas "perdia" o login sem avisar.
export const STORAGE_KEYS = {
  TOKEN: 'musicvibe_token',
  USER: 'musicvibe_user',
}

// Limites de validação dos formulários (espelho de VALIDATION na API).
export const LIMITS = {
  USERNAME_MIN: 3,
  USERNAME_MAX: 20,
  PASSWORD_MIN: 6,
  BIO_MAX: 160,
  TITLE_MAX: 100,
  DESCRIPTION_MAX: 500,
  COMMENT_MAX: 500,
  // Aula 13: playlists (iguais a VALIDATION.PLAYLIST_* da API).
  PLAYLIST_TITLE_MIN: 3,
  PLAYLIST_TITLE_MAX: 100,
  PLAYLIST_DESCRIPTION_MAX: 500,
}

// Tamanho de página dos feeds. Igual a PAGINATION.DEFAULT_LIMIT da API (12);
// a API limita qualquer pedido a PAGINATION.MAX_LIMIT (50), então nunca peça mais.
export const PAGE_SIZE = 12

// Aula 13: busca. MIN_LENGTH igual a SEARCH.MIN_LENGTH da API (termo menor nem é
// enviado); DEBOUNCE_MS é quanto tempo a pessoa precisa parar de digitar para a
// busca sair.
export const SEARCH = {
  MIN_LENGTH: 2,
  DEBOUNCE_MS: 400,
}

// Aula 14: notificações. POLL_MS é o intervalo do sino perguntar à API quantas
// não lidas existem (30 s: o número fica "quase na hora" sem bombardear a API --
// com 1.000 pessoas logadas, são ~33 requisições por segundo, e não 1.000).
export const NOTIFICATIONS = {
  POLL_MS: 30000,
}

// Aula 14: o texto de cada tipo de notificação (as chaves são os TYPES da API).
export const NOTIFICATION_TEXT = {
  like: 'curtiu a sua faixa',
  comment: 'comentou na sua faixa',
  follow: 'começou a seguir você',
}

// Aula 14: os cinco motivos de denúncia, NA ORDEM, iguais aos da API
// (REPORT.REASONS). O banco guarda a CHAVE; a tela mostra o RÓTULO.
export const REPORT_REASONS = [
  { value: 'inappropriate_content', label: 'Conteúdo impróprio' },
  { value: 'harassment', label: 'Assédio ou discurso de ódio' },
  { value: 'spam', label: 'Spam ou golpes' },
  { value: 'copyright', label: 'Violação de direitos autorais' },
  { value: 'other', label: 'Outro' },
]

// Aula 15: os filtros da aba Denúncias do painel. Os `value` são os MESMOS da
// API (ADMIN.REPORT_FILTERS); o `label` é o que a tela mostra.
export const REPORT_FILTERS = [
  { value: 'pending', label: 'Pendentes' },
  { value: 'reviewed', label: 'Revisadas' },
  { value: 'all', label: 'Todas' },
]

// Quanto tempo (ms) cada tipo de toast fica na tela. Erro fica mais: dá tempo de ler.
export const TOAST_DURATION = {
  success: 3500,
  info: 4000,
  error: 6000,
}

// Mensagens padrão.
export const MESSAGES = {
  NETWORK_ERROR: 'Não foi possível se conectar ao servidor. Verifique sua conexão ou tente novamente mais tarde.',
  REQUEST_ERROR: 'Ocorreu um erro na requisição.',
  UNEXPECTED_ERROR: 'Erro inesperado ao preparar a requisição.',
  LOAD_ERROR: 'Não foi possível carregar os dados.',
}
