
import { Button } from '@/components/ui/button';
import {  ChevronRightIcon,  } from 'lucide-react';
 import { authClient } from "@/lib/auth-client";
import Link from 'next/link';
import React from 'react'



export default function Header() {
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
 </div>
  )
}
