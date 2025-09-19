import {
  MessageNewEvent,
  CallEndedEvent,
  CallTranscriptionReadyEvent,
  CallSessionParticipantLeftEvent,
  CallRecordingReadyEvent,
  CallSessionStartedEvent,
} from "@stream-io/node-sdk";
import { and, eq, not } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import crypto from 'crypto';
import { db } from "@/db";
import { agents, meetings } from "@/db/schema";
import { streamVideo } from "@/lib/stream-video";
import { inngest } from "@/inngest/client";
import { generateAvatarUrl } from "@/lib/avatar";
import { streamChat } from "@/lib/stream-chat";

// Configuration for Next.js route handler
export const maxDuration = 60;
export const runtime = 'nodejs';
export const config = {
  api: {
    bodyParser: false, // Disable body parsing to preserve raw body
  },
};

const openaiClient = new OpenAI({
  apiKey: process.env.DEEPSEEK_API,
  baseURL: "https://api.deepseek.com",
});

// In-memory cache for duplicate prevention
const processedMessages = new Map<string, number>();
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

function verifySignatureWithSDK(body: string, signature: string): boolean {
  try {
    console.log("🔐 Verifying signature with SDK:", {
      bodyLength: body?.length,
      signaturePresent: !!signature,
      bodyPreview: body?.substring(0, 200) + "...",
      signaturePrefix: signature?.substring(0, 20) + "...",
      streamVideoClient: !!streamVideo,
      streamVideoClientType: typeof streamVideo,
    });
    
    // Log the streamVideo configuration (without exposing secrets)
    console.log("🔧 StreamVideo client config:", {
      hasVideoProperty: !!streamVideo?.video,
      hasVerifyWebhookMethod: typeof streamVideo?.verifyWebhook === 'function',
      clientMethods: Object.getOwnPropertyNames(streamVideo).filter(name => typeof (streamVideo as any)[name] === 'function'),
    });
    
    const ok = streamVideo.verifyWebhook(body, signature);
    console.log("✅ SDK verification result:", ok);
    return ok;
  } catch (err) {
    console.error("❌ SDK verification exception:", err);
    console.error("Stack trace:", (err as Error).stack);
    return false;
  }
}

function testWithKnownPayload() {
  // Test with a known payload to verify our API secret is working
  const testPayload = '{"test":"webhook"}';
  const secret = process.env.STREAM_VIDEO_SECRET_KEY; // Match your streamVideo client
  
  if (secret) {
    const testSignature = crypto
      .createHmac('sha256', secret)
      .update(testPayload, 'utf8')
      .digest('hex');
    
    console.log("🧪 Test signature generation with Stream Video API Secret:", {
      payload: testPayload,
      secretLength: secret.length,
      secretPrefix: secret.substring(0, 8) + "...",
      generatedSignature: testSignature,
    });

    // Also test with the X-API-KEY from the webhook request header
    console.log("🔍 Environment check:", {
      hasStreamVideoSecretKey: !!process.env.STREAM_VIDEO_SECRET_KEY,
      hasStreamApiKey: !!process.env.NEXT_PUBLIC_STREAM_VIDEO_API_KEY,
      streamVideoSecretKeyLength: process.env.STREAM_VIDEO_SECRET_KEY?.length,
      streamApiKeyLength: process.env.NEXT_PUBLIC_STREAM_VIDEO_API_KEY?.length,
    });
  } else {
    console.error("❌ STREAM_VIDEO_SECRET_KEY (API Secret) not found in environment");
  }
}

