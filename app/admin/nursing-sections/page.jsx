// FILE: app/admin/nursing-sections/page.jsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Stethoscope,
  Plus,
  Edit2,
  Trash2,
  Search,
  Loader2,
  X,
  Save,
  Building,
  CheckCircle,
  XCircle,
  Activity,
  Info,
  Filter,
  Users,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function NursingSectionsPage() {
  const [sections, setSections] = useState([]);
  const [wings, setWings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterWing, setFilterWing] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedSection, setSelectedSection] = useState(null);

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    withWing: 0,
    general: 0,
  });

  // Form Data
  const [formData, setFormData] = useState({
    sectionName: "",
    wingId: "",
    description: "",
  });

  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchSections(), fetchWings()]);
    setLoading(false);
  };

  const fetchSections = async () => {
    try {
      const res = await fetch("/api/admin/nursing-sections");
      const data = await res.json();

      if (data.success) {
        setSections(data.sections);
        calculateStats(data.sections);
      } else {
        toast.error("Failed to load nursing sections");
      }
    } catch (error) {
      toast.error("Error loading nursing sections");
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

  const calculateStats = (sectionsData) => {
    setStats({
      total: sectionsData.length,
      active: sectionsData.filter((s) => s.isActive).length,
      inactive: sectionsData.filter((s) => !s.isActive).length,
      withWing: sectionsData.filter((s) => s.wingId).length,
      general: sectionsData.filter((s) => !s.wingId).length,
    });
  };

  const handleOpenModal = (mode, section = null) => {
    setModalMode(mode);
    if (mode === "edit" && section) {
      setSelectedSection(section);
      setFormData({
        sectionName: section.sectionName || "",
        wingId: section.wingId?.toString() || "",
        description: section.description || "",
      });
    } else {
      setSelectedSection(null);
      setFormData({
        sectionName: "",
        wingId: "",
        description: "",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedSection(null);
    setFormData({
      sectionName: "",
      wingId: "",
      description: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const url =
        modalMode === "create"
          ? "/api/admin/nursing-sections"
          : `/api/admin/nursing-sections/${selectedSection.id}`;

      const method = modalMode === "create" ? "POST" : "PUT";

      const payload = {
        ...formData,
        wingId: formData.wingId ? parseInt(formData.wingId) : null,
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
            ? "Nursing section created successfully!"
            : "Nursing section updated successfully!"
        );
        fetchSections();
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

  const handleDelete = async (sectionId) => {
    if (!confirm("Are you sure you want to delete this nursing section?")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/nursing-sections/${sectionId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Nursing section deleted successfully!");
        fetchSections();
      } else {
        toast.error(data.error || "Failed to delete section");
      }
    } catch (error) {
      toast.error("Error deleting section");
      console.error(error);
    }
  };

  const handleToggleStatus = async (section) => {
    try {
      const res = await fetch(
        `/api/admin/nursing-sections/${section.id}/toggle-status`,
        {
          method: "PATCH",
        }
      );

      const data = await res.json();

      if (data.success) {
        toast.success(
          `Section ${section.isActive ? "deactivated" : "activated"} successfully!`
        );
        fetchSections();
      } else {
        toast.error(data.error || "Failed to update status");
      }
    } catch (error) {
      toast.error("Error updating status");
      console.error(error);
    }
  };

  const filteredSections = sections.filter((section) => {
    const matchesSearch = section.sectionName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const matchesWing =
      filterWing === "all" ||
      (filterWing === "none" && !section.wingId) ||
      section.wingId === parseInt(filterWing);

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && section.isActive) ||
      (filterStatus === "inactive" && !section.isActive);

    return matchesSearch && matchesWing && matchesStatus;
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
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
              Nursing Sections
            </h1>
            <p className="text-slate-600">
              Organize nurses into sections within wings
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleOpenModal("create")}
            className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="w-5 h-5" />
            Add Section
          </motion.button>
        </motion.div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto mb-8 grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatsCard
          icon={Stethoscope}
          label="Total Sections"
          value={stats.total}
          color="green"
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
        <StatsCard
          icon={Building}
          label="With Wing"
          value={stats.withWing}
          color="blue"
          loading={loading}
        />
        <StatsCard
          icon={Users}
          label="General"
          value={stats.general}
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
                placeholder="Search sections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-12 pr-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Filter by Wing */}
            <div className="relative">
              <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              <select
                value={filterWing}
                onChange={(e) => setFilterWing(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-12 pr-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none cursor-pointer"
              >
                <option value="all">All Wings</option>
                <option value="none">No Wing (General)</option>
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
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-12 pr-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Sections Grid */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
          </div>
        ) : filteredSections.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl p-12 text-center shadow-sm"
          >
            <Stethoscope className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">
              No nursing sections found
            </h3>
            <p className="text-slate-500">
              {searchQuery || filterWing !== "all" || filterStatus !== "all"
                ? "Try adjusting your filters"
                : "Get started by creating your first nursing section"}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSections.map((section, index) => (
              <SectionCard
                key={section.id}
                section={section}
                index={index}
                onEdit={() => handleOpenModal("edit", section)}
                onDelete={() => handleDelete(section.id)}
                onToggleStatus={() => handleToggleStatus(section)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <SectionModal
            mode={modalMode}
            formData={formData}
            setFormData={setFormData}
            wings={wings}
            onSubmit={handleSubmit}
            onClose={handleCloseModal}
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
    green: "from-green-500 to-green-600",
    emerald: "from-emerald-500 to-emerald-600",
    slate: "from-slate-500 to-slate-600",
    blue: "from-blue-500 to-blue-600",
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
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : value}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// Section Card Component
function SectionCard({ section, index, onEdit, onDelete, onToggleStatus }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-lg transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-slate-900 mb-1">
            {section.sectionName}
          </h3>
          {section.wingName ? (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Building className="w-4 h-4 text-blue-600" />
              <span>{section.wingName}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Users className="w-4 h-4" />
              <span>General Section</span>
            </div>
          )}
        </div>
        <div
          className={`w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg`}
        >
          <Stethoscope className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Description */}
      {section.description && (
        <p className="text-sm text-slate-600 mb-4 line-clamp-2">
          {section.description}
        </p>
      )}

      {/* Nurse Count */}
      <div className="flex items-center gap-2 text-sm text-slate-600 mb-4 pb-4 border-b border-slate-100">
        <Users className="w-4 h-4" />
        <span>{section.nurseCount || 0} Nurses</span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3">
        {/* Status Toggle */}
        <button
          onClick={onToggleStatus}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            section.isActive
              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
              : "bg-red-100 text-red-700 hover:bg-red-200"
          }`}
        >
          {section.isActive ? "Active" : "Inactive"}
        </button>

        {/* Actions */}
        <div className="flex items-center gap-2">
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
      </div>

      {/* Created Date */}
      <div className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100">
        Created {new Date(section.createdAt).toLocaleDateString()}
      </div>
    </motion.div>
  );
}

// Section Modal Component
function SectionModal({
  mode,
  formData,
  setFormData,
  wings,
  onSubmit,
  onClose,
  loading,
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
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            {mode === "create" ? "Add Nursing Section" : "Edit Nursing Section"}
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
            {/* Section Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Section Name *
              </label>
              <input
                type="text"
                name="sectionName"
                value={formData.sectionName}
                onChange={handleChange}
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g., General Nursing, ICU Nursing"
                required
              />
            </div>

            {/* Wing Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Assigned Wing
                <span className="text-xs font-normal text-slate-500 ml-2">
                  (Optional - leave empty for general section)
                </span>
              </label>
              <div className="relative">
                <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <select
                  name="wingId"
                  value={formData.wingId}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-300 rounded-xl pl-12 pr-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none cursor-pointer"
                >
                  <option value="">No Wing (General Section)</option>
                  {wings.map((wing) => (
                    <option key={wing.id} value={wing.id}>
                      {wing.wingName} {wing.wingCode && `(${wing.wingCode})`}
                    </option>
                  ))}
                </select>
              </div>
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
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[100px]"
                placeholder="Enter section description..."
              />
            </div>

            {/* Info Box */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-slate-700">
                  <p className="font-semibold mb-1">Nursing Sections</p>
                  <p>
                    Sections help organize nurses within wings. You can create
                    specialized sections (e.g., ICU, Emergency) or general
                    sections that span multiple wings.
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
                  {mode === "create" ? "Creating..." : "Updating..."}
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {mode === "create" ? "Create Section" : "Update Section"}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}