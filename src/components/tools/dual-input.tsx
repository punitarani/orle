"use client";

import { ArrowRightLeft } from "lucide-react";
import { useId } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type DualInputProps = {
  value1: string;
  value2: string;
  onChange1: (value: string) => void;
  onChange2: (value: string) => void;
  label1?: string;
  label2?: string;
  placeholder1?: string;
  placeholder2?: string;
  className?: string;
};

export function DualInput({
  value1,
  value2,
  onChange1,
  onChange2,
  label1 = "Original",
  label2 = "Modified",
  placeholder1 = "Enter original text...",
  placeholder2 = "Enter modified text...",
  className,
}: DualInputProps) {
  const id = useId();
  const id1 = `${id}-input1`;
  const id2 = `${id}-input2`;

  const handleSwap = () => {
    const temp = value1;
    onChange1(value2);
    onChange2(temp);
  };

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Header with swap button */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Enter two texts to compare
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSwap}
          className="h-7 gap-1.5 text-xs"
          disabled={!value1 && !value2}
        >
          <ArrowRightLeft className="size-3" />
          Swap
        </Button>
      </div>

      {/* Side-by-side inputs on desktop, stacked on mobile */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Left/Original */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor={id1}
            className="text-sm font-medium text-muted-foreground"
          >
            {label1}
          </label>
          <Textarea
            id={id1}
            value={value1}
            onChange={(e) => onChange1(e.target.value)}
            placeholder={placeholder1}
            className="min-h-[200px] resize-y font-mono text-sm"
          />
        </div>

        {/* Right/Modified */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor={id2}
            className="text-sm font-medium text-muted-foreground"
          >
            {label2}
          </label>
          <Textarea
            id={id2}
            value={value2}
            onChange={(e) => onChange2(e.target.value)}
            placeholder={placeholder2}
            className="min-h-[200px] resize-y font-mono text-sm"
          />
        </div>
      </div>

      {/* Character counts */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{value1.length} characters</span>
        <span>{value2.length} characters</span>
      </div>
    </div>
  );
}
