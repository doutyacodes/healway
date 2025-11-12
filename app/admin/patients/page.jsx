// FILE: app/admin/patients/page.jsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Search,
  Loader2,
  X,
  Save,
  UserPlus,
  Bed,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
  Filter,
  Building,
  Phone,
  Mail,
  User,
  AlertCircle,
  LogOut,
  LogIn,
  Info,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [wings, setWings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterWing, setFilterWing] = useState("all");
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    discharged: 0,
    patients: 0,
    bystanders: 0,
  });

  // Patient Form Data
  const [patientFormData, setPatientFormData] = useState({
    name: "",
    mobileNumber: "",
    email: "",
    role: "patient",
  });

  // Session Form Data
  const [sessionFormData, setSessionFormData] = useState({
    userId: "",
    wingId: "",
    roomId: "",
    admissionType: "planned",
    notes: "",
  });

  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchPatients(), fetchWings()]);
    setLoading(false);
  };

  const fetchPatients = async () => {
    try {
      const res = await fetch("/api/admin/patients");
      const data = await res.json();

      if (data.success) {
        setPatients(data.patients);
        calculateStats(data.patients);
      } else {
        toast.error("Failed to load patients");
      }
    } catch (error) {
      toast.error("Error loading patients");
      console.error(error);
    }
  };

  const fetchWings = async () => {
    try {
      const res = await fetch("/api/admin/wings");
      const data = await res.json();

      if (data.success) {
        setWings(data.wings.filter(w => w.isActive));
      }
    } catch (error) {
      console.error("Error loading wings:", error);
    }
  };

  const fetchRoomsByWing = async (wingId) => {
    try {
      const res = await fetch(`/api/admin/wings/${wingId}/rooms`);
      const data = await res.json();

      if (data.success) {
        // Only show available rooms
        setRooms(data.rooms.filter(r => r.status === "available" && r.isActive));
      }
    } catch (error) {
      console.error("Error loading rooms:", error);
    }
  };

  const calculateStats = (patientData) => {
    const activeSessions = patientData.filter(
      (p) => p.sessionStatus === "active"
    );
    
    setStats({
      total: patientData.length,
      active: activeSessions.length,
      discharged: patientData.filter((p) => p.sessionStatus === "discharged").length,
      patients: patientData.filter((p) => p.role === "patient").length,
      bystanders: patientData.filter((p) => p.role === "bystander").length,
    });
  };

  const handleOpenPatientModal = (mode, patient = null) => {
    setModalMode(mode);
    if (mode === "edit" && patient) {
      setSelectedPatient(patient);
      setPatientFormData({
        name: patient.name || "",
        mobileNumber: patient.mobileNumber || "",
        email: patient.email || "",
        role: patient.role || "patient",
      });
    } else {
      setSelectedPatient(null);
      setPatientFormData({
        name: "",
        mobileNumber: "",
        email: "",
        role: "patient",
      });
    }
    setShowPatientModal(true);
  };

  const handleOpenSessionModal = (patient) => {
    setSelectedPatient(patient);
    setSessionFormData({
      userId: patient.id,
      wingId: "",
      roomId: "",
      admissionType: "planned",
      notes: "",
    });
    setRooms([]);
    setShowSessionModal(true);
  };

  const handleClosePatientModal = () => {
    setShowPatientModal(false);
    setSelectedPatient(null);
    setPatientFormData({
      name: "",
      mobileNumber: "",
      email: "",
      role: "patient",
    });
  };

  const handleCloseSessionModal = () => {
    setShowSessionModal(false);
    setSelectedPatient(null);
    setSessionFormData({
      userId: "",
      wingId: "",
      roomId: "",
      admissionType: "planned",
      notes: "",
    });
    setRooms([]);
  };

  const handleSubmitPatient = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const url =
        modalMode === "create"
          ? "/api/admin/patients"
          : `/api/admin/patients/${selectedPatient.id}`;

      const method = modalMode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patientFormData),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(
          modalMode === "create"
            ? "Patient created successfully!"
            : "Patient updated successfully!"
        );
        fetchPatients();
        handleClosePatientModal();
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

  const handleSubmitSession = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const res = await fetch("/api/admin/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sessionFormData),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Patient admitted successfully!");
        fetchPatients();
        handleCloseSessionModal();
      } else {
        toast.error(data.error || "Failed to admit patient");
      }
    } catch (error) {
      toast.error("Something went wrong");
      console.error(error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDischargePatient = async (sessionId) => {
    if (!confirm("Are you sure you want to discharge this patient?")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/sessions/${sessionId}/discharge`, {
        method: "PATCH",
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Patient discharged successfully!");
        fetchPatients();
      } else {
        toast.error(data.error || "Failed to discharge patient");
      }
    } catch (error) {
      toast.error("Error discharging patient");
      console.error(error);
    }
  };

  const handleDeletePatient = async (patientId, hasActiveSession) => {
    if (hasActiveSession) {
      toast.error("Cannot delete patient with active session. Discharge first.");
      return;
    }

    if (!confirm("Are you sure you want to delete this patient?")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/patients/${patientId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Patient deleted successfully!");
        fetchPatients();
      } else {
        toast.error(data.error || "Failed to delete patient");
      }
    } catch (error) {
      toast.error("Error deleting patient");
      console.error(error);
    }
  };

  const handleWingChange = (wingId) => {
    setSessionFormData({
      ...sessionFormData,
      wingId,
      roomId: "",
    });
    if (wingId) {
      fetchRoomsByWing(wingId);
    } else {
      setRooms([]);
    }
  };

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.mobileNumber.includes(searchQuery) ||
      patient.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === "all" || patient.sessionStatus === filterStatus;

    const matchesWing =
      filterWing === "all" || patient.wingId === parseInt(filterWing);

    return matchesSearch && matchesStatus && matchesWing;
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
              Patient Management
            </h1>
            <p className="text-slate-600">
              Manage patients, admissions, and hospital sessions
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleOpenPatientModal("create")}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="w-5 h-5" />
            Add Patient
          </motion.button>
        </motion.div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto mb-8 grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatsCard
          icon={Users}
          label="Total Patients"
          value={stats.total}
          color="blue"
          loading={loading}
        />
        <StatsCard
          icon={Activity}
          label="Active Sessions"
          value={stats.active}
          color="green"
          loading={loading}
        />
        <StatsCard
          icon={CheckCircle}
          label="Discharged"
          value={stats.discharged}
          color="slate"
          loading={loading}
        />
        <StatsCard
          icon={User}
          label="Patients"
          value={stats.patients}
          color="purple"
          loading={loading}
        />
        <StatsCard
          icon={Users}
          label="Bystanders"
          value={stats.bystanders}
          color="indigo"
          loading={loading}
        />
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, phone, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-12 pr-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filter by Status */}
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-12 pr-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="active">Active Session</option>
                <option value="discharged">Discharged</option>
                <option value="no_session">No Session</option>
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
          </div>
        </div>
      </div>

      {/* Patients Table */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : filteredPatients.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl p-12 text-center shadow-sm"
          >
            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">
              No patients found
            </h3>
            <p className="text-slate-500">
              {searchQuery || filterStatus !== "all" || filterWing !== "all"
                ? "Try adjusting your filters"
                : "Get started by adding your first patient"}
            </p>
          </motion.div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Current Location
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Session
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredPatients.map((patient, index) => (
                    <PatientRow
                      key={patient.id}
                      patient={patient}
                      index={index}
                      onEdit={() => handleOpenPatientModal("edit", patient)}
                      onDelete={() => handleDeletePatient(patient.id, patient.sessionStatus === "active")}
                      onAdmit={() => handleOpenSessionModal(patient)}
                      onDischarge={() => handleDischargePatient(patient.sessionId)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Patient Modal */}
      <AnimatePresence>
        {showPatientModal && (
          <PatientModal
            mode={modalMode}
            formData={patientFormData}
            setFormData={setPatientFormData}
            onSubmit={handleSubmitPatient}
            onClose={handleClosePatientModal}
            loading={formLoading}
          />
        )}
      </AnimatePresence>

      {/* Session Modal */}
      <AnimatePresence>
        {showSessionModal && (
          <SessionModal
            patient={selectedPatient}
            formData={sessionFormData}
            setFormData={setSessionFormData}
            wings={wings}
            rooms={rooms}
            onWingChange={handleWingChange}
            onSubmit={handleSubmitSession}
            onClose={handleCloseSessionModal}
            loading={formLoading}
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
    slate: "from-slate-500 to-slate-600",
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

// Patient Row Component
function PatientRow({ patient, index, onEdit, onDelete, onAdmit, onDischarge }) {
  const hasActiveSession = patient.sessionStatus === "active";

  return (
    <motion.tr
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="hover:bg-slate-50 transition-colors"
    >
      {/* Patient Info */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
            {patient.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-slate-900">{patient.name}</div>
            <div className="text-sm text-slate-500">ID: {patient.id}</div>
          </div>
        </div>
      </td>

      {/* Contact */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Phone className="w-4 h-4" />
            <span>{patient.mobileNumber}</span>
          </div>
          {patient.email && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Mail className="w-4 h-4" />
              <span className="truncate max-w-[200px]">{patient.email}</span>
            </div>
          )}
        </div>
      </td>

      {/* Location */}
      <td className="px-6 py-4 whitespace-nowrap">
        {hasActiveSession ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <Building className="w-4 h-4 text-blue-600" />
              <span className="font-medium">{patient.wingName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Bed className="w-4 h-4" />
              <span>Room {patient.roomNumber}</span>
            </div>
          </div>
        ) : (
          <span className="text-sm text-slate-400">Not admitted</span>
        )}
      </td>

      {/* Session */}
      <td className="px-6 py-4 whitespace-nowrap">
        {hasActiveSession ? (
          <div>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
              Active
            </span>
            <div className="text-xs text-slate-500 mt-1">
              Since {new Date(patient.sessionStartDate).toLocaleDateString()}
            </div>
            {patient.admissionType && (
              <div className="text-xs text-slate-500 capitalize">
                {patient.admissionType}
              </div>
            )}
          </div>
        ) : patient.sessionStatus === "discharged" ? (
          <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">
            Discharged
          </span>
        ) : (
          <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
            No Session
          </span>
        )}
      </td>

      {/* Role */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            patient.role === "patient"
              ? "bg-blue-100 text-blue-700"
              : "bg-purple-100 text-purple-700"
          }`}
        >
          {patient.role === "patient" ? "Patient" : "Bystander"}
        </span>
      </td>

      {/* Actions */}
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className="flex items-center justify-end gap-2">
          {!hasActiveSession && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onAdmit}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Admit Patient"
            >
              <LogIn className="w-4 h-4" />
            </motion.button>
          )}
          {hasActiveSession && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onDischarge}
              className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
              title="Discharge Patient"
            >
              <LogOut className="w-4 h-4" />
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onEdit}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit Patient"
          >
            <Edit2 className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onDelete}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Patient"
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </div>
      </td>
    </motion.tr>
  );
}

