import React from 'react';

const Badge = ({ children, variant = 'default', size = 'sm' }) => {
  const sizeClasses = {
    xs: 'px-2 py-0.5 text-xs',
    sm: 'px-2.5 py-1 text-xs font-semibold',
    md: 'px-3 py-1.5 text-sm font-semibold',
  };

  const variantClasses = {
    // Roles
    HR: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
    Manager: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    Employee: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',

    // Statuses
    Active: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    Inactive: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    Present: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    Absent: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    'Half Day': 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    Leave: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',

    // Leave Approval Status
    Pending: 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse',
    Approved: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    Rejected: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',

    default: 'bg-slate-700/50 text-slate-300 border border-slate-600/30',
  };

  const selectedVariant = variantClasses[variant] || variantClasses[children] || variantClasses.default;

  return (
    <span className={`inline-flex items-center rounded-full transition-all ${sizeClasses[size]} ${selectedVariant}`}>
      {children}
    </span>
  );
};

export default Badge;
