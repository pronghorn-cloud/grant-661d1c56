<template>
  <div class="admin-panel">
    <h1>Administration</h1>
    <p class="subtitle">Manage scholarships, users, and system configuration</p>

    <!-- Tabs -->
    <div class="tabs">
      <button :class="{ active: activeTab === 'scholarships' }" @click="activeTab = 'scholarships'; loadScholarships()">
        Scholarships
      </button>
      <button :class="{ active: activeTab === 'users' }" @click="activeTab = 'users'; loadUsers()">
        Users & Roles
      </button>
      <button :class="{ active: activeTab === 'legacy' }" @click="activeTab = 'legacy'; loadLegacy()">
        Legacy Import
      </button>
      <button :class="{ active: activeTab === 'audit' }" @click="activeTab = 'audit'; loadAudit()">
        Audit Trail
      </button>
      <button :class="{ active: activeTab === 'sfs' }" @click="activeTab = 'sfs'">
        SFS Sync
      </button>
    </div>

    <!-- Messages -->
    <goa-callout v-if="error" type="emergency" heading="Error">{{ error }}</goa-callout>
    <goa-callout v-if="success" type="success" heading="Success">{{ success }}</goa-callout>

    <!-- Loading -->
    <div v-if="loading" class="loading">
      <goa-circular-progress size="large"></goa-circular-progress>
    </div>

    <!-- ====================== -->
    <!-- UC-ADMIN-01: Scholarships Tab -->
    <!-- ====================== -->
    <div v-if="!loading && activeTab === 'scholarships'">
      <div class="action-bar">
        <div class="search-box">
          <goa-input name="sch-search" :value="schSearch" @_change="(e) => { schSearch = e.detail.value; loadScholarships(); }"
            placeholder="Search scholarships..." width="300px" leadingicon="search"></goa-input>
        </div>
        <goa-button type="primary" @_click="openScholarshipForm()">New Scholarship</goa-button>
      </div>

      <table v-if="scholarships.length > 0" class="data-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>Type</th>
            <th>Value</th>
            <th>Deadline</th>
            <th>Status</th>
            <th>Apps</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="sch in scholarships" :key="sch.id">
            <td><code>{{ sch.code }}</code></td>
            <td>{{ sch.name }}</td>
            <td>{{ sch.type }}</td>
            <td>{{ sch.value || '-' }}</td>
            <td>{{ formatDate(sch.deadline_end) }}</td>
            <td><span class="badge" :class="'badge-' + (sch.status || 'active').toLowerCase()">{{ sch.status }}</span></td>
            <td>{{ sch.application_count }}</td>
            <td>
              <goa-button type="tertiary" size="compact" @_click="openScholarshipForm(sch)">Edit</goa-button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty-state"><p>No scholarships found.</p></div>

      <div v-if="schTotal > schLimit" class="pagination">
        <goa-button type="tertiary" size="compact" :disabled="schPage <= 1" @_click="schPage--; loadScholarships()">Previous</goa-button>
        <span>Page {{ schPage }} of {{ Math.ceil(schTotal / schLimit) }}</span>
        <goa-button type="tertiary" size="compact" :disabled="schPage >= Math.ceil(schTotal / schLimit)" @_click="schPage++; loadScholarships()">Next</goa-button>
      </div>
    </div>

    <!-- ====================== -->
    <!-- UC-ADMIN-02: Users Tab -->
    <!-- ====================== -->
    <div v-if="!loading && activeTab === 'users'">
      <div class="action-bar">
        <div class="search-box">
          <goa-input name="user-search" :value="userSearch" @_change="(e) => { userSearch = e.detail.value; loadUsers(); }"
            placeholder="Search by name or email..." width="300px" leadingicon="search"></goa-input>
        </div>
        <div class="filter-group">
          <select v-model="userRoleFilter" @change="loadUsers()">
            <option value="">All Roles</option>
            <option v-for="r in roles" :key="r.code" :value="r.code">{{ r.label }}</option>
          </select>
        </div>
      </div>

      <table v-if="users.length > 0" class="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Apps</th>
            <th>Status</th>
            <th>Joined</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id" :class="{ 'blocked-user': u.is_blocked }">
            <td>{{ u.display_name }}</td>
            <td>{{ u.email }}</td>
            <td>
              <select :value="u.role" @change="changeRole(u.id, $event.target.value)" class="role-select">
                <option v-for="r in roles" :key="r.code" :value="r.code">{{ r.label }}</option>
              </select>
            </td>
            <td>{{ u.application_count }}</td>
            <td>
              <span v-if="u.is_blocked" class="badge badge-blocked">Blocked</span>
              <span v-else class="badge badge-active-user">Active</span>
            </td>
            <td>{{ formatDate(u.created_at) }}</td>
            <td>
              <goa-button v-if="!u.is_blocked" type="tertiary" size="compact" @_click="blockUser(u.id, true)">Block</goa-button>
              <goa-button v-else type="tertiary" size="compact" @_click="blockUser(u.id, false)">Unblock</goa-button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty-state"><p>No users found.</p></div>

      <div v-if="userTotal > userLimit" class="pagination">
        <goa-button type="tertiary" size="compact" :disabled="userPage <= 1" @_click="userPage--; loadUsers()">Previous</goa-button>
        <span>Page {{ userPage }} of {{ Math.ceil(userTotal / userLimit) }}</span>
        <goa-button type="tertiary" size="compact" :disabled="userPage >= Math.ceil(userTotal / userLimit)" @_click="userPage++; loadUsers()">Next</goa-button>
      </div>
    </div>

    <!-- ====================== -->
    <!-- UC-ADMIN-03: Legacy Tab -->
    <!-- ====================== -->
    <div v-if="!loading && activeTab === 'legacy'">
      <div class="action-bar">
        <span>Import legacy scholarship submissions from CSV/JSON data</span>
        <goa-button type="primary" @_click="showImportDialog = true">Import Submissions</goa-button>
      </div>

      <h3>Import History</h3>
      <table v-if="legacyImports.length > 0" class="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>File</th>
            <th>Table</th>
            <th>Imported</th>
            <th>Failed</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="imp in legacyImports" :key="imp.id">
            <td>{{ formatDate(imp.import_date) }}</td>
            <td>{{ imp.file_name }}</td>
            <td>{{ imp.table_name }}</td>
            <td>{{ imp.records_imported }}</td>
            <td>{{ imp.records_failed }}</td>
            <td>
              <span class="badge" :class="imp.status === 'completed' ? 'badge-ok' : 'badge-warn'">{{ imp.status }}</span>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty-state"><p>No import history.</p></div>
    </div>

    <!-- ====================== -->
    <!-- UC-AUDIT-01: Audit Trail Tab -->
    <!-- ====================== -->
    <div v-if="!loading && activeTab === 'audit'">
      <div class="action-bar">
        <div class="search-box">
          <goa-input name="audit-search" :value="auditSearch" @_change="(e) => { auditSearch = e.detail.value; loadAudit(); }"
            placeholder="Search audit logs..." width="300px" leadingicon="search"></goa-input>
        </div>
        <div class="filter-group">
          <select v-model="auditActionFilter" @change="loadAudit()">
            <option value="">All Actions</option>
            <option v-for="a in auditActions" :key="a" :value="a">{{ a }}</option>
          </select>
        </div>
        <goa-button type="tertiary" @_click="exportAudit">Export CSV</goa-button>
      </div>

      <table v-if="auditLogs.length > 0" class="data-table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>User</th>
            <th>Action</th>
            <th>Details</th>
            <th>Changes</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in auditLogs" :key="log.id">
            <td class="nowrap">{{ formatDateTime(log.created_at) }}</td>
            <td>{{ log.user_name || 'System' }}<br><small>{{ log.user_role }}</small></td>
            <td><code>{{ log.action }}</code></td>
            <td class="details-cell">{{ formatDetails(log.details) }}</td>
            <td class="details-cell">
              <span v-if="log.old_values" class="change-old">{{ formatDetails(log.old_values) }}</span>
              <span v-if="log.new_values" class="change-new">{{ formatDetails(log.new_values) }}</span>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty-state"><p>No audit logs found.</p></div>

      <div v-if="auditTotal > auditLimit" class="pagination">
        <goa-button type="tertiary" size="compact" :disabled="auditPage <= 1" @_click="auditPage--; loadAudit()">Previous</goa-button>
        <span>Page {{ auditPage }} of {{ Math.ceil(auditTotal / auditLimit) }}</span>
        <goa-button type="tertiary" size="compact" :disabled="auditPage >= Math.ceil(auditTotal / auditLimit)" @_click="auditPage++; loadAudit()">Next</goa-button>
      </div>
    </div>

    <!-- ====================== -->
    <!-- UC-INT-01: SFS Sync Tab -->
    <!-- ====================== -->
    <div v-if="!loading && activeTab === 'sfs'">
      <div class="sfs-panel">
        <h3>Student Finance System (SFS) Synchronization</h3>
        <p>Synchronize enrollment data with the Student Finance System. This will verify COR status for pending applications and sync student records.</p>

        <div class="action-bar">
          <span>Last sync: {{ lastSyncResult ? formatDateTime(lastSyncResult.started_at) : 'Never' }}</span>
          <goa-button type="primary" @_click="runSFSSync" :disabled="syncing">{{ syncing ? 'Syncing...' : 'Run SFS Sync' }}</goa-button>
        </div>

        <div v-if="lastSyncResult" class="sync-results">
          <h4>Last Sync Results</h4>
          <div class="sync-stats">
            <div class="stat-card">
              <span class="stat-value">{{ lastSyncResult.enrollment_checks }}</span>
              <span class="stat-label">Enrollment Checks</span>
            </div>
            <div class="stat-card stat-ok">
              <span class="stat-value">{{ lastSyncResult.enrollment_confirmed }}</span>
              <span class="stat-label">Confirmed</span>
            </div>
            <div class="stat-card stat-warn">
              <span class="stat-value">{{ lastSyncResult.enrollment_failed }}</span>
              <span class="stat-label">Pending/Failed</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">{{ lastSyncResult.data_synced }}</span>
              <span class="stat-label">Students Synced</span>
            </div>
          </div>
          <p class="sync-status">Status: <span class="badge" :class="lastSyncResult.status === 'completed' ? 'badge-ok' : 'badge-warn'">{{ lastSyncResult.status }}</span></p>
        </div>
      </div>
    </div>

    <!-- ====================== -->
    <!-- Scholarship Form Dialog -->
    <!-- ====================== -->
    <div v-if="showSchForm" class="dialog-overlay" @click.self="showSchForm = false">
      <div class="dialog dialog-wide">
        <h3>{{ editingSch ? 'Edit Scholarship' : 'New Scholarship' }}</h3>
        <div class="form-grid">
          <goa-form-item label="Code">
            <goa-input name="sch-code" :value="schForm.code" @_change="(e) => schForm.code = e.detail.value" width="100%"></goa-input>
          </goa-form-item>
          <goa-form-item label="Name">
            <goa-input name="sch-name" :value="schForm.name" @_change="(e) => schForm.name = e.detail.value" width="100%"></goa-input>
          </goa-form-item>
          <goa-form-item label="Type">
            <select v-model="schForm.type" class="form-select">
              <option v-for="t in lookups.types" :key="t.code" :value="t.code">{{ t.label }}</option>
            </select>
          </goa-form-item>
          <goa-form-item label="Category">
            <select v-model="schForm.category" class="form-select">
              <option value="">-- Select --</option>
              <option v-for="c in lookups.categories" :key="c.code" :value="c.code">{{ c.label }}</option>
            </select>
          </goa-form-item>
          <goa-form-item label="Value ($)">
            <goa-input name="sch-value" :value="schForm.value" @_change="(e) => schForm.value = e.detail.value" width="100%"></goa-input>
          </goa-form-item>
          <goa-form-item label="Academic Year">
            <goa-input name="sch-year" :value="schForm.academic_year" @_change="(e) => schForm.academic_year = e.detail.value" width="100%" placeholder="2025-2026"></goa-input>
          </goa-form-item>
          <goa-form-item label="Deadline Start">
            <goa-input name="sch-dstart" type="date" :value="schForm.deadline_start" @_change="(e) => schForm.deadline_start = e.detail.value" width="100%"></goa-input>
          </goa-form-item>
          <goa-form-item label="Deadline End">
            <goa-input name="sch-dend" type="date" :value="schForm.deadline_end" @_change="(e) => schForm.deadline_end = e.detail.value" width="100%"></goa-input>
          </goa-form-item>
          <goa-form-item label="Max Awards">
            <goa-input name="sch-max" type="number" :value="String(schForm.max_awards || '')" @_change="(e) => schForm.max_awards = parseInt(e.detail.value) || null" width="100%"></goa-input>
          </goa-form-item>
          <goa-form-item label="Status">
            <select v-model="schForm.status" class="form-select">
              <option value="Active">Active</option>
              <option value="Closed">Closed</option>
              <option value="Draft">Draft</option>
            </select>
          </goa-form-item>
        </div>
        <goa-form-item label="Selection Process">
          <goa-textarea name="sch-selection" :value="schForm.selection_process" @_change="(e) => schForm.selection_process = e.detail.value" rows="2" width="100%"></goa-textarea>
        </goa-form-item>
        <div class="dialog-actions">
          <goa-button type="tertiary" @_click="showSchForm = false">Cancel</goa-button>
          <goa-button type="primary" @_click="saveScholarship" :disabled="saving">{{ saving ? 'Saving...' : 'Save' }}</goa-button>
        </div>
      </div>
    </div>

    <!-- ====================== -->
    <!-- Legacy Import Dialog -->
    <!-- ====================== -->
    <div v-if="showImportDialog" class="dialog-overlay" @click.self="showImportDialog = false">
      <div class="dialog dialog-wide">
        <h3>Import Legacy Submissions</h3>
        <p>Paste JSON data with legacy submissions. Each record should have: email, first_name, last_name, scholarship_code, status.</p>
        <goa-form-item label="JSON Data">
          <goa-textarea name="import-data" :value="importData" @_change="(e) => importData = e.detail.value" rows="8" width="100%"
            placeholder='[{"email":"john@example.com","first_name":"John","last_name":"Doe","scholarship_code":"AES-001","status":"Submitted"}]'></goa-textarea>
        </goa-form-item>
        <div v-if="importResult" class="import-result">
          <p>Imported: {{ importResult.imported }} | Failed: {{ importResult.failed }} / {{ importResult.total }}</p>
          <div v-if="importResult.errors?.length > 0" class="import-errors">
            <p v-for="(err, i) in importResult.errors" :key="i">{{ err.email }}: {{ err.error }}</p>
          </div>
        </div>
        <div class="dialog-actions">
          <goa-button type="tertiary" @_click="showImportDialog = false">Close</goa-button>
          <goa-button type="primary" @_click="doImport" :disabled="importing || !importData.trim()">{{ importing ? 'Importing...' : 'Import' }}</goa-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { adminAPI } from '@/services/adminService';

