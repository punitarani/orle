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

  // Mobile-first, collapsible. Desktop always-visible.
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-lg border bg-muted/30">
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

        <div className="hidden md:block">
          <OptionsGrid options={options} values={values} onChange={onChange} />
        </div>

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
    <div className="grid gap-3 p-3 md:flex md:flex-wrap md:items-center md:gap-x-6 md:gap-y-3">
      {options.map((option) => (
        <div
          key={option.id}
          className="flex min-w-0 items-center justify-between gap-3 md:justify-start md:gap-2 md:flex-shrink-0"
        >
          <Label
            htmlFor={option.id}
            className="min-w-0 text-sm font-normal text-muted-foreground md:whitespace-nowrap"
          >
            {option.label}
          </Label>

          <div className="flex shrink-0 items-center">
            {option.type === "toggle" && (
              <Switch
                id={option.id}
                checked={Boolean(values[option.id])}
                onCheckedChange={(checked) => onChange(option.id, checked)}
                className="shrink-0"
              />
            )}

            {option.type === "select" && option.options && (
              <Select
                value={String(values[option.id] ?? option.default)}
                onValueChange={(val) => onChange(option.id, val)}
              >
                <SelectTrigger className="h-9 w-[140px] md:w-auto md:min-w-[100px]">
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
                className="h-9 w-[110px] md:w-20"
              />
            )}

            {option.type === "text" && (
              <Input
                id={option.id}
                type="text"
                value={String(values[option.id] ?? option.default)}
                onChange={(e) => onChange(option.id, e.target.value)}
                className="h-9 w-[160px] md:w-40"
                placeholder={option.label}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
