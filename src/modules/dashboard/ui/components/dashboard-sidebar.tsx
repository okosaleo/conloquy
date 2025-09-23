"use client";

import { Separator } from "@/components/ui/separator";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarGroup,
    SidebarGroupContent
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { BotIcon, LayoutDashboardIcon, StarIcon, VideoIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import DashboardUserButton from "./dashbaord-user-button";
import DashboardTrial from "./dashboard-trial";

const firstSection = [
  {
        icon: LayoutDashboardIcon,
        label: "Home",
        href: "/",
    },
    {
        icon: VideoIcon,
        label: "Meetings",
        href: "/meetings",
    },
    {
        icon: BotIcon,
        label: "Agents",
        href: "/agents",
    }
]

const secondSection = [
    {
        icon: StarIcon,
        label: "Upgrade",
        href: "/upgrade",
    },
]

export default function DashboardSidebar() {
    const pathname = usePathname()
  return (
    <Sidebar>
        <SidebarHeader className="text-sidebar-accent-foreground">
            <Link href="/" className="flex items-start justify-center mt-[-24px]">
            <Image src="/conloquy.png" priority alt="Conloquy Logo" height={100} width={100}  />
            </Link>
        </SidebarHeader>
        <div className=" mt-[-24px]">
            <Separator  />
        </div>
        <SidebarContent>
            <SidebarGroup>
                <SidebarGroupContent>
                   <SidebarMenu>
         {firstSection.map((item) => {
       const isActive = pathname === item.href;
  return (
    <SidebarMenuItem key={item.href}>
      <SidebarMenuButton
        asChild
        className={cn(
          "h-10 border-transparent",
          isActive
            ? "bg-gradient-to-r from-primary/5 to-primary/20  border-primary/20 border-[0.2px]" // Active link background
            : "hover:bg-gradient-to-l hover:from-primary/10 hover:via-primary/5 hover:to-transparent hover:border-primary/60" // Normal hover effect
        )}
      >
            <Link href={item.href} >
                <item.icon className="size-5 " />
                     <span className="text-sm font-medium tracking-tight">
                         {item.label}
                      </span>
             </Link>
                </SidebarMenuButton>
                </SidebarMenuItem>
  );
})}
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>
            <div className=" px-4 py-2">
            <Separator  />
        </div>
             <SidebarGroup>
                <SidebarGroupContent>
                   <SidebarMenu>
         {secondSection.map((item) => {
       const isActive = pathname === item.href;
  return (
    <SidebarMenuItem key={item.href}>
      <SidebarMenuButton
        asChild
        className={cn(
          "h-10 border-transparent",
          isActive
            ? "bg-gradient-to-r from-primary/5 to-primary/20  border-primary/20 border-[0.2px]" // Active link background
            : "hover:bg-gradient-to-l hover:from-primary/10 hover:via-primary/5 hover:to-transparent hover:border-primary/60" // Normal hover effect
        )}
      >
            <Link href={item.href} >
                <item.icon className="size-5 " />
                     <span className="text-sm font-medium tracking-tight">
                         {item.label}
                      </span>
             </Link>
                </SidebarMenuButton>
                </SidebarMenuItem>
  );
})}
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className=" ">
          <DashboardTrial />
            <DashboardUserButton />
        </SidebarFooter>
    </Sidebar>
  )
}
