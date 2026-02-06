<template>
  <goa-app-footer data-testid="app-footer">
    <!-- Navigation columns -->
    <section v-for="(column, index) in footerColumns" :key="index">
      <h3>{{ column.heading }}</h3>
      <a
        v-for="link in column.links"
        :key="link.path"
        :href="link.path"
        @click.prevent="navigateTo(link.path)"
      >
        {{ link.name }}
      </a>
    </section>

    <!-- Meta links section -->
    <section slot="meta">
      <a
        v-for="link in metaLinks"
        :key="link.href"
        :href="link.href"
        :target="link.external ? '_blank' : '_self'"
        :rel="link.external ? 'noopener noreferrer' : ''"
      >
        {{ link.name }}
      </a>
      <div class="copyright">
        &copy; {{ currentYear }} Government of Alberta
      </div>
    </section>
  </goa-app-footer>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const currentYear = computed(() => new Date().getFullYear());

const footerColumns = [
  {
    heading: 'Services',
    links: [
      { name: 'Parks & Recreation', path: '/services?category=parks' },
      { name: 'Healthcare', path: '/services?category=healthcare' },
      { name: 'Education', path: '/services?category=education' },
      { name: 'Business', path: '/services?category=business' }
    ]
  },
  {
    heading: 'Resources',
    links: [
      { name: 'Help Centre', path: '/help' },
      { name: 'Documentation', path: '/docs' },
      { name: 'FAQs', path: '/faq' },
      { name: 'Contact Us', path: '/contact' }
    ]
  },
  {
    heading: 'About',
    links: [
      { name: 'About Alberta', path: '/about' },
      { name: 'Accessibility', path: '/accessibility' },
      { name: 'News & Updates', path: '/news' }
    ]
  }
];

const metaLinks = [
  { name: 'Privacy', href: 'https://www.alberta.ca/privacy.aspx', external: true },
  { name: 'Disclaimer', href: 'https://www.alberta.ca/disclaimer.aspx', external: true },
  { name: 'Accessibility', href: '/accessibility', external: false }
];

const navigateTo = (path) => {
  router.push(path);
};
</script>

<style scoped>
/* Footer styles are handled by the GoA web component */
/* Additional custom styles if needed */

h3 {
  font-size: var(--goa-font-size-4);
  font-weight: var(--goa-font-weight-bold);
  margin-bottom: var(--goa-space-s);
  color: var(--goa-color-text-default);
}

a {
  color: var(--goa-color-text-default);
  text-decoration: none;
  display: block;
  padding: var(--goa-space-2xs) 0;
  transition: color 0.2s ease;
}

a:hover {
  color: var(--goa-color-interactive-hover);
  text-decoration: underline;
}

.copyright {
  margin-top: var(--goa-space-s);
  color: var(--goa-color-text-secondary);
  font-size: var(--goa-font-size-2);
}

section {
  display: flex;
  flex-direction: column;
}
</style>
