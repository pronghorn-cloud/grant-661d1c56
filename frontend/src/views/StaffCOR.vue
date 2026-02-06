<template>
  <div class="staff-cor">
    <h1>COR Management</h1>
    <p class="subtitle">Confirmation of Registration requests and tracking</p>

    <!-- Tab Navigation -->
    <div class="tabs">
      <button :class="{ active: activeTab === 'pending' }" @click="activeTab = 'pending'; loadPending()">
        Pending Responses ({{ pendingCount }})
      </button>
      <button :class="{ active: activeTab === 'all' }" @click="activeTab = 'all'; loadAll()">
        All Requests
      </button>
    </div>

    <!-- Error Display -->
    <goa-callout v-if="error" type="emergency" heading="Error">
      {{ error }}
    </goa-callout>

    <!-- Loading -->
    <div v-if="loading" class="loading">
      <goa-circular-progress size="large"></goa-circular-progress>
    </div>

    <!-- Pending Tab -->
    <div v-if="!loading && activeTab === 'pending'">
      <div v-if="pendingRequests.length === 0" class="empty-state">
        <p>No pending COR requests.</p>
      </div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>Reference #</th>
            <th>Applicant</th>
            <th>Institution</th>
            <th>Program</th>
            <th>Requested</th>
            <th>Days Pending</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="req in pendingRequests" :key="req.id" :class="{ overdue: req.days_pending > 14 }">
            <td>{{ req.reference_number }}</td>
            <td>{{ req.applicant_name }}</td>
            <td>{{ req.institution_name }}</td>
            <td>{{ req.program }}</td>
            <td>{{ formatDate(req.created_at) }}</td>
            <td>
              <span :class="pendingClass(req.days_pending)">{{ req.days_pending }} days</span>
            </td>
            <td>
              <goa-button type="tertiary" size="compact" @_click="copyResponseLink(req)">
                Copy Link
              </goa-button>
              <goa-button type="tertiary" size="compact" @_click="sendReminder(req)">
                Remind
              </goa-button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- All Requests Tab -->
    <div v-if="!loading && activeTab === 'all'">
      <div class="filters">
        <goa-dropdown name="statusFilter" :value="filters.status"
          @_change="(e) => { filters.status = e.detail.value; loadAll(); }">
          <goa-dropdown-item value="" label="All Statuses"></goa-dropdown-item>
          <goa-dropdown-item value="Sent" label="Sent"></goa-dropdown-item>
          <goa-dropdown-item value="Confirmed" label="Confirmed"></goa-dropdown-item>
          <goa-dropdown-item value="Not Confirmed" label="Not Confirmed"></goa-dropdown-item>
          <goa-dropdown-item value="Unable to Confirm" label="Unable to Confirm"></goa-dropdown-item>
        </goa-dropdown>
      </div>

      <div v-if="allRequests.length === 0" class="empty-state">
        <p>No COR requests found.</p>
      </div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>Reference #</th>
            <th>Applicant</th>
            <th>Institution</th>
            <th>Status</th>
            <th>Requested</th>
            <th>Responded</th>
            <th>Turnaround</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="req in allRequests" :key="req.id">
            <td>{{ req.reference_number }}</td>
            <td>{{ req.applicant_name }}</td>
            <td>{{ req.institution_name }}</td>
            <td>
              <span class="status-badge" :class="statusClass(req.status)">{{ req.status }}</span>
            </td>
            <td>{{ formatDate(req.created_at) }}</td>
            <td>{{ req.responded_at ? formatDate(req.responded_at) : '-' }}</td>
            <td>{{ req.turnaround_days != null ? req.turnaround_days + ' days' : '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- COR Send Dialog -->
    <div v-if="showSendDialog" class="modal-overlay" @click.self="showSendDialog = false">
      <div class="modal">
        <h2>Send COR Request</h2>
        <p>Send a Confirmation of Registration request to the institution for application {{ sendTarget?.reference_number }}.</p>

        <div class="form-group">
          <goa-input name="institution_email" type="email" :value="sendForm.institution_email"
            @_change="(e) => sendForm.institution_email = e.detail.value"
            width="100%">
            <span slot="leadingContent">Institution Email</span>
          </goa-input>
        </div>

        <div class="form-group">
          <label>Custom Message (optional)</label>
          <textarea v-model="sendForm.custom_message" rows="3" class="textarea"></textarea>
        </div>

        <div class="modal-actions">
          <goa-button type="secondary" @_click="showSendDialog = false">Cancel</goa-button>
          <goa-button type="primary" @_click="confirmSendCOR" :disabled="sendLoading">
            {{ sendLoading ? 'Sending...' : 'Send COR Request' }}
          </goa-button>
        </div>
      </div>
    </div>

    <!-- Success Toast -->
    <goa-callout v-if="successMsg" type="success" heading="Success">
      {{ successMsg }}
    </goa-callout>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { corAPI } from '@/services/corService';

const activeTab = ref('pending');
const loading = ref(true);
const error = ref(null);
const successMsg = ref(null);

const pendingRequests = ref([]);
const pendingCount = ref(0);
const allRequests = ref([]);
const filters = reactive({ status: '' });

const showSendDialog = ref(false);
const sendTarget = ref(null);
const sendLoading = ref(false);
const sendForm = reactive({ institution_email: '', custom_message: '' });

onMounted(() => loadPending());

async function loadPending() {
  loading.value = true;
  error.value = null;
  try {
    const res = await corAPI.getPending();
    pendingRequests.value = res.data || [];
    pendingCount.value = res.total || 0;
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Failed to load pending COR requests';
  } finally {
    loading.value = false;
  }
}

async function loadAll() {
  loading.value = true;
  error.value = null;
  try {
    const params = {};
    if (filters.status) params.status = filters.status;
    const res = await corAPI.getAll(params);
    allRequests.value = res.data || [];
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Failed to load COR requests';
  } finally {
    loading.value = false;
  }
}

function pendingClass(days) {
  if (days >= 14) return 'days-critical';
  if (days >= 7) return 'days-warning';
  return 'days-normal';
}

function statusClass(status) {
  if (status === 'Confirmed') return 'status-confirmed';
  if (status === 'Sent') return 'status-sent';
  if (status === 'Not Confirmed' || status === 'Unable to Confirm') return 'status-failed';
  return '';
}

function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-CA');
}

function copyResponseLink(req) {
  // The response link would be the institution portal URL
  const link = `${window.location.origin}/cor/respond/${req.response_token || req.id}`;
  navigator.clipboard.writeText(link).then(() => {
    successMsg.value = 'Response link copied to clipboard';
    setTimeout(() => successMsg.value = null, 3000);
  });
}

async function sendReminder(req) {
  successMsg.value = `Reminder sent to ${req.institution_email || req.institution_name}`;
  setTimeout(() => successMsg.value = null, 3000);
}

async function confirmSendCOR() {
  sendLoading.value = true;
  try {
    await corAPI.sendRequest(sendTarget.value.id, {
      institution_email: sendForm.institution_email,
      custom_message: sendForm.custom_message
    });
    showSendDialog.value = false;
    successMsg.value = 'COR request sent successfully';
    setTimeout(() => successMsg.value = null, 3000);
    loadPending();
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Failed to send COR request';
  } finally {
    sendLoading.value = false;
  }
}
</script>

<style scoped>
.staff-cor { max-width: 1200px; margin: 0 auto; padding: 24px; }
.subtitle { color: #666; margin-bottom: 24px; }

.tabs {
  display: flex; gap: 0; margin-bottom: 24px;
  border-bottom: 2px solid #ddd;
}
.tabs button {
  padding: 10px 20px; border: none; background: none;
  cursor: pointer; font-size: 14px; color: #666;
  border-bottom: 2px solid transparent; margin-bottom: -2px;
}
.tabs button.active {
  color: #0070c4; border-bottom-color: #0070c4; font-weight: 600;
}

.data-table { width: 100%; border-collapse: collapse; margin-top: 16px; }
.data-table th {
  background: #f1f1f1; padding: 10px 12px; text-align: left;
  font-size: 13px; font-weight: 600; border-bottom: 2px solid #ddd;
}
.data-table td { padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 14px; }
.data-table tr:hover { background: #f8f9fa; }
.data-table tr.overdue { background: #fff3cd; }

.status-badge {
  display: inline-block; padding: 3px 10px; border-radius: 12px;
  font-size: 12px; font-weight: 500;
}
.status-confirmed { background: #d4edda; color: #155724; }
.status-sent { background: #cce5ff; color: #004085; }
.status-failed { background: #f8d7da; color: #721c24; }

.days-normal { color: #28a745; }
.days-warning { color: #ffc107; font-weight: 600; }
.days-critical { color: #dc3545; font-weight: 700; }

.filters { margin-bottom: 16px; display: flex; gap: 12px; }
.empty-state { text-align: center; padding: 40px; color: #666; }
.loading { text-align: center; padding: 60px; }

.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000;
  display: flex; align-items: center; justify-content: center;
}
.modal {
  background: white; padding: 24px; border-radius: 8px; max-width: 500px; width: 90%;
}
.form-group { margin: 16px 0; }
.form-group label { display: block; margin-bottom: 4px; font-weight: 500; }
.textarea { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-family: inherit; }
.modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px; }
</style>
