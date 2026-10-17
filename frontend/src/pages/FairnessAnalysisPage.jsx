import React from 'react';
import {
  Scale,
  TrendingDown,
  Activity,
  Layers,
  Info,
} from 'lucide-react';
import { useTimetable } from '../context/TimetableContext';
import { StatCard } from '../components/common/StatCard';
import { EmptyState } from '../components/common/EmptyState';
import { SAMPLE_FAIRNESS_METRICS } from '../data/samplePreviewData';

export const FairnessAnalysisPage = () => {
  const { isDataAvailable, enableSamplePreview, setActiveTab } = useTimetable();

  const metrics = isDataAvailable
    ? SAMPLE_FAIRNESS_METRICS
    : {
        maxStudentBurden: '—',
        avgStudentBurden: '—',
        burdenVariability: '—',
        giniCoefficient: '—',
      };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">
          Student Burden &amp; Equity Dispersion Analytics
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Detailed audit of examination stress equity across student cohorts, peak burden boundaries, and dispersion variances.
        </p>
      </div>

      {!isDataAvailable ? (
        <EmptyState
          icon={Scale}
          title="No Fairness Analytics Available"
          description="Fairness metrics require an active dataset and timetable schedule. Upload your datasets or load sample benchmark metrics to preview the equity analytics dashboard."
          actionLabel="Upload Datasets"
          onAction={() => setActiveTab('upload')}
          secondaryActionLabel="Preview Fairness Metrics"
          onSecondaryAction={enableSamplePreview}
        />
      ) : (
        <div className="space-y-6">
          {/* Core Fairness Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Maximum Student Burden"
              value={metrics.maxStudentBurden}
              subtext="Highest penalty borne by any single student"
              icon={TrendingDown}
              badge="-50% Peak Burden"
            />
            <StatCard
              title="Average Student Burden"
              value={metrics.avgStudentBurden}
              subtext="Mean penalty units across total student cohort"
              icon={Activity}
            />
            <StatCard
              title="Burden Variability"
              value={metrics.burdenVariability}
              subtext="Standard deviation of student exam stress"
              icon={Scale}
            />
            <StatCard
              title="Gini Inequality Index"
              value={metrics.giniCoefficient}
              subtext="Measure of scheduling disparity (0 = perfect equality)"
              icon={Layers}
            />
          </div>

          {/* Theoretical Definition & Formula Banner */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-[#9E1B32]" />
              <h4 className="text-sm font-bold text-slate-900">
                Mathematical Burden Formulation
              </h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              For every student $s \in S$, their individual burden $B_s$ is calculated based on examination proximity:
            </p>
            <div className="my-2.5 p-3 rounded bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-800 overflow-x-auto">
              B_s = &sum; [ w_1 &times; ConsecutiveExams(s) + w_2 &times; SameDayExams(s) + w_3 &times; OverlappingRevision(s) ]
            </div>
            <p className="text-[11px] text-slate-500">
              The fairness formulation enforces B_s &le; M for all students s, minimizing M while simultaneously penalizing the burden variance &sum; (B_s - &mu;)^2.
            </p>
          </div>

          {/* Placeholder Chart Areas for Future Experimental Results */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Student Burden Distribution Histogram */}
            <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Student Burden Distribution (Histogram)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Standard ILP vs. Fairness-Aware ILP burden frequency
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                    Placeholder Chart
                  </span>
                </div>

                {/* Visual Histogram Representation (Placeholder) */}
                <div className="bg-slate-50 rounded-lg p-4 border border-dashed border-slate-300">
                  <div className="h-44 flex items-end justify-between gap-3 pt-6 px-2">
                    {/* Bar 1 */}
                    <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <div className="w-full flex items-end justify-center gap-1 h-full">
                        <div className="w-1/2 bg-blue-300 rounded-t h-[45%]" title="Standard ILP: 450 students"></div>
                        <div className="w-1/2 bg-[#9E1B32] rounded-t h-[60%]" title="Fairness ILP: 600 students"></div>
                      </div>
                      <span className="text-[10px] font-medium text-slate-500">0 - 4 pts</span>
                    </div>

                    {/* Bar 2 */}
                    <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <div className="w-full flex items-end justify-center gap-1 h-full">
                        <div className="w-1/2 bg-blue-300 rounded-t h-[75%]" title="Standard ILP: 750 students"></div>
                        <div className="w-1/2 bg-[#9E1B32] rounded-t h-[90%]" title="Fairness ILP: 900 students"></div>
                      </div>
                      <span className="text-[10px] font-medium text-slate-500">5 - 8 pts</span>
                    </div>

                    {/* Bar 3 */}
                    <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <div className="w-full flex items-end justify-center gap-1 h-full">
                        <div className="w-1/2 bg-blue-300 rounded-t h-[60%]" title="Standard ILP: 600 students"></div>
                        <div className="w-1/2 bg-[#9E1B32] rounded-t h-[45%]" title="Fairness ILP: 450 students"></div>
                      </div>
                      <span className="text-[10px] font-medium text-slate-500">9 - 12 pts</span>
                    </div>

                    {/* Bar 4 */}
                    <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <div className="w-full flex items-end justify-center gap-1 h-full">
                        <div className="w-1/2 bg-blue-300 rounded-t h-[35%]" title="Standard ILP: 350 students"></div>
                        <div className="w-1/2 bg-[#9E1B32] rounded-t h-[12%]" title="Fairness ILP: 120 students"></div>
                      </div>
                      <span className="text-[10px] font-medium text-slate-500">13 - 16 pts</span>
                    </div>

                    {/* Bar 5 (High Stress Cohort) */}
                    <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <div className="w-full flex items-end justify-center gap-1 h-full">
                        <div className="w-1/2 bg-rose-400 rounded-t h-[28%]" title="Standard ILP: 280 students suffer 17+ pts"></div>
                        <div className="w-1/2 bg-emerald-500 rounded-t h-[0%]" title="Fairness ILP: 0 students (eliminated!)"></div>
                      </div>
                      <span className="text-[10px] font-semibold text-rose-700">17 - 28 pts</span>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-slate-200 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 bg-blue-300 rounded-xs"></span>
                      <span className="text-slate-600">Standard ILP (Long stress tail)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 bg-[#9E1B32] rounded-xs"></span>
                      <span className="text-slate-900 font-semibold">Fairness-Aware ILP (Tightly clustered)</span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-3 text-center italic">
                Chart container reserved for Matplotlib / Chart.js output from backend solver logs.
              </p>
            </div>

            {/* Chart 2: Pareto Efficiency vs. Peak Burden Trade-off */}
            <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Fairness Sensitivity Curve (&lambda; Frontier)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Impact of fairness weight (&lambda;) on max student burden and institutional penalty
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                    Placeholder Chart
                  </span>
                </div>

                {/* Visual SVG Trade-off Curve */}
                <div className="bg-slate-50 rounded-lg p-4 border border-dashed border-slate-300">
                  <div className="h-44 relative flex items-center justify-center">
                    <svg className="w-full h-full" viewBox="0 0 300 120">
                      {/* Grid lines */}
                      <line x1="30" y1="20" x2="280" y2="20" stroke="#e2e8f0" strokeDasharray="3 3" />
                      <line x1="30" y1="60" x2="280" y2="60" stroke="#e2e8f0" strokeDasharray="3 3" />
                      <line x1="30" y1="100" x2="280" y2="100" stroke="#cbd5e1" />
                      <line x1="30" y1="10" x2="30" y2="100" stroke="#cbd5e1" />

                      {/* Curve: Max Burden drops dramatically */}
                      <path
                        d="M 40 25 Q 90 70 270 85"
                        fill="none"
                        stroke="#9E1B32"
                        strokeWidth="3"
                      />

                      {/* Curve: Penalty rises slightly */}
                      <path
                        d="M 40 92 Q 150 88 270 78"
                        fill="none"
                        stroke="#2563eb"
                        strokeWidth="2"
                        strokeDasharray="4 2"
                      />

                      {/* Dots on key lambdas */}
                      <circle cx="40" cy="25" r="4" fill="#9E1B32" />
                      <text x="45" y="25" fontSize="8" fill="#9E1B32">λ = 0.0 (Max Burden: 28)</text>

                      <circle cx="150" cy="74" r="4" fill="#9E1B32" />
                      <text x="135" y="65" fontSize="8" fill="#9E1B32" fontWeight="bold">λ = 0.5 (Burden: 14)</text>

                      <circle cx="270" cy="85" r="4" fill="#9E1B32" />
                      <text x="210" y="98" fontSize="8" fill="#9E1B32">λ = 1.0 (Burden: 13)</text>
                    </svg>
                  </div>

                  {/* Legend */}
                  <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-slate-200 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-0.5 bg-[#9E1B32]"></span>
                      <span className="text-slate-800 font-semibold">Max Student Burden (Steep drop)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-0.5 bg-blue-600 border-dashed"></span>
                      <span className="text-slate-600">Total Penalty (Flat slope)</span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-3 text-center italic">
                Chart container reserved for OR frontier sensitivity results generated in Phase 2.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
