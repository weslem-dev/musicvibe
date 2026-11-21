<script setup>
import BaseButton from '../../components/base/BaseButton.vue'
import { useAsyncData } from '../../composables/useAsyncData'
import { getAdminDashboard } from '../../services/adminService'

// ADICIONADO NA AULA 15. Dashboard: os números do sistema, num cartão cada.
//
// Alcançabilidade: Sidebar -> seção Administração -> "Painel" (/admin redireciona
// para cá) e a aba "Dashboard" do painel.
const { data: stats, isLoading, error, execute } = useAsyncData(getAdminDashboard)

// Os cartões IGUAIS saem de uma lista (v-for). O das denúncias pendentes fica à
// parte: é vermelho e é um LINK para a aba Denúncias.
const cards = [
  { key: 'users', label: 'Usuários', icon: 'bi-people' },
  { key: 'blockedUsers', label: 'Bloqueados', icon: 'bi-person-x' },
  { key: 'tracks', label: 'Faixas', icon: 'bi-music-note-list' },
  { key: 'comments', label: 'Comentários', icon: 'bi-chat' },
  { key: 'likes', label: 'Curtidas', icon: 'bi-heart' },
  { key: 'reviewedReports', label: 'Denúncias revisadas', icon: 'bi-check2-circle' },
]
</script>

<template>
  <div class="dashboard">
    <div class="dashboard__toolbar">
      <h2>Visão geral</h2>
      <BaseButton variant="secondary" icon="bi-arrow-clockwise" class="dashboard__refresh" :disabled="isLoading" @click="execute">
        Atualizar
      </BaseButton>
    </div>

    <p v-if="isLoading" class="admin-status">Carregando números...</p>
    <!-- O 403 da API ("Acesso restrito a administradores.") aparece aqui, no lugar
         dos números (é uma leitura: sem toast). -->
    <p v-else-if="error" class="admin-error" role="alert"><i class="bi bi-lock"></i> {{ error }}</p>

    <div v-else-if="stats" class="stat-grid">
      <router-link :to="{ name: 'admin-reports' }" class="stat-card stat-card--alert">
        <i class="bi bi-flag-fill"></i>
        <span class="stat-card__value">{{ stats.pendingReports }}</span>
        <span class="stat-card__label">Denúncias pendentes</span>
        <span class="stat-card__go">Revisar <i class="bi bi-arrow-right"></i></span>
      </router-link>

      <div v-for="card in cards" :key="card.key" class="stat-card">
        <i class="bi" :class="card.icon"></i>
        <span class="stat-card__value">{{ stats[card.key] }}</span>
        <span class="stat-card__label">{{ card.label }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.dashboard__toolbar h2 {
  margin: 0;
  font-size: 1.15rem;
}

.dashboard__refresh {
  width: auto;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 1.1rem 1.2rem;
  border: 1px solid #ececf2;
  border-radius: 14px;
  background: #fff;
  color: inherit;
  text-decoration: none;
}

.stat-card > i {
  font-size: 1.3rem;
  color: var(--brand-color, #7c3aed);
}

.stat-card__value {
  font-size: 1.9rem;
  font-weight: 700;
  line-height: 1.1;
}

.stat-card__label {
  color: #666;
  font-size: 0.9rem;
}

.stat-card--alert {
  grid-column: span 2;
  border-color: #f3c2cd;
  background: #fdeef1;
}

.stat-card--alert > i,
.stat-card--alert .stat-card__value {
  color: #c81e45;
}

.stat-card--alert:hover {
  background: #fbe2e8;
}

.stat-card__go {
  margin-top: 0.3rem;
  color: #c81e45;
  font-size: 0.85rem;
  font-weight: 600;
}

.admin-status {
  color: #666;
}

.admin-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.2rem;
  border-radius: 12px;
  background: #fdeef1;
  color: #c81e45;
  font-weight: 600;
}

@media (max-width: 600px) {
  .stat-card--alert {
    grid-column: auto;
  }
}
</style>
