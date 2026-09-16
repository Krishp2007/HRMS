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

  // Handle both { user, attendance, leaves } object AND direct user object
  const user = profileData?.user || (profileData?._id ? profileData : null);
  const attendance = profileData?.attendance || [];
  const leaves = profileData?.leaves || [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Employee Deep Profile & Activity View">
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        </div>
      ) : user ? (
        <div className="space-y-6 text-xs">
          {/* Header Card */}
          <div className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-extrabold text-xl shadow-lg ring-2 ring-indigo-500/30">
              {user.fullName?.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-extrabold text-white">{user.fullName}</h4>
                <Badge variant={user.role}>{user.role}</Badge>
                <Badge variant={user.status}>{user.status}</Badge>
              </div>
              <p className="mt-0.5 font-mono text-indigo-400 font-semibold">{user.employeeId}</p>
              <p className="text-slate-400 mt-0.5">{user.designation} • {user.department}</p>
            </div>
          </div>

          {/* Tab Selection */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              Overview Details
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                activeTab === 'attendance' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              Attendance Logs ({attendance.length})
            </button>
            <button
              onClick={() => setActiveTab('leaves')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                activeTab === 'leaves' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              Leave Requests ({leaves.length})
            </button>
          </div>

          {/* Overview Tab Content */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-3">
                <span className="text-slate-500 font-semibold block">Email Address</span>
                <p className="text-white font-medium mt-0.5 truncate">{user.email}</p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-3">
                <span className="text-slate-500 font-semibold block">Phone Number</span>
                <p className="text-white font-medium mt-0.5">{user.phone}</p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-3">
                <span className="text-slate-500 font-semibold block">Assigned Manager</span>
                <p className="text-white font-medium mt-0.5">
                  {user.managerId ? `${user.managerId.fullName} (${user.managerId.employeeId})` : 'Root Admin (HR)'}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-3">
                <span className="text-slate-500 font-semibold block">Joining Date</span>
                <p className="text-white font-medium mt-0.5">
                  {user.joiningDate ? new Date(user.joiningDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          )}

          {/* Attendance Tab Content */}
          {activeTab === 'attendance' && (
            <div className="max-h-60 overflow-y-auto space-y-2">
              {attendance.length === 0 ? (
                <p className="text-center py-6 text-slate-500">No attendance logs logged yet for this employee.</p>
              ) : (
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="border-b border-slate-800 uppercase text-[10px] text-slate-500">
                    <tr>
                      <th className="py-2 px-2">Date</th>
                      <th className="py-2 px-2">Check In</th>
                      <th className="py-2 px-2">Check Out</th>
                      <th className="py-2 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {attendance.map((rec) => (
                      <tr key={rec._id}>
                        <td className="py-2 px-2 font-semibold text-white">{rec.date}</td>
                        <td className="py-2 px-2 font-mono text-emerald-400">
                          {rec.checkInTime ? new Date(rec.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </td>
                        <td className="py-2 px-2 font-mono text-purple-400">
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
                <p className="text-center py-6 text-slate-500">No leave requests submitted yet for this employee.</p>
              ) : (
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="border-b border-slate-800 uppercase text-[10px] text-slate-500">
                    <tr>
                      <th className="py-2 px-2">Type</th>
                      <th className="py-2 px-2">Dates</th>
                      <th className="py-2 px-2">Days</th>
                      <th className="py-2 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {leaves.map((l) => (
                      <tr key={l._id}>
                        <td className="py-2 px-2 font-semibold text-white">{l.leaveType}</td>
                        <td className="py-2 px-2 text-[10px]">
                          {new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}
                        </td>
                        <td className="py-2 px-2 font-semibold text-indigo-400">{l.totalDays}d</td>
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
            <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
              <button
                onClick={() => {
                  onClose();
                  onEdit && onEdit(user);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-all"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Edit Profile</span>
              </button>
              <button
                onClick={() => {
                  onClose();
                  onToggleStatus && onToggleStatus(user._id, user.status);
                }}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white transition-all ${
                  user.status === 'Active' ? 'bg-rose-600 hover:bg-rose-500' : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                <Power className="h-3.5 w-3.5" />
                <span>{user.status === 'Active' ? 'Deactivate' : 'Activate'}</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <p className="text-center py-6 text-slate-500">Employee record not found.</p>
      )}
    </Modal>
  );
};

export default EmployeeProfileModal;
