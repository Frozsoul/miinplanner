
"use client";

// Renaming this file to topbar-nav.tsx would be more semantically correct,
// but for now, we'll just modify it to export navItems and potentially UserMenu if separated.
// The SidebarNav and SidebarUser components as originally structured for a sidebar are no longer used by the layout.

import Link from "next/link";
import {
  LayoutDashboard,
  ListChecks,
  CalendarDays,
  Bell,
  BotMessageSquare,
  Settings,
} from "lucide-react";
import { SidebarMenuButton } from "@/components/ui/sidebar"; // This import is no longer strictly needed here, but kept if SidebarUser was more complex

export const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/tasks", icon: ListChecks, label: "Task Manager" },
  { href: "/calendar", icon: CalendarDays, label: "Content Calendar" },
  { href: "/reminders", icon: Bell, label: "Reminders" },
  { href: "/chatbot", icon: BotMessageSquare, label: "AI Chatbot" },
];

// SidebarNav is no longer used by the main layout.
// export function SidebarNav() { ... } 

// SidebarUser's content is now integrated into the DropdownMenu in AppLayout.
// If it were more complex, it could be a separate UserDropdown component.
export function SidebarUser() {
  // const { state: sidebarState } = useSidebar(); // useSidebar no longer relevant
  return (
    <div className="mt-auto">
       <Link href="#">
        {/* This button styling is sidebar-specific, not used directly in topbar */}
        <SidebarMenuButton tooltip="Settings" className="justify-start">
          <Settings className="h-5 w-5" />
          {/* {sidebarState === "expanded" && <span>Settings</span>} */}
          <span>Settings</span>
        </SidebarMenuButton>
      </Link>
    </div>
  )
}
