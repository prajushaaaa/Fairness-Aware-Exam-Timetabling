import React from 'react';

export const StatCard = ({ title, value, subtext, icon: Icon, badge }) => {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm hover:shadow transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        {Icon && (
          <div className="w-9 h-9 rounded-md bg-red-50 text-[#9E1B32] flex items-center justify-center">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-slate-900 tracking-tight">
          {value ?? 0}
        </span>
        {badge && (
          <span className="text-xs font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
            {badge}
          </span>
        )}
      </div>
      {subtext && (
        <p className="mt-1 text-xs text-slate-500">
          {subtext}
        </p>
      )}
    </div>
  );
};
