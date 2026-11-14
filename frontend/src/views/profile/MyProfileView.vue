<script setup>
import { onMounted, reactive, ref } from 'vue'
import { getMyProfile, updateProfile } from '../../services/authService'
import { useAuth } from '../../composables/useAuth'
import { LIMITS } from '../../config/constants'
import { resolveProfilePicture } from '../../utils/media'
import FormCard from '../../components/base/FormCard.vue'
import BaseInput from '../../components/base/BaseInput.vue'
import BaseButton from '../../components/base/BaseButton.vue'

const { updateUser } = useAuth()

const isLoading = ref(true)
const isSubmitting = ref(false)
const loadErrorMessage = ref('')
const apiErrorMessage = ref('')
const successMessage = ref('')

const form = reactive({
  fullName: '',
  bio: '',
})

const errors = reactive({
  fullName: '',
  bio: '',
})

// Arquivo escolhido no <input type="file">, ainda não enviado.
const selectedFile = ref(null)

// URL da foto ATUAL, salva no perfil (vem do backend).
const currentPictureUrl = ref('')

// URL de pré-visualização LOCAL, gerada com URL.createObjectURL -- não faz
// nenhuma chamada de rede, só lê o arquivo que já está na memória do
// navegador. Enquanto o usuário não escolhe um arquivo novo, é null e a tela
// mostra currentPictureUrl no lugar.
//
// Nota sobre não usar BaseInput aqui: v-model não funciona em
// <input type="file"> (o navegador não deixa JS setar esse valor por
// segurança), então o seletor de foto continua um <input> nativo com
// @change, fora do BaseInput -- que foi desenhado pra campos de texto.
const previewUrl = ref(null)

// Se a foto (atual ou a padrão) falhar ao carregar -- 404, servidor fora do
// ar, etc. -- troca pra um placeholder local em SVG (data URI), que nunca
// depende de rede. Sem isso, o navegador renderiza o `alt` como texto solto
// dentro do círculo, ignorando object-fit/border-radius.
const FALLBACK_AVATAR =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
      <rect width="96" height="96" fill="#e5e0f7"/>
      <circle cx="48" cy="38" r="18" fill="#b8a8ec"/>
      <ellipse cx="48" cy="88" rx="32" ry="26" fill="#b8a8ec"/>
    </svg>`
  )

function handleImageError(event) {
  event.target.src = FALLBACK_AVATAR
}

onMounted(async () => {
  try {
    const response = await getMyProfile()
    const profile = response.data

    form.fullName = profile.fullName || ''
    form.bio = profile.bio || ''
    currentPictureUrl.value = resolveProfilePicture(profile.profilePicture)
  } catch (error) {
    loadErrorMessage.value = error.message
  } finally {
    isLoading.value = false
  }
})

function handleFileChange(event) {
  const file = event.target.files[0]

  if (!file) {
    selectedFile.value = null
    previewUrl.value = null
    return
  }

  selectedFile.value = file

  // Libera a URL de preview anterior (se houver) antes de criar uma nova,
  // pra não vazar memória trocando de foto várias vezes antes de salvar.
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
  previewUrl.value = URL.createObjectURL(file)
}

function validate() {
  errors.fullName = ''
  errors.bio = ''

  if (!form.fullName.trim()) {
    errors.fullName = 'O nome completo não pode ficar vazio.'
  }

  if (form.bio.length > LIMITS.BIO_MAX) {
    errors.bio = `A bio deve ter no máximo ${LIMITS.BIO_MAX} caracteres.`
  }

  return !errors.fullName && !errors.bio
}

async function handleSubmit() {
  apiErrorMessage.value = ''
  successMessage.value = ''

  if (!validate()) {
    return
  }

  isSubmitting.value = true

  try {
    // FormData (não um objeto comum): é o formato que permite misturar
    // campos de texto com um arquivo binário no mesmo corpo de requisição
    // (multipart/form-data) -- um JSON puro não comporta um arquivo.
    const formData = new FormData()
    formData.append('fullName', form.fullName.trim())
    formData.append('bio', form.bio.trim())

    // Só anexa o campo do arquivo se o usuário realmente trocou de foto
    // nesta edição -- assim o backend sabe que deve manter a foto atual.
    if (selectedFile.value) {
      formData.append('profilePicture', selectedFile.value)
    }

    const response = await updateProfile(formData)
    const updatedProfile = response.data

    updateUser(updatedProfile)
    currentPictureUrl.value = resolveProfilePicture(updatedProfile.profilePicture)

    // A foto salva já está refletida em currentPictureUrl; a prévia local
    // não é mais necessária.
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value)
    }
    previewUrl.value = null
    selectedFile.value = null

    successMessage.value = response.message
  } catch (error) {
    apiErrorMessage.value = error.message
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <FormCard title="Meu Perfil" icon="bi-person-circle">
    <p v-if="isLoading">Carregando...</p>
    <p v-else-if="loadErrorMessage" class="api-error">{{ loadErrorMessage }}</p>

    <form v-else @submit.prevent="handleSubmit">
      <div class="picture-field">
        <img
          :src="previewUrl || currentPictureUrl"
          alt="Foto de perfil"
          class="picture-preview"
          @error="handleImageError"
        />
        <div>
          <label for="profilePicture" class="picture-label">
            <i class="bi bi-camera"></i> Trocar foto
          </label>
          <input
            id="profilePicture"
            type="file"
            accept="image/png, image/jpeg, image/webp"
            class="picture-input"
            @change="handleFileChange"
          />
        </div>
      </div>

      <BaseInput
        id="fullName"
        label="Nome completo"
        icon="bi-person"
        v-model="form.fullName"
        :error="errors.fullName"
      />

      <BaseInput
        id="bio"
        label="Bio"
        type="textarea"
        icon="bi-chat-quote"
        :maxlength="LIMITS.BIO_MAX"
        v-model="form.bio"
        :error="errors.bio"
      />

      <p v-if="apiErrorMessage" class="api-error">{{ apiErrorMessage }}</p>
      <p v-if="successMessage" class="api-success">{{ successMessage }}</p>

      <BaseButton type="submit" :disabled="isSubmitting">
        {{ isSubmitting ? 'Salvando...' : 'Salvar alterações' }}
      </BaseButton>
    </form>
  </FormCard>
</template>

<style scoped>
.picture-field {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.picture-preview {
  width: 88px;
  height: 88px;
  min-width: 88px; /* evita o círculo espremer/esticar dentro do flex */
  border-radius: 50%;
  object-fit: cover;
  background: #e5e5e5;
  border: 2px solid var(--brand-color, #7c3aed);
  overflow: hidden; /* garante que nada vaze do círculo */
}
.picture-label {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-bottom: 0.3rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--brand-color, #7c3aed);
  cursor: pointer;
}

/* Esconde o input nativo (feio: "Escolher arquivo / Nenhum arquivo
   escolhido") sem desabilitá-lo -- o <label for="profilePicture"> continua
   clicável e aciona ele normalmente. */
.picture-input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
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
