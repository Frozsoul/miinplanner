
// This is the new home for navItems, effectively renaming sidebar-nav.tsx's core data export.

import {
  LayoutDashboard,
  ListChecks,
  CalendarDays,
  Bell,
  BotMessageSquare,
} from "lucide-react";

export const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/tasks", icon: ListChecks, label: "Task Manager" },
  { href: "/calendar", icon: CalendarDays, label: "Content Calendar" },
  { href: "/reminders", icon: Bell, label: "Reminders" },
  { href: "/chatbot", icon: BotMessageSquare, label: "AI Chatbot" },
];

// The old SidebarUser component's functionality is now directly in `src/app/(app)/layout.tsx`
// as part of the DropdownMenu. If needed, a dedicated UserMenu component could be created here.
