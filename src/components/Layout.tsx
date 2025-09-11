import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import Sidebar from './Sidebar'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar 
        open={sidebarOpen} 
        setOpen={setSidebarOpen} 
        isCollapsed={isSidebarCollapsed} 
        setCollapsed={setIsSidebarCollapsed} 
      />
      
      {/* Main content */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        {/* Page content - Outlet will handle its own header */}
        <main className="flex-1 flex flex-col min-h-0">
          <Outlet context={{ 
            onMenuClick: () => setSidebarOpen(true),
            isSidebarCollapsed: isSidebarCollapsed,
            onToggleSidebar: () => setIsSidebarCollapsed(!isSidebarCollapsed)
          }} />
        </main>
      </div>
    </div>
  )
}