import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Badge from '../components/Badge';
import { validatePhone, validatePassword } from '../utils/validation';
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
  KeyRound,
  AlertCircle,
} from 'lucide-react';

const ProfilePage = () => {
  const { user, setUser } = useAuth();
  const [profileData, setProfileData] = useState(null);

  // Form Fields
  const [phone, setPhone] = useState(user?.phone || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [savingPhone, setSavingPhone] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
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

  const handleUpdatePhone = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    const phoneCheck = validatePhone(phone);
    if (!phoneCheck.isValid) {
      setError(phoneCheck.message);
      return;
    }

    setSavingPhone(true);

    try {
      const res = await api.put(`/employees/${user._id}`, { phone });
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
      setMessage('✅ Phone number updated successfully!');
      fetchFullSelfProfile();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update phone number.');
    } finally {
      setSavingPhone(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!oldPassword) {
      setError('Please enter your current password.');
      return;
    }

    const passCheck = validatePassword(newPassword);
    if (!passCheck.isValid) {
      setError(passCheck.message);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and Confirm password do not match.');
      return;
    }

    setSavingPass(true);

    try {
      await api.put(`/employees/${user._id}`, {
        oldPassword,
        newPassword,
      });

      setMessage('✅ Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setSavingPass(false);
    }
  };

  const fullUser = profileData?.user || user;
  const attendanceCount = profileData?.attendance?.length || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Account Profile & Security</h2>
        <p className="text-xs font-semibold text-slate-500">View personal employment details, manager hierarchy, and manage security credentials</p>
      </div>

      {message && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-700">
          <CheckCircle className="h-4 w-4" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-700">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Profile Identity Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-600 text-white font-black text-3xl shadow-md">
              {fullUser?.fullName?.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-2xl font-black text-slate-900">{fullUser?.fullName}</h3>
                <Badge variant={fullUser?.role}>{fullUser?.role}</Badge>
                <Badge variant={fullUser?.status}>{fullUser?.status}</Badge>
              </div>
              <p className="mt-1 font-mono text-indigo-600 font-bold text-sm">{fullUser?.employeeId}</p>
              <p className="text-xs font-semibold text-slate-600 mt-0.5">{fullUser?.designation} • {fullUser?.department} Department</p>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <span className="text-slate-500 font-bold block mb-1">Email Address</span>
            <div className="flex items-center gap-2 text-slate-900 font-extrabold">
              <Mail className="h-4 w-4 text-indigo-600" />
              <span className="truncate">{fullUser?.email}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <span className="text-slate-500 font-bold block mb-1">Phone Number</span>
            <div className="flex items-center gap-2 text-slate-900 font-extrabold">
              <Phone className="h-4 w-4 text-indigo-600" />
              <span>{fullUser?.phone}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <span className="text-slate-500 font-bold block mb-1">Joining Date</span>
            <div className="flex items-center gap-2 text-slate-900 font-extrabold">
              <Calendar className="h-4 w-4 text-indigo-600" />
              <span>{fullUser?.joiningDate ? new Date(fullUser.joiningDate).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <span className="text-slate-500 font-bold block mb-1">Department</span>
            <div className="flex items-center gap-2 text-slate-900 font-extrabold">
              <Building className="h-4 w-4 text-indigo-600" />
              <span>{fullUser?.department}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <span className="text-slate-500 font-bold block mb-1">Reporting Manager</span>
            <div className="flex items-center gap-2 text-slate-900 font-extrabold">
              <Briefcase className="h-4 w-4 text-indigo-600" />
              <span>{fullUser?.managerId ? `${fullUser.managerId.fullName} (${fullUser.managerId.employeeId})` : 'Root Admin (HR)'}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <span className="text-slate-500 font-bold block mb-1">Logged Shifts</span>
            <div className="flex items-center gap-2 text-slate-900 font-extrabold">
              <Clock className="h-4 w-4 text-emerald-600" />
              <span>{attendanceCount} Shift Records</span>
            </div>
          </div>
        </div>

        {/* Update Contact Form */}
        <div className="border-t border-slate-100 pt-6">
          <h4 className="text-sm font-black text-slate-900 mb-3">Update Contact Phone (10 Digits)</h4>
          <form onSubmit={handleUpdatePhone} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9876543210"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={savingPhone}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-all"
            >
              {savingPhone ? 'Saving...' : 'Update Phone'}
            </button>
          </form>
        </div>

        {/* Secure Password Change Section */}
        <div className="border-t border-slate-100 pt-6 space-y-4">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-indigo-600" />
            <h4 className="text-sm font-black text-slate-900">Change Security Password Credentials</h4>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Current Password *</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">New Password (Min 8 Chars, A-Z, a-z, 0-9) *</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="e.g. Password123"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Confirm New Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={savingPass}
              className="rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50 transition-all"
            >
              {savingPass ? 'Verifying & Updating...' : 'Update Password Credentials'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
