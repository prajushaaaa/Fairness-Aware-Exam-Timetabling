import React from 'react';
import { Eye, EyeOff, Database, CheckCircle } from 'lucide-react';
import { useTimetable } from '../../context/TimetableContext';

const PAGE_TITLES = {
  dashboard: {
    title: 'Examination Timetabling Dashboard',
    subtitle: 'Fairness-aware university examination scheduling with Operations Research',
  },
  input: {
    title: 'Input Examination Data',
    subtitle: 'Provide exam_id, student_id course registrations and available time slots',
  },
  generate: {
    title: 'Generate Timetable',
    subtitle: 'Select between Greedy Heuristic, Standard ILP, and Fairness-Aware ILP',
  },
  results: {
    title: 'Results & Comparison',
    subtitle: 'Generated examination schedule and comparative algorithmic performance metrics',
  },
};

export const Header = () => {
  const { activeTab, previewMode, enableSamplePreview, disableSamplePreview, dataset } = useTimetable();
  const pageInfo = PAGE_TITLES[activeTab] || { title: 'Dashboard', subtitle: '' };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20 px-6 py-3.5 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Page Title & Breadcrumb */}
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#9E1B32]">
            <span>University Administration</span>
            <span>/</span>
            <span className="text-slate-500 capitalize">{activeTab}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
            {pageInfo.title}
          </h2>
          <p className="text-xs text-slate-500">{pageInfo.subtitle}</p>
        </div>

        {/* Top Actions & Status */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Dataset Status Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs border bg-slate-50 border-slate-200">
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-600 font-medium">Dataset:</span>
            {previewMode ? (
              <span className="font-semibold text-amber-700">Demonstration Preview (Small Demo)</span>
            ) : dataset.isUploaded ? (
              <span className="font-semibold text-emerald-700 flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-600 inline" /> {dataset.name || 'Synthetic Dataset — Demonstration University'} ({dataset.statistics?.numExaminations || 0} exams)
              </span>
            ) : (
              <span className="text-slate-400 italic">No dataset loaded</span>
            )}
          </div>

          {/* UI Preview Mode Toggle Button */}
          <button
            type="button"
            onClick={() => {
              if (previewMode) {
                disableSamplePreview();
              } else {
                enableSamplePreview();
              }
            }}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold border transition-all cursor-pointer ${
              previewMode
                ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            {previewMode ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-amber-700" />
                <span>Disable UI Preview</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span>Preview with Sample Data</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