function manualVerifyWebhook(body: string, signature: string): boolean {
  try {
    // Use the same secret as your streamVideo client
    const secret = process.env.STREAM_VIDEO_SECRET_KEY;
    if (!secret) {
      console.error("❌ STREAM_VIDEO_SECRET_KEY not found in environment");
      return false;
    }

    console.log("🔑 Using Stream Video API Secret:", {
      present: !!secret,
      length: secret.length,
      prefix: secret.substring(0, 8) + "...",
    });

    // Log raw body details for debugging
    console.log("📄 Body analysis:", {
      length: body.length,
      firstLine: body.split('\n')[0],
      lastLine: body.split('\n').slice(-1)[0],
      hasWhitespace: /\s/.test(body),
      startsWithBrace: body.trimStart().startsWith('{'),
      endsWithBrace: body.trimEnd().endsWith('}'),
    });

    // Try with different body modifications
    const bodyVariations = [
      { name: 'original', body: body },
      { name: 'trimmed', body: body.trim() },
      { name: 'no_spaces', body: body.replace(/\s+/g, '') },
      { name: 'normalized_newlines', body: body.replace(/\r\n/g, '\n') },
    ];

    console.log("🧪 Testing different body variations:");
    for (const variation of bodyVariations) {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(variation.body, 'utf8')
        .digest('hex');
      
      const match = expectedSignature === (signature.startsWith('sha256=') ? signature.slice(7) : signature);
      console.log(`  ${variation.name}: ${expectedSignature.substring(0, 16)}... (match: ${match})`);
      
      if (match) {
        console.log(`✅ MATCH FOUND with ${variation.name} body variation!`);
        return true;
      }
    }

    // Standard verification (utf8)
    const providedSignature = signature.startsWith('sha256=') 
      ? signature.slice(7) 
      : signature;

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body, 'utf8')
      .digest('hex');
    
    console.log("🔐 Final signature comparison:", {
      expectedFull: expectedSignature,
      providedFull: providedSignature,
      match: expectedSignature === providedSignature,
      bodyMD5: crypto.createHash('md5').update(body, 'utf8').digest('hex'),
      secretMD5: crypto.createHash('md5').update(secret, 'utf8').digest('hex').substring(0, 16) + "...",
    });
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(providedSignature, 'hex')
    );
  } catch (err) {
    console.error("❌ Manual verification error:", err);
    return false;
  }
}

function verifySignature(body: string, signature: string): boolean {
  // Try SDK verification first
  const sdkResult = verifySignatureWithSDK(body, signature);
  if (sdkResult) {
    console.log("✅ SDK verification passed");
    return true;
  }

  // Fallback to manual verification
  console.log("⚠️ SDK verification failed, trying manual verification");
  const manualResult = manualVerifyWebhook(body, signature);
  if (manualResult) {
    console.log("✅ Manual verification passed");
    return true;
  }

  console.error("❌ Both SDK and manual verification failed");
  return false;
}

function isDuplicateMessage(messageId: string): boolean {
  const now = Date.now();

  // Clean expired entries
  for (const [id, timestamp] of processedMessages.entries()) {
    if (now - timestamp > CACHE_EXPIRY) {
      processedMessages.delete(id);
    }
  }

  if (!messageId) return false;
  if (processedMessages.has(messageId)) {
    return true;
  }

  processedMessages.set(messageId, now);
  return false;
}

