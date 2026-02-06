<template>
  <div class="profile-page">
    <header class="page-header">
      <h1>My Profile</h1>
    </header>

    <div v-if="loading" class="loading">
      <goa-circular-progress size="large"></goa-circular-progress>
      <p>Loading profile...</p>
    </div>

    <div v-else-if="profile">
      <goa-callout v-if="successMsg" type="success" heading="Success">
        <p>{{ successMsg }}</p>
      </goa-callout>

      <goa-callout v-if="errorMsg" type="emergency" heading="Error">
        <p>{{ errorMsg }}</p>
      </goa-callout>

      <!-- View Mode -->
      <div v-if="!editing">
        <section class="profile-section">
          <h2>Personal Information</h2>
          <div class="info-grid">
            <div class="info-item">
              <strong>Name</strong>
              <span>{{ profile.display_name }}</span>
            </div>
            <div class="info-item">
              <strong>Date of Birth</strong>
              <span>{{ formatDate(profile.date_of_birth) }}</span>
            </div>
            <div class="info-item">
              <strong>SIN</strong>
              <span>{{ profile.sin_masked || 'Not provided' }}</span>
            </div>
            <div v-if="profile.asn" class="info-item">
              <strong>ASN</strong>
              <span>{{ profile.asn }}</span>
            </div>
            <div v-if="profile.gender" class="info-item">
              <strong>Gender</strong>
              <span>{{ profile.gender }}</span>
            </div>
            <div v-if="profile.indigenous_status" class="info-item">
              <strong>Indigenous Status</strong>
              <span>{{ profile.indigenous_status }}</span>
            </div>
          </div>
        </section>

        <section class="profile-section">
          <h2>Contact Information</h2>
          <div class="info-grid">
            <div class="info-item">
              <strong>Email</strong>
              <span>{{ profile.email }}</span>
            </div>
            <div class="info-item">
              <strong>Phone</strong>
              <span>{{ profile.phone || 'Not provided' }}</span>
            </div>
          </div>
        </section>

        <section class="profile-section">
          <h2>Mailing Address</h2>
          <div class="info-grid">
            <div class="info-item full-width">
              <strong>Address</strong>
              <span>{{ formatAddress() }}</span>
            </div>
          </div>
        </section>

        <section class="profile-section">
          <h2>Citizenship & Residency</h2>
          <div class="info-grid">
            <div class="info-item">
              <strong>Citizenship</strong>
              <span>{{ profile.citizenship_status }}</span>
            </div>
            <div class="info-item">
              <strong>Alberta Resident</strong>
              <span>{{ profile.residency_status ? 'Yes' : 'No' }}</span>
            </div>
          </div>
        </section>

        <section class="profile-section">
          <h2>Direct Deposit</h2>
          <div v-if="banking" class="info-grid">
            <div class="info-item">
              <strong>Institution</strong>
              <span>{{ banking.institution_number }}</span>
            </div>
            <div class="info-item">
              <strong>Transit</strong>
              <span>{{ banking.transit_number }}</span>
            </div>
            <div class="info-item">
              <strong>Account</strong>
              <span>{{ banking.account_number_masked }}</span>
            </div>
            <div class="info-item">
              <strong>DD Authorized</strong>
              <span>{{ banking.authorization_signed ? 'Yes' : 'No' }}</span>
            </div>
          </div>
          <div v-else>
            <p class="no-data">No direct deposit information on file.</p>
            <goa-button type="secondary" size="compact" @_click="showBanking = true">
              Set Up Direct Deposit
            </goa-button>
          </div>
        </section>

        <div class="profile-actions">
          <goa-button type="secondary" @_click="editing = true">
            Edit Profile
          </goa-button>
        </div>
      </div>

      <!-- Edit Mode -->
      <div v-if="editing">
        <section class="form-section">
          <h2>Edit Personal Information</h2>
          <div class="form-grid">
            <div class="form-field">
              <goa-form-item label="First Name" requirement="required">
                <goa-input
                  name="first_name"
                  :value="editForm.first_name"
                  @_change="(e) => editForm.first_name = e.detail.value"
                  width="100%"
                ></goa-input>
              </goa-form-item>
            </div>
            <div class="form-field">
              <goa-form-item label="Last Name" requirement="required">
                <goa-input
                  name="last_name"
                  :value="editForm.last_name"
                  @_change="(e) => editForm.last_name = e.detail.value"
                  width="100%"
                ></goa-input>
              </goa-form-item>
            </div>
            <div class="form-field">
              <goa-form-item label="Phone">
                <goa-input
                  name="phone"
                  :value="editForm.phone"
                  @_change="(e) => editForm.phone = e.detail.value"
                  width="100%"
                ></goa-input>
              </goa-form-item>
            </div>
            <div class="form-field">
              <goa-form-item label="ASN">
                <goa-input
                  name="asn"
                  :value="editForm.asn"
                  @_change="(e) => editForm.asn = e.detail.value"
                  width="100%"
                ></goa-input>
              </goa-form-item>
            </div>
          </div>
        </section>

        <section class="form-section">
          <h2>Edit Address</h2>
          <div class="form-grid">
            <div class="form-field full-width">
              <goa-form-item label="Street Address">
                <goa-input
                  name="address_street"
                  :value="editForm.address_street"
                  @_change="(e) => editForm.address_street = e.detail.value"
                  width="100%"
                ></goa-input>
              </goa-form-item>
            </div>
            <div class="form-field">
              <goa-form-item label="City">
                <goa-input
                  name="address_city"
                  :value="editForm.address_city"
                  @_change="(e) => editForm.address_city = e.detail.value"
                  width="100%"
                ></goa-input>
              </goa-form-item>
            </div>
            <div class="form-field">
              <goa-form-item label="Province">
                <goa-dropdown
                  name="address_province"
                  :value="editForm.address_province"
                  @_change="(e) => editForm.address_province = e.detail.value"
                >
                  <goa-dropdown-item
                    v-for="p in provinces"
                    :key="p.code"
                    :value="p.code"
                    :label="p.label"
                  ></goa-dropdown-item>
                </goa-dropdown>
              </goa-form-item>
            </div>
            <div class="form-field">
              <goa-form-item label="Postal Code">
                <goa-input
                  name="address_postal_code"
                  :value="editForm.address_postal_code"
                  @_change="(e) => editForm.address_postal_code = e.detail.value"
                  width="100%"
                ></goa-input>
              </goa-form-item>
            </div>
          </div>
        </section>

        <div class="form-actions">
          <goa-button type="secondary" @_click="cancelEdit">Cancel</goa-button>
          <goa-button type="primary" @_click="saveEdit" :disabled="saving">
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </goa-button>
        </div>
      </div>

      <!-- Banking Setup Modal/Section -->
      <div v-if="showBanking" class="banking-form">
        <h2>Set Up Direct Deposit</h2>
        <goa-callout type="information" heading="Direct Deposit Authorization">
          <p>I authorize the Government of Alberta to deposit payments directly to my bank account. I understand this authorization remains in effect until I provide written notice of cancellation.</p>
        </goa-callout>

        <div class="form-grid">
          <div class="form-field">
            <goa-form-item label="Institution Number" requirement="required" helptext="3 digits">
              <goa-input
                name="institution_number"
                :value="bankForm.institution_number"
                @_change="(e) => bankForm.institution_number = e.detail.value"
                maxlength="3"
                width="100%"
              ></goa-input>
            </goa-form-item>
          </div>
          <div class="form-field">
            <goa-form-item label="Transit Number" requirement="required" helptext="5 digits">
              <goa-input
                name="transit_number"
                :value="bankForm.transit_number"
                @_change="(e) => bankForm.transit_number = e.detail.value"
                maxlength="5"
                width="100%"
              ></goa-input>
            </goa-form-item>
          </div>
          <div class="form-field">
            <goa-form-item label="Account Number" requirement="required" helptext="Up to 12 digits">
              <goa-input
                name="account_number"
                :value="bankForm.account_number"
                @_change="(e) => bankForm.account_number = e.detail.value"
                maxlength="12"
                width="100%"
              ></goa-input>
            </goa-form-item>
          </div>
        </div>

        <div class="consent-check">
          <goa-checkbox
            name="dd_consent"
            :checked="bankForm.authorization_signed"
            @_change="(e) => bankForm.authorization_signed = e.detail.checked"
            text="I agree to the Direct Deposit Authorization above"
          ></goa-checkbox>
        </div>

        <div class="form-actions">
          <goa-button type="secondary" @_click="showBanking = false">Cancel</goa-button>
          <goa-button type="primary" @_click="saveBanking" :disabled="savingBank">
            {{ savingBank ? 'Saving...' : 'Save Banking Info' }}
          </goa-button>
        </div>
      </div>
    </div>

    <div v-else>
      <goa-callout type="information">
        <p>No profile found. Please complete your profile setup.</p>
        <goa-button type="primary" @_click="$router.push('/profile/setup')">
          Set Up Profile
        </goa-button>
      </goa-callout>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { profileAPI } from '@/services/profileService';

