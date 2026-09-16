import React from 'react';

const Badge = ({ children, variant = 'default', size = 'sm' }) => {
  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[10px] font-black',
    sm: 'px-2.5 py-1 text-xs font-black',
    md: 'px-3 py-1.5 text-xs font-black',
  };

  const variantClasses = {
    // Roles
    HR: 'bg-indigo-100 text-indigo-950 border border-indigo-300',
    Manager: 'bg-blue-100 text-blue-950 border border-blue-300',
    Employee: 'bg-slate-200 text-slate-950 border border-slate-300',

    // Statuses
    Active: 'bg-emerald-100 text-emerald-950 border border-emerald-300',
    Inactive: 'bg-rose-100 text-rose-950 border border-rose-300',
    Present: 'bg-emerald-100 text-emerald-950 border border-emerald-300',
    Absent: 'bg-rose-100 text-rose-950 border border-rose-300',
    'Half Day': 'bg-amber-100 text-amber-950 border border-amber-300',
    Leave: 'bg-sky-100 text-sky-950 border border-sky-300',

    // Leave Types
    Casual: 'bg-blue-100 text-blue-950 border border-blue-300',
    Sick: 'bg-amber-100 text-amber-950 border border-amber-300',
    Paid: 'bg-emerald-100 text-emerald-950 border border-emerald-300',
    Unpaid: 'bg-slate-200 text-slate-950 border border-slate-300',

    // Approval Statuses
    Pending: 'bg-amber-100 text-amber-950 border border-amber-400',
    Approved: 'bg-emerald-100 text-emerald-950 border border-emerald-300',
    Rejected: 'bg-rose-100 text-rose-950 border border-rose-300',

    default: 'bg-slate-200 text-slate-950 border border-slate-300',
  };

  const selectedVariant = variantClasses[variant] || variantClasses[children] || variantClasses.default;

  return (
    <span className={`inline-flex items-center rounded-full transition-all ${sizeClasses[size]} ${selectedVariant}`}>
      {children}
    </span>
  );
};

export default Badge;
