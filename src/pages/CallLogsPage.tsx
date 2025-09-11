import { useState, useEffect, useCallback, useRef } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import { useData } from '../contexts/DataContext'
import { dataService } from '../services/dataService'
import type { CallLog, ApiResponse } from '../services/dataService'
import DynamicHeader from '../components/DynamicHeader'
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  PhoneArrowUpRightIcon,
  PhoneArrowDownLeftIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'

interface CallLogsPageProps {
  callType?: 'incoming' | 'outgoing'
}

interface LayoutContext {
  onMenuClick: () => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export default function CallLogsPage({ callType }: CallLogsPageProps) {
  const { onMenuClick, isSidebarCollapsed, onToggleSidebar } = useOutletContext<LayoutContext>()
  const { selectedDataSource, filters, setError } = useData()
  const [searchParams] = useSearchParams()
  const [callLogs, setCallLogs] = useState<CallLog[]>([])
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 25,
    hasNextPage: false,
    hasPrevPage: false
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('startTime')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showFilters, setShowFilters] = useState(false)
  const [showColumnSelector, setShowColumnSelector] = useState(false)
  
  // Column management based on call type
  const getDefaultColumns = () => {
    if (callType === 'incoming') {
      return ['type', 'time', 'from', 'to', 'duration']
    } else if (callType === 'outgoing') {
      return ['type', 'time', 'from', 'to', 'duration', 'state', 'areaCode', 'extension', 'cost']
    } else {
      // All call logs page
      return ['type', 'time', 'from', 'to', 'duration', 'state', 'areaCode', 'extension', 'cost']
    }
  }

  const getAvailableColumns = () => {
    if (callType === 'incoming') {
      return [
        { key: 'type', label: 'Type', required: true },
        { key: 'time', label: 'Time', required: true },
        { key: 'from', label: 'From', required: true },
        { key: 'to', label: 'To', required: true },
        { key: 'duration', label: 'Duration', required: true },
        { key: 'trunkNumber', label: 'Trunk Number', required: false },
        { key: 'terminationReason', label: 'Termination Reason', required: false }
      ]
    } else {
      return [
        { key: 'type', label: 'Type', required: true },
        { key: 'time', label: 'Time', required: true },
        { key: 'from', label: 'From', required: true },
        { key: 'to', label: 'To', required: true },
        { key: 'duration', label: 'Duration', required: true },
        { key: 'state', label: 'State', required: true },
        { key: 'areaCode', label: 'Area Code', required: true },
        { key: 'extension', label: 'Extension', required: true },
        { key: 'cost', label: 'Cost', required: true },
        { key: 'trunkNumber', label: 'Trunk Number', required: false },
        { key: 'terminationReason', label: 'Termination Reason', required: false }
      ]
    }
  }

  const [visibleColumns, setVisibleColumns] = useState<string[]>(getDefaultColumns())
  const availableColumns = getAvailableColumns()

  // Reset visible columns when call type changes
  useEffect(() => {
    setVisibleColumns(getDefaultColumns())
  }, [callType])
  
  // 🪄 MAGIC: Instant pagination system
  const [pageCache, setPageCache] = useState<Map<string, { data: CallLog[], pagination: any, timestamp: number }>>(new Map())
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const searchTimeoutRef = useRef<NodeJS.Timeout>()

  const title = callType ? `${callType.charAt(0).toUpperCase() + callType.slice(1)} Calls` : 'Call Logs'

  // 🪄 MAGIC: Generate cache key
  const getCacheKey = useCallback((page: number) => {
    return `${page}-${sortBy}-${sortOrder}-${searchTerm}-${selectedDataSource}-${JSON.stringify(filters)}`
  }, [sortBy, sortOrder, searchTerm, selectedDataSource, filters])

