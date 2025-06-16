import axios from 'axios';

const API_URL = 'https://vid-backend-yyha.onrender.com/api/';


//const API_URL2 = process.env.REACT_APP_API_URL || 'http://localhost:5265/api/';

// Create axios instance with default configuration
// const apiClient = axios.create({
//   baseURL: API_URL2,
//   headers: {
//     'Content-Type': 'application/json'
//   }
// });

// Set up axios interceptor for JWT
axios.interceptors.request.use(
    config => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    },
    error => {
      return Promise.reject(error);
    }
);

// Add response interceptor for consistent error handling
axios.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Intercept responses to handle auth errors
// apiClient.interceptors.response.use(
//   response => response,
//   error => {
//     if (error.response && error.response.status === 401) {
//       // Auto logout if 401 response returned from api
//       //logout();
//       window.location.href = '/login';
//     }
//     return Promise.reject(error);
//   }
// );
  
export const authService = {

    forgotPassword: async (email) => {
      try {
        const response = await axios.post(API_URL + 'auth/forgot-password', { email });
        return response.data;
      } catch (error) {
        throw error("Under forgot password");
      }
    },

    verifyOTP: async (email, otp) => {
      try {
        if (!email || !otp) {
          throw new Error('Email and verification code are required');
        }
        
        // Log request details for debugging (remove in production)
        console.log('Sending OTP verification request:', { 
          email, 
          otpLength: otp.length 
        });
        
        const response = await axios.post(API_URL + 'auth/verify-otp', {
          email: email.trim(),
          otp: otp.trim()
        });
        
        // The API might return different formats, handle both possibilities
        if (response.data === false) {
          throw new Error('Invalid or expired verification code');
        }
        
        return response.data;
      } catch (error) {
        // Handle specific error codes
        if (error.response?.status === 400) {
          throw new Error('Invalid verification details');
        } else if (error.response?.status === 404) {
          throw new Error('Account not found');
        } else if (error.response?.status === 410 || 
                  (error.response?.data?.message && 
                   error.response?.data?.message.includes('expired'))) {
          throw new Error('Verification code has expired');
        }
        
        // If it's an axios error with response data
        if (error.response?.data?.message) {
          throw new Error(error.response.data.message);
        }
        
        // For other errors, rethrow with a friendly message
        throw error.message ? error : new Error('Invalid or expired verification code');
      }
    },
    

    resetPassword: async (email, token, newPassword) => {
      try {
        const response = await axios.post(API_URL + 'auth/reset-password', { 
          email, 
          token, 
          newPassword 
        });
        return response.data;
      } catch (error) {
        throw error.response.data;
      }
    },

    login: async (email, password) => {
      try{
        const response = await axios.post(API_URL + 'auth/login', {
          email,
          password
        });
        
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('userId', response.data.userId);
        }
        
        return response.data;
      }
      catch (error) {
        throw error;
      }
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
    },

    getCurrentUser: () => {
        const token = localStorage.getItem('token');
        if (token) {
          // You can decode the JWT to get user info
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );

          return JSON.parse(jsonPayload);
        }
        
        return null;

    },

    isAuthenticated: () => {
        return localStorage.getItem('token') !== null;
    }

};

export default authService;
