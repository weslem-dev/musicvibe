<script setup>
import { reactive, ref } from 'vue'
import BaseButton from '../../components/base/BaseButton.vue'
import { usePaginatedList } from '../../composables/usePaginatedList'
import { useToast } from '../../composables/useToast'
import { REPORT_FILTERS, REPORT_REASONS } from '../../config/constants'
import { getAdminReports, reviewAdminReport } from '../../services/adminService'
import { formatDateTime, formatRelativeTime } from '../../utils/format'
import { FALLBACK_COVER, resolveCoverUrl } from '../../utils/media'

// ADICIONADO NA AULA 15. Denúncias: filtro por situação e "Marcar como revisada".
//
// Alcançabilidade: aba "Denúncias" do painel e o cartão vermelho de denúncias
// pendentes do Dashboard.
const toast = useToast()

const statusFilter = ref('pending')

// A receita lê statusFilter.value a cada página; { watch: statusFilter } faz a
// lista recomeçar da página 1 quando o filtro muda.
const { items: reports, isLoading, error, hasMore, loadMore, reload } = usePaginatedList(
  (page, limit) => getAdminReports(statusFilter.value, page, limit),
  undefined,
  { watch: statusFilter }
)

// A API guarda a CHAVE ('spam'); a tela mostra o rótulo ('Spam ou golpes').
const reasonLabels = Object.fromEntries(REPORT_REASONS.map((reason) => [reason.value, reason.label]))

// Cerca POR LINHA: ids com a revisão em andamento.
const busyIds = reactive(new Set())

// ESPERA o servidor (sem runOptimistic): a linha só muda com o que a API devolveu.
// É uma decisão de moderação; o administrador precisa ver o que de fato ficou
// gravado, e não um "revisada" que pode voltar atrás.
async function markAsReviewed(report) {
  if (busyIds.has(report.id)) return

  busyIds.add(report.id)

  try {
    const response = await reviewAdminReport(report.id)
    report.status = response.data.status
    report.reviewedAt = response.data.reviewedAt
    toast.success(response.message)
  } catch {
    // O toast de erro é do interceptor (é uma ação); aqui a linha não muda.
  } finally {
    busyIds.delete(report.id)
  }
}

function handleCoverError(event) {
  event.target.src = FALLBACK_COVER
}
</script>

