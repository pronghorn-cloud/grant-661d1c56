<template>
  <div class="help-page">
    <header class="page-header">
      <h1>Help &amp; Frequently Asked Questions</h1>
    </header>

    <div class="help-content">
      <!-- Search/Filter -->
      <div class="search-bar">
        <goa-input name="faq-search" :value="searchQuery" @_change="(e) => searchQuery = e.detail.value"
          placeholder="Search FAQs..." width="100%" leadingicon="search"></goa-input>
      </div>

      <!-- Topic Filter -->
      <div class="topic-filter">
        <button v-for="topic in topics" :key="topic.key" :class="{ active: activeTopic === topic.key }"
          @click="activeTopic = activeTopic === topic.key ? '' : topic.key">
          {{ topic.label }}
        </button>
      </div>

      <section class="faq-section">
        <h2>Frequently Asked Questions</h2>

        <div v-if="filteredFaqs.length === 0" class="empty-state">
          <p>No FAQs match your search. Try different keywords or clear the filter.</p>
        </div>

        <div v-for="(faq, idx) in filteredFaqs" :key="idx" class="faq-item" @click="toggleFaq(idx)">
          <div class="faq-question">
            <h3>{{ faq.question }}</h3>
            <span class="faq-toggle">{{ openFaqs.includes(idx) ? '−' : '+' }}</span>
          </div>
          <div v-if="openFaqs.includes(idx)" class="faq-answer">
            <p>{{ faq.answer }}</p>
          </div>
          <div class="faq-topics">
            <span v-for="t in faq.topics" :key="t" class="topic-badge">{{ t }}</span>
          </div>
        </div>
      </section>

      <!-- Learner Online Link (UC-HELP-02) -->
      <section class="learner-online-section">
        <goa-callout type="information" heading="Coming from Learner Online?">
          If you were redirected from the Learner Online portal, you can use this system to apply for Alberta scholarships online.
          Browse the <a href="/scholarships" @click.prevent="$router.push('/scholarships')">Scholarship Catalog</a> to get started.
        </goa-callout>
      </section>

      <section class="contact-section">
        <h2>Contact Support</h2>
        <div class="contact-info">
          <div class="contact-card">
            <h3>Phone</h3>
            <p>780-427-3722 (Edmonton)<br>1-855-606-2096 (Toll-free)</p>
            <p class="hours">Monday - Friday: 8:15 AM - 4:30 PM MST</p>
          </div>
          <div class="contact-card">
            <h3>Email</h3>
            <p>aeinfo@gov.ab.ca</p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const searchQuery = ref('');
const activeTopic = ref('');
const openFaqs = ref([]);

const topics = [
  { key: 'eligibility', label: 'Eligibility' },
  { key: 'documents', label: 'Documents' },
  { key: 'timelines', label: 'Timelines' },
  { key: 'status', label: 'Status' },
  { key: 'payment', label: 'Payment' }
];

const faqs = [
  {
    question: 'How do I apply for a scholarship?',
    answer: 'Browse the scholarship catalog to find available opportunities. Click "Apply Now" on any online application scholarship. You will need to sign in with your Alberta.ca Account first.',
    topics: ['eligibility']
  },
  {
    question: 'What are the eligibility requirements?',
    answer: 'Eligibility varies by scholarship. Common requirements include Alberta residency, Canadian citizenship or permanent residency, and enrollment in an eligible post-secondary institution. Check each scholarship for specific criteria.',
    topics: ['eligibility']
  },
  {
    question: 'What documents do I need?',
    answer: 'Required documents vary by scholarship. Common documents include transcripts, identification, and nomination letters. Check each scholarship\'s requirements for specifics.',
    topics: ['documents']
  },
  {
    question: 'How do I upload supporting documents?',
    answer: 'During the application process, you can upload documents in the Documents section. Accepted formats include PDF, JPG, and PNG. Maximum file size is 5MB per document.',
    topics: ['documents']
  },
  {
    question: 'What are the application deadlines?',
    answer: 'Deadlines vary by scholarship and are displayed on each scholarship\'s detail page. Applications must be submitted before 11:59 PM MST on the deadline date.',
    topics: ['timelines']
  },
  {
    question: 'How long does the review process take?',
    answer: 'Review timelines vary. Most scholarships are reviewed within 4-8 weeks after the deadline closes. You will receive a notification when a decision is made.',
    topics: ['timelines', 'status']
  },
  {
    question: 'How do I check my application status?',
    answer: 'Sign in and visit your Dashboard to see all submitted applications and their current status. Statuses include: Draft, Submitted, Under Review, Missing Info, Approved, and Rejected.',
    topics: ['status']
  },
  {
    question: 'What does "Missing Info" status mean?',
    answer: 'If your application status is "Missing Info", additional information or documents are needed. Check your notifications for a Missing Information letter detailing what is required.',
    topics: ['status']
  },
  {
    question: 'Can I save my application and continue later?',
    answer: 'Yes. Applications are automatically saved as drafts. You can return to complete and submit them at any time before the deadline.',
    topics: ['timelines']
  },
  {
    question: 'How do I set up direct deposit?',
    answer: 'Go to your Profile page and select the Banking Information tab. You will need your institution number (3 digits), transit number (5 digits), and account number. You must authorize direct deposit by checking the authorization box.',
    topics: ['payment']
  },
  {
    question: 'When will I receive my scholarship payment?',
    answer: 'Payment timelines depend on the scholarship. Once approved, payments are typically processed within 4-6 weeks. You will receive a notification when your payment is being processed and again when it is deposited.',
    topics: ['payment', 'timelines']
  },
  {
    question: 'Can I apply for multiple scholarships?',
    answer: 'Yes, you can apply for as many scholarships as you are eligible for. Each application is reviewed independently.',
    topics: ['eligibility']
  }
];

