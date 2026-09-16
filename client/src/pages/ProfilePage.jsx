import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Badge from '../components/Badge';
import {
  User as UserIcon,
  Mail,
  Phone,
  Building,
  Briefcase,
  Calendar,
  ShieldCheck,
  CheckCircle,
  Clock,
  CalendarDays,
  Lock,
} from 'lucide-react';

const ProfilePage = () => {
  const { user, setUser } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [phone, setPhone] = useState(user?.phone || '');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchFullSelfProfile = async () => {
    try {
      const res = await api.get(`/employees/${user._id}`);
      setProfileData(res.data);
    } catch (err) {
      console.error('Failed to fetch self profile:', err);
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchFullSelfProfile();
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const updatePayload = { phone };
      if (password.trim()) {
        updatePayload.password = password;
      }

      const res = await api.put(`/employees/${user._id}`, updatePayload);
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
      setMessage('✅ Profile details updated successfully!');
      setPassword('');
      fetchFullSelfProfile();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const attendanceCount = profileData?.attendance?.length || 0;
  const leaveCount = profileData?.leaves?.length || 0;
  const fullUser = profileData?.user || user;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-black text-white tracking-tight">My Profile & Workspace</h2>
        <p className="text-xs text-slate-400">Complete personal employment record, manager details & credentials</p>
      </div>

      {message && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-bold text-emerald-400">
          <CheckCircle className="h-4 w-4" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-bold text-rose-400">
          {error}
        </div>
      )}

      {/* Profile Header Card */}
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 p-8 backdrop-blur-2xl shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white font-extrabold text-2xl shadow-xl ring-4 ring-indigo-500/20">
              {fullUser?.fullName?.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-2xl font-black text-white">{fullUser?.fullName}</h3>
                <Badge variant={fullUser?.role}>{fullUser?.role}</Badge>
                <Badge variant={fullUser?.status}>{fullUser?.status}</Badge>
              </div>
              <p className="mt-1 font-mono text-indigo-400 font-bold text-sm">{fullUser?.employeeId}</p>
              <p className="text-xs text-slate-300 mt-0.5">{fullUser?.designation} • {fullUser?.department} Department</p>
            </div>
          </div>
        </div>

        {/* Detailed Attribute Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <span className="text-slate-500 font-bold block mb-1">Email Address</span>
            <div className="flex items-center gap-2 text-white font-semibold">
              <Mail className="h-4 w-4 text-indigo-400" />
              <span>{fullUser?.email}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <span className="text-slate-500 font-bold block mb-1">Phone Number</span>
            <div className="flex items-center gap-2 text-white font-semibold">
              <Phone className="h-4 w-4 text-indigo-400" />
              <span>{fullUser?.phone}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <span className="text-slate-500 font-bold block mb-1">Joining Date</span>
            <div className="flex items-center gap-2 text-white font-semibold">
              <Calendar className="h-4 w-4 text-indigo-400" />
              <span>{fullUser?.joiningDate ? new Date(fullUser.joiningDate).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <span className="text-slate-500 font-bold block mb-1">Department</span>
            <div className="flex items-center gap-2 text-white font-semibold">
              <Building className="h-4 w-4 text-indigo-400" />
              <span>{fullUser?.department}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <span className="text-slate-500 font-bold block mb-1">Reporting Manager</span>
            <div className="flex items-center gap-2 text-white font-semibold">
              <Briefcase className="h-4 w-4 text-indigo-400" />
              <span>{fullUser?.managerId ? `${fullUser.managerId.fullName} (${fullUser.managerId.employeeId})` : 'Root Admin (HR)'}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <span className="text-slate-500 font-bold block mb-1">Logged Shifts</span>
            <div className="flex items-center gap-2 text-white font-semibold">
              <Clock className="h-4 w-4 text-emerald-400" />
              <span>{attendanceCount} Shift Logs</span>
            </div>
          </div>
        </div>

        {/* Update Form */}
        <div className="border-t border-slate-800 pt-6">
          <h4 className="text-sm font-bold text-white mb-4">Edit Personal Contact & Password</h4>
          <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter phone number"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 pl-10 pr-4 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">New Password (Optional)</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Leave blank to keep current password"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 pl-10 pr-4 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 hover:opacity-95 disabled:opacity-50 transition-all"
            >
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
