import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import Select from '../components/Select';
import EmployeeProfileModal from '../components/EmployeeProfileModal';
import { validatePhone, validatePassword } from '../utils/validation';
import {
  Users,
  Search,
  UserPlus,
  Edit2,
  UserX,
  UserCheck,
  Eye,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';

const ITEMS_PER_PAGE = 6;

const EmployeesList = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') || '');

  useEffect(() => {
    const urlStatus = searchParams.get('status') || '';
    if (urlStatus) setStatusFilter(urlStatus);
  }, [searchParams]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Deep Profile Modal
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Status Toggle Confirmation Modal
  const [targetStatusEmp, setTargetStatusEmp] = useState(null);
  const [isStatusConfirmModalOpen, setIsStatusConfirmModalOpen] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  // Create/Edit Modal
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    role: 'Employee',
    department: 'Engineering',
    designation: '',
    managerId: '',
    joiningDate: '',
    status: 'Active',
  });

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await api.get('/employees');
      setEmployees(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch employees list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const openCreateModal = () => {
    setEditingEmployee(null);
    setFormData({
      fullName: '',
      email: '',
      password: '',
      phone: '',
      role: 'Employee',
      department: 'Engineering',
      designation: '',
      managerId: '',
      joiningDate: new Date().toISOString().split('T')[0],
      status: 'Active',
    });
    setFormError('');
    setIsFormModalOpen(true);
  };

  const openEditModal = (emp) => {
    setEditingEmployee(emp);
    setFormData({
      fullName: emp.fullName || '',
      email: emp.email || '',
      password: '',
      phone: emp.phone || '',
      role: emp.role || 'Employee',
      department: emp.department || 'Engineering',
      designation: emp.designation || '',
      managerId: emp.managerId?._id || emp.managerId || '',
      joiningDate: emp.joiningDate ? emp.joiningDate.split('T')[0] : '',
      status: emp.status || 'Active',
    });
    setFormError('');
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!validatePhone(formData.phone)) {
      setFormError('Phone number must contain exactly 10 numeric digits.');
      return;
    }

    if (!editingEmployee && !validatePassword(formData.password)) {
      setFormError('Password must be at least 8 characters with upper, lower, and numeric digits.');
      return;
    }

    setFormLoading(true);

    try {
      if (editingEmployee) {
        await api.put(`/employees/${editingEmployee._id}`, formData);
      } else {
        await api.post('/employees', formData);
      }
      setIsFormModalOpen(false);
      fetchEmployees();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save employee profile.');
    } finally {
      setFormLoading(false);
    }
  };

  const openStatusConfirmModal = (emp) => {
    setTargetStatusEmp(emp);
    setIsStatusConfirmModalOpen(true);
  };

  const handleConfirmStatusToggle = async () => {
    if (!targetStatusEmp) return;
    const newStatus = targetStatusEmp.status === 'Active' ? 'Inactive' : 'Active';
    setStatusLoading(true);
    try {
      await api.put(`/employees/${targetStatusEmp._id}`, { status: newStatus });
      setIsStatusConfirmModalOpen(false);
      fetchEmployees();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update employee status.');
    } finally {
      setStatusLoading(false);
    }
  };

  // Filter Logic
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = departmentFilter ? emp.department === departmentFilter : true;
    const matchesRole = roleFilter ? emp.role === roleFilter : true;
    const matchesStatus = statusFilter ? emp.status === statusFilter : true;

    return matchesSearch && matchesDept && matchesRole && matchesStatus;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedEmployees = filteredEmployees.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const role = user?.role;

  // Custom Dropdown Option Lists
  const departmentOptions = [
    { label: 'All Departments', value: '' },
    { label: 'HR', value: 'HR' },
    { label: 'Engineering', value: 'Engineering' },
    { label: 'Sales', value: 'Sales' },
    { label: 'Operations', value: 'Operations' },
  ];

  const roleOptions = [
    { label: 'All Roles', value: '' },
    { label: 'HR Lead', value: 'HR' },
    { label: 'Manager', value: 'Manager' },
    { label: 'Employee', value: 'Employee' },
  ];

  const statusOptions = [
    { label: 'All Statuses', value: '' },
    { label: 'Active Accounts', value: 'Active' },
    { label: 'Deactivated Accounts', value: 'Inactive' },
  ];

  const formRoleOptions = [
    { label: 'Employee', value: 'Employee' },
    { label: 'Manager', value: 'Manager' },
    { label: 'HR Lead', value: 'HR' },
  ];

  const formDeptOptions = [
    { label: 'HR', value: 'HR' },
    { label: 'Engineering', value: 'Engineering' },
    { label: 'Sales', value: 'Sales' },
    { label: 'Operations', value: 'Operations' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Employees Directory</h2>
          <p className="text-xs font-bold text-slate-700">Manage staff, roles, and employee profiles</p>
        </div>

        {role === 'HR' && (
          <button
            onClick={openCreateModal}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add New Employee</span>
          </button>
        )}
      </div>

      {/* Filter & Search Bar with Custom Select Dropdowns */}
      <div className="rounded-2xl border border-blue-200 bg-white p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name, email, or employee ID..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-blue-200 bg-sky-50/60 pl-10 pr-4 py-2.5 text-xs font-black text-slate-900 placeholder-slate-500 focus:border-blue-600 focus:bg-white focus:outline-none"
            />
          </div>

          <Select
            options={departmentOptions}
            value={departmentFilter}
            onChange={(val) => {
              setDepartmentFilter(val);
              setCurrentPage(1);
            }}
            placeholder="All Departments"
            icon={Filter}
          />

          <Select
            options={roleOptions}
            value={roleFilter}
            onChange={(val) => {
              setRoleFilter(val);
              setCurrentPage(1);
            }}
            placeholder="All Roles"
          />

          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setCurrentPage(1);
            }}
            placeholder="All Statuses"
          />
        </div>
      </div>

      {/* Main Grid View */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : paginatedEmployees.length === 0 ? (
        <div className="rounded-2xl border border-blue-200 bg-white p-12 text-center">
          <p className="text-sm font-black text-slate-800">No employees found matching your search filters.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
            {paginatedEmployees.map((emp) => (
              <div
                key={emp._id}
                className="rounded-2xl border border-blue-200 bg-white p-4 sm:p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3 sm:space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white font-black text-base shadow-sm">
                      {emp.fullName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-sm leading-tight">{emp.fullName}</h3>
                      <p className="text-xs font-mono font-black text-blue-700 mt-0.5">{emp.employeeId}</p>
                    </div>
                  </div>

                  <Badge variant={emp.status} size="xs">{emp.status}</Badge>
                </div>

                <div className="flex items-center justify-between border-t border-b border-slate-100 py-2 text-xs font-black text-slate-800">
                  <span>Role:</span>
                  <Badge variant={emp.role} size="xs">{emp.role}</Badge>
                </div>

                {/* Card Action Buttons */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => {
                      setSelectedProfileId(emp._id);
                      setIsProfileModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-blue-50 border border-blue-200 px-2.5 sm:px-3 py-1.5 text-xs font-black text-blue-900 hover:bg-blue-100 transition-all"
                  >
                    <Eye className="h-3.5 w-3.5 text-blue-700" />
                    <span className="hidden sm:inline">View Deep Profile</span>
                    <span className="sm:hidden">Profile</span>
                  </button>

                  {role === 'HR' && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(emp)}
                        className="p-1.5 rounded-lg text-slate-700 hover:bg-sky-100 hover:text-blue-700 transition-colors"
                        title="Edit Employee"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openStatusConfirmModal(emp)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          emp.status === 'Active'
                            ? 'text-rose-700 hover:bg-rose-50'
                            : 'text-emerald-700 hover:bg-emerald-50'
                        }`}
                        title={emp.status === 'Active' ? 'Deactivate Employee' : 'Activate Employee'}
                      >
                        {emp.status === 'Active' ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-blue-200 bg-white p-4 shadow-sm">
              <span className="text-xs font-black text-slate-800">
                Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, filteredEmployees.length)} of {filteredEmployees.length} employees
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 rounded-xl border border-blue-200 bg-sky-50 px-2.5 sm:px-3 py-1.5 text-xs font-black text-slate-900 hover:bg-blue-100 disabled:opacity-40 transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Previous</span>
                </button>

                <div className="text-xs font-black text-slate-900 px-2">
                  Page {currentPage} of {totalPages}
                </div>

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 rounded-xl border border-blue-200 bg-sky-50 px-2.5 sm:px-3 py-1.5 text-xs font-black text-slate-900 hover:bg-blue-100 disabled:opacity-40 transition-all"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Deep Profile View Modal */}
      <EmployeeProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        employeeId={selectedProfileId}
        isHR={role === 'HR'}
      />

      {/* Account Status Confirmation Modal */}
      <ConfirmModal
        isOpen={isStatusConfirmModalOpen}
        onClose={() => setIsStatusConfirmModalOpen(false)}
        onConfirm={handleConfirmStatusToggle}
        title={targetStatusEmp?.status === 'Active' ? 'Deactivate Employee Account' : 'Activate Employee Account'}
        message={`Are you sure you want to change the status of ${targetStatusEmp?.fullName} (${targetStatusEmp?.employeeId}) to ${targetStatusEmp?.status === 'Active' ? 'Inactive' : 'Active'}?`}
        confirmText={targetStatusEmp?.status === 'Active' ? 'Deactivate' : 'Activate'}
        variant={targetStatusEmp?.status === 'Active' ? 'danger' : 'success'}
        loading={statusLoading}
      />

      {/* Create / Edit Employee Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingEmployee ? `Edit Employee (${editingEmployee.employeeId})` : 'Add New Employee'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
          {formError && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-black text-rose-800">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-slate-900 font-black mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full rounded-xl border border-blue-200 bg-sky-50/50 p-2.5 text-slate-900 font-bold focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-900 font-black mb-1">Corporate Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-xl border border-blue-200 bg-sky-50/50 p-2.5 text-slate-900 font-bold focus:border-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-900 font-black mb-1">Phone Number (10 Digits) *</label>
              <input
                type="text"
                required
                maxLength={10}
                placeholder="9876543210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-xl border border-blue-200 bg-sky-50/50 p-2.5 text-slate-900 font-bold focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {!editingEmployee && (
            <div>
              <label className="block text-slate-900 font-black mb-1">Password (Min 8 chars, Upper, Lower, Number) *</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full rounded-xl border border-blue-200 bg-sky-50/50 p-2.5 text-slate-900 font-bold focus:border-blue-600 focus:outline-none"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Assigned Role *"
              options={formRoleOptions}
              value={formData.role}
              onChange={(val) => setFormData({ ...formData, role: val })}
            />
            <Select
              label="Department *"
              options={formDeptOptions}
              value={formData.department}
              onChange={(val) => setFormData({ ...formData, department: val })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-900 font-black mb-1">Designation</label>
              <input
                type="text"
                placeholder="e.g. Senior Frontend Dev"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="w-full rounded-xl border border-blue-200 bg-sky-50/50 p-2.5 text-slate-900 font-bold focus:border-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-900 font-black mb-1">Joining Date</label>
              <input
                type="date"
                value={formData.joiningDate}
                onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                className="w-full rounded-xl border border-blue-200 bg-sky-50/50 p-2.5 text-slate-900 font-bold focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={formLoading}
            className="w-full rounded-xl bg-blue-600 py-3 text-xs font-black text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 transition-all"
          >
            {formLoading ? 'Saving Profile...' : editingEmployee ? 'Update Profile' : 'Create Employee Account'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default EmployeesList;
