
import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUsers,
  faUserPlus,
  faSearch,
  faEdit,
  faTrash,
  faUserCheck,
  faUserTimes,
  faSortUp,
  faSortDown,
  faSort,
  faDatabase,
  faChevronDown,
  faCheck,
  faSpinner
} from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../contexts/AuthContext'
import { userService } from '../services/userService'
import type { User, UserStats, CreateUserData } from '../services/userService'

interface OutletContext {
  onMenuClick: () => void
}

interface CreateUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (userData: CreateUserData) => void
}

const databaseOptions = [
  { value: 'cdrs_143.198.0.104', label: 'Option 1 (143.198.0.104)' },
  { value: 'cdrs_167.71.120.52', label: 'Option 2 (167.71.120.52)' }
]

const roles = [
  { value: 'admin', label: 'Admin', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  { value: 'manager', label: 'Manager', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  { value: 'user', label: 'User', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  { value: 'viewer', label: 'Viewer', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' }
]

function CreateUserModal({ isOpen, onClose, onSubmit }: CreateUserModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    role: 'user' as const,
    databasePermissions: [] as string[]
  })
  const [showDatabaseDropdown, setShowDatabaseDropdown] = useState(false)

  // Auto-generate username when first name or last name changes
  useEffect(() => {
    if (formData.firstName && formData.lastName) {
      const username = `${formData.firstName.toLowerCase()}.${formData.lastName.toLowerCase()}`
      setFormData(prev => ({ ...prev, username }))
    }
  }, [formData.firstName, formData.lastName])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Generate random password if not provided
    const finalData = {
      ...formData,
      password: formData.password || Math.random().toString(36).slice(-8) + 'A1!'
    }
    
    onSubmit(finalData)
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      username: '',
      password: '',
      role: 'user',
      databasePermissions: []
    })
    onClose()
  }

  const toggleDatabasePermission = (value: string) => {
    setFormData(prev => ({
      ...prev,
      databasePermissions: prev.databasePermissions.includes(value)
        ? prev.databasePermissions.filter(p => p !== value)
        : [...prev.databasePermissions, value]
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Create New User
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username
              </label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="Auto-generated from name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password (Optional - will be auto-generated if empty)
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="Leave empty for auto-generation"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              >
                {roles.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Database Permissions
              </label>
              <div
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm cursor-pointer bg-white dark:bg-gray-700 flex items-center justify-between"
                onClick={() => setShowDatabaseDropdown(!showDatabaseDropdown)}
              >
                <span className="text-gray-700 dark:text-gray-300">
                  {formData.databasePermissions.length === 0
                    ? 'Select database permissions...'
                    : `${formData.databasePermissions.length} database(s) selected`}
                </span>
                <FontAwesomeIcon icon={faChevronDown} className="text-gray-400" />
              </div>
              
              {showDatabaseDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg">
                  {databaseOptions.map(option => (
                    <div
                      key={option.value}
                      className="px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center justify-between"
                      onClick={() => toggleDatabasePermission(option.value)}
                    >
                      <span className="text-gray-700 dark:text-gray-300">{option.label}</span>
                      {formData.databasePermissions.includes(option.value) && (
                        <FontAwesomeIcon icon={faCheck} className="text-green-500" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                Create User
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function UsersPage() {
  const { onMenuClick } = useOutletContext<OutletContext>()
  const { user: currentUser } = useAuth()
  
  const [users, setUsers] = useState<User[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  
  const itemsPerPage = 10

  // Fetch users data
  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        role: selectedRole || undefined,
        sortBy,
        sortOrder
      }
      
      const response = await userService.getUsers(params)
      setUsers(response.users)
      setTotalPages(response.pagination.totalPages)
      setTotalCount(response.pagination.totalCount)
    } catch (error: any) {
      console.error('Failed to fetch users:', error)
      setError(error.response?.data?.error || 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  // Fetch user statistics
  const fetchUserStats = async () => {
    try {
      const stats = await userService.getUserStats()
      setUserStats(stats)
    } catch (error: any) {
      console.error('Failed to fetch user stats:', error)
    }
  }

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchUsers()
  }, [currentPage, searchTerm, selectedRole, sortBy, sortOrder])

  // Load stats on component mount
  useEffect(() => {
    fetchUserStats()
  }, [])

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
    setCurrentPage(1) // Reset to first page when sorting
  }

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return faSort
    return sortOrder === 'asc' ? faSortUp : faSortDown
  }

  const getRoleColor = (role: string) => {
    const roleConfig = roles.find(r => r.value === role)
    return roleConfig?.color || 'bg-gray-100 text-gray-800'
  }

  // Reset page when search/filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedRole])

  const handleCreateUser = async (userData: CreateUserData) => {
    try {
      setCreateLoading(true)
      await userService.createUser(userData)
      await fetchUsers() // Refresh the users list
      await fetchUserStats() // Refresh stats
      setShowCreateModal(false)
    } catch (error: any) {
      console.error('Failed to create user:', error)
      alert(error.response?.data?.error || 'Failed to create user')
    } finally {
      setCreateLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    
    try {
      await userService.deleteUser(userId)
      await fetchUsers() // Refresh the users list
      await fetchUserStats() // Refresh stats
    } catch (error: any) {
      console.error('Failed to delete user:', error)
      alert(error.response?.data?.error || 'Failed to delete user')
    }
  }

  const handleActivateUser = async (userId: string) => {
    try {
      await userService.activateUser(userId)
      await fetchUsers() // Refresh the users list
      await fetchUserStats() // Refresh stats
    } catch (error: any) {
      console.error('Failed to activate user:', error)
      alert(error.response?.data?.error || 'Failed to activate user')
    }
  }

  if (loading && users.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon icon={faSpinner} spin className="text-4xl text-indigo-600 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading users...</p>
        </div>
      </div>
    )
  }

  if (error && users.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchUsers}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onMenuClick}
                className="lg:hidden p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                ☰
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                  <FontAwesomeIcon icon={faUsers} className="mr-3 text-indigo-600" />
                  Users Management
                </h1>
                <p className="text-gray-600 dark:text-gray-400">Manage user accounts, roles, and database permissions</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <FontAwesomeIcon icon={faUserPlus} className="mr-2" />
              Add User
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Statistics Cards */}
        {userStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <FontAwesomeIcon icon={faUsers} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{userStats.summary.totalUsers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <FontAwesomeIcon icon={faUserCheck} className="text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{userStats.summary.activeUsers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                  <FontAwesomeIcon icon={faUserTimes} className="text-red-600 dark:text-red-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Inactive Users</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{userStats.summary.inactiveUsers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <FontAwesomeIcon icon={faUserPlus} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Recent Additions</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{userStats.summary.recentUsers}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="relative">
                  <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Roles</option>
                  {roles.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {users.length} of {totalCount} users
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th 
                    onClick={() => handleSort('firstName')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Name</span>
                      <FontAwesomeIcon icon={getSortIcon('firstName')} className="text-gray-400" />
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('email')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Email</span>
                      <FontAwesomeIcon icon={getSortIcon('email')} className="text-gray-400" />
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('role')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Role</span>
                      <FontAwesomeIcon icon={getSortIcon('role')} className="text-gray-400" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Database Permissions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th 
                    onClick={() => handleSort('createdAt')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Created</span>
                      <FontAwesomeIcon icon={getSortIcon('createdAt')} className="text-gray-400" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((user: User) => (
                  <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {user.firstName?.[0] || user.fullName?.[0] || user.username?.[0] || 'U'}{user.lastName?.[0] || ''}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username}
                          </div>
                          {user.lastLogin && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              Last login: {new Date(user.lastLogin).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {user.databasePermissions?.map((db: string) => {
                          const option = databaseOptions.find(opt => opt.value === db)
                          return (
                            <span
                              key={db}
                              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                              title={option?.label}
                            >
                              <FontAwesomeIcon icon={faDatabase} className="mr-1" />
                              {option?.label.split(' ')[0] || db}
                            </span>
                          )
                        })}
                        {(!user.databasePermissions || user.databasePermissions.length === 0) && (
                          <span className="text-sm text-gray-500 dark:text-gray-400">No database access</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.isActive 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button 
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                          onClick={() => {/* TODO: Implement edit */}}
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        {user.isActive ? (
                          <button 
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                            onClick={() => handleDeleteUser(user._id)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        ) : (
                          <button 
                            className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                            onClick={() => handleActivateUser(user._id)}
                          >
                            <FontAwesomeIcon icon={faUserCheck} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateUser}
      />
    </div>
  )
}