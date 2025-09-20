import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { meetingsProcessing } from "@/inngest/functions";

console.log("=== INNGEST DEBUG INFO ===");
console.log("Environment Variables:");
console.log("- NODE_ENV:", process.env.NODE_ENV);
console.log("- Has INNGEST_EVENT_KEY:", !!process.env.INNGEST_EVENT_KEY);
console.log("- Has INNGEST_SIGNING_KEY:", !!process.env.INNGEST_SIGNING_KEY);

// For production on Brimble, completely omit the signingKey
const serveConfig = {
  client: inngest,
  functions: [meetingsProcessing],
  logLevel: "debug" as const,
};

// Only add signingKey in non-production environments
if (process.env.NODE_ENV !== 'production') {
  (serveConfig as any).signingKey = process.env.INNGEST_SIGNING_KEY;
  console.log("✅ Using Inngest signature verification in development");
} else {
  console.log("⚠️ SKIPPING INNGEST SIGNATURE VERIFICATION IN PRODUCTION");
}

export const { GET, POST, PUT } = serve(serveConfig);