"use client";

import { ChevronRight } from "lucide-react";
import Image from "next/image";
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
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { getToolsBySection, SECTIONS } from "@/lib/tools/registry";

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="h-14 border-b border-sidebar-border px-3">
        <div className="flex h-full items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="orle.dev logo"
              width={32}
              height={32}
              className="size-8 rounded-md"
            />
            <div className="flex flex-col gap-0">
              <span className="text-sm font-semibold leading-tight tracking-tight">
                orle.dev
              </span>
              <span className="text-[10px] leading-tight text-muted-foreground">
                Developer Tools
              </span>
            </div>
          </Link>
          <SidebarTrigger className="size-8" />
        </div>
      </SidebarHeader>
      <SidebarContent className="gap-0 py-2">
        <SidebarGroup className="p-0">
          <SidebarMenu>
            {SECTIONS.map((section) => {
              const tools = getToolsBySection(section.id);
              const Icon = section.icon;
              const isActive = tools.some(
                (t) => pathname === `/tools/${t.slug}`,
              );

              return (
                <Collapsible
                  key={section.id}
                  defaultOpen={isActive}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="px-3">
                        <Icon className="size-4" />
                        <span className="text-sm font-medium">
                          {section.name}
                        </span>
                        <ChevronRight className="ml-auto size-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {tools.map((tool) => {
                          const isToolActive =
                            pathname === `/tools/${tool.slug}`;
                          return (
                            <SidebarMenuSubItem key={tool.slug}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={isToolActive}
                                size="sm"
                              >
                                <Link href={`/tools/${tool.slug}`}>
                                  {tool.name}
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border px-2 py-1.5">
        <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
          <span className="flex size-1.5 rounded-full bg-emerald-500" />
          <span>100% client-side • No telemetry</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
