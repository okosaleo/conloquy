"use client";

import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import Header from "../components/header";
import { DataTable } from "@/components/data-table";
import DataPagination from "@/modules/agents/ui/components/data-pagination";
import { columns } from "@/modules/agents/ui/components/columns";
import { useAgentsFilters } from "@/modules/agents/hooks/use-agents-filters";
import { useRouter } from "next/navigation";

export default function HomeView() {
   const trpc = useTRPC();
   const router = useRouter();
     const [filters, setFilters ] = useAgentsFilters();
     const { data } = useSuspenseQuery(trpc.agents.getMany.queryOptions({
       ...filters,
     }));
   
   
   
  return (
   <div className="flex flex-col items-center justify-center p-4 w-full">
    <Header

     />
       <div className='w-full mt-4 p-4'>
        <h1 className="text-3xl font-semibold">Your Agents</h1>
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
