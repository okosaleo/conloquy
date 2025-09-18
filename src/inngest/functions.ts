import { db } from "@/db";
import { agents, meetings, user } from "@/db/schema";
import  {createAgent, openai, TextMessage} from "@inngest/agent-kit"
import { inngest } from "@/inngest/client";
import { StreamTranscriptItem } from "@/modules/meetings/types";
import { eq, inArray } from "drizzle-orm";
import JSONL from "jsonl-parse-stringify";

const summarizer = createAgent({
  name: "summarizer",
  system: `You are an expert summarizer. You write readable, concise, simple content. You are given a transcript of a meeting and you need to summarize it.

Use the following markdown structure for every output:

### Overview
Provide a detailed, engaging summary of the session's content. Focus on major features, user workflows, and any key takeaways. Write in a narrative style, using full sentences. Highlight unique or powerful aspects of the product, platform, or discussion.

### Notes
Break down key content into thematic sections with timestamp ranges. Each section should summarize key points, actions, or demos in bullet format.

Example:
#### Section Name
- Main point or demo shown here
- Another key insight or interaction
- Follow-up tool or explanation provided

#### Next Section
- Feature X automatically does Y
- Mention of integration with Z`.trim(),
model: openai({model: "gpt-4o-mini", apiKey: process.env.OPENAI_API_KEY})
})

export const meetingsProcessing = inngest.createFunction(
  {id: "meetings/processing" },
  {event: "meetings/processing" },
  async ({ event, step }) => {
    const response = await step.run("fetch-transcript", async () => {
      return fetch(event.data.transcriptUrl).then((res) => res.text());
    })

    const transcript = await step.run("parse-transcript", async () => {
      return JSONL.parse<StreamTranscriptItem>(response);
    });

    const transcriptWithSpeakers = await step.run("add-speakers", async () => {
      const speakerIds = [
        ...new Set(transcript.map((item) => item.speaker_id)),
      ];

      const userSpeakers = await db
      .select()
      .from(user)
      .where(inArray(user.id, speakerIds))
      .then((users) => users.map((user) => ({
        ...user,
      }))
    );

    const agentSpeakers = await db
      .select()
      .from(agents)
      .where(inArray(agents.id, speakerIds))
      .then((users) => users.map((user) => ({
        ...user,
      }))
    );

    const speakers = [...userSpeakers, ...agentSpeakers];

    return transcript.map((item) => {
      const speaker = speakers.find(
        (speaker) => speaker.id === item.speaker_id
      );

      if(!speaker) {
        return {
          ...item, 
          user: {
            name: "Unknown",
          },
        };
      }

      return {
        ...item,
        user: {
          name: speaker.name || "Unnamed Speaker" // Fixed: Handle undefined/null names
        },
      };
    })
    })

    // Add error handling for the summarizer call
    let summary = "Summary unavailable";
    try {
      const { output } = await summarizer.run(
        "Summarize the following transcript: " + JSON.stringify(transcriptWithSpeakers)
      );
      summary = (output[0] as TextMessage).content as string;
    } catch (error) {
      console.error("Error generating summary:", error);
      // You might want to set a different status or handle this differently
    }

    await step.run("save-summary", async () => {
      await db
      .update(meetings)
      .set({
        summary: summary,
        status: "completed"
      })
      .where(eq(meetings.id, event.data.meetingId))
    })
  },
)