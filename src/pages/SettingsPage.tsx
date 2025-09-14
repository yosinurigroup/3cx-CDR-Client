

import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import DynamicHeader from '../components/DynamicHeader'
import {
 getDataSourceNames,
 setDataSourceNames,
 resetDataSourceNamesToDefault,
 getDataSourceOptions
} from '../services/settingsService'

type TabKey = 'database' // extend later with more keys

interface LayoutContext {
 onMenuClick: () => void
 isSidebarCollapsed: boolean
 onToggleSidebar: () => void
}

export default function SettingsPage() {
 // Layout controls from parent (for sidebar toggle)
 const { onMenuClick, isSidebarCollapsed, onToggleSidebar } = useOutletContext<LayoutContext>()

 // Tabs
 const [activeTab, setActiveTab] = useState<TabKey>('database')

 // Database naming state
 const [names, setNames] = useState(getDataSourceNames())
 const [saving, setSaving] = useState(false)
 const [saved, setSaved] = useState(false)

 const options = getDataSourceOptions()

 const handleChange = (key: keyof typeof names, value: string) => {
   setNames(prev => ({ ...prev, [key]: value }))
 }

 const handleSave = async () => {
   setSaving(true)
   try {
     setDataSourceNames(names)
     setSaved(true)
     setTimeout(() => setSaved(false), 2000)
   } finally {
     setSaving(false)
   }
 }

 const handleReset = () => {
   resetDataSourceNamesToDefault()
   setNames(getDataSourceNames())
   setSaved(true)
   setTimeout(() => setSaved(false), 2000)
 }

 const tabs: Array<{ key: TabKey; label: string; icon: JSX.Element }> = [
   {
     key: 'database',
     label: 'Database',
     icon: (
       <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
         <path d="M12 2C7.582 2 4 3.79 4 6v12c0 2.21 3.582 4 8 4s8-1.79 8-4V6c0-2.21-3.582-4-8-4zm0 2c3.86 0 6 .99 6 2s-2.14 2-6 2-6-.99-6-2 2.14-2 6-2zm0 6c3.86 0 6 .99 6 2s-2.14 2-6 2-6-.99-6-2 2.14-2 6-2zm0 6c3.86 0 6 .99 6 2s-2.14 2-6 2-6-.99-6-2 2.14-2 6-2z"/>
       </svg>
     )
   }
 ]

 return (
   <div className="min-h-screen flex flex-col">
     <DynamicHeader
       title="System Settings"
       onMenuClick={onMenuClick}
       isSidebarCollapsed={isSidebarCollapsed}
       onToggleSidebar={onToggleSidebar}
       showSearch={false}
     />
     <div className="px-6 py-4">

     {/* Tabs header */}
     <div className="mb-4 overflow-x-auto">
       <div className="inline-flex min-w-full gap-2 rounded-xl bg-gray-100/70 dark:bg-gray-800/70 p-1 ring-1 ring-gray-200 dark:ring-gray-700">
         {tabs.map(t => (
           <button
             key={t.key}
             type="button"
             onClick={() => setActiveTab(t.key)}
             className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
               activeTab === t.key
                 ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow'
                 : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
             }`}
             aria-selected={activeTab === t.key}
             role="tab"
           >
             {t.icon}
             {t.label}
           </button>
         ))}
         {/* Add tab button placeholder for future expansion */}
         <button
           type="button"
           className="ml-1 inline-flex items-center px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
           title="More tabs coming soon"
           disabled
         >
           +
         </button>
       </div>
     </div>

     {/* Tab panels */}
     {activeTab === 'database' && (
       <div
         role="tabpanel"
         aria-labelledby="tab-database"
         className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700"
       >
         <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Data Source Names</h2>
         <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
           These names are shown in the sidebar and user permissions. Refresh the page to see updates across the app.
         </p>

         <div className="grid grid-cols-1 gap-5">
           <div>
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
               Data Source 1
             </label>
             <input
               type="text"
               value={names['cdrs_143.198.0.104']}
               onChange={(e) => handleChange('cdrs_143.198.0.104', e.target.value)}
               placeholder="Option 1"
               className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
             />
             <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
               Preview: {options.find(o => o.value === 'cdrs_143.198.0.104')?.label}
             </p>
           </div>

           <div>
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
               Data Source 2
             </label>
             <input
               type="text"
               value={names['cdrs_167.71.120.52']}
               onChange={(e) => handleChange('cdrs_167.71.120.52', e.target.value)}
               placeholder="Option 2"
               className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
             />
             <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
               Preview: {options.find(o => o.value === 'cdrs_167.71.120.52')?.label}
             </p>
           </div>
         </div>

         <div className="mt-6 flex items-center gap-3">
           <button
             onClick={handleSave}
             disabled={saving}
             className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
           >
             {saving ? 'Saving...' : 'Save Changes'}
           </button>
           <button
             onClick={handleReset}
             className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors shadow-sm"
           >
             Reset to Default
           </button>
           {saved && (
             <span className="text-sm text-green-600 dark:text-green-400">Saved</span>
           )}
         </div>
       </div>
     )}
     </div>
   </div>
 )
}