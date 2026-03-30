"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * The standalone chatbot page has been deprecated in favor of an integrated 
 * chat experience on the AI Insights page.
 */
export default function ChatbotPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/insights");
  }, [router]);

  return null;
}
