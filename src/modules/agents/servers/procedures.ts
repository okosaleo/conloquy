import { db } from "@/db";
import { agents, meetings } from "@/db/schema";
import { createTRPCRouter, premiumProcedure, protectedProcedure } from "@/trpc/init";
import { agentsInsertSchema, agentsUpdateSchema } from "../schemas";
import {z} from "zod";
import { and, count, desc, eq, getTableColumns, ilike, sql} from "drizzle-orm";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, MIN_PAGE_SIZE } from "@/constants";
import { TRPCError } from "@trpc/server";

export const agentsRouter = createTRPCRouter({
  // Add this to your agentsRouter
getAgentMeetingDurations: protectedProcedure
  .input(z.object({
    agentId: z.string(),
    limit: z.number().min(1).max(20).default(10)
  }))
  .query(async ({ ctx, input }) => {
    const meetingDurations = await db
      .select({
        id: meetings.id,
        name: meetings.name,
        duration: sql<number>`EXTRACT(EPOCH FROM (ended_at - started_at))`.as("duration"),
        startedAt: meetings.startedAt,
        endedAt: meetings.endedAt,
      })
      .from(meetings)
      .innerJoin(agents, eq(meetings.agentId, agents.id))
      .where(
        and(
          eq(meetings.agentId, input.agentId),
          eq(agents.userId, ctx.auth.user.id),
          eq(meetings.status, "completed"), // Only completed meetings have duration
          sql`ended_at IS NOT NULL AND started_at IS NOT NULL`
        )
      )
      .orderBy(desc(meetings.startedAt))
      .limit(input.limit);

    // Group durations into ranges for the chart
    const durationRanges = [
      { range: "0-15 min", min: 0, max: 900, count: 0 },
      { range: "15-30 min", min: 900, max: 1800, count: 0 },
      { range: "30-60 min", min: 1800, max: 3600, count: 0 },
      { range: "60+ min", min: 3600, max: Infinity, count: 0 }
    ];

    meetingDurations.forEach(meeting => {
      if (meeting.duration) {
        const range = durationRanges.find(r => 
          meeting.duration >= r.min && meeting.duration < r.max
        );
        if (range) range.count++;
      }
    });

    return {
      meetings: meetingDurations,
      durationBreakdown: durationRanges
    };
  }),
      getTotalCount: protectedProcedure.query(async ({ ctx }) => {
    const [agentCount] = await db
      .select({ count: count() })
      .from(agents)
      .where(eq(agents.userId, ctx.auth.user.id));

    const [meetingCount] = await db
      .select({ count: count() })
      .from(meetings)
      .innerJoin(agents, eq(agents.id, meetings.agentId))
      .where(eq(agents.userId, ctx.auth.user.id));

    return {
      totalAgents: agentCount.count,
      totalMeetings: meetingCount.count
    };
  }),
   getMostActive: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(20).default(5)
    }))
    .query(async ({ ctx, input }) => {
      const agentsList = await db
        .select({
          ...getTableColumns(agents),
          meetingCount: db.$count(meetings, eq(agents.id, meetings.agentId)),
        })
        .from(agents)
        .where(eq(agents.userId, ctx.auth.user.id))
        .orderBy(
          desc(db.$count(meetings, eq(agents.id, meetings.agentId))), 
          desc(agents.createdAt)
        )
        .limit(input.limit);

      return agentsList;
    }),

  // Get comprehensive stats (total agents, total meetings, most active agent)
  getStats: protectedProcedure.query(async ({ ctx }) => {
    // Get total agents count
    const [agentCountResult] = await db
      .select({ count: count() })
      .from(agents)
      .where(eq(agents.userId, ctx.auth.user.id));

    // Get total meetings count
    const [meetingCountResult] = await db
      .select({ count: count() })
      .from(meetings)
      .innerJoin(agents, eq(agents.id, meetings.agentId))
      .where(eq(agents.userId, ctx.auth.user.id));

    // Get most active agent
   const [mostActiveAgent] = await db
    .select({
      ...getTableColumns(agents),
      meetingCount: db.$count(meetings, eq(agents.id, meetings.agentId)),
    })
    .from(agents)
    .where(eq(agents.userId, ctx.auth.user.id))
    .orderBy(
      desc(db.$count(meetings, eq(agents.id, meetings.agentId))), 
      desc(agents.createdAt)
    )
    .limit(1);

    return {
      totalAgents: agentCountResult.count,
      totalMeetings: meetingCountResult.count,
      mostActiveAgent: mostActiveAgent || null
    };
  }),
