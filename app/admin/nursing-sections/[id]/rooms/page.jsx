// FILE: app/admin/nursing-sections/[id]/rooms/page.jsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Search,
  Loader2,
  X,
  Building,
  Bed,
  CheckCircle,
  Home,
  Filter,
  Grid3x3,
  Package,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import Link from "next/link";

export default function SectionRoomsPage() {
  const params = useParams();
  const router = useRouter();
  const sectionId = params.id;

  const [section, setSection] = useState(null);
  const [assignedRooms, setAssignedRooms] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterWing, setFilterWing] = useState("all");
  const [filterRoomType, setFilterRoomType] = useState("all");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [wings, setWings] = useState([]);

  useEffect(() => {
    fetchData();
  }, [sectionId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [roomsRes, wingsRes] = await Promise.all([
        fetch(`/api/admin/nursing-sections/${sectionId}/rooms`),
        fetch("/api/admin/wings"),
      ]);

      const roomsData = await roomsRes.json();
      const wingsData = await wingsRes.json();

      if (roomsData.success) {
        setSection(roomsData.section);
        setAssignedRooms(roomsData.assignedRooms);
        setAvailableRooms(roomsData.availableRooms);
      } else {
        toast.error("Failed to load section rooms");
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

  const handleRemoveRoom = async (roomId, roomNumber) => {
    if (
      !confirm(
        `Remove room ${roomNumber} from this nursing section? Nurses will no longer have access to this room.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(
        `/api/admin/nursing-sections/${sectionId}/rooms/${roomId}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json();

      if (data.success) {
        toast.success("Room removed successfully!");
        fetchData();
      } else {
        toast.error(data.error || "Failed to remove room");
      }
    } catch (error) {
      toast.error("Error removing room");
      console.error(error);
    }
  };

  const handleOpenAssignModal = () => {
    setSelectedRooms([]);
    setShowAssignModal(true);
  };

  const handleToggleRoom = (roomId) => {
    setSelectedRooms((prev) =>
      prev.includes(roomId)
        ? prev.filter((id) => id !== roomId)
        : [...prev, roomId]
    );
  };

  const handleSelectAll = () => {
    const filtered = getFilteredAvailableRooms();
    const allIds = filtered.map((r) => r.roomId);
    setSelectedRooms(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedRooms([]);
  };

  const handleBulkAssign = async () => {
    if (selectedRooms.length === 0) {
      toast.error("Please select at least one room");
      return;
    }

    setAssignLoading(true);
    try {
      const res = await fetch(
        `/api/admin/nursing-sections/${sectionId}/rooms/bulk-assign`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomIds: selectedRooms }),
        }
      );

      const data = await res.json();

      if (data.success) {
        toast.success(
          `${data.stats.newlyAssigned} room(s) assigned successfully!`
        );
        setShowAssignModal(false);
        fetchData();
      } else {
        toast.error(data.error || "Failed to assign rooms");
      }
    } catch (error) {
      toast.error("Error assigning rooms");
      console.error(error);
    } finally {
      setAssignLoading(false);
    }
  };

  const getFilteredAvailableRooms = () => {
    return availableRooms.filter((room) => {
      const matchesSearch =
        room.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.wingName?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesWing =
        filterWing === "all" || room.wingId === parseInt(filterWing);

      const matchesType =
        filterRoomType === "all" || room.roomType === filterRoomType;

      return matchesSearch && matchesWing && matchesType;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
      </div>
    );
  }

  const filteredAvailableRooms = getFilteredAvailableRooms();

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
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/admin/nursing-sections"
              className="p-2 hover:bg-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-slate-600" />
            </Link>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Manage Section Rooms
              </h1>
              <p className="text-slate-600 mt-2">
                {section?.sectionName} - Assign rooms to nursing section
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleOpenAssignModal}
              className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="w-5 h-5" />
              Assign Rooms
            </motion.button>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatsCard
            icon={Bed}
            label="Assigned Rooms"
            value={assignedRooms.length}
            color="green"
          />
          <StatsCard
            icon={Package}
            label="Available Rooms"
            value={availableRooms.length}
            color="blue"
          />
          <StatsCard
            icon={Grid3x3}
            label="Total Rooms"
            value={assignedRooms.length + availableRooms.length}
            color="indigo"
          />
        </div>

        {/* Assigned Rooms */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Assigned Rooms ({assignedRooms.length})
          </h2>

          {assignedRooms.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
              <Bed className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">
                No Rooms Assigned
              </h3>
              <p className="text-slate-500 mb-6">
                Start by assigning rooms to this nursing section
              </p>
              <button
                onClick={handleOpenAssignModal}
                className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Assign Rooms
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignedRooms.map((room, index) => (
                <AssignedRoomCard
                  key={room.roomId}
                  room={room}
                  index={index}
                  onRemove={() =>
                    handleRemoveRoom(room.roomId, room.roomNumber)
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Assign Rooms Modal */}
      <AnimatePresence>
        {showAssignModal && (
          <AssignRoomsModal
            availableRooms={filteredAvailableRooms}
            allAvailableRooms={availableRooms}
            selectedRooms={selectedRooms}
            wings={wings}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterWing={filterWing}
            setFilterWing={setFilterWing}
            filterRoomType={filterRoomType}
            setFilterRoomType={setFilterRoomType}
            onToggleRoom={handleToggleRoom}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
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
    green: "from-green-500 to-green-600",
    blue: "from-blue-500 to-blue-600",
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

// Assigned Room Card Component
function AssignedRoomCard({ room, index, onRemove }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-lg transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
            <Bed className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Room {room.roomNumber}
            </h3>
            <p className="text-sm text-slate-600">{room.wingName}</p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onRemove}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </motion.button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Type:</span>
          <span className="font-semibold text-slate-900 capitalize">
            {room.roomType}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Capacity:</span>
          <span className="font-semibold text-slate-900">{room.capacity}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Status:</span>
          <span
            className={`px-2 py-0.5 rounded text-xs font-semibold ${
              room.status === "available"
                ? "bg-green-100 text-green-700"
                : room.status === "occupied"
                ? "bg-blue-100 text-blue-700"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {room.status}
          </span>
        </div>
      </div>

      <div className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100">
        Assigned {new Date(room.assignedAt).toLocaleDateString()}
      </div>
    </motion.div>
  );
}

// Assign Rooms Modal Component
function AssignRoomsModal({
  availableRooms,
  allAvailableRooms,
  selectedRooms,
  wings,
  searchQuery,
  setSearchQuery,
  filterWing,
  setFilterWing,
  filterRoomType,
  setFilterRoomType,
  onToggleRoom,
  onSelectAll,
  onDeselectAll,
  onAssign,
  onClose,
  loading,
}) {
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Assign Rooms</h2>
            <p className="text-white/80 text-sm mt-1">
              {selectedRooms.length} room(s) selected
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search rooms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-12 pr-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Wing Filter */}
            <div className="relative">
              <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              <select
                value={filterWing}
                onChange={(e) => setFilterWing(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-12 pr-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none cursor-pointer"
              >
                <option value="all">All Wings</option>
                {wings.map((wing) => (
                  <option key={wing.id} value={wing.id}>
                    {wing.wingName}
                  </option>
                ))}
              </select>
            </div>

            {/* Room Type Filter */}
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              <select
                value={filterRoomType}
                onChange={(e) => setFilterRoomType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-12 pr-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none cursor-pointer"
              >
                <option value="all">All Types</option>
                <option value="general">General</option>
                <option value="private">Private</option>
                <option value="icu">ICU</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
          </div>

          {/* Bulk Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onSelectAll}
              className="text-sm text-green-600 hover:text-green-700 font-semibold"
            >
              Select All ({availableRooms.length})
            </button>
            <span className="text-slate-400">•</span>
            <button
              onClick={onDeselectAll}
              className="text-sm text-slate-600 hover:text-slate-700 font-semibold"
            >
              Deselect All
            </button>
          </div>
        </div>

        {/* Rooms List */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-300px)]">
          {availableRooms.length === 0 ? (
            <div className="text-center py-12">
              <Bed className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                No Available Rooms
              </h3>
              <p className="text-slate-500">
                {allAvailableRooms.length === 0
                  ? "All rooms are already assigned to this section"
                  : "Try adjusting your filters"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableRooms.map((room) => (
                <RoomSelectionCard
                  key={room.roomId}
                  room={room}
                  isSelected={selectedRooms.includes(room.roomId)}
                  onToggle={() => onToggleRoom(room.roomId)}
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
            disabled={loading || selectedRooms.length === 0}
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
                Assign {selectedRooms.length} Room(s)
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Room Selection Card Component
function RoomSelectionCard({ room, isSelected, onToggle }) {
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
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isSelected
                ? "bg-green-500"
                : "bg-gradient-to-br from-slate-400 to-slate-500"
            }`}
          >
            <Bed className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900">Room {room.roomNumber}</h4>
            <p className="text-xs text-slate-600">{room.wingName}</p>
          </div>
        </div>
        {isSelected && (
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
        )}
      </div>

      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-600">Type:</span>
          <span className="font-semibold capitalize">{room.roomType}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">Capacity:</span>
          <span className="font-semibold">{room.capacity}</span>
        </div>
      </div>
    </motion.div>
  );
}