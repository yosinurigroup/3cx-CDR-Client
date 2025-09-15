import { useState, useEffect, useCallback, useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useData } from '../contexts/DataContext'
import { dataService } from '../services/dataService'
import DynamicHeader from '../components/DynamicHeader'
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  FunnelIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'

interface RawDataPageProps {}

interface LayoutContext {
  onMenuClick: () => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

interface RawDataRecord {
  [key: string]: any;
}

export default function RawDataPage({}: RawDataPageProps) {
  const { onMenuClick, isSidebarCollapsed, onToggleSidebar } = useOutletContext<LayoutContext>();
  const { selectedDataSource, filters, setError, setFilters } = useData();
  const [rawData, setRawData] = useState<RawDataRecord[]>([])
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 100,
    hasNextPage: false,
    hasPrevPage: false
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('time-start')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showFilters, setShowFilters] = useState(false)
  const [pageSize, setPageSize] = useState<number>(100)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [allColumns, setAllColumns] = useState<string[]>([])
  
  // Local filter draft state for the Filters panel
  const [localFilters, setLocalFilters] = useState({
    dateFrom: filters.dateFrom || '',
    dateTo: filters.dateTo || '',
    callType: (filters.callType as any) || '',
    status: (filters.status as any) || '',
    areaCode: filters.areaCode || '',
    trunkNumber: filters.trunkNumber || '',
    terminationReason: filters.terminationReason || '',
    extension: (filters as any).extension || '',
    stateCode: (filters as any).stateCode || '',
    minDurationSec: (filters as any).minDurationSec || '',
    minCost: (filters as any).minCost || '',
    maxCost: (filters as any).maxCost || ''
  })

  // Sync local draft when opening panel or when global filters change
  useEffect(() => {
    if (!showFilters) return
    setLocalFilters({
      dateFrom: filters.dateFrom || '',
      dateTo: filters.dateTo || '',
      callType: (filters.callType as any) || '',
      status: (filters.status as any) || '',
      areaCode: filters.areaCode || '',
      trunkNumber: filters.trunkNumber || '',
      terminationReason: filters.terminationReason || '',
      extension: (filters as any).extension || '',
      stateCode: (filters as any).stateCode || '',
      minDurationSec: (filters as any).minDurationSec || '',
      minCost: (filters as any).minCost || '',
      maxCost: (filters as any).maxCost || ''
    })
  }, [showFilters, filters])

  // Quick date presets for fast filtering
  const [quickRange, setQuickRange] = useState<string>('')

