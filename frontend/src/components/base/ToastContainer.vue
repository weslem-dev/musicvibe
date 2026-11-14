<script setup>
import { useToast } from '../../composables/useToast'

// ADICIONADO NA AULA 12. Desenha a lista de toasts. Montado UMA vez, no App.vue.
const { toasts, dismiss } = useToast()

const ICONS = {
  success: 'bi-check-circle-fill',
  error: 'bi-exclamation-triangle-fill',
  info: 'bi-info-circle-fill',
}
</script>

<template>
  <!-- Teleport para o <body> + z-index maior que o do BaseModal (1000): o toast
       aparece NA FRENTE do modal. Um erro numa ação feita dentro de um modal
       (ex.: excluir sem conexão) precisa ser visto sem fechar o modal. -->
  <Teleport to="body">
    <div class="toast-container" aria-live="polite">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast"
          :class="`toast--${toast.type}`"
          :role="toast.type === 'error' ? 'alert' : 'status'"
          @click="dismiss(toast.id)"
        >
          <i class="bi" :class="ICONS[toast.type]"></i>
          <span class="toast__message">{{ toast.message }}</span>
          <button type="button" class="toast__close" aria-label="Fechar aviso" @click.stop="dismiss(toast.id)">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 2000; /* acima do BaseModal (1000) */
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  width: min(380px, calc(100vw - 2rem));
  pointer-events: none; /* o espaço vazio do container não bloqueia cliques na página */
}

.toast {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  padding: 0.75rem 0.9rem;
  border-radius: 10px;
  border-left: 5px solid;
  background: #fff;
  box-shadow: 0 6px 24px rgba(20, 10, 40, 0.22);
  color: #222;
  font-size: 0.92rem;
  line-height: 1.4;
  cursor: pointer;
  pointer-events: auto;
}

.toast i:first-child {
  margin-top: 0.1rem;
  font-size: 1.05rem;
}

.toast--success {
  border-color: #2a8f4d;
}

.toast--success i:first-child {
  color: #2a8f4d;
}

.toast--error {
  border-color: #d33;
}

.toast--error i:first-child {
  color: #d33;
}

.toast--info {
  border-color: var(--brand-color, #7c3aed);
}

.toast--info i:first-child {
  color: var(--brand-color, #7c3aed);
}

.toast__message {
  flex: 1;
  min-width: 0;
}

.toast__close {
  display: inline-flex;
  padding: 0.15rem;
  border: none;
  background: transparent;
  color: #777;
  cursor: pointer;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(24px);
}
</style>