<template>
  <div class="admin-reports">
    <div class="admin-toolbar">
      <div class="filter-group" role="group" aria-label="Filtrar denúncias por situação">
        <button
          v-for="filter in REPORT_FILTERS"
          :key="filter.value"
          type="button"
          class="filter-button"
          :class="{ 'is-active': statusFilter === filter.value }"
          :aria-pressed="statusFilter === filter.value"
          @click="statusFilter = filter.value"
        >
          {{ filter.label }}
        </button>
      </div>
      <BaseButton variant="secondary" icon="bi-arrow-clockwise" class="admin-toolbar__refresh" :disabled="isLoading" @click="reload">
        Atualizar
      </BaseButton>
    </div>

    <p v-if="isLoading && !reports.length" class="admin-status">Carregando denúncias...</p>
    <p v-else-if="error && !reports.length" class="admin-error" role="alert"><i class="bi bi-lock"></i> {{ error }}</p>

    <template v-else-if="reports.length">
      <ul class="report-list">
        <li v-for="report in reports" :key="report.id" class="report-row">
          <router-link v-if="report.track" :to="{ name: 'track-detail', params: { id: report.track.id } }" class="report-row__thumb">
            <img :src="resolveCoverUrl(report.track.cover)" :alt="`Capa de ${report.track.title}`" @error="handleCoverError" />
          </router-link>

          <div class="report-row__body">
            <router-link v-if="report.track" :to="{ name: 'track-detail', params: { id: report.track.id } }" class="report-row__title">
              {{ report.track.title }}
            </router-link>
            <span v-if="report.track?.author" class="report-row__author">de @{{ report.track.author.username }}</span>

            <div class="report-row__meta">
              <span class="reason"><i class="bi bi-flag"></i> {{ reasonLabels[report.reason] || report.reason }}</span>
              <span class="badge" :class="report.status === 'reviewed' ? 'badge--reviewed' : 'badge--pending'">
                {{ report.status === 'reviewed' ? 'Revisada' : 'Pendente' }}
              </span>
            </div>

            <span class="report-row__by">
              Denunciada por @{{ report.Reporter?.username }}
              <time :datetime="report.createdAt">{{ formatRelativeTime(report.createdAt) }}</time>
            </span>
            <span v-if="report.reviewedAt" class="report-row__reviewed">
              <i class="bi bi-check2-circle"></i> Revisada em {{ formatDateTime(report.reviewedAt) }}
            </span>
          </div>

          <button
            v-if="report.status === 'pending'"
            type="button"
            class="row-action"
            :disabled="busyIds.has(report.id)"
            @click="markAsReviewed(report)"
          >
            <i class="bi bi-check2"></i>
            {{ busyIds.has(report.id) ? 'Salvando...' : 'Marcar como revisada' }}
          </button>
        </li>
      </ul>

      <p v-if="error" class="admin-error" role="alert">{{ error }}</p>

      <div v-if="hasMore" class="admin-more">
        <BaseButton variant="secondary" icon="bi-arrow-down-circle" :disabled="isLoading" @click="loadMore">
          {{ isLoading ? 'Carregando...' : 'Carregar mais' }}
        </BaseButton>
      </div>
    </template>

    <p v-else class="admin-empty">
      <i class="bi bi-inbox"></i>
      {{ statusFilter === 'pending' ? 'Nenhuma denúncia pendente.' : 'Nenhuma denúncia por aqui.' }}
    </p>
  </div>
</template>

<style scoped>
.admin-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.admin-toolbar__refresh {
  width: auto;
}

.filter-group {
  display: inline-flex;
  overflow: hidden;
  border: 1px solid #d8d8e0;
  border-radius: 999px;
}

.filter-button {
  padding: 0.4rem 1rem;
  border: none;
  border-right: 1px solid #d8d8e0;
  background: #fff;
  color: #555;
  font: inherit;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
}

.filter-button:last-child {
  border-right: none;
}

.filter-button.is-active {
  background: var(--brand-color, #7c3aed);
  color: #fff;
}

.report-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.report-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.85rem 1rem;
  border: 1px solid #ececf2;
  border-radius: 12px;
  background: #fff;
}

.report-row__thumb img {
  display: block;
  width: 64px;
  height: 64px;
  border-radius: 8px;
  object-fit: cover;
}

.report-row__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.report-row__title {
  color: inherit;
  font-weight: 700;
  text-decoration: none;
  overflow-wrap: anywhere;
}

.report-row__title:hover {
  text-decoration: underline;
}

.report-row__author,
.report-row__by {
  font-size: 0.85rem;
  color: #666;
}

.report-row__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin: 0.15rem 0;
}

.reason {
  font-size: 0.9rem;
  font-weight: 600;
  color: #c81e45;
}

.badge {
  padding: 0.12rem 0.55rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
}

.badge--pending {
  background: #fff4dd;
  color: #9a6400;
}

.badge--reviewed {
  background: #e7f6ec;
  color: #2a8f4d;
}

.report-row__reviewed {
  font-size: 0.82rem;
  color: #2a8f4d;
}

.row-action {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 0.3rem;
  padding: 0.4rem 0.8rem;
  border: 1px solid var(--brand-color, #7c3aed);
  border-radius: 8px;
  background: #fff;
  color: var(--brand-color, #7c3aed);
  font: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}

.row-action:hover:not(:disabled) {
  background: #f0ebff;
}

.row-action:disabled {
  opacity: 0.65;
  cursor: progress;
}

.admin-more {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}

.admin-status,
.admin-empty {
  color: #666;
}

.admin-empty {
  display: flex;
  align-items: center;
  gap: 0.5rem;
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
</style>
