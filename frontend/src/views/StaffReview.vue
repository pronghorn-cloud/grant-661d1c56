<template>
  <div class="staff-review">
    <div v-if="loading" class="loading">
      <goa-circular-progress size="large"></goa-circular-progress>
    </div>

    <div v-else-if="!app" class="error-state">
      <goa-callout type="emergency" heading="Application not found">
        <goa-button type="tertiary" @_click="$router.push('/staff/queue')">Back to Queue</goa-button>
      </goa-callout>
    </div>

    <div v-else>
      <header class="page-header">
        <goa-button type="tertiary" size="compact" @_click="$router.push('/staff/queue')">Back to Queue</goa-button>
        <h1>Review: {{ app.reference_number }}</h1>
        <p>{{ app.scholarship_name }} | Status: <span class="status-badge" :class="app.status.toLowerCase().replace(/\s+/g, '-')">{{ app.status }}</span></p>
      </header>

      <goa-callout v-if="actionMessage" :type="actionType" :heading="actionMessage">
      </goa-callout>

      <div class="review-layout">
        <!-- Left: Application Details -->
        <div class="review-main">
          <!-- Personal Info -->
          <section class="detail-section">
            <h2>Personal Information</h2>
            <div class="detail-grid">
              <div><strong>Name:</strong> {{ app.personal_info?.first_name }} {{ app.personal_info?.last_name }}</div>
              <div><strong>Email:</strong> {{ app.applicant_email }}</div>
              <div><strong>Phone:</strong> {{ app.personal_info?.phone || 'N/A' }}</div>
              <div><strong>DOB:</strong> {{ app.personal_info?.date_of_birth ? new Date(app.personal_info.date_of_birth).toLocaleDateString('en-CA') : 'N/A' }}</div>
              <div class="full-width"><strong>Address:</strong> {{ formatAddress(app.personal_info) }}</div>
            </div>
          </section>

          <!-- Eligibility -->
          <section class="detail-section">
            <h2>Eligibility Assessment</h2>
            <div class="eligibility-grid">
              <div class="elig-item" :class="app.eligibility?.citizenship ? 'pass' : 'fail'">
                <span class="elig-icon">{{ app.eligibility?.citizenship ? '\u2713' : '\u2717' }}</span>
                Citizenship: {{ app.citizenship_status || 'Not provided' }}
              </div>
              <div class="elig-item" :class="app.eligibility?.residency ? 'pass' : 'fail'">
                <span class="elig-icon">{{ app.eligibility?.residency ? '\u2713' : '\u2717' }}</span>
                Alberta Residency: {{ app.residency_status ? 'Yes' : 'No' }}
              </div>
              <div class="elig-item" :class="app.eligibility?.enrollment ? 'pass' : 'fail'">
                <span class="elig-icon">{{ app.eligibility?.enrollment ? '\u2713' : '\u2717' }}</span>
                Enrollment: {{ app.postsecondary_info?.institution_name || 'Not provided' }}
              </div>
              <div class="elig-item" :class="app.eligibility?.declaration ? 'pass' : 'fail'">
                <span class="elig-icon">{{ app.eligibility?.declaration ? '\u2713' : '\u2717' }}</span>
                Declaration Signed
              </div>
            </div>
          </section>

          <!-- Education -->
          <section class="detail-section">
            <h2>Education</h2>
            <div class="detail-grid">
              <div><strong>Institution:</strong> {{ app.postsecondary_info?.institution_name || 'N/A' }}</div>
              <div><strong>Program:</strong> {{ app.postsecondary_info?.program || 'N/A' }}</div>
              <div><strong>Enrollment:</strong> {{ app.postsecondary_info?.enrollment_status || 'N/A' }}</div>
              <div><strong>Year:</strong> {{ app.postsecondary_info?.year_of_study || 'N/A' }}</div>
              <div><strong>Expected Grad:</strong> {{ app.postsecondary_info?.expected_graduation || 'N/A' }}</div>
            </div>
            <div v-if="app.high_school_info?.school_name" class="sub-section">
              <h3>High School</h3>
              <div class="detail-grid">
                <div><strong>School:</strong> {{ app.high_school_info.school_name }}</div>
                <div><strong>Grad Year:</strong> {{ app.high_school_info.graduation_year }}</div>
              </div>
            </div>
          </section>

          <!-- Essay -->
          <section v-if="app.essay" class="detail-section">
            <h2>Essay / Personal Statement</h2>
            <div class="essay-box">{{ app.essay }}</div>
          </section>

          <!-- Additional Info -->
          <section v-if="app.additional_info?.extracurriculars || app.additional_info?.awards" class="detail-section">
            <h2>Additional Information</h2>
            <div v-if="app.additional_info?.extracurriculars">
              <strong>Extracurriculars:</strong>
              <p class="text-box">{{ app.additional_info.extracurriculars }}</p>
            </div>
            <div v-if="app.additional_info?.awards">
              <strong>Awards:</strong>
              <p class="text-box">{{ app.additional_info.awards }}</p>
            </div>
          </section>

          <!-- Documents -->
          <section class="detail-section">
            <h2>Documents ({{ app.documents?.length || 0 }})</h2>
            <div v-if="app.documents?.length > 0" class="doc-list">
              <div v-for="doc in app.documents" :key="doc.id" class="doc-item">
                <strong>{{ doc.file_name }}</strong>
                <span class="doc-meta">{{ doc.document_type }} | {{ formatFileSize(doc.file_size) }} | {{ doc.verified ? 'Verified' : 'Pending' }}</span>
              </div>
            </div>
            <p v-else class="no-data">No documents uploaded.</p>
          </section>

          <!-- History -->
          <section v-if="app.history?.length > 0" class="detail-section">
            <h2>Audit History</h2>
            <div class="history-list">
              <div v-for="h in app.history" :key="h.id" class="history-item">
                <strong>{{ h.action }}</strong> by {{ h.staff_name || 'System' }}
                <span class="history-date">{{ formatDateTime(h.created_at) }}</span>
              </div>
            </div>
          </section>
        </div>

        <!-- Right: Actions Panel -->
        <div class="review-sidebar">
          <div class="action-panel">
            <h3>Review Actions</h3>

            <!-- Assignment -->
            <div class="action-group">
              <label>Assigned To</label>
              <goa-dropdown name="assign" :value="app.reviewer_id || ''" @_change="handleAssign">
                <goa-dropdown-item value="" label="Unassigned"></goa-dropdown-item>
                <goa-dropdown-item v-for="s in staffMembers" :key="s.id" :value="s.id" :label="s.display_name"></goa-dropdown-item>
              </goa-dropdown>
            </div>

            <!-- Review Notes -->
            <div class="action-group">
              <label>Add Review Note</label>
              <goa-textarea name="notes" :value="newNote" @_change="(e) => newNote = e.detail.value" rows="3" width="100%"></goa-textarea>
              <goa-button type="secondary" size="compact" @_click="addNote" :disabled="!newNote.trim()">Add Note</goa-button>
            </div>

            <div v-if="app.review_notes" class="existing-notes">
              <label>Existing Notes</label>
              <pre class="notes-box">{{ app.review_notes }}</pre>
            </div>

            <!-- COR Status -->
            <div class="action-group cor-section">
              <label>COR Status</label>
              <div class="cor-status-display">
                <span class="cor-badge" :class="'cor-' + (app.cor_status || 'none').toLowerCase().replace(/\s+/g, '-')">
                  {{ app.cor_status || 'Not Checked' }}
                </span>
              </div>
              <div v-if="!app.cor_status || app.cor_status === 'Pending'" class="cor-actions">
                <goa-button type="tertiary" size="compact" @_click="checkCOR" :disabled="corLoading">
                  {{ corLoading ? 'Checking...' : 'Check SFS' }}
                </goa-button>
                <goa-button type="tertiary" size="compact" @_click="showCORDialog = true">
                  Send COR Request
                </goa-button>
              </div>
              <div v-if="app.cor_status === 'Requested'" class="cor-actions">
                <goa-button type="tertiary" size="compact" @_click="showCORDialog = true">
                  Resend COR Request
                </goa-button>
              </div>
            </div>

            <!-- Decision Actions -->
            <div v-if="canDecide" class="decision-actions">
              <h3>Decision</h3>
              <goa-button type="primary" @_click="showApproveDialog = true" leadingicon="checkmark-circle">
                Approve
              </goa-button>
              <goa-button type="secondary" @_click="showRejectDialog = true">
                Reject
              </goa-button>
              <goa-button type="tertiary" @_click="showMIDialog = true">
                Request Missing Info
              </goa-button>
            </div>

            <div v-else-if="app.decision" class="decision-result">
              <h3>Decision Made</h3>
              <p><strong>{{ app.decision }}</strong> on {{ formatDate(app.decision_date) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Approve Dialog -->
      <div v-if="showApproveDialog" class="dialog-overlay" @click.self="showApproveDialog = false">
        <div class="dialog">
          <h3>Approve Application</h3>
          <p>Are you sure you want to approve {{ app.reference_number }}?</p>
          <goa-form-item label="Notes (optional)">
            <goa-textarea name="approve-notes" :value="approveNotes" @_change="(e) => approveNotes = e.detail.value" rows="2" width="100%"></goa-textarea>
          </goa-form-item>
          <div class="dialog-actions">
            <goa-button type="tertiary" @_click="showApproveDialog = false">Cancel</goa-button>
            <goa-button type="primary" @_click="doApprove" :disabled="processing">Confirm Approve</goa-button>
          </div>
        </div>
      </div>

      <!-- Reject Dialog -->
      <div v-if="showRejectDialog" class="dialog-overlay" @click.self="showRejectDialog = false">
        <div class="dialog">
          <h3>Reject Application</h3>
          <goa-form-item label="Rejection Reasons" requirement="required">
            <div class="reason-list">
              <goa-checkbox v-for="reason in rejectionReasons" :key="reason" :name="reason" :text="reason" :checked="selectedReasons.includes(reason)" @_change="(e) => toggleReason(reason, e.detail.checked)"></goa-checkbox>
            </div>
          </goa-form-item>
          <goa-form-item label="Additional Notes">
            <goa-textarea name="reject-notes" :value="rejectNotes" @_change="(e) => rejectNotes = e.detail.value" rows="2" width="100%"></goa-textarea>
          </goa-form-item>
          <div class="dialog-actions">
            <goa-button type="tertiary" @_click="showRejectDialog = false">Cancel</goa-button>
            <goa-button type="primary" @_click="doReject" :disabled="processing || selectedReasons.length === 0">Confirm Reject</goa-button>
          </div>
        </div>
      </div>

      <!-- MI Dialog -->
      <div v-if="showMIDialog" class="dialog-overlay" @click.self="showMIDialog = false">
        <div class="dialog">
          <h3>Request Missing Information</h3>
          <goa-form-item label="Missing Items" requirement="required">
            <div class="reason-list">
              <goa-checkbox v-for="reason in miReasons" :key="reason" :name="reason" :text="reason" :checked="selectedMIReasons.includes(reason)" @_change="(e) => toggleMIReason(reason, e.detail.checked)"></goa-checkbox>
            </div>
          </goa-form-item>
          <goa-form-item label="Custom Message">
            <goa-textarea name="mi-message" :value="miMessage" @_change="(e) => miMessage = e.detail.value" rows="2" width="100%"></goa-textarea>
          </goa-form-item>
          <div class="dialog-actions">
            <goa-button type="tertiary" @_click="showMIDialog = false">Cancel</goa-button>
            <goa-button type="primary" @_click="doMILetter" :disabled="processing || selectedMIReasons.length === 0">Send MI Request</goa-button>
          </div>
        </div>
      </div>
      <!-- COR Request Dialog -->
      <div v-if="showCORDialog" class="dialog-overlay" @click.self="showCORDialog = false">
        <div class="dialog">
          <h3>Send COR Request</h3>
          <p>Send a Confirmation of Registration request to the institution for this application.</p>
          <goa-form-item label="Institution Email">
            <goa-input name="cor-email" :value="corEmail" @_change="(e) => corEmail = e.detail.value" width="100%"></goa-input>
          </goa-form-item>
          <goa-form-item label="Custom Message (optional)">
            <goa-textarea name="cor-msg" :value="corMessage" @_change="(e) => corMessage = e.detail.value" rows="2" width="100%"></goa-textarea>
          </goa-form-item>
          <div class="dialog-actions">
            <goa-button type="tertiary" @_click="showCORDialog = false">Cancel</goa-button>
            <goa-button type="primary" @_click="sendCORRequest" :disabled="corLoading">Send Request</goa-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { staffAPI } from '@/services/staffService';
import { corAPI } from '@/services/corService';

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const processing = ref(false);
const app = ref(null);
const staffMembers = ref([]);
const newNote = ref('');
const actionMessage = ref('');
const actionType = ref('success');

// Dialogs
const showApproveDialog = ref(false);
const showRejectDialog = ref(false);
const showMIDialog = ref(false);
const approveNotes = ref('');
const rejectNotes = ref('');
const selectedReasons = ref([]);
const miMessage = ref('');
const selectedMIReasons = ref([]);

const rejectionReasons = [
  'Does not meet citizenship requirements',
  'Does not meet residency requirements',
  'Not enrolled in eligible institution',
  'Incomplete application',
  'Missing required documents',
  'Does not meet academic requirements'
];

// COR
const showCORDialog = ref(false);
const corLoading = ref(false);
const corEmail = ref('');
const corMessage = ref('');

const miReasons = [
  'Missing transcripts',
  'Enrollment not confirmed',
  'Residency documents needed',
  'Identification documents needed',
  'Incomplete personal information',
  'Missing reference letter'
];

const canDecide = computed(() => app.value && ['Submitted', 'Under Review'].includes(app.value.status));

onMounted(async () => {
  try {
    const [appData, members] = await Promise.all([
      staffAPI.getApplication(route.params.id),
      staffAPI.getMembers()
    ]);
    app.value = appData;
    staffMembers.value = members;
  } catch (err) {
    console.error('Failed to load:', err);
  } finally {
    loading.value = false;
  }
});

function formatAddress(pi) {
  if (!pi) return 'N/A';
  return [pi.address_street, pi.address_city, pi.address_province, pi.address_postal_code].filter(Boolean).join(', ') || 'N/A';
}

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateTime(d) {
  if (!d) return '';
  return new Date(d).toLocaleString('en-CA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

async function handleAssign(e) {
  try {
    await staffAPI.assign(app.value.id, e.detail.value || null);
    app.value.reviewer_id = e.detail.value;
    showMessage('Application assigned successfully', 'success');
  } catch (err) {
    showMessage('Failed to assign: ' + err.message, 'emergency');
  }
}

async function addNote() {
  if (!newNote.value.trim()) return;
  try {
    const result = await staffAPI.addNotes(app.value.id, newNote.value.trim());
    app.value.review_notes = result.review_notes;
    newNote.value = '';
    showMessage('Note added', 'success');
  } catch (err) {
    showMessage('Failed to add note', 'emergency');
  }
}

async function doApprove() {
  processing.value = true;
  try {
    await staffAPI.approve(app.value.id, { notes: approveNotes.value });
    app.value.status = 'Approved';
    app.value.decision = 'Approved';
    showApproveDialog.value = false;
    showMessage('Application approved successfully', 'success');
  } catch (err) {
    showMessage('Failed to approve: ' + err.message, 'emergency');
  } finally {
    processing.value = false;
  }
}

async function doReject() {
  processing.value = true;
  try {
    await staffAPI.reject(app.value.id, { reasons: selectedReasons.value, notes: rejectNotes.value });
    app.value.status = 'Rejected';
    app.value.decision = 'Rejected';
    showRejectDialog.value = false;
    showMessage('Application rejected', 'success');
  } catch (err) {
    showMessage('Failed to reject: ' + err.message, 'emergency');
  } finally {
    processing.value = false;
  }
}

async function doMILetter() {
  processing.value = true;
  try {
    await staffAPI.sendMILetter(app.value.id, { reasons: selectedMIReasons.value, custom_message: miMessage.value });
    app.value.status = 'Missing Info';
    showMIDialog.value = false;
    showMessage('Missing information request sent', 'success');
  } catch (err) {
    showMessage('Failed to send MI request: ' + err.message, 'emergency');
  } finally {
    processing.value = false;
  }
}

function toggleReason(reason, checked) {
  if (checked) selectedReasons.value.push(reason);
  else selectedReasons.value = selectedReasons.value.filter(r => r !== reason);
}

function toggleMIReason(reason, checked) {
  if (checked) selectedMIReasons.value.push(reason);
  else selectedMIReasons.value = selectedMIReasons.value.filter(r => r !== reason);
}

async function checkCOR() {
  corLoading.value = true;
  try {
    const result = await corAPI.checkCOR(app.value.id);
    app.value.cor_status = result.status;
    showMessage(`COR check: ${result.message}`, 'success');
  } catch (err) {
    showMessage('COR check failed: ' + (err.response?.data?.message || err.message), 'emergency');
  } finally {
    corLoading.value = false;
  }
}

async function sendCORRequest() {
  corLoading.value = true;
  try {
    const result = await corAPI.sendRequest(app.value.id, {
      institution_email: corEmail.value,
      custom_message: corMessage.value
    });
    app.value.cor_status = result.status;
    showCORDialog.value = false;
    showMessage('COR request sent to ' + result.institution, 'success');
  } catch (err) {
    showMessage('Failed to send COR: ' + (err.response?.data?.message || err.message), 'emergency');
  } finally {
    corLoading.value = false;
  }
}

function showMessage(msg, type) {
  actionMessage.value = msg;
  actionType.value = type;
  setTimeout(() => { actionMessage.value = ''; }, 5000);
}
</script>

<style scoped>
.staff-review { max-width: 1400px; margin: 0 auto; }
.page-header { margin-bottom: var(--goa-space-l); }
.page-header h1 { font-size: var(--goa-font-size-7); font-weight: var(--goa-font-weight-bold); margin-bottom: var(--goa-space-2xs); }

.review-layout { display: grid; grid-template-columns: 1fr 350px; gap: var(--goa-space-xl); }
.review-main { min-width: 0; }

.detail-section { margin-bottom: var(--goa-space-l); padding-bottom: var(--goa-space-l); border-bottom: 1px solid var(--goa-color-greyscale-200); }
.detail-section h2 { font-size: var(--goa-font-size-5); font-weight: var(--goa-font-weight-bold); margin-bottom: var(--goa-space-s); }
.detail-section h3 { font-size: var(--goa-font-size-3); margin-top: var(--goa-space-m); margin-bottom: var(--goa-space-xs); }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--goa-space-s); font-size: var(--goa-font-size-2); }
.detail-grid .full-width { grid-column: 1 / -1; }

.eligibility-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--goa-space-s); }
.elig-item { padding: var(--goa-space-s); border-radius: var(--goa-border-radius-s); font-size: var(--goa-font-size-2); }
.elig-item.pass { background: #e6f4ea; color: #137333; }
.elig-item.fail { background: #fce8e6; color: #c5221f; }
.elig-icon { font-weight: bold; margin-right: var(--goa-space-xs); }

.essay-box, .text-box { background: var(--goa-color-greyscale-100); padding: var(--goa-space-m); border-radius: var(--goa-border-radius-s); white-space: pre-wrap; font-size: var(--goa-font-size-2); }
.doc-list { display: flex; flex-direction: column; gap: var(--goa-space-xs); }
.doc-item { padding: var(--goa-space-s); background: var(--goa-color-greyscale-100); border-radius: var(--goa-border-radius-s); }
.doc-meta { font-size: var(--goa-font-size-1); color: var(--goa-color-text-secondary); display: block; }
.no-data { color: var(--goa-color-text-secondary); font-style: italic; }

.history-list { display: flex; flex-direction: column; gap: var(--goa-space-xs); }
.history-item { font-size: var(--goa-font-size-2); padding: var(--goa-space-xs) 0; border-bottom: 1px solid var(--goa-color-greyscale-100); }
.history-date { font-size: var(--goa-font-size-1); color: var(--goa-color-text-secondary); margin-left: var(--goa-space-s); }

.review-sidebar { position: sticky; top: var(--goa-space-l); align-self: start; }
.action-panel { padding: var(--goa-space-l); background: var(--goa-color-greyscale-white); border: 1px solid var(--goa-color-greyscale-200); border-radius: var(--goa-border-radius-m); }
.action-panel h3 { font-size: var(--goa-font-size-4); font-weight: var(--goa-font-weight-bold); margin-bottom: var(--goa-space-m); }
.action-group { margin-bottom: var(--goa-space-m); }
.action-group label { display: block; font-weight: var(--goa-font-weight-bold); font-size: var(--goa-font-size-2); margin-bottom: var(--goa-space-2xs); }
.existing-notes { margin-bottom: var(--goa-space-m); }
.notes-box { background: var(--goa-color-greyscale-100); padding: var(--goa-space-s); border-radius: var(--goa-border-radius-s); font-size: var(--goa-font-size-1); max-height: 150px; overflow-y: auto; white-space: pre-wrap; font-family: inherit; }

.decision-actions { display: flex; flex-direction: column; gap: var(--goa-space-s); margin-top: var(--goa-space-l); border-top: 1px solid var(--goa-color-greyscale-200); padding-top: var(--goa-space-m); }
.decision-result { margin-top: var(--goa-space-l); padding: var(--goa-space-m); background: var(--goa-color-greyscale-100); border-radius: var(--goa-border-radius-s); }

.status-badge { padding: 2px 8px; border-radius: 4px; font-size: var(--goa-font-size-2); font-weight: var(--goa-font-weight-bold); }
.status-badge.submitted { background: #fef7e0; color: #b06000; }
.status-badge.under-review { background: #e8f0fe; color: #1a73e8; }
.status-badge.missing-info { background: #fef7e0; color: #b06000; }
.status-badge.approved { background: #e6f4ea; color: #137333; }
.status-badge.rejected { background: #fce8e6; color: #c5221f; }

.dialog-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.dialog { background: white; padding: var(--goa-space-xl); border-radius: var(--goa-border-radius-m); max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto; }
.dialog h3 { font-size: var(--goa-font-size-5); margin-bottom: var(--goa-space-m); }
.dialog-actions { display: flex; justify-content: flex-end; gap: var(--goa-space-m); margin-top: var(--goa-space-l); }
.reason-list { display: flex; flex-direction: column; gap: var(--goa-space-xs); }

.cor-section { border-top: 1px solid var(--goa-color-greyscale-200); padding-top: var(--goa-space-m); }
.cor-status-display { margin-bottom: var(--goa-space-xs); }
.cor-badge { padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
.cor-confirmed { background: #d4edda; color: #155724; }
.cor-pending { background: #fff3cd; color: #856404; }
.cor-requested { background: #cce5ff; color: #004085; }
.cor-failed { background: #f8d7da; color: #721c24; }
.cor-not-checked, .cor-none { background: #e2e3e5; color: #383d41; }
.cor-actions { display: flex; gap: var(--goa-space-xs); margin-top: var(--goa-space-xs); }

.loading { display: flex; justify-content: center; padding: var(--goa-space-xl); }

@media (max-width: 1024px) {
  .review-layout { grid-template-columns: 1fr; }
  .review-sidebar { position: static; }
}
</style>
