import { defineStore } from 'pinia'
import { login as loginRequest, logout as logoutRequest } from '../services/authService'
import { STORAGE_KEYS } from '../config/constants'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem(STORAGE_KEYS.TOKEN) || null,
    user: JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || 'null'),
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
  },

  actions: {
    async login(payload) {
      const response = await loginRequest(payload)

      this.token = response.data.token
      this.user = response.data.user

      localStorage.setItem(STORAGE_KEYS.TOKEN, this.token)
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(this.user))

      return response
    },

    // ADICIONADO NA AULA 05.
    // Chamado pela tela de Meu Perfil depois de um PUT /profile/me com
    // sucesso, pra manter `this.user` (e o localStorage) sincronizados com o
    // que a API confirmou ter salvo -- sem isso, só um F5 traria os dados
    // novos de volta pra store.
    updateUser(updatedUser) {
      this.user = updatedUser
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(this.user))
    },

    async logout() {
      try {
        await logoutRequest()
      } catch (error) {
        // Stateless (JWT puro): mesmo se essa chamada falhar (ex.: API fora
        // do ar), a sessão local é limpa do mesmo jeito.
      }

      this.token = null
      this.user = null
      localStorage.removeItem(STORAGE_KEYS.TOKEN)
      localStorage.removeItem(STORAGE_KEYS.USER)
    },
  },
})
