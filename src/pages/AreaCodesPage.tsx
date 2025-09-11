  // Duration formatter like CallLogsPage
  const formatDuration = (seconds: number | undefined) => {
    const numSeconds = typeof seconds === 'number' ? seconds : 0
    const hours = Math.floor(numSeconds / 3600)
    const minutes = Math.floor((numSeconds % 3600) / 60)
    const secs = numSeconds % 60
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const formatCurrency = (amount: number | undefined) => {
    return `$${(amount || 0).toFixed(2)}`
  }


import { useState, useEffect, useCallback, useRef } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
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
  onMenuClick: () => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export default function AreaCodesPage() {
  const { onMenuClick, isSidebarCollapsed, onToggleSidebar } = useOutletContext<LayoutContext>()
  const { selectedDataSource, filters, setError } = useData()
  const [searchParams] = useSearchParams()
  const stateFilter = searchParams.get('state')
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
  // Caching & debounce (match CallLogsPage behavior)
  const [pageCache, setPageCache] = useState<Map<string, { data: AreaCode[], pagination: any, timestamp: number }>>(new Map())
  const searchTimeoutRef = useRef<NodeJS.Timeout>()

  // Column management similar to CallLogsPage
  const availableColumns = [
    { key: 'areaCode', label: 'Area Code', required: true },
    { key: 'state', label: 'State', required: false },
    { key: 'totalCalls', label: 'Total Calls', required: true },
    { key: 'totalDuration', label: 'Total Duration', required: false },
    { key: 'totalCost', label: 'Total Cost', required: false }
  ]
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'areaCode', 'state', 'totalCalls', 'totalDuration', 'totalCost'
  ])

  // Cache key builder (match CallLogsPage)
  const getCacheKey = useCallback((page: number) => {
    return `${page}-${sortBy}-${sortOrder}-${searchTerm}-${selectedDataSource}-${JSON.stringify(filters)}-${stateFilter}`
  }, [sortBy, sortOrder, searchTerm, selectedDataSource, filters, stateFilter])

  // Fetch area codes data with caching
  const fetchAreaCodes = useCallback(async (page: number = 1, isBackground: boolean = false) => {
    if (!selectedDataSource) return null

    const cacheKey = getCacheKey(page)
    const cached = pageCache.get(cacheKey)
    if (cached && (Date.now() - cached.timestamp) < 300000) {
      if (!isBackground) {
        setAreaCodes(cached.data)
        setPagination(cached.pagination)
        setIsInitialLoading(false)
      }
      return cached
    }

    try {
      if (!isBackground && areaCodes.length === 0) {
        setIsInitialLoading(true)
      }

      const params = {
        collection: selectedDataSource,
        page,
        limit: pagination.limit,
        search: searchTerm.trim(),
        sortBy,
        sortOrder,
        // Apply filters if any
        ...filters,
        // Apply state filter from URL if present
        ...(stateFilter && { state: stateFilter })
      }

      const response: ApiResponse<AreaCode[]> = await dataService.getAreaCodes(params)

      const cacheData = {
        data: response.data || [],
        pagination: response.pagination!,
        timestamp: Date.now()
      }

      setPageCache(prev => {
        const newCache = new Map(prev)
        newCache.set(cacheKey, cacheData)
        if (newCache.size > 50) {
          const oldestKey = Array.from(newCache.keys())[0]
          newCache.delete(oldestKey)
        }
        return newCache
      })

      if (!isBackground) {
        setAreaCodes(response.data || [])
        if (response.pagination) setPagination(response.pagination)
        setIsInitialLoading(false)
      }

      return cacheData
    } catch (err: any) {
      console.error('Error fetching area codes:', err)
      if (!isBackground) setError(err.response?.data?.message || 'Failed to load area code data')
      return null
    } finally {
      if (!isBackground) setIsLoading(false)
    }
  }, [selectedDataSource, searchTerm, sortBy, sortOrder, filters, stateFilter, pagination.limit, setError, pageCache, getCacheKey, areaCodes.length])

  // Prefetch adjacent pages like CallLogsPage
  const prefetchPages = useCallback((currentPage: number, totalPages: number) => {
    const pagesToPrefetch = [currentPage + 1, currentPage + 2, currentPage - 1]
      .filter(p => p > 0 && p <= totalPages)
    pagesToPrefetch.forEach((p, i) => {
      const key = getCacheKey(p)
      if (!pageCache.has(key)) {
        setTimeout(() => fetchAreaCodes(p, true), i * 100)
      }
    })
  }, [pageCache, getCacheKey, fetchAreaCodes])

  // Search handler with debounce
  const handleSearch = useCallback((value: string) => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => {
      setSearchTerm(value)
      setPageCache(new Map())
    }, 300)
  }, [])

  // Sort handler
  const handleSort = (column: string) => {
    setPageCache(new Map())
    if (sortBy === column) {
      const nextOrder = sortOrder === 'asc' ? 'desc' : 'asc'
      setSortOrder(nextOrder)
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
    // Kick an immediate reload to page 1
    setTimeout(() => fetchAreaCodes(1), 0)
  }

  // Pagination handlers
  const handlePageChange = (page: number) => {
    const cacheKey = getCacheKey(page)
    const cached = pageCache.get(cacheKey)
    if (cached && (Date.now() - cached.timestamp) < 300000) {
      setAreaCodes(cached.data)
      setPagination(cached.pagination)
      setTimeout(() => prefetchPages(page, cached.pagination.totalPages), 50)
    } else {
      fetchAreaCodes(page)
    }
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

  // Pagination component - match CallLogsPage style
  const PaginationComponent = () => (
    <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
        <span>
          Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{' '}
          {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of{' '}
          {pagination.totalCount.toLocaleString()} entries
        </span>
      </div>

      <div className="flex items-center space-x-1">
        <button
          onClick={() => handlePageChange(1)}
          disabled={pagination.currentPage === 1}
          className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          title="First page"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={() => handlePageChange(pagination.currentPage - 1)}
          disabled={!pagination.hasPrevPage}
          className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Previous page"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex items-center space-x-1 text-xs">
          <span className="text-gray-600 dark:text-gray-400">Page</span>
          <span className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium">
            {pagination.currentPage}
          </span>
          <span className="text-gray-600 dark:text-gray-400">of {pagination.totalPages.toLocaleString()}</span>
        </div>

        <button
          onClick={() => handlePageChange(pagination.currentPage + 1)}
          disabled={!pagination.hasNextPage}
          className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Next page"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <button
          onClick={() => handlePageChange(pagination.totalPages)}
          disabled={pagination.currentPage === pagination.totalPages}
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

  // Effect to fetch data when dependencies change
  useEffect(() => {
    setPageCache(new Map())
    setIsInitialLoading(true)
    fetchAreaCodes(1)
  }, [selectedDataSource, sortBy, sortOrder, searchTerm, JSON.stringify(filters), stateFilter])

  // Prefetch adjacent pages when data loads
  useEffect(() => {
    if (areaCodes.length > 0 && pagination.totalPages > 1 && !isInitialLoading) {
      setTimeout(() => prefetchPages(pagination.currentPage, pagination.totalPages), 200)
    }
  }, [areaCodes.length, pagination.currentPage, pagination.totalPages, isInitialLoading, prefetchPages])

  // Effect to refetch when data source changes
  useEffect(() => {
    if (selectedDataSource) {
      fetchAreaCodes(1, true)
    }
  }, [selectedDataSource])

  return (
    <div className="h-full flex flex-col">
      <DynamicHeader
        title={stateFilter ? `Area Codes - ${stateFilter}` : "Area Codes"}
        onMenuClick={onMenuClick}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={onToggleSidebar}
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
              <div className="overflow-auto" style={{ height: 'calc(100vh - 120px)' }}>
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0 z-10">
                    <tr>
                      {visibleColumns.includes('areaCode') && (
                        <th 
                          className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
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
                          className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
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
                          className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
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
                      {visibleColumns.includes('totalDuration') && (
                        <th 
                          className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={() => handleSort('totalDuration')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Total Duration</span>
                            {sortBy === 'totalDuration' && (
                              <span className="text-blue-500">
                                {sortOrder === 'asc' ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />}
                              </span>
                            )}
                          </div>
                        </th>
                      )}
                      {visibleColumns.includes('totalCost') && (
                        <th 
                          className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={() => handleSort('totalCost')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Total Cost</span>
                            {sortBy === 'totalCost' && (
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
                        <td colSpan={5} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400 text-xs">
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
                        <tr key={`${areaCode.areaCode}-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-700 text-xs">
                          {visibleColumns.includes('areaCode') && (
                            <td className="px-4 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">
                              {areaCode.areaCode || 'Unknown'}
                            </td>
                          )}
                          {visibleColumns.includes('state') && (
                            <td className="px-4 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">
                              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                                areaCode.state && areaCode.state !== 'Unknown'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                              }`}>
                                {areaCode.state || 'Unknown'}
                              </span>
                            </td>
                          )}
                          {visibleColumns.includes('totalCalls') && (
                            <td className="px-4 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">
                              {formatNumber(areaCode.totalCalls)}
                            </td>
                          )}
                          {visibleColumns.includes('totalDuration') && (
                            <td className="px-4 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">
                              {formatDuration(areaCode.totalDuration)}
                            </td>
                          )}
                          {visibleColumns.includes('totalCost') && (
                            <td className="px-4 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">
                              {formatCurrency(areaCode.totalCost)}
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sticky Pagination at bottom - Always visible */}
            <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-10">
              <PaginationComponent />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}