  // 🪄 MAGIC: Fetch with caching
  const fetchCallLogs = useCallback(async (page = 1, isBackground = false) => {
    const cacheKey = getCacheKey(page)
    
    // Check cache first (valid for 5 minutes)
    const cached = pageCache.get(cacheKey)
    if (cached && (Date.now() - cached.timestamp) < 300000) {
      if (!isBackground) {
        setCallLogs(cached.data)
        setPagination(cached.pagination)
        setIsInitialLoading(false)
      }
      return cached
    }

    try {
      if (!isBackground && callLogs.length === 0) {
        setIsInitialLoading(true)
      }

      // Get URL parameters for filtering
      const urlAreaCode = searchParams.get('areaCode')
      const urlExtension = searchParams.get('extension')

      const params = {
        page,
        limit: 25,
        sortBy,
        sortOrder,
        search: searchTerm,
        collection: selectedDataSource,
        callType: callType || filters.callType,
        status: filters.status,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        areaCode: urlAreaCode || filters.areaCode,
        extension: urlExtension || undefined,
        trunkNumber: filters.trunkNumber,
        terminationReason: filters.terminationReason
      }

      const response: ApiResponse<CallLog[]> = await dataService.getCallLogs(params)
      
      // Store in cache
      const cacheData = {
        data: response.data || [],
        pagination: response.pagination!,
        timestamp: Date.now()
      }
      
      setPageCache(prev => {
        const newCache = new Map(prev)
        newCache.set(cacheKey, cacheData)
        // Limit cache size to 50 entries
        if (newCache.size > 50) {
          const oldestKey = Array.from(newCache.keys())[0]
          newCache.delete(oldestKey)
        }
        return newCache
      })

      if (!isBackground) {
        setCallLogs(response.data || [])
        if (response.pagination) {
          setPagination(response.pagination)
        }
        setIsInitialLoading(false)
      }

      return cacheData
    } catch (error: any) {
      console.error('Error fetching call logs:', error)
      if (!isBackground) {
        setError(error.response?.data?.message || 'Failed to fetch call logs')
        setIsInitialLoading(false)
      }
      return null
    }
  }, [getCacheKey, pageCache, callLogs.length, sortBy, sortOrder, searchTerm, selectedDataSource, callType, filters, setError])

  // 🪄 MAGIC: Prefetch adjacent pages
  const prefetchPages = useCallback((currentPage: number, totalPages: number) => {
    const pagesToPrefetch = [currentPage + 1, currentPage + 2, currentPage - 1]
      .filter(page => page > 0 && page <= totalPages)

    pagesToPrefetch.forEach((page, index) => {
      const cacheKey = getCacheKey(page)
      if (!pageCache.has(cacheKey)) {
        setTimeout(() => fetchCallLogs(page, true), index * 100)
      }
    })
  }, [getCacheKey, pageCache, fetchCallLogs])

  // Load data on mount and filter changes
  useEffect(() => {
    setPageCache(new Map())
    setIsInitialLoading(true)
    fetchCallLogs(1)
  }, [selectedDataSource, callType, filters, sortBy, sortOrder, searchTerm])

  // Prefetch adjacent pages when data loads
  useEffect(() => {
    if (callLogs.length > 0 && pagination.totalPages > 1 && !isInitialLoading) {
      setTimeout(() => prefetchPages(pagination.currentPage, pagination.totalPages), 200)
    }
  }, [callLogs.length, pagination.currentPage, pagination.totalPages, isInitialLoading, prefetchPages])

  // 🚀 INSTANT page change
  const handlePageChange = useCallback((page: number) => {
    const cacheKey = getCacheKey(page)
    const cached = pageCache.get(cacheKey)
    
    if (cached && (Date.now() - cached.timestamp) < 300000) {
      // INSTANT: Use cached data immediately
      setCallLogs(cached.data)
      setPagination(cached.pagination)
      // Prefetch more pages in background
      setTimeout(() => prefetchPages(page, cached.pagination.totalPages), 50)
    } else {
      // Fallback to normal fetch
      fetchCallLogs(page)
    }
  }, [getCacheKey, pageCache, fetchCallLogs, prefetchPages])

