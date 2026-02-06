<template>
  <div class="detail-page">
    <div v-if="loading" class="loading">
      <goa-circular-progress size="large"></goa-circular-progress>
      <p>Loading scholarship details...</p>
    </div>

    <div v-else-if="scholarship">
      <div class="back-nav">
        <goa-button type="tertiary" size="compact" @_click="$router.push('/scholarships')">
          Back to Catalog
        </goa-button>
      </div>

      <header class="page-header">
        <div class="header-badges">
          <span class="badge" :class="scholarship.type.replace(/\s+/g, '-')">
            {{ scholarship.type }}
          </span>
          <span v-if="scholarship.category" class="category-tag">
            {{ scholarship.category }}
          </span>
        </div>
        <h1>{{ scholarship.name }}</h1>
      </header>

      <div class="detail-grid">
        <div class="detail-main">
          <section v-if="scholarship.eligibility_criteria?.description" class="detail-section">
            <h2>Eligibility & Details</h2>
            <p>{{ scholarship.eligibility_criteria.description }}</p>
          </section>

          <section v-if="scholarship.selection_process" class="detail-section">
            <h2>Selection Process</h2>
            <p>{{ scholarship.selection_process }}</p>
          </section>

          <section v-if="scholarship.source_url" class="detail-section">
            <h2>More Information</h2>
            <a :href="scholarship.source_url" target="_blank" rel="noopener noreferrer">
              View official scholarship page
            </a>
          </section>
        </div>

        <aside class="detail-sidebar">
          <div class="info-card">
            <h3>Quick Facts</h3>
            <div class="fact-row">
              <strong>Award Value</strong>
              <span>{{ scholarship.value || 'Varies' }}</span>
            </div>
            <div class="fact-row">
              <strong>Deadline</strong>
              <span>{{ formatDate(scholarship.deadline_end) }}</span>
            </div>
            <div v-if="scholarship.max_awards" class="fact-row">
              <strong>Max Awards</strong>
              <span>{{ scholarship.max_awards }}</span>
            </div>
            <div class="fact-row">
              <strong>Academic Year</strong>
              <span>{{ scholarship.academic_year }}</span>
            </div>
            <div class="fact-row">
              <strong>Application Type</strong>
              <span>{{ scholarship.type }}</span>
            </div>
          </div>

          <goa-button
            v-if="scholarship.type === 'online application'"
            type="primary"
            @_click="applyNow"
          >
            Apply Now
          </goa-button>
          <goa-button
            v-else-if="scholarship.type === 'form application'"
            type="primary"
            @_click="applyNow"
          >
            Apply Now
          </goa-button>
          <goa-callout v-else type="information" heading="Indirect Scholarship">
            This scholarship is awarded automatically based on academic achievement. No application is required.
          </goa-callout>
        </aside>
      </div>
    </div>

    <div v-else>
      <goa-callout type="emergency" heading="Scholarship Not Found">
        <p>The requested scholarship could not be found.</p>
        <goa-button type="tertiary" @_click="$router.push('/scholarships')">
          Back to Catalog
        </goa-button>
      </goa-callout>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { scholarshipsAPI } from '@/services/scholarshipService';

const route = useRoute();
const router = useRouter();
const scholarship = ref(null);
const loading = ref(true);

onMounted(async () => {
  try {
    const response = await scholarshipsAPI.getById(route.params.id);
    scholarship.value = response.data;
  } catch (error) {
    console.error('Failed to load scholarship:', error);
  } finally {
    loading.value = false;
  }
});

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-CA', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
}

function applyNow() {
  router.push(`/apply/${route.params.id}`);
}
</script>

<style scoped>
.detail-page {
  max-width: 1000px;
  margin: 0 auto;
}

.back-nav {
  margin-bottom: var(--goa-space-m);
}

.page-header {
  margin-bottom: var(--goa-space-l);
}

.header-badges {
  display: flex;
  gap: var(--goa-space-xs);
  margin-bottom: var(--goa-space-s);
}

.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: var(--goa-font-size-2);
  font-weight: var(--goa-font-weight-bold);
  text-transform: capitalize;
}

.badge.online-application { background: #e6f4ea; color: #137333; }
.badge.form-application { background: #e8f0fe; color: #1a73e8; }
.badge.indirect { background: #fef7e0; color: #b06000; }

.category-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: var(--goa-font-size-2);
  background: var(--goa-color-greyscale-100);
  color: var(--goa-color-text-secondary);
}

.page-header h1 {
  font-size: var(--goa-font-size-7);
  font-weight: var(--goa-font-weight-bold);
  color: var(--goa-color-text-default);
}

.detail-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--goa-space-xl);
}

.detail-section {
  margin-bottom: var(--goa-space-l);
}

.detail-section h2 {
  font-size: var(--goa-font-size-5);
  margin-bottom: var(--goa-space-s);
}

.info-card {
  padding: var(--goa-space-l);
  background: var(--goa-color-greyscale-100);
  border-radius: var(--goa-border-radius-m);
  margin-bottom: var(--goa-space-m);
}

.info-card h3 {
  font-size: var(--goa-font-size-5);
  margin-bottom: var(--goa-space-m);
}

.fact-row {
  display: flex;
  justify-content: space-between;
  padding: var(--goa-space-xs) 0;
  border-bottom: 1px solid var(--goa-color-greyscale-200);
}

.fact-row:last-child {
  border-bottom: none;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--goa-space-m);
  padding: var(--goa-space-xl);
}

@media (max-width: 768px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
