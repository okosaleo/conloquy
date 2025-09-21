
import { auth } from "@/lib/auth";
import HomeView, { HomeViewError, HomeViewLoading } from "@/modules/home/ui/views/home-view";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

   if(!session) {
        redirect('/sign-in')
    }
    const queryClient = getQueryClient();
    void queryClient.prefetchQuery(trpc.agents.lastThree.queryOptions())
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
          <Suspense fallback={<HomeViewLoading />}>
          <ErrorBoundary fallback={<HomeViewError />}>
          <HomeView />
          </ErrorBoundary>
          </Suspense>
        </HydrationBoundary>
  );
}
