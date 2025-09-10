import axios from 'axios'

// Types
interface LoginCredentials {
  login: string
  password: string
}

interface LoginResponse {
  token: string
  user: {
    id: string
    username: string
    email: string
    firstName: string
    lastName: string
    fullName: string
    role: 'admin' | 'manager' | 'user' | 'viewer'
    department?: string
    extension?: string
    permissions: {
      viewAnalytics: boolean
      viewCallLogs: boolean
      exportData: boolean
      manageUsers: boolean
      systemSettings: boolean
    }
    preferences: {
      theme: 'light' | 'dark' | 'system'
      timezone: string
      dateFormat: string
      itemsPerPage: number
    }
  }
}

interface ChangePasswordData {
  currentPassword: string
  newPassword: string
}

// Configure axios defaults
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth service
export const authService = {
  // Login user
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', credentials)
      return response.data
    } catch (error: any) {
      console.error('Login error:', error)
      throw error
    }
  },

  // Get current user
  async getCurrentUser(): Promise<LoginResponse['user']> {
    try {
      const response = await apiClient.get<{ user: LoginResponse['user'] }>('/auth/me')
      return response.data.user
    } catch (error: any) {
      console.error('Get current user error:', error)
      throw error
    }
  },

  // Google OAuth login
  async googleLogin(token: string): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>('/auth/google', { credential: token })
      return response.data
    } catch (error: any) {
      console.error('Google login error:', error)
      throw error
    }
  },

  // Change password
  async changePassword(data: ChangePasswordData): Promise<{ message: string }> {
    try {
      const response = await apiClient.put<{ message: string }>('/auth/change-password', data)
      return response.data
    } catch (error: any) {
      console.error('Change password error:', error)
      throw error
    }
  },

  // Logout user
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout')
    } catch (error: any) {
      console.error('Logout error:', error)
      // Don't throw error for logout as we want to clear local state regardless
    }
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = localStorage.getItem('token')
    return !!token
  },

  // Get stored token
  getToken(): string | null {
    return localStorage.getItem('token')
  },

  // Clear stored token
  clearToken(): void {
    localStorage.removeItem('token')
  }
}

// Export types
export type { LoginCredentials, LoginResponse, ChangePasswordData }