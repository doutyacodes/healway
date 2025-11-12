// FILE: app/user/dashboard/page.jsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User,
  Building,
  Bed,
  Calendar,
  Clock,
  Users,
  Shield,
  Plus,
  Activity,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function UserDashboard() {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const res = await fetch("/api/user/profile");
      const data = await res.json();

      if (data.success) {
        setUser(data.user);
        setSession(data.session);
      } else {
        toast.error("Failed to load profile");
      }
    } catch (error) {
      toast.error("Error loading profile");
      console.error(error);
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-slate-600">
            {session
              ? "Your current hospital session"
              : "You don't have an active session"}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile & Session */}
          <div className="lg:col-span-2 space-y-6">
            {/* Session Card */}
            {session ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">
                    Current Session
                  </h2>
                  <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Active
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Location */}
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Building className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Wing</p>
                        <p className="text-lg font-semibold text-slate-900">
                          {session.wingName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <Bed className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Room</p>
                        <p className="text-lg font-semibold text-slate-900">
                          {session.roomNumber}
                        </p>
                        <p className="text-xs text-slate-500 capitalize">
                          {session.roomType}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Admitted</p>
                        <p className="text-lg font-semibold text-slate-900">
                          {new Date(session.startDate).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(session.startDate).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Duration</p>
                        <p className="text-lg font-semibold text-slate-900">
                          {Math.floor(
                            (new Date() - new Date(session.startDate)) /
                              (1000 * 60 * 60 * 24)
                          )}{" "}
                          days
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Admission Type */}
                {session.admissionType && (
                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <p className="text-sm text-slate-500 mb-2">
                      Admission Type
                    </p>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold capitalize">
                      {session.admissionType}
                    </span>
                  </div>
                )}

                {/* Notes */}
                {session.notes && (
                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <p className="text-sm text-slate-500 mb-2">Notes</p>
                    <p className="text-slate-700">{session.notes}</p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  No Active Session
                </h3>
                <p className="text-slate-600">
                  You don't have an active hospital session at the moment.
                </p>
              </motion.div>
            )}

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6"
            >
              <h2 className="text-xl font-bold text-slate-900 mb-4">
                Quick Actions
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={!session}
                  className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-xl border border-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-slate-900">
                      Create Guest Pass
                    </p>
                    <p className="text-xs text-slate-600">
                      Add a visitor pass
                    </p>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={!session}
                  className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 rounded-xl border border-purple-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-slate-900">
                      View Guest Passes
                    </p>
                    <p className="text-xs text-slate-600">Manage visitors</p>
                  </div>
                </motion.button>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Profile Info */}
          <div className="space-y-6">
            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6"
            >
              <div className="text-center mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mx-auto mb-4">
                  <User className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  {user?.name}
                </h3>
                <span
                  className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                    user?.role === "patient"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-purple-100 text-purple-700"
                  }`}
                >
                  {user?.role === "patient" ? "Patient" : "Bystander"}
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <Phone className="w-5 h-5 text-slate-500" />
                  <div>
                    <p className="text-xs text-slate-500">Mobile</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {user?.mobileNumber}
                    </p>
                  </div>
                </div>

                {user?.email && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Mail className="w-5 h-5 text-slate-500" />
                    <div>
                      <p className="text-xs text-slate-500">Email</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {user.email}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <CheckCircle
                    className={`w-5 h-5 ${
                      user?.isActive ? "text-green-500" : "text-red-500"
                    }`}
                  />
                  <div>
                    <p className="text-xs text-slate-500">Account Status</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {user?.isActive ? "Active" : "Inactive"}
                    </p>
                  </div>
                </div>
              </div>

              <button className="w-full mt-6 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-semibold transition-colors">
                Edit Profile
              </button>
            </motion.div>

            {/* Help Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg p-6 text-white"
            >
              <Shield className="w-10 h-10 mb-4" />
              <h3 className="text-lg font-bold mb-2">Need Help?</h3>
              <p className="text-sm text-blue-100 mb-4">
                Contact our support team for any assistance
              </p>
              <button className="w-full bg-white text-blue-600 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
                Contact Support
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}