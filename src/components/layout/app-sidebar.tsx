"use client";

import { ChevronRight, Sparkles, Trash2, Wand2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
import { deleteCustomTool, listCustomTools } from "@/lib/tools/custom-tools-db";
import { getToolsBySection, SECTIONS } from "@/lib/tools/registry";
import type { CustomToolDefinition } from "@/lib/tools/types";

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [customTools, setCustomTools] = useState<CustomToolDefinition[]>([]);

  // Load custom tools from IndexedDB
  useEffect(() => {
    async function loadCustomTools() {
      try {
        const tools = await listCustomTools();
        setCustomTools(tools);
      } catch (e) {
        console.error("Failed to load custom tools:", e);
      }
    }
    loadCustomTools();

    // Refresh when navigating to/from custom tools
    const handleFocus = () => loadCustomTools();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const handleDeleteCustomTool = async (
    e: React.MouseEvent,
    toolId: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    await deleteCustomTool(toolId);
    setCustomTools((prev) => prev.filter((t) => t.id !== toolId));
    if (pathname === `/tools/custom/${toolId}`) {
      router.push("/");
    }
  };

  const isCustomSectionActive =
    pathname.startsWith("/tools/custom/") || pathname === "/tools/generate";

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
        {/* Custom Tools Section - At the top for visibility */}
        <SidebarGroup className="p-0">
          <SidebarMenu>
            <Collapsible
              defaultOpen={isCustomSectionActive || customTools.length > 0}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton className="px-3">
                    <Wand2 className="size-4 text-primary" />
                    <span className="text-sm font-medium">Custom Tools</span>
                    <ChevronRight className="ml-auto size-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {/* Create Tool Link */}
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        asChild
                        isActive={pathname === "/tools/generate"}
                        size="sm"
                        className="text-primary hover:text-primary"
                      >
                        <Link href="/tools/generate">
                          <Sparkles className="size-3.5 mr-1" />
                          Generate New Tool
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>

                    {/* Custom Tools List */}
                    {customTools.map((tool) => {
                      const isToolActive =
                        pathname === `/tools/custom/${tool.id}`;
                      return (
                        <SidebarMenuSubItem
                          key={tool.id}
                          className="group/item"
                        >
                          <SidebarMenuSubButton
                            asChild
                            isActive={isToolActive}
                            size="sm"
                          >
                            <Link href={`/tools/custom/${tool.id}`}>
                              {tool.name}
                            </Link>
                          </SidebarMenuSubButton>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteCustomTool(e, tool.id)}
                            className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-all"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </SidebarMenuSubItem>
                      );
                    })}

                    {customTools.length === 0 && (
                      <SidebarMenuSubItem>
                        <span className="text-xs text-muted-foreground px-2 py-1">
                          No custom tools yet
                        </span>
                      </SidebarMenuSubItem>
                    )}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          </SidebarMenu>
        </SidebarGroup>

        {/* Divider */}
        <div className="mx-3 my-2 h-px bg-sidebar-border" />

        {/* Built-in Tools Sections */}
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
