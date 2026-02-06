<template>
  <div class="home">
    <goa-hero-banner>
      <h1>Alberta Scholarships &amp; Awards</h1>
      <p>Apply for scholarships and awards offered by the Government of Alberta</p>
      <goa-button type="primary" @_click="browseScholarships">
        Browse Scholarships
      </goa-button>
    </goa-hero-banner>

    <section class="quick-links">
      <h2>Get Started</h2>
      <div class="grid">
        <div class="quick-link-card">
          <h3>Browse Scholarships</h3>
          <p>Explore 55+ scholarships and awards available to Alberta students.</p>
          <goa-button type="secondary" size="compact" @_click="browseScholarships">
            View Catalog
          </goa-button>
        </div>

        <div class="quick-link-card">
          <h3>Apply Online</h3>
          <p>Sign in with your Alberta.ca Account to start an application.</p>
          <goa-button type="secondary" size="compact" @_click="$router.push('/login')">
            Sign In
          </goa-button>
        </div>

        <div class="quick-link-card">
          <h3>Check Status</h3>
          <p>Already applied? Check the status of your applications.</p>
          <goa-button type="secondary" size="compact" @_click="$router.push('/dashboard')">
            My Dashboard
          </goa-button>
        </div>
      </div>
    </section>

    <section class="info-section">
      <goa-callout type="information" heading="Need Help?">
        <p>Contact Student Financial Assistance at 780-427-3722 (Edmonton) or 1-855-606-2096 (Toll-free), Monday - Friday, 8:15 AM - 4:30 PM MST.</p>
        <goa-button type="tertiary" @_click="$router.push('/help')">
          Help &amp; FAQs
        </goa-button>
      </goa-callout>
    </section>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

function browseScholarships() {
  router.push('/scholarships');
}
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: var(--goa-space-xl);
}

.quick-links {
  padding: var(--goa-space-l) 0;
}

.quick-links h2 {
  font-size: var(--goa-font-size-6);
  font-weight: var(--goa-font-weight-bold);
  margin-bottom: var(--goa-space-l);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--goa-space-m);
}

.quick-link-card {
  padding: var(--goa-space-l);
  border: 1px solid var(--goa-color-greyscale-200);
  border-radius: var(--goa-border-radius-m);
  background: var(--goa-color-greyscale-white);
  display: flex;
  flex-direction: column;
  gap: var(--goa-space-s);
}

.quick-link-card h3 {
  font-size: var(--goa-font-size-5);
  font-weight: var(--goa-font-weight-bold);
  margin: 0;
}

.quick-link-card p {
  color: var(--goa-color-text-secondary);
  flex: 1;
}

.info-section {
  padding: var(--goa-space-l) 0;
}

@media (max-width: 768px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
