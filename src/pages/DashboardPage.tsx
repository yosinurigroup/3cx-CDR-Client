import { useState, useEffect } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { useData } from '../contexts/DataContext'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LabelList } from 'recharts'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faMapMarkerAlt, 
  faUsers, 
  faDollarSign, 
  faClock, 
  faChartBar, 
  faSync,
  faExclamationTriangle,
  faTachometerAlt,
  faPhone,
  faArrowDown,
  faArrowUp,
  faStopwatch
} from '@fortawesome/free-solid-svg-icons'
import axios from 'axios'

// Use the same API base URL pattern as services to work in Vercel
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

interface DashboardData {
  summary: {
    totalCalls: number
    incomingCalls: number
    outgoingCalls: number
    uniqueAreaCodes: number
    uniqueExtensions: number
    totalCost: number
    totalDuration: number
    avgDuration: number
    incomingPercentage: number
    outgoingPercentage: number
  }
  areaCodeDistribution: Array<{
    areaCode: string
    count: number
    percentage: number
    totalCost: number
    totalDuration: number
  }>
  extensionDistribution: Array<{
    extension: string
    count: number
    percentage: number
    incomingCalls: number
    outgoingCalls: number
    totalDuration: number
  }>
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1']

export default function DashboardPage() {
  const navigate = useNavigate();
  const { onMenuClick, isSidebarCollapsed, onToggleSidebar } = useOutletContext<any>();
  const { selectedDataSource } = useData()
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [selectedDataSource])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      console.log('🚀 Fetching dashboard data using MAGIC aggregation for collection:', selectedDataSource)

      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      // Use the new powerful aggregation endpoint
      const response = await axios.get(`${API_BASE_URL}/dashboard/stats`, {
        params: { collection: selectedDataSource },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.data.success) {
        setData(response.data.data)
        console.log(`✨ Dashboard data loaded in ${response.data.processingTime}ms`)
      } else {
        throw new Error(response.data.error || 'Failed to fetch dashboard data')
      }

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error)
      setError(`Failed to load dashboard data: ${error.response?.data?.error || error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value)
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value)
  }

  const handleRefresh = () => {
    fetchDashboardData()
  }

  // Handle area code click to navigate to filtered call logs
  const handleAreaCodeClick = (areaCode: string) => {
    navigate(`/reports/call-logs?areaCode=${encodeURIComponent(areaCode)}`)
  }

  // Handle extension click to navigate to filtered call logs
  const handleExtensionClick = (extension: string) => {
    navigate(`/reports/call-logs?extension=${encodeURIComponent(extension)}`)
  }

  // Custom tooltip component with enhanced styling
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 min-w-[200px]">
          <div className="font-semibold text-gray-900 dark:text-white mb-2 text-center">
            {label}
          </div>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Calls:</span>
              <span className="font-medium text-blue-600 dark:text-blue-400">{formatNumber(payload[0].value)}</span>
            </div>
            {data.percentage && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Percentage:</span>
                <span className="font-medium text-green-600 dark:text-green-400">{data.percentage.toFixed(1)}%</span>
              </div>
            )}
            {data.totalCost && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Cost:</span>
                <span className="font-medium text-red-600 dark:text-red-400">{formatCurrency(data.totalCost)}</span>
              </div>
            )}
            {data.totalDuration && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Duration:</span>
                <span className="font-medium text-purple-600 dark:text-purple-400">{formatDuration(data.totalDuration)}</span>
              </div>
            )}
          </div>
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Click to view detailed logs
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-8"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-red-500 dark:text-red-400">
            <FontAwesomeIcon icon={faExclamationTriangle} className="mx-auto h-12 w-12 mb-4" />
            <h3 className="text-lg font-medium mb-2">Error Loading Dashboard</h3>
            <p className="mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <FontAwesomeIcon icon={faSync} className="h-4 w-4 mr-2" />
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400">
            <FontAwesomeIcon icon={faChartBar} className="mx-auto h-12 w-12 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Data Available</h3>
            <p>Unable to load dashboard statistics.</p>
          </div>
        </div>
      </div>
    )
  }

  const { summary, areaCodeDistribution, extensionDistribution } = data

  return (
    <div className="min-h-screen p-6 space-y-8 pb-16">
      {/* Header */}
      <div className="flex justify-between items-center sticky top-0 bg-gray-50 dark:bg-gray-900 py-4 z-10 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            type="button"
            className="lg:hidden -m-2.5 p-2.5 text-gray-700 dark:text-gray-300"
            onClick={onMenuClick}
          >
            <span className="sr-only">Open sidebar</span>
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </button>
          <button
            type="button"
            className="hidden lg:block -m-2.5 p-2.5 text-gray-700 dark:text-gray-300"
            onClick={onToggleSidebar}
          >
            <span className="sr-only">Toggle sidebar</span>
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d={isSidebarCollapsed ? "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" : "M3.75 6.75h16.5M3.75 12h10.5m-10.5 5.25h16.5"}
              />
            </svg>
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <FontAwesomeIcon icon={faTachometerAlt} className="text-blue-600" />
            Dashboard
          </h1>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          <FontAwesomeIcon icon={faSync} className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-8 gap-6">
        {/* Total Calls */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-lg shadow-sm border border-blue-200 dark:border-blue-700 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Calls</h3>
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{formatNumber(summary.totalCalls)}</p>
              <p className="text-xs text-blue-500 dark:text-blue-400">All records</p>
            </div>
            <div className="p-3 bg-blue-600 rounded-full">
              <FontAwesomeIcon icon={faPhone} className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        {/* Incoming Calls */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-lg shadow-sm border border-green-200 dark:border-green-700 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-green-600 dark:text-green-400">Incoming Calls</h3>
              <p className="text-3xl font-bold text-green-700 dark:text-green-300">{formatNumber(summary.incomingCalls)}</p>
              <p className="text-xs text-green-500 dark:text-green-400">{summary.incomingPercentage.toFixed(1)}% of total</p>
            </div>
            <div className="p-3 bg-green-600 rounded-full">
              <FontAwesomeIcon icon={faArrowDown} className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        {/* Outgoing Calls */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-6 rounded-lg shadow-sm border border-orange-200 dark:border-orange-700 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-orange-600 dark:text-orange-400">Outgoing Calls</h3>
              <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">{formatNumber(summary.outgoingCalls)}</p>
              <p className="text-xs text-orange-500 dark:text-orange-400">{summary.outgoingPercentage.toFixed(1)}% of total</p>
            </div>
            <div className="p-3 bg-orange-600 rounded-full">
              <FontAwesomeIcon icon={faArrowUp} className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        {/* Unique Area Codes */}
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 p-6 rounded-lg shadow-sm border border-indigo-200 dark:border-indigo-700 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Unique Area Codes</h3>
              <p className="text-3xl font-bold text-indigo-700 dark:text-indigo-300">{formatNumber(summary.uniqueAreaCodes)}</p>
              <p className="text-xs text-indigo-500 dark:text-indigo-400">Geographic coverage</p>
            </div>
            <div className="p-3 bg-indigo-600 rounded-full">
              <FontAwesomeIcon icon={faMapMarkerAlt} className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        {/* Unique Extensions */}
        <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 p-6 rounded-lg shadow-sm border border-cyan-200 dark:border-cyan-700 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-cyan-600 dark:text-cyan-400">Unique Extensions</h3>
              <p className="text-3xl font-bold text-cyan-700 dark:text-cyan-300">{formatNumber(summary.uniqueExtensions)}</p>
              <p className="text-xs text-cyan-500 dark:text-cyan-400">Active users</p>
            </div>
            <div className="p-3 bg-cyan-600 rounded-full">
              <FontAwesomeIcon icon={faUsers} className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        {/* Total Cost */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-6 rounded-lg shadow-sm border border-red-200 dark:border-red-700 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-red-600 dark:text-red-400">Total Cost</h3>
              <p className="text-3xl font-bold text-red-700 dark:text-red-300">{formatCurrency(summary.totalCost)}</p>
              <p className="text-xs text-red-500 dark:text-red-400">Call expenses</p>
            </div>
            <div className="p-3 bg-red-600 rounded-full">
              <FontAwesomeIcon icon={faDollarSign} className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        {/* Total Call Time */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-lg shadow-sm border border-purple-200 dark:border-purple-700 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-purple-600 dark:text-purple-400">Total Call Time</h3>
              <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">{formatDuration(summary.totalDuration)}</p>
              <p className="text-xs text-purple-500 dark:text-purple-400">Sum of all calls</p>
            </div>
            <div className="p-3 bg-purple-600 rounded-full">
              <FontAwesomeIcon icon={faStopwatch} className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        {/* Average Duration */}
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 p-6 rounded-lg shadow-sm border border-yellow-200 dark:border-yellow-700 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Avg Duration</h3>
              <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-300">{formatDuration(summary.avgDuration)}</p>
              <p className="text-xs text-yellow-500 dark:text-yellow-400">Per call average</p>
            </div>
            <div className="p-3 bg-yellow-600 rounded-full">
              <FontAwesomeIcon icon={faClock} className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Data Visualization Section */}
      <div className="space-y-8">
        {/* Area Code Distribution - Full Width */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="text-indigo-600" />
                Area Code Distribution
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Call frequency by area code (Top 30) - Processed from {formatNumber(summary.totalCalls)} records</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">Unique Area Codes</p>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{formatNumber(summary.uniqueAreaCodes)}</p>
            </div>
          </div>
          
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={areaCodeDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="areaCode" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                  className="fill-gray-600 dark:fill-gray-400"
                />
                <YAxis fontSize={12} className="fill-gray-600 dark:fill-gray-400" />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="count" 
                  fill="#3B82F6" 
                  radius={[4, 4, 0, 0]}
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                  onClick={(data) => handleAreaCodeClick(data.areaCode)}
                >
                  <LabelList 
                    dataKey="count" 
                    position="top" 
                    fontSize={12}
                    className="fill-gray-700 dark:fill-gray-200"
                    formatter={(value: any) => formatNumber(value)}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Extensions Distribution - Full Width */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
                <FontAwesomeIcon icon={faUsers} className="text-green-600" />
                Extensions Distribution
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Call volume by extension (Top 30) - Real-time aggregation</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">Unique Extensions</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatNumber(summary.uniqueExtensions)}</p>
            </div>
          </div>
          
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={extensionDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="extension" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                  className="fill-gray-600 dark:fill-gray-400"
                />
                <YAxis fontSize={12} className="fill-gray-600 dark:fill-gray-400" />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="count" 
                  fill="#10B981" 
                  radius={[4, 4, 0, 0]}
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                  onClick={(data) => handleExtensionClick(data.extension)}
                >
                  <LabelList 
                    dataKey="count" 
                    position="top" 
                    fontSize={12}
                    className="fill-gray-700 dark:fill-gray-200"
                    formatter={(value: any) => formatNumber(value)}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Interactive Pie Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Area Codes Pie Chart */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="text-indigo-600" />
                Top 10 Area Codes
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Distribution by percentage</p>
            </div>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={areaCodeDistribution.slice(0, 10)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ areaCode, percentage }) => `${areaCode} (${percentage.toFixed(1)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                    onClick={(data) => handleAreaCodeClick(data.areaCode)}
                  >
                    {areaCodeDistribution.slice(0, 10).map((_entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]}
                        className="hover:opacity-80 transition-opacity cursor-pointer"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Extensions Pie Chart */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
                <FontAwesomeIcon icon={faUsers} className="text-green-600" />
                Top 10 Extensions
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Distribution by percentage</p>
            </div>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={extensionDistribution.slice(0, 10)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ extension, percentage }) => `${extension} (${percentage.toFixed(1)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                    onClick={(data) => handleExtensionClick(data.extension)}
                  >
                    {extensionDistribution.slice(0, 10).map((_entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]}
                        className="hover:opacity-80 transition-opacity cursor-pointer"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}