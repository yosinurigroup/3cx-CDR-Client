import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { useData } from '../contexts/DataContext'
import { useRealtime } from '../contexts/RealtimeContext'
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

// Area code to state mapping
const areaCodeToState: { [key: string]: string } = {
  '201': 'New Jersey', '202': 'District of Columbia', '203': 'Connecticut', '205': 'Alabama', '206': 'Washington',
  '207': 'Maine', '208': 'Idaho', '209': 'California', '210': 'Texas', '212': 'New York',
  '213': 'California', '214': 'Texas', '215': 'Pennsylvania', '216': 'Ohio', '217': 'Illinois',
  '218': 'Minnesota', '219': 'Indiana', '220': 'Ohio', '224': 'Illinois', '225': 'Louisiana',
  '228': 'Mississippi', '229': 'Georgia', '231': 'Michigan', '234': 'Ohio', '239': 'Florida',
  '240': 'Maryland', '248': 'Michigan', '251': 'Alabama', '252': 'North Carolina', '253': 'Washington',
  '254': 'Texas', '256': 'Alabama', '260': 'Indiana', '262': 'Wisconsin', '267': 'Pennsylvania',
  '269': 'Michigan', '270': 'Kentucky', '276': 'Virginia', '281': 'Texas', '283': 'Ohio',
  '301': 'Maryland', '302': 'Delaware', '303': 'Colorado', '304': 'West Virginia', '305': 'Florida',
  '307': 'Wyoming', '308': 'Nebraska', '309': 'Illinois', '310': 'California', '312': 'Illinois',
  '313': 'Michigan', '314': 'Missouri', '315': 'New York', '316': 'Kansas', '317': 'Indiana',
  '318': 'Louisiana', '319': 'Iowa', '320': 'Minnesota', '321': 'Florida', '323': 'California',
  '325': 'Texas', '330': 'Ohio', '331': 'Illinois', '334': 'Alabama', '336': 'North Carolina',
  '337': 'Louisiana', '339': 'Massachusetts', '340': 'US Virgin Islands', '341': 'California',
  '346': 'Texas', '347': 'New York', '351': 'Massachusetts', '352': 'Florida', '360': 'Washington',
  '361': 'Texas', '364': 'Kentucky', '380': 'Ohio', '385': 'Utah', '386': 'Florida',
  '401': 'Rhode Island', '402': 'Nebraska', '403': 'Alberta', '404': 'Georgia', '405': 'Oklahoma',
  '406': 'Montana', '407': 'Florida', '408': 'California', '409': 'Texas', '410': 'Maryland',
  '412': 'Pennsylvania', '413': 'Massachusetts', '414': 'Wisconsin', '415': 'California', '416': 'Ontario',
  '417': 'Missouri', '418': 'Quebec', '419': 'Ohio', '423': 'Tennessee', '424': 'California',
  '425': 'Washington', '430': 'Texas', '432': 'Texas', '434': 'Virginia', '435': 'Utah',
  '440': 'Ohio', '442': 'California', '443': 'Maryland', '458': 'Oregon', '469': 'Texas',
  '470': 'Georgia', '475': 'Connecticut', '478': 'Georgia', '479': 'Arkansas', '480': 'Arizona',
  '484': 'Pennsylvania', '501': 'Arkansas', '502': 'Kentucky', '503': 'Oregon', '504': 'Louisiana',
  '505': 'New Mexico', '507': 'Minnesota', '508': 'Massachusetts', '509': 'Washington', '510': 'California',
  '512': 'Texas', '513': 'Ohio', '515': 'Iowa', '516': 'New York', '517': 'Michigan',
  '518': 'New York', '520': 'Arizona', '530': 'California', '540': 'Virginia', '541': 'Oregon',
  '551': 'New Jersey', '559': 'California', '561': 'Florida', '562': 'California', '563': 'Iowa',
  '567': 'Ohio', '570': 'Pennsylvania', '571': 'Virginia', '573': 'Missouri', '574': 'Indiana',
  '575': 'New Mexico', '580': 'Oklahoma', '585': 'New York', '586': 'Michigan', '601': 'Mississippi',
  '602': 'Arizona', '603': 'New Hampshire', '605': 'South Dakota', '606': 'Kentucky', '607': 'New York',
  '608': 'Wisconsin', '609': 'New Jersey', '610': 'Pennsylvania', '612': 'Minnesota', '614': 'Ohio',
  '615': 'Tennessee', '616': 'Michigan', '617': 'Massachusetts', '618': 'Illinois', '619': 'California',
  '620': 'Kansas', '623': 'Arizona', '626': 'California', '628': 'California', '629': 'Tennessee',
  '630': 'Illinois', '631': 'New York', '636': 'Missouri', '641': 'Iowa', '646': 'New York',
  '650': 'California', '651': 'Minnesota', '657': 'California', '660': 'Missouri', '661': 'California',
  '662': 'Mississippi', '667': 'Maryland', '669': 'California', '678': 'Georgia', '681': 'West Virginia',
  '682': 'Texas', '701': 'North Dakota', '702': 'Nevada', '703': 'Virginia', '704': 'North Carolina',
  '706': 'Georgia', '707': 'California', '708': 'Illinois', '712': 'Iowa', '713': 'Texas',
  '714': 'California', '715': 'Wisconsin', '716': 'New York', '717': 'Pennsylvania', '718': 'New York',
  '719': 'Colorado', '720': 'Colorado', '724': 'Pennsylvania', '725': 'Nevada', '727': 'Florida',
  '731': 'Tennessee', '732': 'New Jersey', '734': 'Michigan', '737': 'Texas', '740': 'Ohio',
  '747': 'California', '754': 'Florida', '757': 'Virginia', '760': 'California', '762': 'Georgia',
  '763': 'Minnesota', '765': 'Indiana', '769': 'Mississippi', '770': 'Georgia', '772': 'Florida',
  '773': 'Illinois', '774': 'Massachusetts', '775': 'Nevada', '781': 'Massachusetts', '785': 'Kansas',
  '786': 'Florida', '787': 'Puerto Rico', '801': 'Utah', '802': 'Vermont', '803': 'South Carolina',
  '804': 'Virginia', '805': 'California', '806': 'Texas', '808': 'Hawaii', '810': 'Michigan',
  '812': 'Indiana', '813': 'Florida', '814': 'Pennsylvania', '815': 'Illinois', '816': 'Missouri',
  '817': 'Texas', '818': 'California', '828': 'North Carolina', '830': 'Texas', '831': 'California',
  '832': 'Texas', '843': 'South Carolina', '845': 'New York', '847': 'Illinois', '848': 'New Jersey',
  '850': 'Florida', '856': 'New Jersey', '857': 'Massachusetts', '858': 'California', '859': 'Kentucky',
  '860': 'Connecticut', '862': 'New Jersey', '863': 'Florida', '864': 'South Carolina', '865': 'Tennessee',
  '870': 'Arkansas', '872': 'Illinois', '878': 'Pennsylvania', '901': 'Tennessee', '903': 'Texas',
  '904': 'Florida', '906': 'Michigan', '907': 'Alaska', '908': 'New Jersey', '909': 'California',
  '910': 'North Carolina', '912': 'Georgia', '913': 'Kansas', '914': 'New York', '915': 'Texas',
  '916': 'California', '917': 'New York', '918': 'Oklahoma', '919': 'North Carolina', '920': 'Wisconsin',
  '925': 'California', '928': 'Arizona', '929': 'New York', '930': 'Indiana', '931': 'Tennessee',
  '934': 'New York', '936': 'Texas', '937': 'Ohio', '938': 'Alabama', '940': 'Texas',
  '941': 'Florida', '947': 'Michigan', '949': 'California', '951': 'California', '952': 'Minnesota',
  '954': 'Florida', '956': 'Texas', '959': 'Connecticut', '970': 'Colorado', '971': 'Oregon',
  '972': 'Texas', '973': 'New Jersey', '978': 'Massachusetts', '979': 'Texas', '980': 'North Carolina',
  '984': 'North Carolina', '985': 'Louisiana', '989': 'Michigan'
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { onMenuClick, isSidebarCollapsed, onToggleSidebar } = useOutletContext<any>();
  const { selectedDataSource } = useData()
  const { 
    isConnected, 
    dashboardData: realtimeData, 
    lastUpdate, 
    connectionStatus, 
    connect, 
    disconnect, 
    refreshData 
  } = useRealtime()
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [enableRealtime, setEnableRealtime] = useState(true)

  // Initial data fetch and real-time connection setup
  useEffect(() => {
    fetchDashboardData()
    
    // Connect to real-time updates if enabled
    if (enableRealtime && selectedDataSource) {
      connect(selectedDataSource)
    }
    
    return () => {
      if (isConnected) {
        disconnect()
      }
    }
  }, [selectedDataSource, enableRealtime])

  // Use real-time data when available, fallback to fetched data
  useEffect(() => {
    if (realtimeData && enableRealtime) {
      console.log('📊 Real-time data received, updating dashboard:', realtimeData);
      setData(realtimeData)
      setIsLoading(false)
      setError(null)
    }
  }, [realtimeData, enableRealtime])

  // Force re-render when real-time data changes
  const displayData = enableRealtime && realtimeData ? realtimeData : data;

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

  const pluralize = (n: number, singular: string, plural: string) => `${n} ${n === 1 ? singular : plural}`

  const handleRefresh = () => {
    if (enableRealtime && isConnected) {
      refreshData()
    } else {
      fetchDashboardData()
    }
  }

  const toggleRealtime = () => {
    setEnableRealtime(!enableRealtime)
    if (!enableRealtime && selectedDataSource) {
      connect(selectedDataSource)
    } else if (enableRealtime) {
      disconnect()
    }
  }

  // Handle area code click to navigate to filtered call logs
  const handleAreaCodeClick = (areaCode: string) => {
    navigate(`/reports/call-logs?areaCode=${encodeURIComponent(areaCode)}`)
  }

  // Handle extension click to navigate to filtered call logs
  const handleExtensionClick = (extension: string) => {
    navigate(`/reports/call-logs?extension=${encodeURIComponent(extension)}`)
  }

  // Handle state click to navigate to area codes filtered by state
  const handleStateClick = (state: string) => {
    navigate(`/reports/area-codes?state=${encodeURIComponent(state)}`)
  }

  // Normalize area code to 3-digit NPA (e.g., "+1 (323)" -> "323")
  const normalizeAreaCode = (ac: string) => {
    const digits = (ac || '').replace(/\D/g, '')
    if (digits.length >= 4 && digits.startsWith('1')) return digits.slice(1, 4)
    return digits.slice(0, 3)
  }

  // Compute states distribution and total unique codes from area codes
  const computeStatesData = () => {
    if (!displayData?.areaCodeDistribution) return { statesArray: [] as any[], totalUniqueCodes: 0 }

    const stateMap: { [state: string]: { count: number, areaCodes: Set<string> } } = {}
    const allCodes = new Set<string>()

    displayData.areaCodeDistribution.forEach((item: any) => {
      const raw = item.areaCode
      if (!raw || raw === 'null' || raw === '0' || String(raw).trim() === '') return
      const npa = normalizeAreaCode(String(raw))
      if (!npa) return
      const state = areaCodeToState[npa] || 'Unknown'

      if (!stateMap[state]) stateMap[state] = { count: 0, areaCodes: new Set() }
      stateMap[state].count += item.count
      stateMap[state].areaCodes.add(npa)
      allCodes.add(npa)
    })

    const statesArray = Object.entries(stateMap).map(([state, s]) => ({
      state,
      count: s.count,
      areaCodesCount: s.areaCodes.size,
      percentage: 0
    }))

    const totalCalls = statesArray.reduce((sum, item) => sum + item.count, 0)
    statesArray.forEach(item => { item.percentage = totalCalls ? (item.count / totalCalls) * 100 : 0 })

    statesArray.sort((a, b) => b.count - a.count)
    return { statesArray, totalUniqueCodes: allCodes.size }
  }

  // Memoized states data for the pie chart and totals
  const { statesArray: statesData } = useMemo(() => computeStatesData(), [data])
  const totalStateCalls = useMemo(() => statesData.reduce((sum: number, s: { count: number }) => sum + s.count, 0), [statesData])
  const displayedStates = useMemo(() => statesData.slice(0, 9), [statesData])

  // Render labels outside with minimal clutter (hide small slices)
  const renderStateLabel = ({ cx, cy, midAngle, outerRadius, percentage, state }: any) => {
    // Skip labels for very small slices to reduce clutter
    if (!percentage || percentage < 3) return null
    const RADIAN = Math.PI / 180
    const radius = outerRadius + 16
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)
    return (
      <text x={x} y={y} fill="currentColor" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-[11px] sm:text-xs">
        {`${state} (${percentage.toFixed(1)}%)`}
      </text>
    )
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

  // Custom tooltip component for states pie chart
  const StateTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 min-w-[200px]">
          <div className="font-semibold text-gray-900 dark:text-white mb-2 text-center">
            {data.state}
          </div>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Calls:</span>
              <span className="font-medium text-blue-600 dark:text-blue-400">{formatNumber(data.count)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Percentage:</span>
              <span className="font-medium text-green-600 dark:text-green-400">{data.percentage.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Area Codes:</span>
              <span className="font-medium text-purple-600 dark:text-purple-400">{data.areaCodesCount}</span>
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

  if (!displayData) {
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

  const { summary, areaCodeDistribution: rawAreaCodeDistribution, extensionDistribution: rawExtensionDistribution } = displayData
  
  // Filter out null/empty area codes for display only
  const areaCodeDistribution = rawAreaCodeDistribution.filter((item: any) => 
    item.areaCode && item.areaCode !== 'null' && item.areaCode !== '0' && item.areaCode.trim() !== ''
  )
  
  // Filter out empty/null extensions (incoming calls have blank extensions)
  const extensionDistribution = rawExtensionDistribution.filter((item: any) => 
    item.extension && item.extension !== 'null' && item.extension !== '0' && item.extension.trim() !== ''
  )
  
  // Keep original summary count (don't modify it)
  const updatedSummary = {
    ...summary,
    uniqueAreaCodes: summary.uniqueAreaCodes - 1 // Just subtract 1 for the empty area code
  }

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
        <div className="flex items-center gap-3">
          {/* Real-time Connection Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border">
            {connectionStatus === 'connected' && (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-700 dark:text-green-400">Live</span>
              </>
            )}
            {connectionStatus === 'connecting' && (
              <>
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <span className="text-yellow-700 dark:text-yellow-400">Connecting</span>
              </>
            )}
            {connectionStatus === 'disconnected' && (
              <>
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-400">Offline</span>
              </>
            )}
            {connectionStatus === 'error' && (
              <>
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-red-700 dark:text-red-400">Error</span>
              </>
            )}
          </div>

          {/* Last Update Time */}
          {lastUpdate && enableRealtime && (
            <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
              Updated: {new Date(lastUpdate).toLocaleTimeString()}
            </div>
          )}

          {/* Real-time Toggle */}
          <button
            onClick={toggleRealtime}
            className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              enableRealtime
                ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
            }`}
          >
            <FontAwesomeIcon 
              icon={enableRealtime ? faArrowUp : faArrowDown} 
              className="h-3 w-3 mr-1.5" 
            />
            {enableRealtime ? 'Live' : 'Manual'}
          </button>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <FontAwesomeIcon icon={faSync} className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {/* Total Calls */}
        <div 
          className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border border-blue-200 dark:border-blue-700 hover:shadow-md transition-all duration-200 cursor-pointer min-h-[120px] flex flex-col justify-between"
          onClick={() => navigate('/reports/call-logs')}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 truncate">Total Calls</h3>
              <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-blue-700 dark:text-blue-300 leading-tight">{formatNumber(summary.totalCalls)}</p>
            </div>
            <div className="p-2 sm:p-3 bg-blue-600 rounded-full flex-shrink-0 ml-2">
              <FontAwesomeIcon icon={faPhone} className="h-3 w-3 sm:h-4 sm:w-4 lg:h-6 lg:w-6 text-white" />
            </div>
          </div>
          <p className="text-xs text-blue-500 dark:text-blue-400 truncate">All records</p>
        </div>
        
        {/* Outgoing Calls */}
        <div 
          className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border border-orange-200 dark:border-orange-700 hover:shadow-md transition-all duration-200 cursor-pointer min-h-[120px] flex flex-col justify-between"
          onClick={() => navigate('/reports/call-logs?type=outgoing')}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-xs sm:text-sm font-medium text-orange-600 dark:text-orange-400 truncate">Outgoing Calls</h3>
              <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-orange-700 dark:text-orange-300 leading-tight">{formatNumber(summary.outgoingCalls)}</p>
            </div>
            <div className="p-2 sm:p-3 bg-orange-600 rounded-full flex-shrink-0 ml-2">
              <FontAwesomeIcon icon={faArrowUp} className="h-3 w-3 sm:h-4 sm:w-4 lg:h-6 lg:w-6 text-white" />
            </div>
          </div>
          <p className="text-xs text-orange-500 dark:text-orange-400 truncate">{summary.outgoingPercentage.toFixed(1)}% of total</p>
        </div>

        {/* Unique Area Codes */}
        <div 
          className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border border-indigo-200 dark:border-indigo-700 hover:shadow-md transition-all duration-200 cursor-pointer min-h-[120px] flex flex-col justify-between"
          onClick={() => navigate('/reports/area-codes')}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-xs sm:text-sm font-medium text-indigo-600 dark:text-indigo-400 truncate">Area Codes</h3>
              <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-indigo-700 dark:text-indigo-300 leading-tight">{formatNumber(updatedSummary.uniqueAreaCodes)}</p>
            </div>
            <div className="p-2 sm:p-3 bg-indigo-600 rounded-full flex-shrink-0 ml-2">
              <FontAwesomeIcon icon={faMapMarkerAlt} className="h-3 w-3 sm:h-4 sm:w-4 lg:h-6 lg:w-6 text-white" />
            </div>
          </div>
          <p className="text-xs text-indigo-500 dark:text-indigo-400 truncate">Geographic coverage</p>
        </div>

        {/* Total Cost */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border border-red-200 dark:border-red-700 hover:shadow-md transition-all duration-200 min-h-[120px] flex flex-col justify-between">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-xs sm:text-sm font-medium text-red-600 dark:text-red-400 truncate">Total Cost</h3>
              <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-red-700 dark:text-red-300 leading-tight">{formatCurrency(summary.totalCost)}</p>
            </div>
            <div className="p-2 sm:p-3 bg-red-600 rounded-full flex-shrink-0 ml-2">
              <FontAwesomeIcon icon={faDollarSign} className="h-3 w-3 sm:h-4 sm:w-4 lg:h-6 lg:w-6 text-white" />
            </div>
          </div>
          <p className="text-xs text-red-500 dark:text-red-400 truncate">Call expenses</p>
        </div>

        {/* Total Call Time */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border border-purple-200 dark:border-purple-700 hover:shadow-md transition-all duration-200 min-h-[120px] flex flex-col justify-between">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-xs sm:text-sm font-medium text-purple-600 dark:text-purple-400 truncate">Call Time</h3>
              <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-purple-700 dark:text-purple-300 leading-tight">{formatDuration(summary.totalDuration)}</p>
            </div>
            <div className="p-2 sm:p-3 bg-purple-600 rounded-full flex-shrink-0 ml-2">
              <FontAwesomeIcon icon={faStopwatch} className="h-3 w-3 sm:h-4 sm:w-4 lg:h-6 lg:w-6 text-white" />
            </div>
          </div>
          <p className="text-xs text-purple-500 dark:text-purple-400 truncate">Sum of all calls</p>
        </div>

        {/* Incoming Calls */}
        <div 
          className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border border-green-200 dark:border-green-700 hover:shadow-md transition-all duration-200 cursor-pointer min-h-[120px] flex flex-col justify-between"
          onClick={() => navigate('/reports/call-logs?type=incoming')}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400 truncate">Incoming Calls</h3>
              <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-green-700 dark:text-green-300 leading-tight">{formatNumber(summary.incomingCalls)}</p>
            </div>
            <div className="p-2 sm:p-3 bg-green-600 rounded-full flex-shrink-0 ml-2">
              <FontAwesomeIcon icon={faArrowDown} className="h-3 w-3 sm:h-4 sm:w-4 lg:h-6 lg:w-6 text-white" />
            </div>
          </div>
          <p className="text-xs text-green-500 dark:text-green-400 truncate">{summary.incomingPercentage.toFixed(1)}% of total</p>
        </div>

        {/* Unique Extensions */}
        <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border border-cyan-200 dark:border-cyan-700 hover:shadow-md transition-all duration-200 min-h-[120px] flex flex-col justify-between">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-xs sm:text-sm font-medium text-cyan-600 dark:text-cyan-400 truncate">Extensions</h3>
              <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-cyan-700 dark:text-cyan-300 leading-tight">{formatNumber(summary.uniqueExtensions)}</p>
            </div>
            <div className="p-2 sm:p-3 bg-cyan-600 rounded-full flex-shrink-0 ml-2">
              <FontAwesomeIcon icon={faUsers} className="h-3 w-3 sm:h-4 sm:w-4 lg:h-6 lg:w-6 text-white" />
            </div>
          </div>
          <p className="text-xs text-cyan-500 dark:text-cyan-400 truncate">Active users</p>
        </div>

        

        {/* Average Duration */}
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border border-yellow-200 dark:border-yellow-700 hover:shadow-md transition-all duration-200 min-h-[120px] flex flex-col justify-between">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-xs sm:text-sm font-medium text-yellow-600 dark:text-yellow-400 truncate">Avg Duration</h3>
              <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-yellow-700 dark:text-yellow-300 leading-tight">{formatDuration(summary.avgDuration)}</p>
            </div>
            <div className="p-2 sm:p-3 bg-yellow-600 rounded-full flex-shrink-0 ml-2">
              <FontAwesomeIcon icon={faClock} className="h-3 w-3 sm:h-4 sm:w-4 lg:h-6 lg:w-6 text-white" />
            </div>
          </div>
          <p className="text-xs text-yellow-500 dark:text-yellow-400 truncate">Per call average</p>
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
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{formatNumber(updatedSummary.uniqueAreaCodes)}</p>
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
                  tick={{ fill: 'currentColor' }}
                />
                <YAxis fontSize={12} tick={{ fill: 'currentColor' }} />
                <Tooltip content={<CustomTooltip />} wrapperStyle={{ zIndex: 9999 }} />
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
                  tick={{ fill: 'currentColor' }}
                />
                <YAxis fontSize={12} tick={{ fill: 'currentColor' }} />
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

        {/* States Distribution - Amazing Layout */}
        <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 dark:from-gray-800 dark:via-gray-800/90 dark:to-gray-900/80 p-8 rounded-2xl shadow-xl border border-blue-100/50 dark:border-gray-700/50 backdrop-blur-sm">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="text-white text-xl" />
              </div>
              States Distribution
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mt-2 text-lg">Geographic call analysis across US states</p>
          </div>

          {/* Main Content - Pie Left, Summaries Right */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 items-start">
            
            {/* Left Side - Enhanced Pie Chart */}
            <div className="relative">
              <div className="relative h-[500px] group">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      {COLORS.map((color, idx) => (
                        <linearGradient key={idx} id={`gradient-${idx}`} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor={color} stopOpacity={1} />
                          <stop offset="100%" stopColor={color} stopOpacity={0.7} />
                        </linearGradient>
                      ))}
                    </defs>
                    <Pie
                      data={statesData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderStateLabel}
                      outerRadius={180}
                      innerRadius={100}
                      paddingAngle={3}
                      fill="#8884d8"
                      dataKey="count"
                      animationBegin={0}
                      animationDuration={1200}
                      onClick={(data) => handleStateClick(data.state)}
                    >
                      {statesData.map((_entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={`url(#gradient-${index % COLORS.length})`}
                          stroke="rgba(255,255,255,0.8)"
                          strokeWidth={2}
                          className="hover:opacity-90 transition-all duration-300 cursor-pointer drop-shadow-lg"
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<StateTooltip />} wrapperStyle={{ zIndex: 9999 }} />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Animated Center Summary */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/50 dark:border-gray-700/50">
                    <div className="text-sm font-medium uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2">Total Calls</div>
                    <div className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      {formatNumber(totalStateCalls)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Across {statesData.length} states
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Rich Summaries */}
            <div className="space-y-6">
              
              {/* Key Metrics Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-2xl text-white shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-indigo-100 text-sm font-medium">Unique States</div>
                      <div className="text-3xl font-bold">{formatNumber(statesData.length)}</div>
                    </div>
                    <div className="p-3 bg-white/20 rounded-xl">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="text-2xl" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-6 rounded-2xl text-white shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-blue-100 text-sm font-medium">Area Codes</div>
                      <div className="text-3xl font-bold">{formatNumber(summary.uniqueAreaCodes)}</div>
                    </div>
                    <div className="p-3 bg-white/20 rounded-xl">
                      <FontAwesomeIcon icon={faPhone} className="text-2xl" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Top States List with Enhanced Design */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/50 dark:border-gray-700/50">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                  <div className="w-2 h-8 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></div>
                  Top States by Call Volume
                </h3>
                
                <div className="space-y-4">
                  {displayedStates.slice(0, 6).map((s: any, idx: number) => {
                    const color = COLORS[idx % COLORS.length]
                    return (
                      <div key={s.state} className="group hover:bg-gray-50/80 dark:hover:bg-gray-700/50 p-4 rounded-xl transition-all duration-300 cursor-pointer border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800" onClick={() => handleStateClick(s.state)}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-4 h-4 rounded-full shadow-lg" style={{ backgroundColor: color }}></div>
                              <div className="absolute inset-0 w-4 h-4 rounded-full animate-ping opacity-20" style={{ backgroundColor: color }}></div>
                            </div>
                            <span className="font-semibold text-gray-900 dark:text-white text-lg">{s.state}</span>
                            <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium">
                              #{idx + 1}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-gray-900 dark:text-white">{s.percentage.toFixed(1)}%</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{formatNumber(s.count)} calls</div>
                          </div>
                        </div>
                        
                        {/* Animated Progress Bar */}
                        <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out"
                            style={{ 
                              width: `${Math.max(3, s.percentage)}%`, 
                              background: `linear-gradient(90deg, ${color}, ${color}80)`
                            }}
                          />
                          <div 
                            className="absolute inset-y-0 left-0 rounded-full opacity-50 animate-pulse"
                            style={{ 
                              width: `${Math.max(3, s.percentage)}%`, 
                              backgroundColor: color
                            }}
                          />
                        </div>
                        
                        <div className="mt-3 flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            {pluralize(s.areaCodesCount, 'area code', 'area codes')}
                          </span>
                          <span className="text-indigo-600 dark:text-indigo-400 font-medium group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">
                            View Details →
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Coverage Summary */}
              <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20 p-6 rounded-2xl border border-emerald-200/50 dark:border-emerald-700/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-emerald-500 rounded-lg">
                    <FontAwesomeIcon icon={faChartBar} className="text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">Coverage Analysis</h4>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{((totalStateCalls / summary.totalCalls) * 100).toFixed(1)}%</div>
                    <div className="text-sm text-emerald-700 dark:text-emerald-300">Call Coverage</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatNumber(summary.totalCalls - totalStateCalls)}</div>
                    <div className="text-sm text-emerald-700 dark:text-emerald-300">Other Calls</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}