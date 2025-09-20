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

// Skip signature verification in production due to Brimble proxy issues
const signingKey = process.env.NODE_ENV === 'production' ? undefined : process.env.INNGEST_SIGNING_KEY;

if (process.env.NODE_ENV === 'production') {
  console.log("⚠️ SKIPPING INNGEST SIGNATURE VERIFICATION IN PRODUCTION");
} else {
  console.log("✅ Using Inngest signature verification in development");
}

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [meetingsProcessing],
  signingKey: signingKey,
  logLevel: "debug",
});