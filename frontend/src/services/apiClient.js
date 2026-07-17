import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});
apiClient.interceptors.request.use(
  (config) => {
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
  (error) => Promise.reject(error)
);
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Network error / backend is down — don't crash, just reject quietly
    if (!error.response) {
      return Promise.reject(new Error('Cannot connect to server. Please check your connection.'));
    }
    if (error.response.status === 401 && !window.location.pathname.includes('/login')) {
      // Only treat exact '/' or specific paths as public, not everything that starts with '/'
      const publicPaths = ['/services/', '/pharmacy-portal', '/health', '/about', '/contact'];
      const isPublicPage = window.location.pathname === '/' || publicPaths.some(p => window.location.pathname.startsWith(p));
      if (isPublicPage) {
        // Silently fail — public page, user is not logged in, that's ok
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
