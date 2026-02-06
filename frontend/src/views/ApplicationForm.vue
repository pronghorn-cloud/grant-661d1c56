<template>
  <div class="application-form">
    <div v-if="loading" class="loading">
      <goa-circular-progress size="large"></goa-circular-progress>
      <p>Loading application...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <goa-callout type="emergency" :heading="error">
        <goa-button type="tertiary" @_click="$router.push('/scholarships')">Back to Catalog</goa-button>
      </goa-callout>
    </div>

    <div v-else-if="application">
      <header class="page-header">
        <div class="back-nav">
          <goa-button type="tertiary" size="compact" @_click="$router.push('/dashboard')">
            Back to Dashboard
          </goa-button>
        </div>
        <h1>{{ scholarshipName }}</h1>
        <p>Reference: {{ application.reference_number }} | Status: {{ application.status }}</p>
      </header>

      <!-- Step Progress -->
      <div class="step-progress">
        <div
          v-for="(stepLabel, idx) in stepLabels"
          :key="idx"
          class="step-item"
          :class="{ active: currentStep === idx, completed: idx < currentStep }"
          @click="goToStep(idx)"
        >
          <span class="step-number">{{ idx + 1 }}</span>
          <span class="step-label">{{ stepLabel }}</span>
        </div>
      </div>

      <goa-callout v-if="saveMessage" type="success">
        <p>{{ saveMessage }}</p>
      </goa-callout>

      <goa-callout v-if="formError" type="emergency">
        <p>{{ formError }}</p>
      </goa-callout>

      <!-- Step 1: Personal Information -->
      <section v-if="currentStep === 0" class="form-step">
        <h2>Step 1: Personal Information</h2>
        <p class="step-description">Review and confirm your personal details. These were pre-filled from your profile.</p>
        <div class="form-grid">
          <div class="form-field">
            <goa-form-item label="First Name" requirement="required">
              <goa-input name="first_name" :value="form.personal_info.first_name" @_change="(e) => form.personal_info.first_name = e.detail.value" width="100%"></goa-input>
            </goa-form-item>
          </div>
          <div class="form-field">
            <goa-form-item label="Last Name" requirement="required">
              <goa-input name="last_name" :value="form.personal_info.last_name" @_change="(e) => form.personal_info.last_name = e.detail.value" width="100%"></goa-input>
            </goa-form-item>
          </div>
          <div class="form-field">
            <goa-form-item label="Email">
              <goa-input name="email" :value="form.personal_info.email" disabled="true" width="100%"></goa-input>
            </goa-form-item>
          </div>
          <div class="form-field">
            <goa-form-item label="Phone" requirement="required">
              <goa-input name="phone" :value="form.personal_info.phone" @_change="(e) => form.personal_info.phone = e.detail.value" width="100%"></goa-input>
            </goa-form-item>
          </div>
          <div class="form-field">
            <goa-form-item label="Date of Birth">
              <goa-input name="dob" type="date" :value="form.personal_info.date_of_birth ? form.personal_info.date_of_birth.substring(0,10) : ''" disabled="true" width="100%"></goa-input>
            </goa-form-item>
          </div>
          <div class="form-field full-width">
            <goa-form-item label="Address">
              <goa-input name="address" :value="formatAddress()" disabled="true" width="100%"></goa-input>
            </goa-form-item>
          </div>
        </div>
      </section>

      <!-- Step 2: Education Information -->
      <section v-if="currentStep === 1" class="form-step">
        <h2>Step 2: Education Information</h2>
        <p class="step-description">Provide your post-secondary and high school information.</p>

        <h3>Post-Secondary Institution</h3>
        <div class="form-grid">
          <div class="form-field">
            <goa-form-item label="Institution Name" requirement="required">
              <goa-input name="institution_name" :value="form.postsecondary_info.institution_name" @_change="(e) => form.postsecondary_info.institution_name = e.detail.value" width="100%"></goa-input>
            </goa-form-item>
          </div>
          <div class="form-field">
            <goa-form-item label="Program" requirement="required">
              <goa-input name="program" :value="form.postsecondary_info.program" @_change="(e) => form.postsecondary_info.program = e.detail.value" width="100%"></goa-input>
            </goa-form-item>
          </div>
          <div class="form-field">
            <goa-form-item label="Enrollment Status">
              <goa-dropdown name="enrollment_status" :value="form.postsecondary_info.enrollment_status" @_change="(e) => form.postsecondary_info.enrollment_status = e.detail.value">
                <goa-dropdown-item value="" label="Select"></goa-dropdown-item>
                <goa-dropdown-item value="Full-time" label="Full-time"></goa-dropdown-item>
                <goa-dropdown-item value="Part-time" label="Part-time"></goa-dropdown-item>
              </goa-dropdown>
            </goa-form-item>
          </div>
          <div class="form-field">
            <goa-form-item label="Year of Study">
              <goa-input name="year_of_study" type="number" :value="String(form.postsecondary_info.year_of_study || '')" @_change="(e) => form.postsecondary_info.year_of_study = Number(e.detail.value)" width="100%"></goa-input>
            </goa-form-item>
          </div>
          <div class="form-field">
            <goa-form-item label="Expected Graduation">
              <goa-input name="expected_grad" type="month" :value="form.postsecondary_info.expected_graduation || ''" @_change="(e) => form.postsecondary_info.expected_graduation = e.detail.value" width="100%"></goa-input>
            </goa-form-item>
          </div>
        </div>

        <h3>High School Information</h3>
        <div class="form-grid">
          <div class="form-field">
            <goa-form-item label="High School Name">
              <goa-input name="hs_name" :value="form.high_school_info.school_name" @_change="(e) => form.high_school_info.school_name = e.detail.value" width="100%"></goa-input>
            </goa-form-item>
          </div>
          <div class="form-field">
            <goa-form-item label="Graduation Year">
              <goa-input name="hs_grad" type="number" :value="String(form.high_school_info.graduation_year || '')" @_change="(e) => form.high_school_info.graduation_year = Number(e.detail.value)" width="100%"></goa-input>
            </goa-form-item>
          </div>
        </div>
      </section>

      <!-- Step 3: Additional Information -->
      <section v-if="currentStep === 2" class="form-step">
        <h2>Step 3: Scholarship-Specific Information</h2>
        <p class="step-description">Provide any additional information required for this scholarship.</p>

        <div class="form-grid">
          <div class="form-field full-width">
            <goa-form-item label="Essay / Personal Statement" helptext="Describe your goals, achievements, and why you should receive this scholarship.">
              <goa-textarea
                name="essay"
                :value="form.essay"
                @_change="(e) => form.essay = e.detail.value"
                rows="8"
                width="100%"
              ></goa-textarea>
            </goa-form-item>
          </div>
          <div class="form-field full-width">
            <goa-form-item label="Extracurricular Activities">
              <goa-textarea
                name="extracurriculars"
                :value="form.additional_info.extracurriculars"
                @_change="(e) => form.additional_info.extracurriculars = e.detail.value"
                rows="4"
                width="100%"
              ></goa-textarea>
            </goa-form-item>
          </div>
          <div class="form-field full-width">
            <goa-form-item label="Previous Awards / Achievements">
              <goa-textarea
                name="awards"
                :value="form.additional_info.awards"
                @_change="(e) => form.additional_info.awards = e.detail.value"
                rows="3"
                width="100%"
              ></goa-textarea>
            </goa-form-item>
          </div>
        </div>
      </section>

      <!-- Step 4: Documents -->
      <section v-if="currentStep === 3" class="form-step">
        <h2>Step 4: Supporting Documents</h2>
        <p class="step-description">Upload required documents (PDF, DOCX, JPG, PNG - max 10MB each).</p>

        <div class="upload-area">
          <div class="upload-controls">
            <goa-dropdown name="doc_type" :value="uploadDocType" @_change="(e) => uploadDocType = e.detail.value">
              <goa-dropdown-item value="transcript" label="Transcript"></goa-dropdown-item>
              <goa-dropdown-item value="nomination_letter" label="Nomination Letter"></goa-dropdown-item>
              <goa-dropdown-item value="reference" label="Reference Letter"></goa-dropdown-item>
              <goa-dropdown-item value="identification" label="Identification"></goa-dropdown-item>
              <goa-dropdown-item value="essay" label="Essay Document"></goa-dropdown-item>
              <goa-dropdown-item value="other" label="Other"></goa-dropdown-item>
            </goa-dropdown>
            <input type="file" ref="fileInput" @change="handleFileSelect" accept=".pdf,.docx,.doc,.jpg,.jpeg,.png" style="display:none">
            <goa-button type="secondary" size="compact" @_click="$refs.fileInput.click()" :disabled="uploading">
              {{ uploading ? 'Uploading...' : 'Choose File' }}
            </goa-button>
          </div>

          <div v-if="documents.length > 0" class="document-list">
            <div v-for="doc in documents" :key="doc.id" class="document-item">
              <div class="doc-info">
                <strong>{{ doc.file_name }}</strong>
                <span class="doc-meta">{{ doc.document_type }} | {{ formatFileSize(doc.file_size) }}</span>
              </div>
              <goa-button type="tertiary" size="compact" @_click="removeDoc(doc.id)">
                Remove
              </goa-button>
            </div>
          </div>
          <p v-else class="no-docs">No documents uploaded yet.</p>
        </div>
      </section>

      <!-- Step 5: Review & Submit -->
      <section v-if="currentStep === 4" class="form-step">
        <h2>Step 5: Review & Submit</h2>
        <p class="step-description">Review your application before submitting.</p>

        <div class="review-section">
          <h3>Personal Information</h3>
          <div class="review-grid">
            <div class="review-item"><strong>Name:</strong> {{ form.personal_info.first_name }} {{ form.personal_info.last_name }}</div>
            <div class="review-item"><strong>Email:</strong> {{ form.personal_info.email }}</div>
            <div class="review-item"><strong>Phone:</strong> {{ form.personal_info.phone || 'Not provided' }}</div>
            <div class="review-item"><strong>Date of Birth:</strong> {{ form.personal_info.date_of_birth ? new Date(form.personal_info.date_of_birth).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not provided' }}</div>
            <div class="review-item full-width"><strong>Address:</strong> {{ formatAddress() || 'Not provided' }}</div>
          </div>
        </div>

        <div class="review-section">
          <h3>Citizenship &amp; Residency</h3>
          <div class="review-grid">
            <div class="review-item"><strong>Citizenship Status:</strong> {{ application.citizenship_status || 'Not provided' }}</div>
            <div class="review-item"><strong>Alberta Resident:</strong> {{ application.residency_status === true ? 'Yes' : application.residency_status === false ? 'No' : 'Not provided' }}</div>
            <div class="review-item"><strong>Indigenous Status:</strong> {{ application.indigenous_status || 'Not applicable' }}</div>
            <div class="review-item"><strong>Gender:</strong> {{ application.gender || 'Not provided' }}</div>
          </div>
        </div>

        <div class="review-section">
          <h3>Post-Secondary Education</h3>
          <div class="review-grid">
            <div class="review-item"><strong>Institution:</strong> {{ form.postsecondary_info.institution_name || 'Not provided' }}</div>
            <div class="review-item"><strong>Program:</strong> {{ form.postsecondary_info.program || 'Not provided' }}</div>
            <div class="review-item"><strong>Enrollment Status:</strong> {{ form.postsecondary_info.enrollment_status || 'Not provided' }}</div>
            <div class="review-item"><strong>Year of Study:</strong> {{ form.postsecondary_info.year_of_study || 'Not provided' }}</div>
            <div class="review-item"><strong>Expected Graduation:</strong> {{ form.postsecondary_info.expected_graduation || 'Not provided' }}</div>
          </div>
        </div>

        <div v-if="form.high_school_info.school_name || form.high_school_info.graduation_year" class="review-section">
          <h3>High School Information</h3>
          <div class="review-grid">
            <div class="review-item"><strong>School Name:</strong> {{ form.high_school_info.school_name || 'Not provided' }}</div>
            <div class="review-item"><strong>Graduation Year:</strong> {{ form.high_school_info.graduation_year || 'Not provided' }}</div>
          </div>
        </div>

        <div v-if="form.essay" class="review-section">
          <h3>Essay / Personal Statement</h3>
          <p class="review-essay">{{ form.essay }}</p>
        </div>

        <div v-if="form.additional_info.extracurriculars || form.additional_info.awards" class="review-section">
          <h3>Additional Information</h3>
          <div v-if="form.additional_info.extracurriculars" class="review-sub">
            <strong>Extracurricular Activities:</strong>
            <p class="review-text">{{ form.additional_info.extracurriculars }}</p>
          </div>
          <div v-if="form.additional_info.awards" class="review-sub">
            <strong>Previous Awards / Achievements:</strong>
            <p class="review-text">{{ form.additional_info.awards }}</p>
          </div>
        </div>

        <div class="review-section">
          <h3>Documents ({{ documents.length }})</h3>
          <ul v-if="documents.length > 0">
            <li v-for="doc in documents" :key="doc.id">{{ doc.file_name }} ({{ doc.document_type }})</li>
          </ul>
          <p v-else class="no-docs">No documents uploaded.</p>
        </div>

        <!-- Privacy & Declaration -->
        <div class="consent-section">
          <goa-callout type="information" heading="Privacy Notice (FOIP)">
            <p>The personal information on this form is collected under the authority of the Post-secondary Learning Act and the Freedom of Information and Protection of Privacy Act. The information will be used to assess your eligibility for scholarships and awards. Questions about this collection can be directed to Student Financial Assistance, Alberta Advanced Education.</p>
          </goa-callout>

          <div class="consent-checks">
            <goa-checkbox
              name="privacy_consent"
              :checked="form.privacy_consent"
              @_change="(e) => form.privacy_consent = e.detail.checked"
              text="I have read and agree to the Privacy Notice above"
            ></goa-checkbox>

            <goa-checkbox
              name="declaration"
              :checked="form.declaration_signed"
              @_change="(e) => form.declaration_signed = e.detail.checked"
              text="I declare that the information provided is true and complete to the best of my knowledge"
            ></goa-checkbox>
          </div>
        </div>
      </section>

      <!-- Navigation Buttons -->
      <div class="step-navigation">
        <goa-button v-if="currentStep > 0" type="secondary" @_click="prevStep">
          Previous
        </goa-button>
        <div class="nav-right">
          <goa-button type="tertiary" @_click="saveDraft" :disabled="saving">
            {{ saving ? 'Saving...' : 'Save Draft' }}
          </goa-button>
          <goa-button v-if="currentStep < 4" type="primary" @_click="nextStep">
            Next
          </goa-button>
          <goa-button
            v-if="currentStep === 4"
            type="primary"
            @_click="submitApplication"
            :disabled="submitting || !form.privacy_consent || !form.declaration_signed"
          >
            {{ submitting ? 'Submitting...' : 'Submit Application' }}
          </goa-button>
        </div>
      </div>
    </div>

    <!-- Submission Confirmation -->
    <div v-if="submitted" class="confirmation">
      <goa-callout type="success" heading="Application Submitted!">
        <p>Your application <strong>{{ application.reference_number }}</strong> for <strong>{{ scholarshipName }}</strong> has been submitted successfully.</p>
        <p>You will receive a notification when your application status changes.</p>
      </goa-callout>
      <div class="confirmation-actions">
        <goa-button type="primary" @_click="$router.push('/dashboard')">Go to Dashboard</goa-button>
        <goa-button type="secondary" @_click="$router.push('/scholarships')">Browse More Scholarships</goa-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { applicationsAPI } from '@/services/applicationService';

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const error = ref('');
const saving = ref(false);
const submitting = ref(false);
const uploading = ref(false);
const submitted = ref(false);
const saveMessage = ref('');
const formError = ref('');
const currentStep = ref(0);
const application = ref(null);
const scholarshipName = ref('');
const documents = ref([]);
const uploadDocType = ref('transcript');
const fileInput = ref(null);

const stepLabels = ['Personal Info', 'Education', 'Additional', 'Documents', 'Review & Submit'];

const form = reactive({
  personal_info: { first_name: '', last_name: '', email: '', phone: '', date_of_birth: '', address_street: '', address_city: '', address_province: '', address_postal_code: '' },
  postsecondary_info: { institution_name: '', program: '', enrollment_status: '', year_of_study: null, expected_graduation: '' },
  high_school_info: { school_name: '', graduation_year: null },
  additional_info: { extracurriculars: '', awards: '' },
  essay: '',
  declaration_signed: false,
  privacy_consent: false
});

onMounted(async () => {
  try {
    const scholarshipId = route.params.id;

    // Start or resume application
    const startRes = await applicationsAPI.start(scholarshipId);
    application.value = startRes.data;
    scholarshipName.value = startRes.data.scholarship_name;

    // Load full application data
    const appRes = await applicationsAPI.getById(application.value.id);
    const app = appRes.data;

    // Populate form from application data
    if (app.personal_info) Object.assign(form.personal_info, app.personal_info);
    if (app.postsecondary_info && typeof app.postsecondary_info === 'object') Object.assign(form.postsecondary_info, app.postsecondary_info);
    if (app.high_school_info && typeof app.high_school_info === 'object') Object.assign(form.high_school_info, app.high_school_info);
    if (app.additional_info && typeof app.additional_info === 'object') Object.assign(form.additional_info, app.additional_info);
    if (app.essay) form.essay = app.essay;
    form.declaration_signed = app.declaration_signed || false;
    form.privacy_consent = app.privacy_consent || false;

    documents.value = app.documents || [];
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load application';
  } finally {
    loading.value = false;
  }
});

function formatAddress() {
  const p = form.personal_info;
  return [p.address_street, p.address_city, p.address_province, p.address_postal_code].filter(Boolean).join(', ');
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function goToStep(idx) {
  if (idx <= currentStep) currentStep.value = idx;
}

function nextStep() {
  saveMessage.value = '';
  formError.value = '';
  if (currentStep.value < 4) {
    saveDraft();
    currentStep.value++;
  }
}

function prevStep() {
  saveMessage.value = '';
  formError.value = '';
  if (currentStep.value > 0) currentStep.value--;
}

async function saveDraft() {
  saving.value = true;
  saveMessage.value = '';
  formError.value = '';

  try {
    await applicationsAPI.saveDraft(application.value.id, {
      personal_info: form.personal_info,
      postsecondary_info: form.postsecondary_info,
      high_school_info: form.high_school_info,
      additional_info: form.additional_info,
      essay: form.essay,
      declaration_signed: form.declaration_signed,
      privacy_consent: form.privacy_consent
    });
    saveMessage.value = 'Draft saved successfully.';
  } catch (err) {
    formError.value = err.response?.data?.message || 'Failed to save draft';
  } finally {
    saving.value = false;
  }
}

async function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  uploading.value = true;
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', uploadDocType.value);

    const res = await applicationsAPI.uploadDocument(application.value.id, formData);
    documents.value.push(res.data);
  } catch (err) {
    formError.value = err.response?.data?.message || 'Failed to upload document';
  } finally {
    uploading.value = false;
    event.target.value = '';
  }
}

async function removeDoc(docId) {
  try {
    await applicationsAPI.removeDocument(application.value.id, docId);
    documents.value = documents.value.filter(d => d.id !== docId);
  } catch (err) {
    formError.value = err.response?.data?.message || 'Failed to remove document';
  }
}

async function submitApplication() {
  submitting.value = true;
  formError.value = '';

  try {
    // Save final state first
    await applicationsAPI.saveDraft(application.value.id, {
      personal_info: form.personal_info,
      postsecondary_info: form.postsecondary_info,
      high_school_info: form.high_school_info,
      additional_info: form.additional_info,
      essay: form.essay,
      declaration_signed: form.declaration_signed,
      privacy_consent: form.privacy_consent
    });

    await applicationsAPI.submit(application.value.id);
    submitted.value = true;
  } catch (err) {
    const errors = err.response?.data?.errors;
    formError.value = errors ? errors.join(', ') : (err.response?.data?.message || 'Failed to submit application');
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.application-form {
  max-width: 900px;
  margin: 0 auto;
}

.loading, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--goa-space-m);
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

.step-progress {
  display: flex;
  gap: var(--goa-space-xs);
  margin-bottom: var(--goa-space-xl);
  overflow-x: auto;
}

.step-item {
  display: flex;
  align-items: center;
  gap: var(--goa-space-2xs);
  padding: var(--goa-space-xs) var(--goa-space-s);
  border-radius: var(--goa-border-radius-m);
  background: var(--goa-color-greyscale-100);
  cursor: pointer;
  white-space: nowrap;
  font-size: var(--goa-font-size-2);
}

.step-item.active {
  background: var(--goa-color-interactive-default);
  color: white;
}

.step-item.completed {
  background: var(--goa-color-status-success);
  color: white;
}

.step-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(255,255,255,0.3);
  font-weight: var(--goa-font-weight-bold);
  font-size: var(--goa-font-size-1);
}

.form-step h2 {
  font-size: var(--goa-font-size-6);
  font-weight: var(--goa-font-weight-bold);
  margin-bottom: var(--goa-space-xs);
}

.form-step h3 {
  font-size: var(--goa-font-size-4);
  font-weight: var(--goa-font-weight-bold);
  margin-top: var(--goa-space-l);
  margin-bottom: var(--goa-space-s);
}

.step-description {
  color: var(--goa-color-text-secondary);
  margin-bottom: var(--goa-space-l);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--goa-space-m);
}

