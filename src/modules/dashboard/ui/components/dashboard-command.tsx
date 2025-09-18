import GeneratedAvatar from "@/components/generated-avatar";
import { CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandResponsiveDialog } from "@/components/ui/command"
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useState } from "react"

interface Props {
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>
}

export default function DashboardCommand({open, setOpen}: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("")

  const trpc = useTRPC();
  const meetings = useQuery(
    trpc.meetings.getMany.queryOptions({
      search,
      pageSize: 100,
    })
  );

   const agents = useQuery(
    trpc.agents.getMany.queryOptions({
      search,
      pageSize: 100,
    })
  );


  return (
    <CommandResponsiveDialog shouldFilter={false} open={open} onOpenChange={setOpen}>
        <CommandInput
        placeholder="Find a meeting or agents"
        value={search}
        onValueChange={(text) => setSearch(text)}
         />
        <CommandList>
          <CommandGroup heading="Meetings">
            <CommandEmpty>
              <span className="text-muted-foreground text-sm">
                No meetings found.
                </span>
            </CommandEmpty>
            {meetings.data?.items.map((meeting) => (
              <CommandItem 
              key={meeting.id}
              onSelect={() => {
                router.push(`/meetings/${meeting.id}`);
                setOpen(false);
              }}
              >
                {meeting.name}
              </CommandItem>
            ))}
            </CommandGroup>
            <CommandGroup heading="Meetings">
            <CommandEmpty>
              <span className="text-muted-foreground text-sm">
                No agents found.
                </span>
            </CommandEmpty>
            {agents.data?.items.map((agent) => (
              <CommandItem 
              key={agent.id}
              onSelect={() => {
                router.push(`/meetings/${agent.id}`);
                setOpen(false);
              }}
              >
                <GeneratedAvatar seed={agent.name} 
                 variant="openPeeps"
                 className="size-5"
                  />
                {agent.name}
              </CommandItem>
            ))}
            </CommandGroup>
        </CommandList>
    </CommandResponsiveDialog>
  )
}
