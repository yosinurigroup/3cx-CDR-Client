import axios from 'axios'

// Types
interface User {
  _id: string
  username: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  role: 'admin' | 'manager' | 'user' | 'viewer'
  department?: string
  extension?: string
  isActive: boolean
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
  databasePermissions?: string[]
  createdAt: string
  updatedAt: string
  lastLogin?: string
  loginAttempts?: number
}

interface UserStats {
  summary: {
    totalUsers: number
    activeUsers: number
    inactiveUsers: number
    recentUsers: number
    roleDistribution: {
      admin: number
      manager: number
      user: number
      viewer: number
    }
  }
}

interface UsersResponse {
  users: User[]
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
    limit: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

interface CreateUserData {
  firstName: string
  lastName: string
  email: string
  username?: string
  password?: string
  role: 'admin' | 'manager' | 'user' | 'viewer'
  department?: string
  extension?: string
  databasePermissions?: string[]
  permissions?: {
    viewAnalytics?: boolean
    viewCallLogs?: boolean
    exportData?: boolean
    manageUsers?: boolean
    systemSettings?: boolean
  }
}

interface UpdateUserData {
  firstName?: string
  lastName?: string
  email?: string
  role?: 'admin' | 'manager' | 'user' | 'viewer'
  department?: string
  extension?: string
  isActive?: boolean
  databasePermissions?: string[]
  permissions?: {
    viewAnalytics?: boolean
    viewCallLogs?: boolean
    exportData?: boolean
    manageUsers?: boolean
    systemSettings?: boolean
  }
  preferences?: {
    theme?: 'light' | 'dark' | 'system'
    timezone?: string
    dateFormat?: string
    itemsPerPage?: number
  }
}

interface UserQueryParams {
  page?: number
  limit?: number
  search?: string
  role?: string
  isActive?: boolean
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
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

// User service
export const userService = {
  // Get all users with filtering and pagination
  async getUsers(params: UserQueryParams = {}): Promise<UsersResponse> {
    try {
      const response = await apiClient.get<UsersResponse>('/users', { params })
      return response.data
    } catch (error: any) {
      console.error('Get users error:', error)
      throw error
    }
  },

  // Get user by ID
  async getUserById(id: string): Promise<{ user: User }> {
    try {
      const response = await apiClient.get<{ user: User }>(`/users/${id}`)
      return response.data
    } catch (error: any) {
      console.error('Get user by ID error:', error)
      throw error
    }
  },

  // Create new user
  async createUser(userData: CreateUserData): Promise<{ message: string; user: User }> {
    try {
      const response = await apiClient.post<{ message: string; user: User }>('/users', userData)
      return response.data
    } catch (error: any) {
      console.error('Create user error:', error)
      throw error
    }
  },

  // Update user
  async updateUser(id: string, userData: UpdateUserData): Promise<{ message: string; user: User }> {
    try {
      const response = await apiClient.put<{ message: string; user: User }>(`/users/${id}`, userData)
      return response.data
    } catch (error: any) {
      console.error('Update user error:', error)
      throw error
    }
  },

  // Delete user (soft delete)
  async deleteUser(id: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.delete<{ message: string }>(`/users/${id}`)
      return response.data
    } catch (error: any) {
      console.error('Delete user error:', error)
      throw error
    }
  },

  // Activate user
  async activateUser(id: string): Promise<{ message: string; user: User }> {
    try {
      const response = await apiClient.put<{ message: string; user: User }>(`/users/${id}/activate`)
      return response.data
    } catch (error: any) {
      console.error('Activate user error:', error)
      throw error
    }
  },

  // Get user statistics
  async getUserStats(): Promise<UserStats> {
    try {
      const response = await apiClient.get<UserStats>('/users/stats/summary')
      return response.data
    } catch (error: any) {
      console.error('Get user stats error:', error)
      throw error
    }
  }
}

// Export types
export type { 
  User, 
  UserStats, 
  UsersResponse, 
  CreateUserData, 
  UpdateUserData, 
  UserQueryParams 
}
