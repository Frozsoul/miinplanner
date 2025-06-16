
"use client";

import { PrioritizationTool } from "@/components/tasks/prioritization-tool";
import { AppDataProvider } from "@/contexts/app-data-context";

export default function AIPrioritizationPage() {
  return (
    <AppDataProvider>
      <div className="container mx-auto py-8">
        {/* <h1 className="text-3xl font-headline font-bold mb-8">AI Task Prioritization</h1> */}
        <PrioritizationTool />
      </div>
    </AppDataProvider>
  );
}
