// FILE: app/admin/nurse-assignments/page.jsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserPlus,
  UserMinus,
  Search,
  Loader2,
  X,
  Stethoscope,
  User,
  Bed,
  Building,
  Calendar,
  CheckCircle,
  AlertCircle,
  Filter,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function NurseAssignmentsPage() {
  const [sessions, setSessions] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterWing, setFilterWing] = useState("all");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedNurses, setSelectedNurses] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [wings, setWings] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sessionsRes, nursesRes, wingsRes] = await Promise.all([
        fetch("/api/admin/patient-sessions"),
        fetch("/api/admin/nurses"),
        fetch("/api/admin/wings"),
      ]);

      const sessionsData = await sessionsRes.json();
      const nursesData = await nursesRes.json();
      const wingsData = await wingsRes.json();

      if (sessionsData.success) {
        setSessions(sessionsData.sessions);
      }

      if (nursesData.success) {
        setNurses(nursesData.nurses.filter((n) => n.isActive));
      }

      if (wingsData.success) {
        setWings(wingsData.wings.filter((w) => w.isActive));
      }
    } catch (error) {
      toast.error("Error loading data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAssignModal = (session) => {
    setSelectedSession(session);
    setSelectedNurses([]);
    setShowAssignModal(true);
  };

  const handleToggleNurse = (nurseId) => {
    setSelectedNurses((prev) =>
      prev.includes(nurseId)
        ? prev.filter((id) => id !== nurseId)
        : [...prev, nurseId]
    );
  };

  const handleBulkAssign = async () => {
    if (selectedNurses.length === 0) {
      toast.error("Please select at least one nurse");
      return;
    }

    setAssignLoading(true);
    try {
      const res = await fetch(
        `/api/admin/patient-sessions/${selectedSession.sessionId}/bulk-assign-nurses`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nurseIds: selectedNurses }),
        }
      );

      const data = await res.json();

      if (data.success) {
        toast.success(
          `${data.stats.newlyAssigned} nurse(s) assigned successfully!`
        );
        setShowAssignModal(false);
        fetchData();
      } else {
        toast.error(data.error || "Failed to assign nurses");
      }
    } catch (error) {
      toast.error("Error assigning nurses");
      console.error(error);
    } finally {
      setAssignLoading(false);
    }
  };

  const handleUnassignNurse = async (sessionId, nurseId, nurseName) => {
    if (
      !confirm(
        `Unassign ${nurseName} from this patient? They will no longer be responsible for this patient's care.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(
        `/api/admin/patient-sessions/${sessionId}/unassign-nurse/${nurseId}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json();

      if (data.success) {
        toast.success("Nurse unassigned successfully!");
        fetchData();
      } else {
        toast.error(data.error || "Failed to unassign nurse");
      }
    } catch (error) {
      toast.error("Error unassigning nurse");
      console.error(error);
    }
  };

  const filteredSessions = sessions.filter((session) => {
    const matchesSearch =
      session.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.roomNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesWing =
      filterWing === "all" || session.wingId === parseInt(filterWing);

    return matchesSearch && matchesWing;
  });

  // Get available nurses for selected session (not already assigned)
  const getAvailableNurses = () => {
    if (!selectedSession) return [];

    const assignedNurseIds = selectedSession.assignedNurses.map((n) => n.nurseId);
    return nurses.filter((nurse) => !assignedNurseIds.includes(nurse.id));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Nurse-Patient Assignments
          </h1>
          <p className="text-slate-600">
            Assign nurses to care for specific patients
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatsCard
            icon={User}
            label="Active Patients"
            value={sessions.length}
            color="blue"
          />
          <StatsCard
            icon={Stethoscope}
            label="Total Nurses"
            value={nurses.length}
            color="green"
          />
          <StatsCard
            icon={CheckCircle}
            label="With Assigned Nurses"
            value={sessions.filter((s) => s.nurseCount > 0).length}
            color="indigo"
          />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search patients, rooms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-12 pr-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Wing Filter */}
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

        {/* Patient Sessions */}
        {filteredSessions.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">
              No Active Patients
            </h3>
            <p className="text-slate-500">
              {searchQuery || filterWing !== "all"
                ? "Try adjusting your filters"
                : "There are no active patient sessions"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSessions.map((session, index) => (
              <PatientSessionCard
                key={session.sessionId}
                session={session}
                index={index}
                onAssignNurse={() => handleOpenAssignModal(session)}
                onUnassignNurse={handleUnassignNurse}
              />
            ))}
          </div>
        )}
      </div>

      {/* Assign Nurses Modal */}
      <AnimatePresence>
        {showAssignModal && (
          <AssignNursesModal
            session={selectedSession}
            availableNurses={getAvailableNurses()}
            selectedNurses={selectedNurses}
            onToggleNurse={handleToggleNurse}
            onAssign={handleBulkAssign}
            onClose={() => setShowAssignModal(false)}
            loading={assignLoading}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Stats Card Component
function StatsCard({ icon: Icon, label, value, color }) {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    indigo: "from-indigo-500 to-indigo-600",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 shadow-sm border border-slate-100"
    >
      <div className="flex items-center gap-4">
        <div
          className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center shadow-lg`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="text-slate-600 text-sm font-medium">{label}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
        </div>
      </div>
    </motion.div>
  );
}

// Continue app/admin/nurse-assignments/page.jsx

// Patient Session Card Component
function PatientSessionCard({ session, index, onAssignNurse, onUnassignNurse }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4 flex-1">
          {/* Patient Avatar */}
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
            {session.patientName.charAt(0).toUpperCase()}
          </div>

          {/* Patient Info */}
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-900 mb-1">
              {session.patientName}
            </h3>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <div className="flex items-center gap-1">
                <Building className="w-4 h-4" />
                <span>{session.wingName}</span>
              </div>
              <div className="flex items-center gap-1">
                <Bed className="w-4 h-4" />
                <span>Room {session.roomNumber}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>
                  Since {new Date(session.startDate).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="mt-2">
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                  session.admissionType === "emergency"
                    ? "bg-red-100 text-red-700"
                    : session.admissionType === "planned"
                    ? "bg-green-100 text-green-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                <AlertCircle className="w-3 h-3" />
                {session.admissionType} admission
              </span>
              <span className="ml-2 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 capitalize">
                {session.patientRole}
              </span>
            </div>
          </div>
        </div>

        {/* Assign Nurse Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onAssignNurse}
          className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
        >
          <UserPlus className="w-4 h-4" />
          Assign Nurse
        </motion.button>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-200 my-4" />

      {/* Assigned Nurses */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Stethoscope className="w-4 h-4" />
            Assigned Nurses ({session.nurseCount})
          </h4>
        </div>

        {session.assignedNurses.length === 0 ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
            <AlertCircle className="w-6 h-6 text-amber-600 mx-auto mb-2" />
            <p className="text-sm text-amber-700 font-medium">
              No nurses assigned yet
            </p>
            <p className="text-xs text-amber-600 mt-1">
              Click "Assign Nurse" to assign care providers
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {session.assignedNurses.map((nurse) => (
              <AssignedNurseCard
                key={nurse.assignmentId}
                nurse={nurse}
                sessionId={session.sessionId}
                onUnassign={() =>
                  onUnassignNurse(session.sessionId, nurse.nurseId, nurse.nurseName)
                }
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Assigned Nurse Card Component
function AssignedNurseCard({ nurse, sessionId, onUnassign }) {
  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 flex items-start justify-between group hover:shadow-md transition-all">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0">
          {nurse.nurseName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h5 className="font-semibold text-slate-900 text-sm truncate">
            {nurse.nurseName}
          </h5>
          <p className="text-xs text-slate-600 truncate">{nurse.nurseEmail}</p>
          <p className="text-xs text-slate-500 mt-1">
            Assigned {new Date(nurse.assignedAt).toLocaleDateString()}
          </p>
        </div>
      </div>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onUnassign}
        className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
        title="Unassign"
      >
        <UserMinus className="w-4 h-4" />
      </motion.button>
    </div>
  );
}

// Assign Nurses Modal Component
function AssignNursesModal({
  session,
  availableNurses,
  selectedNurses,
  onToggleNurse,
  onAssign,
  onClose,
  loading,
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredNurses = availableNurses.filter(
    (nurse) =>
      nurse.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      nurse.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Assign Nurses</h2>
              <p className="text-white/80 text-sm mt-1">
                Patient: {session.patientName} • Room {session.roomNumber}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search nurses by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-12 pr-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <p className="text-sm text-slate-600 mt-3">
            {selectedNurses.length} nurse(s) selected • {filteredNurses.length}{" "}
            available
          </p>
        </div>

        {/* Nurses List */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-300px)]">
          {filteredNurses.length === 0 ? (
            <div className="text-center py-12">
              <Stethoscope className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                No Available Nurses
              </h3>
              <p className="text-slate-500">
                {availableNurses.length === 0
                  ? "All nurses are already assigned to this patient"
                  : "Try adjusting your search"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredNurses.map((nurse) => (
                <NurseSelectionCard
                  key={nurse.id}
                  nurse={nurse}
                  isSelected={selectedNurses.includes(nurse.id)}
                  onToggle={() => onToggleNurse(nurse.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-100 text-slate-700 px-6 py-3 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onAssign}
            disabled={loading || selectedNurses.length === 0}
            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Assign {selectedNurses.length} Nurse(s)
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Nurse Selection Card Component
function NurseSelectionCard({ nurse, isSelected, onToggle }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      onClick={onToggle}
      className={`cursor-pointer rounded-xl p-4 border-2 transition-all ${
        isSelected
          ? "border-green-500 bg-green-50"
          : "border-slate-200 bg-white hover:border-green-300"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-md ${
              isSelected
                ? "bg-green-500"
                : "bg-gradient-to-br from-slate-400 to-slate-500"
            }`}
          >
            {nurse.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-slate-900 truncate">{nurse.name}</h4>
            <p className="text-xs text-slate-600 truncate">{nurse.email}</p>
            {nurse.sectionName && (
              <p className="text-xs text-slate-500 mt-1 truncate">
                {nurse.sectionName}
              </p>
            )}
          </div>
        </div>
        {isSelected && (
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 ml-2" />
        )}
      </div>

      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-600">Employee ID:</span>
          <span className="font-semibold">{nurse.employeeId || "N/A"}</span>
        </div>
        {nurse.shiftTiming && (
          <div className="flex justify-between">
            <span className="text-slate-600">Shift:</span>
            <span className="font-semibold">{nurse.shiftTiming}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}