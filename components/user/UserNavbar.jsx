"use client"
// FILE: components/user/UserNavbar.jsx (create if not exists)
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, UserCheck, User as UserIcon, LogOut } from "lucide-react";

export default function UserNavbar() {
  const pathname = usePathname();

  const navigation = [
    { name: "Dashboard", href: "/user/dashboard", icon: UserIcon },
    { name: "Guest Passes", href: "/user/guests", icon: Users },
    { name: "Arrivals", href: "/user/guests/arrivals", icon: UserCheck },
  ];

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/user/dashboard" className="font-bold text-xl text-blue-600">
            HealWay
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-6">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-600 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            {/* Logout */}
            <button className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors">
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}