"use client";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import NewMeetingDialog from "./new-meetings-dialog";
import { useState } from "react";


export default function MeetingsListHeader() {
  const [isDialogOpen, setDialogOpen] = useState(false);

  return (
    <>
    <NewMeetingDialog
      open={isDialogOpen}
      onOpenChange={setDialogOpen}
    />
    <div className="py-4 px-4 md:px-8 flex flex-col gap-y-4">
        <div className="flex items-center justify-between">
            <h5 className="font-medium text-lg">My Meetings</h5>
            <Button onClick={() => setDialogOpen(true)}>
                <PlusIcon />
                New Metting
            </Button>
        </div>
        <div className="flex items-center gap-x-2 p-1">
         
        </div>
    </div>
    </>
  )
} 
