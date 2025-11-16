// FILE: app/admin/layout.jsx
"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Building,
  Clock,
  Hospital,
  LayoutDashboard,
  LogOut,
  Menu,
  Shield,
  UserCog,
  Users,
  X,
  Stethoscope,
  UserPlus,
  Bed,
  ClipboardList,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();

      if (data.success) {
        setUser(data.user);
        if (data.user.hospitalId) {
          fetchHospitalData(data.user.hospitalId);
        }
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHospitalData = async (hospitalId) => {
    try {
      const res = await fetch(`/api/admin/hospital`);
      const data = await res.json();

      if (data.success) {
        setHospital(data.hospital);
      }
    } catch (error) {
      console.error("Error fetching hospital:", error);
    }
  };

  const navigation = [
    {
      name: "Dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
      description: "Overview & statistics",
      color: "blue",
    },
    {
      name: "Wings & Rooms",
      href: "/admin/wings",
      icon: Building,
      description: "Manage hospital wings",
      color: "indigo",
    },
    {
      name: "Nursing Sections",
      href: "/admin/nursing-sections",
      icon: Stethoscope,
      description: "Organize nursing staff",
      color: "green",
    },
    {
      name: "Patients",
      href: "/admin/patients",
      icon: Users,
      description: "Patient management",
      color: "purple",
    },
    {
      name: "Staff",
      href: "/admin/staff",
      icon: UserCog,
      description: "Nurses & security",
      color: "cyan",
    },
    {
      name: "Nurse Assignments",
      href: "/admin/nurse-assignments",
      icon: UserPlus,
      description: "Assign nurses to patients",
      color: "emerald",
    },
    // {
    //   name: "Guests",
    //   href: "/admin/guests",
    //   icon: Shield,
    //   description: "Guest management",
    //   color: "amber",
    // },
  ];

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
      toast.success("Logged out successfully");
      router.push("/login");
    } catch (error) {
      toast.error("Error logging out");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-80 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 shadow-xl`}
      >
        <div className="flex flex-col h-full">
          {/* Logo & Hospital Info */}
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                  <Hospital className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  HealWay
                </h1>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {hospital && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Hospital className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 truncate text-sm">
                      {hospital.name}
                    </h3>
                    <p className="text-xs text-slate-600 truncate">
                      {hospital.district}, {hospital.state}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 mb-3">
              Main Menu
            </div>
            {navigation.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              
              const colorClasses = {
                blue: "from-blue-600 to-blue-700",
                indigo: "from-indigo-600 to-indigo-700",
                green: "from-green-600 to-green-700",
                purple: "from-purple-600 to-purple-700",
                cyan: "from-cyan-600 to-cyan-700",
                emerald: "from-emerald-600 to-emerald-700",
                amber: "from-amber-600 to-amber-700",
              };

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`group relative flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${
                    isActive
                      ? `bg-gradient-to-r ${colorClasses[item.color]} text-white shadow-lg shadow-${item.color}-500/30`
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute inset-0 rounded-xl bg-gradient-to-r opacity-10"
                      initial={false}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}

                  <div className="relative z-10 flex items-center gap-3 w-full">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                        isActive
                          ? "bg-white/20"
                          : "bg-slate-100 group-hover:bg-slate-200"
                      }`}
                    >
                      <item.icon
                        className={`w-5 h-5 ${
                          isActive
                            ? "text-white"
                            : "text-slate-500 group-hover:text-slate-700"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`font-semibold text-sm ${
                          isActive ? "text-white" : "text-slate-900"
                        }`}
                      >
                        {item.name}
                      </div>
                      <div
                        className={`text-xs truncate ${
                          isActive
                            ? "text-white/80"
                            : "text-slate-500 group-hover:text-slate-600"
                        }`}
                      >
                        {item.description}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* User Profile & Logout */}
          <div className="p-4 border-t border-slate-200 space-y-3">
            {user && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-900 truncate text-sm">
                      {user.name}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {user.email}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Role:</span>
                  <span className="font-semibold text-slate-900 capitalize">
                    {user.role === "admin" ? "Administrator" : "Sub Admin"}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all font-semibold border-2 border-red-100 hover:border-red-200"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-40 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all hover:scale-110"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Overlay for mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="lg:pl-80 min-h-screen">{children}</main>
    </div>
  );
}
