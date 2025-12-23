"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { ToolOption } from "@/lib/tools/types";
import { cn } from "@/lib/utils";

type ToolOptionsProps = {
  options: ToolOption[];
  values: Record<string, unknown>;
  onChange: (id: string, value: unknown) => void;
};

export function ToolOptions({ options, values, onChange }: ToolOptionsProps) {
  const [isOpen, setIsOpen] = useState(true);

  if (options.length === 0) return null;

  // Show inline on desktop, collapsible on mobile
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-lg border bg-muted/30">
        {/* Mobile header - collapsible */}
        <CollapsibleTrigger className="flex w-full items-center justify-between p-3 md:hidden">
          <span className="text-sm font-medium">
            Options ({options.length})
          </span>
          <ChevronDown
            className={cn(
              "size-4 transition-transform",
              isOpen && "rotate-180",
            )}
          />
        </CollapsibleTrigger>

        {/* Desktop view - always visible */}
        <div className="hidden md:block">
          <OptionsGrid options={options} values={values} onChange={onChange} />
        </div>

        {/* Mobile view - collapsible */}
        <CollapsibleContent className="md:hidden">
          <div className="border-t">
            <OptionsGrid
              options={options}
              values={values}
              onChange={onChange}
            />
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function OptionsGrid({
  options,
  values,
  onChange,
}: {
  options: ToolOption[];
  values: Record<string, unknown>;
  onChange: (id: string, value: unknown) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 p-3">
      {options.map((option) => (
        <div
          key={option.id}
          className="flex items-center gap-2 min-w-0 flex-shrink-0"
        >
          <Label
            htmlFor={option.id}
            className="text-sm font-normal text-muted-foreground whitespace-nowrap"
          >
            {option.label}
          </Label>
          {option.type === "toggle" && (
            <Switch
              id={option.id}
              checked={Boolean(values[option.id])}
              onCheckedChange={(checked) => onChange(option.id, checked)}
              className="flex-shrink-0"
            />
          )}
          {option.type === "select" && option.options && (
            <Select
              value={String(values[option.id] ?? option.default)}
              onValueChange={(val) => onChange(option.id, val)}
            >
              <SelectTrigger className="h-9 w-auto min-w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {option.options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {option.type === "number" && (
            <Input
              id={option.id}
              type="number"
              value={String(values[option.id] ?? option.default)}
              onChange={(e) => onChange(option.id, Number(e.target.value))}
              min={option.min}
              max={option.max}
              step={option.step}
              className="h-9 w-20"
            />
          )}
          {option.type === "text" && (
            <Input
              id={option.id}
              type="text"
              value={String(values[option.id] ?? option.default)}
              onChange={(e) => onChange(option.id, e.target.value)}
              className="h-9 w-32 sm:w-40"
              placeholder={option.label}
            />
          )}
        </div>
      ))}
    </div>
  );
}
