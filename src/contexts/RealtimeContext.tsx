import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface DashboardData {
  summary: {
    totalCalls: number;
    incomingCalls: number;
    outgoingCalls: number;
    uniqueAreaCodes: number;
    uniqueExtensions: number;
    totalCost: number;
    totalDuration: number;
    avgDuration: number;
    incomingPercentage: number;
    outgoingPercentage: number;
  };
  areaCodeDistribution: Array<{
    areaCode: string;
    count: number;
    totalCost: number;
    totalDuration: number;
    percentage: number;
  }>;
  extensionDistribution: Array<{
    extension: string;
    count: number;
    incomingCalls: number;
    outgoingCalls: number;
    totalDuration: number;
    percentage: number;
  }>;
}

interface RealtimeMessage {
  type: 'connected' | 'heartbeat' | 'dashboard-update';
  data?: DashboardData;
  timestamp: string;
  connectionId?: string;
  collection?: string;
}

interface RealtimeContextType {
  isConnected: boolean;
  dashboardData: DashboardData | null;
  lastUpdate: string | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  connect: (collection: string) => void;
  disconnect: () => void;
  refreshData: () => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

interface RealtimeProviderProps {
  children: ReactNode;
}

export const RealtimeProvider: React.FC<RealtimeProviderProps> = ({ children }) => {
  const { token } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentCollectionRef = useRef<string | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = (collection: string) => {
    if (!token) {
      console.warn('🔐 Cannot connect to realtime updates: No authentication token');
      return;
    }

    // Don't reconnect if already connected to the same collection
    if (eventSourceRef.current && currentCollectionRef.current === collection && isConnected) {
      return;
    }

    // Disconnect existing connection
    disconnect();

    currentCollectionRef.current = collection;
    setConnectionStatus('connecting');

    try {
      const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:9000';
      
      const url = `${baseUrl}/api/realtime/dashboard-stream?collection=${encodeURIComponent(collection)}&token=${encodeURIComponent(token)}`;
      
      console.log(`📡 Connecting to realtime stream: ${url}`);
      
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('✅ Realtime connection established');
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          const message: RealtimeMessage = JSON.parse(event.data);
          
          switch (message.type) {
            case 'connected':
              console.log('🔗 Realtime connection confirmed:', message.connectionId);
              break;
              
            case 'heartbeat':
              // Silent heartbeat
              break;
              
            case 'dashboard-update':
              if (message.data) {
                console.log('📊 Dashboard data updated via realtime');
                setDashboardData(message.data);
                setLastUpdate(message.timestamp);
              }
              break;
              
            default:
              console.log('📨 Unknown realtime message type:', message.type);
          }
        } catch (error) {
          console.error('❌ Error parsing realtime message:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('❌ Realtime connection error:', error);
        setIsConnected(false);
        setConnectionStatus('error');
        
        // Attempt to reconnect with exponential backoff
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          console.log(`🔄 Attempting to reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect(collection);
          }, delay);
        } else {
          console.error('💔 Max reconnection attempts reached');
          setConnectionStatus('disconnected');
        }
      };

    } catch (error) {
      console.error('❌ Failed to create realtime connection:', error);
      setConnectionStatus('error');
    }
  };

  const disconnect = () => {
    if (eventSourceRef.current) {
      console.log('🔌 Disconnecting from realtime stream');
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionStatus('disconnected');
    currentCollectionRef.current = null;
    reconnectAttemptsRef.current = 0;
  };

  const refreshData = () => {
    // Force a refresh by briefly disconnecting and reconnecting
    if (currentCollectionRef.current) {
      const collection = currentCollectionRef.current;
      disconnect();
      setTimeout(() => connect(collection), 100);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  // Reconnect when token changes
  useEffect(() => {
    if (token && currentCollectionRef.current) {
      connect(currentCollectionRef.current);
    } else if (!token) {
      disconnect();
    }
  }, [token]);

  const contextValue: RealtimeContextType = {
    isConnected,
    dashboardData,
    lastUpdate,
    connectionStatus,
    connect,
    disconnect,
    refreshData
  };

  return (
    <RealtimeContext.Provider value={contextValue}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = (): RealtimeContextType => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};

export default RealtimeContext;
