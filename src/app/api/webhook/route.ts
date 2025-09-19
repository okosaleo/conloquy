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
import { db } from "@/db";
import { agents, meetings } from "@/db/schema";
import { streamVideo } from "@/lib/stream-video";
import { inngest } from "@/inngest/client";
import { generateAvatarUrl } from "@/lib/avatar";
import { streamChat } from "@/lib/stream-chat";

const openaiClient = new OpenAI({
  apiKey: process.env.DEEPSEEK_API,
  baseURL: "https://api.deepseek.com",
});

// In-memory cache for duplicate prevention
const processedMessages = new Map<string, number>();
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

function verifySignatureWithSDK(body: string, signature: string): boolean {
  try {
    const ok = streamVideo.verifyWebhook(body, signature);
    console.log("verifySignatureWithSDK => result:", ok);
    return ok;
  } catch (err) {
    console.error("verifySignatureWithSDK => exception:", err);
    return false;
  }
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

  try {
    const signature = req.headers.get("x-signature");
    const apiKey = req.headers.get("x-api-key");
    console.log("🔐 Headers present:", { signature: !!signature, apiKey: !!apiKey });

    if (!signature || !apiKey) {
      console.error("❌ Missing signature or API key");
      return NextResponse.json({ error: "Missing signature or API key" }, { status: 400 });
    }

    const body = await req.text();
    console.log("📦 Raw body length:", body?.length ?? 0);

    if (!verifySignatureWithSDK(body, signature)) {
      console.error("❌ Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    let payload: any;
    try {
      payload = JSON.parse(body);
      console.log("✅ Parsed payload.type:", payload?.type);
    } catch (err) {
      console.error("❌ Failed to parse JSON body:", err);
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const eventType = payload?.type;
    console.log("📌 Event type:", eventType);

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

      // Fetch meeting
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
      console.log("📄 DB returned meeting:", existingMeeting);

      if (!existingMeeting) {
        console.error("❌ Meeting not found for id:", meetingId);
        return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
      }

      // Update meeting active
      try {
        const tStart = Date.now();
        await db
          .update(meetings)
          .set({
            status: "active",
            startedAt: new Date(),
          })
          .where(eq(meetings.id, existingMeeting.id));
        console.log(`✅ Marked meeting active (took ${Date.now() - tStart}ms)`);
      } catch (err) {
        console.error("❌ Failed to update meeting status:", err);
        // continue — we still try to connect the agent but log heavily
      }

      // Fetch agent
      console.log("🔍 Querying DB for agent:", existingMeeting.agentId);
      const [existingAgent] = await db.select().from(agents).where(eq(agents.id, existingMeeting.agentId));
      console.log("🤖 DB returned agent:", existingAgent);

      if (!existingAgent) {
        console.error("❌ Agent not found for id:", existingMeeting.agentId);
        return NextResponse.json({ error: "Agent not found" }, { status: 404 });
      }

      // Create Stream call and connect agent via OpenAI realtime
      try {
        console.log("📞 Creating streamVideo.call for meeting:", meetingId);
        const call = streamVideo.video.call("default", meetingId);
        console.log("📞 streamVideo.call created, call.id:", (call as any)?.id ?? "unknown");

        console.log("🔗 Connecting realtime OpenAI client for agent:", existingAgent.id);
        const realtimeClient = await streamVideo.video.connectOpenAi({
          call,
          openAiApiKey: process.env.OPENAI_API_KEY!,
          agentUserId: existingAgent.id,
          model: "gpt-4o-mini-realtime-preview-2024-12-17",
        });
        console.log("✅ Realtime client connected:", !!realtimeClient);

        try {
          await realtimeClient.updateSession({
            instructions: existingAgent.instructions,
            voice: "ballad",
          });
          console.log("✅ Realtime session updated with instructions");
        } catch (err) {
          console.error("❌ realtimeClient.updateSession failed:", err);
        }
      } catch (err) {
        console.error("❌ Failed to create/connect realtime client:", err);
      }

      console.log(`🎬 call.session_started handler finished in ${Date.now() - start}ms`);
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
        console.log("✅ call ended");
      } catch (err) {
        console.error("❌ Failed to end call:", err);
      }

      console.log(`👋 participant_left handler finished in ${Date.now() - start}ms`);
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
        console.log("✅ Meeting marked processing");
      } catch (err) {
        console.error("❌ Failed to mark meeting processing:", err);
      }

      console.log(`📴 session_ended handler finished in ${Date.now() - start}ms`);
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
        console.log("📄 Updated meeting:", updatedMeeting);

        if (!updatedMeeting) {
          console.error("❌ Meeting not found when saving transcript");
          return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
        }

        try {
          await inngest.send({
            name: "meetings/processing",
            data: {
              meetingId: updatedMeeting.id,
              transcriptUrl: updatedMeeting.transcriptUrl,
            },
          });
          console.log("📤 Inngest event sent: meetings/processing");
        } catch (err) {
          console.error("❌ Failed to send Inngest event:", err);
        }
      } catch (err) {
        console.error("❌ Error handling transcription_ready:", err);
      }

      console.log(`📝 transcription_ready handler finished in ${Date.now() - start}ms`);
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
        console.log("✅ Recording URL saved to DB");
      } catch (err) {
        console.error("❌ Failed to save recording URL:", err);
      }

      console.log(`🎥 recording_ready handler finished in ${Date.now() - start}ms`);
    }

    // -------------------------
    // message.new
    // -------------------------
    else if (eventType === "message.new") {
      const start = Date.now();
      console.log("💬 Handling message.new");
      const event = payload as MessageNewEvent;
      // Log a compact view of important fields only to avoid huge logs
      console.log("➡️ message.new fields:", {
        channel_id: event?.channel_id,
        message_id: event?.message?.id,
        user_id: event?.user?.id,
        text_present: !!event?.message?.text,
      });

      const userId = event.user?.id;
      const channelId = event.channel_id;
      const text = event.message?.text;
      const messageId = event.message?.id;

      if (!userId || !channelId || !text || !messageId) {
        console.error("❌ Missing required fields in message.new:", { userId, channelId, text: !!text, messageId });
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      // Check duplicate
      if (isDuplicateMessage(messageId)) {
        console.warn(`⚠️ Duplicate message detected: ${messageId}`);
        return NextResponse.json({ status: "duplicate_ignored" });
      }

      // Lookup meeting
      console.log("🔍 Querying DB for completed meeting:", channelId);
      const [existingMeeting] = await db
        .select()
        .from(meetings)
        .where(and(eq(meetings.id, channelId), eq(meetings.status, "completed")));
      console.log("📄 existingMeeting:", existingMeeting);

      if (!existingMeeting) {
        console.error("❌ Meeting not found for channelId:", channelId);
        return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
      }

      // Lookup agent
      console.log("🔍 Querying DB for agent:", existingMeeting.agentId);
      const [existingAgent] = await db.select().from(agents).where(eq(agents.id, existingMeeting.agentId));
      console.log("🤖 existingAgent:", existingAgent);

      if (!existingAgent) {
        console.error("❌ Agent not found for id:", existingMeeting.agentId);
        return NextResponse.json({ error: "Agent not found" }, { status: 404 });
      }

      // Ignore agent's own messages
      if (userId === existingAgent.id) {
        console.log("ℹ️ Ignoring agent's own message:", messageId);
        return NextResponse.json({ status: "agent_message_ignored" });
      }

      // Build instructions
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
        console.log("📡 Getting Stream Chat channel and watching:", channelId);
        const channel = streamChat.channel("messaging", channelId);
        await channel.watch();
        console.log("✅ Channel watched");

        const previousMessages = (channel.state.messages || [])
          .slice(-5)
          .filter((msg) => msg.text && msg.text.trim() !== "" && msg.id !== messageId)
          .map<ChatCompletionMessageParam>((message) => ({
            role: message.user?.id === existingAgent.id ? "assistant" : "user",
            content: message.text || "",
          }));
        console.log("🕓 previousMessages length:", previousMessages.length);

        console.log("🤖 Sending to DeepSeek/OpenAI (model=deepseek-chat) — prompt text length:", text.length);
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
        console.log("✅ GPT response received:", !!GPTResponseText);

        if (!GPTResponseText) {
          console.error("❌ No response body from GPT");
          return NextResponse.json({ error: "No response from GPT" }, { status: 400 });
        }

        const avatarUrl = generateAvatarUrl({
          seed: existingAgent.name,
          variant: "openPeeps",
        });
        console.log("🖼 Generated avatarUrl:", avatarUrl);

        console.log("⬆️ Upserting agent user to Stream Chat:", existingAgent.id);
        await streamChat.upsertUser({
          id: existingAgent.id,
          name: existingAgent.name,
          image: avatarUrl,
        });
        console.log("✅ Upserted agent user");

        console.log("📤 Sending GPT reply to channel:", channelId);
        await channel.sendMessage({
          text: GPTResponseText,
          user: {
            id: existingAgent.id,
            name: existingAgent.name,
            image: avatarUrl,
          },
        });
        console.log("✅ Sent GPT reply to stream chat");
      } catch (err) {
        console.error("❌ Error processing message.new:", err);
        return NextResponse.json({ error: "Failed to process message" }, { status: 500 });
      }

      console.log(`💬 message.new handler finished in ${Date.now() - start}ms`);
    }

    // Unknown event type
    else {
      console.warn("⚠️ Unknown event type received:", eventType);
    }

    console.log(`✅ Finished processing event (total ${Date.now() - globalStart}ms)`);
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("🔥 Unhandled exception in webhook handler:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
