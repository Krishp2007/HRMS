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
    <Modal isOpen={isOpen} onClose={onClose} title="Employee Deep Profile & Activity View">
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      ) : user ? (
        <div className="space-y-6 text-xs">
          {/* Header Card */}
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white font-extrabold text-xl shadow-md">
              {user.fullName?.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-extrabold text-slate-900">{user.fullName}</h4>
                <Badge variant={user.role}>{user.role}</Badge>
                <Badge variant={user.status}>{user.status}</Badge>
              </div>
              <p className="mt-0.5 font-mono text-indigo-600 font-bold">{user.employeeId}</p>
              <p className="text-slate-600 mt-0.5 font-medium">{user.designation} • {user.department}</p>
            </div>
          </div>

          {/* Tab Selection */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Overview Details
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                activeTab === 'attendance' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Attendance Logs ({attendance.length})
            </button>
            <button
              onClick={() => setActiveTab('leaves')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                activeTab === 'leaves' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Leave Requests ({leaves.length})
            </button>
          </div>

          {/* Overview Tab Content */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-2 gap-3">
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
                <p className="text-slate-900 font-semibold">
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

          {/* Attendance Tab Content */}
          {activeTab === 'attendance' && (
            <div className="max-h-60 overflow-y-auto space-y-2">
              {attendance.length === 0 ? (
                <p className="text-center py-6 text-slate-500 font-medium">No attendance logs logged yet for this employee.</p>
              ) : (
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="border-b border-slate-200 uppercase text-[10px] text-slate-400 font-bold">
                    <tr>
                      <th className="py-2 px-2">Date</th>
                      <th className="py-2 px-2">Check In</th>
                      <th className="py-2 px-2">Check Out</th>
                      <th className="py-2 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {attendance.map((rec) => (
                      <tr key={rec._id}>
                        <td className="py-2 px-2 font-semibold text-slate-900">{rec.date}</td>
                        <td className="py-2 px-2 font-mono text-emerald-600 font-bold">
                          {rec.checkInTime ? new Date(rec.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </td>
                        <td className="py-2 px-2 font-mono text-purple-600 font-bold">
                          {rec.checkOutTime ? new Date(rec.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Still checked in'}
                        </td>
                        <td className="py-2 px-2">
                          <Badge variant={rec.status} size="xs">{rec.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Leaves Tab Content */}
          {activeTab === 'leaves' && (
            <div className="max-h-60 overflow-y-auto space-y-2">
              {leaves.length === 0 ? (
                <p className="text-center py-6 text-slate-500 font-medium">No leave requests submitted yet for this employee.</p>
              ) : (
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="border-b border-slate-200 uppercase text-[10px] text-slate-400 font-bold">
                    <tr>
                      <th className="py-2 px-2">Type</th>
                      <th className="py-2 px-2">Dates</th>
                      <th className="py-2 px-2">Days</th>
                      <th className="py-2 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leaves.map((l) => (
                      <tr key={l._id}>
                        <td className="py-2 px-2 font-semibold text-slate-900">{l.leaveType}</td>
                        <td className="py-2 px-2 text-[10px] font-medium text-slate-600">
                          {new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}
                        </td>
                        <td className="py-2 px-2 font-bold text-indigo-600">{l.totalDays}d</td>
                        <td className="py-2 px-2">
                          <Badge variant={l.status} size="xs">{l.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Quick Admin Actions */}
          {isHR && (
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
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
