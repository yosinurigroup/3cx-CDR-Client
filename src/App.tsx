import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { DataProvider } from './contexts/DataContext'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import AreaCodesPage from './pages/AreaCodesPage'
import CallLogsPage from './pages/CallLogsPage'
import ExtensionsPage from './pages/ExtensionsPage'
import UsersPage from './pages/UsersPage'
import SettingsPage from './pages/SettingsPage'
import NotFoundPage from './pages/NotFoundPage'
import ProtectedRoute from './components/ProtectedRoute'
import { Toaster } from './components/ui/toaster'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <div className="min-h-screen bg-background">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              
              {/* Protected routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                {/* Dashboard - default route */}
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                
                {/* Reports */}
                <Route path="reports">
                  <Route path="area-codes" element={<AreaCodesPage />} />
                  <Route path="call-logs" element={<CallLogsPage />} />
                  <Route path="extensions" element={<ExtensionsPage />} />
                </Route>
                
                {/* System */}
                <Route path="system">
                  <Route 
                    path="users" 
                    element={
                      <ProtectedRoute requiredPermission="manageUsers">
                        <UsersPage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>
              </Route>
              
              {/* 404 page */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
            
            {/* Global toast notifications */}
            <Toaster />
          </div>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App