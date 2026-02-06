<template>
  <div class="cor-response">
    <div class="cor-header">
      <h1>Confirmation of Registration</h1>
      <p>Government of Alberta - Advanced Education</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading">
      <goa-circular-progress size="large"></goa-circular-progress>
      <p>Loading COR request details...</p>
    </div>

    <!-- Error -->
    <goa-callout v-else-if="error" type="emergency" heading="Error">
      {{ error }}
    </goa-callout>

    <!-- Already Responded -->
    <div v-else-if="corRequest && corRequest.status !== 'Sent'" class="already-responded">
      <goa-callout type="information" heading="Already Processed">
        This COR request has already been responded to with status: <strong>{{ corRequest.status }}</strong>.
      </goa-callout>
    </div>

    <!-- COR Request Details + Response Form -->
    <div v-else-if="corRequest" class="cor-content">
      <goa-callout type="information" heading="COR Request">
        The Government of Alberta is requesting confirmation of registration for the following student
        in connection with a scholarship application.
      </goa-callout>

      <div class="details-card">
        <h2>Student Information</h2>
        <div class="details-grid">
          <div class="detail-item">
            <span class="label">Student Name</span>
            <span class="value">{{ corRequest.applicant_name }}</span>
          </div>
          <div class="detail-item">
            <span class="label">Application Reference</span>
            <span class="value">{{ corRequest.reference_number }}</span>
          </div>
          <div class="detail-item">
            <span class="label">Institution</span>
            <span class="value">{{ corRequest.institution_name }}</span>
          </div>
          <div class="detail-item">
            <span class="label">Program</span>
            <span class="value">{{ corRequest.program }}</span>
          </div>
          <div class="detail-item">
            <span class="label">Enrollment Status</span>
            <span class="value">{{ formatEnrollment(corRequest.enrollment_status) }}</span>
          </div>
          <div class="detail-item">
            <span class="label">Year of Study</span>
            <span class="value">{{ corRequest.year_of_study }}</span>
          </div>
        </div>

        <div v-if="corRequest.custom_message" class="custom-message">
          <h3>Additional Notes from Staff</h3>
          <p>{{ corRequest.custom_message }}</p>
        </div>
      </div>

      <!-- Response Form -->
      <div class="response-card" v-if="!submitted">
        <h2>Your Response</h2>
        <p>Please confirm whether the above student is currently enrolled at your institution.</p>

        <div class="form-group">
          <label>Registration Status <span class="required">*</span></label>
          <div class="radio-group">
            <label class="radio-label">
              <input type="radio" v-model="responseForm.status" value="Confirmed" />
              <span class="radio-text">Confirmed - Student is currently enrolled</span>
            </label>
            <label class="radio-label">
              <input type="radio" v-model="responseForm.status" value="Not Confirmed" />
              <span class="radio-text">Not Confirmed - Student is not currently enrolled</span>
            </label>
            <label class="radio-label">
              <input type="radio" v-model="responseForm.status" value="Unable to Confirm" />
              <span class="radio-text">Unable to Confirm - Cannot verify at this time</span>
            </label>
          </div>
        </div>

        <div class="form-group">
          <goa-input name="confirmed_by" :value="responseForm.confirmed_by"
            @_change="(e) => responseForm.confirmed_by = e.detail.value"
            width="100%">
            <span slot="leadingContent">Your Name/Title</span>
          </goa-input>
        </div>

        <div class="form-group">
          <label>Notes (optional)</label>
          <textarea v-model="responseForm.notes" rows="3" class="textarea"
            placeholder="Any additional information about the student's enrollment..."></textarea>
        </div>

        <goa-callout v-if="submitError" type="emergency" heading="Submission Error">
          {{ submitError }}
        </goa-callout>

        <div class="form-actions">
          <goa-button type="primary" @_click="submitResponse" :disabled="!responseForm.status || submitLoading">
            {{ submitLoading ? 'Submitting...' : 'Submit Response' }}
          </goa-button>
        </div>
      </div>

      <!-- Success -->
      <div v-if="submitted" class="success-card">
        <goa-callout type="success" heading="Response Submitted">
          Thank you for your response. The scholarship office has been notified.
        </goa-callout>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { corAPI } from '@/services/corService';

const route = useRoute();
const token = route.params.token;

const loading = ref(true);
const error = ref(null);
const corRequest = ref(null);
const submitted = ref(false);
const submitLoading = ref(false);
const submitError = ref(null);

const responseForm = reactive({
  status: '',
  confirmed_by: '',
  notes: ''
});

onMounted(async () => {
  try {
    corRequest.value = await corAPI.getRequestInfo(token);
  } catch (err) {
    error.value = 'This COR request was not found or the link has expired.';
  } finally {
    loading.value = false;
  }
});

function formatEnrollment(status) {
  const map = { full_time: 'Full-Time', part_time: 'Part-Time', co_op: 'Co-op' };
  return map[status] || status || '-';
}

async function submitResponse() {
  if (!responseForm.status) return;
  submitLoading.value = true;
  submitError.value = null;
  try {
    await corAPI.respond(token, {
      status: responseForm.status,
      confirmed_by: responseForm.confirmed_by || 'Institution',
      notes: responseForm.notes
    });
    submitted.value = true;
  } catch (err) {
    submitError.value = err.response?.data?.message || err.message || 'Failed to submit response';
  } finally {
    submitLoading.value = false;
  }
}
</script>

<style scoped>
.cor-response { max-width: 800px; margin: 0 auto; padding: 24px; }
.cor-header { text-align: center; margin-bottom: 32px; border-bottom: 3px solid #0070c4; padding-bottom: 16px; }
.cor-header h1 { color: #0070c4; margin-bottom: 4px; }
.cor-header p { color: #666; }

.loading { text-align: center; padding: 60px; }
.loading p { margin-top: 16px; color: #666; }

.details-card, .response-card, .success-card {
  background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 24px; margin-top: 24px;
}
.details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; }
.detail-item .label { display: block; font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 2px; }
.detail-item .value { font-size: 15px; font-weight: 500; }

.custom-message { margin-top: 20px; padding-top: 16px; border-top: 1px solid #eee; }
.custom-message h3 { font-size: 14px; margin-bottom: 4px; }
.custom-message p { color: #555; }

.form-group { margin: 20px 0; }
.form-group > label { display: block; font-weight: 500; margin-bottom: 8px; }
.required { color: #dc3545; }

.radio-group { display: flex; flex-direction: column; gap: 12px; }
.radio-label { display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 10px; border: 1px solid #ddd; border-radius: 6px; }
.radio-label:hover { background: #f8f9fa; }
.radio-label input[type="radio"] { margin: 0; }
.radio-text { font-size: 14px; }

.textarea { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; font-family: inherit; font-size: 14px; }
.form-actions { margin-top: 24px; }
.already-responded { margin-top: 24px; }
</style>
