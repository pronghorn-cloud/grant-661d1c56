<template>
  <div class="staff-reports">
    <header class="page-header">
      <h1>Reports</h1>
      <p>Generate and export application processing reports</p>
    </header>

    <!-- Report Filters -->
    <div class="report-filters">
      <div class="filter-row">
        <goa-form-item label="Start Date">
          <goa-input name="start_date" type="date" :value="filters.start_date" @_change="(e) => filters.start_date = e.detail.value" width="180px"></goa-input>
        </goa-form-item>
        <goa-form-item label="End Date">
          <goa-input name="end_date" type="date" :value="filters.end_date" @_change="(e) => filters.end_date = e.detail.value" width="180px"></goa-input>
        </goa-form-item>
        <goa-form-item label="Status">
          <goa-dropdown name="status" :value="filters.status" @_change="(e) => filters.status = e.detail.value">
            <goa-dropdown-item value="" label="All Statuses"></goa-dropdown-item>
            <goa-dropdown-item value="Submitted" label="Submitted"></goa-dropdown-item>
            <goa-dropdown-item value="Under Review" label="Under Review"></goa-dropdown-item>
            <goa-dropdown-item value="Missing Info" label="Missing Info"></goa-dropdown-item>
            <goa-dropdown-item value="Approved" label="Approved"></goa-dropdown-item>
            <goa-dropdown-item value="Rejected" label="Rejected"></goa-dropdown-item>
            <goa-dropdown-item value="Paid" label="Paid"></goa-dropdown-item>
          </goa-dropdown>
        </goa-form-item>
      </div>
      <div class="filter-actions">
        <goa-button type="primary" @_click="generateReport" :disabled="loading">Generate Report</goa-button>
        <goa-button v-if="report" type="secondary" @_click="exportCSV">Export CSV</goa-button>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <goa-circular-progress size="large"></goa-circular-progress>
    </div>

    <goa-callout v-if="error" type="emergency" heading="Report Error">
      {{ error }}
    </goa-callout>

    <div v-if="report">
      <!-- Metrics Summary -->
      <div class="metrics-cards">
        <div class="metric-card">
          <h3>Total</h3>
          <p class="metric-value">{{ report.metrics.total }}</p>
        </div>
        <div class="metric-card">
          <h3>Approved</h3>
          <p class="metric-value success">{{ report.metrics.approved }}</p>
        </div>
        <div class="metric-card">
          <h3>Rejected</h3>
          <p class="metric-value danger">{{ report.metrics.rejected }}</p>
        </div>
        <div class="metric-card">
          <h3>Missing Info</h3>
          <p class="metric-value warning">{{ report.metrics.missingInfo }}</p>
        </div>
        <div class="metric-card">
          <h3>Approval Rate</h3>
          <p class="metric-value">{{ report.metrics.approvalRate }}%</p>
        </div>
        <div class="metric-card">
          <h3>MI Rate</h3>
          <p class="metric-value">{{ report.metrics.miRate }}%</p>
        </div>
        <div class="metric-card">
          <h3>Avg. Turnaround</h3>
          <p class="metric-value">{{ report.metrics.avgTurnaround }} days</p>
        </div>
      </div>

      <!-- Data Table -->
      <div class="report-table-wrap">
        <table class="report-table">
          <thead>
            <tr>
              <th>Ref #</th>
              <th>Applicant</th>
              <th>Email</th>
              <th>Scholarship</th>
              <th>Status</th>
              <th>Submitted</th>
              <th>Decision</th>
              <th>Days</th>
              <th>Reviewer</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in report.data" :key="row.id">
              <td class="ref-cell">{{ row.reference_number }}</td>
              <td>{{ row.first_name }} {{ row.last_name }}</td>
              <td>{{ row.applicant_email }}</td>
              <td class="scholarship-cell">{{ row.scholarship_name }}</td>
              <td><span class="status-badge" :class="row.status.toLowerCase().replace(/\s+/g, '-')">{{ row.status }}</span></td>
              <td>{{ formatDate(row.submitted_at) }}</td>
              <td>{{ row.decision || '-' }}</td>
              <td>{{ row.processing_days || '-' }}</td>
              <td>{{ row.reviewer_name || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="record-count">{{ report.data.length }} records</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { staffAPI } from '@/services/staffService';

const loading = ref(false);
const report = ref(null);
const error = ref(null);
const filters = reactive({ start_date: '', end_date: '', status: '' });

async function generateReport() {
  loading.value = true;
  error.value = null;
  try {
    const params = {};
    if (filters.start_date) params.start_date = filters.start_date;
    if (filters.end_date) params.end_date = filters.end_date;
    if (filters.status) params.status = filters.status;
    report.value = await staffAPI.getReport(params);
  } catch (err) {
    console.error('Failed to generate report:', err);
    error.value = err.response?.data?.message || err.message || 'Failed to generate report';
  } finally {
    loading.value = false;
  }
}

// Auto-load report on mount
onMounted(() => generateReport());

function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
}

function exportCSV() {
  if (!report.value?.data) return;
  const headers = ['Reference', 'First Name', 'Last Name', 'Email', 'Scholarship', 'Status', 'Submitted', 'Decision', 'Processing Days', 'Reviewer'];
  const rows = report.value.data.map(r => [
    r.reference_number, r.first_name, r.last_name, r.applicant_email,
    r.scholarship_name, r.status, r.submitted_at?.substring(0, 10) || '',
    r.decision || '', r.processing_days || '', r.reviewer_name || ''
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `report-${new Date().toISOString().substring(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
</script>

<style scoped>
.staff-reports { max-width: 1400px; margin: 0 auto; }
.page-header { margin-bottom: var(--goa-space-l); }
.page-header h1 { font-size: var(--goa-font-size-7); font-weight: var(--goa-font-weight-bold); margin-bottom: var(--goa-space-2xs); }
.page-header p { color: var(--goa-color-text-secondary); }

.report-filters { margin-bottom: var(--goa-space-xl); padding: var(--goa-space-l); background: var(--goa-color-greyscale-white); border: 1px solid var(--goa-color-greyscale-200); border-radius: var(--goa-border-radius-m); }
.filter-row { display: flex; gap: var(--goa-space-m); flex-wrap: wrap; margin-bottom: var(--goa-space-m); }
.filter-actions { display: flex; gap: var(--goa-space-m); }

.metrics-cards { display: grid; grid-template-columns: repeat(7, 1fr); gap: var(--goa-space-m); margin-bottom: var(--goa-space-xl); }
.metric-card { padding: var(--goa-space-m); background: var(--goa-color-greyscale-white); border: 1px solid var(--goa-color-greyscale-200); border-radius: var(--goa-border-radius-m); text-align: center; }
.metric-card h3 { font-size: var(--goa-font-size-1); color: var(--goa-color-text-secondary); margin-bottom: var(--goa-space-2xs); }
.metric-value { font-size: var(--goa-font-size-5); font-weight: var(--goa-font-weight-bold); color: var(--goa-color-interactive-default); }
.metric-value.success { color: #137333; }
.metric-value.danger { color: #c5221f; }
.metric-value.warning { color: #b06000; }

.report-table-wrap { overflow-x: auto; }
.report-table { width: 100%; border-collapse: collapse; font-size: var(--goa-font-size-2); }
.report-table th, .report-table td { padding: var(--goa-space-s); text-align: left; border-bottom: 1px solid var(--goa-color-greyscale-200); }
.report-table th { font-weight: var(--goa-font-weight-bold); background: var(--goa-color-greyscale-100); }
.ref-cell { font-family: monospace; font-size: var(--goa-font-size-1); }
.scholarship-cell { max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.record-count { color: var(--goa-color-text-secondary); font-size: var(--goa-font-size-2); margin-top: var(--goa-space-s); }

.status-badge { padding: 2px 8px; border-radius: 4px; font-size: var(--goa-font-size-1); font-weight: var(--goa-font-weight-bold); }
.status-badge.submitted { background: #fef7e0; color: #b06000; }
.status-badge.under-review { background: #e8f0fe; color: #1a73e8; }
.status-badge.missing-info { background: #fef7e0; color: #b06000; }
.status-badge.approved { background: #e6f4ea; color: #137333; }
.status-badge.rejected { background: #fce8e6; color: #c5221f; }
.status-badge.paid { background: #e6f4ea; color: #137333; }

.loading { display: flex; justify-content: center; padding: var(--goa-space-xl); }

@media (max-width: 1024px) {
  .metrics-cards { grid-template-columns: repeat(3, 1fr); }
}
</style>
