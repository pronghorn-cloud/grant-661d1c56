export const DOMAIN_CONFIG = {
  // Terminology
  labels: {
    organization: 'Scholarship',
    organizations: 'Scholarships',
    entity: 'Application',
    entities: 'Applications',
    metric: 'Application Volume',
    metrics: 'Application Metrics',
    period: 'Academic Year'
  },

  // Application Status Workflow
  statuses: {
    draft: { label: 'Draft', color: '#6c757d', icon: 'edit' },
    submitted: { label: 'Submitted', color: '#0070c4', icon: 'check-circle' },
    under_review: { label: 'Under Review', color: '#17a2b8', icon: 'search' },
    missing_info: { label: 'Missing Info', color: '#ffc107', icon: 'alert-triangle' },
    approved: { label: 'Approved', color: '#28a745', icon: 'award' },
    rejected: { label: 'Rejected', color: '#dc3545', icon: 'x-circle' },
    pending_payment: { label: 'Pending Payment', color: '#fd7e14', icon: 'clock' },
    paid: { label: 'Paid', color: '#28a745', icon: 'dollar-sign' },
    withdrawn: { label: 'Withdrawn', color: '#6c757d', icon: 'minus-circle' }
  },

  // Queue/Workload Alert Thresholds
  thresholds: {
    critical: { min: 500, label: 'Queue Overload', color: '#dc3545' },
    warning: { min: 300, max: 499, label: 'Queue High', color: '#ffc107' },
    normal: { max: 299, label: 'Queue Normal', color: '#28a745' }
  },

  // Deadline Alert Thresholds
  deadlineAlerts: {
    approaching: { daysBeforeDeadline: 14, label: 'Deadline Approaching', color: '#ffc107' },
    imminent: { daysBeforeDeadline: 3, label: 'Deadline Imminent', color: '#fd7e14' },
    passed: { daysAfterDeadline: 0, label: 'Deadline Passed', color: '#dc3545' }
  },

  // Processing SLA Thresholds
  processingAlerts: {
    onTrack: { maxDays: 30, label: 'On Track', color: '#28a745' },
    atRisk: { maxDays: 45, label: 'At Risk', color: '#ffc107' },
    overdue: { maxDays: 45, label: 'Overdue', color: '#dc3545' }
  },

  // KPI Targets
  kpiTargets: {
    processingTime: { target: 30, warning: 45, unit: 'days' },
    applicationCapacity: { target: 2000, warning: 1500, unit: 'per month' },
    dataAccuracy: { target: 90, warning: 80, unit: '%' },
    directDepositRate: { target: 95, warning: 80, unit: '%' },
    systemUptime: { target: 99.5, warning: 99, unit: '%' }
  },

  // Dashboard Configuration
  dashboard: {
    summaryCards: [
      { key: 'total_applications', label: 'Total Applications This Cycle', format: 'number' },
      { key: 'pending_review', label: 'Pending Review', format: 'number' },
      { key: 'approved_awards', label: 'Approved Awards', format: 'number' },
      { key: 'avg_turnaround', label: 'Avg. Turnaround', format: 'days' },
      { key: 'dd_rate', label: 'Direct Deposit Rate', format: 'percent' },
      { key: 'mi_rate', label: 'Missing Info Rate', format: 'percent' }
    ],
    defaultPeriod: '2025-26',
    trendsYears: 5
  },

  // Notification Configuration
  notifications: {
    types: {
      submitted: { label: 'Application Submitted', template: 'submission_confirmation' },
      action_required: { label: 'Action Required', template: 'missing_info_request' },
      decision_available: { label: 'Decision Available', template: 'decision_notification' },
      mi_request: { label: 'Missing Information', template: 'mi_letter' },
      payment_processed: { label: 'Payment Processed', template: 'payment_confirmation' },
      cor_request: { label: 'COR Request', template: 'cor_request_letter' },
      deadline_reminder: { label: 'Deadline Reminder', template: 'deadline_reminder' }
    }
  },

  // File Upload Configuration
  uploads: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'],
    allowedExtensions: ['.pdf', '.docx', '.jpg', '.jpeg', '.png'],
    maxFilesPerApplication: 10
  },

  // Banking Validation
  banking: {
    institutionNumberLength: 3,
    transitNumberLength: 5,
    accountNumberMaxLength: 12
  }
};

export default DOMAIN_CONFIG;
