import { agentsRouter } from '@/modules/agents/servers/procedures';
import { createTRPCRouter } from '../init';
import { meetingsRouter } from '@/modules/meetings/servers/procedures';
import { premiumRouter } from '@/modules/premium/server/procedure';

export const appRouter = createTRPCRouter({
  agents: agentsRouter,
  meetings: meetingsRouter,
  premium: premiumRouter,
});

export type AppRouter = typeof appRouter;
