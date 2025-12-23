"use client";

import { Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";

export function HeaderSidebarTrigger() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  if (!isCollapsed) return null;

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
