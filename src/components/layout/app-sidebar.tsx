"use client";

import {
  ArrowLeftRight,
  Binary,
  Calculator,
  ChevronRight,
  Clock,
  Database,
  FileText,
  Globe,
  Hash,
  Image as ImageIcon,
  Info,
  Link as LinkIcon,
  Lock,
  Palette,
  Search,
  Sparkles,
  Terminal,
  Trash2,
  Type,
  Wand2,
} from "lucide-react";
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
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
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
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { deleteCustomTool, listCustomTools } from "@/lib/tools/custom-tools-db";
import { getToolsBySection } from "@/lib/tools/manifest";
import { SECTION_META } from "@/lib/tools/section-meta";
import type { CustomToolDefinition } from "@/lib/tools/types";

const SECTION_ICONS = {
  Link: LinkIcon,
  Binary,
  Type,
  FileText,
  ArrowLeftRight,
  Lock,
  Hash,
  Clock,
  Calculator,
  Globe,
  Image: ImageIcon,
  Palette,
  Terminal,
  Search,
  Database,
} as const;

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

  const _isCustomSectionActive =
    pathname.startsWith("/tools/custom/") || pathname === "/tools/generate";

  return (
    <Sidebar>
      <SidebarHeader className="h-14 border-b border-sidebar-border px-3">
        <div className="flex h-full items-center justify-between">
          <Link href="/" prefetch={false} className="flex items-center gap-2.5">
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
            <Collapsible defaultOpen className="group/collapsible">
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
                        <Link href="/tools/generate" prefetch={false}>
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
                            <Link
                              href={`/tools/custom/${tool.id}`}
                              prefetch={false}
                            >
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
        <SidebarSeparator className="mx-0 my-2 w-full" />

        {/* Built-in Tools Sections */}
        <SidebarGroup className="p-0">
          <SidebarMenu>
            {SECTION_META.map((section) => {
              const tools = getToolsBySection(section.id);
              const iconKey = section.icon as keyof typeof SECTION_ICONS;
              const Icon = SECTION_ICONS[iconKey] ?? Hash;
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
                                <Link
                                  href={`/tools/${tool.slug}`}
                                  prefetch={false}
                                >
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
          <HoverCard openDelay={100}>
            <HoverCardTrigger asChild>
              <button
                type="button"
                aria-label="How client-side processing works"
                className="ml-0.5 inline-flex size-4 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground"
              >
                <Info className="size-3" />
              </button>
            </HoverCardTrigger>
            <HoverCardContent
              side="top"
              align="center"
              className="w-64 text-xs leading-snug"
            >
              Only AI requests are server-side. Everything else runs client-side
              in your browser after that.
            </HoverCardContent>
          </HoverCard>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
