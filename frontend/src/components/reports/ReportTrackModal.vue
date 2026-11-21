<script setup>
import { ref } from 'vue'
import BaseButton from '../base/BaseButton.vue'
import BaseModal from '../base/BaseModal.vue'
import { REPORT_REASONS } from '../../config/constants'
import { reportTrack } from '../../services/reportService'

// ADICIONADO NA AULA 14. Modal "Denunciar faixa": um rádio por motivo (as cinco
// CHAVES fixas, com os rótulos em português). O pai monta com v-if, então cada
// abertura começa sem motivo marcado.
const open = defineModel({ type: Boolean, default: false })
const emit = defineEmits(['reported'])

const props = defineProps({
  trackId: { type: [Number, String], required: true },
})

const FORM_ID = 'report-track-form'

const reason = ref('')
const errorMessage = ref('')
const isSubmitting = ref(false)

async function handleSubmit() {
  errorMessage.value = ''

  // Motivo obrigatório: sem ele, a API nem é chamada.
  if (!reason.value) {
    errorMessage.value = 'Escolha um motivo para continuar.'
    return
  }

  isSubmitting.value = true

  try {
    const response = await reportTrack(props.trackId, reason.value)
    emit('reported', response)
  } catch (error) {
    // É um FORMULÁRIO (service com silent: true): o erro da API fica aqui dentro,
    // sem toast -- inclusive o 409 "Você já denunciou esta faixa." e a falta de rede.
    errorMessage.value = error.message
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <BaseModal v-model="open" title="Denunciar faixa" :busy="isSubmitting">
    <!-- novalidate: quem valida é o handleSubmit (mensagem em português). -->
    <form :id="FORM_ID" novalidate @submit.prevent="handleSubmit">
      <!-- fieldset desabilitado durante o envio: nenhum rádio muda no meio do caminho. -->
      <fieldset class="report-reasons" :disabled="isSubmitting">
        <legend>Por que você está denunciando esta faixa?</legend>

        <label v-for="option in REPORT_REASONS" :key="option.value" class="report-reason">
          <!-- Mesmo name nos cinco (um grupo só); :value é a CHAVE que vai para a API. -->
          <input v-model="reason" type="radio" name="report-reason" :value="option.value" />
          <span>{{ option.label }}</span>
        </label>
      </fieldset>

      <p class="report-hint">A denúncia vai para a moderação. Quem enviou a faixa não é avisado.</p>

      <p v-if="errorMessage" class="report-error" role="alert">{{ errorMessage }}</p>
    </form>

    <template #footer>
      <BaseButton variant="secondary" :disabled="isSubmitting" @click="open = false">Cancelar</BaseButton>
      <BaseButton type="submit" :form="FORM_ID" variant="danger" icon="bi-flag" :disabled="isSubmitting">
        {{ isSubmitting ? 'Enviando...' : 'Denunciar' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>

<style scoped>
.report-reasons {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin: 0;
  padding: 0;
  border: none;
}

.report-reasons legend {
  margin-bottom: 0.5rem;
  padding: 0;
  font-weight: 600;
}

.report-reason {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 0.6rem;
  border-radius: 8px;
  cursor: pointer;
}

.report-reason:hover {
  background: #f6f3ff;
}

.report-reason input {
  width: 1rem;
  height: 1rem;
  accent-color: var(--brand-color, #7c3aed);
}

.report-hint {
  margin: 0.75rem 0 0;
  font-size: 0.85rem;
  color: #666;
}

.report-error {
  margin: 0.5rem 0 0;
  font-size: 0.9rem;
  color: #d33;
}
</style>