function toggleFaq(idx) {
  const i = openFaqs.value.indexOf(idx);
  if (i >= 0) openFaqs.value.splice(i, 1);
  else openFaqs.value.push(idx);
}

const filteredFaqs = computed(() => {
  let result = faqs;
  if (activeTopic.value) {
    result = result.filter(f => f.topics.includes(activeTopic.value));
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(f =>
      f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)
    );
  }
  return result;
});
</script>

<style scoped>
.help-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px;
}

.page-header h1 {
  font-size: var(--goa-font-size-7);
  font-weight: var(--goa-font-weight-bold);
  margin-bottom: var(--goa-space-l);
}

.help-content {
  display: flex;
  flex-direction: column;
  gap: var(--goa-space-xl);
}

.search-bar { margin-bottom: 0; }

.topic-filter { display: flex; gap: 8px; flex-wrap: wrap; }
.topic-filter button {
  padding: 6px 14px; border: 1px solid #ccc; background: white; border-radius: 20px;
  cursor: pointer; font-size: 13px; transition: all 0.2s;
}
.topic-filter button:hover { border-color: #0070c4; color: #0070c4; }
.topic-filter button.active { background: #0070c4; color: white; border-color: #0070c4; }

.faq-section h2,
.contact-section h2 {
  font-size: var(--goa-font-size-6);
  margin-bottom: var(--goa-space-l);
}

.faq-item {
  margin-bottom: 0;
  padding: var(--goa-space-m) var(--goa-space-l);
  border: 1px solid var(--goa-color-greyscale-200);
  border-radius: var(--goa-border-radius-m);
  cursor: pointer;
  transition: background 0.2s;
  margin-bottom: var(--goa-space-s);
}
.faq-item:hover { background: var(--goa-color-greyscale-100); }

.faq-question {
  display: flex; justify-content: space-between; align-items: center;
}
.faq-question h3 {
  font-size: var(--goa-font-size-4);
  color: var(--goa-color-interactive-default);
  margin: 0;
}
.faq-toggle { font-size: 20px; font-weight: bold; color: #666; }

.faq-answer {
  margin-top: var(--goa-space-s);
  padding-top: var(--goa-space-s);
  border-top: 1px solid var(--goa-color-greyscale-200);
  color: #333;
}

.faq-topics { margin-top: var(--goa-space-xs); }
.topic-badge {
  display: inline-block; padding: 2px 8px; border-radius: 10px;
  font-size: 11px; background: #e9ecef; color: #666; margin-right: 4px;
}

.learner-online-section a { color: var(--goa-color-interactive-default); }

.empty-state { text-align: center; padding: 30px; color: #666; }

.contact-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--goa-space-l);
}

.contact-card {
  padding: var(--goa-space-l);
  background: var(--goa-color-greyscale-100);
  border-radius: var(--goa-border-radius-m);
}

.contact-card h3 {
  font-size: var(--goa-font-size-5);
  margin-bottom: var(--goa-space-s);
}

.hours {
  font-size: var(--goa-font-size-2);
  font-style: italic;
  color: var(--goa-color-text-secondary);
}
</style>
