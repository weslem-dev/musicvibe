<script setup>
import { reactive, ref } from 'vue'
import { uploadTrack } from '../services/trackService'
import { LIMITS } from '../config/constants'
import FormCard from '../components/base/FormCard.vue'
import BaseInput from '../components/base/BaseInput.vue'
import BaseButton from '../components/base/BaseButton.vue'

const form = reactive({
  title: '',
  description: '',
})

const errors = reactive({
  title: '',
  description: '',
  audioFile: '',
  cover: '',
})

const audioInput = ref(null)
const coverInput = ref(null)
const selectedAudio = ref(null)
const selectedCover = ref(null)

// Preview local da capa -- URL.createObjectURL, sem chamada de rede, igual
// ao preview de foto de perfil da Aula 05.
const coverPreviewUrl = ref(null)

const isSubmitting = ref(false)
const uploadProgress = ref(0) // 0 a 100
const apiErrorMessage = ref('')
const successMessage = ref('')

function handleAudioChange(event) {
  selectedAudio.value = event.target.files[0] || null
}

function handleCoverChange(event) {
  const file = event.target.files[0] || null
  selectedCover.value = file

  if (coverPreviewUrl.value) {
    URL.revokeObjectURL(coverPreviewUrl.value)
  }
  coverPreviewUrl.value = file ? URL.createObjectURL(file) : null
}

function handleCoverError(event) {
  event.target.style.visibility = 'hidden'
}

function validate() {
  errors.title = ''
  errors.description = ''
  errors.audioFile = ''
  errors.cover = ''

  if (!form.title.trim()) {
    errors.title = 'O título é obrigatório.'
  } else if (form.title.trim().length > LIMITS.TITLE_MAX) {
    errors.title = `O título deve ter no máximo ${LIMITS.TITLE_MAX} caracteres.`
  }

  if (form.description.length > LIMITS.DESCRIPTION_MAX) {
    errors.description = `A descrição deve ter no máximo ${LIMITS.DESCRIPTION_MAX} caracteres.`
  }

  if (!selectedAudio.value) {
    errors.audioFile = 'Selecione o arquivo de áudio da faixa.'
  }

  if (!selectedCover.value) {
    errors.cover = 'Selecione uma imagem de capa.'
  }

  return !errors.title && !errors.description && !errors.audioFile && !errors.cover
}

async function handleSubmit() {
  apiErrorMessage.value = ''
  successMessage.value = ''

  if (!validate()) {
    return
  }

  isSubmitting.value = true
  uploadProgress.value = 0

  try {
    const formData = new FormData()
    formData.append('title', form.title.trim())
    formData.append('description', form.description.trim())
    formData.append('audioFile', selectedAudio.value)
    formData.append('cover', selectedCover.value)

    const response = await uploadTrack(formData, (progressEvent) => {
      if (!progressEvent.total) return
      uploadProgress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total)
    })

    successMessage.value = response.message

    // Limpa o formulário pra não reenviar a mesma faixa sem querer. A pessoa
    // segue pro link "Minhas Faixas" da mensagem quando quiser (antes, a tela
    // redirecionava sozinha depois de 1,2 s -- o que escondia a mensagem).
    form.title = ''
    form.description = ''
    selectedAudio.value = null
    selectedCover.value = null
    if (coverPreviewUrl.value) {
      URL.revokeObjectURL(coverPreviewUrl.value)
      coverPreviewUrl.value = null
    }
    if (audioInput.value) audioInput.value.value = ''
    if (coverInput.value) coverInput.value.value = ''
  } catch (error) {
    apiErrorMessage.value = error.message
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <FormCard title="Enviar Faixa" icon="bi-cloud-upload">
    <form @submit.prevent="handleSubmit">
      <BaseInput
        id="title"
        label="Título"
        icon="bi-music-note"
        v-model="form.title"
        :error="errors.title"
      />

      <BaseInput
        id="description"
        label="Descrição"
        type="textarea"
        icon="bi-chat-quote"
        :maxlength="LIMITS.DESCRIPTION_MAX"
        v-model="form.description"
        :error="errors.description"
      />

      <div class="file-field">
        <label for="audioFile"><i class="bi bi-file-earmark-music"></i> Arquivo de áudio (MP3 ou WAV)</label>
        <input
          id="audioFile"
          ref="audioInput"
          type="file"
          accept="audio/mpeg, audio/mp3, audio/wav"
          @change="handleAudioChange"
        />
        <span v-if="selectedAudio" class="file-name">{{ selectedAudio.name }}</span>
        <span v-if="errors.audioFile" class="field-error">{{ errors.audioFile }}</span>
      </div>

      <div class="file-field">
        <label for="cover"><i class="bi bi-image"></i> Imagem de capa (JPG, PNG ou WEBP)</label>
        <input
          id="cover"
          ref="coverInput"
          type="file"
          accept="image/png, image/jpeg, image/webp"
          @change="handleCoverChange"
        />
        <span v-if="errors.cover" class="field-error">{{ errors.cover }}</span>

        <img
          v-if="coverPreviewUrl"
          :src="coverPreviewUrl"
          alt="Prévia da capa"
          class="thumbnail-preview"
          @error="handleCoverError"
        />
      </div>

      <div v-if="isSubmitting" class="progress-wrapper">
        <div class="progress-bar" :style="{ width: uploadProgress + '%' }"></div>
        <span class="progress-label">{{ uploadProgress }}%</span>
      </div>

      <p v-if="apiErrorMessage" class="api-error">{{ apiErrorMessage }}</p>
      <p v-if="successMessage" class="api-success">
        {{ successMessage }}
        <router-link to="/my-tracks">Ver em Minhas Faixas</router-link>
      </p>

      <BaseButton type="submit" :disabled="isSubmitting">
        {{ isSubmitting ? `Enviando... ${uploadProgress}%` : 'Enviar Faixa' }}
      </BaseButton>
    </form>
  </FormCard>
</template>

<style scoped>
.file-field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  margin-bottom: 1.1rem;
}
.file-field label {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
}
.file-name {
  font-size: 0.82rem;
  color: #666;
}
.field-error {
  font-size: 0.82rem;
  color: #d33;
}

.thumbnail-preview {
  margin-top: 0.5rem;
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
  border: 2px solid var(--brand-color, #7c3aed);
}

.progress-wrapper {
  position: relative;
  width: 100%;
  height: 22px;
  background: #eee;
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 1.1rem;
}
.progress-bar {
  height: 100%;
  background: var(--brand-color, #7c3aed);
  transition: width 0.15s ease;
}
.progress-label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.78rem;
  font-weight: 600;
  color: #333;
  mix-blend-mode: difference;
  filter: invert(1);
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