.form-field.full-width { grid-column: 1 / -1; }

.upload-area {
  padding: var(--goa-space-l);
  border: 2px dashed var(--goa-color-greyscale-200);
  border-radius: var(--goa-border-radius-m);
}

.upload-controls {
  display: flex;
  gap: var(--goa-space-m);
  align-items: flex-end;
  margin-bottom: var(--goa-space-m);
}

.document-list {
  display: flex;
  flex-direction: column;
  gap: var(--goa-space-s);
}

.document-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--goa-space-s);
  background: var(--goa-color-greyscale-100);
  border-radius: var(--goa-border-radius-s);
}

.doc-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.doc-meta {
  font-size: var(--goa-font-size-2);
  color: var(--goa-color-text-secondary);
}

.no-docs {
  color: var(--goa-color-text-secondary);
  font-style: italic;
}

.review-section {
  margin-bottom: var(--goa-space-l);
  padding-bottom: var(--goa-space-l);
  border-bottom: 1px solid var(--goa-color-greyscale-200);
}

.review-section h3 {
  font-size: var(--goa-font-size-4);
  margin-bottom: var(--goa-space-s);
}

.review-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--goa-space-s);
}

.review-item.full-width { grid-column: 1 / -1; }

.review-essay {
  background: var(--goa-color-greyscale-100);
  padding: var(--goa-space-m);
  border-radius: var(--goa-border-radius-s);
  white-space: pre-wrap;
}

.review-sub {
  margin-bottom: var(--goa-space-m);
}

.review-text {
  background: var(--goa-color-greyscale-100);
  padding: var(--goa-space-s);
  border-radius: var(--goa-border-radius-s);
  margin-top: var(--goa-space-2xs);
  white-space: pre-wrap;
}

.consent-section {
  margin-top: var(--goa-space-l);
}

.consent-checks {
  display: flex;
  flex-direction: column;
  gap: var(--goa-space-m);
  margin-top: var(--goa-space-m);
}

.step-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--goa-space-l) 0;
  border-top: 1px solid var(--goa-color-greyscale-200);
  margin-top: var(--goa-space-l);
}

.nav-right {
  display: flex;
  gap: var(--goa-space-m);
}

.confirmation {
  max-width: 600px;
  margin: var(--goa-space-xl) auto;
}

.confirmation-actions {
  display: flex;
  gap: var(--goa-space-m);
  margin-top: var(--goa-space-l);
}

@media (max-width: 768px) {
  .form-grid, .review-grid { grid-template-columns: 1fr; }
  .step-progress { flex-wrap: wrap; }
}
</style>
