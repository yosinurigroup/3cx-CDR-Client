
import { useState, useEffect, useCallback, useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useData } from '../contexts/DataContext'
import { dataService } from '../services/dataService'
import DynamicHeader from '../components/DynamicHeader'
import { 
  ArrowDownTrayIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'

// Duration formatter
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

interface Extension {
  extension: string
  totalCalls: number
  totalDuration: number
  totalCost: number
}

interface LayoutContext {
  onMenuClick: () => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export default function ExtensionsPage() {
  const { onMenuClick, isSidebarCollapsed, onToggleSidebar } = useOutletContext<LayoutContext>()
  const { selectedDataSource, filters, setError } = useData()
  const [extensions, setExtensions] = useState<Extension[]>([])
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 25,
    hasNextPage: false,
    hasPrevPage: false
  })
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'extension' | 'totalCalls' | 'totalDuration' | 'totalCost'>('totalCalls')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showColumns, setShowColumns] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState({
    extension: true,
    totalCalls: true,
    totalDuration: true,
    totalCost: true
  })

  const searchTimeoutRef = useRef<NodeJS.Timeout>()

  const fetchExtensions = useCallback(async (
    page: number = 1,
    search: string = '',
    sortField: string = 'totalCalls',
    sortDirection: string = 'desc'
  ) => {
    if (!selectedDataSource) return

    try {
      const response = await dataService.getExtensions({
        collection: selectedDataSource,
        page,
        limit: pagination.limit,
        search,
        sortBy: sortField,
        sortOrder: sortDirection,
        ...filters
      })

      if (response.success && response.data) {
        setExtensions(response.data.extensions || [])
        setPagination(prev => ({
          ...prev,
          currentPage: response.data!.pagination.currentPage,
          totalPages: response.data!.pagination.totalPages,
          totalCount: response.data!.pagination.totalCount,
          hasNextPage: response.data!.pagination.hasNextPage,
          hasPrevPage: response.data!.pagination.hasPrevPage
        }))
      } else {
        throw new Error(response.error || 'Failed to fetch extensions')
      }
    } catch (error) {
      console.error('Error fetching extensions:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch extensions')
    } finally {
      setIsInitialLoading(false)
    }
  }, [selectedDataSource, pagination.limit, filters, setError])

  // Initial load
  useEffect(() => {
    fetchExtensions(1, searchTerm, sortBy, sortOrder)
  }, [selectedDataSource, filters])

  // Handle search with debouncing
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (!isInitialLoading) {
        fetchExtensions(1, searchTerm, sortBy, sortOrder)
      }
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchTerm, sortBy, sortOrder, fetchExtensions, isInitialLoading])

  const handleSort = (field: typeof sortBy) => {
    const newOrder = field === sortBy && sortOrder === 'desc' ? 'asc' : 'desc'
    setSortBy(field)
    setSortOrder(newOrder)
  }

  const handlePageChange = (page: number) => {
    fetchExtensions(page, searchTerm, sortBy, sortOrder)
  }

  const handleExport = () => {
    if (extensions.length === 0) return

    const csvContent = [
      ['Extension', 'Total Calls', 'Total Duration', 'Total Cost'].join(','),
      ...extensions.map(ext => [
        ext.extension,
        ext.totalCalls,
        ext.totalDuration,
        ext.totalCost.toFixed(2)
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `extensions-${format(new Date(), 'yyyy-MM-dd')}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return null
    return sortOrder === 'asc' ? 
      <ArrowUpIcon className="h-4 w-4" /> : 
      <ArrowDownIcon className="h-4 w-4" />
  }

  const PaginationComponent = () => (
    <div className="flex items-center justify-between px-6 py-3 bg-white dark:bg-gray-800">
      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
        Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of {pagination.totalCount} entries
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => handlePageChange(pagination.currentPage - 1)}
          disabled={!pagination.hasPrevPage}
          className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
        >
          Previous
        </button>
        
        <div className="flex items-center space-x-1">
          {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
            const page = i + 1
            return (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 text-sm border rounded ${
                  pagination.currentPage === page
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                }`}
              >
                {page}
              </button>
            )
          })}
        </div>

        <button
          onClick={() => handlePageChange(pagination.currentPage + 1)}
          disabled={!pagination.hasNextPage}
          className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
        >
          Next
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col">
      <DynamicHeader 
        title="Extensions"
        onMenuClick={onMenuClick}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={onToggleSidebar}
        actions={
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExport}
              disabled={extensions.length === 0}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Export
            </button>
            
            <div className="relative">
              <button
                onClick={() => setShowColumns(!showColumns)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <EyeIcon className="h-4 w-4 mr-2" />
                Columns
              </button>
              
              {showColumns && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700">
                  <div className="py-1">
                    {Object.entries(visibleColumns).map(([key, visible]) => (
                      <label key={key} className="flex items-center px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <input
                          type="checkbox"
                          checked={visible}
                          onChange={(e) => setVisibleColumns(prev => ({ ...prev, [key]: e.target.checked }))}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        }
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search extensions..."
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
                      {visibleColumns.extension && (
                        <th 
                          className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={() => handleSort('extension')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Extension</span>
                            {getSortIcon('extension')}
                          </div>
                        </th>
                      )}
                      
                      {visibleColumns.totalCalls && (
                        <th 
                          className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={() => handleSort('totalCalls')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Total Calls</span>
                            {getSortIcon('totalCalls')}
                          </div>
                        </th>
                      )}
                      
                      {visibleColumns.totalDuration && (
                        <th 
                          className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={() => handleSort('totalDuration')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Total Duration</span>
                            {getSortIcon('totalDuration')}
                          </div>
                        </th>
                      )}
                      
                      {visibleColumns.totalCost && (
                        <th 
                          className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={() => handleSort('totalCost')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Total Cost</span>
                            {getSortIcon('totalCost')}
                          </div>
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {extensions.map((extension, index) => (
                      <tr key={`${extension.extension}-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        {visibleColumns.extension && (
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {extension.extension}
                          </td>
                        )}
                        
                        {visibleColumns.totalCalls && (
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {extension.totalCalls.toLocaleString()}
                          </td>
                        )}
                        
                        {visibleColumns.totalDuration && (
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {formatDuration(extension.totalDuration)}
                          </td>
                        )}
                        
                        {visibleColumns.totalCost && (
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {formatCurrency(extension.totalCost)}
                          </td>
                        )}
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