<script setup>
// ADICIONADO NA AULA 15. A "moldura" do painel: título, as quatro abas e, embaixo,
// a tela da aba atual (<router-view />). É o componente da rota PAI /admin; as
// quatro telas são as rotas filhas.
const tabs = [
  { name: 'admin-dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
  { name: 'admin-reports', label: 'Denúncias', icon: 'bi-flag' },
  { name: 'admin-users', label: 'Usuários', icon: 'bi-people' },
  { name: 'admin-tracks', label: 'Faixas', icon: 'bi-music-note-list' },
]
</script>

<template>
  <section class="admin">
    <header class="admin__header">
      <h1><i class="bi bi-shield-lock"></i> Administração</h1>
      <p>Moderação de denúncias, usuários e faixas do MusicVibe.</p>
    </header>

    <nav class="admin__tabs" aria-label="Seções da administração">
      <!-- nav-pills: a aba da rota atual ganha a classe "active" (active-class). -->
      <ul class="nav-pills">
        <li v-for="tab in tabs" :key="tab.name">
          <router-link :to="{ name: tab.name }" active-class="active" class="nav-link">
            <i class="bi" :class="tab.icon"></i> {{ tab.label }}
          </router-link>
        </li>
      </ul>
    </nav>

    <router-view />
  </section>
</template>

<style scoped>
.admin__header h1 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.25rem;
  font-size: 1.5rem;
}

.admin__header h1 i {
  color: var(--brand-color, #7c3aed);
}

.admin__header p {
  margin: 0 0 1rem;
  color: #666;
}

.nav-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0 0 1.5rem;
  padding: 0 0 1rem;
  border-bottom: 1px solid #ececf2;
  list-style: none;
}

.nav-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.95rem;
  border-radius: 999px;
  color: #555;
  font-weight: 600;
  text-decoration: none;
}

.nav-link:hover {
  background: #f3effe;
  color: var(--brand-color, #7c3aed);
}

.nav-link.active {
  background: var(--brand-color, #7c3aed);
  color: #fff;
}
</style>
