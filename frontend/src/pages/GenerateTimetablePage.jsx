import React, { useState } from 'react';
import {
  Cpu,
  Scale,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  Play,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Clock,
  CalendarDays,
  ShieldAlert,
} from 'lucide-react';
import { useTimetable } from '../context/TimetableContext';

const METHODS = [
  {
    id: 'greedy',
    name: 'Greedy Heuristic',
    tag: 'Baseline Method',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
    description:
      'Constructive heuristic: orders examinations by conflict degree (most conflicting courses first) and assigns the first clash-free time slot.',
    strengths: 'Sub-second execution; simple to implement.',
    tradeoff: 'No fairness guarantee; can produce unbalanced student schedules.',
  },
  {
    id: 'standard_ilp',
    name: 'Standard ILP',
    tag: 'Classic OR Model',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    description:
      'Integer Linear Programming (PuLP): minimizes total institutional penalty across all students (e.g., consecutive slots and close exams).',
    strengths: 'Mathematically guarantees minimum cumulative penalty for the university.',
    tradeoff: 'May overburden specific students to lower the global average.',
  },
  {
    id: 'fairness_ilp',
    name: 'Fairness-Aware ILP',
    tag: 'Fairness Formulation',
    badgeClass: 'bg-red-50 text-[#9E1B32] border-red-200',
    description:
      'Min-Max mathematical formulation: directly bounds and minimizes the maximum burden borne by any individual student (M >= Burden_s).',
    strengths: 'Eliminates peak student exam stress; balances individual fairness and equity.',
    tradeoff: 'Slightly higher solver complexity; balanced multi-objective trade-off.',
  },
];

