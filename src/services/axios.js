import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor for injecting JWT tokens
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('skr_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling global errors (e.g., 401 Unauthenticated)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response ? error.response.status : null;
    
    if (status === 401) {
      // Clear auth data and redirect to login
      localStorage.removeItem('skr_token');
      localStorage.removeItem('skr_user');
      if (!window.location.pathname.includes('/login')) {
        window.location.replace('/login');
      }
    }
    
    // Extract server-side message if available
    const serverMessage = error.response?.data?.message || error.response?.data?.error;
    const clientMessage = error.message || 'An unexpected connection error occurred';
    const message = serverMessage || clientMessage;
    
    // Create custom error object
    const customError = new Error(message);
    customError.status = status;
    customError.response = error.response;
    
    return Promise.reject(customError);
  }
);

export default axiosInstance;
