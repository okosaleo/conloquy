import { authClient } from '@/lib/auth-client'
import {
DropdownMenu,
DropdownMenuContent,
DropdownMenuItem,
DropdownMenuLabel,
DropdownMenuSeparator,
DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import GeneratedAvatar from '@/components/generated-avatar';
import { ChevronDownIcon, CreditCardIcon, LogOutIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DashboardUserButton() {
    const router = useRouter()
    const {data, isPending} = authClient.useSession();

    const onLogout = async () => {
         authClient.signOut({
        fetchOptions:{
            onSuccess: () => {
                router.push('/sign-in')
            }
        }
    })
    }

    if(isPending || !data?.user) {
        return null
    }
  return (
    <DropdownMenu>
        <DropdownMenuTrigger className='rounded-lg border-border/10 p-3 border w-full flex items-center justify-between bg-foreground hover:bg-foreground/50 overflow-hidden '>
        {data.user.image ? (
            <Avatar>
                <AvatarImage src={data.user.image} />
            </Avatar>
        ): ( <GeneratedAvatar
         seed={data.user.name}
         variant='initials'
         className='size-9 mr-3' />)}
         <div className='flex flex-col gap-0.5 text-left overflow-hidden flex-1 min-w-0 text-background'>
            <p className='text-sm truncate w-full'> 
                {data.user.name}
            </p>
            <p className='text-[10px] truncate w-full'>
                {data.user.email}
            </p>
         </div>
         <ChevronDownIcon className='size-4 shrink-0 text-background' />
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' side='right' className='w-72 bg-foreground/90 text-background'>
            <DropdownMenuLabel>
                <div className='flex flex-col gap-1'>
                    <span className='font-medium truncate'>{data.user.name}</span>
                    <span className='font-normal text-muted-foreground truncate text-sm'>{data.user.email}</span>
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className='cursor-pointer flex items-center justify-between'>
                Billing 
                <CreditCardIcon className='size-4'/>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onLogout} className='cursor-pointer flex items-center justify-between'>
                Logout 
                <LogOutIcon className='size-4' />
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
  )
}
