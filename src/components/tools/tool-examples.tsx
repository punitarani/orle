"use client";

import { Play } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import type { ToolExample } from "@/lib/tools/types";

type ToolExamplesProps = {
  examples: ToolExample[];
  onLoad: (example: ToolExample) => void;
};

export function ToolExamples({ examples, onLoad }: ToolExamplesProps) {
  if (examples.length === 0) return null;

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="examples" className="border-b-0">
        <AccordionTrigger className="text-sm text-muted-foreground hover:no-underline">
          Examples ({examples.length})
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2">
            {examples.map((example) => (
              <div
                key={`${example.name ?? "example"}-${example.input}-${example.output ?? ""}`}
                className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3"
              >
                <div className="flex-1 space-y-1">
                  {example.name && (
                    <p className="text-sm font-medium">{example.name}</p>
                  )}
                  <p className="font-mono text-xs text-muted-foreground line-clamp-2">
                    {example.input}
                  </p>
                  {example.output && (
                    <p className="font-mono text-xs text-emerald-600 dark:text-emerald-400 line-clamp-2">
                      → {example.output}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0"
                  onClick={() => onLoad(example)}
                >
                  <Play className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
