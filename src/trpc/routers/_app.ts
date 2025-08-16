import { agentsRouter } from '@/modules/agents/servers/procedures';
import { createTRPCRouter } from '../init';

export const appRouter = createTRPCRouter({
  agents: agentsRouter,
  // greeting: greetingRouter, // add more routers here
});

export type AppRouter = typeof appRouter;