lastThree: protectedProcedure.query(async ({ ctx }) => {
  const agentsList = await db
    .select({
      ...getTableColumns(agents),
      meetingCount: db.$count(meetings, eq(agents.id, meetings.agentId)),
    })
    .from(agents)
    .where(eq(agents.userId, ctx.auth.user.id))
    .orderBy(desc(agents.createdAt), desc(agents.id)) 
    .limit(4);

  return agentsList;
}),
    update: protectedProcedure
    .input(agentsUpdateSchema)
    .mutation(async ({ctx, input}) => {
        const [updatedAgent] = await db
        .update(agents)
        .set(input)
        .where(
            and(
                eq(agents.id, input.id),
                eq(agents.userId, ctx.auth.user.id)
            )
        )
        .returning();

        if(!updatedAgent) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Agent not found"
            });
        }
        return updatedAgent;
    }),
    remove: protectedProcedure
    .input(z.object({id: z.string()}))
    .mutation(async ({ctx, input}) => {
        const [removedAgent] = await db
        .delete(agents)
        .where(
            and(
                eq(agents.id, input.id),
                eq(agents.userId, ctx.auth.user.id)
            )
        )
        .returning();
        if(!removedAgent) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Agent not found"
            });
        }
        return removedAgent;
    }),

    getOne: protectedProcedure.input(z.object({id: z.string()})).query(async ({ctx, input }) => {
        const [existingAgent] = await db
        .select(
            {
                ...getTableColumns(agents),
                meetingCount: db.$count(meetings, 
                    eq(agents.id, meetings.agentId))
            })
        .from(agents)
        .where(and
            (eq(agents.id, input.id),
            eq(agents.userId, ctx.auth.user.id),
            )
    );

    if(!existingAgent) {
        throw new TRPCError({
            code: "NOT_FOUND",
            message: "Agent not found"})
    }
        
    return existingAgent
    }),
    getMany: protectedProcedure
      .input(z.object({
        page: z.number().default(DEFAULT_PAGE),
        pageSize: z.number().min(MIN_PAGE_SIZE).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
        search: z.string().nullish(),
     })
  )
    .query(async ({ctx, input}) => {
        const {search, page, pageSize} = input;
        const data = await db
        .select({
               meetingCount: db.$count(meetings, 
                    eq(agents.id, meetings.agentId)),
                 ...getTableColumns(agents),
        })
        .from(agents)
        .where(
            and(
                eq(agents.userId, ctx.auth.user.id),
                search ? ilike(agents.name, `%${search}%`) : undefined,
            )
        )
        .orderBy(desc(agents.createdAt), desc(agents.id))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

        const [total] = await db
        .select({ count: count() })
        .from(agents)
        .where(
            and(
                eq(agents.userId, ctx.auth.user.id),
                search ? ilike(agents.name, `%${search}%`) : undefined
            )
        )

        const totalPages = Math.ceil(total.count / pageSize);
    return {
        items: data,
        total: total.count,
        totalPages,
    }
    }),
    create: premiumProcedure("agents").input(agentsInsertSchema)
    .mutation(async ({input, ctx}) => {
        const [createdAgent] = await db
        .insert(agents)
        .values({
            ...input,
            userId: ctx.auth.user.id
        })
        .returning();

        return createdAgent
    })
});