import { computed } from 'vue'
import { useAuthStore } from '../stores/auth'

// ADICIONADO NA AULA 06.
//
// Diferença entre isto e um componente (ex.: BaseInput.vue): um componente
// tem um <template> e aparece na tela; um composable é só uma função
// JavaScript que empresta lógica reativa (aqui, o acesso à store de
// autenticação) para quem chamar -- não renderiza nada sozinho. `useAuth()`
// pode ser chamado dentro de um componente Vue (Navbar, Sidebar), mas
// também fora de um, como no guarda de rota (router/index.js), onde não
// existe `<template>` nenhum.
//
// Por que isto existe, em vez de cada arquivo chamar useAuthStore()
// direto: se amanhã a forma de checar "está logado?" mudar (ex.: passar a
// considerar um token expirado, não só presente), muda-se uma vez aqui --
// Navbar, Sidebar e o guarda de rota continuam chamando useAuth() do mesmo
// jeito, sem precisar saber desse detalhe.
export function useAuth() {
  const authStore = useAuthStore()

  const isAuthenticated = computed(() => authStore.isAuthenticated)
  const user = computed(() => authStore.user)
  const isAdmin = computed(() => !!authStore.user?.isAdmin)

  function login(payload) {
    return authStore.login(payload)
  }

  function logout() {
    return authStore.logout()
  }

  function updateUser(updatedUser) {
    authStore.updateUser(updatedUser)
  }

  return {
    isAuthenticated,
    user,
    isAdmin,
    login,
    logout,
    updateUser,
  }
}
