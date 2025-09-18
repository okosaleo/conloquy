import { authClient } from '@/lib/auth-client'
import {
DropdownMenu,
DropdownMenuContent,
DropdownMenuItem,
DropdownMenuLabel,
DropdownMenuSeparator,
DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

import { 
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger

 } from '@/components/ui/drawer';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import GeneratedAvatar from '@/components/generated-avatar';
import { ChevronDownIcon, CreditCardIcon, LogOutIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';

export default function DashboardUserButton() {
    const router = useRouter()
    const {data, isPending} = authClient.useSession();
    const isMobile = useIsMobile();

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


    if (isMobile) {
        return (
            <Drawer>
                <DrawerTrigger className='rounded-lg border-border/10 p-3 gap-2 border w-full flex items-center justify-between bg-foreground hover:bg-foreground/50 overflow-hidden '>
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
                </DrawerTrigger>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle>{data.user.name}</DrawerTitle>
                        <DrawerDescription>{data.user.email}</DrawerDescription>
                    </DrawerHeader>
                    <DrawerFooter>
                        <Button variant='outline' onClick={() => authClient.customer.portal()}>
                            <CreditCardIcon className='size-4'/>
                            Billing
                        </Button>
                        <Button onClick={onLogout}>
                             Logout 
                <LogOutIcon className='size-4' />
                        </Button>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        )
    }
  return (
    <DropdownMenu>
        <DropdownMenuTrigger className='rounded-lg border-border/10 p-3 gap-2 border w-full flex items-center justify-between bg-foreground hover:bg-foreground/50 overflow-hidden '>
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
            <DropdownMenuItem
            onClick={() => authClient.customer.portal()}
             className='cursor-pointer flex items-center justify-between'>
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
