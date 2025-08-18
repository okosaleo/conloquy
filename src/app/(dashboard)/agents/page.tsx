import { auth } from '@/lib/auth';
import AgentsListHeader from '@/modules/agents/ui/components/agents-list-header';
import { AgentView, AgentViewLoading } from '@/modules/agents/ui/views/agents-view'
import { getQueryClient, trpc } from '@/trpc/server'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { SearchParams } from 'nuqs';
import React, { Suspense } from 'react'
import { loadSearchParams } from '@/modules/agents/params';

interface Props {
  searchParams: Promise<SearchParams>;
}

export default async function Agents({ searchParams }: Props) {
  const filters = await loadSearchParams(searchParams);
   const session = await auth.api.getSession({
      headers: await headers(),
    });
  
    if (!session) {
      redirect("/sign-in");
    }
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(trpc.agents.getMany.queryOptions({
    ...filters,
  }))
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
