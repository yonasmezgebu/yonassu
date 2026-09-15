import axios from 'axios';
import { apiLoadingEvents } from '../components/ui/GlobalLoader';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Convert a backend-relative path (e.g. /uploads/orders/x.png) into an absolute
// URL at the same backend origin the API talks to — so opening files in the
// browser works even when the frontend isn't proxying /uploads (built/preview).
const mediaUrl = (u = '') => {
  if (!u) return u;
  if (/^https?:\/\//i.test(u)) return u;
  const origin = API_URL.replace(/\/api\/v1\/?$/, '');
  return `${origin}${u.startsWith('/') ? u : `/${u}`}`;
};

const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});
apiClient.interceptors.request.use(
  (config) => {
    apiLoadingEvents.dispatchEvent(new Event('start'));
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const sessionId = localStorage.getItem('sessionId');
    if (sessionId) {
      config.headers['x-session-id'] = sessionId;
    }
    // For FormData let the browser set Content-Type with boundary automatically.
    // We check both instanceof and whether the caller explicitly set it.
    const isFormData = config.data instanceof FormData || (config.data && config.data.toString() === '[object FormData]');
    const isMultipart = config.headers['Content-Type'] === 'multipart/form-data' || config.headers['content-type'] === 'multipart/form-data';
    
    if (isFormData || isMultipart) {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    } else if (!config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }
    return config;
  },
  (error) => {
    apiLoadingEvents.dispatchEvent(new Event('stop'));
    return Promise.reject(error);
  }
);
apiClient.interceptors.response.use(
  (response) => {
    apiLoadingEvents.dispatchEvent(new Event('stop'));
    return response.data;
  },
  (error) => {
    apiLoadingEvents.dispatchEvent(new Event('stop'));
    // Network error / backend is down — don't crash, just reject quietly
    if (!error.response) {
      return Promise.reject(new Error('Cannot connect to server. Please check your connection.'));
    }
    if (error.response.status === 401 && !window.location.pathname.includes('/login')) {
      // Public pages where 401 is expected (e.g. checking cart while not logged in)
      // Only suppress for pure public-only API URLs, not the full page path
      const requestUrl = error.config?.url || '';
      const isPublicApiCall = (
        requestUrl.includes('/retail/products') ||
        requestUrl.includes('/retail/categories') ||
        requestUrl.includes('/retail/track-order') ||
        requestUrl.includes('/pharmacy/products') ||
        requestUrl.includes('/pharmacy/categories')
      );
      // Protected page sections — a 401 here means the session is expired/invalid.
      // On any public page (services, marketplace, tenders, etc.) a 401 simply means
      // the endpoint needs login, so we must NOT bounce the visitor back to /login.
      const PROTECTED_PREFIXES = [
        '/admin', '/ceo', '/finance', '/sales', '/purchase',
        '/pharmacy-store', '/general-store', '/printing-manager',
        '/customer', '/pharmacy', '/pharmacy-worker', '/car-renting',
        '/hr', '/board', '/employee', '/notifications', '/tenders/manage'
      ];
      const currentPath = window.location.pathname;
      const isProtectedPage = PROTECTED_PREFIXES.some(p => currentPath === p || currentPath.startsWith(p));
      if (isPublicApiCall || !isProtectedPage) {
        // Silently fail — public API call or public page, user not logged in, that's fine
        return Promise.reject(new Error('Unauthenticated'));
      }
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('sessionId');
      // Show brief message before redirect
      console.warn('[Session] Token expired — redirecting to login.');
      setTimeout(() => { window.location.href = '/login'; }, 300);
      return Promise.reject(new Error('Session expired. Please login again.'));
    }
    const message = error.response.data?.message || error.response.data?.error || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);
export default apiClient;
export { mediaUrl };