  const toLocalInput = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0)
  const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59)

  const applyQuick = (range: string) => {
    const now = new Date()
    let from = startOfDay(now)
    let to = endOfDay(now)

    switch (range) {
      case 'today':
        break
      case 'yesterday': {
        const y = new Date(now)
        y.setDate(y.getDate() - 1)
        from = startOfDay(y)
        to = endOfDay(y)
        break
      }
      case 'thisMonth':
        from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0)
        to = endOfDay(now)
        break
      case 'lastMonth':
        from = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0)
        to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59)
        break
      case 'last3months':
        from = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0)
        to = endOfDay(now)
        break
      case 'thisYear':
        from = new Date(2024, 0, 1, 0, 0)
        to = endOfDay(now)
        break
      default:
        return
    }

    setQuickRange(range)
    setLocalFilters(prev => ({
      ...prev,
      dateFrom: toLocalInput(from),
      dateTo: toLocalInput(to)
    }))
  }

  // Close Filters popover with Escape key anywhere on the page
  useEffect(() => {
    if (!showFilters) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setShowFilters(false)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [showFilters])

  const searchTimeoutRef = useRef<NodeJS.Timeout>()

  // Fetch raw data
  const fetchRawData = useCallback(async (page = 1) => {
    try {
      setIsInitialLoading(true)

      const params = {
        page,
        limit: pageSize,
        sortBy,
        sortOrder,
        search: searchTerm,
        collection: selectedDataSource,
        callType: filters.callType,
        status: filters.status,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        areaCode: filters.areaCode,
        extension: (filters as any).extension,
        trunkNumber: filters.trunkNumber,
        terminationReason: filters.terminationReason,
        stateCode: (filters as any).stateCode,
        minDurationSec: (filters as any).minDurationSec,
        minCost: (filters as any).minCost,
        maxCost: (filters as any).maxCost,
        raw: true // Flag to get raw data
      }

      const response = await dataService.getRawData(params)
      
      setRawData(response.data || [])
      if (response.pagination) {
        setPagination(response.pagination)
      }

      // Extract all unique column names from the data
      if (response.data && response.data.length > 0) {
        const columns = new Set<string>()
        response.data.forEach((record: RawDataRecord) => {
          Object.keys(record).forEach(key => columns.add(key))
        })
        setAllColumns(Array.from(columns).sort())
      }

      setIsInitialLoading(false)
    } catch (error: any) {
      console.error('Error fetching raw data:', error)
      setError(error.response?.data?.message || 'Failed to fetch raw data')
      setIsInitialLoading(false)
    }
  }, [pageSize, sortBy, sortOrder, searchTerm, selectedDataSource, filters, setError])

  // Load data on mount and filter changes
  useEffect(() => {
    fetchRawData(1)
  }, [fetchRawData])

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    fetchRawData(page)
  }, [fetchRawData])

  // Debounced search
  const handleSearch = useCallback((value: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setSearchTerm(value)
    }, 300)
  }, [])

  // Handle sort
  const handleSort = useCallback((column: string) => {
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
        callType: filters.callType,
        status: filters.status,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        areaCode: filters.areaCode,
        trunkNumber: filters.trunkNumber,
        terminationReason: filters.terminationReason,
        raw: true
      };

      const blob = await dataService.exportRawData(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().slice(0,10);
      a.download = `raw-data-${dateStr}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to export raw data');
    }
  }, [sortBy, sortOrder, searchTerm, selectedDataSource, filters, setError]);

  // Format cell value for display
  const formatCellValue = (value: any) => {
    if (value === null || value === undefined) return '-'
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
  }

  // Pagination component
  const PaginationComponent = () => (
    <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center text-xs text-gray-600 dark:text-gray-400 space-x-3">
        <span>
          Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{' '}
          {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of{' '}
          {pagination.totalCount.toLocaleString()} entries
        </span>
        <label className="flex items-center space-x-1">
          <span className="text-gray-600 dark:text-gray-400">Rows per page</span>
          <select
            className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs rounded px-2 py-1"
            value={pageSize}
            onChange={(e) => {
              const size = parseInt(e.target.value, 10) || 25;
              setPageSize(size);
            }}
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={250}>250</option>
            <option value={500}>500</option>
          </select>
        </label>
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
    <div className="min-h-screen flex flex-col">
      <DynamicHeader 
        title="Raw Data"
        onMenuClick={onMenuClick}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={onToggleSidebar}
        showSearch={true}
        actions={
          <>
            <div className="relative">
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
                {(() => {
                  const activeFilters = Object.values(filters).filter(value =>
                    value !== undefined && value !== null && value !== ''
                  ).length;
                  return activeFilters > 0 ? (
                    <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                      {activeFilters}
                    </span>
                  ) : null;
                })()}
              </button>
              {showFilters && (
                <div
                  className="absolute right-0 mt-2 w-[32rem] bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-[80vh] overflow-auto p-4"
                  role="dialog"
                  aria-modal="true"
                  tabIndex={-1}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      e.stopPropagation()
                      setShowFilters(false)
                    }
                  }}
                >
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Power Filters</h3>
                  <div className="mb-3 flex flex-wrap gap-2">
                    {[
                      {k:'today',l:'Today'},
                      {k:'yesterday',l:'Yesterday'},
                      {k:'thisMonth',l:'This Month'},
                      {k:'lastMonth',l:'Last Month'},
                      {k:'last3months',l:'Last 3 months'},
                      {k:'thisYear',l:'This year'}
                    ].map(({k,l}) => (
                      <button
                        key={k}
                        onClick={() => applyQuick(k)}
                        className={`px-2.5 py-1 text-xs rounded border ${quickRange===k ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Date From</label>
                      <input
                        type="datetime-local"
                        value={localFilters.dateFrom}
                        onChange={(e) => setLocalFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm px-2 py-1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Date To</label>
                      <input
                        type="datetime-local"
                        value={localFilters.dateTo}
                        onChange={(e) => setLocalFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm px-2 py-1"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-between">
                    <button
                      onClick={() => {
                        setLocalFilters({ dateFrom: '', dateTo: '', callType: '', status: '', areaCode: '', trunkNumber: '', terminationReason: '', extension: '', stateCode: '', minDurationSec: '', minCost: '', maxCost: '' })
                        setFilters({ dateFrom: undefined, dateTo: undefined, callType: undefined, status: undefined, areaCode: undefined, trunkNumber: undefined, terminationReason: undefined, extension: undefined, stateCode: undefined, minDurationSec: undefined, minCost: undefined, maxCost: undefined })
                        setShowFilters(false)
                      }}
                      className="px-3 py-1.5 text-xs rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Clear All
                    </button>
                    <div className="space-x-2">
                      <button
                        onClick={() => setShowFilters(false)}
                        className="px-3 py-1.5 text-xs rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          const convertToISO = (dateTimeLocal: string) => {
                            if (!dateTimeLocal) return undefined;
                            try {
                              return new Date(dateTimeLocal).toISOString();
                            } catch (error) {
                              console.warn('Invalid date format:', dateTimeLocal);
                              return undefined;
                            }
                          };

                          setFilters({
                            dateFrom: convertToISO(localFilters.dateFrom),
                            dateTo: convertToISO(localFilters.dateTo),
                            callType: (localFilters.callType as any) || undefined,
                            status: (localFilters.status as any) || undefined,
                            areaCode: localFilters.areaCode || undefined,
                            trunkNumber: localFilters.trunkNumber || undefined,
                            terminationReason: localFilters.terminationReason || undefined,
                            extension: (localFilters.extension as any) || undefined,
                            stateCode: (localFilters.stateCode as any) || undefined,
                            minDurationSec: localFilters.minDurationSec ? Number(localFilters.minDurationSec) : undefined,
                            minCost: localFilters.minCost ? Number(localFilters.minCost) : undefined,
                            maxCost: localFilters.maxCost ? Number(localFilters.maxCost) : undefined
                          })
                          setShowFilters(false)
                        }}
                        className="px-3 py-1.5 text-xs rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={handleExport}
              className="inline-flex items-center p-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              title="Export to CSV"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
            </button>
          </>
        }
        searchValue={searchTerm}
        onSearchChange={handleSearch}
        searchPlaceholder="Search raw data..."
      />

      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {isInitialLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="h-full flex flex-col min-h-0">
            <div className="flex-1 overflow-hidden bg-white dark:bg-gray-800 shadow-sm rounded-lg">
              <div className="overflow-auto" style={{ height: 'calc(100vh - 120px)' }}>
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0 z-10">
                    <tr>
                      {allColumns.map((column) => (
                        <th
                          key={column}
                          className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={() => handleSort(column)}
                        >
                          <div className="flex items-center space-x-1">
                            <span>{column}</span>
                            {sortBy === column && (
                              <span className="text-blue-500">
                                {sortOrder === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {rawData.map((record, index) => (
                      <tr key={`${record._id || index}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        {allColumns.map((column) => (
                          <td key={column} className="px-4 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-gray-100">
                            <div className="max-w-xs truncate" title={formatCellValue(record[column])}>
                              {formatCellValue(record[column])}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Fixed Pagination at bottom */}
      <div className="fixed left-0 right-0 bottom-0 z-30 pointer-events-none">
        <div className={`pointer-events-auto ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
          <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <PaginationComponent />
          </div>
        </div>
      </div>
    </div>
  )
}