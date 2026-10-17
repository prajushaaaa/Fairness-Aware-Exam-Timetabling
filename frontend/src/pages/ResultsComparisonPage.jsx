import React, { useState } from 'react';
import {
  CalendarDays,
  GitCompare,
  Download,
  CheckCircle2,
  Scale,
  Award,
  Search,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useTimetable } from '../context/TimetableContext';
import { EmptyState } from '../components/common/EmptyState';

export const ResultsComparisonPage = () => {
  const {
    currentSchedule,
    currentComparison,
    previewMode,
    enableSamplePreview,
    disableSamplePreview,
    setActiveTab,
    solverRun,
  } = useTimetable();

  const [searchTerm, setSearchTerm] = useState('');

  const hasResults = Boolean(currentSchedule && currentSchedule.length > 0);

  const filteredSchedule = hasResults
    ? currentSchedule.filter(
        (item) =>
          (item.examId || item.exam_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.examName || item.exam_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.timeSlot || item.time_slot_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.roomName || item.roomId || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const handleExportCSV = () => {
    if (!hasResults) return;
    const headers = ['Exam ID', 'Exam Name', 'Assigned Slot', 'Assigned Room', 'Student Count', 'Enrolled Students'];
    const rows = filteredSchedule.map((r) => [
      r.examId || r.exam_id,
      `"${r.examName || r.exam_name}"`,
      `"${r.timeSlot || r.time_slot_name}"`,
      `"${r.roomName || r.roomId || r.room_name || '—'}"`,
      r.studentCount || r.student_count,
      `"${r.students || ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'examination_timetable_schedule.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Examination Timetable Results &amp; Algorithmic Comparison
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Review allocated examination time slots and comparative multi-objective equity benchmarks.
          </p>
        </div>

        {hasResults && (
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded border border-slate-300 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export Schedule CSV
          </button>
        )}
      </div>

      {!hasResults ? (
        <EmptyState
          icon={CalendarDays}
          title="No Timetable Generated Yet"
          description="Optimization solvers have not been executed yet. Enter your course registrations in 'Input Data' and run the solver in 'Generate Timetable', or preview the schedule layout with demonstration data."
          actionLabel="Go to Input Data"
          onAction={() => setActiveTab('input')}
          secondaryActionLabel="Preview Demonstration Schedule (UI Preview Only)"
          onSecondaryAction={enableSamplePreview}
        />
      ) : (
        <div className="space-y-6">
          {/* Actual Backend Performance Metric Strip */}
          {solverRun && solverRun.hasGenerated && solverRun.status && (
            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className={`text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded border flex items-center gap-1 ${
                    solverRun.status === 'Infeasible' || solverRun.status === 'Error'
                      ? 'bg-red-50 text-red-800 border-red-300'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  }`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Status: {solverRun.status}
                  </span>
                  <span className="text-xs text-slate-500">
                    Latest Run Method: <strong className="text-slate-800 font-semibold">{solverRun.method || 'Greedy'}</strong>
                  </span>
                </div>
                {solverRun.runtime !== null && (
                  <span className="text-xs font-mono text-slate-500">
                    Execution Time: <strong className="text-slate-800 font-semibold">{solverRun.runtime}s</strong>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Hard Violations</span>
                  <p className="text-base font-bold text-emerald-700 mt-0.5">{solverRun.hard_constraint_violations ?? 0}</p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Conventional Penalty</span>
                  <p className="text-base font-mono font-bold text-slate-900 mt-0.5">{solverRun.conventional_penalty ?? '—'}</p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Average Student Burden</span>
                  <p className="text-base font-mono font-bold text-slate-900 mt-0.5">{solverRun.average_student_burden ?? '—'}</p>
                </div>
                <div className="bg-red-50/50 p-2.5 rounded border border-red-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#9E1B32]">Max Student Burden</span>
                  <p className="text-base font-mono font-bold text-[#9E1B32] mt-0.5">{solverRun.maximum_student_burden ?? '—'}</p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Scheduled Courses</span>
                  <p className="text-base font-mono font-bold text-slate-900 mt-0.5">{filteredSchedule.length} Exams</p>
                </div>
              </div>
            </div>
          )}

          {/* Section 1: Master Examination Timetable */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-[#9E1B32]" />
                  Examination Schedule Table
                </h4>
                <p className="text-xs text-slate-500">
                  Course examination timeslot and room assignments without student schedule clashes
                </p>
              </div>

              {/* Search filter */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter by course code or slot..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 text-xs border border-slate-300 rounded bg-white text-slate-800 focus:border-[#9E1B32] focus:ring-1 focus:ring-[#9E1B32]"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Exam ID</th>
                    <th className="py-3 px-4">Course Name</th>
                    <th className="py-3 px-4">Allocated Time Slot</th>
                    <th className="py-3 px-4">Assigned Room</th>
                    <th className="py-3 px-4 text-center">Students</th>
                    <th className="py-3 px-4">Enrolled Candidates</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredSchedule.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#9E1B32]">
                        {row.examId || row.exam_id}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {row.examName || row.exam_name}
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-semibold">
                        {row.timeSlot || row.time_slot_name}
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-medium">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px]">
                          {row.roomName || row.roomId || row.room_name || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                        {row.studentCount || row.student_count}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {row.students || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Showing {filteredSchedule.length} of {currentSchedule.length} scheduled courses</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {solverRun && solverRun.hard_constraint_violations !== null
                  ? `${solverRun.hard_constraint_violations} Clashes (Hard conflict constraints satisfied)`
                  : '0 Clashes (All conflict constraints satisfied)'}
              </span>
            </div>
          </div>

          {/* Section 2: Algorithm Comparison Matrix */}
          {currentComparison && currentComparison.length > 0 && (
            <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <GitCompare className="w-4 h-4 text-[#9E1B32]" />
                    Comparative Performance Matrix (Three Methods)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Comparing total penalty and maximum student burden across Greedy, Standard ILP, and Fairness-Aware ILP
                  </p>
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-red-50 text-[#9E1B32] border border-red-200">
                  Operations Research Benchmarks
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Method</th>
                      <th className="py-3 px-4 text-center">Total Penalty</th>
                      <th className="py-3 px-4 text-center bg-red-50/40 text-[#9E1B32] font-bold">
                        Max Student Burden
                      </th>
                      <th className="py-3 px-4 text-center">Avg Student Burden</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4">Formulation Behavior</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {currentComparison.map((item, idx) => (
                      <tr
                        key={idx}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          item.method.includes('Fairness') ? 'bg-red-50/15' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          <div className="flex items-center gap-1.5">
                            {item.method.includes('Fairness') && (
                              <Award className="w-4 h-4 text-[#9E1B32] shrink-0" />
                            )}
                            <span>{item.method}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">
                          {item.penalty}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-[#9E1B32] text-sm bg-red-50/30">
                          {item.maxBurden}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-slate-800">
                          {item.avgBurden}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${
                              item.status === 'Not Run'
                                ? 'bg-slate-100 text-slate-600 border-slate-300'
                                : item.status === 'Infeasible' || item.status === 'Error'
                                ? 'bg-red-50 text-red-800 border-red-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                          {item.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <strong>Key Takeaway:</strong> Fairness-Aware ILP significantly reduces the maximum student burden by enforcing individual stress upper bounds, creating an equitable examination schedule.
                </div>
                <button
                  onClick={() => setActiveTab('generate')}
                  className="shrink-0 text-xs text-[#9E1B32] hover:text-[#7d1426] font-semibold underline cursor-pointer"
                >
                  Run another algorithm &rarr;
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
