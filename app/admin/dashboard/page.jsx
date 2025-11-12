// FILE: app/admin/dashboard/page.jsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building,
  Plus,
  Edit2,
  Trash2,
  Clock,
  Search,
  Loader2,
  X,
  Save,
  Calendar,
  Users,
  Bed,
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Info,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function AdminDashboard() {
  const [wings, setWings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showVisitingModal, setShowVisitingModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedWing, setSelectedWing] = useState(null);
  const [stats, setStats] = useState({
    totalWings: 0,
    activeWings: 0,
    totalRooms: 0,
    occupiedRooms: 0,
  });

  // Wing Form Data
  const [formData, setFormData] = useState({
    wingName: "",
    wingCode: "",
    floorNumber: "",
    description: "",
  });

  // Visiting Hours Form Data
  const [visitingHoursData, setVisitingHoursData] = useState({
    wingId: null,
    applyToAllDays: true,
    timeSlots: [{ startTime: "09:00", endTime: "11:00" }],
    specificDays: {
      monday: { enabled: false, slots: [] },
      tuesday: { enabled: false, slots: [] },
      wednesday: { enabled: false, slots: [] },
      thursday: { enabled: false, slots: [] },
      friday: { enabled: false, slots: [] },
      saturday: { enabled: false, slots: [] },
      sunday: { enabled: false, slots: [] },
    },
  });

  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchWings();
    fetchStats();
  }, []);

  const fetchWings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/wings");
      const data = await res.json();

      if (data.success) {
        setWings(data.wings);
      } else {
        toast.error("Failed to load wings");
      }
    } catch (error) {
      toast.error("Error loading wings");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/dashboard/stats");
      const data = await res.json();

      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const handleOpenModal = (mode, wing = null) => {
    setModalMode(mode);
    if (mode === "edit" && wing) {
      setSelectedWing(wing);
      setFormData({
        wingName: wing.wingName || "",
        wingCode: wing.wingCode || "",
        floorNumber: wing.floorNumber?.toString() || "",
        description: wing.description || "",
      });
    } else {
      setSelectedWing(null);
      setFormData({
        wingName: "",
        wingCode: "",
        floorNumber: "",
        description: "",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedWing(null);
    setFormData({
      wingName: "",
      wingCode: "",
      floorNumber: "",
      description: "",
    });
  };

  const handleOpenVisitingModal = (wing) => {
    setSelectedWing(wing);
    
    // Load existing visiting hours for this wing
    if (wing.visitingHours && wing.visitingHours.length > 0) {
      // Check if there are day-specific hours
      const daySpecificHours = wing.visitingHours.filter(vh => vh.dayOfWeek);
      const generalHours = wing.visitingHours.filter(vh => !vh.dayOfWeek);

      if (daySpecificHours.length > 0) {
        // Day-specific configuration
        setVisitingHoursData({
          wingId: wing.id,
          applyToAllDays: false,
          timeSlots: [],
          specificDays: parseDaySpecificHours(daySpecificHours),
        });
      } else {
        // General configuration
        setVisitingHoursData({
          wingId: wing.id,
          applyToAllDays: true,
          timeSlots: generalHours.map(vh => ({
            startTime: vh.startTime,
            endTime: vh.endTime,
          })),
          specificDays: {
            monday: { enabled: false, slots: [] },
            tuesday: { enabled: false, slots: [] },
            wednesday: { enabled: false, slots: [] },
            thursday: { enabled: false, slots: [] },
            friday: { enabled: false, slots: [] },
            saturday: { enabled: false, slots: [] },
            sunday: { enabled: false, slots: [] },
          },
        });
      }
    } else {
      setVisitingHoursData({
        wingId: wing.id,
        applyToAllDays: true,
        timeSlots: [{ startTime: "09:00", endTime: "11:00" }],
        specificDays: {
          monday: { enabled: false, slots: [] },
          tuesday: { enabled: false, slots: [] },
          wednesday: { enabled: false, slots: [] },
          thursday: { enabled: false, slots: [] },
          friday: { enabled: false, slots: [] },
          saturday: { enabled: false, slots: [] },
          sunday: { enabled: false, slots: [] },
        },
      });
    }
    
    setShowVisitingModal(true);
  };

  const parseDaySpecificHours = (daySpecificHours) => {
    const days = {
      monday: { enabled: false, slots: [] },
      tuesday: { enabled: false, slots: [] },
      wednesday: { enabled: false, slots: [] },
      thursday: { enabled: false, slots: [] },
      friday: { enabled: false, slots: [] },
      saturday: { enabled: false, slots: [] },
      sunday: { enabled: false, slots: [] },
    };

    daySpecificHours.forEach(vh => {
      if (vh.dayOfWeek && days[vh.dayOfWeek]) {
        days[vh.dayOfWeek].enabled = true;
        days[vh.dayOfWeek].slots.push({
          startTime: vh.startTime,
          endTime: vh.endTime,
        });
      }
    });

    return days;
  };

  const handleCloseVisitingModal = () => {
    setShowVisitingModal(false);
    setSelectedWing(null);
    setVisitingHoursData({
      wingId: null,
      applyToAllDays: true,
      timeSlots: [{ startTime: "09:00", endTime: "11:00" }],
      specificDays: {
        monday: { enabled: false, slots: [] },
        tuesday: { enabled: false, slots: [] },
        wednesday: { enabled: false, slots: [] },
        thursday: { enabled: false, slots: [] },
        friday: { enabled: false, slots: [] },
        saturday: { enabled: false, slots: [] },
        sunday: { enabled: false, slots: [] },
      },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const url =
        modalMode === "create"
          ? "/api/admin/wings"
          : `/api/admin/wings/${selectedWing.id}`;

      const method = modalMode === "create" ? "POST" : "PUT";

      const payload = {
        ...formData,
        floorNumber: formData.floorNumber ? parseInt(formData.floorNumber) : null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(
          modalMode === "create"
            ? "Wing created successfully!"
            : "Wing updated successfully!"
        );
        fetchWings();
        fetchStats();
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

  const handleSubmitVisitingHours = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const res = await fetch(`/api/admin/wings/${selectedWing.id}/visiting-hours`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(visitingHoursData),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Visiting hours updated successfully!");
        fetchWings();
        handleCloseVisitingModal();
      } else {
        toast.error(data.error || "Failed to update visiting hours");
      }
    } catch (error) {
      toast.error("Something went wrong");
      console.error(error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (wingId) => {
    if (!confirm("Are you sure you want to delete this wing?")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/wings/${wingId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Wing deleted successfully!");
        fetchWings();
        fetchStats();
      } else {
        toast.error(data.error || "Failed to delete wing");
      }
    } catch (error) {
      toast.error("Error deleting wing");
      console.error(error);
    }
  };

  const addTimeSlot = () => {
    setVisitingHoursData({
      ...visitingHoursData,
      timeSlots: [...visitingHoursData.timeSlots, { startTime: "09:00", endTime: "11:00" }],
    });
  };

  const removeTimeSlot = (index) => {
    setVisitingHoursData({
      ...visitingHoursData,
      timeSlots: visitingHoursData.timeSlots.filter((_, i) => i !== index),
    });
  };

  const updateTimeSlot = (index, field, value) => {
    const newSlots = [...visitingHoursData.timeSlots];
    newSlots[index][field] = value;
    setVisitingHoursData({
      ...visitingHoursData,
      timeSlots: newSlots,
    });
  };

  const toggleDay = (day) => {
    setVisitingHoursData({
      ...visitingHoursData,
      specificDays: {
        ...visitingHoursData.specificDays,
        [day]: {
          ...visitingHoursData.specificDays[day],
          enabled: !visitingHoursData.specificDays[day].enabled,
          slots: visitingHoursData.specificDays[day].enabled 
            ? [] 
            : [{ startTime: "09:00", endTime: "11:00" }],
        },
      },
    });
  };

  const addDayTimeSlot = (day) => {
    setVisitingHoursData({
      ...visitingHoursData,
      specificDays: {
        ...visitingHoursData.specificDays,
        [day]: {
          ...visitingHoursData.specificDays[day],
          slots: [
            ...visitingHoursData.specificDays[day].slots,
            { startTime: "09:00", endTime: "11:00" },
          ],
        },
      },
    });
  };

  const removeDayTimeSlot = (day, index) => {
    setVisitingHoursData({
      ...visitingHoursData,
      specificDays: {
        ...visitingHoursData.specificDays,
        [day]: {
          ...visitingHoursData.specificDays[day],
          slots: visitingHoursData.specificDays[day].slots.filter((_, i) => i !== index),
        },
      },
    });
  };

  const updateDayTimeSlot = (day, index, field, value) => {
    const newSlots = [...visitingHoursData.specificDays[day].slots];
    newSlots[index][field] = value;
    setVisitingHoursData({
      ...visitingHoursData,
      specificDays: {
        ...visitingHoursData.specificDays,
        [day]: {
          ...visitingHoursData.specificDays[day],
          slots: newSlots,
        },
      },
    });
  };

  const filteredWings = wings.filter((wing) =>
    wing.wingName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    wing.wingCode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              Dashboard
            </h1>
            <p className="text-slate-600">
              Manage hospital wings and visiting hours
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleOpenModal("create")}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="w-5 h-5" />
            Add Wing
          </motion.button>
        </motion.div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto mb-8 grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          icon={Building}
          label="Total Wings"
          value={stats.totalWings}
          color="blue"
          loading={loading}
        />
        <StatsCard
          icon={CheckCircle}
          label="Active Wings"
          value={stats.activeWings}
          color="green"
          loading={loading}
        />
        <StatsCard
          icon={Bed}
          label="Total Rooms"
          value={stats.totalRooms}
          color="purple"
          loading={loading}
        />
        <StatsCard
          icon={Users}
          label="Occupied Rooms"
          value={stats.occupiedRooms}
          color="indigo"
          loading={loading}
        />
      </div>

      {/* Search Bar */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search wings by name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
        </div>
      </div>

      {/* Wings Grid */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : filteredWings.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl p-12 text-center shadow-sm"
          >
            <Building className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">
              No wings found
            </h3>
            <p className="text-slate-500">
              {searchQuery
                ? "Try adjusting your search query"
                : "Get started by adding your first wing"}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWings.map((wing, index) => (
              <WingCard
                key={wing.id}
                wing={wing}
                index={index}
                onEdit={() => handleOpenModal("edit", wing)}
                onDelete={() => handleDelete(wing.id)}
                onSetVisitingHours={() => handleOpenVisitingModal(wing)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Wing Modal */}
      <AnimatePresence>
        {showModal && (
          <WingModal
            mode={modalMode}
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            onClose={handleCloseModal}
            loading={formLoading}
          />
        )}
      </AnimatePresence>

      {/* Visiting Hours Modal */}
      <AnimatePresence>
        {showVisitingModal && (
          <VisitingHoursModal
            wing={selectedWing}
            visitingHoursData={visitingHoursData}
            setVisitingHoursData={setVisitingHoursData}
            onSubmit={handleSubmitVisitingHours}
            onClose={handleCloseVisitingModal}
            loading={formLoading}
            addTimeSlot={addTimeSlot}
            removeTimeSlot={removeTimeSlot}
            updateTimeSlot={updateTimeSlot}
            toggleDay={toggleDay}
            addDayTimeSlot={addDayTimeSlot}
            removeDayTimeSlot={removeDayTimeSlot}
            updateDayTimeSlot={updateDayTimeSlot}
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
    purple: "from-purple-500 to-purple-600",
    indigo: "from-indigo-500 to-indigo-600",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
    >
      <div className="flex items-center gap-4">
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center shadow-lg`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="text-slate-600 text-sm font-medium">{label}</p>
          <p className="text-2xl font-bold text-slate-900">
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              value
            )}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// Wing Card Component
function WingCard({ wing, index, onEdit, onDelete, onSetVisitingHours }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-slate-100"
    >
      {/* Header */}
      <div className="relative h-32 bg-gradient-to-br from-blue-500 to-indigo-600">
        <div className="absolute inset-0 flex items-center justify-center">
          <Building className="w-12 h-12 text-white/50" />
        </div>
        <div className="absolute top-3 right-3">
          <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold rounded-full">
            {wing.wingCode || "N/A"}
          </span>
        </div>
        {wing.floorNumber !== null && (
          <div className="absolute bottom-3 left-3">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold rounded-full">
              Floor {wing.floorNumber}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-xl font-bold text-slate-900 mb-2">
          {wing.wingName}
        </h3>

        {wing.description && (
          <p className="text-sm text-slate-600 mb-4 line-clamp-2">
            {wing.description}
          </p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Bed className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-slate-600">Rooms</span>
            </div>
            <p className="text-lg font-bold text-slate-900 mt-1">
              {wing.roomCount || 0}
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-green-600" />
              <span className="text-xs text-slate-600">Visit Hours</span>
            </div>
            <p className="text-lg font-bold text-slate-900 mt-1">
              {wing.visitingHoursCount || 0}
            </p>
          </div>
        </div>

        {/* Visiting Hours Preview */}
        {wing.visitingHours && wing.visitingHours.length > 0 && (
          <div className="bg-slate-50 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-semibold text-slate-700">
                Visiting Hours
              </span>
            </div>
            <div className="space-y-1">
              {wing.visitingHours.slice(0, 2).map((vh, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 capitalize">
                    {vh.dayOfWeek || "All Days"}
                  </span>
                  <span className="font-medium text-slate-900">
                    {vh.startTime} - {vh.endTime}
                  </span>
                </div>
              ))}
              {wing.visitingHours.length > 2 && (
                <p className="text-xs text-blue-600 font-medium">
                  +{wing.visitingHours.length - 2} more
                </p>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onSetVisitingHours}
            className="flex-1 flex items-center justify-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-lg font-medium hover:bg-green-200 transition-colors"
          >
            <Clock className="w-4 h-4" />
            Hours
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-medium hover:bg-blue-200 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onDelete}
            className="flex items-center justify-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-lg font-medium hover:bg-red-200 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// Wing Modal Component
function WingModal({ mode, formData, setFormData, onSubmit, onClose, loading }) {
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            {mode === "create" ? "Add New Wing" : "Edit Wing"}
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
            {/* Wing Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Wing Name *
              </label>
              <input
                type="text"
                name="wingName"
                value={formData.wingName}
                onChange={handleChange}
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., ICU Wing, General Ward"
                required
              />
            </div>

            {/* Wing Code */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Wing Code
              </label>
              <input
                type="text"
                name="wingCode"
                value={formData.wingCode}
                onChange={handleChange}
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., ICU-01, GW-A"
              />
            </div>

            {/* Floor Number */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Floor Number
              </label>
              <input
                type="number"
                name="floorNumber"
                value={formData.floorNumber}
                onChange={handleChange}
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 1, 2, 3"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                placeholder="Enter wing description..."
              />
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
                  {mode === "create" ? "Create Wing" : "Update Wing"}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// Visiting Hours Modal Component
function VisitingHoursModal({
  wing,
  visitingHoursData,
  setVisitingHoursData,
  onSubmit,
  onClose,
  loading,
  addTimeSlot,
  removeTimeSlot,
  updateTimeSlot,
  toggleDay,
  addDayTimeSlot,
  removeDayTimeSlot,
  updateDayTimeSlot,
}) {
  const days = [
    { key: "monday", label: "Monday" },
    { key: "tuesday", label: "Tuesday" },
    { key: "wednesday", label: "Wednesday" },
    { key: "thursday", label: "Thursday" },
    { key: "friday", label: "Friday" },
    { key: "saturday", label: "Saturday" },
    { key: "sunday", label: "Sunday" },
  ];

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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Visiting Hours
            </h2>
            <p className="text-green-100 text-sm">{wing?.wingName}</p>
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
          {/* Configuration Type */}
          <div className="mb-6">
            <div className="flex gap-4">
              <label className="flex-1 cursor-pointer">
                <input
                  type="radio"
                  name="configType"
                  checked={visitingHoursData.applyToAllDays}
                  onChange={() =>
                    setVisitingHoursData({
                      ...visitingHoursData,
                      applyToAllDays: true,
                    })
                  }
                  className="sr-only"
                />
                <div
                  className={`p-4 border-2 rounded-xl transition-all ${
                    visitingHoursData.applyToAllDays
                      ? "border-green-500 bg-green-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-green-600" />
                    <div>
                      <div className="font-semibold text-slate-900">
                        Same for All Days
                      </div>
                      <div className="text-xs text-slate-600">
                        Apply same hours to all days
                      </div>
                    </div>
                  </div>
                </div>
              </label>

              <label className="flex-1 cursor-pointer">
                <input
                  type="radio"
                  name="configType"
                  checked={!visitingHoursData.applyToAllDays}
                  onChange={() =>
                    setVisitingHoursData({
                      ...visitingHoursData,
                      applyToAllDays: false,
                    })
                  }
                  className="sr-only"
                />
                <div
                  className={`p-4 border-2 rounded-xl transition-all ${
                    !visitingHoursData.applyToAllDays
                      ? "border-green-500 bg-green-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-green-600" />
                    <div>
                      <div className="font-semibold text-slate-900">
                        Day-Specific
                      </div>
                      <div className="text-xs text-slate-600">
                        Different hours for each day
                      </div>
                    </div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* General Time Slots */}
          {visitingHoursData.applyToAllDays && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">
                  Visiting Time Slots
                </h3>
                <button
                  type="button"
                  onClick={addTimeSlot}
                  className="flex items-center gap-2 text-green-600 hover:text-green-700 font-medium text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Slot
                </button>
              </div>

              {visitingHoursData.timeSlots.map((slot, index) => (
                <div key={index} className="flex gap-3 items-center bg-slate-50 p-4 rounded-lg">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) =>
                        updateTimeSlot(index, "startTime", e.target.value)
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) =>
                        updateTimeSlot(index, "endTime", e.target.value)
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                  {visitingHoursData.timeSlots.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTimeSlot(index)}
                      className="mt-5 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Day-Specific Time Slots */}
          {!visitingHoursData.applyToAllDays && (
            <div className="space-y-4">
              {days.map((day) => (
                <div
                  key={day.key}
                  className="border border-slate-200 rounded-xl overflow-hidden"
                >
                  <div
                    className={`p-4 cursor-pointer transition-colors ${
                      visitingHoursData.specificDays[day.key].enabled
                        ? "bg-green-50 border-b border-slate-200"
                        : "bg-slate-50 hover:bg-slate-100"
                    }`}
                    onClick={() => toggleDay(day.key)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={
                            visitingHoursData.specificDays[day.key].enabled
                          }
                          onChange={() => toggleDay(day.key)}
                          className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="font-semibold text-slate-900">
                          {day.label}
                        </span>
                      </div>
                      {visitingHoursData.specificDays[day.key].enabled && (
                        <span className="text-xs text-green-600 font-medium">
                          {visitingHoursData.specificDays[day.key].slots.length}{" "}
                          slot(s)
                        </span>
                      )}
                    </div>
                  </div>

                  {visitingHoursData.specificDays[day.key].enabled && (
                    <div className="p-4 space-y-3">
                      {visitingHoursData.specificDays[day.key].slots.map(
                        (slot, index) => (
                          <div
                            key={index}
                            className="flex gap-3 items-center bg-white p-3 rounded-lg border border-slate-200"
                          >
                            <div className="flex-1">
                              <label className="block text-xs font-medium text-slate-600 mb-1">
                                Start
                              </label>
                              <input
                                type="time"
                                value={slot.startTime}
                                onChange={(e) =>
                                  updateDayTimeSlot(
                                    day.key,
                                    index,
                                    "startTime",
                                    e.target.value
                                  )
                                }
                                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                                required
                              />
                            </div>
                            <div className="flex-1">
                              <label className="block text-xs font-medium text-slate-600 mb-1">
                                End
                              </label>
                              <input
                                type="time"
                                value={slot.endTime}
                                onChange={(e) =>
                                  updateDayTimeSlot(
                                    day.key,
                                    index,
                                    "endTime",
                                    e.target.value
                                  )
                                }
                                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                                required
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                removeDayTimeSlot(day.key, index)
                              }
                              className="mt-5 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )
                      )}
                      <button
                        type="button"
                        onClick={() => addDayTimeSlot(day.key)}
                        className="w-full flex items-center justify-center gap-2 text-green-600 hover:text-green-700 font-medium text-sm py-2 border border-dashed border-green-300 rounded-lg hover:bg-green-50 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add Time Slot
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-slate-700">
                <p className="font-semibold mb-1">Tips:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>You can add multiple time slots per day</li>
                  <li>Ensure end time is after start time</li>
                  <li>Visitors can only enter during these hours</li>
                </ul>
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
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Visiting Hours
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}