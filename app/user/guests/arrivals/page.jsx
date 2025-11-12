// FILE: app/user/guests/arrivals/page.jsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  UserCheck,
  Clock,
  Calendar,
  Loader2,
  Search,
  Filter,
  ChevronLeft,
  Phone,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  MapPin,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import Link from "next/link";

export default function GuestArrivalsPage() {
  const [arrivals, setArrivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    fetchArrivals();
  }, []);

  const fetchArrivals = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/user/guests/arrivals");
      const data = await res.json();

      if (data.success) {
        setArrivals(data.arrivals);
      } else {
        toast.error("Failed to load arrivals");
      }
    } catch (error) {
      toast.error("Error loading arrivals");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredArrivals = arrivals.filter((arrival) => {
    const matchesSearch = arrival.guestName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === "all" || arrival.verificationStatus === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: arrivals.length,
    checkedIn: arrivals.filter((a) => a.verificationStatus === "approved")
      .length,
    pending: arrivals.filter((a) => a.verificationStatus === "pending").length,
    rejected: arrivals.filter((a) => a.verificationStatus === "rejected")
      .length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
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
          <Link
            href="/user/guests"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 font-medium"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Guest Passes
          </Link>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Guest Arrivals
          </h1>
          <p className="text-slate-600">
            Track your visitors who have checked in
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-slate-200"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Visits</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-slate-200"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Checked In</p>
                <p className="text-2xl font-bold text-slate-900">
                  {stats.checkedIn}
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
              <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Pending</p>
                <p className="text-2xl font-bold text-slate-900">
                  {stats.pending}
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
              <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Rejected</p>
                <p className="text-2xl font-bold text-slate-900">
                  {stats.rejected}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search guests..."
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
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Arrivals List */}
        {filteredArrivals.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-200"
          >
            <UserCheck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">
              No arrivals yet
            </h3>
            <p className="text-slate-500">
              {searchQuery || filterStatus !== "all"
                ? "Try adjusting your filters"
                : "Guest arrivals will appear here when visitors check in"}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filteredArrivals.map((arrival, index) => (
              <ArrivalCard key={arrival.id} arrival={arrival} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Arrival Card Component
function ArrivalCard({ arrival, index }) {
  const getStatusConfig = (status) => {
    switch (status) {
      case "approved":
        return {
          color: "green",
          icon: CheckCircle,
          label: "Checked In",
          bgColor: "bg-green-50",
          textColor: "text-green-700",
          borderColor: "border-green-200",
        };
      case "pending":
        return {
          color: "orange",
          icon: AlertCircle,
          label: "Pending",
          bgColor: "bg-orange-50",
          textColor: "text-orange-700",
          borderColor: "border-orange-200",
        };
      case "rejected":
        return {
          color: "red",
          icon: XCircle,
          label: "Rejected",
          bgColor: "bg-red-50",
          textColor: "text-red-700",
          borderColor: "border-red-200",
        };
      default:
        return {
          color: "slate",
          icon: AlertCircle,
          label: "Unknown",
          bgColor: "bg-slate-50",
          textColor: "text-slate-700",
          borderColor: "border-slate-200",
        };
    }
  };

  const config = getStatusConfig(arrival.verificationStatus);
  const StatusIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`bg-white rounded-xl p-6 shadow-sm border-2 ${config.borderColor} hover:shadow-lg transition-all`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Guest Info */}
        <div className="flex items-start gap-4 flex-1">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
            {arrival.guestName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {arrival.guestName}
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Phone className="w-4 h-4" />
                <span>{arrival.guestMobile}</span>
              </div>
              {arrival.relationship && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <User className="w-4 h-4" />
                  <span>{arrival.relationship}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar className="w-4 h-4" />
                <span>
                  {new Date(arrival.checkInTime).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Clock className="w-4 h-4" />
                <span>
                  Check-in:{" "}
                  {new Date(arrival.checkInTime).toLocaleTimeString()}
                </span>
              </div>
              {arrival.checkOutTime && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Clock className="w-4 h-4" />
                  <span>
                    Check-out:{" "}
                    {new Date(arrival.checkOutTime).toLocaleTimeString()}
                  </span>
                </div>
              )}
              {arrival.verifiedBy && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin className="w-4 h-4" />
                  <span>Verified by: {arrival.verifiedBy}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div
          className={`px-4 py-2 rounded-full flex items-center gap-2 ${config.bgColor} ${config.textColor} border ${config.borderColor}`}
        >
          <StatusIcon className="w-5 h-5" />
          <span className="font-semibold">{config.label}</span>
        </div>
      </div>

      {/* Additional Info */}
      {arrival.notes && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <p className="text-sm text-slate-600">
            <span className="font-semibold">Notes:</span> {arrival.notes}
          </p>
        </div>
      )}
    </motion.div>
  );
}