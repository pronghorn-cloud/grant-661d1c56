import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

// Import GoA Web Components styles
import '@abgov/web-components/index.css';

// Import custom styles
import './assets/styles/main.css';

// Import GoA Web Components
// Components are automatically registered as custom elements
import '@abgov/web-components';

const app = createApp(App);

app.use(router);

app.mount('#app');
