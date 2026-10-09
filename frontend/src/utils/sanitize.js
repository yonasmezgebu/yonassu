/**
 * sanitize.js — Central HTML sanitization utility using DOMPurify.
 *
 * FIX #2: All dangerouslySetInnerHTML and innerHTML usages that render
 * user-provided content must be wrapped through this utility to prevent
 * Stored XSS attacks. Hardcoded static strings (CSS, fixed templates)
 * are safe and don't need sanitization.
 *
 * Usage:
 *   import { sanitizeHtml } from '../utils/sanitize';
 *   <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(userContent) }} />
 *
 * For print windows (document.write), wrap the full HTML body:
 *   w.document.write(sanitizePrintHtml(sanitizeHtml(printRef.current.innerHTML)));
 */
import DOMPurify from 'dompurify';

/**
 * Sanitize an HTML string — removes all script tags, event handlers,
 * and dangerous attributes while keeping safe formatting HTML intact.
 * @param {string} dirty - Raw HTML string that may contain user content
 * @returns {string} - Safe HTML with all XSS vectors removed
 */
export const sanitizeHtml = (dirty) => {
  if (!dirty) return '';
  return DOMPurify.sanitize(dirty, {
    // Allow all standard HTML formatting and table tags (needed for print layouts)
    ALLOWED_TAGS: [
      'a', 'b', 'blockquote', 'br', 'caption', 'cite', 'code',
      'col', 'colgroup', 'dd', 'div', 'dl', 'dt', 'em', 'fieldset',
      'figcaption', 'figure', 'footer', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'header', 'hr', 'i', 'img', 'label', 'legend', 'li', 'main',
      'nav', 'ol', 'p', 'pre', 'section', 'select', 'small', 'span',
      'strong', 'style', 'sub', 'sup', 'table', 'tbody', 'td', 'tfoot',
      'th', 'thead', 'title', 'tr', 'u', 'ul'
    ],
    // Block all event handlers (onclick, onload, onerror, etc.) and javascript: URLs
    FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover', 'onfocus', 'onblur'],
    FORCE_BODY: false,
    // Allow data: URLs only for images (needed for QR codes / base64 embedded images)
    ALLOW_DATA_ATTR: false,
  });
};

/**
 * Sanitize for print window usage — wraps a full HTML document body.
 * Use this when passing content to document.write() in a new window.
 * @param {string} dirty - Full HTML string
 * @returns {string} - Safe HTML
 */
export const sanitizePrintHtml = (dirty) => {
  if (!dirty) return '';
  // For print windows we allow style tags at the top level
  return DOMPurify.sanitize(dirty, {
    FORCE_BODY: true,
    WHOLE_DOCUMENT: false,
  });
};
