import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Badge from '../components/Badge';
import { User as UserIcon, Mail, Phone, Building, Briefcase, Calendar, ShieldCheck, CheckCircle } from 'lucide-react';

const ProfilePage = () => {
  const { user, setUser } = useAuth();
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleUpdatePhone = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const res = await api.put(`/employees/${user._id}`, { phone });
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
      setMessage('✅ Phone number updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update phone number.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">My Profile</h2>
        <p className="text-xs text-slate-400">View personal employment details and contact information</p>
      </div>

      {message && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-semibold text-emerald-400">
          <CheckCircle className="h-4 w-4" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-semibold text-rose-400">
          {error}
        </div>
      )}

      {/* Profile Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 backdrop-blur-xl shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 border-b border-slate-800 pb-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-xl ring-4 ring-indigo-500/20">
            <UserIcon className="h-10 w-10 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-extrabold text-white">{user?.fullName}</h3>
              <Badge variant={user?.role}>{user?.role}</Badge>
            </div>
            <p className="mt-0.5 text-xs font-mono text-indigo-400">{user?.employeeId}</p>
            <p className="text-xs text-slate-400 mt-1">{user?.designation} • {user?.department} Department</p>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="rounded-2xl border border-slate-800/80 bg-slate-800/40 p-4">
            <span className="text-slate-500 font-semibold block mb-1">Email Address</span>
            <div className="flex items-center gap-2 text-white font-medium">
              <Mail className="h-4 w-4 text-slate-400" />
              <span>{user?.email}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-slate-800/40 p-4">
            <span className="text-slate-500 font-semibold block mb-1">Joining Date</span>
            <div className="flex items-center gap-2 text-white font-medium">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span>{user?.joiningDate ? new Date(user.joiningDate).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-slate-800/40 p-4">
            <span className="text-slate-500 font-semibold block mb-1">Department & Role</span>
            <div className="flex items-center gap-2 text-white font-medium">
              <Building className="h-4 w-4 text-slate-400" />
              <span>{user?.department} ({user?.role})</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-slate-800/40 p-4">
            <span className="text-slate-500 font-semibold block mb-1">Account Status</span>
            <div className="flex items-center gap-2 text-white font-medium">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <Badge variant={user?.status}>{user?.status}</Badge>
            </div>
          </div>
        </div>

        {/* Update Phone Form */}
        <div className="border-t border-slate-800 pt-6">
          <h4 className="text-sm font-bold text-white mb-3">Update Phone Number</h4>
          <form onSubmit={handleUpdatePhone} className="flex gap-3">
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter new phone number"
              className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-indigo-500 disabled:opacity-50 transition-all"
            >
              {saving ? 'Saving...' : 'Update Phone'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
