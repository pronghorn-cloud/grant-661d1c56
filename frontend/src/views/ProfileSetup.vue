<template>
  <div class="profile-setup">
    <header class="page-header">
      <h1>Complete Your Profile</h1>
      <p>Please fill in your information to get started with scholarship applications.</p>
    </header>

    <goa-callout v-if="submitError" type="emergency" heading="Error">
      <p>{{ submitError }}</p>
    </goa-callout>

    <goa-callout v-if="validationErrors.length > 0" type="important" heading="Please fix the following:">
      <ul>
        <li v-for="err in validationErrors" :key="err">{{ err }}</li>
      </ul>
    </goa-callout>

    <form @submit.prevent="handleSubmit">
      <!-- Personal Information -->
      <section class="form-section">
        <h2>Personal Information</h2>
        <div class="form-grid">
          <div class="form-field">
            <goa-form-item label="First Name" requirement="required">
              <goa-input
                name="first_name"
                :value="form.first_name"
                @_change="(e) => form.first_name = e.detail.value"
                width="100%"
              ></goa-input>
            </goa-form-item>
          </div>
          <div class="form-field">
            <goa-form-item label="Last Name" requirement="required">
              <goa-input
                name="last_name"
                :value="form.last_name"
                @_change="(e) => form.last_name = e.detail.value"
                width="100%"
              ></goa-input>
            </goa-form-item>
          </div>
          <div class="form-field">
            <goa-form-item label="Date of Birth" requirement="required" helptext="You must be at least 16 years old">
              <goa-input
                name="date_of_birth"
                type="date"
                :value="form.date_of_birth"
                @_change="(e) => form.date_of_birth = e.detail.value"
                width="100%"
              ></goa-input>
            </goa-form-item>
          </div>
          <div class="form-field">
            <goa-form-item label="Social Insurance Number (SIN)" requirement="required" helptext="Format: NNN-NNN-NNN">
              <goa-input
                name="sin"
                :value="form.sin"
                @_change="(e) => form.sin = e.detail.value"
                width="100%"
              ></goa-input>
            </goa-form-item>
          </div>
          <div class="form-field">
            <goa-form-item label="Alberta Student Number (ASN)" helptext="Optional">
              <goa-input
                name="asn"
                :value="form.asn"
                @_change="(e) => form.asn = e.detail.value"
                width="100%"
              ></goa-input>
            </goa-form-item>
          </div>
          <div class="form-field">
            <goa-form-item label="Gender" helptext="Optional">
              <goa-dropdown
                name="gender"
                :value="form.gender"
                @_change="(e) => form.gender = e.detail.value"
              >
                <goa-dropdown-item value="" label="Prefer not to say"></goa-dropdown-item>
                <goa-dropdown-item value="Male" label="Male"></goa-dropdown-item>
                <goa-dropdown-item value="Female" label="Female"></goa-dropdown-item>
                <goa-dropdown-item value="Non-binary" label="Non-binary"></goa-dropdown-item>
                <goa-dropdown-item value="Other" label="Other"></goa-dropdown-item>
              </goa-dropdown>
            </goa-form-item>
          </div>
          <div class="form-field">
            <goa-form-item label="Indigenous Status" helptext="Optional - for First Nations, Metis, or Inuit applicants">
              <goa-dropdown
                name="indigenous_status"
                :value="form.indigenous_status"
                @_change="(e) => form.indigenous_status = e.detail.value"
              >
                <goa-dropdown-item value="" label="N/A"></goa-dropdown-item>
                <goa-dropdown-item value="First Nations" label="First Nations"></goa-dropdown-item>
                <goa-dropdown-item value="Metis" label="Metis"></goa-dropdown-item>
                <goa-dropdown-item value="Inuit" label="Inuit"></goa-dropdown-item>
              </goa-dropdown>
            </goa-form-item>
          </div>
        </div>
      </section>

      <!-- Contact Information -->
      <section class="form-section">
        <h2>Contact Information</h2>
        <div class="form-grid">
          <div class="form-field">
            <goa-form-item label="Email" requirement="required">
              <goa-input
                name="email"
                type="email"
                :value="form.email"
                disabled="true"
                width="100%"
              ></goa-input>
            </goa-form-item>
          </div>
          <div class="form-field">
            <goa-form-item label="Phone Number" requirement="required" helptext="10-digit number">
              <goa-input
                name="phone"
                :value="form.phone"
                @_change="(e) => form.phone = e.detail.value"
                width="100%"
              ></goa-input>
            </goa-form-item>
          </div>
        </div>
      </section>

      <!-- Address -->
      <section class="form-section">
        <h2>Mailing Address</h2>
        <div class="form-grid">
          <div class="form-field full-width">
            <goa-form-item label="Street Address" requirement="required">
              <goa-input
                name="address_street"
                :value="form.address_street"
                @_change="(e) => form.address_street = e.detail.value"
                width="100%"
              ></goa-input>
            </goa-form-item>
          </div>
          <div class="form-field">
            <goa-form-item label="City" requirement="required">
              <goa-input
                name="address_city"
                :value="form.address_city"
                @_change="(e) => form.address_city = e.detail.value"
                width="100%"
              ></goa-input>
            </goa-form-item>
          </div>
          <div class="form-field">
            <goa-form-item label="Province" requirement="required">
              <goa-dropdown
                name="address_province"
                :value="form.address_province"
                @_change="(e) => form.address_province = e.detail.value"
              >
                <goa-dropdown-item value="" label="Select province"></goa-dropdown-item>
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
            <goa-form-item label="Postal Code" requirement="required" helptext="Format: A1A 1A1">
              <goa-input
                name="address_postal_code"
                :value="form.address_postal_code"
                @_change="(e) => form.address_postal_code = e.detail.value"
                width="100%"
              ></goa-input>
            </goa-form-item>
          </div>
        </div>
      </section>

      <!-- Citizenship & Residency -->
      <section class="form-section">
        <h2>Citizenship & Residency</h2>
        <div class="form-grid">
          <div class="form-field">
            <goa-form-item label="Citizenship Status" requirement="required">
              <goa-dropdown
                name="citizenship_status"
                :value="form.citizenship_status"
                @_change="(e) => form.citizenship_status = e.detail.value"
              >
                <goa-dropdown-item value="" label="Select status"></goa-dropdown-item>
                <goa-dropdown-item
                  v-for="c in citizenshipTypes"
                  :key="c.code"
                  :value="c.code"
                  :label="c.label"
                ></goa-dropdown-item>
              </goa-dropdown>
            </goa-form-item>
          </div>
          <div class="form-field">
            <goa-form-item label="Alberta Resident?" requirement="required">
              <goa-dropdown
                name="residency_status"
                :value="form.residency_status"
                @_change="(e) => form.residency_status = e.detail.value"
              >
                <goa-dropdown-item value="" label="Select"></goa-dropdown-item>
                <goa-dropdown-item value="true" label="Yes"></goa-dropdown-item>
                <goa-dropdown-item value="false" label="No"></goa-dropdown-item>
              </goa-dropdown>
            </goa-form-item>
          </div>
        </div>
      </section>

      <div class="form-actions">
        <goa-button type="primary" @_click="handleSubmit" :disabled="saving">
          {{ saving ? 'Saving...' : 'Save Profile' }}
        </goa-button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { profileAPI } from '@/services/profileService';
