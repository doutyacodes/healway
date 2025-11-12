// FILE: app/user/guests/page.jsx
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
  QrCode,
  Download,
  Share2,
  Clock,
  Calendar,
  User,
  Phone,
  Mail,
  AlertCircle,
  CheckCircle,
  Building,
  Info,
  Shield,
  ChevronRight,
  UserCheck,
  Repeat,
  Clock3,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import QRCode from "qrcode";
import Link from "next/link";

export default function GuestsPage() {
  const [guests, setGuests] = useState([]); // Initialize as empty array
  const [session, setSession] = useState(null);
  const [visitingHours, setVisitingHours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  const [formData, setFormData] = useState({
    guestName: "",
    guestMobile: "",
    visitType: "one_time",
    visitDate: "",
    visitTime: "",
    relationship: "",
    purpose: "",
  });

  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchGuests(), fetchSession(), fetchVisitingHours()]);
    setLoading(false);
  };

  const fetchGuests = async () => {
    try {
      const res = await fetch("/api/user/guests");
      const data = await res.json();

      if (data.success) {
        setGuests(data.guests || []); // Ensure array
      } else {
        toast.error(data.error || "Failed to load guests");
        setGuests([]); // Set empty array on error
      }
    } catch (error) {
      toast.error("Error loading guests");
      console.error(error);
      setGuests([]); // Set empty array on error
    }
  };

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/user/profile");
      const data = await res.json();

      if (data.success && data.session) {
        setSession(data.session);
      }
    } catch (error) {
      console.error("Error loading session:", error);
    }
  };

  const fetchVisitingHours = async () => {
    try {
      const res = await fetch("/api/user/visiting-hours");
      const data = await res.json();

      if (data.success) {
        setVisitingHours(data.visitingHours || []);
      }
    } catch (error) {
      console.error("Error loading visiting hours:", error);
      setVisitingHours([]);
    }
  };

  const handleOpenModal = (mode, guest = null) => {
    if (!session) {
      toast.error("You need an active session to create guest passes");
      return;
    }

    const activeCount = guests.filter((g) => g.status === "approved" && g.isActive).length;
    
    if (mode === "create" && activeCount >= 3) {
      toast.error("Maximum 3 active guest passes allowed");
      return;
    }

    setModalMode(mode);
    if (mode === "edit" && guest) {
      setSelectedGuest(guest);
      setFormData({
        guestName: guest.guestName || "",
        guestMobile: guest.guestPhone || "",
        visitType: guest.guestType || "one_time",
        visitDate: guest.validFrom
          ? new Date(guest.validFrom).toISOString().split("T")[0]
          : "",
        visitTime: "",
        relationship: guest.relationshipToPatient || "",
        purpose: guest.purpose || "",
      });
    } else {
      setSelectedGuest(null);
      setFormData({
        guestName: "",
        guestMobile: "",
        visitType: "one_time",
        visitDate: "",
        visitTime: "",
        relationship: "",
        purpose: "",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedGuest(null);
    setFormData({
      guestName: "",
      guestMobile: "",
      visitType: "one_time",
      visitDate: "",
      visitTime: "",
      relationship: "",
      purpose: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const url =
        modalMode === "create"
          ? "/api/user/guests"
          : `/api/user/guests/${selectedGuest.id}`;

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
            ? "Guest pass created successfully!"
            : "Guest pass updated successfully!"
        );
        fetchGuests();
        handleCloseModal();

        // Show QR code for new guest
        if (modalMode === "create" && data.guest) {
          handleShowQR(data.guest);
        }
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

  const handleDelete = async (guestId) => {
    if (!confirm("Are you sure you want to revoke this guest pass?")) {
      return;
    }

    try {
      const res = await fetch(`/api/user/guests/${guestId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Guest pass revoked successfully!");
        fetchGuests();
      } else {
        toast.error(data.error || "Failed to revoke guest pass");
      }
    } catch (error) {
      toast.error("Error revoking guest pass");
      console.error(error);
    }
  };

  const handleShowQR = async (guest) => {
    try {
      setSelectedGuest(guest);

      // Generate QR code with guest pass data
      const qrData = JSON.stringify({
        id: guest.id,
        qrCode: guest.qrCode,
        guestName: guest.guestName,
        sessionId: guest.sessionId,
        guestType: guest.guestType,
        validFrom: guest.validFrom,
        validUntil: guest.validUntil,
      });

      const qrUrl = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: "#1e40af",
          light: "#ffffff",
        },
      });

      setQrCodeUrl(qrUrl);
      setShowQRModal(true);
    } catch (error) {
      toast.error("Failed to generate QR code");
      console.error(error);
    }
  };

  const handleDownloadQR = () => {
    if (!selectedGuest || !qrCodeUrl) return;
    
    const link = document.createElement("a");
    link.download = `guest-pass-${selectedGuest.qrCode}.png`;
    link.href = qrCodeUrl;
    link.click();
    toast.success("QR code downloaded!");
  };

  const handleShareWhatsApp = () => {
    if (!selectedGuest) return;
    
    const message = `*HealWay Guest Pass*\n\nGuest: ${selectedGuest.guestName}\nPass Code: ${selectedGuest.qrCode}\nVisit Type: ${selectedGuest.guestType}\n\nPlease show this pass at the entrance.`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const isWithinVisitingHours = (visitTime) => {
    if (!visitTime || visitingHours.length === 0) return true; // Allow if no visiting hours set

    const [hours, minutes] = visitTime.split(":").map(Number);
    const visitMinutes = hours * 60 + minutes;

    return visitingHours.some((slot) => {
      const [startHours, startMinutes] = slot.startTime.split(":").map(Number);
      const [endHours, endMinutes] = slot.endTime.split(":").map(Number);

      const startMinutesTotal = startHours * 60 + startMinutes;
      const endMinutesTotal = endHours * 60 + endMinutes;

      return (
        visitMinutes >= startMinutesTotal && visitMinutes <= endMinutesTotal
      );
    });
  };

  // Safe filtering with fallback
  const filteredGuests = Array.isArray(guests)
    ? guests.filter((guest) =>
        guest.guestName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Safe counting with fallback
  const activeGuests = Array.isArray(guests)
    ? guests.filter((g) => g.status === "approved" && g.isActive === true)
    : [];
    
  const frequentGuests = Array.isArray(guests)
    ? guests.filter((g) => g.guestType === "frequent")
    : [];
    
  const oneTimeGuests = Array.isArray(guests)
    ? guests.filter((g) => g.guestType === "one_time")
    : [];

  const canCreateMore = activeGuests.length < 3;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl border border-slate-200 p-12 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-orange-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              No Active Session
            </h2>
            <p className="text-slate-600 mb-6">
              You need an active hospital session to create guest passes. Please
              contact the hospital administration for admission.
            </p>
            <Link
              href="/user/dashboard"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
              <ChevronRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">
                Guest Passes
              </h1>
              <p className="text-slate-600">
                Create and manage visitor passes (Maximum 3 active)
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleOpenModal("create")}
              disabled={!canCreateMore}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5" />
              Create Guest Pass
            </motion.button>
          </div>
        </motion.div>

        {/* Session Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-6"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <Building className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Current Location
              </h3>
              <p className="text-sm text-slate-600">
                {session.wingName} - Room {session.roomNumber}
              </p>
            </div>
          </div>

          {/* Visiting Hours */}
          {visitingHours.length > 0 && (
            <div className="border-t border-slate-200 pt-4 mt-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-slate-900">Visiting Hours</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {visitingHours.map((slot, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg"
                  >
                    <Clock3 className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-slate-700">
                      {slot.startTime} - {slot.endTime}
                    </span>
                    {slot.dayOfWeek && (
                      <span className="text-xs text-slate-500 capitalize">
                        ({slot.dayOfWeek})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-slate-200"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Active Passes</p>
                <p className="text-2xl font-bold text-slate-900">
                  {activeGuests.length} / 3
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-slate-200"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Frequent Visitors</p>
                <p className="text-2xl font-bold text-slate-900">
                  {frequentGuests.length}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-slate-200"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">One-Time Visitors</p>
                <p className="text-2xl font-bold text-slate-900">
                  {oneTimeGuests.length}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search guests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
          </div>
        </div>

        {/* Guests Grid */}
        {filteredGuests.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-200"
          >
            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">
              No guest passes yet
            </h3>
            <p className="text-slate-500 mb-6">
              Create your first guest pass to invite visitors
            </p>
            {canCreateMore && (
              <button
                onClick={() => handleOpenModal("create")}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create Guest Pass
              </button>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGuests.map((guest, index) => (
              <GuestCard
                key={guest.id}
                guest={guest}
                index={index}
                onEdit={() => handleOpenModal("edit", guest)}
                onDelete={() => handleDelete(guest.id)}
                onShowQR={() => handleShowQR(guest)}
              />
            ))}
          </div>
        )}

        {/* View Arrivals Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-center"
        >
          <Link
            href="/user/guests/arrivals"
            className="inline-flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold border-2 border-blue-600 hover:bg-blue-50 transition-colors"
          >
            <UserCheck className="w-5 h-5" />
            View Guest Arrivals
            <ChevronRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <GuestModal
            mode={modalMode}
            formData={formData}
            setFormData={setFormData}
            visitingHours={visitingHours}
            onSubmit={handleSubmit}
            onClose={handleCloseModal}
            loading={formLoading}
            isWithinVisitingHours={isWithinVisitingHours}
          />
        )}
      </AnimatePresence>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQRModal && selectedGuest && (
           <> {console.log("selectedGuest in qr modal",selectedGuest)}
          <QRModal
            guest={selectedGuest}
            qrCodeUrl={qrCodeUrl}
            session={session}
            onClose={() => setShowQRModal(false)}
            onDownload={handleDownloadQR}
            onShareWhatsApp={handleShareWhatsApp}
          />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Guest Card Component - Updated with schema fields
function GuestCard({ guest, index, onEdit, onDelete, onShowQR }) {
  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-700 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "denied":
        return "bg-red-100 text-red-700 border-red-200";
      case "expired":
        return "bg-slate-100 text-slate-700 border-slate-200";
      case "revoked":
        return "bg-orange-100 text-orange-700 border-orange-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

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
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
            {guest.guestName?.charAt(0).toUpperCase() || "G"}
          </div>
          <div>
            <h3 className="font-bold text-slate-900">{guest.guestName}</h3>
            <p className="text-sm text-slate-500">
              {guest.relationshipToPatient || "Guest"}
            </p>
          </div>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
            guest.status
          )}`}
        >
          {guest.status}
        </span>
      </div>

      {/* Details */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Phone className="w-4 h-4" />
          <span>{guest.guestPhone}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          {guest.guestType === "frequent" ? (
            <>
              <Repeat className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-600">
                Frequent Visitor
              </span>
            </>
          ) : (
            <>
              <Clock className="w-4 h-4 text-purple-600" />
              <span className="font-medium text-purple-600">
                One-Time Visit
              </span>
            </>
          )}
        </div>
        {guest.validFrom && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="w-4 h-4" />
            <span>
              Valid: {new Date(guest.validFrom).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      {/* QR Code */}
      <div className="bg-slate-50 rounded-lg px-4 py-3 mb-4">
        <p className="text-xs text-slate-500 mb-1">QR Code</p>
        <p className="text-lg font-bold text-slate-900 tracking-wider">
          {guest.qrCode}
        </p>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-3 gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onShowQR}
          className="flex items-center justify-center gap-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <QrCode className="w-4 h-4" />
          QR
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onEdit}
          disabled={guest.status === "expired" || guest.status === "revoked"}
          className="flex items-center justify-center gap-1 bg-white text-slate-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Edit2 className="w-4 h-4" />
          Edit
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onDelete}
          disabled={guest.status === "revoked"}
          className="flex items-center justify-center gap-1 bg-white text-red-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors border border-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-4 h-4" />
          Revoke
        </motion.button>
      </div>
    </motion.div>
  );
}

// Continuing app/user/guests/page.jsx

// Guest Modal Component
function GuestModal({
  mode,
  formData,
  setFormData,
  visitingHours,
  onSubmit,
  onClose,
  loading,
  isWithinVisitingHours,
}) {
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const isValidVisitTime =
    !formData.visitTime || isWithinVisitingHours(formData.visitTime);

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
            {mode === "create" ? "Create Guest Pass" : "Edit Guest Pass"}
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
            {/* Guest Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Guest Name *
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  name="guestName"
                  value={formData.guestName}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-300 rounded-xl pl-12 pr-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter guest's full name"
                  required
                />
              </div>
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
                  name="guestMobile"
                  value={formData.guestMobile}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-300 rounded-xl pl-12 pr-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+91 9876543210"
                  required
                />
              </div>
            </div>

            {/* Email (Optional) */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Email Address (Optional)
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  name="guestEmail"
                  value={formData.guestEmail}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-300 rounded-xl pl-12 pr-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="guest@example.com"
                />
              </div>
            </div>

            {/* Visit Type */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Visit Type *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label
                  className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    formData.visitType === "one_time"
                      ? "border-purple-500 bg-purple-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="visitType"
                    value="one_time"
                    checked={formData.visitType === "one_time"}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <Clock className="w-6 h-6 text-purple-600" />
                  <div>
                    <p className="font-semibold text-slate-900">One-Time</p>
                    <p className="text-xs text-slate-600">Single visit</p>
                  </div>
                </label>

                <label
                  className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    formData.visitType === "frequent"
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="visitType"
                    value="frequent"
                    checked={formData.visitType === "frequent"}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <Repeat className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="font-semibold text-slate-900">Frequent</p>
                    <p className="text-xs text-slate-600">Multiple visits</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Visit Date & Time (for one-time visits) */}
            {formData.visitType === "one_time" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Visit Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    <input
                      type="date"
                      name="visitDate"
                      value={formData.visitDate}
                      onChange={handleChange}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full bg-white border border-slate-300 rounded-xl pl-12 pr-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Visit Time *
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    <input
                      type="time"
                      name="visitTime"
                      value={formData.visitTime}
                      onChange={handleChange}
                      className={`w-full bg-white border ${
                        isValidVisitTime ? "border-slate-300" : "border-red-300"
                      } rounded-xl pl-12 pr-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      required
                    />
                  </div>
                  {!isValidVisitTime && formData.visitTime && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Time must be within visiting hours
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Relationship */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Relationship
              </label>
              <input
                type="text"
                name="relationship"
                value={formData.relationship}
                onChange={handleChange}
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Father, Friend, Colleague"
              />
            </div>

            {/* Purpose */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Purpose of Visit
              </label>
              <textarea
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                placeholder="Optional: Describe the purpose of visit"
              />
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-slate-700">
                  <p className="font-semibold mb-1">Guest Pass Information</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Maximum 3 active guest passes allowed</li>
                    <li>One-time passes expire after the visit date</li>
                    <li>Frequent passes remain active until cancelled</li>
                    <li>Guest must present QR code at entrance</li>
                    <li>Visit times must be within hospital visiting hours</li>
                  </ul>
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
              disabled={loading || !isValidVisitTime}
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
                  {mode === "create" ? "Create Pass" : "Update Pass"}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// QR Modal Component
function QRModal({
  guest,
  qrCodeUrl,
  session,
  onClose,
  onDownload,
  onShareWhatsApp,
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
        {console.log("guest in qr modal",guest)}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Guest Pass QR Code</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Guest Info */}
          <div className="bg-slate-50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                {guest.guestName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{guest.guestName}</h3>
                <p className="text-sm text-slate-600">{guest.guestMobile}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-slate-500">Pass Code</p>
                <p className="font-bold text-slate-900">{guest.passCode}</p>
              </div>
              <div>
                <p className="text-slate-500">Visit Type</p>
                <p className="font-bold text-slate-900 capitalize">
                    {console.log("guests Data",guest)}
                  {guest.visitType || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Location</p>
                <p className="font-bold text-slate-900">
                  {session?.wingName} - {session?.roomNumber}
                </p>
              </div>
              {guest.visitDate && (
                <div>
                  <p className="text-slate-500">Visit Date</p>
                  <p className="font-bold text-slate-900">
                    {new Date(guest.visitDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* QR Code */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 mb-6">
            <div className="bg-white rounded-xl p-6 shadow-lg inline-block mx-auto">
              <img
                src={qrCodeUrl}
                alt="Guest Pass QR Code"
                className="w-64 h-64 mx-auto"
              />
            </div>
            <p className="text-center text-sm text-slate-600 mt-4">
              Show this QR code at the hospital entrance
            </p>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onDownload}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              <Download className="w-5 h-5" />
              Download
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onShareWhatsApp}
              className="flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
            >
              <Share2 className="w-5 h-5" />
              WhatsApp
            </motion.button>
          </div>

          {/* Instructions */}
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex gap-3">
              <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-slate-700">
                <p className="font-semibold mb-1">Security Instructions</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Guest must carry valid ID proof</li>
                  <li>QR code will be scanned at security checkpoint</li>
                  <li>Guest must follow hospital visiting hours</li>
                  <li>Pass can be cancelled anytime by patient</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}