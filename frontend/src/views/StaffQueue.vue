<template>
  <div class="staff-queue">
    <header class="page-header">
      <h1>Application Work Queue</h1>
      <p>{{ total }} applications</p>
    </header>

    <!-- Filters -->
    <div class="filters">
      <div class="filter-row">
        <goa-input name="search" placeholder="Search ref#, name, email..." :value="filters.search" @_change="(e) => { filters.search = e.detail.value; loadQueue(); }" width="250px"></goa-input>
        <goa-dropdown name="status" :value="filters.status" @_change="(e) => { filters.status = e.detail.value; loadQueue(); }">
          <goa-dropdown-item value="" label="All Statuses"></goa-dropdown-item>
          <goa-dropdown-item value="Submitted" label="Submitted"></goa-dropdown-item>
          <goa-dropdown-item value="Under Review" label="Under Review"></goa-dropdown-item>
          <goa-dropdown-item value="Missing Info" label="Missing Info"></goa-dropdown-item>
          <goa-dropdown-item value="Approved" label="Approved"></goa-dropdown-item>
          <goa-dropdown-item value="Rejected" label="Rejected"></goa-dropdown-item>
        </goa-dropdown>
        <goa-dropdown name="reviewer" :value="filters.reviewer_id" @_change="(e) => { filters.reviewer_id = e.detail.value; loadQueue(); }">
          <goa-dropdown-item value="" label="All Reviewers"></goa-dropdown-item>
          <goa-dropdown-item v-for="s in staffMembers" :key="s.id" :value="s.id" :label="s.display_name"></goa-dropdown-item>
        </goa-dropdown>
        <goa-button v-if="hasFilters" type="tertiary" size="compact" @_click="clearFilters">Clear</goa-button>
      </div>

      <!-- Bulk Actions -->
      <div v-if="selectedIds.length > 0" class="bulk-actions">
        <span>{{ selectedIds.length }} selected</span>
        <goa-dropdown name="bulk-assign" :value="''" @_change="handleBulkAssign">
          <goa-dropdown-item value="" label="Assign to..."></goa-dropdown-item>
          <goa-dropdown-item v-for="s in staffMembers" :key="s.id" :value="s.id" :label="s.display_name"></goa-dropdown-item>
        </goa-dropdown>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <goa-circular-progress size="large"></goa-circular-progress>
    </div>

    <div v-else>
      <table class="queue-table">
        <thead>
          <tr>
            <th class="check-col"><input type="checkbox" @change="toggleAll" :checked="allSelected" /></th>
            <th class="sortable" @click="sort('reference_number')">Ref # {{ sortIcon('reference_number') }}</th>
            <th>Applicant</th>
            <th class="sortable" @click="sort('scholarship_name')">Scholarship {{ sortIcon('scholarship_name') }}</th>
            <th class="sortable" @click="sort('status')">Status {{ sortIcon('status') }}</th>
            <th class="sortable" @click="sort('submitted_at')">Submitted {{ sortIcon('submitted_at') }}</th>
            <th class="sortable" @click="sort('days_in_queue')">Days {{ sortIcon('days_in_queue') }}</th>
            <th>Assigned To</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="app in applications" :key="app.id" :class="{ selected: selectedIds.includes(app.id) }">
            <td><input type="checkbox" :checked="selectedIds.includes(app.id)" @change="toggleSelect(app.id)" /></td>
            <td class="ref-cell">{{ app.reference_number }}</td>
            <td>{{ app.applicant_first_name }} {{ app.applicant_last_name }}</td>
            <td class="scholarship-cell">{{ app.scholarship_name }}</td>
            <td><span class="status-badge" :class="app.status.toLowerCase().replace(/\s+/g, '-')">{{ app.status }}</span></td>
            <td>{{ formatDate(app.submitted_at) }}</td>
            <td :class="getDaysClass(app.days_in_queue)">{{ app.days_in_queue || '-' }}</td>
            <td>{{ app.reviewer_name || 'Unassigned' }}</td>
            <td>
              <goa-button type="tertiary" size="compact" @_click="$router.push('/staff/review/' + app.id)">Review</goa-button>
            </td>
          </tr>
          <tr v-if="applications.length === 0">
            <td colspan="9" class="empty-row">No applications found matching your filters.</td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="pagination">
        <goa-button type="tertiary" size="compact" :disabled="currentPage <= 1" @_click="goToPage(currentPage - 1)">Previous</goa-button>
        <span>Page {{ currentPage }} of {{ totalPages }}</span>
        <goa-button type="tertiary" size="compact" :disabled="currentPage >= totalPages" @_click="goToPage(currentPage + 1)">Next</goa-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { staffAPI } from '@/services/staffService';

const loading = ref(true);
const applications = ref([]);
const total = ref(0);
const currentPage = ref(1);
const totalPages = ref(1);
const staffMembers = ref([]);
const selectedIds = ref([]);
const sortBy = ref('submitted_at');
const sortDir = ref('ASC');

const filters = reactive({ search: '', status: '', reviewer_id: '' });
const hasFilters = computed(() => filters.search || filters.status || filters.reviewer_id);
const allSelected = computed(() => applications.value.length > 0 && selectedIds.value.length === applications.value.length);

