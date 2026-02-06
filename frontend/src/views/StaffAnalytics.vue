<template>
  <div class="analytics-page">
    <header class="page-header">
      <h1>Analytics Dashboard</h1>
      <p>Key performance indicators and application insights</p>
    </header>

    <div v-if="loading" class="loading">
      <goa-circular-progress size="large"></goa-circular-progress>
    </div>

    <goa-callout v-else-if="error" type="emergency" heading="Error">{{ error }}</goa-callout>

    <div v-else>
      <!-- KPI Cards -->
      <div class="kpi-row">
        <div class="kpi-card">
          <span class="kpi-label">Total Applications</span>
          <span class="kpi-value">{{ data.kpis.total_applications }}</span>
        </div>
        <div class="kpi-card kpi-success">
          <span class="kpi-label">Approval Rate</span>
          <span class="kpi-value">{{ data.kpis.approval_rate }}%</span>
          <div class="kpi-bar"><div class="kpi-bar-fill" :style="{ width: data.kpis.approval_rate + '%' }"></div></div>
        </div>
        <div class="kpi-card kpi-warn">
          <span class="kpi-label">MI Rate</span>
          <span class="kpi-value">{{ data.kpis.mi_rate }}%</span>
          <div class="kpi-bar"><div class="kpi-bar-fill warn" :style="{ width: data.kpis.mi_rate + '%' }"></div></div>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Avg. Turnaround</span>
          <span class="kpi-value">{{ data.kpis.avg_turnaround_days }} <small>days</small></span>
          <span class="kpi-target" :class="data.kpis.avg_turnaround_days <= data.kpis.target_turnaround_days ? 'on-target' : 'off-target'">
            Target: {{ data.kpis.target_turnaround_days }} days
          </span>
        </div>
        <div class="kpi-card kpi-info">
          <span class="kpi-label">DD Adoption</span>
          <span class="kpi-value">{{ data.kpis.direct_deposit_rate }}%</span>
          <div class="kpi-bar"><div class="kpi-bar-fill info" :style="{ width: data.kpis.direct_deposit_rate + '%' }"></div></div>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Total Disbursed</span>
          <span class="kpi-value">${{ formatCurrency(data.paymentStats.total_disbursed) }}</span>
          <span class="kpi-sub">{{ data.paymentStats.paid_batches }} batches paid</span>
        </div>
      </div>

      <div class="charts-grid">
        <!-- Status Distribution (Donut Chart) -->
        <section class="chart-section">
          <h2>Application Status Distribution</h2>
          <div class="donut-wrapper">
            <svg viewBox="0 0 200 200" class="donut-chart">
              <circle v-for="(seg, i) in donutSegments" :key="i"
                cx="100" cy="100" r="80"
                fill="none"
                :stroke="seg.color"
                stroke-width="30"
                :stroke-dasharray="seg.dashArray"
                :stroke-dashoffset="seg.dashOffset"
                :transform="'rotate(-90 100 100)'"
              />
              <text x="100" y="95" text-anchor="middle" class="donut-total">{{ totalApplications }}</text>
              <text x="100" y="115" text-anchor="middle" class="donut-label">Total</text>
            </svg>
            <div class="donut-legend">
              <div v-for="item in data.statusDistribution" :key="item.status" class="legend-item">
                <span class="legend-dot" :style="{ background: statusColor(item.status) }"></span>
                <span class="legend-name">{{ item.status }}</span>
                <span class="legend-value">{{ item.count }} ({{ item.percentage }}%)</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Monthly Trends -->
        <section class="chart-section">
          <h2>Application Volume (Monthly)</h2>
          <div v-if="data.monthlyTrends.length > 0" class="trend-chart">
            <div v-for="month in data.monthlyTrends" :key="month.month" class="trend-bar-group">
              <div class="trend-bars">
                <div class="trend-bar approved" :style="{ height: trendBarHeight(month.approved) + 'px' }" :title="'Approved: ' + month.approved"></div>
                <div class="trend-bar rejected" :style="{ height: trendBarHeight(month.rejected) + 'px' }" :title="'Rejected: ' + month.rejected"></div>
                <div class="trend-bar total" :style="{ height: trendBarHeight(month.total - month.approved - month.rejected) + 'px' }" :title="'Other: ' + (month.total - month.approved - month.rejected)"></div>
              </div>
              <span class="trend-label">{{ formatMonth(month.month) }}</span>
              <span class="trend-value">{{ month.total }}</span>
            </div>
          </div>
          <p v-else class="no-data">No trend data available yet.</p>
          <div class="trend-legend">
            <span><span class="legend-dot" style="background: #137333;"></span> Approved</span>
            <span><span class="legend-dot" style="background: #c5221f;"></span> Rejected</span>
            <span><span class="legend-dot" style="background: #0070c4;"></span> Other</span>
          </div>
        </section>

        <!-- Top Scholarships -->
        <section class="chart-section">
          <h2>Top Scholarships by Volume</h2>
          <div v-if="data.topScholarships.length > 0" class="h-bar-chart">
            <div v-for="sch in data.topScholarships" :key="sch.code" class="h-bar-row">
              <span class="h-bar-label" :title="sch.name">{{ sch.name }}</span>
              <div class="h-bar-track">
                <div class="h-bar-fill approved" :style="{ width: hBarWidth(sch.approved) + '%' }"></div>
                <div class="h-bar-fill rejected" :style="{ width: hBarWidth(sch.rejected) + '%', left: hBarWidth(sch.approved) + '%' }"></div>
                <div class="h-bar-fill other" :style="{ width: hBarWidth(sch.total - sch.approved - sch.rejected) + '%', left: hBarWidth(sch.approved + sch.rejected) + '%' }"></div>
              </div>
              <span class="h-bar-value">{{ sch.total }}</span>
            </div>
          </div>
          <p v-else class="no-data">No scholarship data.</p>
        </section>

        <!-- Processing Time Distribution -->
        <section class="chart-section">
          <h2>Processing Time Distribution</h2>
          <div v-if="data.processingTimes.length > 0" class="proc-chart">
            <div v-for="pt in data.processingTimes" :key="pt.range" class="proc-row">
              <span class="proc-label">{{ pt.range }}</span>
              <div class="proc-bar-track">
                <div class="proc-bar-fill" :class="procBarClass(pt.range)" :style="{ width: procBarWidth(pt.count) + '%' }"></div>
              </div>
              <span class="proc-value">{{ pt.count }}</span>
            </div>
          </div>
          <p v-else class="no-data">No processing time data.</p>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { analyticsAPI } from '@/services/analyticsService';

