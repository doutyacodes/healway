// FILE: lib/config/navigation.js
export const adminNavigation = [
  { 
    name: "Dashboard", 
    href: "/admin/dashboard", 
    icon: "LayoutDashboard",
    description: "Overview & statistics"
  },
  { 
    name: "Wings & Rooms", 
    href: "/admin/wings", 
    icon: "Building",
    description: "Manage hospital wings"
  },
  { 
    name: "Patients", 
    href: "/admin/patients", 
    icon: "Users",
    description: "Patient management"
  },
  { 
    name: "Staff", 
    href: "/admin/staff", 
    icon: "UserCog",
    description: "Nurses & security"
  },
  { 
    name: "Nursing Sections", 
    href: "/admin/nursing-sections", 
    icon: "Stethoscope",
    description: "Organize nursing staff"
  },
  { 
    name: "Visiting Hours", 
    href: "/admin/visiting-hours", 
    icon: "Clock",
    description: "Configure visit times"
  },
  { 
    name: "Guests", 
    href: "/admin/guests", 
    icon: "Shield",
    description: "Guest management"
  },
];