  // Debounced search (reduced delay for snappier UX)
  const handleSearch = useCallback((value: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setSearchTerm(value)
      setPageCache(new Map())
    }, 150)
  }, [])

  // Handle sort
  const handleSort = useCallback((column: string) => {
    setPageCache(new Map())
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }, [sortBy, sortOrder])

  // Export functionality
  const handleExport = useCallback(async () => {
    try {
      const params = {
        sortBy,
        sortOrder,
        search: searchTerm,
        collection: selectedDataSource,
        callType: callType || filters.callType,
        status: filters.status,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        areaCode: filters.areaCode,
        trunkNumber: filters.trunkNumber,
        terminationReason: filters.terminationReason
      }

      const blob = await dataService.exportCallLogs(params)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const dateStr = new Date().toISOString().slice(0,10)
      a.download = `call-logs-${dateStr}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to export call logs')
    }
  }, [sortBy, sortOrder, searchTerm, selectedDataSource, callType, filters, setError])

  // Format duration
  const formatDuration = (seconds: number | string) => {
    const numSeconds = typeof seconds === 'string' ? parseInt(seconds, 10) || 0 : seconds
    const hours = Math.floor(numSeconds / 3600)
    const minutes = Math.floor((numSeconds % 3600) / 60)
    const secs = numSeconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  // Get call type icon
  const getCallTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'incoming':
        return <PhoneArrowDownLeftIcon className="h-4 w-4 text-blue-500" />
      case 'outgoing':
        return <PhoneArrowUpRightIcon className="h-4 w-4 text-green-500" />
      default:
        return <PhoneArrowUpRightIcon className="h-4 w-4 text-gray-500" />
    }
  }

  // Pagination component - matching the image style
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
          <ChevronLeftIcon className="h-4 w-4" />
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
          <ChevronRightIcon className="h-4 w-4" />
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

  return (
    <div className="h-full flex flex-col">
      <DynamicHeader 
        title={title}
        onMenuClick={onMenuClick}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={onToggleSidebar}
        showSearch={true}
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
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        * Required columns cannot be hidden
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={handleExport}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
        searchValue={searchTerm}
        onSearchChange={handleSearch}
        searchPlaceholder="Search call logs..."
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
                      {/* TYPE */}
                      {visibleColumns.includes('type') && (
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Type
                        </th>
                      )}
                      
                      {/* TIME */}
                      {visibleColumns.includes('time') && (
                        <th 
                          className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={() => handleSort('startTime')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Time</span>
                            {sortBy === 'startTime' && (
                              <span className="text-blue-500">
                                {sortOrder === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </th>
                      )}
                      
                      {/* FROM */}
                      {visibleColumns.includes('from') && (
                        <th 
                          className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={() => handleSort('fromNumber')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>From</span>
                            {sortBy === 'fromNumber' && (
                              <span className="text-blue-500">
                                {sortOrder === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </th>
                      )}
                      
                      {/* TO */}
                      {visibleColumns.includes('to') && (
                        <th 
                          className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={() => handleSort('toNumber')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>To</span>
                            {sortBy === 'toNumber' && (
                              <span className="text-blue-500">
                                {sortOrder === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </th>
                      )}
                      
                      {/* DURATION */}
                      {visibleColumns.includes('duration') && (
                        <th 
                          className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={() => handleSort('duration')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Duration</span>
                            {sortBy === 'duration' && (
                              <span className="text-blue-500">
                                {sortOrder === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </th>
                      )}
                      
                      {/* STATE (only for outgoing) */}
                      {visibleColumns.includes('state') && (
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          State
                        </th>
                      )}
                      
                      {/* AREA CODE (only for outgoing) */}
                      {visibleColumns.includes('areaCode') && (
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Area Code
                        </th>
                      )}
                      
                      {/* Optional columns */}
                      {visibleColumns.includes('extension') && (
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Extension
                        </th>
                      )}
                      
                      {visibleColumns.includes('cost') && (
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Cost
                        </th>
                      )}
                      
                      {visibleColumns.includes('trunkNumber') && (
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Trunk
                        </th>
                      )}
                      
                      {visibleColumns.includes('terminationReason') && (
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Reason
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {callLogs.map((call, index) => (
                      <tr key={`${call.historyId}-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        {/* TYPE */}
                        {visibleColumns.includes('type') && (
                          <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-gray-100">
                            <div className="flex items-center space-x-1">
                              {getCallTypeIcon(call.callType || 'unknown')}
                              <span className="capitalize">{call.callType || 'Unknown'}</span>
                            </div>
                          </td>
                        )}
                        
                        {/* TIME */}
                        {visibleColumns.includes('time') && (
                          <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-gray-100">
                            {format(new Date(call.startTime), 'MMM dd, HH:mm:ss')}
                          </td>
                        )}
                        
                        {/* FROM */}
                        {visibleColumns.includes('from') && (
                          <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-gray-100">
                            {call.fromNumber}
                          </td>
                        )}
                        
                        {/* TO */}
                        {visibleColumns.includes('to') && (
                          <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-gray-100">
                            {call.toNumber}
                          </td>
                        )}
                        
                        {/* DURATION */}
                        {visibleColumns.includes('duration') && (
                          <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-gray-100">
                            {formatDuration(call.durationSeconds || call.duration || 0)}
                          </td>
                        )}
                        
                        {/* STATE (only for outgoing) */}
                        {visibleColumns.includes('state') && (
                          <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-gray-100">
                            {call.callType === 'outgoing' ? (call.stateCode || '-') : '-'}
                          </td>
                        )}
                        
                        {/* AREA CODE (only for outgoing) */}
                        {visibleColumns.includes('areaCode') && (
                          <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-gray-100">
                            {call.callType === 'outgoing' ? (call.areaCode || '-') : '-'}
                          </td>
                        )}
                        
                        {/* Optional columns */}
                        {visibleColumns.includes('extension') && (
                          <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-gray-100">
                            {call.callType === 'incoming' ? '-' : (call.extension || '-')}
                          </td>
                        )}
                        
                        {visibleColumns.includes('cost') && (
                          <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-gray-100">
                            ${call.cost?.toFixed(2) || '0.00'}
                          </td>
                        )}
                        
                        {visibleColumns.includes('trunkNumber') && (
                          <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-gray-100">
                            {call.trunkNumber || '-'}
                          </td>
                        )}
                        
                        {visibleColumns.includes('terminationReason') && (
                          <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                            <span className="truncate max-w-24 block" title={call.terminationReason}>
                              {call.terminationReason}
                            </span>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Fixed Pagination at bottom - Always visible */}
              <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-10">
                <PaginationComponent />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}