const loading = ref(true);
const error = ref(null);
const data = ref({
  statusDistribution: [],
  kpis: {},
  monthlyTrends: [],
  topScholarships: [],
  processingTimes: [],
  paymentStats: {}
});

onMounted(async () => {
  try {
    data.value = await analyticsAPI.getDashboard();
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Failed to load analytics';
  } finally {
    loading.value = false;
  }
});

const totalApplications = computed(() =>
  data.value.statusDistribution.reduce((sum, s) => sum + s.count, 0)
);

const statusColors = {
  'Draft': '#9e9e9e',
  'Submitted': '#0070c4',
  'Under Review': '#6f42c1',
  'Missing Info': '#b06000',
  'Approved': '#137333',
  'Rejected': '#c5221f',
  'Pending Payment': '#0d6efd',
  'Paid': '#198754'
};

function statusColor(status) {
  return statusColors[status] || '#666';
}

// Donut chart segments
const donutSegments = computed(() => {
  const total = totalApplications.value;
  if (total === 0) return [];

  const circumference = 2 * Math.PI * 80;
  let offset = 0;
  return data.value.statusDistribution.map(item => {
    const percentage = item.count / total;
    const dashLength = percentage * circumference;
    const seg = {
      color: statusColor(item.status),
      dashArray: `${dashLength} ${circumference - dashLength}`,
      dashOffset: -offset
    };
    offset += dashLength;
    return seg;
  });
});

// Trend chart helpers
const maxTrend = computed(() =>
  Math.max(...data.value.monthlyTrends.map(m => m.total), 1)
);

function trendBarHeight(count) {
  return Math.max((count / maxTrend.value) * 120, count > 0 ? 4 : 0);
}

function formatMonth(m) {
  if (!m) return '';
  const [y, mo] = m.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[parseInt(mo) - 1] || mo;
}

// Horizontal bar helpers
const maxScholarship = computed(() =>
  Math.max(...data.value.topScholarships.map(s => s.total), 1)
);

function hBarWidth(count) {
  return (count / maxScholarship.value) * 100;
}

// Processing time helpers
const maxProcTime = computed(() =>
  Math.max(...data.value.processingTimes.map(p => p.count), 1)
);

function procBarWidth(count) {
  return (count / maxProcTime.value) * 100;
}

function procBarClass(range) {
  if (range.includes('0-7')) return 'fast';
  if (range.includes('8-14')) return 'medium';
  if (range.includes('15-30')) return 'slow';
  return 'very-slow';
}

