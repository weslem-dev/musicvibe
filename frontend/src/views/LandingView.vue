<script setup>
import { computed } from 'vue'
import { useAsyncData } from '../composables/useAsyncData'
import { getApiStatus } from '../services/systemService'

// Status da API: "verificando..." enquanto carrega, "offline" se falhar (um GET
// que falha é da tela: sem toast), ou o status que a API devolveu ("online").
const { data: status, isLoading, error } = useAsyncData(() => getApiStatus())

const apiStatus = computed(() => {
  if (isLoading.value) return 'verificando...'
  if (error.value) return 'offline'
  return status.value.status
})
</script>

<template>
  <div class="landing">
    <h1>Bem-vindo ao MusicVibe</h1>
    <p>Status da API: <strong>{{ apiStatus }}</strong></p>
  </div>
</template>
