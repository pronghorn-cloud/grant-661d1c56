<template>
  <goa-app-header
    heading="AE Online Scholarships"
    url="/"
    data-testid="app-header"
  >
    <!-- Navigation links - GoA header only supports <a> tags in default slot -->
    <a
      v-for="link in visibleLinks"
      :key="link.path"
      :href="link.path"
      :class="{ 'current': isCurrentRoute(link.path) }"
      @click.prevent="navigateTo(link.path)"
    >
      {{ link.name }}
    </a>

    <!-- Auth link -->
    <a
      v-if="authenticated"
      href="#"
      @click.prevent="handleSignOut"
    >
      Sign Out
    </a>
    <a
      v-else
      href="/login"
      :class="{ 'current': isCurrentRoute('/login') }"
      @click.prevent="navigateTo('/login')"
    >
      Sign In
    </a>
  </goa-app-header>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { isAuthenticated, getStoredUser, logout } from '@/services/authService';

const router = useRouter();
const route = useRoute();
const authenticated = ref(isAuthenticated());
const user = ref(getStoredUser());

const staffRoles = ['scholarship_staff', 'scholarship_manager', 'admin', 'superadmin', 'finance'];
const adminRoles = ['admin', 'superadmin'];

const guestLinks = [
  { name: 'Home', path: '/' },
  { name: 'Scholarships', path: '/scholarships' },
  { name: 'Help', path: '/help' }
];

const applicantLinks = [
  { name: 'Scholarships', path: '/scholarships' },
  { name: 'My Profile', path: '/profile' },
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Notifications', path: '/notifications' }
];

const staffLinks = [
  { name: 'Staff Dashboard', path: '/staff/dashboard' },
  { name: 'Work Queue', path: '/staff/queue' },
  { name: 'COR', path: '/staff/cor' },
  { name: 'Payments', path: '/staff/payments' },
  { name: 'Reports', path: '/staff/reports' },
  { name: 'Analytics', path: '/staff/analytics' },
  { name: 'Notifications', path: '/notifications' }
];

const adminLinks = [
  { name: 'Staff Dashboard', path: '/staff/dashboard' },
  { name: 'Work Queue', path: '/staff/queue' },
  { name: 'COR', path: '/staff/cor' },
  { name: 'Payments', path: '/staff/payments' },
  { name: 'Reports', path: '/staff/reports' },
  { name: 'Analytics', path: '/staff/analytics' },
  { name: 'Admin', path: '/admin' },
  { name: 'Notifications', path: '/notifications' }
];

const visibleLinks = computed(() => {
  if (!authenticated.value) return guestLinks;
  if (user.value && adminRoles.includes(user.value.role)) return adminLinks;
  if (user.value && staffRoles.includes(user.value.role)) return staffLinks;
  return applicantLinks;
});

const isCurrentRoute = (path) => {
  return route.path === path || route.path.startsWith(path + '/');
};

const navigateTo = (path) => {
  router.push(path);
};

async function handleSignOut() {
  await logout();
  authenticated.value = false;
  user.value = null;
  router.push('/');
}

// Watch for auth state changes
router.afterEach(() => {
  authenticated.value = isAuthenticated();
  user.value = getStoredUser();
});
</script>

<style scoped>
a {
  color: var(--goa-color-text-default);
  text-decoration: none;
  padding: var(--goa-space-xs) var(--goa-space-s);
  border-radius: var(--goa-border-radius-s);
  transition: background-color 0.2s ease;
}

a:hover {
  background-color: var(--goa-color-greyscale-100);
}

a.current {
  font-weight: var(--goa-font-weight-bold);
  color: var(--goa-color-interactive-default);
  position: relative;
}

a.current::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background-color: var(--goa-color-interactive-default);
}
</style>
