import { useState, useEffect, useCallback, useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUsers,
  faUserPlus,
  
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
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import DynamicHeader from '../components/DynamicHeader'
import { userService } from '../services/userService'
import type { User, UserStats, CreateUserData, UpdateUserData } from '../services/userService'
import { getDataSourceOptions, getDataSourceNames } from '../services/settingsService'

interface OutletContext {
  onMenuClick: () => void
  isSidebarCollapsed: boolean
  onToggleSidebar: () => void
}

interface CreateUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (userData: CreateUserData) => void
  loading?: boolean
}

const roles = [
  { value: 'admin', label: 'Admin', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  { value: 'manager', label: 'Manager', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  { value: 'user', label: 'User', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  { value: 'viewer', label: 'Viewer', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' }
]

function CreateUserModal({ isOpen, onClose, onSubmit, loading = false }: CreateUserModalProps) {
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

  const databaseOptions = getDataSourceOptions()
  const createInitials =
    ((formData.firstName?.[0] || formData.username?.[0] || formData.email?.[0] || 'U') +
      (formData.lastName?.[0] || '')).toUpperCase()

  // Enhanced multi-select dropdown (Create)
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const [filterText, setFilterText] = useState('')
  const filteredOptions = databaseOptions.filter(opt =>
    opt.label.toLowerCase().includes(filterText.toLowerCase())
  )
  const selectAll = () => {
    setFormData(prev => ({ ...prev, databasePermissions: databaseOptions.map(o => o.value as any) }))
  }
  const clearAll = () => {
    setFormData(prev => ({ ...prev, databasePermissions: [] }))
  }
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (showDatabaseDropdown && dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDatabaseDropdown(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [showDatabaseDropdown])


  // Auto-generate username when first name or last name changes
  useEffect(() => {
    if (formData.firstName && formData.lastName) {
      const username = `${formData.firstName.toLowerCase()}.${formData.lastName.toLowerCase()}`
      setFormData(prev => ({ ...prev, username }))
    }
  }, [formData.firstName, formData.lastName])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
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


  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-gradient-to-br from-gray-900/60 via-gray-800/40 to-gray-900/60 backdrop-blur-sm"
          onClick={onClose}
        ></div>
        <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-2xl shadow-2xl ring-1 ring-black/5 dark:ring-white/10 max-w-2xl w-full p-6">
          <button
            onClick={onClose}
            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            aria-label="Close"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          <div className="mb-4 flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-lg font-semibold shadow-lg">
                {createInitials}
              </div>
              <div className="absolute inset-0 rounded-xl ring-2 ring-indigo-400/40 animate-pulse"></div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Create User</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Add a new user and assign permissions</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name</label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password (Optional)</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="Leave empty for auto-generation"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              >
                {roles.map(role => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Database Permissions</label>
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
                <div
                  ref={dropdownRef}
                  className="absolute z-20 mt-2 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl shadow-2xl overflow-hidden"
                >
                  <div className="p-2 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 flex items-center gap-2">
                    <input
                      type="text"
                      value={filterText}
                      onChange={(e) => setFilterText(e.target.value)}
                      placeholder="Search databases..."
                      className="flex-1 px-3 py-2 text-sm rounded-md bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={selectAll}
                      className="text-xs px-2 py-1 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                      Select all
                    </button>
                    <button
                      type="button"
                      onClick={clearAll}
                      className="text-xs px-2 py-1 rounded-md bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="max-h-56 overflow-auto">
                    {filteredOptions.map((option: { value: string; label: string }) => {
                      const checked = formData.databasePermissions.includes(option.value as any)
                      return (
                        <label
                          key={option.value}
                          className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                              checked={checked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData(prev => ({
                                    ...prev,
                                    databasePermissions: [...(prev.databasePermissions || []), option.value as any]
                                  }))
                                } else {
                                  setFormData(prev => ({
                                    ...prev,
                                    databasePermissions: (prev.databasePermissions || []).filter(v => v !== option.value)
                                  }))
                                }
                              }}
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-200">{option.label}</span>
                          </div>
                          {checked && <FontAwesomeIcon icon={faCheck} className="text-green-500" />}
                        </label>
                      )
                    })}
                    {filteredOptions.length === 0 && (
                      <div className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">No matches</div>
                    )}
                  </div>
                  <div className="p-2 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowDatabaseDropdown(false)}
                      className="px-3 py-1.5 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                      Done
                    </button>
                  </div>
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
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white rounded-md bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
interface EditUserModalProps {
  isOpen: boolean
  user: User | null
  onClose: () => void
  onSubmit: (id: string, data: UpdateUserData) => void
  loading?: boolean
}

function EditUserModal({ isOpen, user, onClose, onSubmit, loading = false }: EditUserModalProps) {
  const [formData, setFormData] = useState<UpdateUserData>({})
  const [showDatabaseDropdown, setShowDatabaseDropdown] = useState(false)
  const databaseOptions = getDataSourceOptions()
  const initials =
    ((user?.firstName?.[0] || user?.username?.[0] || 'U') + (user?.lastName?.[0] || '')).toUpperCase()

  // Enhanced multi-select dropdown (Edit)
  const editDropdownRef = useRef<HTMLDivElement | null>(null)
  const [editFilterText, setEditFilterText] = useState('')
  const editFilteredOptions = databaseOptions.filter(opt =>
    opt.label.toLowerCase().includes(editFilterText.toLowerCase())
  )
  const editSelectAll = () => {
    setFormData(prev => ({ ...prev, databasePermissions: databaseOptions.map(o => o.value as any) }))
  }
  const editClearAll = () => {
    setFormData(prev => ({ ...prev, databasePermissions: [] }))
  }
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (showDatabaseDropdown && editDropdownRef.current && !editDropdownRef.current.contains(e.target as Node)) {
        setShowDatabaseDropdown(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [showDatabaseDropdown])

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        databasePermissions: user.databasePermissions || []
      })
    }
  }, [user, isOpen])

  if (!isOpen || !user) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(user._id, formData)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-gradient-to-br from-gray-900/60 via-gray-800/40 to-gray-900/60 backdrop-blur-sm"
          onClick={onClose}
        ></div>
        <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-2xl shadow-2xl ring-1 ring-black/5 dark:ring-white/10 max-w-2xl w-full p-6">
          <button
            onClick={onClose}
            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            aria-label="Close"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          <div className="mb-4 flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-lg font-semibold shadow-lg">
                {initials}
              </div>
              <div className="absolute inset-0 rounded-xl ring-2 ring-indigo-400/40 animate-pulse"></div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Edit User</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Update account details and permissions</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={formData.firstName || ''}
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
                  value={formData.lastName || ''}
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
                value={formData.email || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role
                </label>
                <select
                  value={formData.role || 'user'}
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

              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={!!formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  Active
                </label>
              </div>
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
                  {(formData.databasePermissions?.length || 0) === 0
                    ? 'Select database permissions...'
                    : `${formData.databasePermissions?.length} database(s) selected`}
                </span>
                <FontAwesomeIcon icon={faChevronDown} className="text-gray-400" />
              </div>

              {showDatabaseDropdown && (
                <div
                  ref={editDropdownRef}
                  className="absolute z-20 mt-2 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl shadow-2xl overflow-hidden"
                >
                  <div className="p-2 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 flex items-center gap-2">
                    <input
                      type="text"
                      value={editFilterText}
                      onChange={(e) => setEditFilterText(e.target.value)}
                      placeholder="Search databases..."
                      className="flex-1 px-3 py-2 text-sm rounded-md bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={editSelectAll}
                      className="text-xs px-2 py-1 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                      Select all
                    </button>
                    <button
                      type="button"
                      onClick={editClearAll}
                      className="text-xs px-2 py-1 rounded-md bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="max-h-56 overflow-auto">
                    {editFilteredOptions.map((option: { value: string; label: string }) => {
                      const checked = (formData.databasePermissions || []).includes(option.value as any)
                      return (
                        <label
                          key={option.value}
                          className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                              checked={checked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData(prev => ({
                                    ...prev,
                                    databasePermissions: [...(prev.databasePermissions || []), option.value as any]
                                  }))
                                } else {
                                  setFormData(prev => ({
                                    ...prev,
                                    databasePermissions: (prev.databasePermissions || []).filter(v => v !== option.value)
                                  }))
                                }
                              }}
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-200">{option.label}</span>
                          </div>
                          {checked && <FontAwesomeIcon icon={faCheck} className="text-green-500" />}
                        </label>
                      )
                    })}
                    {editFilteredOptions.length === 0 && (
                      <div className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">No matches</div>
                    )}
                  </div>
                  <div className="p-2 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowDatabaseDropdown(false)}
                      className="px-3 py-1.5 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                      Done
                    </button>
                  </div>
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
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white rounded-md bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function UsersPage() {
  const { onMenuClick, isSidebarCollapsed, onToggleSidebar } = useOutletContext<OutletContext>()

  const [users, setUsers] = useState<User[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cleanup any pending debounced search timer on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  const [selectedRole, setSelectedRole] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const [showCreateModal, setShowCreateModal] = useState(false)
  
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [updateLoading, setUpdateLoading] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)

  const namesMap = getDataSourceNames()
  const databaseOptions = getDataSourceOptions()

  // Fetch users
  const fetchUsers = useCallback(async (signal?: AbortSignal) => {
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

      const response = await userService.getUsers(params, signal)
      setUsers(response.users)
      setTotalPages(response.pagination.totalPages)
      setTotalCount(response.pagination.totalCount)
    } catch (error: any) {
      // Ignore canceled requests
      if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
        return
      }
      console.error('Failed to fetch users:', error)
      setError(error.response?.data?.error || 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }, [currentPage, itemsPerPage, searchTerm, selectedRole, sortBy, sortOrder])

  // Fetch stats
  const fetchUserStats = useCallback(async () => {
    try {
      const stats = await userService.getUserStats()
      setUserStats(stats)
    } catch (error: any) {
      console.error('Failed to fetch user stats:', error)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    fetchUsers(controller.signal)
    return () => controller.abort()
  }, [currentPage, itemsPerPage, searchTerm, selectedRole, sortBy, sortOrder, fetchUsers])

  useEffect(() => {
    fetchUserStats()
  }, [fetchUserStats])

  // Debounced search
  const handleSearch = useCallback((value: string) => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => {
      setCurrentPage(1)
      setSearchTerm(value)
    }, 250)
  }, [])

  const handleSort = (field: string) => {
    setCurrentPage(1)
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return faSort
    return sortOrder === 'asc' ? faSortUp : faSortDown
  }

  const getRoleColor = (role: string) => {
    const roleConfig = roles.find(r => r.value === role)
    return roleConfig?.color || 'bg-gray-100 text-gray-800'
  }

  const handleCreateUser = async (userData: CreateUserData) => {
    try {
      setCreateLoading(true)
      await userService.createUser(userData)
      await fetchUsers()
      await fetchUserStats()
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
      await fetchUsers()
      await fetchUserStats()
    } catch (error: any) {
      console.error('Failed to delete user:', error)
      alert(error.response?.data?.error || 'Failed to delete user')
    }
  }

  const handleActivateUser = async (userId: string) => {
    try {
      await userService.activateUser(userId)
      await fetchUsers()
      await fetchUserStats()
    } catch (error: any) {
      console.error('Failed to activate user:', error)
      alert(error.response?.data?.error || 'Failed to activate user')
    }
  }

  // Edit helpers
  const openEdit = (user: User) => {
    setEditingUser(user)
    setShowEditModal(true)
  }

  const submitEdit = async (id: string, data: UpdateUserData) => {
    try {
      setUpdateLoading(true)
      await userService.updateUser(id, data)
      await fetchUsers()
      await fetchUserStats()
      setShowEditModal(false)
      setEditingUser(null)
    } catch (error: any) {
      console.error('Failed to update user:', error)
      alert(error?.response?.data?.error || 'Failed to update user')
    } finally {
      setUpdateLoading(false)
    }
  }

  // Pagination component (matching Call Logs style)
  const PaginationComponent = () => (
    <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center text-xs text-gray-600 dark:text-gray-400 space-x-3">
        <span>
          Showing {((currentPage - 1) * itemsPerPage) + Math.min(1, totalCount)} to{' '}
          {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount.toLocaleString()} entries
        </span>
        <label className="flex items-center space-x-1">
          <span className="text-gray-600 dark:text-gray-400">Rows per page</span>
          <select
            className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs rounded px-2 py-1"
            value={itemsPerPage}
            onChange={(e) => {
              const size = parseInt(e.target.value, 10) || 10
              setItemsPerPage(size)
              setCurrentPage(1)
            }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </label>
      </div>

      <div className="flex items-center space-x-1">
        <button
          onClick={() => setCurrentPage(1)}
          disabled={currentPage === 1}
          className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          title="First page"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
          className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Previous page"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>

        <div className="flex items-center space-x-1 text-xs">
          <span className="text-gray-600 dark:text-gray-400">Page</span>
          <span className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium">{currentPage}</span>
          <span className="text-gray-600 dark:text-gray-400">of {totalPages.toLocaleString()}</span>
        </div>

        <button
          onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Next page"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>

        <button
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage === totalPages}
          className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Last page"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )

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
            onClick={() => fetchUsers()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header moved to DynamicHeader with search + filter */}
      <DynamicHeader
        title="Users"
        onMenuClick={onMenuClick}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={onToggleSidebar}
        showSearch={true}
        searchValue={searchTerm}
        onSearchChange={handleSearch}
        searchPlaceholder="Search users..."
        actions={
          <>
            <select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value)
                setCurrentPage(1)
              }}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
              title="Filter by role"
            >
              <option value="">All Roles</option>
              {roles.map(role => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>

            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-3 py-2 border border-indigo-600 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md text-sm font-medium"
              title="Add User"
            >
              <FontAwesomeIcon icon={faUserPlus} className="mr-2" /> Add User
            </button>
          </>
        }
      />

      {/* Icon-only stats row (with numeric badges) */}
      {userStats && (
        <div className="px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="relative w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <FontAwesomeIcon icon={faUsers} className="text-blue-600 dark:text-blue-400" />
              <span className="absolute -top-2 -right-2 text-[11px] px-1.5 py-0.5 rounded-full bg-blue-600 text-white">
                {userStats.summary.totalUsers}
              </span>
            </div>

            <div className="relative w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <FontAwesomeIcon icon={faUserCheck} className="text-green-600 dark:text-green-400" />
              <span className="absolute -top-2 -right-2 text-[11px] px-1.5 py-0.5 rounded-full bg-green-600 text-white">
                {userStats.summary.activeUsers}
              </span>
            </div>

            <div className="relative w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <FontAwesomeIcon icon={faUserTimes} className="text-red-600 dark:text-red-400" />
              <span className="absolute -top-2 -right-2 text-[11px] px-1.5 py-0.5 rounded-full bg-red-600 text-white">
                {userStats.summary.inactiveUsers}
              </span>
            </div>

            <div className="relative w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <FontAwesomeIcon icon={faUserPlus} className="text-purple-600 dark:text-purple-400" />
              <span className="absolute -top-2 -right-2 text-[11px] px-1.5 py-0.5 rounded-full bg-purple-600 text-white">
                {userStats.summary.recentUsers}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Table (same layout ethos as Call Logs) */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="h-full flex flex-col min-h-0">
          <div className="flex-1 overflow-hidden bg-white dark:bg-gray-800 shadow-sm rounded-lg">
            <div className="overflow-auto" style={{ height: 'calc(100vh - 180px)' }}>
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0 z-10">
                  <tr>
                    <th
                      onClick={() => handleSort('firstName')}
                      className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <div className="flex items-center space-x-1">
                        <span>Name</span>
                        <FontAwesomeIcon icon={getSortIcon('firstName')} className="text-gray-400" />
                      </div>
                    </th>

                    <th
                      onClick={() => handleSort('email')}
                      className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <div className="flex items-center space-x-1">
                        <span>Email</span>
                        <FontAwesomeIcon icon={getSortIcon('email')} className="text-gray-400" />
                      </div>
                    </th>

                    <th
                      onClick={() => handleSort('role')}
                      className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <div className="flex items-center space-x-1">
                        <span>Role</span>
                        <FontAwesomeIcon icon={getSortIcon('role')} className="text-gray-400" />
                      </div>
                    </th>

                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Database Permissions
                    </th>

                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>

                    <th
                      onClick={() => handleSort('createdAt')}
                      className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <div className="flex items-center space-x-1">
                        <span>Created</span>
                        <FontAwesomeIcon icon={getSortIcon('createdAt')} className="text-gray-400" />
                      </div>
                    </th>

                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>

                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((user: User) => (
                    <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-9 w-9 rounded-full bg-indigo-600 flex items-center justify-center">
                            <span className="text-white text-xs font-medium">
                              {(user.firstName?.[0] || user.fullName?.[0] || user.username?.[0] || 'U')}{user.lastName?.[0] || ''}
                            </span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username}
                            </div>
                            {user.lastLogin && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Last login: {new Date(user.lastLogin).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">{user.email}</td>

                      <td className="px-4 py-2 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      </td>

                      <td className="px-4 py-2">
                        <div className="flex flex-wrap gap-1">
                          {user.databasePermissions?.map((db: string) => {
                            const option = databaseOptions.find(opt => opt.value === db)
                            const display = (namesMap as any)[db] || option?.label || db
                            return (
                              <span
                                key={db}
                                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                title={option?.label || display}
                              >
                                <FontAwesomeIcon icon={faDatabase} className="mr-1" />
                                {display}
                              </span>
                            )
                          })}
                          {(!user.databasePermissions || user.databasePermissions.length === 0) && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">No database access</span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-2 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>

                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                            onClick={() => openEdit(user)}
                            title="Edit user"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </button>

                          {user.isActive ? (
                            <button
                              className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                              onClick={() => handleDeleteUser(user._id)}
                              title="Delete user"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          ) : (
                            <button
                              className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                              onClick={() => handleActivateUser(user._id)}
                              title="Activate user"
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
          </div>
        </div>
      </div>

      {/* Fixed bottom pagination (same pattern as Call Logs) */}
      <div className="fixed left-0 right-0 bottom-0 z-30 pointer-events-none">
        <div className={`pointer-events-auto ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
          <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <PaginationComponent />
          </div>
        </div>
      </div>

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={showEditModal}
        user={editingUser}
        onClose={() => setShowEditModal(false)}
        onSubmit={submitEdit}
        loading={updateLoading}
      />

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateUser}
        loading={createLoading}
      />
    </div>
  )
}