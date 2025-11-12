// FILE: app/user/layout.jsx
import UserNavbar from "@/components/user/UserNavbar";

export default function UserLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <UserNavbar />
      {children}
    </div>
  );
}