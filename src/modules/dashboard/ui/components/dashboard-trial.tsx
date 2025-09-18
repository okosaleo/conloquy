import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { MAX_FREE_AGENTS, MAX_FREE_MEETINGS } from "@/modules/premium/constants";
import { RocketIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

export default function DashboardTrial() {
    const trpc = useTRPC();
    const {data} =useQuery(trpc.premium.getFreeUsage.queryOptions())

    if (!data) return null

  return (
    <div className="border border-border rounded-lg w-full p-1 bg-gradient-to-r from-primary/5 to-primary/20 flex flex-col gap-y-2">
        <div className="p-3 flx flex-col gap-y-4">
            <div className="flex items-center gap-2">
                <RocketIcon className="size-4" />
                <p className="text-xs font-medium">Free Trial</p>
            </div>
            <div className="flex flex-col gap-y-2 mt-1">
                <p className="text-xs">
                    {data.agentCount}/{MAX_FREE_AGENTS} Agents
                </p>
                <Progress value={(data.agentCount / MAX_FREE_AGENTS) * 100} />
            </div>
            <div className="flex flex-col gap-y-2 mt-2">
                <p className="text-xs">
                    {data.meetingsCount}/{MAX_FREE_MEETINGS} Meetings
                </p>
                <Progress value={(data.meetingsCount / MAX_FREE_MEETINGS) * 100} />
            </div>
        </div>
        <Button asChild>
            <Link href="/upgrade">Upgrade</Link>
        </Button>
    </div>
  )
}
