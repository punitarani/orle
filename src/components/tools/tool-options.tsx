"use client";

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

type ToolOptionsProps = {
  options: ToolOption[];
  values: Record<string, unknown>;
  onChange: (id: string, value: unknown) => void;
};

export function ToolOptions({ options, values, onChange }: ToolOptionsProps) {
  if (options.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-muted/30 p-3">
      {options.map((option) => (
        <div key={option.id} className="flex items-center gap-2">
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
            />
          )}
          {option.type === "select" && option.options && (
            <Select
              value={String(values[option.id] ?? option.default)}
              onValueChange={(val) => onChange(option.id, val)}
            >
              <SelectTrigger className="h-8 w-auto min-w-[120px]">
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
              className="h-8 w-20"
            />
          )}
          {option.type === "text" && (
            <Input
              id={option.id}
              type="text"
              value={String(values[option.id] ?? option.default)}
              onChange={(e) => onChange(option.id, e.target.value)}
              className="h-8 w-32"
            />
          )}
        </div>
      ))}
    </div>
  );
}
