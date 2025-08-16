import { auth } from '@/lib/auth';
import AgentsListHeader from '@/modules/agents/ui/components/agents-list-header';
import { AgentView, AgentViewLoading } from '@/modules/agents/ui/views/agents-view'
import { getQueryClient, trpc } from '@/trpc/server'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import React, { Suspense } from 'react'

export default async function Agents() {
   const session = await auth.api.getSession({
      headers: await headers(),
    });
  
    if (!session) {
      redirect("/sign-in");
    }
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(trpc.agents.getMany.queryOptions())
  return (
    <>
    <AgentsListHeader />
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<AgentViewLoading />}>
      <AgentView />
      </Suspense>
    </HydrationBoundary>
    </>
  )
}
