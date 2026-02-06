<template>
  <div class="about">
    <header class="page-header">
      <h1>About Alberta Services</h1>
    </header>

    <section class="content">
      <goa-callout type="information">
        <h2>Our Mission</h2>
        <p>
          To provide accessible, efficient, and user-friendly government services
          to all Albertans through digital innovation and excellence.
        </p>
      </goa-callout>

      <div class="info-blocks">
        <div class="info-block">
          <h3>Digital First</h3>
          <p>
            We're committed to making government services available online,
            ensuring they're accessible to all Albertans wherever they are.
          </p>
        </div>

        <div class="info-block">
          <h3>User-Centered Design</h3>
          <p>
            Our services are designed with users in mind, following the
            Alberta Design System standards for consistency and accessibility.
          </p>
        </div>

        <div class="info-block">
          <h3>Continuous Improvement</h3>
          <p>
            We regularly update our services based on user feedback and
            evolving needs to ensure the best possible experience.
          </p>
        </div>
      </div>

      <section class="contact-section">
        <h2>Get in Touch</h2>
        <p>Have questions or feedback? We'd love to hear from you.</p>
        <goa-button type="primary" @click="goToContact">
          Contact Us
        </goa-button>
      </section>
    </section>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const goToContact = () => {
  router.push('/contact');
};
</script>

<style scoped>
.about {
  max-width: 900px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: var(--goa-space-xl);
}

.page-header h1 {
  font-size: var(--goa-font-size-7);
  font-weight: var(--goa-font-weight-bold);
  color: var(--goa-color-text-default);
}

.content {
  display: flex;
  flex-direction: column;
  gap: var(--goa-space-xl);
}

.content h2 {
  font-size: var(--goa-font-size-6);
  font-weight: var(--goa-font-weight-bold);
  color: var(--goa-color-text-default);
  margin-bottom: var(--goa-space-m);
}

.info-blocks {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--goa-space-l);
  margin-top: var(--goa-space-l);
}

.info-block {
  padding: var(--goa-space-l);
  border: 1px solid var(--goa-color-greyscale-200);
  border-radius: var(--goa-border-radius-m);
  background-color: var(--goa-color-greyscale-white);
}

.info-block h3 {
  font-size: var(--goa-font-size-5);
  font-weight: var(--goa-font-weight-bold);
  color: var(--goa-color-text-default);
  margin-bottom: var(--goa-space-s);
}

.info-block p {
  color: var(--goa-color-text-secondary);
  line-height: 1.6;
}

.contact-section {
  padding: var(--goa-space-xl);
  background-color: var(--goa-color-greyscale-100);
  border-radius: var(--goa-border-radius-m);
  text-align: center;
}

.contact-section p {
  margin-bottom: var(--goa-space-m);
  color: var(--goa-color-text-secondary);
}
</style>
