import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { meetingsProcessing } from "@/inngest/functions";

console.log("=== INNGEST DEBUG INFO ===");
console.log("Environment Variables:");
console.log("- NODE_ENV:", process.env.NODE_ENV);
console.log("- Has INNGEST_EVENT_KEY:", !!process.env.INNGEST_EVENT_KEY);
console.log("- Has INNGEST_SIGNING_KEY:", !!process.env.INNGEST_SIGNING_KEY);
console.log("- Event Key (first 20 chars):", process.env.INNGEST_EVENT_KEY?.substring(0, 20) + "...");
console.log("- Signing Key (first 20 chars):", process.env.INNGEST_SIGNING_KEY?.substring(0, 20) + "...");

// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [meetingsProcessing],
  signingKey: process.env.INNGEST_SIGNING_KEY,
  // Add request logging for debugging
  logLevel: "debug",
});