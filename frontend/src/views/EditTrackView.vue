<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import FormCard from '../components/base/FormCard.vue'
import BaseInput from '../components/base/BaseInput.vue'
import BaseButton from '../components/base/BaseButton.vue'
import { getTrackForEdit, updateTrack } from '../services/trackService'
import { LIMITS } from '../config/constants'
import { resolveCoverUrl, FALLBACK_COVER } from '../utils/media'

const route = useRoute()
// computed (e não uma constante lida uma vez): se o :id da URL mudar com esta
// tela já aberta, trackId acompanha e o watch abaixo recarrega os dados.
const trackId = computed(() => route.params.id)

const form = reactive({ title: '', description: '' })
const errors = reactive({ title: '', description: '' })

const isLoading = ref(true)
const loadError = ref('') // 403 (não é seu) e 404 (não existe) caem aqui
const isSubmitting = ref(false)
const apiErrorMessage = ref('')
const successMessage = ref('')

// Capa que está SALVA no servidor (vem da API).
const currentCover = ref('')
// Capa nova escolhida, ainda NÃO enviada, e a prévia local dela
// (URL.createObjectURL: lê o arquivo da memória do navegador, sem rede).
const selectedCover = ref(null)
const coverPreviewUrl = ref(null)
const coverInput = ref(null)

async function loadTrack(id) {
  isLoading.value = true
  loadError.value = ''
  apiErrorMessage.value = ''
  successMessage.value = ''
  selectedCover.value = null
  revokePreview()

  try {
    const response = await getTrackForEdit(id)
    form.title = response.data.title
    form.description = response.data.description || ''
    currentCover.value = response.data.cover
  } catch (error) {
    // Mostra a mensagem da API (permissão / não encontrada) no lugar do
    // formulário, em vez de deixar a tela quebrada.
    loadError.value = error.message
  } finally {
    isLoading.value = false
  }
}

onMounted(() => loadTrack(trackId.value))

// O Vue Router reaproveita ESTE componente quando só o :id muda; sem o watch,
// a tela continuaria mostrando os dados (ou o erro) da faixa anterior.
watch(trackId, (newId) => {
  if (newId) loadTrack(newId)
})

function revokePreview() {
  if (coverPreviewUrl.value) {
    URL.revokeObjectURL(coverPreviewUrl.value)
    coverPreviewUrl.value = null
  }
}

onBeforeUnmount(revokePreview)

function handleCoverChange(event) {
  const file = event.target.files[0] || null
  selectedCover.value = file

  revokePreview()
  if (file) {
    coverPreviewUrl.value = URL.createObjectURL(file)
  }
}

function handleCoverError(event) {
  event.target.src = FALLBACK_COVER
}

// Validação do CLIENTE: se falhar, handleSubmit nem chega a montar o
// FormData, então nenhuma requisição sai (dá pra confirmar na aba Network).
function validate() {
  errors.title = ''
  errors.description = ''

  if (!form.title.trim()) {
    errors.title = 'O título é obrigatório.'
  } else if (form.title.trim().length > LIMITS.TITLE_MAX) {
    errors.title = `O título deve ter no máximo ${LIMITS.TITLE_MAX} caracteres.`
  }

  if (form.description.length > LIMITS.DESCRIPTION_MAX) {
    errors.description = `A descrição deve ter no máximo ${LIMITS.DESCRIPTION_MAX} caracteres.`
  }

  return !errors.title && !errors.description
}

async function handleSubmit() {
  apiErrorMessage.value = ''
  successMessage.value = ''

  if (!validate()) return

  isSubmitting.value = true

  try {
    const formData = new FormData()
    formData.append('title', form.title.trim())
    formData.append('description', form.description.trim())

    // Só anexa a capa se a pessoa escolheu uma nova: sem o campo, o
    // back-end mantém a capa atual.
    if (selectedCover.value) {
      formData.append('cover', selectedCover.value)
    }

    const response = await updateTrack(trackId.value, formData)

    // A capa nova virou a capa salva; a prévia local não é mais necessária.
    currentCover.value = response.data.cover
    selectedCover.value = null
    revokePreview()
    if (coverInput.value) coverInput.value.value = ''

    successMessage.value = response.message
  } catch (error) {
    apiErrorMessage.value = error.message
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <FormCard title="Editar Faixa" icon="bi-pencil-square">
    <p v-if="isLoading">Carregando faixa...</p>

    <div v-else-if="loadError" class="edit-error">
      <i class="bi bi-shield-exclamation"></i>
      <p>{{ loadError }}</p>
      <router-link to="/my-tracks">Voltar para Minhas Faixas</router-link>
    </div>

    <form v-else @submit.prevent="handleSubmit">
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

      <div class="cover-field">
        <label for="cover"><i class="bi bi-image"></i> Capa (opcional)</label>

        <img
          :src="coverPreviewUrl || resolveCoverUrl(currentCover)"
          alt="Capa da faixa"
          class="thumbnail-preview"
          @error="handleCoverError"
        />
        <span v-if="coverPreviewUrl" class="cover-hint">Prévia da nova capa (ainda não salva)</span>

        <input
          id="cover"
          ref="coverInput"
          type="file"
          accept="image/png, image/jpeg, image/webp"
          @change="handleCoverChange"
        />
        <span class="cover-hint">
          O áudio não pode ser trocado. Para isso, exclua a faixa e envie de novo.
        </span>
      </div>

      <p v-if="apiErrorMessage" class="api-error">{{ apiErrorMessage }}</p>

      <div v-if="successMessage" class="api-success">
        <p>{{ successMessage }}</p>
        <router-link :to="{ name: 'track-detail', params: { id: trackId } }">Ver faixa</router-link>
        ·
        <router-link to="/my-tracks">Minhas Faixas</router-link>
      </div>

      <BaseButton type="submit" :disabled="isSubmitting">
        {{ isSubmitting ? 'Salvando...' : 'Salvar alterações' }}
      </BaseButton>
    </form>
  </FormCard>
</template>

<style scoped>
.cover-field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-bottom: 1.1rem;
}

.cover-field label {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
}

.thumbnail-preview {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
  border: 2px solid var(--brand-color, #7c3aed);
  background: #e5e0f7;
}

.cover-hint {
  font-size: 0.8rem;
  color: #777;
}

.edit-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem 0;
  text-align: center;
  color: #d33;
}

.edit-error i {
  font-size: 2rem;
}

.edit-error p {
  margin: 0;
}

.api-error {
  color: #d33;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.api-success {
  margin-bottom: 1rem;
  font-size: 0.9rem;
  color: #2a8f4d;
}

.api-success p {
  margin: 0 0 0.25rem;
}
</style>
