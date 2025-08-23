"use client";

import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";


export default function MeetingsView() {
    const trpc = useTRPC();
    const { data } = useSuspenseQuery(trpc.meetings.getMany.queryOptions({}));
  return (
    <div>
        table
    </div>
  )
}



export const MeetingsViewLoading = () => {
    return (
        <LoadingState title="Loading Meetings" description='Please wait we&apos;re getting your meetings' />
    );
};

export const MeetingsViewError = () => {
    return (
        <ErrorState title='Error loadig meetings' description='Something went wrong, we are sorry please contact customer support for more info' />
    );
};
