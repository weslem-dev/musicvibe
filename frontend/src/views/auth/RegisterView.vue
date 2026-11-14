<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { register } from '../../services/authService'
import { LIMITS } from '../../config/constants'
import FormCard from '../../components/base/FormCard.vue'
import BaseInput from '../../components/base/BaseInput.vue'
import BaseButton from '../../components/base/BaseButton.vue'

const router = useRouter()

const form = reactive({
  fullName: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const errors = reactive({
  fullName: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const isSubmitting = ref(false)
const apiErrorMessage = ref('')
const successMessage = ref('')

function validate() {
  Object.keys(errors).forEach((key) => (errors[key] = ''))

  if (!form.fullName.trim()) {
    errors.fullName = 'O nome completo é obrigatório.'
  }

  if (form.username.trim().length < LIMITS.USERNAME_MIN || form.username.trim().length > LIMITS.USERNAME_MAX) {
    errors.username = `O nome de usuário deve ter entre ${LIMITS.USERNAME_MIN} e ${LIMITS.USERNAME_MAX} caracteres.`
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailPattern.test(form.email)) {
    errors.email = 'Informe um e-mail válido.'
  }

  if (form.password.length < LIMITS.PASSWORD_MIN) {
    errors.password = `A senha deve ter pelo menos ${LIMITS.PASSWORD_MIN} caracteres.`
  }

  if (form.confirmPassword !== form.password) {
    errors.confirmPassword = 'As senhas não coincidem.'
  }

  return Object.values(errors).every((message) => message === '')
}

async function handleSubmit() {
  apiErrorMessage.value = ''
  successMessage.value = ''

  if (!validate()) {
    return
  }

  isSubmitting.value = true

  try {
    // A API espera exatamente estes campos (ver userValidator.js / Aula 03)
    const response = await register({
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password,
      confirmPassword: form.confirmPassword,
      fullName: form.fullName.trim(),
    })

    console.log('Conta criada:', response.data)
    successMessage.value = response.message

    setTimeout(() => {
      router.push({ name: 'login' })
    }, 1200)
  } catch (error) {
    // error.message já vem tratado pelo interceptor do api.js (Aula 02)
    apiErrorMessage.value = error.message
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <FormCard title="Criar Conta" icon="bi-person-plus">
    <form @submit.prevent="handleSubmit">
      <BaseInput
        id="fullName"
        label="Nome completo"
        icon="bi-person"
        v-model="form.fullName"
        :error="errors.fullName"
      />

      <BaseInput
        id="username"
        label="Usuário"
        icon="bi-at"
        v-model="form.username"
        :error="errors.username"
      />

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

      <BaseInput
        id="confirmPassword"
        label="Confirmar senha"
        type="password"
        icon="bi-lock-fill"
        v-model="form.confirmPassword"
        :error="errors.confirmPassword"
      />

      <p v-if="apiErrorMessage" class="api-error">{{ apiErrorMessage }}</p>
      <p v-if="successMessage" class="api-success">{{ successMessage }}</p>

      <BaseButton type="submit" :disabled="isSubmitting">
        {{ isSubmitting ? 'Criando conta...' : 'Criar Minha Conta' }}
      </BaseButton>
    </form>

    <template #footer>
      Já tem conta? <router-link to="/login">Entrar</router-link>
    </template>
  </FormCard>
</template>

<style scoped>
.api-error {
  color: #d33;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}
.api-success {
  color: #2a8f4d;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}
</style>
