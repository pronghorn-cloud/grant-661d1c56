<template>
  <div class="contact">
    <header class="page-header">
      <h1>Contact Us</h1>
      <p>Get in touch with our team</p>
    </header>

    <div class="contact-content">
      <section class="contact-form">
        <h2>Send us a message</h2>

        <form @submit.prevent="handleSubmit">
          <goa-form-item label="Name" requirement="required">
            <goa-input
              v-model="form.name"
              name="name"
              placeholder="Your full name"
            ></goa-input>
          </goa-form-item>

          <goa-form-item label="Email" requirement="required">
            <goa-input
              v-model="form.email"
              name="email"
              type="email"
              placeholder="your.email@example.com"
            ></goa-input>
          </goa-form-item>

          <goa-form-item label="Subject" requirement="required">
            <goa-input
              v-model="form.subject"
              name="subject"
              placeholder="Brief subject of your inquiry"
            ></goa-input>
          </goa-form-item>

          <goa-form-item label="Message" requirement="required">
            <goa-textarea
              v-model="form.message"
              name="message"
              placeholder="Please describe your inquiry..."
              rows="6"
            ></goa-textarea>
          </goa-form-item>

          <div class="form-actions">
            <goa-button type="primary" submit>
              Send Message
            </goa-button>
            <goa-button type="secondary" @click="resetForm">
              Reset
            </goa-button>
          </div>
        </form>
      </section>

      <aside class="contact-info">
        <h2>Other Ways to Reach Us</h2>

        <div class="info-card">
          <h3>Phone</h3>
          <p>1-800-XXX-XXXX</p>
          <p class="hours">Monday - Friday: 8:30 AM - 4:30 PM</p>
        </div>

        <div class="info-card">
          <h3>Email</h3>
          <p>info@alberta.ca</p>
        </div>

        <div class="info-card">
          <h3>Address</h3>
          <p>
            Government of Alberta<br>
            Legislature Building<br>
            10800 97 Avenue<br>
            Edmonton, AB T5K 2B6
          </p>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const form = ref({
  name: '',
  email: '',
  subject: '',
  message: ''
});

const handleSubmit = () => {
  // Add form submission logic here
  alert('Thank you for your message. We will get back to you soon!');
  resetForm();
};

const resetForm = () => {
  form.value = {
    name: '',
    email: '',
    subject: '',
    message: ''
  };
};
</script>

<style scoped>
.contact {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: var(--goa-space-xl);
}

.page-header h1 {
  font-size: var(--goa-font-size-7);
  font-weight: var(--goa-font-weight-bold);
  color: var(--goa-color-text-default);
  margin-bottom: var(--goa-space-s);
}

.page-header p {
  font-size: var(--goa-font-size-4);
  color: var(--goa-color-text-secondary);
}

.contact-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--goa-space-xl);
}

.contact-form h2,
.contact-info h2 {
  font-size: var(--goa-font-size-6);
  font-weight: var(--goa-font-weight-bold);
  color: var(--goa-color-text-default);
  margin-bottom: var(--goa-space-l);
}

form {
  display: flex;
  flex-direction: column;
  gap: var(--goa-space-m);
}

.form-actions {
  display: flex;
  gap: var(--goa-space-m);
  margin-top: var(--goa-space-m);
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: var(--goa-space-l);
}

.info-card {
  padding: var(--goa-space-l);
  background-color: var(--goa-color-greyscale-100);
  border-radius: var(--goa-border-radius-m);
}

.info-card h3 {
  font-size: var(--goa-font-size-5);
  font-weight: var(--goa-font-weight-bold);
  color: var(--goa-color-text-default);
  margin-bottom: var(--goa-space-s);
}

.info-card p {
  color: var(--goa-color-text-secondary);
  margin: var(--goa-space-2xs) 0;
}

.hours {
  font-size: var(--goa-font-size-2);
  font-style: italic;
}

@media (max-width: 968px) {
  .contact-content {
    grid-template-columns: 1fr;
  }
}
</style>
