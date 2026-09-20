// backend/utils/sanitize.js

/**
 * Elimina etiquetas HTML y caracteres peligrosos para prevenir XSS.
 * @param {string} value
 * @returns {string}
 */
export function stripHtml(value = '') {
  if (typeof value !== 'string') {
    value = String(value ?? '');
  }
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/[<>]/g, '')
    .trim();
}

/**
 * Sanitiza recursivamente un objeto o array.
 * @param {any} obj
 * @returns {any}
 */
export function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeObject);
  const result = {};
  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === 'string') {
      result[key] = stripHtml(val);
    } else if (val && typeof val === 'object') {
      result[key] = sanitizeObject(val);
    } else {
      result[key] = val;
    }
  }
  return result;
}
