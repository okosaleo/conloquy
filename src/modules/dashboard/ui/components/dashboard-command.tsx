import { CommandInput, CommandItem, CommandList, CommandResponsiveDialog } from "@/components/ui/command"
import { Dispatch, SetStateAction } from "react"

interface Props {
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>
}

export default function DashboardCommand({open, setOpen}: Props) {
  return (
    <CommandResponsiveDialog open={open} onOpenChange={setOpen}>
        <CommandInput
        placeholder="Find a meeting or agents" />
        <CommandList>
            <CommandItem>
                Test
            </CommandItem>
        </CommandList>
    </CommandResponsiveDialog>
  )
}
