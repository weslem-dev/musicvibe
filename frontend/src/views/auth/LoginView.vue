<script setup>
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '../../composables/useAuth'
import FormCard from '../../components/base/FormCard.vue'
import BaseInput from '../../components/base/BaseInput.vue'
import BaseButton from '../../components/base/BaseButton.vue'

const router = useRouter()
const route = useRoute()
const { login } = useAuth()

const form = reactive({
  email: '',
  password: '',
})

const errors = reactive({
  email: '',
  password: '',
})

const isSubmitting = ref(false)
const apiErrorMessage = ref('')

function validate() {
  errors.email = ''
  errors.password = ''

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailPattern.test(form.email)) {
    errors.email = 'Informe um e-mail válido.'
  }

  if (!form.password) {
    errors.password = 'A senha é obrigatória.'
  }

  return !errors.email && !errors.password
}

async function handleSubmit() {
  apiErrorMessage.value = ''

  if (!validate()) {
    return
  }

  isSubmitting.value = true

  try {
    await login({
      email: form.email.trim(),
      password: form.password,
    })

    // Se veio de uma rota protegida (redirecionado pelo guard do router),
    // volta pra ela depois do login. Senão, vai pra Landing.
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    router.push(redirect)
  } catch (error) {
    // error.message já vem tratado pelo interceptor do api.js (Aula 02/04)
    apiErrorMessage.value = error.message
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <FormCard title="Entrar" icon="bi-music-note-beamed">
    <form @submit.prevent="handleSubmit">
      <BaseInput
        id="email"
        label="E-mail"
        type="email"
        icon="bi-envelope"
        v-model="form.email"
        :error="errors.email"
      />

      <BaseInput
        id="password"
        label="Senha"
        type="password"
        icon="bi-lock"
        v-model="form.password"
        :error="errors.password"
      />

      <p v-if="apiErrorMessage" class="api-error">{{ apiErrorMessage }}</p>

      <BaseButton type="submit" :disabled="isSubmitting">
        {{ isSubmitting ? 'Entrando...' : 'Entrar' }}
      </BaseButton>
    </form>

    <template #footer>
      Não tem conta? <router-link to="/register">Criar Conta</router-link>
    </template>
  </FormCard>
</template>

<style scoped>
.api-error {
  color: #d33;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}
</style>
