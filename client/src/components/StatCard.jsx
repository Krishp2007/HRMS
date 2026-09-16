import React from 'react';

const StatCard = ({ title, value, icon: Icon, color = 'blue', subtext }) => {
  const colorVariants = {
    blue: {
      card: 'bg-white border-blue-200 hover:border-blue-400',
      iconBg: 'bg-blue-100 text-blue-800',
      text: 'text-blue-950',
    },
    emerald: {
      card: 'bg-white border-emerald-200 hover:border-emerald-400',
      iconBg: 'bg-emerald-100 text-emerald-800',
      text: 'text-emerald-950',
    },
    indigo: {
      card: 'bg-white border-indigo-200 hover:border-indigo-400',
      iconBg: 'bg-indigo-100 text-indigo-800',
      text: 'text-indigo-950',
    },
    rose: {
      card: 'bg-white border-rose-200 hover:border-rose-400',
      iconBg: 'bg-rose-100 text-rose-800',
      text: 'text-rose-950',
    },
    amber: {
      card: 'bg-white border-amber-200 hover:border-amber-400',
      iconBg: 'bg-amber-100 text-amber-800',
      text: 'text-amber-950',
    },
  };

  const currentVariant = colorVariants[color] || colorVariants.blue;

  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all ${currentVariant.card}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-slate-700">{title}</p>
          <h3 className={`mt-1.5 text-2xl font-black ${currentVariant.text}`}>{value}</h3>
          {subtext && <p className="mt-1 text-xs font-black text-slate-600">{subtext}</p>}
        </div>
        {Icon && (
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${currentVariant.iconBg} shadow-sm`}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
