// filepath: src/js/utils.js
// Utility functions

export function formatPrice(cents) {
  if (typeof cents !== 'number') {
    return '$0.00 CAD';
  }
  const dollars = (cents / 100).toFixed(2);
  return `$${dollars} CAD`;
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(value);
}

export function debounce(func, delay) {
  let timeoutId;
  return function debounced(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function getImageUrl(url, fallback = 'https://via.placeholder.com/400x500?text=No+Image') {
  if (!url || typeof url !== 'string') {
    return fallback;
  }
  try {
    new URL(url);
    return url;
  } catch (e) {
    return fallback;
  }
}

export async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function isMobile() {
  return window.innerWidth <= 768;
}
