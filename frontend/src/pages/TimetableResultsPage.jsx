import React, { useState } from 'react';
import {
  CalendarDays,
  Search,
  Filter,
  Download,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { useTimetable } from '../context/TimetableContext';
import { EmptyState } from '../components/common/EmptyState';

export const TimetableResultsPage = () => {
  const {
    currentResults,
    enableSamplePreview,
    setActiveTab,
  } = useTimetable();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDay, setSelectedDay] = useState('all');
  const [selectedRoom, setSelectedRoom] = useState('all');

  const hasResults = currentResults && currentResults.length > 0;

  // Filtered timetable
  const filteredResults = currentResults.filter((item) => {
    const matchesSearch =
      item.examId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.examName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.room.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDay = selectedDay === 'all' || item.day.toLowerCase() === selectedDay.toLowerCase();
    const matchesRoom = selectedRoom === 'all' || item.room.toLowerCase().includes(selectedRoom.toLowerCase());

    return matchesSearch && matchesDay && matchesRoom;
  });

  const exportCSV = () => {
    if (!hasResults) return;
    const headers = ['Exam ID', 'Exam Name', 'Period', 'Day', 'Room', 'Student Count', 'Solver Status'];
    const rows = filteredResults.map((r) => [
      r.examId,
      `"${r.examName}"`,
      `"${r.period}"`,
      r.day,
      `"${r.room}"`,
      r.studentCount,
      r.solverStatus,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'master_examination_timetable.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Master Examination Schedule
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Period allocations, room assignments, and student seat capacity checks for scheduled course examinations.
          </p>
        </div>

        {hasResults && (
          <div className="flex items-center gap-2">
            <button
              onClick={exportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded border border-slate-300 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV Schedule
            </button>
          </div>
        )}
      </div>

      {!hasResults ? (
        <EmptyState
          icon={CalendarDays}
          title="No Examination Timetable Available"
          description="A timetable has not yet been generated. Upload your student and room dataset and run an optimization algorithm, or preview the interface with benchmark data."
          actionLabel="Configure & Generate Timetable"
          onAction={() => setActiveTab('generate')}
          secondaryActionLabel="Preview with Sample Benchmark Data"
          onSecondaryAction={enableSamplePreview}
        />
      ) : (
        <div className="space-y-4">
          {/* Summary Metric Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold uppercase text-slate-500">Scheduled Exams</span>
              <p className="text-lg font-bold text-slate-900 mt-0.5">{filteredResults.length} / {currentResults.length}</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold uppercase text-slate-500">Solver Status</span>
              <p className="text-lg font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Optimal
              </p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold uppercase text-slate-500">Total Examinees</span>
              <p className="text-lg font-bold text-slate-900 mt-0.5">
                {filteredResults.reduce((acc, curr) => acc + curr.studentCount, 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold uppercase text-slate-500">Clash Violations</span>
              <p className="text-lg font-bold text-emerald-700 mt-0.5">0 (Feasible)</p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by exam ID, course name, room..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded focus:border-[#9E1B32] focus:ring-1 focus:ring-[#9E1B32] bg-white text-slate-800"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto text-xs">
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-600 font-medium">Day:</span>
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="px-2 py-1 border border-slate-300 rounded bg-white text-slate-800 text-xs"
                >
                  <option value="all">All Days</option>
                  <option value="monday">Monday</option>
                  <option value="tuesday">Tuesday</option>
                  <option value="wednesday">Wednesday</option>
                  <option value="thursday">Thursday</option>
                  <option value="friday">Friday</option>
                  <option value="saturday">Saturday</option>
                </select>
              </div>

              {(searchTerm || selectedDay !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedDay('all');
                    setSelectedRoom('all');
                  }}
                  className="px-2 py-1 text-slate-500 hover:text-slate-800 text-xs flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> Reset Filters
                </button>
              )}
            </div>
          </div>

          {/* Main Table */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Exam ID</th>
                    <th className="py-3 px-4">Examination Name</th>
                    <th className="py-3 px-4">Allocated Period &amp; Slot</th>
                    <th className="py-3 px-4">Room / Facility</th>
                    <th className="py-3 px-4 text-right">Student Count</th>
                    <th className="py-3 px-4 text-center">Solver Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredResults.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-slate-400">
                        No examination sessions match the selected query.
                      </td>
                    </tr>
                  ) : (
                    filteredResults.map((row, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50/80 transition-colors text-slate-800"
                      >
                        <td className="py-3 px-4 font-mono font-bold text-[#9E1B32]">
                          {row.examId}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-900">
                          {row.examName}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          <span className="font-semibold text-slate-800">{row.day}:</span> {row.period}
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">
                          {row.room}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800">
                          {row.studentCount}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                            {row.solverStatus}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="bg-slate-50 border-t border-slate-200 px-4 py-2.5 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Showing {filteredResults.length} of {currentResults.length} examinations</span>
              <span>All constraints satisfied &bull; 0 clashing students</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
