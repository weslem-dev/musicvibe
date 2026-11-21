<script setup>
import { reactive } from 'vue'
import BaseButton from '../components/base/BaseButton.vue'
import { usePaginatedList } from '../composables/usePaginatedList'
import { NOTIFICATION_TEXT } from '../config/constants'
import { getNotifications, markNotificationAsRead } from '../services/notificationService'
import { useNotificationsStore } from '../stores/notifications'
import { formatRelativeTime } from '../utils/format'
import { FALLBACK_AVATAR, resolveProfilePicture } from '../utils/media'
import { runOptimistic } from '../utils/optimistic'

// ADICIONADO NA AULA 14. "Notificações": a lista paginada (a mais nova primeiro),
// com as não lidas em destaque.
//
// Alcançabilidade: abre pelo SINO da Navbar (visível em todas as telas para quem
// está logado). Daqui, o texto de cada aviso leva ao que o gerou: a faixa
// (curtir/comentar) ou o perfil de quem agiu (seguir).
//
// Lacuna conhecida (decisão de escopo): esta LISTA não se atualiza sozinha; só o
// número do sino tem polling. Para ver as novas, o botão "Atualizar".
const notifications = useNotificationsStore()

const { items, isLoading, error, hasMore, loadMore, reload } = usePaginatedList(getNotifications)

// "Atualizar": recomeça a lista da página 1 e pergunta o número do sino na hora.
function refreshAll() {
  reload()
  notifications.refresh()
}

// A "cerca" é POR LINHA: um Set reativo com os ids que têm uma requisição em
// andamento. Clique duplo no mesmo botão = uma requisição; outra linha pode ser
// marcada ao mesmo tempo.
const busyIds = reactive(new Set())

// O QUARTO caso do runOptimistic (depois de curtir, seguir e a caixa do modal
// "Salvar"), sem mudar nada em utils/optimistic.js:
//   apply   -> a linha fica lida e o sino perde 1, na hora; devolve o undo.
//   undo    -> a linha volta a não lida e o sino GANHA 1. É a operação INVERSA,
//              e não "volte ao número que eu vi": se outra linha estiver no meio
//              do caminho (ou o polling tiver trazido um número novo), restaurar
//              um número antigo apagaria essa outra mudança. Com +1, duas linhas
//              falhando juntas devolvem as duas unidades.
//   request -> a chamada à API.
//   confirm -> acerta a linha e entrega à store o unreadCount que a API calculou.
// O toast de erro é do interceptor (é uma ação); aqui não há toast.error.
function markAsRead(notification) {
  if (notification.isRead || busyIds.has(notification.id)) return

  busyIds.add(notification.id)

  runOptimistic({
    apply: () => {
      notification.isRead = true
      notifications.setUnreadCount(Math.max(0, notifications.unreadCount - 1))

      return () => {
        notification.isRead = false
        notifications.setUnreadCount(notifications.unreadCount + 1)
      }
    },
    request: () => markNotificationAsRead(notification.id),
    confirm: (data) => {
      notification.isRead = data.isRead
      notifications.setUnreadCount(data.unreadCount)
    },
  }).finally(() => busyIds.delete(notification.id))
}

// Para onde o texto leva: seguir -> perfil de quem agiu; curtir/comentar -> a faixa.
function targetOf(notification) {
  if (notification.type === 'follow' || !notification.track) {
    return { name: 'public-profile', params: { username: notification.Actor.username } }
  }

  return { name: 'track-detail', params: { id: notification.track.id } }
}

function handleAvatarError(event) {
  event.target.src = FALLBACK_AVATAR
}
</script>

