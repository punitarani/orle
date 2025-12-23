"use client";

import { ChevronDown, Wrench } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { getToolsBySection, SECTIONS } from "@/lib/tools/registry";

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-2 px-2 py-1.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Wrench className="size-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold tracking-tight">orle.dev</span>
            <span className="text-[10px] text-muted-foreground">
              Developer Tools
            </span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent className="py-2">
        {SECTIONS.map((section) => {
          const tools = getToolsBySection(section.id);
          const Icon = section.icon;
          const isActive = tools.some((t) => pathname === `/tools/${t.slug}`);

          return (
            <Collapsible
              key={section.id}
              defaultOpen={isActive}
              className="group/collapsible"
            >
              <SidebarGroup className="py-0">
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel className="flex cursor-pointer items-center justify-between hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md px-2">
                    <div className="flex items-center gap-2">
                      <Icon className="size-4 text-muted-foreground" />
                      <span>{section.name}</span>
                    </div>
                    <ChevronDown className="size-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {tools.map((tool) => {
                        const isToolActive = pathname === `/tools/${tool.slug}`;
                        return (
                          <SidebarMenuItem key={tool.slug}>
                            <SidebarMenuButton asChild isActive={isToolActive}>
                              <Link href={`/tools/${tool.slug}`}>
                                <span className="truncate">{tool.name}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          );
        })}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center justify-center gap-1 px-2 py-2 text-[10px] text-muted-foreground">
          <span className="flex size-2 rounded-full bg-emerald-500" />
          <span>100% client-side • No telemetry</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
