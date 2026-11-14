<script setup>
import { onBeforeUnmount, watch } from 'vue'

// ADICIONADO NA AULA 09.
// Modal genérico: não sabe nada de faixa, exclusão ou perfil. Quem usa
// controla se está aberto com v-model e coloca o conteúdo nos slots.
//
//   <BaseModal v-model="aberto" title="Excluir faixa" :busy="excluindo">
//     ...conteúdo...
//     <template #footer> ...botões... </template>
//   </BaseModal>
const open = defineModel({ type: Boolean, default: false })

const props = defineProps({
  title: { type: String, default: '' },
  // Enquanto uma operação está em andamento (ex.: excluindo), o modal não
  // pode ser fechado por X, clique fora ou Esc -- senão a pessoa "cancelaria"
  // algo que já foi enviado ao servidor.
  busy: { type: Boolean, default: false },
})

function close() {
  if (props.busy) return
  open.value = false
}

function handleKeydown(event) {
  if (event.key === 'Escape') close()
}

// O listener de Esc só existe enquanto o modal está ABERTO, e a rolagem da
// página por trás fica travada. Tudo é desfeito ao fechar (ou se o componente
// for destruído com o modal aberto).
watch(
  open,
  (isOpen) => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeydown)
      document.body.style.overflow = 'hidden'
    } else {
      document.removeEventListener('keydown', handleKeydown)
      document.body.style.overflow = ''
    }
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <!-- Teleport: o HTML do modal é montado direto no <body>, e não dentro do
       componente que o usa. Se ficasse dentro de um card, qualquer
       transform/overflow/z-index desse card (ex.: o :hover do TrackCard, que
       usa transform) mudaria o "referencial" do position: fixed e o modal
       deixaria de ficar centralizado na tela. -->
  <Teleport to="body">
    <!-- .self: só fecha se o clique foi NO fundo escuro. Um clique dentro da
         caixa branca tem como alvo um elemento da caixa, não o fundo, então
         não fecha. -->
    <div v-if="open" class="modal-backdrop" @click.self="close">
      <div class="modal-box" role="dialog" aria-modal="true" :aria-label="title">
        <header class="modal-header">
          <h2 class="modal-title">{{ title }}</h2>
          <button type="button" class="modal-close" aria-label="Fechar" :disabled="busy" @click="close">
            <i class="bi bi-x-lg"></i>
          </button>
        </header>

        <div class="modal-body">
          <slot />
        </div>

        <footer v-if="$slots.footer" class="modal-footer">
          <slot name="footer" />
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(20, 10, 40, 0.55);
}

.modal-box {
  box-sizing: border-box;
  width: 100%;
  max-width: 440px;
  padding: 1.5rem;
  background: #fff;
  border-radius: 16px;
  border-top: 4px solid var(--brand-color, #7c3aed);
  box-shadow: 0 12px 40px rgba(20, 10, 40, 0.3);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.modal-title {
  margin: 0;
  font-size: 1.2rem;
}

.modal-close {
  display: inline-flex;
  padding: 0.35rem;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #666;
  font-size: 1rem;
  cursor: pointer;
}

.modal-close:hover:not(:disabled) {
  background: #f0eef7;
}

.modal-close:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.modal-body {
  color: #333;
  line-height: 1.5;
}

.modal-footer {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
}
</style>