onMounted(async () => {
  try {
    const members = await staffAPI.getMembers();
    staffMembers.value = members;
  } catch (e) { /* ignore */ }
  await loadQueue();
});

async function loadQueue() {
  loading.value = true;
  try {
    const result = await staffAPI.getQueue({
      status: filters.status || undefined,
      reviewer_id: filters.reviewer_id || undefined,
      search: filters.search || undefined,
      sort_by: sortBy.value,
      sort_dir: sortDir.value,
      page: currentPage.value,
      limit: 25
    });
    applications.value = result.applications;
    total.value = result.total;
    totalPages.value = result.totalPages;
  } catch (err) {
    console.error('Failed to load queue:', err);
  } finally {
    loading.value = false;
  }
}

function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getDaysClass(days) {
  if (days >= 45) return 'days-overdue';
  if (days >= 30) return 'days-warning';
  return '';
}

function sort(col) {
  if (sortBy.value === col) {
    sortDir.value = sortDir.value === 'ASC' ? 'DESC' : 'ASC';
  } else {
    sortBy.value = col;
    sortDir.value = 'ASC';
  }
  loadQueue();
}

function sortIcon(col) {
  if (sortBy.value !== col) return '';
  return sortDir.value === 'ASC' ? '\u25B2' : '\u25BC';
}

function toggleSelect(id) {
  const idx = selectedIds.value.indexOf(id);
  if (idx >= 0) selectedIds.value.splice(idx, 1);
  else selectedIds.value.push(id);
}

function toggleAll() {
  if (allSelected.value) selectedIds.value = [];
  else selectedIds.value = applications.value.map(a => a.id);
}

async function handleBulkAssign(e) {
  const assigneeId = e.detail.value;
  if (!assigneeId) return;
  try {
    await staffAPI.bulkAssign(selectedIds.value, assigneeId);
    selectedIds.value = [];
    await loadQueue();
  } catch (err) {
    console.error('Bulk assign failed:', err);
  }
}

function clearFilters() {
  filters.search = '';
  filters.status = '';
  filters.reviewer_id = '';
  currentPage.value = 1;
  loadQueue();
}

function goToPage(p) {
  currentPage.value = p;
  loadQueue();
}
</script>

<style scoped>
.staff-queue { max-width: 1400px; margin: 0 auto; }
.page-header { margin-bottom: var(--goa-space-l); }
.page-header h1 { font-size: var(--goa-font-size-7); font-weight: var(--goa-font-weight-bold); margin-bottom: var(--goa-space-2xs); }
.page-header p { color: var(--goa-color-text-secondary); }

.filters { margin-bottom: var(--goa-space-l); }
.filter-row { display: flex; gap: var(--goa-space-m); align-items: flex-end; flex-wrap: wrap; margin-bottom: var(--goa-space-s); }
.bulk-actions { display: flex; gap: var(--goa-space-m); align-items: center; padding: var(--goa-space-s); background: #e8f0fe; border-radius: var(--goa-border-radius-s); }

.queue-table { width: 100%; border-collapse: collapse; font-size: var(--goa-font-size-2); }
.queue-table th, .queue-table td { padding: var(--goa-space-s); text-align: left; border-bottom: 1px solid var(--goa-color-greyscale-200); }
.queue-table th { font-weight: var(--goa-font-weight-bold); background: var(--goa-color-greyscale-100); position: sticky; top: 0; }
.sortable { cursor: pointer; user-select: none; }
.sortable:hover { background: var(--goa-color-greyscale-200); }
.check-col { width: 36px; }
tr.selected { background: #e8f0fe; }
.ref-cell { font-family: monospace; font-size: var(--goa-font-size-1); }
.scholarship-cell { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.empty-row { text-align: center; color: var(--goa-color-text-secondary); padding: var(--goa-space-xl); }

.status-badge { padding: 2px 8px; border-radius: 4px; font-size: var(--goa-font-size-1); font-weight: var(--goa-font-weight-bold); }
.status-badge.submitted { background: #fef7e0; color: #b06000; }
.status-badge.under-review { background: #e8f0fe; color: #1a73e8; }
.status-badge.missing-info { background: #fef7e0; color: #b06000; }
.status-badge.approved { background: #e6f4ea; color: #137333; }
.status-badge.rejected { background: #fce8e6; color: #c5221f; }
.status-badge.pending-payment { background: #e8f0fe; color: #1a73e8; }
.status-badge.paid { background: #e6f4ea; color: #137333; }
.status-badge.withdrawn { background: var(--goa-color-greyscale-200); color: var(--goa-color-text-secondary); }

.days-overdue { color: #c5221f; font-weight: var(--goa-font-weight-bold); }
.days-warning { color: #b06000; font-weight: var(--goa-font-weight-bold); }

.pagination { display: flex; justify-content: center; align-items: center; gap: var(--goa-space-m); padding: var(--goa-space-l) 0; }
.loading { display: flex; justify-content: center; padding: var(--goa-space-xl); }

@media (max-width: 1024px) {
  .queue-table { font-size: var(--goa-font-size-1); }
  .queue-table th, .queue-table td { padding: var(--goa-space-xs); }
}
</style>
