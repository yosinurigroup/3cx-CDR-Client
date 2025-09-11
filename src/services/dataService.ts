import axios from 'axios'

// Types
interface CallLog {
  _id: string
  historyId: string
  startTime: string
  endTime?: string
  duration?: string
  durationSeconds: number
  fromNumber: string
  toNumber: string
  terminationReason: string
  cost: number
  callType: 'incoming' | 'outgoing' | 'internal'
  trunkNumber?: string
  areaCode?: string
  stateCode?: string
  extension?: string
  status: 'answered' | 'unanswered' | 'redirected' | 'waiting'
}

interface AreaCode {
  areaCode: string
  state?: string
  totalCalls: number
  answeredCalls: number
  totalDuration: number
  totalCost: number
  avgDuration: number
  answerRate: number
  percentage: number
}

interface Extension {
  extension: string
  totalCalls: number
  incomingCalls: number
  outgoingCalls: number
  totalDuration: number
  totalCost: number
  avgDuration: number
}

interface DashboardSummary {
  totalCalls: number
  incomingCalls: number
  outgoingCalls: number
  answeredCalls: number
  unansweredCalls: number
  redirectedCalls: number
  totalCost: number
  totalDuration: number
  uniqueAreaCodes: number
  answerRate: number
  incomingPercentage: number
  outgoingPercentage: number
  avgDuration: number
}

interface ApiResponse<T> {
  success?: boolean
  data?: T
  error?: string
  pagination?: {
    currentPage: number
    totalPages: number
    totalCount: number
    limit: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

// Configure axios defaults
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
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
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Data service
export const dataService = {
  // Get call logs with filtering and pagination
  async getCallLogs(params: {
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    search?: string
    dateFrom?: string
    dateTo?: string
    callType?: string
    status?: string
    terminationReason?: string
    areaCode?: string
    extension?: string
    trunkNumber?: string
    collection?: string
  }): Promise<ApiResponse<CallLog[]>> {
    try {
      const response = await apiClient.get('/cdr/call-logs', { params })
      return {
        data: response.data.callLogs,
        pagination: response.data.pagination
      }
    } catch (error: any) {
      console.error('Get call logs error:', error)
      throw error
    }
  },

  // Export call logs as CSV
  async exportCallLogs(params: {
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    search?: string
    dateFrom?: string
    dateTo?: string
    callType?: string
    status?: string
    terminationReason?: string
    areaCode?: string
    trunkNumber?: string
    collection?: string
  }): Promise<Blob> {
    try {
      const response = await apiClient.get('/cdr/call-logs', {
        params: { ...params, export: true },
        responseType: 'blob'
      })
      return response.data
    } catch (error: any) {
      console.error('Export call logs error:', error)
      throw error
    }
  },

  // Get area codes with statistics
  async getAreaCodes(params: {
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    search?: string
    dateFrom?: string
    dateTo?: string
    collection?: string
  }): Promise<ApiResponse<AreaCode[]>> {
    try {
      const response = await apiClient.get('/cdr/area-codes', { params })
      return {
        success: response.data.success,
        data: response.data.areaCodes,
        pagination: response.data.pagination,
        error: response.data.error
      }
    } catch (error: any) {
      console.error('Get area codes error:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch area codes'
      }
    }
  },

  // Get extensions with statistics
  async getExtensions(params: {
    page?: number
    limit?: number
    collection?: string
    search?: string
    sortBy?: string
    sortOrder?: string
  }): Promise<ApiResponse<{
    extensions: Extension[]
    pagination: {
      currentPage: number
      totalPages: number
      totalCount: number
      hasNextPage: boolean
      hasPrevPage: boolean
    }
  }>> {
    try {
      const response = await apiClient.get('/cdr/extensions', { params })
      return {
        success: true,
        data: {
          extensions: response.data.extensions,
          pagination: response.data.pagination
        }
      }
    } catch (error: any) {
      console.error('Get extensions error:', error)
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to fetch extensions'
      }
    }
  },

  // Get dashboard analytics
  async getDashboardAnalytics(params: {
    dateFrom?: string
    dateTo?: string
    callType?: string
    status?: string
    trunkNumber?: string
    areaCode?: string
    collection?: string
  }): Promise<{
    summary: DashboardSummary
    growth: any
    filters: any
  }> {
    try {
      const response = await apiClient.get('/analytics/dashboard', { params })
      return response.data
    } catch (error: any) {
      console.error('Get dashboard analytics error:', error)
      throw error
    }
  },

  // Get area code distribution for charts
  async getAreaCodeDistribution(params: {
    dateFrom?: string
    dateTo?: string
    callType?: string
    status?: string
    limit?: number
    collection?: string
  }): Promise<{
    distribution: any[]
    totalAreaCodes: number
  }> {
    try {
      const response = await apiClient.get('/analytics/area-code-distribution', { params })
      return response.data
    } catch (error: any) {
      console.error('Get area code distribution error:', error)
      throw error
    }
  },

  // Get extension distribution for charts
  async getExtensionDistribution(params: {
    dateFrom?: string
    dateTo?: string
    callType?: string
    status?: string
    limit?: number
    collection?: string
  }): Promise<{
    distribution: any[]
    totalExtensions: number
  }> {
    try {
      const response = await apiClient.get('/analytics/extension-distribution', { params })
      return response.data
    } catch (error: any) {
      console.error('Get extension distribution error:', error)
      throw error
    }
  },

  // Get call trends over time
  async getCallTrends(params: {
    dateFrom?: string
    dateTo?: string
    callType?: string
    status?: string
    interval?: 'hour' | 'day' | 'week' | 'month'
    collection?: string
  }): Promise<{
    trends: any[]
    interval: string
    totalPeriods: number
  }> {
    try {
      const response = await apiClient.get('/analytics/call-trends', { params })
      return response.data
    } catch (error: any) {
      console.error('Get call trends error:', error)
      throw error
    }
  },

  // Get specific call log by ID
  async getCallLog(id: string, collection?: string): Promise<CallLog> {
    try {
      const params = collection ? { collection } : {}
      const response = await apiClient.get(`/cdr/call-logs/${id}`, { params })
      return response.data.callLog
    } catch (error: any) {
      console.error('Get call log error:', error)
      throw error
    }
  }
}

// Export types
export type { CallLog, AreaCode, Extension, DashboardSummary, ApiResponse }