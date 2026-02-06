<template>
  <div class="dashboard-page">
    <div v-if="loading" class="loading">
      <goa-circular-progress size="large"></goa-circular-progress>
    </div>

    <div v-else>
      <header class="page-header">
        <h1>{{ isStaff ? 'Staff Dashboard' : 'My Dashboard' }}</h1>
        <p>Welcome back, {{ profile?.display_name || user?.displayName || 'User' }}</p>
      </header>

      <!-- Profile setup prompt for new applicants -->
      <goa-callout v-if="!isStaff && !profileComplete" type="important" heading="Complete Your Profile">
        <p>You need to complete your profile before you can apply for scholarships.</p>
        <goa-button type="primary" @_click="$router.push('/profile/setup')">
          Complete Profile
        </goa-button>
      </goa-callout>

      <div v-if="isStaff" class="staff-dashboard">
        <goa-callout type="information" heading="Staff Dashboard">
          <p>Staff dashboard features will be implemented in upcoming use cases (UC-STAFF-01 through UC-STAFF-09).</p>
          <p>Your role: <strong>{{ user?.role }}</strong></p>
        </goa-callout>
      </div>

      <div v-else-if="profileComplete" class="applicant-dashboard">
        <div class="dashboard-cards">
          <div class="dash-card">
            <h3>My Applications</h3>
            <p class="dash-stat">{{ applications.length }}</p>
            <p class="dash-label">Total Applications</p>
          </div>
          <div class="dash-card">
            <h3>Drafts</h3>
            <p class="dash-stat">{{ draftCount }}</p>
            <p class="dash-label">In Progress</p>
          </div>
          <div class="dash-card">
            <h3>Submitted</h3>
            <p class="dash-stat">{{ submittedCount }}</p>
            <p class="dash-label">Under Review</p>
          </div>
        </div>

        <section v-if="applications.length > 0" class="apps-section">
          <h2>Recent Applications</h2>
          <div class="apps-list">
            <div v-for="app in applications" :key="app.id" class="app-row">
              <div class="app-info">
                <strong>{{ app.scholarship_name }}</strong>
                <span class="app-ref">Ref: {{ app.reference_number }} | {{ formatDate(app.submitted_at || app.created_at) }}</span>
              </div>
              <div class="app-actions">
                <span class="status-badge" :class="app.status.toLowerCase().replace(/\s+/g, '-')">
                  {{ app.status }}
                </span>
                <goa-button v-if="app.status === 'Draft'" type="primary" size="compact" @_click="$router.push('/apply/' + app.scholarship_id)">
                  Continue
                </goa-button>
                <goa-button v-if="canWithdraw(app.status)" type="tertiary" size="compact" @_click="withdrawApp(app.id)">
                  Withdraw
                </goa-button>
              </div>
            </div>
          </div>
        </section>

        <div v-else class="empty-state">
          <p>You haven't submitted any applications yet.</p>
          <goa-button type="primary" @_click="$router.push('/scholarships')">
            Browse Scholarships
          </goa-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getStoredUser } from '@/services/authService';
import { profileAPI } from '@/services/profileService';
import { applicationsAPI } from '@/services/applicationService';

const router = useRouter();
const user = getStoredUser();
const loading = ref(true);
const profile = ref(null);
const profileComplete = ref(false);
const applications = ref([]);

const staffRoles = ['scholarship_staff', 'scholarship_manager', 'admin', 'superadmin', 'finance'];
const isStaff = computed(() => user && staffRoles.includes(user.role));

const draftCount = computed(() => applications.value.filter(a => a.status === 'Draft').length);
const submittedCount = computed(() => applications.value.filter(a => a.status === 'Submitted' || a.status === 'Under Review').length);

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
}

function canWithdraw(status) {
  return ['Draft', 'Submitted', 'Under Review', 'Missing Info'].includes(status);
}

async function withdrawApp(appId) {
  try {
    await applicationsAPI.withdraw(appId);
    const app = applications.value.find(a => a.id === appId);
    if (app) app.status = 'Withdrawn';
  } catch (err) {
    console.error('Failed to withdraw:', err);
  }
}

onMounted(async () => {
  try {
    if (isStaff.value) {
      router.replace('/staff/dashboard');
      return;
    }
    const [profileRes, appsRes] = await Promise.all([
      profileAPI.getProfile(),
      applicationsAPI.getMyApplications().catch(() => ({ data: [] }))
    ]);
    const profileData = profileRes?.data || profileRes;
    profile.value = profileData;
    profileComplete.value = !!(profileData?.first_name && profileData?.last_name && profileData?.date_of_birth);
    applications.value = appsRes?.data || appsRes || [];
  } catch {
    profileComplete.value = false;
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.dashboard-page {
  max-width: 1200px;
  margin: 0 auto;
}

.loading {
  display: flex;
  justify-content: center;
  padding: var(--goa-space-xl);
}

.page-header {
  margin-bottom: var(--goa-space-l);
}

.page-header h1 {
  font-size: var(--goa-font-size-7);
  font-weight: var(--goa-font-weight-bold);
  margin-bottom: var(--goa-space-xs);
}

.page-header p {
  color: var(--goa-color-text-secondary);
}

.dashboard-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--goa-space-m);
  margin-bottom: var(--goa-space-xl);
}

.dash-card {
  padding: var(--goa-space-l);
  background: var(--goa-color-greyscale-white);
  border: 1px solid var(--goa-color-greyscale-200);
  border-radius: var(--goa-border-radius-m);
  text-align: center;
}

.dash-card h3 {
  font-size: var(--goa-font-size-3);
  color: var(--goa-color-text-secondary);
  margin-bottom: var(--goa-space-xs);
}

.dash-stat {
  font-size: var(--goa-font-size-8);
  font-weight: var(--goa-font-weight-bold);
  color: var(--goa-color-interactive-default);
}

.dash-label {
  font-size: var(--goa-font-size-2);
  color: var(--goa-color-text-secondary);
}

.apps-section h2 {
  font-size: var(--goa-font-size-5);
  font-weight: var(--goa-font-weight-bold);
  margin-bottom: var(--goa-space-m);
}

.app-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--goa-space-m);
  border-bottom: 1px solid var(--goa-color-greyscale-200);
}

.app-info {
  display: flex;
  flex-direction: column;
  gap: var(--goa-space-2xs);
}

.app-ref {
  font-size: var(--goa-font-size-2);
  color: var(--goa-color-text-secondary);
}

.status-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: var(--goa-font-size-2);
  font-weight: var(--goa-font-weight-bold);
}

.app-actions {
  display: flex;
  align-items: center;
  gap: var(--goa-space-s);
}

.status-badge.draft { background: #e8f0fe; color: #1a73e8; }
.status-badge.submitted { background: #fef7e0; color: #b06000; }
.status-badge.under-review { background: #e8f0fe; color: #1a73e8; }
.status-badge.missing-info { background: #fef7e0; color: #b06000; }
.status-badge.approved { background: #e6f4ea; color: #137333; }
.status-badge.rejected { background: #fce8e6; color: #c5221f; }
.status-badge.withdrawn { background: var(--goa-color-greyscale-200); color: var(--goa-color-text-secondary); }
.status-badge.paid { background: #e6f4ea; color: #137333; }

.empty-state {
  text-align: center;
  padding: var(--goa-space-xl);
  color: var(--goa-color-text-secondary);
}

.empty-state p {
  margin-bottom: var(--goa-space-m);
}

@media (max-width: 768px) {
  .dashboard-cards {
    grid-template-columns: 1fr;
  }
}
</style>
