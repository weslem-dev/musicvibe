<script setup>
import { ref } from 'vue'
import TrackCard from '../components/TrackCard.vue'
import BaseButton from '../components/base/BaseButton.vue'
import BaseModal from '../components/base/BaseModal.vue'
import { useAsyncData } from '../composables/useAsyncData'
import { useToast } from '../composables/useToast'
import { deleteTrack, getMyTracks } from '../services/trackService'

const toast = useToast()

const { data: tracks, isLoading, error } = useAsyncData(() => getMyTracks(), { initialData: [] })

// Estado do modal de exclusão. Existe UM modal só, aqui na tela (não um por
// card): ele fica FORA do TrackCard, e a tela guarda QUAL faixa está sendo
// excluída. Um modal por card (ou dentro do card) repetiria o mesmo HTML N
// vezes e ficaria preso ao layout, ao hover e ao overflow do card.
const isModalOpen = ref(false)
const trackToDelete = ref(null)
const isDeleting = ref(false)

function askDelete(track) {
  trackToDelete.value = track
  isModalOpen.value = true
}

// Excluir é uma AÇÃO: se falhar, o interceptor do Axios mostra o toast (na frente
// do modal, que continua aberto para tentar de novo). Se der certo, o aviso de
// sucesso é um toast daqui.
async function confirmDelete() {
  if (!trackToDelete.value) return

  isDeleting.value = true // "busy": trava botões e o fechamento do modal

  try {
    const deletedId = trackToDelete.value.id
    const response = await deleteTrack(deletedId)

    // Remoção LOCAL: tira o item da lista que já está na tela, sem recarregar
    // a página nem pedir a lista de novo ao servidor.
    tracks.value = tracks.value.filter((track) => track.id !== deletedId)

    toast.success(response.message)
    isModalOpen.value = false
    trackToDelete.value = null
  } catch {
    // Nada a fazer: o toast de erro já foi mostrado pelo interceptor.
  } finally {
    isDeleting.value = false
  }
}

function cancelDelete() {
  isModalOpen.value = false
}
</script>

<template>
  <section class="my-tracks">
    <header class="my-tracks__header">
      <div>
        <h1><i class="bi bi-music-note-list"></i> Minhas Faixas</h1>
        <p>Edite ou exclua as faixas que você enviou.</p>
      </div>
      <router-link to="/upload" class="my-tracks__upload"><i class="bi bi-cloud-upload"></i> Enviar Faixa</router-link>
    </header>

    <p v-if="error" class="my-tracks__error" role="alert">{{ error }}</p>

    <p v-if="isLoading" class="my-tracks__status">Carregando suas faixas...</p>

    <div v-else-if="tracks.length" class="track-grid">
      <TrackCard v-for="track in tracks" :key="track.id" :track="track" :show-author="false">
        <template #actions>
          <router-link :to="{ name: 'track-edit', params: { id: track.id } }" class="card-action">
            <i class="bi bi-pencil"></i> Editar
          </router-link>
          <button type="button" class="card-action card-action--danger" @click="askDelete(track)">
            <i class="bi bi-trash"></i> Excluir
          </button>
        </template>
      </TrackCard>
    </div>

    <div v-else-if="!error" class="my-tracks__empty">
      <i class="bi bi-music-note-beamed"></i>
      <p>Você ainda não enviou nenhuma faixa.</p>
      <router-link to="/upload">Enviar a primeira faixa</router-link>
    </div>

    <BaseModal v-model="isModalOpen" title="Excluir faixa" :busy="isDeleting">
      <p>
        Tem certeza que deseja excluir <strong>{{ trackToDelete?.title }}</strong>?
        O áudio e a capa serão apagados e essa ação não pode ser desfeita.
      </p>

      <template #footer>
        <BaseButton variant="secondary" :disabled="isDeleting" @click="cancelDelete">Cancelar</BaseButton>
        <BaseButton variant="danger" :disabled="isDeleting" @click="confirmDelete">
          {{ isDeleting ? 'Excluindo...' : 'Excluir' }}
        </BaseButton>
      </template>
    </BaseModal>
  </section>
</template>

<style scoped>
.my-tracks__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.my-tracks__header h1 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.25rem;
  font-size: 1.5rem;
}

.my-tracks__header h1 i {
  color: var(--brand-color, #7c3aed);
}

.my-tracks__header p {
  margin: 0;
  color: #666;
}

.my-tracks__upload {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  white-space: nowrap;
  font-weight: 600;
  text-decoration: none;
}


.card-action {
  display: inline-flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.4rem 0.5rem;
  border: 1px solid var(--brand-color, #7c3aed);
  border-radius: 8px;
  background: transparent;
  color: var(--brand-color, #7c3aed);
  font: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
}

.card-action:hover {
  background: #f6f3ff;
}

.card-action--danger {
  border-color: #d33;
  color: #d33;
}

.card-action--danger:hover {
  background: #fdf0f0;
}

.my-tracks__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  padding: 3rem 1rem;
  color: #666;
}

.my-tracks__empty i {
  font-size: 2.4rem;
  color: #b8a8ec;
}

.my-tracks__empty p {
  margin: 0;
}

.my-tracks__status {
  color: #666;
}


.my-tracks__error {
  color: #d33;
  margin-bottom: 1rem;
}
</style>