const activeTab = ref('scholarships');
const loading = ref(true);
const error = ref(null);
const success = ref(null);
const saving = ref(false);

// Scholarships state
const scholarships = ref([]);
const schSearch = ref('');
const schPage = ref(1);
const schLimit = 25;
const schTotal = ref(0);
const showSchForm = ref(false);
const editingSch = ref(null);
const schForm = ref(getEmptySchForm());
const lookups = ref({ categories: [], types: [] });

// Users state
const users = ref([]);
const userSearch = ref('');
const userRoleFilter = ref('');
const userPage = ref(1);
const userLimit = 25;
const userTotal = ref(0);
const roles = ref([]);

// Legacy state
const legacyImports = ref([]);
const showImportDialog = ref(false);
const importData = ref('');
const importResult = ref(null);
const importing = ref(false);

// Audit state
const auditLogs = ref([]);
const auditSearch = ref('');
const auditActionFilter = ref('');
const auditActions = ref([]);
const auditPage = ref(1);
const auditLimit = 50;
const auditTotal = ref(0);

// SFS state
const syncing = ref(false);
const lastSyncResult = ref(null);

function getEmptySchForm() {
  return {
    code: '', name: '', type: 'online application', value: '', category: '',
    deadline_start: '', deadline_end: '', academic_year: '2025-2026',
    max_awards: null, selection_process: '', status: 'Active'
  };
}

