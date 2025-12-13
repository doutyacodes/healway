// FILE: app/superadmin/dashboard/page.jsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  MapPin,
  Phone,
  Mail,
  Users,
  Hospital,
  Activity,
  Filter,
  X,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  ChevronDown,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function SuperAdminDashboard() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create' or 'edit'
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  });

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    imageUrl: "",
    address: "",
    district: "",
    state: "",
    country: "India",
    pincode: "",
    contactEmail: "",
    contactPhone: "",
  });

  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/superadmin/hospitals");
      const data = await res.json();

      if (data.success) {
        setHospitals(data.hospitals);
        calculateStats(data.hospitals);
      } else {
        toast.error("Failed to load hospitals");
      }
    } catch (error) {
      toast.error("Error loading hospitals");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (hospitalData) => {
    setStats({
      total: hospitalData.length,
      active: hospitalData.filter((h) => h.isActive).length,
      inactive: hospitalData.filter((h) => !h.isActive).length,
    });
  };

  const handleOpenModal = (mode, hospital = null) => {
    setModalMode(mode);
    if (mode === "edit" && hospital) {
      setSelectedHospital(hospital);
      setFormData({
        name: hospital.name || "",
        imageUrl: hospital.imageUrl || "",
        address: hospital.address || "",
        district: hospital.district || "",
        state: hospital.state || "",
        country: hospital.country || "India",
        pincode: hospital.pincode || "",
        contactEmail: hospital.contactEmail || "",
        contactPhone: hospital.contactPhone || "",
      });
    } else {
      setSelectedHospital(null);
      setFormData({
        name: "",
        imageUrl: "",
        address: "",
        district: "",
        state: "",
        country: "India",
        pincode: "",
        contactEmail: "",
        contactPhone: "",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedHospital(null);
    setFormData({
      name: "",
      imageUrl: "",
      address: "",
      district: "",
      state: "",
      country: "India",
      pincode: "",
      contactEmail: "",
      contactPhone: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const url =
        modalMode === "create"
          ? "/api/superadmin/hospitals"
          : `/api/superadmin/hospitals/${selectedHospital.id}`;

      const method = modalMode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(
          modalMode === "create"
            ? "Hospital created successfully!"
            : "Hospital updated successfully!"
        );
        fetchHospitals();
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

  const handleDelete = async (hospitalId) => {
    if (!confirm("Are you sure you want to delete this hospital?")) {
      return;
    }

    try {
      const res = await fetch(`/api/superadmin/hospitals/${hospitalId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Hospital deleted successfully!");
        fetchHospitals();
      } else {
        toast.error(data.error || "Failed to delete hospital");
      }
    } catch (error) {
      toast.error("Error deleting hospital");
      console.error(error);
    }
  };

  const filteredHospitals = hospitals.filter(
    (hospital) =>
      hospital.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hospital.district?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hospital.state?.toLowerCase().includes(searchQuery.toLowerCase())
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
              Hospital Management
            </h1>
            <p className="text-slate-600">
              Manage all hospitals in the HealWay network
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleOpenModal("create")}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="w-5 h-5" />
            Add Hospital
          </motion.button>
        </motion.div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          icon={Building2}
          label="Total Hospitals"
          value={stats.total}
          color="blue"
          loading={loading}
        />
        <StatsCard
          icon={CheckCircle}
          label="Active Hospitals"
          value={stats.active}
          color="green"
          loading={loading}
        />
        <StatsCard
          icon={AlertCircle}
          label="Inactive Hospitals"
          value={stats.inactive}
          color="orange"
          loading={loading}
        />
      </div>

      {/* Search Bar */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search hospitals by name, district, or state..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
        </div>
      </div>

      {/* Hospitals Grid */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : filteredHospitals.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl p-12 text-center shadow-sm"
          >
            <Hospital className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">
              No hospitals found
            </h3>
            <p className="text-slate-500">
              {searchQuery
                ? "Try adjusting your search query"
                : "Get started by adding your first hospital"}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHospitals.map((hospital, index) => (
              <HospitalCard
                key={hospital.id}
                hospital={hospital}
                index={index}
                onEdit={() => handleOpenModal("edit", hospital)}
                onDelete={() => handleDelete(hospital.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <HospitalModal
            mode={modalMode}
            formData={formData}
            setFormData={setFormData}
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
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    orange: "from-orange-500 to-orange-600",
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

// Hospital Card Component
function HospitalCard({ hospital, index, onEdit, onDelete }) {
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
        {hospital.imageUrl ? (
          <img
            src={hospital.imageUrl}
            alt={hospital.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Building2 className="w-12 h-12 text-white/50" />
          </div>
        )}
        <div className="absolute top-3 right-3 flex gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              hospital.isActive
                ? "bg-green-500 text-white"
                : "bg-orange-500 text-white"
            }`}
          >
            {hospital.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-xl font-bold text-slate-900 mb-2">
          {hospital.name}
        </h3>

        {/* Location */}
        <div className="flex items-start gap-2 text-slate-600 text-sm mb-3">
          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span className="line-clamp-2">
            {hospital.district && `${hospital.district}, `}
            {hospital.state}
            {hospital.pincode && ` - ${hospital.pincode}`}
          </span>
        </div>

        {/* Contact Info */}
        {(hospital.contactEmail || hospital.contactPhone) && (
          <div className="space-y-2 mb-4">
            {hospital.contactEmail && (
              <div className="flex items-center gap-2 text-slate-600 text-sm">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{hospital.contactEmail}</span>
              </div>
            )}
            {hospital.contactPhone && (
              <div className="flex items-center gap-2 text-slate-600 text-sm">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>{hospital.contactPhone}</span>
              </div>
            )}
          </div>
        )}

        {/* Show More Details */}
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-slate-50 rounded-lg p-3 mb-4 text-sm"
          >
            <p className="text-slate-600 mb-1">
              <span className="font-semibold">Address:</span> {hospital.address}
            </p>
            <p className="text-slate-600">
              <span className="font-semibold">Country:</span>{" "}
              {hospital.country || "India"}
            </p>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowDetails(!showDetails)}
            className="flex-1 flex items-center justify-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-200 transition-colors"
          >
            <Eye className="w-4 h-4" />
            {showDetails ? "Hide" : "Details"}
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

// Hospital Modal Component
function HospitalModal({
  mode,
  formData,
  setFormData,
  onSubmit,
  onClose,
  loading,
}) {
 // In the HospitalModal component, update the handleChange function:

const handleChange = (e) => {
  const { name, value } = e.target;
  
  // Remove spaces from phone and pincode fields
  if (name === 'contactPhone' || name === 'pincode') {
    setFormData({
      ...formData,
      [name]: value.replace(/\s/g, ''),
    });
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
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            {mode === "create" ? "Add New Hospital" : "Edit Hospital"}
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
            {/* Hospital Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Hospital Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter hospital name"
                required
              />
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Hospital Image URL
              </label>
              <input
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Full Address *
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                placeholder="Enter complete address"
                required
              />
            </div>

            {/* District, State, Pincode */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  District
                </label>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="District"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  State
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="State"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Pincode
                </label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Pincode"
                  maxLength="10"
                />
              </div>
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Country
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Country"
              />
            </div>

            {/* Contact Email & Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Contact Email
                </label>
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="contact@hospital.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+91 1234567890"
                />
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
                  {mode === "create" ? "Create Hospital" : "Update Hospital"}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}