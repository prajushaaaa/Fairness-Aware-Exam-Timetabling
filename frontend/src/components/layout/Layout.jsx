import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { SampleDataNotice } from '../common/SampleDataNotice';
import { useTimetable } from '../../context/TimetableContext';

export const Layout = ({ children }) => {
  const { sidebarCollapsed } = useTimetable();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      <Sidebar />
      <div
        className={`flex-1 flex flex-col transition-all duration-200 ${
          sidebarCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <Header />
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          <SampleDataNotice />
          {children}
        </main>
        <footer className="border-t border-slate-200 bg-white py-3 px-6 text-center text-xs text-slate-400">
          Fairness-Aware University Examination Timetabling System &bull; Operations Research &amp; Mixed-Integer Programming
        </footer>
      </div>
    </div>
  );
};
