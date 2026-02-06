<template>
  <div class="staff-dashboard">
    <header class="page-header">
      <h1>Staff Dashboard</h1>
      <p>Application processing overview</p>
    </header>

    <div v-if="loading" class="loading">
      <goa-circular-progress size="large"></goa-circular-progress>
    </div>

    <goa-callout v-else-if="error" type="emergency" heading="Error loading dashboard">
      {{ error }}
    </goa-callout>

    <div v-else>
      <!-- Summary Cards -->
      <div class="stat-cards">
        <div class="stat-card">
          <h3>Pending Review</h3>
          <p class="stat-number warning">{{ stats.summary?.pending_review || 0 }}</p>
        </div>
        <div class="stat-card">
          <h3>Submitted</h3>
          <p class="stat-number">{{ stats.summary?.submitted || 0 }}</p>
        </div>
        <div class="stat-card">
          <h3>Under Review</h3>
          <p class="stat-number">{{ stats.summary?.under_review || 0 }}</p>
        </div>
        <div class="stat-card">
          <h3>Missing Info</h3>
          <p class="stat-number warning">{{ stats.summary?.missing_info || 0 }}</p>
        </div>
        <div class="stat-card">
          <h3>Approved</h3>
          <p class="stat-number success">{{ stats.summary?.approved || 0 }}</p>
        </div>
        <div class="stat-card">
          <h3>Rejected</h3>
          <p class="stat-number danger">{{ stats.summary?.rejected || 0 }}</p>
        </div>
        <div class="stat-card">
          <h3>Avg. Turnaround</h3>
          <p class="stat-number">{{ stats.summary?.avg_turnaround_days || 0 }} days</p>
        </div>
        <div class="stat-card">
          <h3>Total Applications</h3>
          <p class="stat-number">{{ stats.summary?.total_applications || 0 }}</p>
        </div>
      </div>

      <div class="dashboard-grid">
        <!-- Volume by Scholarship -->
        <section class="dashboard-section">
          <h2>Volume by Scholarship (Top 10)</h2>
          <div v-if="stats.byScholarship?.length > 0" class="bar-chart">
            <div v-for="item in stats.byScholarship" :key="item.name" class="bar-row">
              <span class="bar-label">{{ item.name }}</span>
              <div class="bar-container">
                <div class="bar-fill" :style="{ width: getBarWidth(item.count) + '%' }"></div>
                <span class="bar-value">{{ item.count }}</span>
              </div>
            </div>
          </div>
          <p v-else class="no-data">No application data yet.</p>
        </section>

        <!-- Staff Workload -->
        <section class="dashboard-section">
          <h2>Staff Workload</h2>
          <div v-if="stats.staffWorkload?.length > 0" class="workload-list">
            <div v-for="staff in stats.staffWorkload" :key="staff.email" class="workload-item">
              <span class="staff-name">{{ staff.display_name || staff.email }}</span>
              <span class="workload-count">{{ staff.assigned_count }} assigned</span>
            </div>
          </div>
          <p v-else class="no-data">No applications assigned yet.</p>
        </section>

        <!-- Recent Activity -->
        <section class="dashboard-section full-width">
          <h2>Recent Activity</h2>
          <div v-if="stats.recentActivity?.length > 0" class="activity-list">
            <div v-for="act in stats.recentActivity" :key="act.id || act.created_at" class="activity-item">
              <strong>{{ formatAction(act.action) }}</strong>
              <span>by {{ act.staff_name || 'System' }}</span>
              <span class="activity-date">{{ formatDateTime(act.created_at) }}</span>
            </div>
          </div>
          <p v-else class="no-data">No recent activity.</p>
        </section>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <goa-button type="primary" @_click="$router.push('/staff/queue')">View Work Queue</goa-button>
        <goa-button type="secondary" @_click="$router.push('/staff/reports')">Generate Reports</goa-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { staffAPI } from '@/services/staffService';

const loading = ref(true);
const stats = ref({});
const error = ref(null);