export const GenerateTimetablePage = () => {
  const {
    solverConfig,
    setSolverConfig,
    dataset,
    isDataAvailable,
    currentStats,
    setActiveTab,
    loadDemonstrationDataset,
    generateTimetable,
    solverRun,
  } = useTimetable();

  const [notification, setNotification] = useState(null);

  const handleMethodChange = (methodId) => {
    setSolverConfig((prev) => ({
      ...prev,
      method: methodId,
    }));
  };

  const handleWeightChange = (e) => {
    const val = parseFloat(e.target.value);
    setSolverConfig((prev) => ({
      ...prev,
      fairnessWeight: isNaN(val) ? 0.5 : Math.max(0, Math.min(1, val)),
    }));
  };

  const handleGenerateClick = async () => {
    setNotification(null);
    try {
      await generateTimetable({
        method: solverConfig.method,
        fairnessWeight: solverConfig.fairnessWeight,
        datasetType: dataset.datasetId === 'synthetic_dataset' ? 'synthetic' : 'active',
      });
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message || 'Error occurred while contacting backend solver.',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">
          Timetabling Method Selection &amp; Solver Staging
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Select an Operations Research method to assign examinations into available time slots while preventing student exam clashes.
        </p>
      </div>

      {/* Dataset Warning if missing */}
      {!isDataAvailable && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-amber-800">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">Dataset Missing:</span> Please provide course registrations in the Input Data section before solving.
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('input')}
              className="px-3 py-1.5 bg-[#9E1B32] hover:bg-[#85172b] text-white font-medium rounded cursor-pointer"
            >
              Go to Input Data
            </button>
            <button
              onClick={loadDemonstrationDataset}
              className="px-3 py-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-medium rounded cursor-pointer flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" /> Load Demo Data
            </button>
          </div>
        </div>
      )}

      {/* Notification Banner */}
      {notification && (
        <div
          className={`p-4 rounded-lg text-xs flex items-start justify-between gap-2 ${
            notification.type === 'info'
              ? 'bg-blue-50 border border-blue-200 text-blue-900'
              : 'bg-amber-50 border border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'info' ? (
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          {notification.type === 'info' && (
            <button
              onClick={() => setActiveTab('results')}
              className="font-bold underline cursor-pointer shrink-0 ml-2"
            >
              View Results View &rarr;
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Method Selection & Fairness Weight */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#9E1B32]" />
                Select Timetabling Method
              </h4>
              <span className="text-xs text-slate-400">Operations Research Models</span>
            </div>

            <div className="space-y-3">
              {METHODS.map((m) => {
                const isSelected = solverConfig.method === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => handleMethodChange(m.id)}
                    className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#9E1B32] bg-red-50/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="timetabling_method"
                          id={m.id}
                          checked={isSelected}
                          onChange={() => handleMethodChange(m.id)}
                          className="h-4 w-4 text-[#9E1B32] focus:ring-[#9E1B32] border-slate-300"
                        />
                        <div>
                          <label
                            htmlFor={m.id}
                            className="text-sm font-bold text-slate-900 cursor-pointer flex items-center gap-2"
                          >
                            {m.name}
                            <span
                              className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${m.badgeClass}`}
                            >
                              {m.tag}
                            </span>
                          </label>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            {m.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="font-semibold text-emerald-800">Characteristic: </span>
                        <span className="text-slate-600">{m.strengths}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-amber-800">Trade-off: </span>
                        <span className="text-slate-600">{m.tradeoff}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fairness Weight Input - SHOWN ONLY FOR Fairness-Aware ILP */}
          {solverConfig.method === 'fairness_ilp' && (
            <div className="bg-white rounded-lg border-2 border-red-200 p-5 shadow-xs bg-red-50/10 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded bg-red-100 text-[#9E1B32]">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Fairness Trade-Off Weight (&lambda;)
                    </h4>
                    <p className="text-xs text-slate-500">
                      Balance total institutional penalty with student workload equity
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold bg-red-100 text-[#9E1B32] px-2.5 py-1 rounded border border-red-200">
                  &lambda; = {solverConfig.fairnessWeight.toFixed(2)}
                </span>
              </div>

              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={solverConfig.fairnessWeight}
                    onChange={handleWeightChange}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#9E1B32]"
                  />
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.05"
                    value={solverConfig.fairnessWeight}
                    onChange={handleWeightChange}
                    className="w-20 px-2 py-1 text-xs font-mono text-center border border-slate-300 rounded"
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 font-medium px-1">
                  <span>&lambda; = 0.0 (Pure Standard ILP)</span>
                  <span>&lambda; = 0.5 (Balanced Equity)</span>
                  <span>&lambda; = 1.0 (Strict Peak Burden Min-Max)</span>
                </div>
              </div>

              <div className="p-2.5 bg-white rounded border border-slate-200 text-[11px] text-slate-600">
                <strong>Min-Max Objective:</strong> The solver adds constraints $M \ge B_s$ for every student $s$ and minimizes $M$, ensuring that the student with the most challenging exam schedule is protected from severe fatigue.
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Active Configuration & Execution Action */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Solver Summary
            </h4>

            <div className="space-y-2.5 text-xs text-slate-700">
              <div className="flex justify-between pb-1.5 border-b border-slate-100">
                <span className="text-slate-500">Active Dataset:</span>
                <span className="font-bold text-slate-900 text-right truncate max-w-[150px]" title={dataset.name}>
                  {dataset.name}
                </span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-slate-100">
                <span className="text-slate-500">Method:</span>
                <span className="font-bold text-slate-900">
                  {METHODS.find((m) => m.id === solverConfig.method)?.name}
                </span>
              </div>
              {solverConfig.method === 'fairness_ilp' && (
                <div className="flex justify-between pb-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Fairness Weight (&lambda;):</span>
                  <span className="font-mono font-bold text-[#9E1B32]">
                    {solverConfig.fairnessWeight.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between pb-1.5 border-b border-slate-100">
                <span className="text-slate-500">Available Slots:</span>
                <span className="font-bold text-slate-900">
                  {currentStats.availablePeriods || dataset.timeSlots || 4} Slots
                </span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-slate-100">
                <span className="text-slate-500">Examinations:</span>
                <span className="font-bold text-slate-900">
                  {currentStats.totalExams} Exams
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Student Conflicts:</span>
                <span className="font-bold text-[#9E1B32]">
                  {currentStats.numConflicts} Clashing Pairs
                </span>
              </div>
            </div>

            {/* Run Button */}
            <button
              type="button"
              disabled={solverRun.isGenerating}
              onClick={handleGenerateClick}
              className="w-full py-3 px-4 bg-[#9E1B32] hover:bg-[#85172b] disabled:bg-slate-400 text-white font-bold text-xs rounded shadow-xs transition-colors cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {solverRun.isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  Solving Timetable...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  Generate Timetable
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('results')}
              className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded border border-slate-300 transition-colors cursor-pointer flex items-center justify-center gap-1"
            >
              View Results &amp; Comparison &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Loading Banner */}
      {solverRun.isGenerating && (
        <div className="bg-white rounded-lg border-2 border-red-200 p-6 shadow-xs text-center space-y-3">
          <div className="flex items-center justify-center">
            <div className="p-3 bg-red-50 text-[#9E1B32] rounded-full animate-pulse">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Executing Operations Research Solver
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Sending POST request to <span className="font-mono text-slate-700">http://127.0.0.1:5000/api/timetable/generate</span> using{' '}
              <span className="font-bold text-slate-800">
                {METHODS.find((m) => m.id === solverConfig.method)?.name}
              </span>
              ...
            </p>
          </div>
        </div>
      )}

      {/* Infeasible or Error State Banner */}
      {!solverRun.isGenerating && solverRun.hasGenerated && (solverRun.status === 'Infeasible' || solverRun.error) && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-5 shadow-xs space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#9E1B32] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-200 text-red-900">
                  {solverRun.status === 'Infeasible' ? 'Infeasible' : 'Solver Error'}
                </span>
                <span className="text-xs text-slate-500">Runtime: {solverRun.runtime !== null ? `${solverRun.runtime}s` : '—'}</span>
                {solverRun.hard_constraint_violations !== null && (
                  <span className="text-xs font-semibold text-red-700">
                    Violations: {solverRun.hard_constraint_violations}
                  </span>
                )}
              </div>
              <p className="text-xs text-red-800 font-medium">
                {solverRun.error || 'The solver reported that no feasible schedule could be generated.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Actual Backend Response Display */}
      {!solverRun.isGenerating && solverRun.hasGenerated && solverRun.status && solverRun.status !== 'Infeasible' && solverRun.status !== 'Error' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
          {/* Header Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Status: {solverRun.status}
                </span>
                <span className="text-xs text-slate-500">
                  Method: <strong className="text-slate-800">{METHODS.find((m) => m.id === solverRun.method)?.name}</strong>
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-[#9E1B32]" />
                Actual Generated Timetable Response
              </h4>
            </div>

            <button
              onClick={() => setActiveTab('results')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#9E1B32] hover:bg-[#85172b] text-white text-xs font-semibold rounded shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
            >
              Open Results &amp; Comparison <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Key Metric Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-slate-50 p-3 rounded border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Scheduling Status</span>
              <p className="text-sm font-bold text-emerald-700 mt-0.5">{solverRun.status}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Solver Runtime</span>
              <p className="text-sm font-mono font-bold text-slate-900 mt-0.5">{solverRun.runtime !== null ? `${solverRun.runtime}s` : '—'}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Hard Violations</span>
              <p className="text-sm font-bold text-emerald-700 mt-0.5">{solverRun.hard_constraint_violations ?? 0}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Conventional Penalty</span>
              <p className="text-sm font-mono font-bold text-slate-900 mt-0.5">{solverRun.conventional_penalty ?? '—'}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Average Burden</span>
              <p className="text-sm font-mono font-bold text-slate-900 mt-0.5">{solverRun.average_student_burden ?? '—'}</p>
            </div>
            <div className="bg-red-50/50 p-3 rounded border border-red-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#9E1B32]">Max Student Burden</span>
              <p className="text-sm font-mono font-bold text-[#9E1B32] mt-0.5">{solverRun.maximum_student_burden ?? '—'}</p>
            </div>
          </div>

          {/* Timetable Table */}
          {solverRun.schedule && solverRun.schedule.length > 0 && (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-2.5 px-3">Exam ID</th>
                      <th className="py-2.5 px-3">Course Name</th>
                      <th className="py-2.5 px-3">Assigned Time Slot</th>
                      <th className="py-2.5 px-3">Assigned Room</th>
                      <th className="py-2.5 px-3 text-center">Students</th>
                      <th className="py-2.5 px-3">Enrolled Candidates</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {solverRun.schedule.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-[#9E1B32]">
                          {row.examId || row.exam_id}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-900">
                          {row.examName || row.exam_name}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-700">
                          {row.timeSlot || row.time_slot_name}
                        </td>
                        <td className="py-2.5 px-3 text-slate-800 font-medium">
                          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px]">
                            {row.roomName || row.roomId || row.room_name || '—'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">
                          {row.studentCount || row.student_count}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                          {row.students || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
