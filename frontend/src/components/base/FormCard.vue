<script setup>
defineProps({
  title: { type: String, required: true },
  icon: { type: String, default: '' }, // classe do bootstrap-icons
})
</script>

<template>
  <div class="form-card">
    <div class="form-card__header">
      <i v-if="icon" :class="['bi', icon]"></i>
      <h1>{{ title }}</h1>
    </div>

    <div class="form-card__body">
      <slot />
    </div>

    <div v-if="$slots.footer" class="form-card__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped>
.form-card {
  box-sizing: border-box;
  max-width: 440px;
  margin: 2rem auto;
  padding: 2rem;
  background: #fff;
  border-radius: 16px;
  border-top: 4px solid var(--brand-color, #7c3aed);
  box-shadow: 0 4px 24px rgba(20, 10, 40, 0.08);
}

.form-card__header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 1.5rem;
}

.form-card__header i {
  font-size: 1.4rem;
  color: var(--brand-color, #7c3aed);
}

.form-card__header h1 {
  margin: 0;
  font-size: 1.35rem;
}

.form-card__footer {
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
  font-size: 0.9rem;
  text-align: center;
  color: #555;
}
</style>
