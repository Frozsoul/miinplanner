
"use client";

import { PrioritizationTool } from "@/components/tasks/prioritization-tool";
import { AppDataProvider } from "@/contexts/app-data-context"; // Ensure this is not doubly wrapped if layout already has it

export default function AIPrioritizationPage() {
  return (
    // If AppDataProvider is already in layout.tsx, this might not be needed here
    // However, for isolated page functionality or testing, it can be kept.
    // For now, let's assume layout handles the main provider.
    <div className="px-4 sm:px-6 md:py-6">
      <PrioritizationTool />
    </div>
  );
}