const router = useRouter();

const loading = ref(true);
const editing = ref(false);
const saving = ref(false);
const savingBank = ref(false);
const showBanking = ref(false);
const successMsg = ref('');
const errorMsg = ref('');
const profile = ref(null);
const banking = ref(null);
const provinces = ref([]);

const editForm = reactive({
  first_name: '', last_name: '', phone: '', asn: '',
  address_street: '', address_city: '', address_province: '', address_postal_code: ''
});

const bankForm = reactive({
  institution_number: '', transit_number: '', account_number: '', authorization_signed: false
});

onMounted(async () => {
  try {
    const [profileRes, bankRes, provRes] = await Promise.all([
      profileAPI.getProfile(),
      profileAPI.getBanking(),
      profileAPI.getLookup('provinces')
    ]);

    profile.value = profileRes.data;
    banking.value = bankRes.data;
    provinces.value = provRes.data || [];

    // Redirect to setup if profile not complete
    if (!profile.value?.profile_complete) {
      router.push('/profile/setup');
      return;
    }

    if (profile.value) {
      Object.keys(editForm).forEach(key => {
        if (profile.value[key] != null) editForm[key] = profile.value[key];
      });
    }

    if (banking.value) {
      bankForm.institution_number = banking.value.institution_number;
      bankForm.transit_number = banking.value.transit_number;
    }
  } catch (error) {
    console.error('Failed to load profile:', error);
  } finally {
    loading.value = false;
  }
});

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatAddress() {
  const p = profile.value;
  if (!p.address_street) return 'Not provided';
  const parts = [p.address_street, p.address_city, p.address_province, p.address_postal_code];
  return parts.filter(Boolean).join(', ');
}