function formatCurrency(val) {
  return (val || 0).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
</script>

<style scoped>
.analytics-page { max-width: 1400px; margin: 0 auto; padding: 24px; }
.page-header { margin-bottom: 24px; }
.page-header h1 { font-size: 28px; font-weight: 700; margin-bottom: 4px; }
.page-header p { color: #666; }

/* KPI Cards */
.kpi-row { display: grid; grid-template-columns: repeat(6, 1fr); gap: 16px; margin-bottom: 32px; }
.kpi-card {
  padding: 20px; background: white; border: 1px solid #e0e0e0; border-radius: 8px;
  text-align: center; position: relative;
}
.kpi-card.kpi-success { border-left: 4px solid #137333; }
.kpi-card.kpi-warn { border-left: 4px solid #b06000; }
.kpi-card.kpi-info { border-left: 4px solid #0070c4; }
.kpi-label { display: block; font-size: 12px; color: #666; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
.kpi-value { display: block; font-size: 32px; font-weight: 700; color: #333; }
.kpi-value small { font-size: 14px; font-weight: 400; color: #666; }
.kpi-sub { display: block; font-size: 12px; color: #666; margin-top: 4px; }
.kpi-target { display: block; font-size: 11px; margin-top: 4px; }
.kpi-target.on-target { color: #137333; }
.kpi-target.off-target { color: #c5221f; }
.kpi-bar { height: 6px; background: #e0e0e0; border-radius: 3px; margin-top: 8px; }
.kpi-bar-fill { height: 100%; border-radius: 3px; background: #137333; transition: width 0.5s; }
.kpi-bar-fill.warn { background: #b06000; }
.kpi-bar-fill.info { background: #0070c4; }

/* Charts Grid */
.charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.chart-section {
  padding: 24px; background: white; border: 1px solid #e0e0e0; border-radius: 8px;
}
.chart-section h2 { font-size: 16px; font-weight: 600; margin-bottom: 16px; }

/* Donut Chart */
.donut-wrapper { display: flex; align-items: center; gap: 24px; }
.donut-chart { width: 180px; height: 180px; flex-shrink: 0; }
.donut-total { font-size: 28px; font-weight: 700; fill: #333; }
.donut-label { font-size: 12px; fill: #666; }
.donut-legend { flex: 1; }
.legend-item { display: flex; align-items: center; gap: 8px; padding: 4px 0; font-size: 13px; }
.legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.legend-name { flex: 1; }
.legend-value { font-weight: 600; color: #333; }

/* Trend Chart */
.trend-chart { display: flex; align-items: flex-end; gap: 8px; height: 180px; padding-top: 20px; }
.trend-bar-group { flex: 1; display: flex; flex-direction: column; align-items: center; }
.trend-bars { display: flex; flex-direction: column-reverse; align-items: center; width: 100%; }
.trend-bar { width: 80%; min-height: 0; border-radius: 3px 3px 0 0; }
.trend-bar.approved { background: #137333; }
.trend-bar.rejected { background: #c5221f; }
.trend-bar.total { background: #0070c4; }
.trend-label { font-size: 11px; color: #666; margin-top: 4px; }
.trend-value { font-size: 11px; font-weight: 600; }
.trend-legend { display: flex; gap: 16px; margin-top: 12px; font-size: 12px; color: #666; }

/* Horizontal Bar Chart */
.h-bar-chart { display: flex; flex-direction: column; gap: 8px; }
.h-bar-row { display: flex; align-items: center; gap: 8px; }
.h-bar-label { width: 180px; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex-shrink: 0; }
.h-bar-track { flex: 1; height: 20px; background: #f1f1f1; border-radius: 3px; position: relative; overflow: hidden; }
.h-bar-fill { height: 100%; position: absolute; top: 0; }
.h-bar-fill.approved { background: #137333; }
.h-bar-fill.rejected { background: #c5221f; }
.h-bar-fill.other { background: #0070c4; }
.h-bar-value { width: 30px; font-size: 12px; font-weight: 600; text-align: right; }

/* Processing Time */
.proc-chart { display: flex; flex-direction: column; gap: 10px; }
.proc-row { display: flex; align-items: center; gap: 12px; }
.proc-label { width: 80px; font-size: 13px; flex-shrink: 0; }
.proc-bar-track { flex: 1; height: 24px; background: #f1f1f1; border-radius: 4px; overflow: hidden; }
.proc-bar-fill { height: 100%; border-radius: 4px; transition: width 0.5s; }
.proc-bar-fill.fast { background: #137333; }
.proc-bar-fill.medium { background: #0070c4; }
.proc-bar-fill.slow { background: #b06000; }
.proc-bar-fill.very-slow { background: #c5221f; }
.proc-value { width: 30px; font-size: 13px; font-weight: 600; text-align: right; }

.no-data { color: #666; font-style: italic; text-align: center; padding: 20px; }
.loading { text-align: center; padding: 60px; }

@media (max-width: 1200px) {
  .kpi-row { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 1024px) {
  .charts-grid { grid-template-columns: 1fr; }
  .kpi-row { grid-template-columns: repeat(2, 1fr); }
}
</style>
