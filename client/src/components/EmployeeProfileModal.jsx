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
} from 'lucide-react';

const EmployeeProfileModal = ({ isOpen, onClose, employeeId }) => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && employeeId) {
      const fetchDeepProfile = async () => {
        setLoading(true);
        setProfileData(null);
        try {
          const res = await api.get(`/employees/${employeeId}`);
          setProfileData(res.data);
        } catch (err) {
          console.error('Failed to load employee profile:', err);
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Employee General Details">
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : user ? (
        <div className="space-y-4 sm:space-y-5 text-xs">
          {/* Header Profile Card */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 rounded-2xl border border-blue-200 bg-sky-50/70 p-3.5 sm:p-4">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-blue-600 text-white font-black text-lg sm:text-xl shadow-md shrink-0">
              {user.fullName?.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-base sm:text-lg font-black text-slate-900 truncate">{user.fullName}</h4>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                <Badge variant={user.role} size="xs">{user.role}</Badge>
                <Badge variant={user.status} size="xs">{user.status}</Badge>
              </div>
              <p className="mt-1 font-mono text-blue-800 font-black text-xs truncate">{user.employeeId}</p>
              <p className="text-slate-700 mt-0.5 font-bold truncate">{user.designation || 'Staff Member'} • {user.department || 'General'}</p>
            </div>
          </div>

          {/* General Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 font-bold">
                <Mail className="h-3.5 w-3.5 text-blue-600" />
                <span>Email Address</span>
              </div>
              <p className="text-slate-900 font-extrabold text-xs truncate">{user.email || 'N/A'}</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 font-bold">
                <Phone className="h-3.5 w-3.5 text-blue-600" />
                <span>Phone Number</span>
              </div>
              <p className="text-slate-900 font-extrabold text-xs">{user.phone || 'N/A'}</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 font-bold">
                <Building className="h-3.5 w-3.5 text-blue-600" />
                <span>Department</span>
              </div>
              <p className="text-slate-900 font-extrabold text-xs">{user.department || 'General'}</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 font-bold">
                <Briefcase className="h-3.5 w-3.5 text-blue-600" />
                <span>Role & Designation</span>
              </div>
              <p className="text-slate-900 font-extrabold text-xs">{user.role} ({user.designation || 'Employee'})</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 font-bold">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                <span>Assigned Manager</span>
              </div>
              <p className="text-slate-900 font-extrabold text-xs truncate">
                {user.managerId ? `${user.managerId.fullName} (${user.managerId.employeeId})` : 'Root Admin (HR)'}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 font-bold">
                <Calendar className="h-3.5 w-3.5 text-blue-600" />
                <span>Date of Joining</span>
              </div>
              <p className="text-slate-900 font-extrabold text-xs">
                {user.joiningDate ? new Date(user.joiningDate).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-center py-6 text-slate-500 font-bold">Employee record not found.</p>
      )}
    </Modal>
  );
};

export default EmployeeProfileModal;
