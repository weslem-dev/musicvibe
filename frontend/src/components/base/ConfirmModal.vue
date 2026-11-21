<script setup>
import BaseButton from './BaseButton.vue'
import BaseModal from './BaseModal.vue'

// ADICIONADO NA AULA 15. Uma confirmação pronta sobre o BaseModal: título,
// mensagem e dois botões. Quem decide o que acontece é o pai:
//   - `confirm`: a pessoa confirmou (o pai chama a API e passa :busy enquanto espera);
//   - `close`: cancelou, apertou Esc ou clicou fora (o pai limpa o seu estado).
//
//   <ConfirmModal v-if="userToBlock" title="Bloquear usuário" :message="..."
//     confirm-label="Bloquear" :busy="isSaving" @confirm="..." @close="userToBlock = null" />
//
// O pai monta com v-if (o modal existe enquanto houver algo para confirmar), por
// isso o BaseModal fica sempre aberto aqui e "fechar" é avisar o pai.
const props = defineProps({
  title: { type: String, required: true },
  message: { type: String, required: true },
  confirmLabel: { type: String, default: 'Confirmar' },
  confirmVariant: { type: String, default: 'danger' },
  busy: { type: Boolean, default: false },
})

const emit = defineEmits(['confirm', 'close'])

function handleOpenChange(value) {
  if (!value) emit('close')
}
</script>

<template>
  <BaseModal :model-value="true" :title="props.title" :busy="props.busy" @update:model-value="handleOpenChange">
    <p class="confirm-message">{{ props.message }}</p>

    <template #footer>
      <BaseButton variant="secondary" :disabled="props.busy" @click="emit('close')">Cancelar</BaseButton>
      <BaseButton :variant="props.confirmVariant" :disabled="props.busy" @click="emit('confirm')">
        {{ props.busy ? 'Aguarde...' : props.confirmLabel }}
      </BaseButton>
    </template>
  </BaseModal>
</template>

<style scoped>
.confirm-message {
  margin: 0;
  line-height: 1.5;
  white-space: pre-line;
}
</style>
