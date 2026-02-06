<template>
  <div class="services">
    <header class="page-header">
      <h1>Alberta Services</h1>
      <p>Browse all available government services and resources</p>
    </header>

    <div v-if="loading" class="loading">
      <goa-circular-progress size="large"></goa-circular-progress>
      <p>Loading services...</p>
    </div>

    <div v-else class="services-list">
      <goa-table v-if="services.length > 0">
        <thead>
          <tr>
            <th>Service Name</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="service in services" :key="service.id">
            <td>
              <strong>{{ service.name }}</strong>
            </td>
            <td>{{ service.description }}</td>
            <td>
              <goa-button
                type="tertiary"
                size="compact"
                @click="viewDetails(service.id)"
              >
                View Details
              </goa-button>
            </td>
          </tr>
        </tbody>
      </goa-table>

      <goa-callout v-else type="information">
        <p>No services available at this time.</p>
      </goa-callout>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { servicesAPI } from '@/services/api';

const router = useRouter();
const services = ref([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const response = await servicesAPI.getAll();
    services.value = response.data || [];
  } catch (error) {
    console.error('Failed to load services:', error);
  } finally {
    loading.value = false;
  }
});

const viewDetails = (id) => {
  // Navigate to service details or show modal
};
</script>

<style scoped>
.services {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: var(--goa-space-xl);
}

.page-header h1 {
  font-size: var(--goa-font-size-7);
  font-weight: var(--goa-font-weight-bold);
  color: var(--goa-color-text-default);
  margin-bottom: var(--goa-space-s);
}

.page-header p {
  font-size: var(--goa-font-size-4);
  color: var(--goa-color-text-secondary);
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--goa-space-m);
  padding: var(--goa-space-xl);
}

.services-list {
  margin-top: var(--goa-space-l);
}
</style>
