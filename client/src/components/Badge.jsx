import React from 'react';

const Badge = ({ children, variant = 'default', size = 'sm' }) => {
  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[10px] font-bold',
    sm: 'px-2.5 py-0.5 text-xs font-bold',
    md: 'px-3 py-1 text-xs font-bold',
  };

  const variantClasses = {
    // Roles
    HR: 'bg-purple-50 text-purple-700 border border-purple-200',
    Manager: 'bg-blue-50 text-blue-700 border border-blue-200',
    Employee: 'bg-indigo-50 text-indigo-700 border border-indigo-200',

    // Statuses
    Active: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    Inactive: 'bg-rose-50 text-rose-700 border border-rose-200',
    Present: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    Absent: 'bg-rose-50 text-rose-700 border border-rose-200',
    'Half Day': 'bg-amber-50 text-amber-700 border border-amber-200',
    Leave: 'bg-blue-50 text-blue-700 border border-blue-200',

    // Leave Types
    Casual: 'bg-sky-50 text-sky-700 border border-sky-200',
    Sick: 'bg-amber-50 text-amber-700 border border-amber-200',
    Paid: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    Unpaid: 'bg-slate-100 text-slate-700 border border-slate-200',

    // Leave Approval Status
    Pending: 'bg-amber-50 text-amber-700 border border-amber-300 shadow-sm',
    Approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    Rejected: 'bg-rose-50 text-rose-700 border border-rose-200',

    default: 'bg-slate-100 text-slate-700 border border-slate-200',
  };

  const selectedVariant = variantClasses[variant] || variantClasses[children] || variantClasses.default;

  return (
    <span className={`inline-flex items-center rounded-full transition-all ${sizeClasses[size]} ${selectedVariant}`}>
      {children}
    </span>
  );
};

export default Badge;
