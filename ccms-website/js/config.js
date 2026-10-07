/* ==========================================================================
   config.js — constants shared by the whole application
   Change values here (categories, teams, limits) instead of editing views.
   ========================================================================== */
window.CCMS = window.CCMS || {};

CCMS.CONFIG = {
  APP_NAME: 'Smart Community Complaint Management System',
  STORAGE_PREFIX: 'ccms_',

  // Complaint categories (shown on landing page, dropdowns and filters)
  CATEGORIES: [
    'Road / Pothole',
    'Street Light',
    'Water Leakage',
    'Garbage',
    'Drainage',
    'Sanitation',
    'Electricity',
    'Other'
  ],

  // Status lifecycle set by the administrator
  STATUSES: ['Pending', 'In Progress', 'Resolved'],

  // Priority is chosen by the administrator only. New complaints start as "Not Set".
  PRIORITIES: ['Low', 'Medium', 'High', 'Critical'],
  DEFAULT_PRIORITY: 'Not Set',

  // Default responsible teams (editable by the admin in Settings)
  DEFAULT_TEAMS: [
    'Plumbing Team',
    'Electrical Team',
    'Housekeeping & Sanitation Team',
    'Civil / Road Maintenance Team',
    'Drainage Team',
    'Estate Office (General)'
  ],

  // Photograph rules (validated in the Submit Complaint form)
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  MAX_IMAGE_BYTES: 3 * 1024 * 1024,   // 3 MB before resizing
  IMAGE_MAX_DIMENSION: 1000,          // photo is resized to save localStorage space

  DEFAULT_ORG_NAME: 'Smt. Kashibai Navale College of Engineering'
};
