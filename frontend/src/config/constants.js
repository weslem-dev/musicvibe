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
}

// Tamanho de página dos feeds. Igual a PAGINATION.DEFAULT_LIMIT da API (12);
// a API limita qualquer pedido a PAGINATION.MAX_LIMIT (50), então nunca peça mais.
export const PAGE_SIZE = 12

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