import { getStoredUser } from '@/services/authService';

const router = useRouter();
const saving = ref(false);
const submitError = ref('');
const validationErrors = ref([]);
const provinces = ref([]);
const citizenshipTypes = ref([]);

const form = reactive({
  first_name: '',
  last_name: '',
  date_of_birth: '',
  sin: '',
  asn: '',
  email: '',
  phone: '',
  address_street: '',
  address_city: '',
  address_province: '',
  address_postal_code: '',
  citizenship_status: '',
  residency_status: '',
  indigenous_status: '',
  gender: ''
});

onMounted(async () => {
  // Load lookups
  try {
    const [citRes, provRes] = await Promise.all([
      profileAPI.getLookup('citizenship_types'),
      profileAPI.getLookup('provinces')
    ]);
    citizenshipTypes.value = citRes.data || [];
    provinces.value = provRes.data || [];
  } catch (error) {
    console.error('Failed to load lookups:', error);
  }

  // Pre-fill email from stored user
  const user = getStoredUser();
  if (user) {
    form.email = user.email || '';
  }

  // Check if profile already exists
  try {
    const profileRes = await profileAPI.getProfile();
    const pData = profileRes?.data || profileRes;
    if (pData?.first_name && pData?.last_name && pData?.date_of_birth) {
      router.push('/profile');
      return;
    }
    // Pre-fill from existing partial data
    if (pData) {
      if (pData.first_name) form.first_name = pData.first_name;
      if (pData.last_name) form.last_name = pData.last_name;
    }
  } catch {
    // Profile doesn't exist yet, that's fine
  }
});

async function handleSubmit() {
  submitError.value = '';
  validationErrors.value = [];
  saving.value = true;

  try {
    const data = {
      ...form,
      residency_status: form.residency_status === 'true'
    };

    await profileAPI.createProfile(data);
    router.push('/dashboard');
  } catch (error) {
    if (error.response?.data?.errors) {
      validationErrors.value = error.response.data.errors;
    } else {
      submitError.value = error.response?.data?.message || 'Failed to save profile. Please try again.';
    }
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.profile-setup {
  max-width: 800px;
  margin: 0 auto;
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

.form-section {
  margin-bottom: var(--goa-space-xl);
  padding-bottom: var(--goa-space-l);
  border-bottom: 1px solid var(--goa-color-greyscale-200);
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

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--goa-space-m);
  padding: var(--goa-space-l) 0;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
