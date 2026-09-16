import React from 'react';
import Modal from './Modal';
import { AlertTriangle, LogOut, CheckCircle2, XCircle, ShieldAlert } from 'lucide-react';

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed with this action?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning', // 'warning' | 'danger' | 'success' | 'info'
  loading = false,
}) => {
  const iconVariants = {
    warning: {
      bg: 'bg-amber-100 text-amber-800 border-amber-300',
      btn: 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20 text-white',
      icon: AlertTriangle,
    },
    danger: {
      bg: 'bg-rose-100 text-rose-800 border-rose-300',
      btn: 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20 text-white',
      icon: ShieldAlert,
    },
    success: {
      bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      btn: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20 text-white',
      icon: CheckCircle2,
    },
    info: {
      bg: 'bg-blue-100 text-blue-800 border-blue-300',
      btn: 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20 text-white',
      icon: LogOut,
    },
  };

  const currentVariant = iconVariants[variant] || iconVariants.warning;
  const IconComponent = currentVariant.icon;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-5 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${currentVariant.bg} shadow-sm`}>
            <IconComponent className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-base font-black text-slate-900">{title}</h4>
            <p className="text-xs font-bold text-slate-700 mt-1 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-blue-200 bg-sky-50 px-4 py-2.5 text-xs font-black text-slate-800 hover:bg-blue-100 transition-all disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-xl px-5 py-2.5 text-xs font-black shadow-md transition-all disabled:opacity-50 ${currentVariant.btn}`}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
