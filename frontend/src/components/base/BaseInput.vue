<script setup>
// defineModel() (Vue 3.4+) substitui o par manual de `props: ['modelValue']`
// + `emits: ['update:modelValue']` que um componente com v-model precisava
// declarar antes. Com defineModel(), o componente ganha uma variável `model`
// já ligada nos dois sentidos: quando o pai muda v-model="form.email", o
// valor cai aqui dentro; quando o usuário digita e este componente muda
// `model.value`, o `update:modelValue` é emitido pro pai sozinho. Sem isso,
// cada BaseInput teria que declarar manualmente
// `defineProps(['modelValue'])` + `defineEmits(['update:modelValue'])` +
// `@input="$emit('update:modelValue', $event.target.value)"`.
const model = defineModel({ type: [String, Number], default: '' })

defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true },
  type: { type: String, default: 'text' }, // text | email | password | textarea
  icon: { type: String, default: '' }, // classe do bootstrap-icons, ex.: "bi-envelope"
  placeholder: { type: String, default: '' },
  error: { type: String, default: '' },
  maxlength: { type: [String, Number], default: undefined },
  rows: { type: [String, Number], default: 3 },
})
</script>

<template>
  <div class="base-field">
    <label :for="id">{{ label }}</label>

    <div class="base-field__control-wrapper" :class="{ 'has-icon': icon }">
      <i v-if="icon" :class="['bi', icon, 'base-field__icon']"></i>

      <textarea
        v-if="type === 'textarea'"
        :id="id"
        v-model="model"
        :placeholder="placeholder"
        :maxlength="maxlength"
        :rows="rows"
        class="base-field__control"
      ></textarea>

      <input
        v-else
        :id="id"
        :type="type"
        v-model="model"
        :placeholder="placeholder"
        class="base-field__control"
      />
    </div>

    <span v-if="type === 'textarea' && maxlength" class="base-field__char-count">
      {{ (model || '').length }}/{{ maxlength }}
    </span>

    <span v-if="error" class="base-field__error">{{ error }}</span>
  </div>
</template>

<style scoped>
.base-field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  margin-bottom: 1.1rem;
}

.base-field label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
}

.base-field__control-wrapper {
  position: relative;
  width: 100%;
  box-sizing: border-box;
}

.base-field__control {
  width: 100%;
  box-sizing: border-box;
  padding: 0.6rem 0.75rem;
  border: 1px solid #d8d8e0;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  transition: border-color 0.15s ease;
}

.base-field__control-wrapper.has-icon .base-field__control {
  padding-left: 2.25rem;
}

.base-field__control:focus {
  outline: none;
  border-color: var(--brand-color, #7c3aed);
}

.base-field__icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9a9aa5;
}

.base-field__char-count {
  align-self: flex-end;
  font-size: 0.78rem;
  color: #888;
}

.base-field__error {
  font-size: 0.82rem;
  color: #d33;
}
</style>
