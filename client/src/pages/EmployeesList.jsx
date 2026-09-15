import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import { Search, Plus, Edit2, Power, UserPlus, Mail, Phone, Building, Shield } from 'lucide-react';

const EmployeesList = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    employeeId: '',
    fullName: '',
    email: '',
    password: '',
    phone: '',
    role: 'Employee',
    department: 'Engineering',
    designation: '',
    managerId: '',
    joiningDate: new Date().toISOString().split('T')[0],
  });

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (departmentFilter) queryParams.append('department', departmentFilter);
      if (statusFilter) queryParams.append('status', statusFilter);

      const res = await api.get(`/employees?${queryParams.toString()}`);
      setEmployees(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch employees list.');
    } finally {
      setLoading(false);
    }
  };

  const fetchManagers = async () => {
    if (user?.role === 'HR') {
      try {
        const res = await api.get('/employees/managers/list');
        setManagers(res.data);
      } catch (err) {
        console.error('Failed to load managers list:', err);
      }
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchManagers();
  }, [search, departmentFilter, statusFilter]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/employees', formData);
      setIsAddModalOpen(false);
      resetForm();
      fetchEmployees();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create employee');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/employees/${selectedEmployee._id}`, formData);
      setIsEditModalOpen(false);
      setSelectedEmployee(null);
      resetForm();
      fetchEmployees();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update employee');
    }
  };

  const handleToggleStatus = async (empId, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    if (window.confirm(`Are you sure you want to change status to ${newStatus}?`)) {
      try {
        await api.patch(`/employees/${empId}/status`, { status: newStatus });
        fetchEmployees();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to update status');
      }
    }
  };

  const openEditModal = (emp) => {
    setSelectedEmployee(emp);
    setFormData({
      employeeId: emp.employeeId,
      fullName: emp.fullName,
      email: emp.email,
      password: '', // leave empty unless changing
      phone: emp.phone,
      role: emp.role,
      department: emp.department,
      designation: emp.designation,
      managerId: emp.managerId?._id || '',
      joiningDate: emp.joiningDate ? new Date(emp.joiningDate).toISOString().split('T')[0] : '',
    });
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      employeeId: '',
      fullName: '',
      email: '',
      password: '',
      phone: '',
      role: 'Employee',
      department: 'Engineering',
      designation: '',
      managerId: '',
      joiningDate: new Date().toISOString().split('T')[0],
    });
  };

  const isHR = user?.role === 'HR';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Employee Directory</h2>
          <p className="text-xs text-slate-400">Manage company staff, role permissions & reporting lines</p>
        </div>
        {isHR && (
          <button
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:opacity-95"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add New Employee</span>
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-xl md:grid-cols-4">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by Name, Email, or Employee ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-700/60 bg-slate-800/60 pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Department Filter */}
        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="rounded-xl border border-slate-700/60 bg-slate-800/60 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
        >
          <option value="">All Departments</option>
          <option value="Engineering">Engineering</option>
          <option value="HR">HR</option>
          <option value="Sales">Sales</option>
          <option value="Marketing">Marketing</option>
          <option value="Finance">Finance</option>
          <option value="Operations">Operations</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-700/60 bg-slate-800/60 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="Active">Active Only</option>
          <option value="Inactive">Inactive Only</option>
        </select>
      </div>

      {/* Employees Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl shadow-xl">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          </div>
        ) : employees.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm font-semibold text-slate-400">No employees found matching the filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Role / Dept</th>
                  <th className="py-3 px-4">Manager</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Status</th>
                  {isHR && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {employees.map((emp) => (
                  <tr key={emp._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-semibold text-white">{emp.fullName}</span>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                          <span className="font-mono text-indigo-400">{emp.employeeId}</span>
                          <span>•</span>
                          <span>{emp.designation}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1">
                        <Badge variant={emp.role}>{emp.role}</Badge>
                        <span className="text-xs text-slate-400">{emp.department}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      {emp.managerId ? (
                        <div>
                          <span className="font-semibold text-slate-200">{emp.managerId.fullName}</span>
                          <p className="text-slate-500 font-mono">{emp.managerId.employeeId}</p>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">None (Root)</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs space-y-0.5">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Mail className="h-3.5 w-3.5 text-slate-500" />
                        <span>{emp.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Phone className="h-3.5 w-3.5 text-slate-500" />
                        <span>{emp.phone}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={emp.status}>{emp.status}</Badge>
                    </td>
                    {isHR && (
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(emp)}
                            title="Edit Employee"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-indigo-400 transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(emp._id, emp.status)}
                            title={emp.status === 'Active' ? 'Deactivate Account' : 'Activate Account'}
                            className={`rounded-lg p-1.5 transition-colors ${
                              emp.status === 'Active'
                                ? 'text-emerald-400 hover:bg-rose-500/10 hover:text-rose-400'
                                : 'text-rose-400 hover:bg-emerald-500/10 hover:text-emerald-400'
                            }`}
                          >
                            <Power className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Employee Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isEditModalOpen ? 'Edit Employee Details' : 'Add New Employee'}
      >
        <form onSubmit={isEditModalOpen ? handleEditSubmit : handleCreateSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Employee ID</label>
              <input
                type="text"
                required
                disabled={isEditModalOpen}
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                placeholder="EMP-1010"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 p-2.5 text-white disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="John Smith"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 p-2.5 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="name@company.com"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 p-2.5 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Password {isEditModalOpen && '(leave blank to keep current)'}</label>
              <input
                type="password"
                required={!isEditModalOpen}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 p-2.5 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Phone</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="9876543210"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 p-2.5 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Joining Date</label>
              <input
                type="date"
                required
                value={formData.joiningDate}
                onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 p-2.5 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 p-2.5 text-white"
              >
                <option value="Employee">Employee</option>
                <option value="Manager">Manager</option>
                <option value="HR">HR Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Department</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 p-2.5 text-white"
              >
                <option value="Engineering">Engineering</option>
                <option value="HR">HR</option>
                <option value="Sales">Sales</option>
                <option value="Marketing">Marketing</option>
                <option value="Finance">Finance</option>
                <option value="Operations">Operations</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Designation</label>
              <input
                type="text"
                required
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                placeholder="Software Engineer"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 p-2.5 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Assign Manager</label>
              <select
                value={formData.managerId}
                onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 p-2.5 text-white"
              >
                <option value="">None (Top Level HR)</option>
                {managers.map((mgr) => (
                  <option key={mgr._id} value={mgr._id}>
                    {mgr.fullName} ({mgr.role} - {mgr.department})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3 text-xs font-semibold text-white shadow-lg transition-all hover:opacity-95"
          >
            {isEditModalOpen ? 'Save Employee Changes' : 'Create Employee Record'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default EmployeesList;
