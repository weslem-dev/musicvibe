<script setup>
import { reactive, ref, watch } from 'vue'
import BaseButton from '../base/BaseButton.vue'
import BaseInput from '../base/BaseInput.vue'
import BaseModal from '../base/BaseModal.vue'
import { LIMITS } from '../../config/constants'
import { createPlaylist } from '../../services/playlistService'

// ADICIONADO NA AULA 13. Formulário "Nova playlist" dentro do BaseModal.
// Avisa o pai com `created` (a playlist que a API devolveu); quem a coloca na
// lista é o pai.
const open = defineModel({ type: Boolean, default: false })
const emit = defineEmits(['created'])

const FORM_ID = 'create-playlist-form'

const form = reactive({ title: '', description: '', isPublic: false })
const errors = reactive({ title: '', description: '' })
const apiError = ref('')
const isSubmitting = ref(false)

// Cada abertura começa do zero (privada por padrão).
watch(open, (isOpen) => {
  if (!isOpen) return
  form.title = ''
  form.description = ''
  form.isPublic = false
  errors.title = ''
  errors.description = ''
  apiError.value = ''
})

// Validação do CLIENTE, sobre o texto SEM os espaços das pontas: se falhar, a
// API nem é chamada (nenhuma requisição, nenhum toast).
function validate() {
  errors.title = ''
  errors.description = ''

  const title = form.title.trim()

  if (title.length < LIMITS.PLAYLIST_TITLE_MIN || title.length > LIMITS.PLAYLIST_TITLE_MAX) {
    errors.title = `O título deve ter entre ${LIMITS.PLAYLIST_TITLE_MIN} e ${LIMITS.PLAYLIST_TITLE_MAX} caracteres.`
  }

  if (form.description.trim().length > LIMITS.PLAYLIST_DESCRIPTION_MAX) {
    errors.description = `A descrição deve ter no máximo ${LIMITS.PLAYLIST_DESCRIPTION_MAX} caracteres.`
  }

  return !errors.title && !errors.description
}

async function handleSubmit() {
  apiError.value = ''

  if (!validate()) return

  isSubmitting.value = true

  try {
    const response = await createPlaylist({
      title: form.title.trim(),
      description: form.description.trim(),
      isPublic: form.isPublic,
    })

    emit('created', response.data)
    open.value = false
  } catch (error) {
    // É um FORMULÁRIO: o erro fica no próprio modal (o service usa silent: true,
    // então o interceptor não mostra toast).
    apiError.value = error.message
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <BaseModal v-model="open" title="Nova playlist" :busy="isSubmitting">
    <!-- novalidate: quem valida é o validate() acima (mensagens em português e com
         os mesmos LIMITS da API), não o balão nativo do navegador. -->
    <form :id="FORM_ID" novalidate @submit.prevent="handleSubmit">
      <BaseInput
        id="playlist-title"
        v-model="form.title"
        label="Título"
        icon="bi-music-note-list"
        placeholder="Ex.: Para correr"
        :error="errors.title"
      />

      <BaseInput
        id="playlist-description"
        v-model="form.description"
        label="Descrição (opcional)"
        type="textarea"
        :maxlength="LIMITS.PLAYLIST_DESCRIPTION_MAX"
        :error="errors.description"
      />

      <label class="public-toggle">
        <input id="playlist-public" v-model="form.isPublic" type="checkbox" />
        <span>
          <strong>Pública</strong>
          <small>Qualquer pessoa com o link pode ver. Desmarcada, só você vê.</small>
        </span>
      </label>

      <p v-if="apiError" class="create-error" role="alert">{{ apiError }}</p>
    </form>

    <template #footer>
      <BaseButton variant="secondary" :disabled="isSubmitting" @click="open = false">Cancelar</BaseButton>
      <!-- O botão está no rodapé, FORA do <form>: o atributo form="..." liga os dois,
           e Enter num campo também envia. -->
      <BaseButton type="submit" :form="FORM_ID" icon="bi-plus-lg" :disabled="isSubmitting">
        {{ isSubmitting ? 'Criando...' : 'Criar playlist' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>

<style scoped>
.public-toggle {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  margin: 0.25rem 0 0.5rem;
  cursor: pointer;
}

.public-toggle input {
  margin-top: 0.2rem;
  width: 1rem;
  height: 1rem;
  accent-color: var(--brand-color, #7c3aed);
}

.public-toggle span {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.public-toggle small {
  color: #666;
}

.create-error {
  margin: 0.5rem 0 0;
  font-size: 0.9rem;
  color: #d33;
}
</style>
