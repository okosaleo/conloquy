'use client';
import { LoadingState } from '@/components/loading-state';
import { useTRPC } from '@/trpc/client';
import { useSuspenseQuery } from '@tanstack/react-query';

export const AgentView = () => {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.agents.getMany.queryOptions());

  return (
    <div className='w-full'>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};


export const AgentViewLoading = () => {
    return (
        <LoadingState title="Loading state" description='still Loading' />
    );
};