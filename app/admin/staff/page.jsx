// FILE: app/admin/staff/page.jsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserCog,
  Plus,
  Edit2,
  Trash2,
  Search,
  Loader2,
  X,
  Save,
  Building,
  Phone,
  Mail,
  Shield,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
  Eye,
  EyeOff,
  Users,
  Stethoscope,
  Info,
  Badge,
  AlertCircle,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function StaffPage() {
  const [staff, setStaff] = useState([]);
  const [wings, setWings] = useState([]);
  const [nursingSections, setNursingSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterWing, setFilterWing] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [staffType, setStaffType] = useState("nurse");
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    nurses: 0,
    security: 0,
    active: 0,
    inactive: 0,
  });

  // Nurse Form Data
  const [nurseFormData, setNurseFormData] = useState({
    sectionId: "",
    name: "",
    email: "",
    mobileNumber: "",
    password: "",
    employeeId: "",
    shiftTiming: "",
  });

  // Security Form Data
  const [securityFormData, setSecurityFormData] = useState({
    assignedWingId: "",
    name: "",
    mobileNumber: "",
    username: "",
    password: "",
    employeeId: "",
    shiftTiming: "",
    photoUrl: "",
  });

  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchStaff(), fetchWings(), fetchNursingSections()]);
    setLoading(false);
  };

  const fetchStaff = async () => {
    try {
      const res = await fetch("/api/admin/staff");
      const data = await res.json();

      if (data.success) {
        setStaff(data.staff);
        calculateStats(data.staff);
      } else {
        toast.error("Failed to load staff");
      }
    } catch (error) {
      toast.error("Error loading staff");
      console.error(error);
    }
  };

  const fetchWings = async () => {
    try {
      const res = await fetch("/api/admin/wings");
      const data = await res.json();

      if (data.success) {
        setWings(data.wings.filter((w) => w.isActive));
      }
    } catch (error) {
      console.error("Error loading wings:", error);
    }
  };

  const fetchNursingSections = async () => {
    try {
      const res = await fetch("/api/admin/nursing-sections");
      const data = await res.json();

      if (data.success) {
        setNursingSections(data.sections);
      }
    } catch (error) {
      console.error("Error loading nursing sections:", error);
    }
  };

  const calculateStats = (staffData) => {
    setStats({
      total: staffData.length,
      nurses: staffData.filter((s) => s.type === "nurse").length,
      security: staffData.filter((s) => s.type === "security").length,
      active: staffData.filter((s) => s.isActive).length,
      inactive: staffData.filter((s) => !s.isActive).length,
    });
  };

  const handleOpenModal = (mode, type, member = null) => {
    setModalMode(mode);
    setStaffType(type);

    if (mode === "edit" && member) {
      setSelectedStaff(member);
      if (type === "nurse") {
        setNurseFormData({
          sectionId: member.sectionId?.toString() || "",
          name: member.name || "",
          email: member.email || "",
          mobileNumber: member.mobileNumber || "",
          password: "",
          employeeId: member.employeeId || "",
          shiftTiming: member.shiftTiming || "",
        });
      } else {
        setSecurityFormData({
          assignedWingId: member.assignedWingId?.toString() || "",
          name: member.name || "",
          mobileNumber: member.mobileNumber || "",
          username: member.username || "",
          password: "",
          employeeId: member.employeeId || "",
          shiftTiming: member.shiftTiming || "",
          photoUrl: member.photoUrl || "",
        });
      }
    } else {
      setSelectedStaff(null);
      if (type === "nurse") {
        setNurseFormData({
          sectionId: "",
          name: "",
          email: "",
          mobileNumber: "",
          password: "",
          employeeId: "",
          shiftTiming: "",
        });
      } else {
        setSecurityFormData({
          assignedWingId: "",
          name: "",
          mobileNumber: "",
          username: "",
          password: "",
          employeeId: "",
          shiftTiming: "",
          photoUrl: "",
        });
      }
    }
    setShowModal(true);
    setShowPassword(false);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedStaff(null);
    setNurseFormData({
      sectionId: "",
      name: "",
      email: "",
      mobileNumber: "",
      password: "",
      employeeId: "",
      shiftTiming: "",
    });
    setSecurityFormData({
      assignedWingId: "",
      name: "",
      mobileNumber: "",
      username: "",
      password: "",
      employeeId: "",
      shiftTiming: "",
      photoUrl: "",
    });
    setShowPassword(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const formData = staffType === "nurse" ? nurseFormData : securityFormData;
      
      // Validation
      if (staffType === "nurse" && !formData.sectionId) {
        toast.error("Please select a nursing section");
        setFormLoading(false);
        return;
      }

      if (staffType === "security" && !formData.assignedWingId) {
        toast.error("Please select a wing for security assignment");
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

      const endpoint = staffType === "nurse" ? "nurses" : "security";
      const url =
        modalMode === "create"
          ? `/api/admin/${endpoint}`
          : `/api/admin/${endpoint}/${selectedStaff.id}`;

      const method = modalMode === "create" ? "POST" : "PUT";

      const payload = {
        ...formData,
        sectionId: formData.sectionId ? parseInt(formData.sectionId) : undefined,
        assignedWingId: formData.assignedWingId ? parseInt(formData.assignedWingId) : undefined,
      };

      // Don't send password if empty during edit
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
            ? `${staffType === "nurse" ? "Nurse" : "Security"} created successfully!`
            : `${staffType === "nurse" ? "Nurse" : "Security"} updated successfully!`
        );
        fetchStaff();
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

  const handleDelete = async (member) => {
    if (!confirm(`Are you sure you want to delete this ${member.type}?`)) {
      return;
    }

    try {
      const endpoint = member.type === "nurse" ? "nurses" : "security";
      const res = await fetch(`/api/admin/${endpoint}/${member.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        toast.success(`${member.type === "nurse" ? "Nurse" : "Security"} deleted successfully!`);
        fetchStaff();
      } else {
        toast.error(data.error || "Failed to delete");
      }
    } catch (error) {
      toast.error("Error deleting staff member");
      console.error(error);
    }
  };

  const handleToggleStatus = async (member) => {
    try {
      const endpoint = member.type === "nurse" ? "nurses" : "security";
      const res = await fetch(`/api/admin/${endpoint}/${member.id}/toggle-status`, {
        method: "PATCH",
      });

      const data = await res.json();

      if (data.success) {
        toast.success(`${member.type === "nurse" ? "Nurse" : "Security"} ${member.isActive ? "deactivated" : "activated"} successfully!`);
        fetchStaff();
      } else {
        toast.error(data.error || "Failed to update status");
      }
    } catch (error) {
      toast.error("Error updating status");
      console.error(error);
    }
  };

  const filteredStaff = staff.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.mobileNumber?.includes(searchQuery) ||
      member.employeeId?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === "all" || member.type === filterType;

    const matchesWing =
      filterWing === "all" ||
      (member.type === "nurse" && member.wingId === parseInt(filterWing)) ||
      (member.type === "security" && member.assignedWingId === parseInt(filterWing));

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && member.isActive) ||
      (filterStatus === "inactive" && !member.isActive);

    return matchesSearch && matchesType && matchesWing && matchesStatus;
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
              Staff Management
            </h1>
            <p className="text-slate-600">Manage nurses and security personnel</p>
          </div>
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleOpenModal("create", "nurse")}
              className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="w-5 h-5" />
              Add Nurse
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleOpenModal("create", "security")}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="w-5 h-5" />
              Add Security
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto mb-8 grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatsCard
          icon={UserCog}
          label="Total Staff"
          value={stats.total}
          color="blue"
          loading={loading}
        />
        <StatsCard
          icon={Stethoscope}
          label="Nurses"
          value={stats.nurses}
          color="green"
          loading={loading}
        />
        <StatsCard
          icon={Shield}
          label="Security"
          value={stats.security}
          color="indigo"
          loading={loading}
        />
        <StatsCard
          icon={CheckCircle}
          label="Active"
          value={stats.active}
          color="emerald"
          loading={loading}
        />
        <StatsCard
          icon={XCircle}
          label="Inactive"
          value={stats.inactive}
          color="slate"
          loading={loading}
        />
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-12 pr-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filter by Type */}
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-12 pr-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
              >
                <option value="all">All Types</option>
                <option value="nurse">Nurses</option>
                <option value="security">Security</option>
              </select>
            </div>

            {/* Filter by Wing */}
            <div className="relative">
              <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              <select
                value={filterWing}
                onChange={(e) => setFilterWing(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-12 pr-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
              >
                <option value="all">All Wings</option>
                {wings.map((wing) => (
                  <option key={wing.id} value={wing.id}>
                    {wing.wingName}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Status */}
            <div className="relative">
              <Activity className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-12 pr-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : filteredStaff.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl p-12 text-center shadow-sm"
          >
            <UserCog className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">
              No staff members found
            </h3>
            <p className="text-slate-500">
              {searchQuery || filterType !== "all" || filterWing !== "all" || filterStatus !== "all"
                ? "Try adjusting your filters"
                : "Get started by adding your first staff member"}
            </p>
          </motion.div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Staff Member
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Assignment
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Shift
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Type
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
                  {filteredStaff.map((member, index) => (
                    <StaffRow
                      key={`${member.type}-${member.id}`}
                      member={member}
                      index={index}
                      onEdit={() => handleOpenModal("edit", member.type, member)}
                      onDelete={() => handleDelete(member)}
                      onToggleStatus={() => handleToggleStatus(member)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Staff Modal */}
      <AnimatePresence>
        {showModal && (
          <StaffModal
            mode={modalMode}
            staffType={staffType}
            nurseFormData={nurseFormData}
            setNurseFormData={setNurseFormData}
            securityFormData={securityFormData}
            setSecurityFormData={setSecurityFormData}
            wings={wings}
            nursingSections={nursingSections}
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
    indigo: "from-indigo-500 to-indigo-600",
    emerald: "from-emerald-500 to-emerald-600",
    slate: "from-slate-500 to-slate-600",
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
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : value}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// Staff Row Component
function StaffRow({ member, index, onEdit, onDelete, onToggleStatus }) {
  const isNurse = member.type === "nurse";

  return (
    <motion.tr
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="hover:bg-slate-50 transition-colors"
    >
      {/* Staff Info */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full bg-gradient-to-br ${
              isNurse ? "from-green-500 to-emerald-600" : "from-blue-500 to-indigo-600"
            } flex items-center justify-center text-white font-semibold`}
          >
            {member.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-slate-900">{member.name}</div>
            {member.employeeId && (
              <div className="text-sm text-slate-500">ID: {member.employeeId}</div>
            )}
          </div>
        </div>
      </td>

      {/* Contact */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Phone className="w-4 h-4" />
            <span>{member.mobileNumber || "N/A"}</span>
          </div>
          {isNurse && member.email && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Mail className="w-4 h-4" />
              <span className="truncate max-w-[200px]">{member.email}</span>
            </div>
          )}
          {!isNurse && member.username && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Badge className="w-4 h-4" />
              <span>{member.username}</span>
            </div>
          )}
        </div>
      </td>

      {/* Assignment */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <Building className="w-4 h-4 text-blue-600" />
            <span className="font-medium">
              {isNurse ? member.wingName || "N/A" : member.assignedWingName || "Entrance"}
            </span>
          </div>
          {isNurse && member.sectionName && (
            <div className="text-xs text-slate-500">{member.sectionName}</div>
          )}
        </div>
      </td>

      {/* Shift */}
      <td className="px-6 py-4 whitespace-nowrap">
        {member.shiftTiming ? (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Clock className="w-4 h-4" />
            <span>{member.shiftTiming}</span>
          </div>
        ) : (
          <span className="text-sm text-slate-400">Not set</span>
        )}
      </td>

      {/* Type */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            isNurse
              ? "bg-green-100 text-green-700"
              : "bg-blue-100 text-blue-700"
          }`}
        >
          {isNurse ? (
            <span className="flex items-center gap-1">
              <Stethoscope className="w-3 h-3" />
              Nurse
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Security
            </span>
          )}
        </span>
      </td>

      {/* Status */}
      <td className="px-6 py-4 whitespace-nowrap">
        <button
          onClick={onToggleStatus}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
            member.isActive
              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
              : "bg-red-100 text-red-700 hover:bg-red-200"
          }`}
        >
          {member.isActive ? "Active" : "Inactive"}
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
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onDelete}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </div>
      </td>
    </motion.tr>
  );
}

// Staff Modal Component
function StaffModal({
  mode,
  staffType,
  nurseFormData,
  setNurseFormData,
  securityFormData,
  setSecurityFormData,
  wings,
  nursingSections,
  onSubmit,
  onClose,
  loading,
  showPassword,
  setShowPassword,
}) {
  const isNurse = staffType === "nurse";
  const formData = isNurse ? nurseFormData : securityFormData;
  const setFormData = isNurse ? setNurseFormData : setSecurityFormData;

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
        <div
          className={`bg-gradient-to-r ${
            isNurse
              ? "from-green-600 to-emerald-600"
              : "from-blue-600 to-indigo-600"
          } px-6 py-4 flex items-center justify-between`}
        >
          <h2 className="text-2xl font-bold text-white">
            {mode === "create" ? "Add" : "Edit"} {isNurse ? "Nurse" : "Security"}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={onSubmit}
          className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]"
        >
          <div className="space-y-5">
            {/* Assignment - Nursing Section or Wing */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {isNurse ? "Nursing Section *" : "Assigned Wing *"}
              </label>
              <div className="relative">
                <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <select
                  name={isNurse ? "sectionId" : "assignedWingId"}
                  value={isNurse ? formData.sectionId : formData.assignedWingId}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-300 rounded-xl pl-12 pr-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                  required
                >
                  <option value="">
                    {isNurse ? "Select nursing section" : "Select wing"}
                  </option>
                  {isNurse
                    ? nursingSections.map((section) => (
                        <option key={section.id} value={section.id}>
                          {section.sectionName} ({section.wingName})
                        </option>
                      ))
                    : wings.map((wing) => (
                        <option key={wing.id} value={wing.id}>
                          {wing.wingName} {wing.wingCode && `(${wing.wingCode})`}
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

            {/* Email (Nurse only) or Username (Security only) */}
            {isNurse ? (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-300 rounded-xl pl-12 pr-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="nurse@hospital.com"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Username
                </label>
                <div className="relative">
                  <Badge className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-300 rounded-xl pl-12 pr-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="security_username"
                  />
                </div>
              </div>
            )}

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
                    (Leave blank to keep current)
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

            {/* Employee ID */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Employee ID
              </label>
              <input
                type="text"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleChange}
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="EMP001"
              />
            </div>

            {/* Shift Timing */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Shift Timing
              </label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  name="shiftTiming"
                  value={formData.shiftTiming}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-300 rounded-xl pl-12 pr-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 8AM - 4PM, Night Shift"
                />
              </div>
            </div>

            {/* Photo URL (Security only) */}
            {!isNurse && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Photo URL
                </label>
                <input
                  type="url"
                  name="photoUrl"
                  value={formData.photoUrl}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/photo.jpg"
                />
              </div>
            )}

            {/* Info Box */}
            <div
              className={`${
                isNurse ? "bg-green-50 border-green-200" : "bg-blue-50 border-blue-200"
              } border rounded-lg p-4`}
            >
              <div className="flex gap-3">
                <Info
                  className={`w-5 h-5 ${
                    isNurse ? "text-green-600" : "text-blue-600"
                  } flex-shrink-0 mt-0.5`}
                />
                <div className="text-sm text-slate-700">
                  <p className="font-semibold mb-1">Login Credentials</p>
                  <p>
                    {isNurse
                      ? "Nurses login using their email and password."
                      : "Security personnel login using their username and password."}
                  </p>
                </div>
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
              className={`flex-1 bg-gradient-to-r ${
                isNurse
                  ? "from-green-600 to-emerald-600"
                  : "from-blue-600 to-indigo-600"
              } text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {mode === "create" ? "Creating..." : "Updating..."}
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {mode === "create"
                    ? `Create ${isNurse ? "Nurse" : "Security"}`
                    : `Update ${isNurse ? "Nurse" : "Security"}`}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}