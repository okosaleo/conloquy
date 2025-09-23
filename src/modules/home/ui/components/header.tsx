import GeneratedAvatar from '@/components/generated-avatar';
import { Button } from '@/components/ui/button';
import { BotIcon, ChevronRightIcon, VideoIcon } from 'lucide-react';
 import { authClient } from "@/lib/auth-client";
import Link from 'next/link';
import React from 'react'

interface HeaderProps {
  totalAgents?: number;
  totalMeetings?: number;
  mostActiveAgent?: {
    id: string;
    name: string;
    meetingCount: number;
  } | null;
  durationBreakdown?: {
    range: string;
    min: number;
    max: number;
    count: number;
  }[];

}

export default function Header({ totalAgents, totalMeetings, mostActiveAgent, durationBreakdown }: HeaderProps) {
  const { data } = authClient.useSession();
  return (
    <div className="flex flex-col gap-4 w-full justify-start items-start">
       <div className="bg-foreground  w-full lg:h-56 h-64 rounded-md p-2">
       <div className="text-background flex flex-col justify-between gap-3 p-2 ">
          <p className="text-sm font-semibold">Welcome, {data?.user.name}</p>
            <p className="md:text-3xl text-2xl font-semibold lg:mt-4 mt-1">Build Agents, Start Conversations, Start Talking, <br />Start Meetings.</p>
             <Button asChild className="mt-4 lg:w-1/4 w-1/2 bg-background text-foreground hover:bg-background/90 group">
              <Link href="/agents" className="flex items-center justify-between pr-1"> 
               <p className="flex-1">Create Agent</p>
                 <div className="w-8 h-8 rounded-md bg-foreground flex items-center justify-center">
                 <ChevronRightIcon className="size-4 text-background transition-transform duration-200 group-hover:rotate-45" />
               </div>
          </Link>
         </Button>
       </div>
      </div>
        {(totalAgents! > 0 || totalMeetings! > 0) && (
          <div className='w-full flex lg:flex-row items-start flex-col lg:gap-4 gap-2 '>
    <div className='flex items-center lg:gap-4 gap-2 w-full lg:w-2/3'>
        <div className='bg-white border-primary/20 border-[0.2px] rounded-md md:p-4 p-1 w-1/2 h-20 flex gap-2 items-center'>
            <div className='bg-foreground rounded-md flex items-center justify-center lg:h-16 h-16 lg:w-1/4 w-1/2'>
                <BotIcon className='size-7 text-background' />
            </div>
            <div className="flex flex-col justify-end items-end lg:w-3/4 w-1/2">
                <div className='border-b w-full border-foreground mb-1'>
                    <p className='lg:text-lg text-[11px] lg:font-semibold font-medium text-muted-foreground mb-1'>Total Agents</p>
                </div>
                <p className='lg:text-lg text-[11px] font-semibold text-lg'>{totalAgents ?? 0}</p>
            </div>
        </div>
        <div className='bg-white border-primary/20 border-[0.2px] rounded-md md:p-4 p-1 w-1/2 h-20 flex gap-2 items-center'> 
            <div className='bg-foreground rounded-md flex items-center justify-center lg:h-16 h-16 lg:w-1/4 w-1/2'>
                <VideoIcon className='size-7 text-background' />
            </div>
            <div className="flex flex-col justify-end items-end lg:w-3/4 w-1/2">
                <div className='border-b w-full border-foreground mb-1'>
                    <p className='lg:text-lg text-[11px] lg:font-semibold font-medium text-muted-foreground mb-1'>Total Meetings</p>
                </div>
                <p className='lg:text-lg text-[11px] font-semibold text-lg'>{totalMeetings ?? 0}</p>
            </div>
        </div>
    </div>
     {mostActiveAgent && (
    <div className=' lg:w-1/3 w-full h-72 rounded-md border-primary/20 border-[1px] flex flex-col p-1 bg-white'>
        <div className='flex items-center justify-center mt-3'>
          <p className='font-semibold'>Favourite Agent</p>
        </div>
        <div>
          <GeneratedAvatar seed={mostActiveAgent.name} variant="openPeeps" className="w-28 h-28 rounded-full mx-auto mt-2 bg-gradient-to-r from-primary/5 to-primary/20  border-primary/20 border-[0.2px]" />
          <div className='flex items-center justify-center mt-2  flex-col'>
          <p className='md:text-lg text-sm font-medium'>
            <span className='uppercase font-semibold'>{mostActiveAgent.name }</span> is still here!</p>
            <p className='lg:text-xs text-[10px] font-light text-muted-foreground'>You currently have {mostActiveAgent.meetingCount} meetings with this agent</p>
          </div>
        </div>
    </div>
)}
    </div>
)}

 </div>
  )
}
