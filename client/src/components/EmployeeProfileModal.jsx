import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from './Modal';
import Badge from './Badge';
import {
  User as UserIcon,
  Mail,
  Phone,
  Calendar,
  Building,
  Briefcase,
  ShieldCheck,
  Clock,
  CalendarDays,
  UserCheck,
  Edit2,
  Power,
} from 'lucide-react';

const EmployeeProfileModal = ({ isOpen, onClose, employeeId, onEdit, onToggleStatus, isHR }) => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (isOpen && employeeId) {
      const fetchDeepProfile = async () => {
        setLoading(true);
        setProfileData(null);
        try {
          const res = await api.get(`/employees/${employeeId}`);
          setProfileData(res.data);
        } catch (err) {
          console.error('Failed to load employee deep profile:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchDeepProfile();
    } else {
      setProfileData(null);
    }
  }, [isOpen, employeeId]);

  if (!isOpen) return null;

  const user = profileData?.user || (profileData?._id ? profileData : null);
  const attendance = profileData?.attendance || [];
  const leaves = profileData?.leaves || [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Employee Deep Profile">
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      ) : user ? (
        <div className="space-y-4 sm:space-y-6 text-xs">
          {/* Header Card */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white font-extrabold text-lg sm:text-xl shadow-md shrink-0">
              {user.fullName?.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-base sm:text-lg font-extrabold text-slate-900 truncate">{user.fullName}</h4>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                <Badge variant={user.role} size="xs">{user.role}</Badge>
                <Badge variant={user.status} size="xs">{user.status}</Badge>
              </div>
              <p className="mt-0.5 font-mono text-indigo-600 font-bold text-xs truncate">{user.employeeId}</p>
              <p className="text-slate-600 mt-0.5 font-medium truncate">{user.designation} • {user.department}</p>
            </div>
          </div>

          {/* Tab Selection — scroll horizontally on small screens */}
          <div className="flex items-center gap-1.5 sm:gap-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-thin">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap text-xs ${
                activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap text-xs ${
                activeTab === 'attendance' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Attendance ({attendance.length})
            </button>
            <button
              onClick={() => setActiveTab('leaves')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap text-xs ${
                activeTab === 'leaves' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Leaves ({leaves.length})
            </button>
          </div>

          {/* Overview Tab Content */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <span className="text-slate-500 font-bold block mb-1">Email Address</span>
                <p className="text-slate-900 font-semibold truncate">{user.email}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <span className="text-slate-500 font-bold block mb-1">Phone Number</span>
                <p className="text-slate-900 font-semibold">{user.phone}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <span className="text-slate-500 font-bold block mb-1">Assigned Manager</span>
                <p className="text-slate-900 font-semibold truncate">
                  {user.managerId ? `${user.managerId.fullName} (${user.managerId.employeeId})` : 'Root Admin (HR)'}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <span className="text-slate-500 font-bold block mb-1">Joining Date</span>
                <p className="text-slate-900 font-semibold">
                  {user.joiningDate ? new Date(user.joiningDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          )}

          {/* Attendance Tab Content — card-based on mobile */}
          {activeTab === 'attendance' && (
            <div className="max-h-60 overflow-y-auto space-y-2">
              {attendance.length === 0 ? (
                <p className="text-center py-6 text-slate-500 font-medium">No attendance logs logged yet.</p>
              ) : (
                <div className="space-y-2">
                  {attendance.map((rec) => (
                    <div key={rec._id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 text-xs">{rec.date}</p>
                        <p className="text-[10px] font-mono text-slate-600 mt-0.5">
                          In: {rec.checkInTime ? new Date(rec.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                          {' • '}
                          Out: {rec.checkOutTime ? new Date(rec.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active'}
                        </p>
                      </div>
                      <Badge variant={rec.status} size="xs">{rec.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Leaves Tab Content — card-based on mobile */}
          {activeTab === 'leaves' && (
            <div className="max-h-60 overflow-y-auto space-y-2">
              {leaves.length === 0 ? (
                <p className="text-center py-6 text-slate-500 font-medium">No leave requests submitted yet.</p>
              ) : (
                <div className="space-y-2">
                  {leaves.map((l) => (
                    <div key={l._id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 text-xs">{l.leaveType} • {l.totalDays}d</p>
                        <p className="text-[10px] font-medium text-slate-600 mt-0.5">
                          {new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={l.status} size="xs">{l.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quick Admin Actions */}
          {isHR && (
            <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3 border-t border-slate-200 pt-3 sm:pt-4">
              <button
                onClick={() => {
                  onClose();
                  onEdit && onEdit(user);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition-all shadow-sm"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Edit Profile</span>
              </button>
              <button
                onClick={() => {
                  onClose();
                  onToggleStatus && onToggleStatus(user._id, user.status);
                }}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white transition-all shadow-sm ${
                  user.status === 'Active' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                <Power className="h-3.5 w-3.5" />
                <span>{user.status === 'Active' ? 'Deactivate' : 'Activate'}</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <p className="text-center py-6 text-slate-500 font-medium">Employee record not found.</p>
      )}
    </Modal>
  );
};

export default EmployeeProfileModal;
