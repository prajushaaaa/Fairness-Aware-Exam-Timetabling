import React from 'react';
import { FolderX, PlusCircle } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = FolderX,
  title = "No Data Available",
  description = "No dataset has been uploaded or timetable generated yet.",
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}) => {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-10 text-center flex flex-col items-center justify-center my-4 shadow-sm">
      <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base font-semibold text-slate-800 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-md mb-6">{description}</p>
      
      <div className="flex flex-wrap items-center justify-center gap-3">
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#9E1B32] hover:bg-[#85172b] text-white text-sm font-medium rounded-md shadow-sm transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            {actionLabel}
          </button>
        )}
        {secondaryActionLabel && onSecondaryAction && (
          <button
            type="button"
            onClick={onSecondaryAction}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-md border border-slate-300 transition-colors cursor-pointer"
          >
            {secondaryActionLabel}
          </button>
        )}
      </div>
    </div>
  );
};
