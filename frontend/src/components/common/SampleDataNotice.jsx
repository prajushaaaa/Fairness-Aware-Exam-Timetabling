import React from 'react';
import { Info, EyeOff } from 'lucide-react';
import { useTimetable } from '../../context/TimetableContext';

export const SampleDataNotice = () => {
  const { previewMode, disableSamplePreview } = useTimetable();

  if (previewMode) {
    return (
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 rounded-r-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-200 text-amber-900">
                UI Preview Mode Active
              </span>
              <span className="text-xs font-semibold text-amber-800">
                Demonstration Layout Preview
              </span>
            </div>
            <p className="text-xs text-amber-700 mt-1">
              Sample preview layout is displayed for UI evaluation. No actual optimization algorithm has been executed.
            </p>
          </div>
        </div>
        <button
          onClick={disableSamplePreview}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-amber-100 text-amber-850 text-xs font-medium rounded border border-amber-300 text-slate-700 transition-colors cursor-pointer shrink-0"
        >
          <EyeOff className="w-3.5 h-3.5 text-amber-700" />
          Exit Preview (Show Empty State)
        </button>
      </div>
    );
  }

  return null;
};
