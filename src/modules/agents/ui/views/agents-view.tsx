'use client';
import { LoadingState } from '@/components/loading-state';
import { useTRPC } from '@/trpc/client';
import { useSuspenseQuery } from '@tanstack/react-query';
import { DataTable } from '../components/data-table';
import { columns } from '../components/columns';
import { EmptyState } from '@/components/empty-state';
import { useAgentsFilters } from '../../hooks/use-agents-filters';
import DataPagination from '../components/data-pagination';
import { ErrorState } from '@/components/error-state';
import { useRouter } from 'next/navigation';

export const AgentView = () => {
  const router = useRouter();
  const [filters, setFilters ] = useAgentsFilters();
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.agents.getMany.queryOptions({
    ...filters,
  }));

  return (
    <div className='flex-1 pb-4 px-4 md:px-8 flex flex-col gap-y-4'>
      <DataTable 
      data={data.items} 
      columns={columns}
      onRowClick={(row) => router.push(`/agents/${row.id}`)} />
      {data.items.length > 0 && (
        <DataPagination
          page={filters.page}
          totalPages={data.totalPages}
          onPageChange={(page) => setFilters({ page })}
        />
      )}
      {data.items.length === 0 && (
        <EmptyState
        title='Create your first agent'
        description='Create an agent to join your meetings. Each agent will follow instructions and can interact with participants during the meeting.'
        />
      )}
    </div>
  );
};


export const AgentViewLoading = () => {
    return (
        <LoadingState title="Loading agents" description='Be calm we are getting your agents' />
    );
};

export const AgentViewError = () => {
    return (
        <ErrorState title='Error Loading Agents' description='Something went wrong' />
    );
};