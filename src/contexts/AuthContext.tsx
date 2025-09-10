import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { authService } from '../services/authService'

// Types
interface User {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  role: 'admin' | 'manager' | 'user' | 'viewer'
  department?: string
  extension?: string
  avatar?: string
  databasePermissions?: string[]
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

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: Partial<User> }
  | { type: 'CLEAR_ERROR' }

interface AuthContextType extends AuthState {
  login: (credentials: { login: string; password: string }) => Promise<void>
  googleLogin: (token: string) => Promise<void>
  logout: () => void
  updateUser: (userData: Partial<User>) => void
  clearError: () => void
  hasPermission: (permission: keyof User['permissions']) => boolean
  hasRole: (roles: string | string[]) => boolean
}

// Initial state
const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  // Start in loading state to avoid redirect flicker until we verify the token
  isLoading: true,
  isAuthenticated: false,
  error: null
}

// Reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null
      }
    
    case 'AUTH_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        error: null
      }
    
    case 'AUTH_FAILURE':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        error: action.payload
      }
    
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        error: null
      }
    
    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null
      }
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      }
    
    default:
      return state
  }
}

// Context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          dispatch({ type: 'AUTH_START' })
          const user = await authService.getCurrentUser()
          dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } })
        } catch (error) {
          console.error('Failed to initialize auth:', error)
          localStorage.removeItem('token')
          dispatch({ type: 'AUTH_FAILURE', payload: 'Session expired' })
        }
      } else {
        // Explicitly end loading if no token is present
        dispatch({ type: 'AUTH_FAILURE', payload: 'Not authenticated' })
      }
    }

    initializeAuth()
  }, [])

  // Login function
  const login = async (credentials: { login: string; password: string }) => {
    try {
      dispatch({ type: 'AUTH_START' })
      const response = await authService.login(credentials)
      
      // Store token in localStorage
      localStorage.setItem('token', response.token)
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: response.user,
          token: response.token
        }
      })
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Login failed'
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage })
      throw error
    }
  }

  // Google login function
  const googleLogin = async (token: string) => {
    try {
      dispatch({ type: 'AUTH_START' })
      const response = await authService.googleLogin(token)
      
      // Store token in localStorage
      localStorage.setItem('token', response.token)
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: response.user,
          token: response.token
        }
      })
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Google login failed'
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage })
      throw error
    }
  }

  // Logout function
  const logout = () => {
    localStorage.removeItem('token')
    authService.logout()
    dispatch({ type: 'LOGOUT' })
  }

  // Update user function
  const updateUser = (userData: Partial<User>) => {
    dispatch({ type: 'UPDATE_USER', payload: userData })
  }

  // Clear error function
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' })
  }

  // Permission check function
  const hasPermission = (permission: keyof User['permissions']): boolean => {
    return state.user?.permissions[permission] || false
  }

  // Role check function
  const hasRole = (roles: string | string[]): boolean => {
    if (!state.user) return false
    
    const roleArray = Array.isArray(roles) ? roles : [roles]
    return roleArray.includes(state.user.role)
  }

  // Context value
  const contextValue: AuthContextType = {
    ...state,
    login,
    googleLogin,
    logout,
    updateUser,
    clearError,
    hasPermission,
    hasRole
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// HOC for components that require authentication
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth()

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="loading-spinner w-8 h-8"></div>
        </div>
      )
    }

    if (!isAuthenticated) {
      return <Navigate to="/login" replace />
    }

    return <Component {...props} />
  }
}

// Export types for use in other components
export type { User, AuthState, AuthContextType }