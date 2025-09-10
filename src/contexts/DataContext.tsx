import React, { createContext, useContext, useReducer, useCallback } from 'react'

// Types
interface DataFilters {
  dateFrom?: string
  dateTo?: string
  callType?: 'incoming' | 'outgoing' | 'internal'
  status?: 'answered' | 'unanswered' | 'redirected' | 'waiting'
  terminationReason?: string
  areaCode?: string
  trunkNumber?: string
  search?: string
}

interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalCount: number
  limit: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

interface DataState {
  // Filters
  filters: DataFilters
  
  // Loading states
  isLoading: boolean
  isRefreshing: boolean
  
  // Error state
  error: string | null
  
  // Data refresh timestamp
  lastRefresh: Date | null
  
  // Selected data source (collection)
  selectedDataSource: string
  
  // View preferences
  viewPreferences: {
    itemsPerPage: number
    sortBy: string
    sortOrder: 'asc' | 'desc'
    columns: string[]
  }
}

type DataAction =
  | { type: 'SET_FILTERS'; payload: Partial<DataFilters> }
  | { type: 'CLEAR_FILTERS' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_REFRESHING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_LAST_REFRESH'; payload: Date }
  | { type: 'SET_DATA_SOURCE'; payload: string }
  | { type: 'SET_VIEW_PREFERENCES'; payload: Partial<DataState['viewPreferences']> }
  | { type: 'RESET_STATE' }

interface DataContextType extends DataState {
  setFilters: (filters: Partial<DataFilters>) => void
  clearFilters: () => void
  setLoading: (loading: boolean) => void
  setRefreshing: (refreshing: boolean) => void
  setError: (error: string | null) => void
  refreshData: () => void
  setDataSource: (source: string) => void
  setViewPreferences: (preferences: Partial<DataState['viewPreferences']>) => void
  resetState: () => void
  
  // Computed values
  hasActiveFilters: boolean
  isDataStale: boolean
}

// Initial state
const initialState: DataState = {
  filters: {},
  isLoading: false,
  isRefreshing: false,
  error: null,
  lastRefresh: null,
  selectedDataSource: 'cdrs_143.198.0.104',
  viewPreferences: {
    itemsPerPage: 50,
    sortBy: 'startTime',
    sortOrder: 'desc',
    columns: ['historyId', 'startTime', 'duration', 'fromNumber', 'toNumber', 'terminationReason', 'cost']
  }
}

// Reducer
function dataReducer(state: DataState, action: DataAction): DataState {
  switch (action.type) {
    case 'SET_FILTERS':
      return {
        ...state,
        filters: { ...state.filters, ...action.payload }
      }
    
    case 'CLEAR_FILTERS':
      return {
        ...state,
        filters: {}
      }
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      }
    
    case 'SET_REFRESHING':
      return {
        ...state,
        isRefreshing: action.payload
      }
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload
      }
    
    case 'SET_LAST_REFRESH':
      return {
        ...state,
        lastRefresh: action.payload
      }
    
    case 'SET_DATA_SOURCE':
      return {
        ...state,
        selectedDataSource: action.payload
      }
    
    case 'SET_VIEW_PREFERENCES':
      return {
        ...state,
        viewPreferences: { ...state.viewPreferences, ...action.payload }
      }
    
    case 'RESET_STATE':
      return initialState
    
    default:
      return state
  }
}

// Context
const DataContext = createContext<DataContextType | undefined>(undefined)

// Provider component
export function DataProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(dataReducer, initialState)

  // Action creators
  const setFilters = useCallback((filters: Partial<DataFilters>) => {
    dispatch({ type: 'SET_FILTERS', payload: filters })
  }, [])

  const clearFilters = useCallback(() => {
    dispatch({ type: 'CLEAR_FILTERS' })
  }, [])

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading })
  }, [])

  const setRefreshing = useCallback((refreshing: boolean) => {
    dispatch({ type: 'SET_REFRESHING', payload: refreshing })
  }, [])

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error })
  }, [])

  const refreshData = useCallback(() => {
    dispatch({ type: 'SET_LAST_REFRESH', payload: new Date() })
  }, [])

  const setDataSource = useCallback((source: string) => {
    dispatch({ type: 'SET_DATA_SOURCE', payload: source })
  }, [])

  const setViewPreferences = useCallback((preferences: Partial<DataState['viewPreferences']>) => {
    dispatch({ type: 'SET_VIEW_PREFERENCES', payload: preferences })
  }, [])

  const resetState = useCallback(() => {
    dispatch({ type: 'RESET_STATE' })
  }, [])

  // Computed values
  const hasActiveFilters = Object.keys(state.filters).some(key => {
    const value = state.filters[key as keyof DataFilters]
    return value !== undefined && value !== null && value !== ''
  })

  const isDataStale = state.lastRefresh 
    ? (Date.now() - state.lastRefresh.getTime()) > 5 * 60 * 1000 // 5 minutes
    : true

  // Context value
  const contextValue: DataContextType = {
    ...state,
    setFilters,
    clearFilters,
    setLoading,
    setRefreshing,
    setError,
    refreshData,
    setDataSource,
    setViewPreferences,
    resetState,
    hasActiveFilters,
    isDataStale
  }

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  )
}

// Hook to use data context
export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}

// Export types
export type { DataFilters, PaginationInfo, DataState, DataContextType }