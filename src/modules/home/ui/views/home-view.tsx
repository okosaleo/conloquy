"use client";

import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";

import Header from "../components/header";

export default function HomeView() {
   const trpc = useTRPC();
   const { data } = useSuspenseQuery(trpc.agents.lastThree.queryOptions());
   const { data: stats } = useSuspenseQuery(trpc.agents.getStats.queryOptions());
   const { data: durationData } = useSuspenseQuery(
  trpc.agents.getAgentMeetingDurations.queryOptions({
    agentId: stats.mostActiveAgent.id,
    limit: 10
  })
);
   
   
  return (
   <div className="flex flex-col items-center justify-center p-4 w-full">
    <Header totalAgents={stats.totalAgents} 
    totalMeetings={stats.totalMeetings} 
    mostActiveAgent={stats.mostActiveAgent}
    durationBreakdown={durationData.durationBreakdown}

     />
       {data.length === 0 && (
        <div className="mt-7 w-full md:w-1/2">
              <EmptyState
              title='Create your first agent'
              description='Create an agent to join your meetings. Each agent will follow instructions and can interact with participants during the meeting.'
              />
              </div>
            )}
    </div>
  );
}


export const HomeViewLoading = () => {
    return (
        <LoadingState title="Loading home" description='Be calm we are getting your information' />
    );
}

export const HomeViewError = () => {
    return (
      <ErrorState title='Error Loading Home' description='Something went wrong' />
    );
}
