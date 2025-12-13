/**
 * Shared Utility Functions
 * Common JavaScript functions used across multiple pages
 */

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} - Escaped HTML string
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Show a temporary message notification
 * @param {HTMLElement} messageDiv - The message container element
 * @param {string} type - Message type: 'success' or 'error'
 * @param {string} text - Message text to display
 * @param {number} duration - Duration in ms (default: 5000)
 */
function showMessage(messageDiv, type, text, duration = 5000) {
  if (!messageDiv) return;

  messageDiv.textContent = text;
  messageDiv.className = `message ${type}`;
  messageDiv.style.display = 'block';

  setTimeout(() => {
    messageDiv.style.display = 'none';
  }, duration);
}

/**
 * Format a date string for display
 * @param {string} dateString - ISO date string
 * @returns {string} - Formatted date string (e.g., "Dec 13, 2025, 10:30 AM")
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format a timestamp with relative time (e.g., "2 hours ago")
 * @param {string} dateString - ISO date string
 * @returns {string} - Formatted timestamp with HTML
 */
function formatTimestamp(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  let timeAgo = '';
  if (diffMins < 1) {
    timeAgo = 'Just now';
  } else if (diffMins < 60) {
    timeAgo = `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    timeAgo = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    timeAgo = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }

  const formatted = date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return timeAgo ? `${formatted}<br><small style="color: #3b82f6; font-weight: 600;">${timeAgo}</small>` : formatted;
}

/**
 * Handle API errors consistently
 * @param {Response} response - Fetch API response object
 * @param {HTMLElement} messageDiv - Optional message container
 * @returns {Promise<Object>} - Parsed JSON response
 */
async function handleApiResponse(response, messageDiv = null) {
  const data = await response.json();

  if (!response.ok && messageDiv) {
    showMessage(messageDiv, 'error', data.message || 'An error occurred');
  }

  return data;
}

/**
 * Get form data as an object
 * @param {HTMLFormElement} form - Form element
 * @returns {Object} - Form data as key-value pairs
 */
function getFormData(form) {
  const formData = new FormData(form);
  const data = {};
  for (const [key, value] of formData.entries()) {
    data[key] = value;
  }
  return data;
}

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if valid email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