// Patient Modal Component
function PatientModal({ mode, formData, setFormData, onSubmit, onClose, loading }) {
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
            {mode === "create" ? "Add New Patient" : "Edit Patient"}
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
            {/* Full Name */}
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
                placeholder="Enter patient's full name"
                required
              />
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Mobile Number *
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
                  required
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Used for OTP login
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Email Address (Optional)
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-300 rounded-xl pl-12 pr-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="patient@example.com"
                />
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Role *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label
                  className={`flex items-center justify-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    formData.role === "patient"
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value="patient"
                    checked={formData.role === "patient"}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <User className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-slate-900">Patient</span>
                </label>
                <label
                  className={`flex items-center justify-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    formData.role === "bystander"
                      ? "border-purple-500 bg-purple-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value="bystander"
                    checked={formData.role === "bystander"}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <Users className="w-5 h-5 text-purple-600" />
                  <span className="font-semibold text-slate-900">Bystander</span>
                </label>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-slate-700">
                  <p className="font-semibold mb-1">Authentication</p>
                  <p>
                    Patients and bystanders login using OTP sent to their mobile
                    number. No password required.
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
                  {mode === "create" ? "Create Patient" : "Update Patient"}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// Session Modal Component
function SessionModal({
  patient,
  formData,
  setFormData,
  wings,
  rooms,
  onWingChange,
  onSubmit,
  onClose,
  loading,
}) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "wingId") {
      onWingChange(value);
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
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
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Admit Patient</h2>
            <p className="text-green-100 text-sm">{patient?.name}</p>
          </div>
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
            {/* Wing Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Select Wing *
              </label>
              <div className="relative">
                <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <select
                  name="wingId"
                  value={formData.wingId}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-300 rounded-xl pl-12 pr-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none cursor-pointer"
                  required
                >
                  <option value="">Choose a wing</option>
                  {wings.map((wing) => (
                    <option key={wing.id} value={wing.id}>
                      {wing.wingName} {wing.wingCode && `(${wing.wingCode})`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Room Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Select Room *
              </label>
              <div className="relative">
                <Bed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <select
                  name="roomId"
                  value={formData.roomId}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-300 rounded-xl pl-12 pr-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed"
                  required
                  disabled={!formData.wingId}
                >
                  <option value="">
                    {!formData.wingId
                      ? "Select a wing first"
                      : rooms.length === 0
                      ? "No available rooms"
                      : "Choose a room"}
                  </option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      Room {room.roomNumber} - {room.roomType} (Capacity:{" "}
                      {room.capacity})
                    </option>
                  ))}
                </select>
              </div>
              {formData.wingId && rooms.length === 0 && (
                <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  No available rooms in this wing
                </p>
              )}
            </div>

            {/* Admission Type */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Admission Type *
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "planned", label: "Planned", icon: Calendar },
                  { value: "emergency", label: "Emergency", icon: AlertCircle },
                  { value: "transfer", label: "Transfer", icon: Activity },
                ].map((type) => (
                  <label
                    key={type.value}
                    className={`flex flex-col items-center gap-2 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      formData.admissionType === type.value
                        ? "border-green-500 bg-green-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="admissionType"
                      value={type.value}
                      checked={formData.admissionType === type.value}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <type.icon className="w-6 h-6 text-green-600" />
                    <span className="font-semibold text-slate-900 text-sm">
                      {type.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Admission Notes (Optional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[100px]"
                placeholder="Enter any notes about the admission..."
              />
            </div>

            {/* Info Box */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-slate-700">
                  <p className="font-semibold mb-1">Session Started</p>
                  <p>
                    The patient session will begin immediately. The room status
                    will be updated to "Occupied" and the patient can create
                    guest passes.
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
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Admitting...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Admit Patient
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}