<template>
  <div class="catalog-page">
    <header class="page-header">
      <h1>Available Scholarships</h1>
      <p>Browse and apply for Alberta scholarship opportunities</p>
    </header>

    <!-- Search and Filters -->
    <div class="filters-bar">
      <div class="search-box">
        <goa-input
          :value="search"
          @_change="(e) => search = e.detail.value"
          placeholder="Search scholarships..."
          leadingicon="search"
        ></goa-input>
      </div>
      <div class="filter-group">
        <goa-dropdown
          :value="filterType"
          @_change="(e) => filterType = e.detail.value"
        >
          <goa-dropdown-item value="" label="All Application Types"></goa-dropdown-item>
          <goa-dropdown-item
            v-for="t in types"
            :key="t.code"
            :value="t.code"
            :label="t.label"
          ></goa-dropdown-item>
        </goa-dropdown>
      </div>
      <div class="filter-group">
        <goa-dropdown
          :value="filterCategory"
          @_change="(e) => filterCategory = e.detail.value"
        >
          <goa-dropdown-item value="" label="All Categories"></goa-dropdown-item>
          <goa-dropdown-item
            v-for="c in categories"
            :key="c.code"
            :value="c.code"
            :label="c.label"
          ></goa-dropdown-item>
        </goa-dropdown>
      </div>
      <div v-if="hasActiveFilters" class="filter-group">
        <goa-button type="tertiary" size="compact" @_click="clearFilters">
          Clear Filters
        </goa-button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading">
      <goa-circular-progress size="large"></goa-circular-progress>
      <p>Loading scholarships...</p>
    </div>

    <!-- Results -->
    <div v-else-if="filteredScholarships.length > 0" class="results">
      <p class="results-count">{{ filteredScholarships.length }} scholarship(s) found</p>
      <div class="scholarship-grid">
        <div
          v-for="scholarship in filteredScholarships"
          :key="scholarship.id"
          class="scholarship-card"
        >
          <div class="card-header">
            <span class="badge" :class="scholarship.type.replace(/\s+/g, '-')">
              {{ scholarship.type }}
            </span>
            <span v-if="scholarship.category" class="category-tag">
              {{ scholarship.category }}
            </span>
          </div>
          <h3>{{ scholarship.name }}</h3>
          <div class="card-details">
            <div v-if="scholarship.value" class="detail-row">
              <strong>Award Value:</strong> {{ scholarship.value }}
            </div>
            <div class="detail-row">
              <strong>Deadline:</strong> {{ formatDate(scholarship.deadline_end) }}
            </div>
          </div>
          <div class="card-actions">
            <goa-button size="compact" type="tertiary" @_click="viewDetails(scholarship.id)">
              View Details
            </goa-button>
            <goa-button
              v-if="scholarship.type === 'online application'"
              size="compact"
              type="primary"
              @_click="applyNow(scholarship.id)"
            >
              Apply Now
            </goa-button>
          </div>
        </div>
      </div>
    </div>

    <!-- No Results -->
    <div v-else class="no-results">
      <goa-callout type="information">
        <p>No scholarships found matching your criteria. Try adjusting your filters.</p>
      </goa-callout>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { scholarshipsAPI } from '@/services/scholarshipService';

const router = useRouter();
const scholarships = ref([]);
const types = ref([]);
const categories = ref([]);
const loading = ref(true);
const search = ref('');
const filterType = ref('');
const filterCategory = ref('');

const hasActiveFilters = computed(() => {
  return search.value || filterType.value || filterCategory.value;
});

function clearFilters() {
  search.value = '';
  filterType.value = '';
  filterCategory.value = '';
}

const filteredScholarships = computed(() => {
  let result = scholarships.value;

  if (search.value) {
    const q = search.value.toLowerCase();
    result = result.filter(s =>
      s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)
    );
  }

  if (filterType.value) {
    result = result.filter(s => s.type === filterType.value);
  }

  if (filterCategory.value) {
    result = result.filter(s => s.category === filterCategory.value);
  }

  return result;
});

onMounted(async () => {
  try {
    const [scholarshipsRes, typesRes, categoriesRes] = await Promise.all([
      scholarshipsAPI.getAll(),
      scholarshipsAPI.getTypes(),
      scholarshipsAPI.getCategories()
    ]);
    scholarships.value = scholarshipsRes.data || [];
    types.value = typesRes.data || [];
    categories.value = categoriesRes.data || [];
  } catch (error) {
    console.error('Failed to load scholarships:', error);
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

function viewDetails(id) {
  router.push(`/scholarships/${id}`);
}

function applyNow(id) {
  router.push(`/apply/${id}`);
}
</script>

<style scoped>
.catalog-page {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: var(--goa-space-l);
}

.page-header h1 {
  font-size: var(--goa-font-size-7);
  font-weight: var(--goa-font-weight-bold);
  color: var(--goa-color-text-default);
  margin-bottom: var(--goa-space-xs);
}

.page-header p {
  color: var(--goa-color-text-secondary);
  font-size: var(--goa-font-size-4);
}

.filters-bar {
  display: flex;
  gap: var(--goa-space-m);
  margin-bottom: var(--goa-space-l);
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  min-width: 250px;
}

.filter-group {
  min-width: 180px;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--goa-space-m);
  padding: var(--goa-space-xl);
}

.results-count {
  color: var(--goa-color-text-secondary);
  margin-bottom: var(--goa-space-m);
  font-size: var(--goa-font-size-3);
}

.scholarship-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: var(--goa-space-m);
}

.scholarship-card {
  border: 1px solid var(--goa-color-greyscale-200);
  border-radius: var(--goa-border-radius-m);
  padding: var(--goa-space-m);
  background: var(--goa-color-greyscale-white);
  display: flex;
  flex-direction: column;
  gap: var(--goa-space-s);
}

.card-header {
  display: flex;
  gap: var(--goa-space-xs);
  flex-wrap: wrap;
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

.scholarship-card h3 {
  font-size: var(--goa-font-size-4);
  font-weight: var(--goa-font-weight-bold);
  color: var(--goa-color-text-default);
  margin: 0;
}

.card-details {
  display: flex;
  flex-direction: column;
  gap: var(--goa-space-2xs);
  font-size: var(--goa-font-size-3);
  flex: 1;
}

.detail-row strong {
  color: var(--goa-color-text-default);
}

.card-actions {
  display: flex;
  gap: var(--goa-space-s);
  margin-top: var(--goa-space-xs);
}

@media (max-width: 768px) {
  .scholarship-grid {
    grid-template-columns: 1fr;
  }
  .filters-bar {
    flex-direction: column;
  }
}
</style>
