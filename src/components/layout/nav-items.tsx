
import {
  LayoutDashboard,
  ListChecks,
  CalendarDays,
  BotMessageSquare,
  Wand2,
  FileText,
} from "lucide-react";

export const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/tasks", icon: ListChecks, label: "Task Manager" },
  { href: "/prioritization", icon: Wand2, label: "AI Prioritization" },
  { href: "/content", icon: FileText, label: "Content Studio" },
  { href: "/calendar", icon: CalendarDays, label: "Content Calendar" },
  { href: "/chatbot", icon: BotMessageSquare, label: "AI Chatbot" },
];
