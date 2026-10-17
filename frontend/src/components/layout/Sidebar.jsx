import React from 'react';
import {
  LayoutDashboard,
  UploadCloud,
  Cpu,
  CalendarDays,
  GitCompare,
  Scale,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  RefreshCw,
} from 'lucide-react';
import { useTimetable } from '../../context/TimetableContext';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'input', label: 'Input Data', icon: UploadCloud },
  { id: 'generate', label: 'Generate Timetable', icon: Cpu },
  { id: 'results', label: 'Results & Comparison', icon: CalendarDays },
];

export const Sidebar = () => {
  const {
    activeTab,
    setActiveTab,
    sidebarCollapsed,
    setSidebarCollapsed,
    backendHealth,
    checkHealth,
  } = useTimetable();

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-30 bg-white border-r border-slate-200 flex flex-col transition-all duration-200 ${
        sidebarCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* University Branding / Header */}
      <div className="h-16 border-b border-slate-200 flex items-center justify-between px-4 bg-slate-50/50">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-lg bg-[#9E1B32] text-white flex items-center justify-center shrink-0 shadow-xs">
            <GraduationCap className="w-6 h-6" />
          </div>
          {!sidebarCollapsed && (
            <div className="truncate">
              <h1 className="text-sm font-bold text-slate-900 tracking-tight leading-tight">
                ExamTimetable
              </h1>
              <p className="text-[11px] text-slate-500 font-medium truncate">
                Fairness OR Engine
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {!sidebarCollapsed ? 'Main Menu' : '•••'}
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={sidebarCollapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors text-left cursor-pointer ${
                isActive
                  ? 'bg-red-50 text-[#9E1B32] font-semibold border-l-4 border-[#9E1B32]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-l-4 border-transparent'
              }`}
            >
              <Icon
                className={`w-5 h-5 shrink-0 ${
                  isActive ? 'text-[#9E1B32]' : 'text-slate-400 group-hover:text-slate-600'
                }`}
              />
              {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Backend Connection Status Footer */}
      <div className="p-3 border-t border-slate-200 bg-slate-50">
        <div
          className={`rounded-md p-2.5 border transition-all ${
            backendHealth.status === 'online'
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
              : backendHealth.status === 'checking'
              ? 'bg-slate-100 border-slate-200 text-slate-600'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                {backendHealth.status === 'online' && (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </>
                )}
                {backendHealth.status === 'checking' && (
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-400"></span>
                )}
                {backendHealth.status === 'offline' && (
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                )}
              </span>
              {!sidebarCollapsed && (
                <div className="truncate text-xs">
                  <span className="font-semibold block truncate">
                    {backendHealth.status === 'online'
                      ? 'Flask API Online'
                      : backendHealth.status === 'checking'
                      ? 'Checking API...'
                      : 'API Disconnected'}
                  </span>
                  <span className="text-[10px] text-slate-500 truncate block">
                    {backendHealth.status === 'online' ? ':5000/api/health' : 'Run backend/app.py'}
                  </span>
                </div>
              )}
            </div>
            {!sidebarCollapsed && (
              <button
                onClick={checkHealth}
                title="Refresh health check"
                className="p-1 hover:bg-white/80 rounded text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    backendHealth.status === 'checking' ? 'animate-spin' : ''
                  }`}
                />
              </button>
            )}
          </div>
        </div>

        {/* Sidebar Collapse Toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="mt-2 w-full flex items-center justify-center p-1.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded transition-colors cursor-pointer"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <div className="flex items-center gap-1.5">
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Collapse Menu</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};