onMounted(async () => {
  await loadScholarships();
  // Pre-load lookups and roles
  try {
    const [l, r] = await Promise.all([adminAPI.getLookups(), adminAPI.getRoles()]);
    lookups.value = l;
    roles.value = r;
  } catch (e) { /* non-critical */ }
});

async function loadScholarships() {
  loading.value = true;
  error.value = null;
  try {
    const result = await adminAPI.getScholarships({ page: schPage.value, limit: schLimit, search: schSearch.value });
    scholarships.value = result.data || [];
    schTotal.value = result.total || 0;
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Failed to load scholarships';
  } finally {
    loading.value = false;
  }
}

async function loadUsers() {
  loading.value = true;
  error.value = null;
  try {
    const result = await adminAPI.getUsers({ page: userPage.value, limit: userLimit, search: userSearch.value, role: userRoleFilter.value });
    users.value = result.data || [];
    userTotal.value = result.total || 0;
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Failed to load users';
  } finally {
    loading.value = false;
  }
}

async function loadLegacy() {
  loading.value = true;
  error.value = null;
  try {
    const result = await adminAPI.getLegacyImports();
    legacyImports.value = result.data || [];
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Failed to load import history';
  } finally {
    loading.value = false;
  }
}

function openScholarshipForm(sch = null) {
  if (sch) {
    editingSch.value = sch.id;
    schForm.value = {
      code: sch.code, name: sch.name, type: sch.type, value: sch.value || '',
      category: sch.category || '', deadline_start: sch.deadline_start?.slice(0, 10) || '',
      deadline_end: sch.deadline_end?.slice(0, 10) || '', academic_year: sch.academic_year,
      max_awards: sch.max_awards, selection_process: sch.selection_process || '', status: sch.status
    };
  } else {
    editingSch.value = null;
    schForm.value = getEmptySchForm();
  }
  showSchForm.value = true;
}