<template>
  <section class="notifications-page">
    <header class="notifications-page__header">
      <div>
        <h1><i class="bi bi-bell"></i> Notificações</h1>
        <p>Curtidas, comentários e novos seguidores.</p>
      </div>
      <BaseButton
        variant="secondary"
        icon="bi-arrow-clockwise"
        class="notifications-page__refresh"
        :disabled="isLoading"
        @click="refreshAll"
      >
        Atualizar
      </BaseButton>
    </header>

    <p v-if="isLoading && !items.length" class="notifications-page__status">Carregando notificações...</p>
    <p v-else-if="error && !items.length" class="notifications-page__error" role="alert">{{ error }}</p>

    <template v-else-if="items.length">
      <ul class="notification-list">
        <li
          v-for="notification in items"
          :key="notification.id"
          class="notification"
          :class="{ 'is-unread': !notification.isRead }"
        >
          <img
            :src="resolveProfilePicture(notification.Actor?.profilePicture)"
            :alt="`Foto de ${notification.Actor?.username}`"
            class="notification__avatar"
            @error="handleAvatarError"
          />

          <div class="notification__body">
            <!-- Clicar no texto navega E marca como lida (o @click roda antes de
                 o router-link trocar de tela). -->
            <router-link :to="targetOf(notification)" class="notification__link" @click="markAsRead(notification)">
              <strong>@{{ notification.Actor?.username }}</strong>
              {{ NOTIFICATION_TEXT[notification.type] }}
              <span v-if="notification.track" class="notification__track">"{{ notification.track.title }}"</span>
            </router-link>
            <time class="notification__time" :datetime="notification.createdAt">
              {{ formatRelativeTime(notification.createdAt) }}
            </time>
          </div>

          <button
            v-if="!notification.isRead"
            type="button"
            class="notification__mark"
            :disabled="busyIds.has(notification.id)"
            title="Marcar como lida"
            @click="markAsRead(notification)"
          >
            <i class="bi bi-check2"></i> Marcar como lida
          </button>
          <span v-else class="notification__read"><i class="bi bi-check2-all"></i> Lida</span>
        </li>
      </ul>

      <p v-if="error" class="notifications-page__error" role="alert">{{ error }}</p>

      <div v-if="hasMore" class="notifications-page__more">
        <BaseButton variant="secondary" icon="bi-arrow-down-circle" :disabled="isLoading" @click="loadMore">
          {{ isLoading ? 'Carregando...' : 'Carregar mais notificações' }}
        </BaseButton>
      </div>
    </template>

    <div v-else class="notifications-page__empty">
      <i class="bi bi-bell-slash"></i>
      <p>Você ainda não tem notificações.</p>
      <p class="notifications-page__hint">
        Quando alguém curtir ou comentar uma faixa sua, ou começar a seguir você, o aviso aparece aqui e no sino lá em cima.
      </p>
    </div>
  </section>
</template>

<style scoped>
.notifications-page {
  max-width: 760px;
  margin: 0 auto;
}

.notifications-page__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.notifications-page__header h1 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.25rem;
  font-size: 1.5rem;
}

.notifications-page__header h1 i {
  color: var(--brand-color, #7c3aed);
}

.notifications-page__header p {
  margin: 0;
  color: #666;
}

.notifications-page__refresh {
  width: auto;
  flex-shrink: 0;
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.notification {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.85rem 1rem;
  border: 1px solid #ececf2;
  border-radius: 12px;
  background: #fff;
}

/* Não lida: fundo de destaque, barra lateral e texto em negrito. */
.notification.is-unread {
  border-color: #d9cdfb;
  border-left: 4px solid var(--brand-color, #7c3aed);
  background: #f6f2ff;
}

.notification.is-unread .notification__link {
  font-weight: 600;
}

.notification__avatar {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  background: #e5e0f7;
}

.notification__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.notification__link {
  color: inherit;
  font-weight: 400;
  text-decoration: none;
  overflow-wrap: anywhere;
}

.notification__link:hover {
  text-decoration: underline;
}

.notification__link strong {
  color: var(--brand-color, #7c3aed);
}

.notification__track {
  font-style: italic;
}

.notification__time {
  font-size: 0.8rem;
  color: #888;
}

.notification__mark {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 0.3rem;
  padding: 0.35rem 0.7rem;
  border: 1px solid var(--brand-color, #7c3aed);
  border-radius: 8px;
  background: #fff;
  color: var(--brand-color, #7c3aed);
  font: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.notification__mark:hover:not(:disabled) {
  background: #f0ebff;
}

.notification__mark:disabled {
  opacity: 0.6;
  cursor: progress;
}

.notification__read {
  flex-shrink: 0;
  font-size: 0.8rem;
  color: #2a8f4d;
}

.notifications-page__more {
  display: flex;
  justify-content: center;
  margin-top: 1.25rem;
}

.notifications-page__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  padding: 3rem 1rem;
  text-align: center;
  color: #666;
}

.notifications-page__empty i {
  font-size: 2.4rem;
  color: #b8a8ec;
}

.notifications-page__empty p {
  margin: 0;
}

.notifications-page__hint {
  max-width: 420px;
  font-size: 0.9rem;
}

.notifications-page__status {
  color: #666;
}

.notifications-page__error {
  color: #d33;
}

@media (max-width: 600px) {
  .notifications-page__header {
    flex-direction: column;
  }

  .notification {
    flex-wrap: wrap;
  }
}
</style>
