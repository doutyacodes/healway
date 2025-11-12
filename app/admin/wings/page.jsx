// FILE: app/admin/wings/page.jsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building,
  Plus,
  Edit2,
  Trash2,
  Search,
  Loader2,
  X,
  Save,
  Bed,
  ChevronDown,
  ChevronUp,
  Grid,
  List,
  Filter,
  AlertCircle,
  CheckCircle,
  Wrench,
  Lock,
  Info,
  PlusCircle,
  Users,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function WingsPage() {
  const [wings, setWings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedWing, setExpandedWing] = useState(null);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showBulkRoomModal, setShowBulkRoomModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedWing, setSelectedWing] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");

  // Single Room Form Data
  const [roomFormData, setRoomFormData] = useState({
    wingId: "",
    roomNumber: "",
    roomNumberInt: "",
    roomType: "general",
    capacity: "1",
    status: "available",
  });

  // Bulk Room Form Data
  const [bulkRoomData, setBulkRoomData] = useState({
    wingId: "",
    startNumber: "",
    endNumber: "",
    roomType: "general",
    capacity: "1",
    prefix: "",
  });

  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchWings();
  }, []);

  const fetchWings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/wings/with-rooms");
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

  const handleOpenRoomModal = (mode, wing, room = null) => {
    setModalMode(mode);
    setSelectedWing(wing);
    
    if (mode === "edit" && room) {
      setSelectedRoom(room);
      setRoomFormData({
        wingId: room.wingId.toString(),
        roomNumber: room.roomNumber || "",
        roomNumberInt: room.roomNumberInt?.toString() || "",
        roomType: room.roomType || "general",
        capacity: room.capacity?.toString() || "1",
        status: room.status || "available",
      });
    } else {
      setSelectedRoom(null);
      setRoomFormData({
        wingId: wing.id.toString(),
        roomNumber: "",
        roomNumberInt: "",
        roomType: "general",
        capacity: "1",
        status: "available",
      });
    }
    setShowRoomModal(true);
  };

  const handleOpenBulkRoomModal = (wing) => {
    setSelectedWing(wing);
    setBulkRoomData({
      wingId: wing.id.toString(),
      startNumber: "",
      endNumber: "",
      roomType: "general",
      capacity: "1",
      prefix: "",
    });
    setShowBulkRoomModal(true);
  };

  const handleCloseRoomModal = () => {
    setShowRoomModal(false);
    setSelectedRoom(null);
    setSelectedWing(null);
    setRoomFormData({
      wingId: "",
      roomNumber: "",
      roomNumberInt: "",
      roomType: "general",
      capacity: "1",
      status: "available",
    });
  };

  const handleCloseBulkRoomModal = () => {
    setShowBulkRoomModal(false);
    setSelectedWing(null);
    setBulkRoomData({
      wingId: "",
      startNumber: "",
      endNumber: "",
      roomType: "general",
      capacity: "1",
      prefix: "",
    });
  };

  const handleSubmitRoom = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const url =
        modalMode === "create"
          ? "/api/admin/rooms"
          : `/api/admin/rooms/${selectedRoom.id}`;

      const method = modalMode === "create" ? "POST" : "PUT";

      const payload = {
        ...roomFormData,
        wingId: parseInt(roomFormData.wingId),
        roomNumberInt: roomFormData.roomNumberInt ? parseInt(roomFormData.roomNumberInt) : null,
        capacity: parseInt(roomFormData.capacity),
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
            ? "Room created successfully!"
            : "Room updated successfully!"
        );
        fetchWings();
        handleCloseRoomModal();
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

  const handleSubmitBulkRooms = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const startNum = parseInt(bulkRoomData.startNumber);
      const endNum = parseInt(bulkRoomData.endNumber);

      if (startNum >= endNum) {
        toast.error("End number must be greater than start number");
        setFormLoading(false);
        return;
      }

      if (endNum - startNum > 100) {
        toast.error("Cannot create more than 100 rooms at once");
        setFormLoading(false);
        return;
      }

      const res = await fetch("/api/admin/rooms/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wingId: parseInt(bulkRoomData.wingId),
          startNumber: startNum,
          endNumber: endNum,
          roomType: bulkRoomData.roomType,
          capacity: parseInt(bulkRoomData.capacity),
          prefix: bulkRoomData.prefix,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(`${data.count} rooms created successfully!`);
        fetchWings();
        handleCloseBulkRoomModal();
      } else {
        toast.error(data.error || "Failed to create rooms");
      }
    } catch (error) {
      toast.error("Something went wrong");
      console.error(error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!confirm("Are you sure you want to delete this room?")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/rooms/${roomId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Room deleted successfully!");
        fetchWings();
      } else {
        toast.error(data.error || "Failed to delete room");
      }
    } catch (error) {
      toast.error("Error deleting room");
      console.error(error);
    }
  };

  const toggleWingExpansion = (wingId) => {
    setExpandedWing(expandedWing === wingId ? null : wingId);
  };

  const filteredWings = wings.filter((wing) => {
    const matchesSearch =
      wing.wingName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wing.wingCode?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  const getFilteredRooms = (rooms) => {
    return rooms.filter((room) => {
      const matchesStatus =
        filterStatus === "all" || room.status === filterStatus;
      const matchesType = filterType === "all" || room.roomType === filterType;
      const matchesSearch =
        room.roomNumber.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesStatus && matchesType && matchesSearch;
    });
  };

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
              Wings & Rooms
            </h1>
            <p className="text-slate-600">
              Manage hospital wings and room assignments
            </p>
          </div>
        </motion.div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search wings or rooms..."
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
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="maintenance">Maintenance</option>
                <option value="reserved">Reserved</option>
              </select>
            </div>

            {/* Filter by Type */}
            <div className="relative">
              <Bed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-12 pr-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
              >
                <option value="all">All Types</option>
                <option value="general">General</option>
                <option value="private">Private</option>
                <option value="icu">ICU</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Wings List */}
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
              Go to Dashboard to create wings first
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filteredWings.map((wing, index) => {
              const filteredRooms = getFilteredRooms(wing.rooms || []);
              const isExpanded = expandedWing === wing.id;

              return (
                <WingCard
                  key={wing.id}
                  wing={wing}
                  rooms={filteredRooms}
                  index={index}
                  isExpanded={isExpanded}
                  onToggleExpand={() => toggleWingExpansion(wing.id)}
                  onAddRoom={() => handleOpenRoomModal("create", wing)}
                  onAddBulkRooms={() => handleOpenBulkRoomModal(wing)}
                  onEditRoom={(room) => handleOpenRoomModal("edit", wing, room)}
                  onDeleteRoom={handleDeleteRoom}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Single Room Modal */}
      <AnimatePresence>
        {showRoomModal && (
          <RoomModal
            mode={modalMode}
            formData={roomFormData}
            setFormData={setRoomFormData}
            wing={selectedWing}
            onSubmit={handleSubmitRoom}
            onClose={handleCloseRoomModal}
            loading={formLoading}
          />
        )}
      </AnimatePresence>

      {/* Bulk Room Modal */}
      <AnimatePresence>
        {showBulkRoomModal && (
          <BulkRoomModal
            formData={bulkRoomData}
            setFormData={setBulkRoomData}
            wing={selectedWing}
            onSubmit={handleSubmitBulkRooms}
            onClose={handleCloseBulkRoomModal}
            loading={formLoading}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Wing Card Component
function WingCard({
  wing,
  rooms,
  index,
  isExpanded,
  onToggleExpand,
  onAddRoom,
  onAddBulkRooms,
  onEditRoom,
  onDeleteRoom,
}) {
  const stats = {
    total: rooms.length,
    available: rooms.filter((r) => r.status === "available").length,
    occupied: rooms.filter((r) => r.status === "occupied").length,
    maintenance: rooms.filter((r) => r.status === "maintenance").length,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
    >
      {/* Wing Header */}
      <div
        className="p-6 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Building className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-slate-900">
                  {wing.wingName}
                </h3>
                {wing.wingCode && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                    {wing.wingCode}
                  </span>
                )}
                {wing.floorNumber !== null && (
                  <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded">
                    Floor {wing.floorNumber}
                  </span>
                )}
              </div>
              {wing.description && (
                <p className="text-sm text-slate-600 mt-1">
                  {wing.description}
                </p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 mr-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">
                {stats.total}
              </div>
              <div className="text-xs text-slate-600">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.available}
              </div>
              <div className="text-xs text-slate-600">Available</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {stats.occupied}
              </div>
              <div className="text-xs text-slate-600">Occupied</div>
            </div>
          </div>

          {/* Expand Icon */}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-6 h-6 text-slate-400" />
          </motion.div>
        </div>
      </div>

      {/* Rooms Grid */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-slate-200"
          >
            <div className="p-6 bg-slate-50">
              {/* Action Buttons */}
              <div className="flex gap-3 mb-6">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddRoom();
                  }}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Single Room
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddBulkRooms();
                  }}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  Add Multiple Rooms
                </button>
              </div>

              {/* Rooms Grid */}
              {rooms.length === 0 ? (
                <div className="text-center py-12">
                  <Bed className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600">No rooms in this wing</p>
                  <p className="text-sm text-slate-500">
                    Add rooms to get started
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {rooms.map((room) => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      onEdit={() => onEditRoom(room)}
                      onDelete={() => onDeleteRoom(room.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Room Card Component
function RoomCard({ room, onEdit, onDelete }) {
  const statusConfig = {
    available: {
      color: "green",
      icon: CheckCircle,
      label: "Available",
      bgColor: "bg-green-50",
      textColor: "text-green-700",
      borderColor: "border-green-200",
    },
    occupied: {
      color: "red",
      icon: Lock,
      label: "Occupied",
      bgColor: "bg-red-50",
      textColor: "text-red-700",
      borderColor: "border-red-200",
    },
    maintenance: {
      color: "orange",
      icon: Wrench,
      label: "Maintenance",
      bgColor: "bg-orange-50",
      textColor: "text-orange-700",
      borderColor: "border-orange-200",
    },
    reserved: {
      color: "blue",
      icon: AlertCircle,
      label: "Reserved",
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
      borderColor: "border-blue-200",
    },
  };

  const typeConfig = {
    general: { label: "General", color: "bg-slate-100 text-slate-700" },
    private: { label: "Private", color: "bg-purple-100 text-purple-700" },
    icu: { label: "ICU", color: "bg-red-100 text-red-700" },
    emergency: { label: "Emergency", color: "bg-orange-100 text-orange-700" },
  };

  const config = statusConfig[room.status] || statusConfig.available;
  const StatusIcon = config.icon;
  const typeInfo = typeConfig[room.roomType] || typeConfig.general;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={`${config.bgColor} border-2 ${config.borderColor} rounded-xl p-4 transition-all`}
    >
      {/* Room Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bed className={`w-5 h-5 ${config.textColor}`} />
          <span className="font-bold text-slate-900 text-lg">
            {room.roomNumber}
          </span>
        </div>
        <span
          className={`px-2 py-1 rounded text-xs font-semibold ${typeInfo.color}`}
        >
          {typeInfo.label}
        </span>
      </div>

      {/* Status */}
      <div className={`flex items-center gap-2 mb-3 ${config.textColor}`}>
        <StatusIcon className="w-4 h-4" />
        <span className="text-sm font-semibold">{config.label}</span>
      </div>

      {/* Capacity */}
      <div className="flex items-center gap-2 text-slate-600 text-sm mb-4">
        <Users className="w-4 h-4" />
        <span>Capacity: {room.capacity}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-2 bg-white text-blue-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors border border-blue-200"
        >
          <Edit2 className="w-3 h-3" />
          Edit
        </button>
        <button
          onClick={onDelete}
          className="flex items-center justify-center gap-2 bg-white text-red-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors border border-red-200"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
}

// Single Room Modal Component
function RoomModal({ mode, formData, setFormData, wing, onSubmit, onClose, loading }) {
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
          <div>
            <h2 className="text-2xl font-bold text-white">
              {mode === "create" ? "Add Room" : "Edit Room"}
            </h2>
            <p className="text-blue-100 text-sm">{wing?.wingName}</p>
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
            {/* Room Number */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Room Number *
                </label>
                <input
                  type="text"
                  name="roomNumber"
                  value={formData.roomNumber}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 101, A-12"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Numeric Number
                  <span className="text-xs font-normal text-slate-500 ml-2">
                    (for sorting)
                  </span>
                </label>
                <input
                  type="number"
                  name="roomNumberInt"
                  value={formData.roomNumberInt}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 101"
                />
              </div>
            </div>

            {/* Room Type */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Room Type *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { value: "general", label: "General", color: "slate" },
                  { value: "private", label: "Private", color: "purple" },
                  { value: "icu", label: "ICU", color: "red" },
                  { value: "emergency", label: "Emergency", color: "orange" },
                ].map((type) => (
                  <label
                    key={type.value}
                    className={`flex items-center justify-center gap-2 p-3 border-2 rounded-xl cursor-pointer transition-all ${
                      formData.roomType === type.value
                        ? `border-${type.color}-500 bg-${type.color}-50`
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="roomType"
                      value={type.value}
                      checked={formData.roomType === type.value}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <span className="font-semibold text-slate-900 text-sm">
                      {type.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Capacity */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Capacity *
              </label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                min="1"
                max="10"
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Status *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { value: "available", label: "Available", color: "green" },
                  { value: "occupied", label: "Occupied", color: "red" },
                  { value: "maintenance", label: "Maintenance", color: "orange" },
                  { value: "reserved", label: "Reserved", color: "blue" },
                ].map((status) => (
                  <label
                    key={status.value}
                    className={`flex items-center justify-center gap-2 p-3 border-2 rounded-xl cursor-pointer transition-all ${
                      formData.status === status.value
                        ? `border-${status.color}-500 bg-${status.color}-50`
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="status"
                      value={status.value}
                      checked={formData.status === status.value}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <span className="font-semibold text-slate-900 text-sm">
                      {status.label}
                    </span>
                  </label>
                ))}
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
                  {mode === "create" ? "Create Room" : "Update Room"}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// Bulk Room Modal Component
function BulkRoomModal({ formData, setFormData, wing, onSubmit, onClose, loading }) {
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const getRoomCount = () => {
    const start = parseInt(formData.startNumber);
    const end = parseInt(formData.endNumber);
    if (start && end && end > start) {
      return end - start + 1;
    }
    return 0;
  };

  const getRoomPreview = () => {
    const start = parseInt(formData.startNumber);
    const end = parseInt(formData.endNumber);
    const prefix = formData.prefix;
    
    if (!start || !end || end <= start) return [];
    
    const count = Math.min(end - start + 1, 5);
    const preview = [];
    
    for (let i = 0; i < count; i++) {
      preview.push(`${prefix}${start + i}`);
    }
    
    if (end - start + 1 > 5) {
      preview.push("...");
      preview.push(`${prefix}${end}`);
    }
    
    return preview;
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
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Add Multiple Rooms
            </h2>
            <p className="text-indigo-100 text-sm">{wing?.wingName}</p>
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
            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-slate-700">
                  <p className="font-semibold mb-1">Bulk Room Creation</p>
                  <p>
                    Create multiple rooms at once with sequential numbering. All
                    rooms will have the same type, capacity, and status.
                  </p>
                </div>
              </div>
            </div>

            {/* Prefix */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Room Prefix (Optional)
              </label>
              <input
                type="text"
                name="prefix"
                value={formData.prefix}
                onChange={handleChange}
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., A-, B-, ICU-"
              />
            </div>

            {/* Number Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Start Number *
                </label>
                <input
                  type="number"
                  name="startNumber"
                  value={formData.startNumber}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., 101"
                  required
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  End Number *
                </label>
                <input
                  type="number"
                  name="endNumber"
                  value={formData.endNumber}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., 120"
                  required
                  min="1"
                />
              </div>
            </div>

            {/* Room Count Preview */}
            {getRoomCount() > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="font-semibold text-green-900 mb-2">
                  Will create {getRoomCount()} rooms
                </div>
                <div className="flex flex-wrap gap-2">
                  {getRoomPreview().map((room, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-white border border-green-300 rounded-lg text-sm font-medium text-slate-700"
                    >
                      {room}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Room Type */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Room Type *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { value: "general", label: "General" },
                  { value: "private", label: "Private" },
                  { value: "icu", label: "ICU" },
                  { value: "emergency", label: "Emergency" },
                ].map((type) => (
                  <label
                    key={type.value}
                    className={`flex items-center justify-center gap-2 p-3 border-2 rounded-xl cursor-pointer transition-all ${
                      formData.roomType === type.value
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="roomType"
                      value={type.value}
                      checked={formData.roomType === type.value}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <span className="font-semibold text-slate-900 text-sm">
                      {type.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Capacity */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Capacity (for all rooms) *
              </label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                min="1"
                max="10"
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
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
              disabled={loading || getRoomCount() === 0}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating Rooms...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Create {getRoomCount()} Rooms
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}