async function saveScholarship() {
  saving.value = true;
  error.value = null;
  try {
    if (editingSch.value) {
      await adminAPI.updateScholarship(editingSch.value, schForm.value);
      success.value = 'Scholarship updated successfully';
    } else {
      await adminAPI.createScholarship(schForm.value);
      success.value = 'Scholarship created successfully';
    }
    showSchForm.value = false;
    await loadScholarships();
    setTimeout(() => success.value = null, 4000);
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Failed to save scholarship';
  } finally {
    saving.value = false;
  }
}

async function changeRole(userId, newRole) {
  error.value = null;
  try {
    const result = await adminAPI.updateUserRole(userId, newRole);
    success.value = result.message;
    setTimeout(() => success.value = null, 4000);
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Failed to update role';
    loadUsers(); // Revert the select
  }
}

async function blockUser(userId, blocked) {
  error.value = null;
  try {
    const result = await adminAPI.toggleUserBlock(userId, blocked);
    success.value = result.message;
    setTimeout(() => success.value = null, 4000);
    loadUsers();
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Failed to update user';
  }
}

async function doImport() {
  importing.value = true;
  error.value = null;
  importResult.value = null;
  try {
    const parsed = JSON.parse(importData.value);
    importResult.value = await adminAPI.importLegacy(parsed);
    success.value = `Import complete: ${importResult.value.imported} imported, ${importResult.value.failed} failed`;
    setTimeout(() => success.value = null, 5000);
  } catch (err) {
    if (err instanceof SyntaxError) {
      error.value = 'Invalid JSON format. Please check your data.';
    } else {
      error.value = err.response?.data?.message || err.message || 'Import failed';
    }
  } finally {
    importing.value = false;
  }
}

