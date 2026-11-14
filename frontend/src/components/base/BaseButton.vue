<script setup>
defineProps({
  type: { type: String, default: 'button' }, // repassado pro <button> nativo
  variant: { type: String, default: 'primary' }, // primary | secondary | danger
  disabled: { type: Boolean, default: false },
  icon: { type: String, default: '' }, // classe do bootstrap-icons
})
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    class="base-button"
    :class="[`base-button--${variant}`]"
  >
    <i v-if="icon" :class="['bi', icon]"></i>
    <slot />
  </button>
</template>

<style scoped>
.base-button {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.7rem 1.25rem;
  border-radius: 8px;
  border: 1px solid transparent;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s ease, background-color 0.15s ease;
}

.base-button--primary {
  background: var(--brand-color, #7c3aed);
  color: #fff;
}

.base-button--primary:hover:not(:disabled) {
  background: var(--brand-color-dark, #5b21b6);
}

.base-button--secondary {
  background: transparent;
  color: var(--brand-color, #7c3aed);
  border-color: var(--brand-color, #7c3aed);
}

/* ADICIONADO NA AULA 09: ação destrutiva (excluir). Mesmo vermelho já usado
   nas mensagens de erro do projeto, nenhuma cor nova. */
.base-button--danger {
  background: #d33;
  color: #fff;
}

.base-button--danger:hover:not(:disabled) {
  background: #b32727;
}

.base-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
