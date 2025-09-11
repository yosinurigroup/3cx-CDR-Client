import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useData } from '../contexts/DataContext'
import { useTheme } from '../contexts/ThemeContext'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faMapMarkerAlt,
  faPhone,
  faUsers,
  faCog,
  faUserShield,
  faSun,
  faMoon,
  faSignOutAlt,
  faTachometerAlt,
  faChevronLeft,
  faChevronRight,
  faChartLine,
  faDatabase
} from '@fortawesome/free-solid-svg-icons'

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: faTachometerAlt },
  { name: 'Call Logs', href: '/reports/call-logs', icon: faPhone },
  { name: 'Area Codes', href: '/reports/area-codes', icon: faMapMarkerAlt },
  { name: 'Extensions', href: '/reports/extensions', icon: faUsers },
  { name: 'Users', href: '/system/users', icon: faUserShield },
  { name: 'Settings', href: '/system/settings', icon: faCog },
]

export default function Sidebar({ open, setOpen, isCollapsed, setCollapsed }: SidebarProps) {
  const location = useLocation()
  const { hasPermission, user, logout } = useAuth()
  const { selectedDataSource, setDataSource } = useData()
  const { theme, setTheme } = useTheme()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const dataSourceOptions = [
    { value: 'cdrs_143.198.0.104', label: 'Option 1 (143.198.0.104)' },
    { value: 'cdrs_167.71.120.52', label: 'Option 2 (167.71.120.52)' }
  ]

  const currentOption = dataSourceOptions.find(option => option.value === selectedDataSource)

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/')
  }

  const filteredNavigation = navigation.filter(item => {
    if (item.name === 'Users' && !hasPermission('manageUsers')) {
      return false
    }
    return true
  })

  return (
    <>
      {/* Mobile sidebar */}
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white dark:bg-gray-900 px-6 pb-2">
                  <div className={`flex h-16 shrink-0 items-center ${isCollapsed ? 'justify-center' : ''}`}>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">3CX Analytics</h1>
                  </div>
                  
                  {/* Data Source Dropdown - Mobile */}
                  <div className="relative">
                    <button
                      type="button"
                      className={`relative w-full cursor-pointer rounded-md bg-white dark:bg-gray-800 py-2 text-left text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm sm:leading-6 ${isCollapsed ? 'flex justify-center' : 'pl-3 pr-10'}`}
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                    >
                      <span className="block truncate">{currentOption?.label}</span>
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <ChevronDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                      </span>
                    </button>

                    {dropdownOpen && (
                      <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                        {dataSourceOptions.map((option) => (
                          <div
                            key={option.value}
                            className={`relative cursor-pointer select-none py-2 pl-3 pr-9 ${
                              option.value === selectedDataSource
                                ? 'bg-indigo-600 text-white'
                                : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                            onClick={() => {
                              setDataSource(option.value)
                              setDropdownOpen(false)
                            }}
                          >
                            <span className="block truncate">{option.label}</span>
                            {option.value === selectedDataSource && (
                              <span className="absolute inset-y-0 right-0 flex items-center pr-4">
                                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-7">
                      <li>
                        <ul role="list" className="-mx-2 space-y-1">
                          {filteredNavigation.map((item) => (
                            <li key={item.name}>
                              <Link
                                to={item.href}
                                className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold ${
                                  isActive(item.href)
                                    ? 'bg-gray-50 dark:bg-gray-800 text-indigo-600 dark:text-indigo-400'
                                    : 'text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                                onClick={() => setOpen(false)}
                              >
                                <FontAwesomeIcon icon={item.icon} className={`h-6 w-6 flex-shrink-0 ${isCollapsed ? 'mx-auto' : ''}`} />
                                <span className={`${isCollapsed ? 'hidden' : 'block'}`}>{item.name}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </li>
                    </ul>
                  </nav>
                  
                  {/* Bottom section with theme toggle and user info - Desktop */}
                  <div className={`border-t border-gray-200 dark:border-gray-700 pt-4 ${isCollapsed ? 'hidden' : 'block'}`}>
                    {/* Theme toggle */}
                    <button
                      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                      className="flex items-center gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800 w-full"
                    >
                      <FontAwesomeIcon icon={theme === 'dark' ? faSun : faMoon} className="w-5 h-5" />
                      {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    </button>
                    
                    {/* User info */}
                    <div className="mt-2 p-2 rounded-md bg-gray-50 dark:bg-gray-800">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {user?.fullName || user?.email}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Super Admin
                      </div>
                      <button
                        onClick={logout}
                        className="mt-2 flex items-center gap-x-2 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        <FontAwesomeIcon icon={faSignOutAlt} className="w-3 h-3" />
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Static sidebar for desktop */}
      <div className={`hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col transition-all duration-300 ease-in-out ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}`}>
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6">
          <div className={`flex h-16 shrink-0 items-center ${isCollapsed ? 'justify-center' : ''}`}>
            {isCollapsed ? (
              <FontAwesomeIcon icon={faChartLine} className="h-8 w-8 text-indigo-600" />
            ) : (
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">3CX Analytics</h1>
            )}
          </div>
          
          {/* Data Source Dropdown - Desktop */}
          <div className="relative">
            <button
              type="button"
              className={`relative w-full cursor-pointer rounded-md bg-white dark:bg-gray-800 py-2 text-left text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm sm:leading-6 ${isCollapsed ? 'flex justify-center' : 'pl-3 pr-10'}`}
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              {isCollapsed ? (
                <FontAwesomeIcon icon={faDatabase} className="h-5 w-5 text-gray-400" />
              ) : (
                <>
                  <span className="block truncate">{currentOption?.label}</span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </span>
                </>
              )}
            </button>

            {dropdownOpen && (
              <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                {dataSourceOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`relative cursor-pointer select-none py-2 pl-3 pr-9 ${
                      option.value === selectedDataSource
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => {
                      setDataSource(option.value)
                      setDropdownOpen(false)
                    }}
                  >
                    <span className="block truncate">{option.label}</span>
                    {option.value === selectedDataSource && (
                      <span className="absolute inset-y-0 right-0 flex items-center pr-4">
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {filteredNavigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold ${
                          isActive(item.href)
                            ? 'bg-gray-50 dark:bg-gray-800 text-indigo-600 dark:text-indigo-400'
                            : 'text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <FontAwesomeIcon icon={item.icon} className={`h-6 w-6 ${isCollapsed ? 'mx-auto' : ''}`} />
                        <span className={`${isCollapsed ? 'hidden' : 'block'}`}>{item.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>
          
          {/* Bottom section with theme toggle and user info - Desktop */}
          <div className={`border-t border-gray-200 dark:border-gray-700 pt-4 ${isCollapsed ? 'hidden' : 'block'}`}>
            {/* User info */}
            <div className="mt-2 p-2 rounded-md bg-gray-50 dark:bg-gray-800">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {user?.fullName || user?.email}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Super Admin
              </div>
              <button
                onClick={logout}
                className="mt-2 flex items-center gap-x-2 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <FontAwesomeIcon icon={faSignOutAlt} className="w-3 h-3" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}