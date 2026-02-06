export const LABELS = {
  // Navigation
  nav: {
    home: 'Home',
    scholarships: 'Scholarships',
    myApplications: 'My Applications',
    dashboard: 'Dashboard',
    workQueue: 'Work Queue',
    reports: 'Reports',
    admin: 'Administration',
    help: 'Help & FAQs'
  },

  // Page Titles
  titles: {
    scholarshipCatalog: 'Available Scholarships',
    applicationForm: 'Scholarship Application',
    applicationStatus: 'Application Status',
    applicantDashboard: 'My Dashboard',
    staffDashboard: 'Staff Dashboard',
    adminDashboard: 'Administration',
    workQueue: 'Application Work Queue',
    reports: 'Operational Reports',
    userManagement: 'User Management',
    scholarshipConfig: 'Scholarship Configuration',
    help: 'Help & FAQs'
  },

  // Scholarship Catalog
  catalog: {
    searchPlaceholder: 'Search scholarships...',
    filterByType: 'All Application Types',
    filterByCategory: 'All Categories',
    filterByDeadline: 'All Deadlines',
    applyButton: 'Apply Now',
    viewDetails: 'View Details',
    deadline: 'Deadline',
    awardValue: 'Award Value',
    eligibility: 'Eligibility',
    noResults: 'No scholarships found matching your criteria'
  },

  // Application Form
  form: {
    personalInfo: 'Personal Information',
    contactInfo: 'Contact Information',
    citizenshipResidency: 'Citizenship & Residency',
    education: 'Education',
    postsecondary: 'Post-Secondary Information',
    highSchool: 'High School Information',
    documents: 'Supporting Documents',
    bankingInfo: 'Direct Deposit Information',
    declaration: 'Declaration & Consent',
    privacy: 'Privacy Collection Notice',
    saveDraft: 'Save Draft',
    submitApplication: 'Submit Application',
    nextStep: 'Next',
    previousStep: 'Previous',
    requiredField: 'Required',
    uploadFile: 'Upload File',
    removeFile: 'Remove',
    maxFileSize: 'Maximum file size: 10MB',
    acceptedFormats: 'Accepted formats: PDF, DOCX, JPG, PNG'
  },

  // Application Status Labels
  status: {
    draft: 'Draft',
    submitted: 'Submitted',
    underReview: 'Under Review',
    missingInfo: 'Missing Information',
    approved: 'Approved',
    rejected: 'Rejected',
    pendingPayment: 'Pending Payment',
    paid: 'Paid',
    withdrawn: 'Withdrawn'
  },

  // Staff Work Queue
  queue: {
    filterByScholarship: 'All Scholarships',
    filterByStatus: 'All Statuses',
    filterByReviewer: 'All Reviewers',
    filterByDeadline: 'All Deadlines',
    sortBy: 'Sort By',
    bulkActions: 'Bulk Actions',
    assignTo: 'Assign To',
    changeStatus: 'Change Status',
    viewApplication: 'View Application',
    referenceNumber: 'Reference #',
    applicantName: 'Applicant',
    scholarship: 'Scholarship',
    submittedDate: 'Submitted',
    currentStatus: 'Status',
    assignedTo: 'Assigned To',
    daysInQueue: 'Days in Queue'
  },

  // Dashboard Metrics
  metrics: {
    totalApplications: 'Total Applications',
    pendingReview: 'Pending Review',
    approvedAwards: 'Approved Awards',
    avgTurnaround: 'Avg. Turnaround (Days)',
    directDepositRate: 'Direct Deposit Rate',
    missingInfoRate: 'Missing Info Rate',
    queueDepth: 'Queue Depth',
    completionRate: 'Completion Rate',
    approvalRate: 'Approval Rate',
    staffWorkload: 'Per-Staff Workload'
  },

  // Reports
  reports: {
    dateRange: 'Date Range',
    scholarshipFilter: 'Scholarship',
    statusFilter: 'Status',
    generateReport: 'Generate Report',
    exportCsv: 'Export CSV',
    exportPdf: 'Export PDF',
    volumeReport: 'Application Volume Report',
    turnaroundReport: 'Turnaround Time Report',
    backlogReport: 'Backlog Report',
    outcomesReport: 'Outcomes by Scholarship'
  },

  // Correspondence
  correspondence: {
    generateLetter: 'Generate Letter',
    previewLetter: 'Preview',
    sendLetter: 'Send',
    approvalLetter: 'Approval Letter',
    rejectionLetter: 'Rejection Letter',
    miLetter: 'Missing Information Request',
    corRequest: 'COR Request',
    selectTemplate: 'Select Template',
    selectParagraphs: 'Select Paragraphs',
    recipientEmail: 'Recipient Email'
  },

  // Notifications
  notifications: {
    title: 'Notifications',
    markAsRead: 'Mark as Read',
    markAllRead: 'Mark All as Read',
    noNotifications: 'No new notifications',
    viewAll: 'View All Notifications'
  },

  // Common Actions
  actions: {
    save: 'Save',
    cancel: 'Cancel',
    submit: 'Submit',
    edit: 'Edit',
    delete: 'Delete',
    view: 'View',
    export: 'Export',
    filter: 'Filter',
    clearFilters: 'Clear Filters',
    refresh: 'Refresh',
    back: 'Back',
    confirm: 'Confirm',
    approve: 'Approve',
    reject: 'Reject',
    search: 'Search'
  },

  // Common Messages
  messages: {
    loading: 'Loading...',
    saving: 'Saving...',
    submitting: 'Submitting...',
    noResults: 'No results found',
    error: 'An error occurred. Please try again.',
    saveSuccess: 'Draft saved successfully.',
    submitSuccess: 'Application submitted successfully.',
    confirmSubmit: 'Are you sure you want to submit this application? You will not be able to edit it after submission.',
    confirmDelete: 'Are you sure you want to delete this item?',
    sessionExpired: 'Your session has expired. Please log in again.',
    unauthorized: 'You do not have permission to access this resource.'
  },

  // Authentication
  auth: {
    loginTitle: 'Sign In',
    loginWithACA: 'Sign in with Alberta.ca Account',
    loginWithMicrosoft: 'Sign in with Microsoft (Staff)',
    logout: 'Sign Out',
    welcome: 'Welcome',
    profile: 'My Profile'
  },

  // Help & FAQ
  help: {
    title: 'Help & Frequently Asked Questions',
    contactTitle: 'Contact Support',
    contactPhone: 'Phone',
    contactEmail: 'Email',
    faqTitle: 'Frequently Asked Questions',
    searchFaq: 'Search help topics...'
  },

  // Accessibility
  accessibility: {
    skipToContent: 'Skip to main content',
    openMenu: 'Open navigation menu',
    closeMenu: 'Close navigation menu',
    expandSection: 'Expand section',
    collapseSection: 'Collapse section',
    requiredField: 'This field is required',
    formError: 'Please correct the errors in the form',
    newNotification: 'You have a new notification'
  }
};

export default LABELS;
