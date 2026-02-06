import { createRouter, createWebHistory } from 'vue-router';
import { isAuthenticated, getStoredUser } from '@/services/authService';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { guest: true }
  },
  {
    path: '/scholarships',
    name: 'ScholarshipCatalog',
    component: () => import('@/views/ScholarshipCatalog.vue')
  },
  {
    path: '/scholarships/:id',
    name: 'ScholarshipDetail',
    component: () => import('@/views/ScholarshipDetail.vue'),
    props: true
  },
  {
    path: '/profile/setup',
    name: 'ProfileSetup',
    component: () => import('@/views/ProfileSetup.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Profile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/apply/:id',
    name: 'ApplicationForm',
    component: () => import('@/views/ApplicationForm.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/notifications',
    name: 'Notifications',
    component: () => import('@/views/Notifications.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/staff/dashboard',
    name: 'StaffDashboard',
    component: () => import('@/views/StaffDashboard.vue'),
    meta: { requiresAuth: true, requiresStaff: true }
  },
  {
    path: '/staff/queue',
    name: 'StaffQueue',
    component: () => import('@/views/StaffQueue.vue'),
    meta: { requiresAuth: true, requiresStaff: true }
  },
  {
    path: '/staff/review/:id',
    name: 'StaffReview',
    component: () => import('@/views/StaffReview.vue'),
    meta: { requiresAuth: true, requiresStaff: true }
  },
  {
    path: '/staff/reports',
    name: 'StaffReports',
    component: () => import('@/views/StaffReports.vue'),
    meta: { requiresAuth: true, requiresStaff: true }
  },
  {
    path: '/staff/cor',
    name: 'StaffCOR',
    component: () => import('@/views/StaffCOR.vue'),
    meta: { requiresAuth: true, requiresStaff: true }
  },
  {
    path: '/staff/payments',
    name: 'StaffPayments',
    component: () => import('@/views/StaffPayments.vue'),
    meta: { requiresAuth: true, requiresStaff: true }
  },
  {
    path: '/staff/analytics',
    name: 'StaffAnalytics',
    component: () => import('@/views/StaffAnalytics.vue'),
    meta: { requiresAuth: true, requiresStaff: true }
  },
  {
    path: '/admin',
    name: 'AdminPanel',
    component: () => import('@/views/AdminPanel.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/cor/respond/:token',
    name: 'CORResponse',
    component: () => import('@/views/CORResponse.vue')
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('@/views/About.vue')
  },
  {
    path: '/contact',
    name: 'Contact',
    component: () => import('@/views/Contact.vue')
  },
  {
    path: '/help',
    name: 'Help',
    component: () => import('@/views/Help.vue')
  },
  {
    path: '/learner-online',
    name: 'LearnerOnline',
    redirect: '/scholarships'
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { top: 0 };
  }
});

// Auth guard
const staffRoles = ['scholarship_staff', 'scholarship_manager', 'admin', 'superadmin', 'finance'];
const adminRoles = ['admin', 'superadmin'];
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !isAuthenticated()) {
    next({ name: 'Login', query: { redirect: to.fullPath } });
  } else if (to.meta.requiresAdmin) {
    const user = getStoredUser();
    if (!user || !adminRoles.includes(user.role)) {
      next({ name: 'StaffDashboard' });
    } else {
      next();
    }
  } else if (to.meta.requiresStaff) {
    const user = getStoredUser();
    if (!user || !staffRoles.includes(user.role)) {
      next({ name: 'Dashboard' });
    } else {
      next();
    }
  } else if (to.meta.guest && isAuthenticated()) {
    next({ name: 'Dashboard' });
  } else {
    next();
  }
});

export default router;