onMounted(async () => {
  try {
    stats.value = await staffAPI.getDashboardStats();
  } catch (err) {
    console.error('Failed to load dashboard:', err);
    error.value = err.response?.data?.message || err.message || 'Failed to load dashboard data';
  } finally {
    loading.value = false;
  }
});

function getBarWidth(count) {
  const max = Math.max(...(stats.value.byScholarship?.map(s => parseInt(s.count)) || [1]));
  return (parseInt(count) / max) * 100;
}

function formatAction(action) {
  return action?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) || action;
}

function formatDateTime(d) {
  if (!d) return '';
  return new Date(d).toLocaleString('en-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
</script>

<style scoped>
.staff-dashboard { max-width: 1400px; margin: 0 auto; }
.page-header { margin-bottom: var(--goa-space-l); }
.page-header h1 { font-size: var(--goa-font-size-7); font-weight: var(--goa-font-weight-bold); margin-bottom: var(--goa-space-2xs); }
.page-header p { color: var(--goa-color-text-secondary); }

.stat-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--goa-space-m); margin-bottom: var(--goa-space-xl); }
.stat-card { padding: var(--goa-space-l); background: var(--goa-color-greyscale-white); border: 1px solid var(--goa-color-greyscale-200); border-radius: var(--goa-border-radius-m); text-align: center; }
.stat-card h3 { font-size: var(--goa-font-size-2); color: var(--goa-color-text-secondary); margin-bottom: var(--goa-space-xs); }
.stat-number { font-size: var(--goa-font-size-7); font-weight: var(--goa-font-weight-bold); color: var(--goa-color-interactive-default); }
.stat-number.warning { color: #b06000; }
.stat-number.success { color: #137333; }
.stat-number.danger { color: #c5221f; }

.dashboard-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--goa-space-xl); margin-bottom: var(--goa-space-xl); }
.dashboard-section { padding: var(--goa-space-l); background: var(--goa-color-greyscale-white); border: 1px solid var(--goa-color-greyscale-200); border-radius: var(--goa-border-radius-m); }
.dashboard-section.full-width { grid-column: 1 / -1; }
.dashboard-section h2 { font-size: var(--goa-font-size-4); font-weight: var(--goa-font-weight-bold); margin-bottom: var(--goa-space-m); }

.bar-chart { display: flex; flex-direction: column; gap: var(--goa-space-s); }
.bar-row { display: flex; align-items: center; gap: var(--goa-space-m); }
.bar-label { width: 200px; font-size: var(--goa-font-size-2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex-shrink: 0; }
.bar-container { flex: 1; display: flex; align-items: center; gap: var(--goa-space-xs); }
.bar-fill { height: 20px; background: var(--goa-color-interactive-default); border-radius: 3px; min-width: 4px; }
.bar-value { font-size: var(--goa-font-size-2); font-weight: var(--goa-font-weight-bold); }

.workload-list { display: flex; flex-direction: column; gap: var(--goa-space-s); }
.workload-item { display: flex; justify-content: space-between; padding: var(--goa-space-s); background: var(--goa-color-greyscale-100); border-radius: var(--goa-border-radius-s); }
.workload-count { font-weight: var(--goa-font-weight-bold); color: var(--goa-color-interactive-default); }

.activity-list { display: flex; flex-direction: column; gap: var(--goa-space-xs); }
.activity-item { display: flex; gap: var(--goa-space-s); font-size: var(--goa-font-size-2); padding: var(--goa-space-xs) 0; border-bottom: 1px solid var(--goa-color-greyscale-100); }
.activity-date { color: var(--goa-color-text-secondary); margin-left: auto; }

.quick-actions { display: flex; gap: var(--goa-space-m); }
.no-data { color: var(--goa-color-text-secondary); font-style: italic; }
.loading { display: flex; justify-content: center; padding: var(--goa-space-xl); }

@media (max-width: 1024px) {
  .stat-cards { grid-template-columns: repeat(2, 1fr); }
  .dashboard-grid { grid-template-columns: 1fr; }
}
</style>
