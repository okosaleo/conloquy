import { agentsRouter } from '@/modules/agents/servers/procedures';
import { createTRPCRouter } from '../init';
import { meetingsRouter } from '@/modules/meetings/servers/procedures';

export const appRouter = createTRPCRouter({
  agents: agentsRouter,
  meetings: meetingsRouter,
});

export type AppRouter = typeof appRouter;
