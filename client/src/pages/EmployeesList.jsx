import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import EmployeeProfileModal from '../components/EmployeeProfileModal';
import { validatePhone, validatePassword, validateEmail } from '../utils/validation';
import {
  Search,
  UserPlus,
  Edit2,
  Power,
  Eye,
  Mail,
  Phone,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Briefcase,
  Building,
} from 'lucide-react';

const ITEMS_PER_PAGE = 6;

const EmployeesList = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Layout View Mode (Grid vs Table) - Default to Grid on mobile
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);

  // Profile View Modal
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Edit / Add Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Validation Error State
  const [formError, setFormError] = useState('');

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
      setCurrentPage(1); // reset to first page on search/filter change
    } catch (err) {
      console.error('Failed to fetch employees list:', err);
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

  // Validation helper before submit
  const validateFormInput = (isEdit = false) => {
    setFormError('');

    const emailCheck = validateEmail(formData.email);
    if (!emailCheck.isValid) {
      setFormError(emailCheck.message);
      return false;
    }

    const phoneCheck = validatePhone(formData.phone);
    if (!phoneCheck.isValid) {
      setFormError(phoneCheck.message);
      return false;
    }

    if (!isEdit || formData.password.trim()) {
      const passCheck = validatePassword(formData.password);
      if (!passCheck.isValid) {
        setFormError(passCheck.message);
        return false;
      }
    }

    return true;
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!validateFormInput(false)) return;

    try {
      await api.post('/employees', formData);
      setIsAddModalOpen(false);
      resetForm();
      fetchEmployees();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create employee');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateFormInput(true)) return;

    try {
      await api.put(`/employees/${selectedEmployee._id}`, formData);
      setIsEditModalOpen(false);
      setSelectedEmployee(null);
      resetForm();
      fetchEmployees();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to update employee');
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

  const openProfileView = (empId) => {
    setSelectedProfileId(empId);
    setIsProfileModalOpen(true);
  };

  const openEditModal = (emp) => {
    setSelectedEmployee(emp);
    setFormError('');
    setFormData({
      employeeId: emp.employeeId,
      fullName: emp.fullName,
      email: emp.email,
      password: '',
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
    setFormError('');
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

  // Pagination calculation
  const totalPages = Math.ceil(employees.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedEmployees = employees.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      {/* Page Title & Add Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Employees Directory</h2>
          <p className="text-xs font-semibold text-slate-500">Corporate personnel records & team assignment directory</p>
        </div>
        {isHR && (
          <button
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition-all"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add New Employee</span>
          </button>
        )}
      </div>

      {/* Filters Bar & Layout Toggle */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="grid grid-cols-1 gap-3 md:flex md:flex-1 md:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Name, Email, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-indigo-600 focus:outline-none"
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
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-indigo-600 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active Only</option>
            <option value="Inactive">Inactive Only</option>
          </select>
        </div>

        {/* View Mode Toggle (Grid vs Table) */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200/80 self-end md:self-center">
          <button
            onClick={() => setViewMode('grid')}
            title="Grid View (Mobile Friendly)"
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">Grid</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            title="Table View (Desktop Only)"
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              viewMode === 'table' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">Table</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      ) : employees.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-sm font-extrabold text-slate-500">No employees found matching your search parameters.</p>
        </div>
      ) : (
        <>
          {/* Responsive Grid View (Default & Mobile Friendly) */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedEmployees.map((emp) => (
                <div
                  key={emp._id}
                  onClick={() => openProfileView(emp._id)}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white font-black text-sm shadow-sm">
                          {emp.fullName.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {emp.fullName}
                          </h4>
                          <span className="font-mono text-xs font-bold text-indigo-600">{emp.employeeId}</span>
                        </div>
                      </div>
                      <Badge variant={emp.status} size="xs">{emp.status}</Badge>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-800">{emp.designation}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building className="h-3.5 w-3.5 text-slate-400" />
                        <span>{emp.department} • <Badge variant={emp.role} size="xs">{emp.role}</Badge></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        <span className="truncate">{emp.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        <span>{emp.phone}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => openProfileView(emp._id)}
                      className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Deep Profile</span>
                    </button>

                    {isHR && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(emp)}
                          title="Edit Employee"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(emp._id, emp.status)}
                          title={emp.status === 'Active' ? 'Deactivate' : 'Activate'}
                          className={`rounded-lg p-1.5 transition-colors ${
                            emp.status === 'Active' ? 'text-emerald-600 hover:bg-rose-50 hover:text-rose-600' : 'text-rose-600 hover:bg-emerald-50 hover:text-emerald-600'
                          }`}
                        >
                          <Power className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Table View for Desktop */
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Role / Dept</th>
                    <th className="py-3 px-4">Manager</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedEmployees.map((emp) => (
                    <tr
                      key={emp._id}
                      onClick={() => openProfileView(emp._id)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-slate-900">{emp.fullName}</span>
                        <p className="text-xs text-slate-500 font-mono">{emp.employeeId} • {emp.designation}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={emp.role} size="xs">{emp.role}</Badge>
                        <p className="text-xs text-slate-500 mt-0.5">{emp.department}</p>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                        {emp.managerId ? emp.managerId.fullName : 'Root Admin (HR)'}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        <div>{emp.email}</div>
                        <div>{emp.phone}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={emp.status} size="xs">{emp.status}</Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openProfileView(emp._id)}
                            className="flex items-center gap-1 rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-bold text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>View</span>
                          </button>
                          {isHR && (
                            <>
                              <button
                                onClick={() => openEditModal(emp)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleToggleStatus(emp._id, emp.status)}
                                className="p-1.5 text-slate-400 hover:text-rose-600"
                              >
                                <Power className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Clean Pagination Bar */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="text-xs font-bold text-slate-500">
                Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, employees.length)} of {employees.length} employees
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </button>

                <div className="flex items-center gap-1 text-xs font-extrabold text-slate-700 px-2">
                  <span>Page {currentPage} of {totalPages}</span>
                </div>

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-all"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Employee Profile View Modal */}
      <EmployeeProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        employeeId={selectedProfileId}
        onEdit={openEditModal}
        onToggleStatus={handleToggleStatus}
        isHR={isHR}
      />

      {/* Add / Edit Modal with General Security Input Validation */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isEditModalOpen ? 'Edit Employee Record' : 'Add New Employee'}
      >
        <form onSubmit={isEditModalOpen ? handleEditSubmit : handleCreateSubmit} className="space-y-4 text-xs">
          {formError && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Employee ID *</label>
              <input
                type="text"
                required
                disabled={isEditModalOpen}
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                placeholder="EMP-1010"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="John Smith"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Corporate Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="name@company.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Password {isEditModalOpen ? '(leave blank to keep)' : '*'}
              </label>
              <input
                type="password"
                required={!isEditModalOpen}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Min 8 chars (A-Z, a-z, 0-9)"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Phone Number (10 Digits) *</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="9876543210"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Joining Date *</label>
              <input
                type="date"
                required
                value={formData.joiningDate}
                onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 font-semibold"
              >
                <option value="Employee">Employee</option>
                <option value="Manager">Manager</option>
                <option value="HR">HR Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Department *</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 font-semibold"
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
              <label className="block text-slate-700 font-bold mb-1">Designation *</label>
              <input
                type="text"
                required
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                placeholder="Software Engineer"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Assign Manager</label>
              <select
                value={formData.managerId}
                onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 font-semibold"
              >
                <option value="">None (Root HR)</option>
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
            className="w-full rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition-all"
          >
            {isEditModalOpen ? 'Save Employee Changes' : 'Create Employee Record'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default EmployeesList;
