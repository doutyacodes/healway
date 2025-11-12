// FILE: app/superadmin/admins/page.jsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserCog,
  Plus,
  Search,
  Edit2,
  Trash2,
  Mail,
  Phone,
  Building2,
  Shield,
  ShieldCheck,
  Loader2,
  X,
  Save,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Filter,
  UserCheck,
  UserX,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function SuperAdminAdminsPage() {
  const [admins, setAdmins] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterHospital, setFilterHospital] = useState("all");
  const [filterRole, setFilterRole] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    admins: 0,
    subAdmins: 0,
  });

  // Form state
  const [formData, setFormData] = useState({
    hospitalId: "",
    name: "",
    email: "",
    mobileNumber: "",
    password: "",
    role: "admin",
  });

  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchAdmins(), fetchHospitals()]);
    setLoading(false);
  };

  const fetchAdmins = async () => {
    try {
      const res = await fetch("/api/superadmin/admins");
      const data = await res.json();

      if (data.success) {
        setAdmins(data.admins);
        calculateStats(data.admins);
      } else {
        toast.error("Failed to load admins");
      }
    } catch (error) {
      toast.error("Error loading admins");
      console.error(error);
    }
  };

  const fetchHospitals = async () => {
    try {
      const res = await fetch("/api/superadmin/hospitals");
      const data = await res.json();

      if (data.success) {
        setHospitals(data.hospitals.filter(h => h.isActive));
      }
    } catch (error) {
      console.error("Error loading hospitals:", error);
    }
  };

  const calculateStats = (adminData) => {
    setStats({
      total: adminData.length,
      active: adminData.filter((a) => a.isActive).length,
      inactive: adminData.filter((a) => !a.isActive).length,
      admins: adminData.filter((a) => a.role === "admin").length,
      subAdmins: adminData.filter((a) => a.role === "sub_admin").length,
    });
  };

  const handleOpenModal = (mode, admin = null) => {
    setModalMode(mode);
    if (mode === "edit" && admin) {
      setSelectedAdmin(admin);
      setFormData({
        hospitalId: admin.hospitalId?.toString() || "",
        name: admin.name || "",
        email: admin.email || "",
        mobileNumber: admin.mobileNumber || "",
        password: "", // Don't populate password for security
        role: admin.role || "admin",
      });
    } else {
      setSelectedAdmin(null);
      setFormData({
        hospitalId: "",
        name: "",
        email: "",
        mobileNumber: "",
        password: "",
        role: "admin",
      });
    }
    setShowModal(true);
    setShowPassword(false);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedAdmin(null);
    setFormData({
      hospitalId: "",
      name: "",
      email: "",
      mobileNumber: "",
      password: "",
      role: "admin",
    });
    setShowPassword(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      // Validation
      if (!formData.hospitalId) {
        toast.error("Please select a hospital");
        setFormLoading(false);
        return;
      }

      if (modalMode === "create" && !formData.password) {
        toast.error("Password is required");
        setFormLoading(false);
        return;
      }

      if (modalMode === "create" && formData.password.length < 6) {
        toast.error("Password must be at least 6 characters");
        setFormLoading(false);
        return;
      }

      const url =
        modalMode === "create"
          ? "/api/superadmin/admins"
          : `/api/superadmin/admins/${selectedAdmin.id}`;

      const method = modalMode === "create" ? "POST" : "PUT";

      const payload = {
        ...formData,
        hospitalId: parseInt(formData.hospitalId),
      };

      // Don't send password if it's empty during edit
      if (modalMode === "edit" && !formData.password) {
        delete payload.password;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(
          modalMode === "create"
            ? "Admin created successfully!"
            : "Admin updated successfully!"
        );
        fetchAdmins();
        handleCloseModal();
      } else {
        toast.error(data.error || "Operation failed");
      }
    } catch (error) {
      toast.error("Something went wrong");
      console.error(error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (adminId) => {
    if (!confirm("Are you sure you want to delete this admin?")) {
      return;
    }

    try {
      const res = await fetch(`/api/superadmin/admins/${adminId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Admin deleted successfully!");
        fetchAdmins();
      } else {
        toast.error(data.error || "Failed to delete admin");
      }
    } catch (error) {
      toast.error("Error deleting admin");
      console.error(error);
    }
  };

  const handleToggleStatus = async (admin) => {
    try {
      const res = await fetch(`/api/superadmin/admins/${admin.id}/toggle-status`, {
        method: "PATCH",
      });

      const data = await res.json();

      if (data.success) {
        toast.success(`Admin ${admin.isActive ? 'deactivated' : 'activated'} successfully!`);
        fetchAdmins();
      } else {
        toast.error(data.error || "Failed to update status");
      }
    } catch (error) {
      toast.error("Error updating admin status");
      console.error(error);
    }
  };

  const filteredAdmins = admins.filter((admin) => {
    const matchesSearch =
      admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.hospitalName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesHospital =
      filterHospital === "all" ||
      admin.hospitalId === parseInt(filterHospital);

    const matchesRole =
      filterRole === "all" || admin.role === filterRole;

    return matchesSearch && matchesHospital && matchesRole;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              Hospital Admins
            </h1>
            <p className="text-slate-600">
              Manage hospital administrators and their permissions
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleOpenModal("create")}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="w-5 h-5" />
            Add Admin
          </motion.button>
        </motion.div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto mb-8 grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatsCard
          icon={UserCog}
          label="Total Admins"
          value={stats.total}
          color="blue"
          loading={loading}
        />
        <StatsCard
          icon={CheckCircle}
          label="Active"
          value={stats.active}
          color="green"
          loading={loading}
        />
        <StatsCard
          icon={AlertCircle}
          label="Inactive"
          value={stats.inactive}
          color="orange"
          loading={loading}
        />
        <StatsCard
          icon={Shield}
          label="Admins"
          value={stats.admins}
          color="purple"
          loading={loading}
        />
        <StatsCard
          icon={ShieldCheck}
          label="Sub-Admins"
          value={stats.subAdmins}
          color="indigo"
          loading={loading}
        />
      </div>

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, email, or hospital..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-12 pr-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filter by Hospital */}
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              <select
                value={filterHospital}
                onChange={(e) => setFilterHospital(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-12 pr-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
              >
                <option value="all">All Hospitals</option>
                {hospitals.map((hospital) => (
                  <option key={hospital.id} value={hospital.id}>
                    {hospital.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Role */}
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-12 pr-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="sub_admin">Sub Admin</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Admins Table */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : filteredAdmins.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl p-12 text-center shadow-sm"
          >
            <UserCog className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">
              No admins found
            </h3>
            <p className="text-slate-500">
              {searchQuery || filterHospital !== "all" || filterRole !== "all"
                ? "Try adjusting your filters"
                : "Get started by adding your first admin"}
            </p>
          </motion.div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Admin
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Hospital
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredAdmins.map((admin, index) => (
                    <AdminRow
                      key={admin.id}
                      admin={admin}
                      index={index}
                      onEdit={() => handleOpenModal("edit", admin)}
                      onDelete={() => handleDelete(admin.id)}
                      onToggleStatus={() => handleToggleStatus(admin)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <AdminModal
            mode={modalMode}
            formData={formData}
            setFormData={setFormData}
            hospitals={hospitals}
            onSubmit={handleSubmit}
            onClose={handleCloseModal}
            loading={formLoading}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Stats Card Component
function StatsCard({ icon: Icon, label, value, color, loading }) {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    orange: "from-orange-500 to-orange-600",
    purple: "from-purple-500 to-purple-600",
    indigo: "from-indigo-500 to-indigo-600",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-5 shadow-sm border border-slate-100"
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center shadow-lg`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-slate-600 text-xs font-medium">{label}</p>
          <p className="text-xl font-bold text-slate-900">
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              value
            )}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// Admin Row Component
function AdminRow({ admin, index, onEdit, onDelete, onToggleStatus }) {
  return (
    <motion.tr
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="hover:bg-slate-50 transition-colors"
    >
      {/* Admin Info */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
            {admin.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-slate-900">{admin.name}</div>
            <div className="text-sm text-slate-500">{admin.email}</div>
          </div>
        </div>
      </td>

      {/* Hospital */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-400" />
          <span className="text-slate-700">{admin.hospitalName}</span>
        </div>
      </td>

      {/* Contact */}
      <td className="px-6 py-4 whitespace-nowrap">
        {admin.mobileNumber ? (
          <div className="flex items-center gap-2 text-slate-600">
            <Phone className="w-4 h-4" />
            <span className="text-sm">{admin.mobileNumber}</span>
          </div>
        ) : (
          <span className="text-slate-400 text-sm">No phone</span>
        )}
      </td>

      {/* Role */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            admin.role === "admin"
              ? "bg-purple-100 text-purple-700"
              : "bg-indigo-100 text-indigo-700"
          }`}
        >
          {admin.role === "admin" ? "Admin" : "Sub Admin"}
        </span>
      </td>

      {/* Status */}
      <td className="px-6 py-4 whitespace-nowrap">
        <button
          onClick={onToggleStatus}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
            admin.isActive
              ? "bg-green-100 text-green-700 hover:bg-green-200"
              : "bg-red-100 text-red-700 hover:bg-red-200"
          }`}
        >
          {admin.isActive ? "Active" : "Inactive"}
        </button>
      </td>

      {/* Actions */}
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className="flex items-center justify-end gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onEdit}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit Admin"
          >
            <Edit2 className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onDelete}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Admin"
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </div>
      </td>
    </motion.tr>
  );
}

// Admin Modal Component
function AdminModal({
  mode,
  formData,
  setFormData,
  hospitals,
  onSubmit,
  onClose,
  loading,
  showPassword,
  setShowPassword,
}) {
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            {mode === "create" ? "Add New Admin" : "Edit Admin"}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="space-y-5">
            {/* Hospital Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Hospital *
              </label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <select
                  name="hospitalId"
                  value={formData.hospitalId}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-300 rounded-xl pl-12 pr-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                  required
                >
                  <option value="">Select Hospital</option>
                  {hospitals.map((hospital) => (
                    <option key={hospital.id} value={hospital.id}>
                      {hospital.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter full name"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-300 rounded-xl pl-12 pr-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="admin@hospital.com"
                  required
                />
              </div>
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Mobile Number
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <input
                  type="tel"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-300 rounded-xl pl-12 pr-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+91 1234567890"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Password {mode === "create" && "*"}
                {mode === "edit" && (
                  <span className="text-xs font-normal text-slate-500 ml-2">
                    (Leave blank to keep current password)
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 pr-12 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                  required={mode === "create"}
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {mode === "create" && (
                <p className="text-xs text-slate-500 mt-1">
                  Password must be at least 6 characters
                </p>
              )}
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Role *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label
                  className={`flex items-center justify-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    formData.role === "admin"
                      ? "border-purple-500 bg-purple-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value="admin"
                    checked={formData.role === "admin"}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <Shield className="w-5 h-5 text-purple-600" />
                  <span className="font-semibold text-slate-900">Admin</span>
                </label>
                <label
                  className={`flex items-center justify-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    formData.role === "sub_admin"
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value="sub_admin"
                    checked={formData.role === "sub_admin"}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  <span className="font-semibold text-slate-900">Sub Admin</span>
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 text-slate-700 px-6 py-3 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {mode === "create" ? "Creating..." : "Updating..."}
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {mode === "create" ? "Create Admin" : "Update Admin"}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}