// UC-AUDIT-01: Audit Trail
async function loadAudit() {
  loading.value = true;
  error.value = null;
  try {
    const [result, actions] = await Promise.all([
      adminAPI.getAuditLogs({ page: auditPage.value, limit: auditLimit, search: auditSearch.value, action: auditActionFilter.value }),
      auditActions.value.length ? Promise.resolve(auditActions.value) : adminAPI.getAuditActions()
    ]);
    auditLogs.value = result.data || [];
    auditTotal.value = result.total || 0;
    if (Array.isArray(actions)) auditActions.value = actions;
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Failed to load audit logs';
  } finally {
    loading.value = false;
  }
}

async function exportAudit() {
  try {
    const csv = await adminAPI.exportAuditLogs({ action: auditActionFilter.value });
    // csv may be a string or a Blob depending on interceptor
    const content = typeof csv === 'string' ? csv : await csv.text?.() || csv;
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_log_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    success.value = 'Audit log exported';
    setTimeout(() => success.value = null, 3000);
  } catch (err) {
    error.value = 'Failed to export audit log';
  }
}

// UC-INT-01: SFS Sync
async function runSFSSync() {
  syncing.value = true;
  error.value = null;
  try {
    lastSyncResult.value = await adminAPI.syncWithSFS();
    success.value = `SFS sync completed: ${lastSyncResult.value.enrollment_confirmed} enrollments confirmed`;
    setTimeout(() => success.value = null, 5000);
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'SFS sync failed';
  } finally {
    syncing.value = false;
  }
}

