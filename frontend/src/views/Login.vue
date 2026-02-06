<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-header">
        <h1>AE Online Scholarships</h1>
        <p>Sign in to access scholarship applications and services</p>
      </div>

      <div class="login-options">
        <!-- Applicant Login (ACA) -->
        <div class="login-card">
          <h2>Applicants</h2>
          <p>Sign in with your Alberta.ca Account to apply for scholarships.</p>
          <goa-button type="primary" @_click="loginWithACA">
            Sign in with Alberta.ca Account
          </goa-button>
        </div>

        <!-- Staff Login (Microsoft) -->
        <div class="login-card">
          <h2>Staff</h2>
          <p>Sign in with your Government of Alberta Microsoft account.</p>
          <goa-button type="secondary" @_click="loginWithMicrosoft">
            Sign in with Microsoft (Staff)
          </goa-button>
        </div>
      </div>

      <!-- Dev Login (development only) -->
      <div v-if="isDev" class="dev-login">
        <goa-callout type="information" heading="Development Login">
          <p>Quick login for development and testing.</p>
          <div class="dev-login-form">
            <goa-form-item label="Email">
              <goa-input
                :value="devEmail"
                @_change="(e) => devEmail = e.detail.value"
                placeholder="test@alberta.ca"
              ></goa-input>
            </goa-form-item>
            <goa-button type="tertiary" @_click="handleDevLogin">
              Dev Login
            </goa-button>
          </div>
        </goa-callout>
      </div>

      <div v-if="error" class="error-message">
        <goa-callout type="emergency" heading="Sign In Error">
          <p>{{ error }}</p>
        </goa-callout>
      </div>

      <div v-if="loading" class="loading">
        <goa-circular-progress size="large"></goa-circular-progress>
        <p>Signing in...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { login } from '@/services/authService';

const router = useRouter();
const loading = ref(false);
const error = ref(null);
const devEmail = ref('test@alberta.ca');

const isDev = import.meta.env.DEV || import.meta.env.VITE_API_URL?.includes('localhost');

async function loginWithACA() {
  loading.value = true;
  error.value = null;
  try {
    // Mock ACA SSO - in production, this would redirect to ACA OIDC
    const user = await login('aca', {
      email: 'applicant@alberta.ca',
      displayName: 'John Applicant',
      acaId: 'aca-mock-001'
    });
    redirectAfterLogin(user);
  } catch (err) {
    error.value = err.message || 'Failed to sign in with Alberta.ca Account';
  } finally {
    loading.value = false;
  }
}

async function loginWithMicrosoft() {
  loading.value = true;
  error.value = null;
  try {
    // Mock Microsoft SSO - in production, this would redirect to Entra ID
    const user = await login('microsoft', {
      email: 'staff@gov.ab.ca',
      displayName: 'Jane Staff',
      msId: 'ms-mock-001'
    });
    redirectAfterLogin(user);
  } catch (err) {
    error.value = err.message || 'Failed to sign in with Microsoft';
  } finally {
    loading.value = false;
  }
}

async function handleDevLogin() {
  loading.value = true;
  error.value = null;
  try {
    const user = await login('dev', {
      email: devEmail.value
    });
    redirectAfterLogin(user);
  } catch (err) {
    error.value = err.message || 'Failed to sign in';
  } finally {
    loading.value = false;
  }
}

function redirectAfterLogin(user) {
  const staffRoles = ['scholarship_staff', 'scholarship_manager', 'admin', 'superadmin', 'finance'];
  if (staffRoles.includes(user.role)) {
    router.push('/staff/dashboard');
  } else {
    router.push('/scholarships');
  }
}
</script>

<style scoped>
.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  padding: var(--goa-space-xl);
}

.login-container {
  max-width: 700px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--goa-space-l);
}

.login-header {
  text-align: center;
}

.login-header h1 {
  font-size: var(--goa-font-size-7);
  font-weight: var(--goa-font-weight-bold);
  color: var(--goa-color-text-default);
  margin-bottom: var(--goa-space-s);
}

.login-header p {
  font-size: var(--goa-font-size-4);
  color: var(--goa-color-text-secondary);
}

.login-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--goa-space-l);
}

.login-card {
  padding: var(--goa-space-l);
  border: 1px solid var(--goa-color-greyscale-200);
  border-radius: var(--goa-border-radius-m);
  background: var(--goa-color-greyscale-white);
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: var(--goa-space-m);
}

.login-card h2 {
  font-size: var(--goa-font-size-5);
  font-weight: var(--goa-font-weight-bold);
  color: var(--goa-color-text-default);
  margin-bottom: 0;
}

.login-card p {
  color: var(--goa-color-text-secondary);
  flex: 1;
}

.dev-login {
  margin-top: var(--goa-space-m);
}

.dev-login-form {
  display: flex;
  flex-direction: column;
  gap: var(--goa-space-m);
  margin-top: var(--goa-space-m);
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--goa-space-m);
  padding: var(--goa-space-l);
}

.error-message {
  margin-top: var(--goa-space-m);
}

@media (max-width: 768px) {
  .login-options {
    grid-template-columns: 1fr;
  }
}
</style>
