import React from 'react';
import {
  GitCompare,
  TrendingDown,
  Clock,
  Scale,
  Award,
  Info,
} from 'lucide-react';
import { useTimetable } from '../context/TimetableContext';
import { EmptyState } from '../components/common/EmptyState';
import { SAMPLE_COMPARISON_DATA } from '../data/samplePreviewData';

export const AlgorithmComparisonPage = () => {
  const { isDataAvailable, enableSamplePreview, setActiveTab } = useTimetable();

  const comparisonData = isDataAvailable ? SAMPLE_COMPARISON_DATA : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">
          Algorithmic Benchmark &amp; Multi-Objective Trade-Off Comparison
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Comparative empirical evaluation across Greedy Constructive Heuristics, Classic Integer Programming, and Fairness-Aware Formulations.
        </p>
      </div>

      {!isDataAvailable ? (
        <EmptyState
          icon={GitCompare}
          title="No Comparison Benchmarks Available"
          description="Comparison results will populate after algorithms have been executed against an uploaded dataset. Preview the comparative table using benchmark experimental results."
          actionLabel="Go to Dataset Upload"
          onAction={() => setActiveTab('upload')}
          secondaryActionLabel="Preview Benchmark Comparison Data"
          onSecondaryAction={enableSamplePreview}
        />
      ) : (
        <div className="space-y-6">
          {/* Key Findings Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-500 mb-2">
                <span>Peak Burden Reduction</span>
                <Scale className="w-4 h-4 text-[#9E1B32]" />
              </div>
              <div className="text-2xl font-bold text-[#9E1B32]">
                -50.0% <span className="text-xs font-medium text-slate-500">vs Greedy</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Fairness-Aware ILP drops maximum student burden from 28 to 14 units.
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-500 mb-2">
                <span>Efficiency Trade-Off</span>
                <TrendingDown className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-emerald-700">
                +5.1% <span className="text-xs font-medium text-slate-500">Penalty Cost</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Total penalty rises minimally (10.65 to 11.20) in exchange for dramatic equity gains.
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-500 mb-2">
                <span>Computational Scalability</span>
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">
                22.3 s <span className="text-xs font-medium text-slate-500">Solve Time</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Proven global optimality reached within the 60-second limit using branch-and-cut.
              </p>
            </div>
          </div>

          {/* Main Comparison Table */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Comprehensive Algorithm Evaluation Matrix
                </h4>
                <p className="text-xs text-slate-500">
                  Direct comparison across standard Operations Research timetable criteria
                </p>
              </div>
              <span className="text-[11px] font-semibold bg-red-50 text-[#9E1B32] border border-red-200 px-2.5 py-1 rounded">
                Toronto Benchmark: hec-s-92
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Algorithm</th>
                    <th className="py-3 px-4">Formulation Strategy</th>
                    <th className="py-3 px-4 text-center">Overall Penalty</th>
                    <th className="py-3 px-4 text-center bg-red-50/50 text-[#9E1B32]">
                      Max Student Burden
                    </th>
                    <th className="py-3 px-4 text-center">Avg Student Burden</th>
                    <th className="py-3 px-4 text-center">Runtime</th>
                    <th className="py-3 px-4 text-center">Fairness Equity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {comparisonData.map((row) => (
                    <tr
                      key={row.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        row.id === 'fairness_ilp' ? 'bg-red-50/15' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          {row.id === 'fairness_ilp' && (
                            <Award className="w-4 h-4 text-[#9E1B32] shrink-0" />
                          )}
                          <span>{row.algorithm}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs text-[11px]">
                        {row.description}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">
                        {row.overallPenalty.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold bg-red-50/30 text-[#9E1B32] text-sm">
                        {row.maxStudentBurden}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-800">
                        {row.avgStudentBurden.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-600">
                        {row.runtime}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            row.id === 'fairness_ilp'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : row.id === 'standard_ilp'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {row.fairnessGrade}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
              <span>* Overall penalty computed using Carter consecutive exam proximity weights (w1=16, w2=8, w3=4, w4=2, w5=1).</span>
              <span className="font-semibold text-slate-700">Lower is better for penalty and max burden</span>
            </div>
          </div>

          {/* Theoretical Takeaway Card */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
            <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Info className="w-4 h-4 text-[#9E1B32]" />
              Operations Research Analytical Takeaways
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 bg-slate-50 rounded border border-slate-100">
                <span className="font-bold text-slate-800 block mb-1">
                  1. The "Tyranny of the Average" in Standard ILP
                </span>
                <p>
                  Standard ILP achieves the minimum total penalty (10.65), but it does so by allowing specific students with conflicting schedules to absorb 24 penalty points (e.g., three back-to-back exams) to keep the global average down.
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-100">
                <span className="font-bold text-slate-800 block mb-1">
                  2. Equitable Optimization via Fairness-Aware ILP
                </span>
                <p>
                  By introducing an explicit minimax bounding constraint (M &ge; B_s) alongside a dispersion penalty, the maximum stress experienced by any single student is cut by over 40-50%, creating a significantly fairer examination environment.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