function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateTime(d) {
  if (!d) return '-';
  return new Date(d).toLocaleString('en-CA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatDetails(obj) {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  const entries = Object.entries(obj).slice(0, 4);
  return entries.map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v).slice(0, 50) : v}`).join(', ');
}
</script>

<style scoped>
.admin-panel { max-width: 1200px; margin: 0 auto; padding: 24px; }
.subtitle { color: #666; margin-bottom: 24px; }

.tabs { display: flex; gap: 0; margin-bottom: 24px; border-bottom: 2px solid #ddd; }
.tabs button {
  padding: 10px 20px; border: none; background: none; cursor: pointer;
  font-size: 14px; color: #666; border-bottom: 2px solid transparent; margin-bottom: -2px;
}
.tabs button.active { color: #0070c4; border-bottom-color: #0070c4; font-weight: 600; }

.action-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 12px 16px; background: #f1f1f1; border-radius: 6px; gap: 12px; }
.search-box { flex: 1; max-width: 400px; }
.filter-group select { padding: 8px 12px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px; }

.data-table { width: 100%; border-collapse: collapse; }
.data-table th { background: #f1f1f1; padding: 10px 12px; text-align: left; font-size: 13px; font-weight: 600; border-bottom: 2px solid #ddd; }
.data-table td { padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 14px; }
.data-table tr:hover { background: #f8f9fa; }
.data-table tr.blocked-user { background: #ffeef0; }
.data-table code { background: #e9ecef; padding: 2px 6px; border-radius: 3px; font-size: 12px; }

.badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; }
.badge-active { background: #d4edda; color: #155724; }
.badge-closed { background: #e2e3e5; color: #383d41; }
.badge-draft { background: #fff3cd; color: #856404; }
.badge-ok { background: #d4edda; color: #155724; }
.badge-warn { background: #fff3cd; color: #856404; }
.badge-blocked { background: #f8d7da; color: #721c24; }
.badge-active-user { background: #d4edda; color: #155724; }

.role-select { padding: 4px 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 13px; }

.pagination { display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 16px; padding: 12px; }

.dialog-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.dialog { background: white; padding: 24px; border-radius: 8px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto; }
.dialog-wide { max-width: 700px; }
.dialog h3 { font-size: 18px; margin-bottom: 16px; }
.dialog-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-select { width: 100%; padding: 8px 12px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px; }

.import-result { margin-top: 12px; padding: 12px; background: #f1f1f1; border-radius: 6px; }
.import-errors { margin-top: 8px; font-size: 12px; color: #c5221f; max-height: 150px; overflow-y: auto; }

.empty-state { text-align: center; padding: 40px; color: #666; }
.loading { text-align: center; padding: 60px; }

.nowrap { white-space: nowrap; }
.details-cell { max-width: 300px; font-size: 12px; word-break: break-all; }
.change-old { color: #c5221f; display: block; }
.change-new { color: #155724; display: block; }
small { color: #666; }

.sfs-panel { max-width: 800px; }
.sfs-panel h3 { margin-bottom: 8px; }
.sfs-panel p { color: #666; margin-bottom: 16px; }
.sync-results { margin-top: 24px; }
.sync-results h4 { margin-bottom: 12px; }
.sync-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 16px; }
.stat-card { padding: 16px; background: #f1f1f1; border-radius: 8px; text-align: center; }
.stat-card.stat-ok { background: #d4edda; }
.stat-card.stat-warn { background: #fff3cd; }
.stat-value { display: block; font-size: 28px; font-weight: 700; color: #333; }
.stat-label { font-size: 12px; color: #666; }
.sync-status { margin-top: 8px; }
</style>
