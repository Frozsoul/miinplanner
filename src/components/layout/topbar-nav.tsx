
import {
  LayoutDashboard,
  ListChecks,
  CalendarDays,
  Bell,
  BotMessageSquare,
  Wand2, // Added for AI Prioritization
} from "lucide-react";

export const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/tasks", icon: ListChecks, label: "Task Manager" },
  { href: "/prioritization", icon: Wand2, label: "AI Prioritization" }, // New navigation item
  { href: "/calendar", icon: CalendarDays, label: "Content Calendar" },
  { href: "/reminders", icon: Bell, label: "Reminders" },
  { href: "/chatbot", icon: BotMessageSquare, label: "AI Chatbot" },
];
