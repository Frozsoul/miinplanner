
import {
  LayoutDashboard,
  ListChecks,
  CalendarDays,
  BotMessageSquare,
  Lightbulb,
  FileText,
} from "lucide-react";

export const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/tasks", icon: ListChecks, label: "Task Manager" },
  { href: "/insights", icon: Lightbulb, label: "AI Insights" },
  { href: "/content", icon: FileText, label: "Content Studio" },
  { href: "/calendar", icon: CalendarDays, label: "Content Calendar" },
  { href: "/chatbot", icon: BotMessageSquare, label: "AI Chatbot" },
];
