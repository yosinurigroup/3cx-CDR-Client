import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react'
import { getDataSourceOptions } from '../services/settingsService'
import { useAuth } from './AuthContext'

// Types
interface DataFilters {
  dateFrom?: string
  dateTo?: string
  callType?: 'incoming' | 'outgoing' | 'internal'
  status?: 'answered' | 'unanswered' | 'redirected' | 'waiting'
  terminationReason?: string
  areaCode?: string
  trunkNumber?: string
  extension?: string
  stateCode?: string
  minDurationSec?: number
  maxDurationSec?: number
  minCost?: number
  maxCost?: number
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

// Helpers to initialize and persist the data source
const DS_STORAGE_KEY = 'selectedDataSource'

function getInitialDataSource(): string {
  // Defer choosing a data source until we know the user's permissions.
  // DataProvider will set the first allowed option and persist it.
  return ''
}

function persistDataSource(value: string) {
  try {
    localStorage.setItem(DS_STORAGE_KEY, value)
  } catch {
    // ignore
  }
}

// Initial state (lazy default for selectedDataSource)
const initialState: DataState = {
  filters: {},
  isLoading: false,
  isRefreshing: false,
  error: null,
  lastRefresh: null,
  selectedDataSource: getInitialDataSource(),
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
      // Persist immediately so first render of other pages uses correct source
      persistDataSource(action.payload)
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

  // Enforce allowed data source based on authenticated user's permissions
  const { user } = useAuth()
  useEffect(() => {
    if (!user) return
    const perms = user.databasePermissions || []
    if (perms.length === 0) return

    // Only keep configured sources that are permitted
    const configured = getDataSourceOptions().map(o => o.value)
    const allowed = perms.filter(v => configured.includes(v as any))
    if (allowed.length === 0) return

    // Prefer stored selection if still allowed; otherwise pick first allowed
    const stored = localStorage.getItem(DS_STORAGE_KEY) || ''
    const next = (stored && allowed.includes(stored as any)) ? stored : (allowed[0] as string)

    if (state.selectedDataSource !== next) {
      dispatch({ type: 'SET_DATA_SOURCE', payload: next })
    }
  }, [user, state.selectedDataSource])

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