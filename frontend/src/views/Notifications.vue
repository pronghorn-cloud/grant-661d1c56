<template>
  <div class="notifications-page">
    <header class="page-header">
      <h1>Notifications</h1>
      <goa-button v-if="unreadCount > 0" type="tertiary" size="compact" @_click="markAllRead">
        Mark All as Read
      </goa-button>
    </header>

    <div v-if="loading" class="loading">
      <goa-circular-progress size="large"></goa-circular-progress>
    </div>

    <div v-else-if="notifications.length === 0" class="empty-state">
      <p>No notifications yet.</p>
      <p>You'll receive notifications when your application status changes.</p>
    </div>

    <div v-else class="notification-list">
      <div
        v-for="notif in notifications"
        :key="notif.id"
        class="notification-item"
        :class="{ unread: !notif.read }"
        @click="handleClick(notif)"
      >
        <div class="notif-icon" :class="getIconClass(notif.type)">
          <span>{{ getIcon(notif.type) }}</span>
        </div>
        <div class="notif-content">
          <div class="notif-header">
            <strong>{{ notif.title }}</strong>
            <span class="notif-time">{{ formatTime(notif.sent_at) }}</span>
          </div>
          <p class="notif-message">{{ notif.message }}</p>
          <span v-if="notif.type_label" class="notif-type">{{ notif.type_label }}</span>
        </div>
        <div v-if="!notif.read" class="unread-dot"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { notificationsAPI } from '@/services/notificationService';

const router = useRouter();
const loading = ref(true);
const notifications = ref([]);
const unreadCount = ref(0);

onMounted(async () => {
  try {
    const [notifRes, countRes] = await Promise.all([
      notificationsAPI.getAll(),
      notificationsAPI.getUnreadCount()
    ]);
    notifications.value = notifRes;
    unreadCount.value = countRes.count;
  } catch (err) {
    console.error('Failed to load notifications:', err);
  } finally {
    loading.value = false;
  }
});

function formatTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getIcon(type) {
  const icons = {
    submitted: '✓',
    action_required: '!',
    decision_available: '★',
    mi_request: '?',
    payment_processed: '$',
    cor_request: '✉',
    deadline_reminder: '⏰'
  };
  return icons[type] || '●';
}

function getIconClass(type) {
  const classes = {
    submitted: 'icon-success',
    action_required: 'icon-warning',
    decision_available: 'icon-info',
    mi_request: 'icon-warning',
    payment_processed: 'icon-success',
    cor_request: 'icon-info',
    deadline_reminder: 'icon-warning'
  };
  return classes[type] || 'icon-info';
}

async function handleClick(notif) {
  if (!notif.read) {
    try {
      await notificationsAPI.markAsRead(notif.id);
      notif.read = true;
      unreadCount.value = Math.max(0, unreadCount.value - 1);
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  }
  if (notif.application_id) {
    router.push('/dashboard');
  }
}

async function markAllRead() {
  try {
    await notificationsAPI.markAllAsRead();
    notifications.value.forEach(n => n.read = true);
    unreadCount.value = 0;
  } catch (err) {
    console.error('Failed to mark all as read:', err);
  }
}
</script>

<style scoped>
.notifications-page {
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--goa-space-l);
}

.page-header h1 {
  font-size: var(--goa-font-size-7);
  font-weight: var(--goa-font-weight-bold);
}

.loading {
  display: flex;
  justify-content: center;
  padding: var(--goa-space-xl);
}

.empty-state {
  text-align: center;
  padding: var(--goa-space-2xl);
  color: var(--goa-color-text-secondary);
}

.notification-list {
  display: flex;
  flex-direction: column;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: var(--goa-space-m);
  padding: var(--goa-space-m);
  border-bottom: 1px solid var(--goa-color-greyscale-200);
  cursor: pointer;
  transition: background-color 0.15s;
}

.notification-item:hover {
  background: var(--goa-color-greyscale-100);
}

.notification-item.unread {
  background: #f0f6ff;
}

.notification-item.unread:hover {
  background: #e3efff;
}

.notif-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  flex-shrink: 0;
  font-size: var(--goa-font-size-3);
}

.icon-success { background: #e6f4ea; color: #137333; }
.icon-warning { background: #fef7e0; color: #b06000; }
.icon-info { background: #e8f0fe; color: #1a73e8; }

.notif-content {
  flex: 1;
  min-width: 0;
}

.notif-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: var(--goa-space-s);
  margin-bottom: var(--goa-space-2xs);
}

.notif-time {
  font-size: var(--goa-font-size-1);
  color: var(--goa-color-text-secondary);
  white-space: nowrap;
}

.notif-message {
  font-size: var(--goa-font-size-2);
  color: var(--goa-color-text-secondary);
  margin-bottom: var(--goa-space-2xs);
}

.notif-type {
  font-size: var(--goa-font-size-1);
  color: var(--goa-color-text-secondary);
  background: var(--goa-color-greyscale-100);
  padding: 1px 6px;
  border-radius: 3px;
}

.unread-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--goa-color-interactive-default);
  flex-shrink: 0;
  margin-top: 6px;
}
</style>