export async function POST(req: NextRequest) {
  const globalStart = Date.now();
  console.log("➡️ Webhook POST received");

  // Test our secret configuration
  testWithKnownPayload();

  try {
    // Get headers with case-insensitive fallback
    const signature = req.headers.get("x-signature") || req.headers.get("X-Signature");
    const apiKey = req.headers.get("x-api-key") || req.headers.get("X-Api-Key");
    const webhookId = req.headers.get("x-webhook-id") || req.headers.get("X-Webhook-Id");
    const attempt = req.headers.get("x-webhook-attempt") || req.headers.get("X-Webhook-Attempt");
    
    // Log ALL headers for debugging
    const allHeaders: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      allHeaders[key] = value;
    });
    console.log("📋 ALL REQUEST HEADERS:", allHeaders);
    
    console.log("🔐 Headers present:", { 
      signature: !!signature, 
      apiKey: !!apiKey,
      webhookId,
      attempt,
      // Compare the API key from the webhook with your environment
      apiKeyMatches: apiKey === process.env.NEXT_PUBLIC_STREAM_VIDEO_API_KEY,
      apiKeyFromRequest: apiKey?.substring(0, 8) + "...",
      apiKeyFromEnv: process.env.NEXT_PUBLIC_STREAM_VIDEO_API_KEY?.substring(0, 8) + "...",
    });

    // Log deployment environment info
    console.log("🌍 DEPLOYMENT INFO:", {
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      vercelRegion: process.env.VERCEL_REGION,
      platform: process.platform,
      nodeVersion: process.version,
      isVercel: !!process.env.VERCEL,
      isAWS: !!process.env.AWS_REGION,
      host: req.headers.get('host'),
      userAgent: req.headers.get('user-agent'),
      contentType: req.headers.get('content-type'),
      contentLength: req.headers.get('content-length'),
    });

    if (!signature || !apiKey) {
      console.error("❌ Missing signature or API key");
      return NextResponse.json({ error: "Missing signature or API key" }, { status: 400 });
    }

    // Get raw body as buffer first to avoid multiple reads
    let body: string;
    let bodyBuffer: Buffer;
    
    try {
      bodyBuffer = Buffer.from(await req.arrayBuffer());
      body = bodyBuffer.toString('utf8');
      
      console.log("📦 Raw body details:", {
        bufferLength: bodyBuffer.length,
        stringLength: body.length,
        preview: body.substring(0, 200) + "...",
        firstChar: body.charCodeAt(0),
        lastChar: body.charCodeAt(body.length - 1),
        hasNewlines: body.includes('\n'),
        hasCarriageReturns: body.includes('\r'),
      });
    } catch (bodyErr) {
      console.error("❌ Failed to read request body:", bodyErr);
      return NextResponse.json({ error: "Failed to read request body" }, { status: 400 });
    }

    if (!body) {
      console.error("❌ Empty request body");
      return NextResponse.json({ error: "Empty request body" }, { status: 400 });
    }

    // Verify signature
    if (!verifySignature(body, signature)) {
      console.error("❌ Invalid signature - webhook rejected");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    console.log("✅ Signature verification passed");

    // Parse JSON payload
    let payload: any;
    try {
      payload = JSON.parse(body);
      console.log("✅ Parsed payload.type:", payload?.type);
    } catch (err) {
      console.error("❌ Failed to parse JSON body:", err);
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const eventType = payload?.type;
    console.log("📌 Processing event type:", eventType);

    // -------------------------
    // call.session_started
    // -------------------------
    if (eventType === "call.session_started") {
      const start = Date.now();
      console.log("🎬 Handling call.session_started event");
      
      const event = payload as CallSessionStartedEvent;
      const meetingId = event?.call?.custom?.meetingId;
      console.log("🆔 meetingId:", meetingId);

      if (!meetingId) {
        console.error("❌ Missing meetingId in call.session_started");
        return NextResponse.json({ error: "Missing meetingId" }, { status: 400 });
      }

      // Fetch meeting from database
      console.log("🔍 Querying DB for meeting:", meetingId);
      const [existingMeeting] = await db
        .select()
        .from(meetings)
        .where(
          and(
            eq(meetings.id, meetingId),
            not(eq(meetings.status, "completed")),
            not(eq(meetings.status, "active")),
            not(eq(meetings.status, "cancelled")),
            not(eq(meetings.status, "processing"))
          )
        );
      
      console.log("📄 DB returned meeting:", !!existingMeeting);

      if (!existingMeeting) {
        console.error("❌ Meeting not found for id:", meetingId);
        return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
      }

      // Update meeting status to active
      try {
        const updateStart = Date.now();
        await db
          .update(meetings)
          .set({
            status: "active",
            startedAt: new Date(),
          })
          .where(eq(meetings.id, existingMeeting.id));
        
        console.log(`✅ Meeting marked active (took ${Date.now() - updateStart}ms)`);
      } catch (err) {
        console.error("❌ Failed to update meeting status:", err);
        // Continue processing despite DB error
      }

      // Fetch agent from database
      console.log("🔍 Querying DB for agent:", existingMeeting.agentId);
      const [existingAgent] = await db
        .select()
        .from(agents)
        .where(eq(agents.id, existingMeeting.agentId));
      
      console.log("🤖 DB returned agent:", !!existingAgent);

      if (!existingAgent) {
        console.error("❌ Agent not found for id:", existingMeeting.agentId);
        return NextResponse.json({ error: "Agent not found" }, { status: 404 });
      }

      // Create Stream call and connect agent via OpenAI realtime
      try {
        console.log("📞 Creating streamVideo call for meeting:", meetingId);
        const call = streamVideo.video.call("default", meetingId);
        console.log("📞 Call created successfully");

        console.log("🔗 Connecting realtime OpenAI client for agent:", existingAgent.id);
        const realtimeClient = await streamVideo.video.connectOpenAi({
          call,
          openAiApiKey: process.env.OPENAI_API_KEY!,
          agentUserId: existingAgent.id,
          model: "gpt-4o-mini-realtime-preview-2024-12-17",
        });
        
        console.log("✅ Realtime client connected");

        // Update session with agent instructions
        try {
          await realtimeClient.updateSession({
            instructions: existingAgent.instructions,
            voice: "ballad",
          });
          console.log("✅ Realtime session updated with instructions");
        } catch (sessionErr) {
          console.error("❌ Failed to update realtime session:", sessionErr);
        }
        
      } catch (callErr) {
        console.error("❌ Failed to create/connect realtime client:", callErr);
      }

      console.log(`🎬 call.session_started completed in ${Date.now() - start}ms`);
    }

    // -------------------------
    // call.session_participant_left
    // -------------------------
    else if (eventType === "call.session_participant_left") {
      const start = Date.now();
      console.log("👋 Handling call.session_participant_left");
      
      const event = payload as CallSessionParticipantLeftEvent;
      const meetingId = event?.call_cid?.split?.(":")?.[1];
      console.log("🆔 meetingId:", meetingId);

      if (!meetingId) {
        console.error("❌ Missing meetingId in call.session_participant_left");
        return NextResponse.json({ error: "Missing meetingId" }, { status: 400 });
      }

      try {
        const call = streamVideo.video.call("default", meetingId);
        console.log("📞 Ending call for meeting:", meetingId);
        await call.end();
        console.log("✅ Call ended successfully");
      } catch (err) {
        console.error("❌ Failed to end call:", err);
      }

      console.log(`👋 participant_left completed in ${Date.now() - start}ms`);
    }

    // -------------------------
    // call.session_ended
    // -------------------------
    else if (eventType === "call.session_ended") {
      const start = Date.now();
      console.log("📴 Handling call.session_ended");
      
      const event = payload as CallEndedEvent;
      const meetingId = event?.call?.custom?.meetingId;
      console.log("🆔 meetingId:", meetingId);

      if (!meetingId) {
        console.error("❌ Missing meetingId in call.session_ended");
        return NextResponse.json({ error: "Missing meetingId" }, { status: 400 });
      }

      try {
        await db
          .update(meetings)
          .set({
            status: "processing",
            endedAt: new Date(),
          })
          .where(and(eq(meetings.id, meetingId), eq(meetings.status, "active")));
        
        console.log("✅ Meeting status updated to processing");
      } catch (err) {
        console.error("❌ Failed to update meeting status to processing:", err);
      }

      console.log(`📴 session_ended completed in ${Date.now() - start}ms`);
    }

    // -------------------------
    // call.transcription_ready
    // -------------------------
    else if (eventType === "call.transcription_ready") {
      const start = Date.now();
      console.log("📝 Handling call.transcription_ready");
      
      const event = payload as CallTranscriptionReadyEvent;
      const meetingId = event?.call_cid?.split?.(":")?.[1];
      console.log("🆔 meetingId:", meetingId);

      if (!meetingId) {
        console.error("❌ Missing meetingId in call.transcription_ready");
        return NextResponse.json({ error: "Missing meetingId" }, { status: 400 });
      }

      try {
        const [updatedMeeting] = await db
          .update(meetings)
          .set({
            transcriptUrl: event.call_transcription.url,
          })
          .where(eq(meetings.id, meetingId))
          .returning();

        console.log("📄 Meeting updated with transcript URL:", !!updatedMeeting);

        if (!updatedMeeting) {
          console.error("❌ Meeting not found when saving transcript");
          return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
        }

        // Send Inngest event for processing
        try {
          await inngest.send({
            name: "meetings/processing",
            data: {
              meetingId: updatedMeeting.id,
              transcriptUrl: updatedMeeting.transcriptUrl,
            },
          });
          console.log("📤 Inngest event sent: meetings/processing");
        } catch (inngestErr) {
          console.error("❌ Failed to send Inngest event:", inngestErr);
        }
        
      } catch (err) {
        console.error("❌ Error handling transcription_ready:", err);
      }

      console.log(`📝 transcription_ready completed in ${Date.now() - start}ms`);
    }

    // -------------------------
    // call.recording_ready
    // -------------------------
    else if (eventType === "call.recording_ready") {
      const start = Date.now();
      console.log("🎥 Handling call.recording_ready");
      
      const event = payload as CallRecordingReadyEvent;
      const meetingId = event?.call_cid?.split?.(":")?.[1];
      console.log("🆔 meetingId:", meetingId);

      if (!meetingId) {
        console.error("❌ Missing meetingId in call.recording_ready");
        return NextResponse.json({ error: "Missing meetingId" }, { status: 400 });
      }

      try {
        await db
          .update(meetings)
          .set({
            recordingUrl: event.call_recording.url,
          })
          .where(eq(meetings.id, meetingId));
        
        console.log("✅ Recording URL saved to database");
      } catch (err) {
        console.error("❌ Failed to save recording URL:", err);
      }

      console.log(`🎥 recording_ready completed in ${Date.now() - start}ms`);
    }

    // -------------------------
    // message.new
    // -------------------------
    else if (eventType === "message.new") {
      const start = Date.now();
      console.log("💬 Handling message.new");
      
      const event = payload as MessageNewEvent;
      console.log("➡️ message.new fields:", {
        channel_id: event?.channel_id,
        message_id: event?.message?.id,
        user_id: event?.user?.id,
        has_text: !!event?.message?.text,
      });

      const userId = event.user?.id;
      const channelId = event.channel_id;
      const text = event.message?.text;
      const messageId = event.message?.id;

      if (!userId || !channelId || !text || !messageId) {
        console.error("❌ Missing required fields in message.new:", { 
          userId: !!userId, 
          channelId: !!channelId, 
          text: !!text, 
          messageId: !!messageId 
        });
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      // Check for duplicate messages
      if (isDuplicateMessage(messageId)) {
        console.warn(`⚠️ Duplicate message detected: ${messageId}`);
        return NextResponse.json({ status: "duplicate_ignored" });
      }

      // Look up completed meeting
      console.log("🔍 Querying DB for completed meeting:", channelId);
      const [existingMeeting] = await db
        .select()
        .from(meetings)
        .where(and(eq(meetings.id, channelId), eq(meetings.status, "completed")));
      
      console.log("📄 Meeting found:", !!existingMeeting);

      if (!existingMeeting) {
        console.error("❌ Completed meeting not found for channelId:", channelId);
        return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
      }

      // Look up agent
      console.log("🔍 Querying DB for agent:", existingMeeting.agentId);
      const [existingAgent] = await db
        .select()
        .from(agents)
        .where(eq(agents.id, existingMeeting.agentId));
      
      console.log("🤖 Agent found:", !!existingAgent);

      if (!existingAgent) {
        console.error("❌ Agent not found for id:", existingMeeting.agentId);
        return NextResponse.json({ error: "Agent not found" }, { status: 404 });
      }

      // Ignore agent's own messages
      if (userId === existingAgent.id) {
        console.log("ℹ️ Ignoring agent's own message:", messageId);
        return NextResponse.json({ status: "agent_message_ignored" });
      }

      // Build system instructions for post-meeting chat
      const instructions = `
You are an AI assistant helping the user revisit a recently completed meeting.
Below is a summary of the meeting, generated from the transcript:

${existingMeeting.summary}

The following are your original instructions from the live meeting assistant. Please continue to follow these behavioral guidelines as you assist the user:

${existingAgent.instructions}

The user may ask questions about the meeting, request clarifications, or ask for follow-up actions.
Always base your responses on the meeting summary above.

You also have access to the recent conversation history between you and the user. Use the context of previous messages to provide relevant, coherent, and helpful responses. If the user's question refers to something discussed earlier, make sure to take that into account and maintain continuity in the conversation.

If the summary does not contain enough information to answer a question, politely let the user know.

Be concise, helpful, and focus on providing accurate information from the meeting and the ongoing conversation.
`;

      try {
        // Get Stream Chat channel and watch it
        console.log("📡 Getting Stream Chat channel:", channelId);
        const channel = streamChat.channel("messaging", channelId);
        await channel.watch();
        console.log("✅ Channel watched successfully");

        // Get previous messages for context
        const previousMessages = (channel.state.messages || [])
          .slice(-5) // Last 5 messages
          .filter((msg) => msg.text && msg.text.trim() !== "" && msg.id !== messageId)
          .map<ChatCompletionMessageParam>((message) => ({
            role: message.user?.id === existingAgent.id ? "assistant" : "user",
            content: message.text || "",
          }));
        
        console.log("🕓 Previous messages loaded:", previousMessages.length);

        // Send to AI for response
        console.log("🤖 Sending to DeepSeek AI, prompt length:", text.length);
        const GPTResponse = await openaiClient.chat.completions.create({
          messages: [
            { role: "system", content: instructions },
            ...previousMessages,
            { role: "user", content: text },
          ],
          model: "deepseek-chat",
          temperature: 0.7,
        });

        const GPTResponseText = GPTResponse?.choices?.[0]?.message?.content;
        console.log("✅ AI response received:", !!GPTResponseText);

        if (!GPTResponseText) {
          console.error("❌ No response from AI");
          return NextResponse.json({ error: "No response from AI" }, { status: 500 });
        }

        // Generate avatar for agent
        const avatarUrl = generateAvatarUrl({
          seed: existingAgent.name,
          variant: "openPeeps",
        });
        console.log("🖼 Avatar generated for agent");

        // Upsert agent user in Stream Chat
        console.log("⬆️ Upserting agent user:", existingAgent.id);
        await streamChat.upsertUser({
          id: existingAgent.id,
          name: existingAgent.name,
          image: avatarUrl,
        });
        console.log("✅ Agent user upserted");

        // Send AI response to channel
        console.log("📤 Sending AI response to channel");
        await channel.sendMessage({
          text: GPTResponseText,
          user: {
            id: existingAgent.id,
            name: existingAgent.name,
            image: avatarUrl,
          },
        });
        console.log("✅ AI response sent to channel");
        
      } catch (err) {
        console.error("❌ Error processing message.new:", err);
        return NextResponse.json({ error: "Failed to process message" }, { status: 500 });
      }

      console.log(`💬 message.new completed in ${Date.now() - start}ms`);
    }

    // -------------------------
    // Unknown event type
    // -------------------------
    else {
      console.warn("⚠️ Unknown event type received:", eventType);
      return NextResponse.json({ status: "unknown_event_ignored" });
    }

    console.log(`✅ Webhook processing completed in ${Date.now() - globalStart}ms`);
    return NextResponse.json({ status: "ok" });

  } catch (err) {
    console.error("🔥 Unhandled exception in webhook handler:", err);
    console.error("Stack trace:", (err as Error).stack);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}