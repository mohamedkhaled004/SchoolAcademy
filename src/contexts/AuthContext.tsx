import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, phoneNumber: string, guardianPhone: string, currentLocation: string, country: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  validateToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// API Configuration with validation and fallbacks
const getApiBaseUrl = (): string => {
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  
  // Log the API base URL for debugging (only in development)
  if (import.meta.env.DEV) {
    console.log('🔧 AuthContext - API_BASE_URL:', apiBase);
    console.log('🔧 AuthContext - Environment variables:', {
      VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
      MODE: import.meta.env.MODE,
      DEV: import.meta.env.DEV
    });
  }
  
  // Validate API_BASE_URL
  if (!apiBase) {
    console.error('❌ AuthContext - VITE_API_BASE_URL is not defined in .env file');
    console.error('💡 Please create a .env file with: VITE_API_BASE_URL=http://localhost:5000/api');
    return '';
  }
  
  if (typeof apiBase !== 'string') {
    console.error('❌ AuthContext - VITE_API_BASE_URL must be a string, got:', typeof apiBase);
    return '';
  }
  
  // Ensure the URL ends with /api
  const normalizedApiBase = apiBase.endsWith('/api') ? apiBase : `${apiBase.replace(/\/$/, '')}/api`;
  
  if (import.meta.env.DEV) {
    console.log('✅ AuthContext - Using API_BASE_URL:', normalizedApiBase);
  }
  
  return normalizedApiBase;
};

// Enhanced error handling utility
const handleAuthError = (error: any, operation: string): string => {
  console.error(`❌ AuthContext - Error ${operation}:`, error);
  
  if (axios.isAxiosError(error)) {
    console.error('📡 AuthContext - Axios Error Details:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      data: error.response?.data
    });
    
    // Network errors
    if (error.code === 'ERR_NETWORK') {
      console.error('🌐 AuthContext - Network Error: Check if the backend server is running');
      return 'Server is unreachable. Please check your connection and try again.';
    }
    
    // HTTP status code specific errors
    if (error.response?.status === 404) {
      console.error('🔍 AuthContext - 404 Error: API endpoint not found');
      return 'Registration service is not available. Please contact support.';
    }
    
    if (error.response?.status === 500) {
      console.error('💥 AuthContext - 500 Error: Server internal error');
      return 'Server error occurred. Please try again later.';
    }
    
    if (error.response?.status === 400) {
      const errorMessage = error.response.data?.error || 'Invalid request data';
      console.error('⚠️ AuthContext - 400 Error:', errorMessage);
      return errorMessage;
    }
    
    if (error.response?.status === 409) {
      console.error('⚠️ AuthContext - 409 Error: User already exists');
      return 'An account with this email already exists. Please use a different email or try logging in.';
    }
    
    // Return server error message if available
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
  }
  
  // Generic error message
  return `Registration failed. Please try again. (${operation})`;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const API_BASE = getApiBaseUrl();

  // Add axios interceptor for automatic token handling
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
          // Token is invalid or expired, logout user
          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  const validateToken = async (): Promise<boolean> => {
    const token = localStorage.getItem('token');
    if (!token) {
      return false;
    }

    if (!API_BASE) {
      console.error('❌ AuthContext - Cannot validate token: API_BASE is not configured');
      return false;
    }

    try {
      console.log('📡 AuthContext - Validating token at:', `${API_BASE}/validate-token`);
      await axios.get(`${API_BASE}/validate-token`);
      return true;
    } catch (error) {
      console.error('❌ AuthContext - Token validation failed:', error);
      // Token is invalid, clear it
      logout();
      return false;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        const isValid = await validateToken();
        if (isValid) {
          const userData = localStorage.getItem('user');
          if (userData) {
            setUser(JSON.parse(userData));
          }
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    if (!API_BASE) {
      const errorMessage = 'API configuration is missing. Please check your .env file.';
      console.error('❌ AuthContext - Login failed:', errorMessage);
      throw new Error(errorMessage);
    }

    try {
      console.log('📡 AuthContext - Login attempt for:', email);
      console.log('📡 AuthContext - Login URL:', `${API_BASE}/auth/login`);
      
      const response = await axios.post(`${API_BASE}/auth/login`, {
        email,
        password,
      });
      
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      console.log('✅ AuthContext - Login successful for:', email);
    } catch (error) {
      const errorMessage = handleAuthError(error, 'logging in');
      throw new Error(errorMessage);
    }
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    phoneNumber: string,
    guardianPhone: string,
    currentLocation: string,
    country: string
  ) => {
    if (!API_BASE) {
      const errorMessage = 'API configuration is missing. Please check your .env file.';
      console.error('❌ AuthContext - Registration failed:', errorMessage);
      throw new Error(errorMessage);
    }

    try {
      const userData = {
        email,
        password,
        name,
        phoneNumber,
        guardianPhone,
        currentLocation,
        country,
      };
      
      console.log('📡 AuthContext - Registration attempt for:', email);
      console.log('📡 AuthContext - Registration URL:', `${API_BASE}/auth/register`);
      console.log('📦 AuthContext - Registration data:', { ...userData, password: '[HIDDEN]' });
      
      const response = await axios.post(`${API_BASE}/auth/register`, userData);
      
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      console.log('✅ AuthContext - Registration successful for:', email);
    } catch (error) {
      const errorMessage = handleAuthError(error, 'registering');
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    console.log('✅ AuthContext - User logged out');
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    validateToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};