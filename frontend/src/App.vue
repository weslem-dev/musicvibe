<template>
  <div class="app-layout">
    <TheNavbar />
    <div class="app-body">
      <TheSidebar />
      <main class="app-content">
        <router-view />
      </main>
    </div>
    <TheFooter />
  </div>

  <!-- Aula 12: o container dos toasts é montado UMA vez, aqui. -->
  <ToastContainer />
</template>

<script setup>
import TheNavbar from './components/layout/TheNavbar.vue'
import TheSidebar from './components/layout/TheSidebar.vue'
import TheFooter from './components/layout/TheFooter.vue'
import ToastContainer from './components/base/ToastContainer.vue'
</script>

<style scoped>
.app-body {
  display: flex;
}

.app-content {
  flex: 1;
  min-width: 0; /* sem isso, uma grade larga pode estourar o flex em telas estreitas */
  padding: 1.5rem;
}
</style>
