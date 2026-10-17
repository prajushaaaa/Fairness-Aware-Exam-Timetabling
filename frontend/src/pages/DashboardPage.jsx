import React from 'react';
import {
  BookOpen,
  Users,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  CalendarDays,
  FileText,
  Scale,
  Sparkles,
} from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { useTimetable } from '../context/TimetableContext';

export const DashboardPage = () => {
  const {
    currentStats,
    isDataAvailable,
    previewMode,
    enableSamplePreview,
    dataset,
    loadSyntheticDataset,
    loadDemonstrationDataset,
    setActiveTab,
    backendHealth,
  } = useTimetable();

  return (
    <div className="space-y-6">
      {/* Institutional Banner */}
      <div className="bg-gradient-to-r from-[#9E1B32] to-[#6f1424] rounded-lg p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/10 text-xs font-medium tracking-wide mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-red-200" />
            <span>Operations Research Timetabling Mini-Project</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
            Fairness-Aware Examination Timetabling System
          </h2>
          <p className="text-sm text-red-100 max-w-2xl mt-1 leading-relaxed">
            Optimizing examination schedules by balancing overall institutional penalty with student workload equity.
            Designed to prevent severe consecutive exam burdens using mathematical programming.
          </p>
        </div>
        <div className="shrink-0 flex flex-wrap gap-2">
          {!isDataAvailable && (
            <button
              onClick={loadDemonstrationDataset}
              className="px-3.5 py-2 bg-white text-[#9E1B32] hover:bg-red-50 text-xs font-bold rounded-md shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Load Demonstration Dataset
            </button>
          )}
          <button
            onClick={() => setActiveTab('input')}
            className="px-3.5 py-2 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded-md backdrop-blur-xs transition-colors cursor-pointer"
          >
            Input Dataset &rarr;
          </button>
        </div>
      </div>

      {/* 4 Core Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Examinations"
          value={isDataAvailable ? currentStats.totalExams : '0'}
          subtext={isDataAvailable ? (currentStats.isReal ? currentStats.datasetName : 'Demo dataset (preview)') : 'No data loaded'}
          icon={BookOpen}
          badge={currentStats.isReal ? 'Synthetic Dataset' : previewMode ? 'Preview' : null}
        />
        <StatCard
          title="Total Students"
          value={isDataAvailable ? currentStats.totalStudents?.toLocaleString() : '0'}
          subtext={isDataAvailable ? `Total Registrations: ${currentStats.totalEnrollments}` : 'No registrations'}
          icon={Users}
        />
        <StatCard
          title="Available Time Slots"
          value={isDataAvailable ? currentStats.availablePeriods : '0'}
          subtext={isDataAvailable ? 'Examination scheduling periods' : 'Not configured'}
          icon={Clock}
        />
        <StatCard
          title="Student Conflicts"
          value={isDataAvailable ? currentStats.numConflicts : '0'}
          subtext={isDataAvailable ? `Clash Density: ${currentStats.conflictDensity}` : 'No conflict matrix'}
          icon={Scale}
        />
      </div>

      {/* Main Grid: Workflow Steps & Three OR Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Simple 3-Step Workflow */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">
              Timetabling Steps
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Step 1 */}
              <button
                onClick={() => setActiveTab('input')}
                className="group p-4 rounded-lg border border-slate-200 hover:border-[#9E1B32] hover:bg-red-50/30 text-left transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="p-2 w-9 h-9 rounded-md bg-slate-100 group-hover:bg-[#9E1B32] text-slate-700 group-hover:text-white transition-colors mb-3 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#9E1B32]">
                    1. Input Data
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Provide course registrations (<code className="text-xs font-mono">exam_id, student_id</code>) and set available slots.
                  </p>
                </div>
                <span className="text-xs font-semibold text-[#9E1B32] mt-3 inline-flex items-center gap-1">
                  Open Input &rarr;
                </span>
              </button>

              {/* Step 2 */}
              <button
                onClick={() => setActiveTab('generate')}
                className="group p-4 rounded-lg border border-slate-200 hover:border-[#9E1B32] hover:bg-red-50/30 text-left transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="p-2 w-9 h-9 rounded-md bg-slate-100 group-hover:bg-[#9E1B32] text-slate-700 group-hover:text-white transition-colors mb-3 flex items-center justify-center">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#9E1B32]">
                    2. Generate
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Select Greedy Heuristic, Standard ILP, or Fairness-Aware ILP with fairness weight.
                  </p>
                </div>
                <span className="text-xs font-semibold text-[#9E1B32] mt-3 inline-flex items-center gap-1">
                  Choose Method &rarr;
                </span>
              </button>

              {/* Step 3 */}
              <button
                onClick={() => setActiveTab('results')}
                className="group p-4 rounded-lg border border-slate-200 hover:border-[#9E1B32] hover:bg-red-50/30 text-left transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="p-2 w-9 h-9 rounded-md bg-slate-100 group-hover:bg-[#9E1B32] text-slate-700 group-hover:text-white transition-colors mb-3 flex items-center justify-center">
                    <CalendarDays className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#9E1B32]">
                    3. Results &amp; Comparison
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Review generated time slot allocations and compare penalty vs fairness metrics.
                  </p>
                </div>
                <span className="text-xs font-semibold text-[#9E1B32] mt-3 inline-flex items-center gap-1">
                  View Results &rarr;
                </span>
              </button>
            </div>
          </div>

          {/* Three Methods Comparison Preview */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">
              Three Operations Research Methods
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">1. Greedy Heuristic</span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Fast constructive ordering. Sorts exams by clash degree and assigns the first valid time slot.
                </p>
              </div>
              <div className="p-3 rounded bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">2. Standard ILP</span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Minimizes total student penalty. Can overburden individual students to minimize overall sum.
                </p>
              </div>
              <div className="p-3 rounded bg-slate-50 border border-slate-200 border-l-4 border-l-[#9E1B32]">
                <span className="font-bold text-[#9E1B32] block mb-1">3. Fairness-Aware ILP</span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Minimizes peak student burden (Min-Max) with fairness trade-off weight (&lambda;), ensuring equitable schedules.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: System Status & Demo Data Info */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
              Active Dataset Selection
            </h4>
            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              Current Active: <strong className="text-slate-800">{dataset.name}</strong> ({currentStats.totalExams} exams, {currentStats.totalStudents} students, {currentStats.availablePeriods} slots).
            </p>

            {dataset.datasetId !== 'synthetic_dataset' ? (
              <button
                onClick={loadSyntheticDataset}
                className="w-full py-2.5 px-3 bg-[#9E1B32] hover:bg-[#85172b] text-white font-semibold text-xs rounded shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2 mb-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Activate Synthetic Dataset (100 Students, 15 Exams)
              </button>
            ) : (
              <button
                onClick={loadDemonstrationDataset}
                className="w-full py-2.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-semibold text-xs rounded shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2 mb-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                Optional: Load Demo Data (12 Students, 6 Exams)
              </button>
            )}

            <button
              onClick={() => setActiveTab('input')}
              className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded border border-slate-300 transition-colors cursor-pointer text-center block"
            >
              Configure Dataset in Input Data &rarr;
            </button>
          </div>

          {/* Backend Connection */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">Flask Service:</span>
              <span className={`font-semibold flex items-center gap-1 ${backendHealth.status === 'online' ? 'text-emerald-700' : 'text-slate-500'}`}>
                {backendHealth.status === 'online' ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Online (:5000)
                  </>
                ) : 'Connecting...'}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-500 text-[11px]">
              <span>Active Status:</span>
              <span>{isDataAvailable ? 'Dataset Loaded' : 'Awaiting Input'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