function cancelEdit() {
  editing.value = false;
  if (profile.value) {
    Object.keys(editForm).forEach(key => {
      editForm[key] = profile.value[key] || '';
    });
  }
}

async function saveEdit() {
  saving.value = true;
  successMsg.value = '';
  errorMsg.value = '';

  try {
    const res = await profileAPI.updateProfile({ ...editForm });
    profile.value = res.data;
    editing.value = false;
    successMsg.value = 'Profile updated successfully.';
  } catch (error) {
    errorMsg.value = error.response?.data?.message || 'Failed to update profile.';
  } finally {
    saving.value = false;
  }
}

async function saveBanking() {
  savingBank.value = true;
  successMsg.value = '';
  errorMsg.value = '';

  try {
    await profileAPI.saveBanking({ ...bankForm });
    // Reload banking data
    const bankRes = await profileAPI.getBanking();
    banking.value = bankRes.data;
    showBanking.value = false;
    successMsg.value = 'Direct deposit information saved successfully.';
  } catch (error) {
    errorMsg.value = error.response?.data?.errors?.join(', ') || 'Failed to save banking information.';
  } finally {
    savingBank.value = false;
  }
}
</script>

<style scoped>
.profile-page {
  max-width: 800px;
  margin: 0 auto;
}

.page-header h1 {
  font-size: var(--goa-font-size-7);
  font-weight: var(--goa-font-weight-bold);
  margin-bottom: var(--goa-space-l);
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--goa-space-m);
  padding: var(--goa-space-xl);
}

.profile-section {
  margin-bottom: var(--goa-space-l);
  padding-bottom: var(--goa-space-l);
  border-bottom: 1px solid var(--goa-color-greyscale-200);
}

.profile-section h2 {
  font-size: var(--goa-font-size-5);
  font-weight: var(--goa-font-weight-bold);
  margin-bottom: var(--goa-space-m);
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--goa-space-m);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: var(--goa-space-2xs);
}

.info-item strong {
  font-size: var(--goa-font-size-2);
  color: var(--goa-color-text-secondary);
  text-transform: uppercase;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.no-data {
  color: var(--goa-color-text-secondary);
  font-style: italic;
  margin-bottom: var(--goa-space-s);
}

.profile-actions,
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--goa-space-m);
  padding: var(--goa-space-l) 0;
}

.form-section {
  margin-bottom: var(--goa-space-xl);
}

.form-section h2 {
  font-size: var(--goa-font-size-5);
  font-weight: var(--goa-font-weight-bold);
  margin-bottom: var(--goa-space-m);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--goa-space-m);
}

.form-field.full-width {
  grid-column: 1 / -1;
}

.banking-form {
  margin-top: var(--goa-space-xl);
  padding: var(--goa-space-l);
  background: var(--goa-color-greyscale-100);
  border-radius: var(--goa-border-radius-m);
}

.banking-form h2 {
  font-size: var(--goa-font-size-5);
  font-weight: var(--goa-font-weight-bold);
  margin-bottom: var(--goa-space-m);
}

.consent-check {
  margin: var(--goa-space-m) 0;
}

@media (max-width: 768px) {
  .info-grid,
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
