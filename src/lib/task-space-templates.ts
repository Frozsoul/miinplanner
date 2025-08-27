
import type { TaskSpace, TaskData, TaskStatus } from "@/types";

interface TaskSpaceTemplate extends Omit<TaskSpace, 'id' | 'createdAt'> {
  description: string;
}

export const taskSpaceTemplates: TaskSpaceTemplate[] = [
  {
    name: "Learn a New Skill",
    description: "A structured plan to help you learn a new skill, from initial research to building your first project.",
    taskStatuses: ['Backlog', 'Learning', 'Practicing', 'Project', 'Completed'],
    tasks: [
      { title: "Research: Identify top 5 learning resources (courses, books)", status: "Backlog", priority: "High", order: 0 },
      { title: "Setup: Install necessary software and tools", status: "Backlog", priority: "High", order: 1 },
      { title: "Module 1: Complete the basics", status: "Backlog", priority: "Medium", order: 2 },
      { title: "Practice: Code-along with tutorials", status: "Backlog", priority: "Medium", order: 3 },
      { title: "Project 1: Build a simple 'Hello World' style application", status: "Backlog", priority: "High", order: 4 },
      { title: "Module 2: Advanced concepts", status: "Backlog", priority: "Medium", order: 5 },
      { title: "Project 2: Build a multi-feature application", status: "Backlog", priority: "High", order: 6 },
      { title: "Review and Refactor Project 2", status: "Backlog", priority: "Low", order: 7 },
    ],
  },
  {
    name: "30-Day Savings Challenge",
    description: "A 30-day plan to help you kickstart your savings habits and cut unnecessary expenses.",
    taskStatuses: ['To Plan', 'In Progress', 'Done', 'Recurring'],
    tasks: [
      { title: "Day 1: Create a detailed monthly budget", status: "To Plan", priority: "Urgent", order: 0 },
      { title: "Day 2: Review and cancel unused subscriptions", status: "To Plan", priority: "High", order: 1 },
      { title: "Day 3: Set up an automatic weekly transfer to savings", status: "To Plan", priority: "High", order: 2 },
      { title: "Weekly: Cook all meals at home (no eating out)", status: "To Plan", priority: "Medium", tags: ["weekly"], order: 3 },
      { title: "Weekly: Review spending against budget", status: "To Plan", priority: "Medium", tags: ["weekly"], order: 4 },
      { title: "Day 15: Mid-month budget check-in", status: "To Plan", priority: "Medium", order: 5 },
      { title: "Day 30: Final review and plan for next month", status: "To Plan", priority: "High", order: 6 },
      { title: "No-spend challenge (5 consecutive days)", status: "To Plan", priority: "Low", order: 7 },
    ],
  },
  {
    name: "Write a Book",
    description: "A complete workflow for authors, from the initial idea to the final edited manuscript.",
    taskStatuses: ['Idea', 'Outline', 'First Draft', 'Editing', 'Final Review'],
    tasks: [
      { title: "Develop core concept and premise", status: "Idea", priority: "High", order: 0 },
      { title: "Create main character profiles", status: "Idea", priority: "Medium", order: 1 },
      { title: "Write a 3-act story structure outline", status: "Outline", priority: "High", order: 2 },
      { title: "Detailed chapter-by-chapter outline", status: "Outline", priority: "Medium", order: 3 },
      { title: "Write Chapter 1", status: "First Draft", priority: "High", order: 4 },
      { title: "Complete First Draft (Act 1)", status: "First Draft", priority: "Medium", order: 5 },
      { title: "Complete First Draft (Act 2)", status: "First Draft", priority: "Medium", order: 6 },
      { title: "Complete First Draft (Act 3)", status: "First Draft", priority: "Medium", order: 7 },
      { title: "Self-edit for plot and character consistency", status: "Editing", priority: "High", order: 8 },
      { title: "Send manuscript to beta readers", status: "Editing", priority: "Medium", order: 9 },
      { title: "Incorporate beta reader feedback", status: "Editing", priority: "High", order: 10 },
      { title: "Line-by-line proofread", status: "Final Review", priority: "High", order: 11 },
    ],
  },
];
