"use client";

import { Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

export function HeaderSidebarTrigger() {
  const { state } = useSidebar();
  const isMobile = useIsMobile();
  const isCollapsed = state === "collapsed";

  // Always show on mobile, only show when collapsed on desktop
  if (!isMobile && !isCollapsed) return null;

  return <SidebarTrigger className="size-8" />;
}

export function GithubLink() {
  return (
    <Button variant="ghost" size="icon" className="size-8" asChild>
      <a
        href="https://github.com/punitarani/orle"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Github className="size-4" />
        <span className="sr-only">GitHub</span>
      </a>
    </Button>
  );
}
