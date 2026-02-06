<template>
  <div class="app">
    <AppHeader />

    <main class="main-content">
      <router-view />
    </main>

    <AppFooter />
  </div>
</template>

<script setup>
import AppHeader from '@/components/AppHeader.vue';
import AppFooter from '@/components/AppFooter.vue';
</script>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  width: 100%;
  max-width: var(--goa-space-max-width, 1440px);
  margin: 0 auto;
  padding: var(--goa-space-l) var(--goa-space-m);
}

@media (max-width: 768px) {
  .main-content {
    padding: var(--goa-space-m) var(--goa-space-s);
  }
}
</style>
