
import { useState, useEffect, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useData } from '../contexts/DataContext'
import { dataService } from '../services/dataService'
import type { AreaCode, ApiResponse } from '../services/dataService'
import DynamicHeader from '../components/DynamicHeader'
import { 
  FunnelIcon,
  ArrowDownTrayIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'

interface LayoutContext {
  onMenuClick: () => void
}

export default function AreaCodesPage() {
  const { onMenuClick } = useOutletContext<LayoutContext>()
  const { selectedDataSource, filters, setError } = useData()
  const [areaCodes, setAreaCodes] = useState<AreaCode[]>([])
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 25,
    hasNextPage: false,
    hasPrevPage: false
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('totalCalls')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showFilters, setShowFilters] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [showColumnSelector, setShowColumnSelector] = useState(false)

  // Column management similar to CallLogsPage
  const availableColumns = [
    { key: 'areaCode', label: 'Area Code', required: true },
    { key: 'state', label: 'State', required: false },
    { key: 'totalCalls', label: 'Total Calls', required: true }
  ]
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'areaCode', 'state', 'totalCalls'
  ])

  // Fetch area codes data
  const fetchAreaCodes = useCallback(async (page: number = 1, reset: boolean = false) => {
    if (!selectedDataSource) return

    if (reset) {
      setIsInitialLoading(true)
    } else {
      setIsLoading(true)
    }

    try {
      const params = {
        collection: selectedDataSource,
        page,
        limit: pagination.limit,
        search: searchTerm.trim(),
        sortBy,
        sortOrder,
        // Apply filters if any
        ...filters
      }

      const response: ApiResponse<AreaCode[]> = await dataService.getAreaCodes(params)
      
      if (response.success && response.data) {
        setAreaCodes(response.data)
        setPagination(prev => ({
          ...prev,
          currentPage: response.pagination?.currentPage || page,
          totalPages: response.pagination?.totalPages || 1,
          totalCount: response.pagination?.totalCount || 0,
          hasNextPage: response.pagination?.hasNextPage || false,
          hasPrevPage: response.pagination?.hasPrevPage || false
        }))
      } else {
        setError('Failed to load area code data')
      }
    } catch (err) {
      console.error('Error fetching area codes:', err)
      setError('An unexpected error occurred while loading area code data')
    } finally {
      setIsLoading(false)
      setIsInitialLoading(false)
    }
  }, [selectedDataSource, searchTerm, sortBy, sortOrder, filters, pagination.limit, setError])

  // Search handler with debounce
  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value)
  }, [])

  // Sort handler
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  // Pagination handlers
  const handlePageChange = (page: number) => {
    fetchAreaCodes(page)
  }

  // Export handler
  const handleExport = async () => {
    try {
      // Create CSV content
      const headers = ['Area Code', 'State', 'Total Calls']
      const csvContent = [
        headers.join(','),
        ...areaCodes.map(item => [
          item.areaCode || 'Unknown',
          item.state || 'Unknown',
          item.totalCalls
        ].join(','))
      ].join('\n')

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `area-codes-${format(new Date(), 'yyyy-MM-dd')}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export error:', error)
      setError('Failed to export area codes data')
    }
  }

  // Format number helper
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num)
  }

  // Effect to fetch data when dependencies change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchAreaCodes(1, true)
    }, 300) // Debounce search

    return () => clearTimeout(timeoutId)
  }, [fetchAreaCodes])

  // Effect to refetch when data source changes
  useEffect(() => {
    if (selectedDataSource) {
      fetchAreaCodes(1, true)
    }
  }, [selectedDataSource])

  return (
    <div className="h-full flex flex-col">
      <DynamicHeader
        title="Area Codes"
        subtitle="Area code analysis and call statistics"
        onMenuClick={onMenuClick}
        showSearch={true}
        searchValue={searchTerm}
        onSearchChange={handleSearch}
        searchPlaceholder="Search area codes..."
        actions={
          <>
            <div className="relative">
              <button
                onClick={() => setShowColumnSelector(!showColumnSelector)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <EyeIcon className="h-4 w-4 mr-2" />
                Columns
              </button>

              {showColumnSelector && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                  <div className="p-4">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Select Columns to View</h3>
                    <div className="space-y-2">
                      {availableColumns.map((column) => (
                        <label key={column.key} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={visibleColumns.includes(column.key)}
                            disabled={column.required}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setVisibleColumns([...visibleColumns, column.key])
                              } else {
                                setVisibleColumns(visibleColumns.filter(col => col !== column.key))
                              }
                            }}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            {column.label}
                            {column.required && <span className="text-red-500 ml-1">*</span>}
                          </span>
                        </label>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400">* Required columns cannot be hidden</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={handleExport}
              disabled={areaCodes.length === 0}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Export
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center px-3 py-2 border shadow-sm text-sm leading-4 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                showFilters
                  ? 'border-indigo-500 text-indigo-700 bg-indigo-50 dark:bg-indigo-900 dark:text-indigo-200 dark:border-indigo-400'
                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              Filters
            </button>
          </>
        }
      />

      <div className="flex-1 overflow-hidden">
        {isInitialLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-hidden bg-white dark:bg-gray-800 shadow-sm rounded-lg">
              <div className="overflow-auto" style={{ height: 'calc(100vh - 160px)' }}>
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0 z-10">
                    <tr>
                      {visibleColumns.includes('areaCode') && (
                        <th 
                          className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={() => handleSort('areaCode')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Area Code</span>
                            {sortBy === 'areaCode' && (
                              <span className="text-blue-500">
                                {sortOrder === 'asc' ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />}
                              </span>
                            )}
                          </div>
                        </th>
                      )}
                      {visibleColumns.includes('state') && (
                        <th 
                          className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={() => handleSort('state')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>State</span>
                            {sortBy === 'state' && (
                              <span className="text-blue-500">
                                {sortOrder === 'asc' ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />}
                              </span>
                            )}
                          </div>
                        </th>
                      )}
                      {visibleColumns.includes('totalCalls') && (
                        <th 
                          className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={() => handleSort('totalCalls')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Total Calls</span>
                            {sortBy === 'totalCalls' && (
                              <span className="text-blue-500">
                                {sortOrder === 'asc' ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />}
                              </span>
                            )}
                          </div>
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {areaCodes.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                          {isLoading ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                              Loading area codes...
                            </div>
                          ) : (
                            <>No area codes found{searchTerm ? ` matching "${searchTerm}"` : ''}</>
                          )}
                        </td>
                      </tr>
                    ) : (
                      areaCodes.map((areaCode, index) => (
                        <tr key={`${areaCode.areaCode}-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          {visibleColumns.includes('areaCode') && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                {areaCode.areaCode || 'Unknown'}
                              </div>
                            </td>
                          )}
                          {visibleColumns.includes('state') && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-gray-100">
                                <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                                  areaCode.state && areaCode.state !== 'Unknown'
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                }`}>
                                  {areaCode.state || 'Unknown'}
                                </span>
                              </div>
                            </td>
                          )}
                          {visibleColumns.includes('totalCalls') && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                {formatNumber(areaCode.totalCalls)}
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={!pagination.hasPrevPage}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={!pagination.hasNextPage}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Showing{' '}
                        <span className="font-medium">
                          {((pagination.currentPage - 1) * pagination.limit) + 1}
                        </span>{' '}
                        to{' '}
                        <span className="font-medium">
                          {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)}
                        </span>{' '}
                        of{' '}
                        <span className="font-medium">{formatNumber(pagination.totalCount)}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => handlePageChange(pagination.currentPage - 1)}
                          disabled={!pagination.hasPrevPage}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Previous</span>
                          <ArrowUpIcon className="h-5 w-5 rotate-[-90deg]" aria-hidden="true" />
                        </button>
                        
                        {/* Page numbers */}
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                          const pageNumber = Math.max(1, Math.min(
                            pagination.totalPages - 4,
                            pagination.currentPage - 2
                          )) + i
                          
                          if (pageNumber > pagination.totalPages) return null
                          
                          return (
                            <button
                              key={pageNumber}
                              onClick={() => handlePageChange(pageNumber)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                pageNumber === pagination.currentPage
                                  ? 'z-10 bg-indigo-50 dark:bg-indigo-900 border-indigo-500 dark:border-indigo-400 text-indigo-600 dark:text-indigo-200'
                                  : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
                              }`}
                            >
                              {pageNumber}
                            </button>
                          )
                        })}
                        
                        <button
                          onClick={() => handlePageChange(pagination.currentPage + 1)}
                          disabled={!pagination.hasNextPage}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Next</span>
                          <ArrowUpIcon className="h-5 w-5 rotate-90" aria-hidden="true" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}