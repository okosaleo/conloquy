"use client";

import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import GeneratedAvatar from "@/components/generated-avatar";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomeView() {
   const trpc = useTRPC();
   const { data } = useSuspenseQuery(trpc.agents.lastThree.queryOptions());
  return (
    <div className="flex flex-col items-center justify-center p-4 ">
      <h1 className="text-2xl font-medium">My Agents</h1>
       {data.length === 0 && (
        <div className="mt-8 w-full md:w-1/2">
              <EmptyState
              title='Create your first agent'
              description='Create an agent to join your meetings. Each agent will follow instructions and can interact with participants during the meeting.'
              />
              <Button asChild className="w-full mt-4">
                <Link href="/agents">Create Agent</Link>
              </Button>
              </div>
            )}

            {data.length > 0 && (
              <div className="grid gap-4 md:grid-cols-4 w-full mt-4">
               {data.map((agent) => (
        <Card key={agent.id} className=" shadow-sm bg-gradient-to-r from-primary/5 to-primary/20">
          <CardContent className="flex flex-col items-center justify-center gap-4 p-4">
            <GeneratedAvatar
                variant="openPeeps"
                seed={agent.name}
                className="size-24"
                />
            <div>
              <p className="font-semibold">{agent.name}</p>
              <p className="text-sm text-muted-foreground">
                {agent.meetingCount} {agent.meetingCount === 1 ? "meeting" : "meetings"}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
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
