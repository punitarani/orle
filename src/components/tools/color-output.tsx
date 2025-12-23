"use client";

import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClipboard } from "@/hooks/use-clipboard";
import type { ColorResultData } from "@/lib/tools/types";
import { cn } from "@/lib/utils";

type ColorOutputProps = {
  data: ColorResultData;
  className?: string;
};

export function ColorOutput({ data, className }: ColorOutputProps) {
  const { copied, copy } = useClipboard();

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Color Preview */}
      {data.preview && (
        <div className="rounded-lg border overflow-hidden">
          {/* Swatch preview */}
          {data.preview.type === "swatch" && (
            <div className="flex">
              {data.preview.colors?.map((color) => (
                <div
                  key={color}
                  className="h-20 flex-1"
                  style={{ backgroundColor: color }}
                />
              )) || (
                <div
                  className="h-20 w-full"
                  style={{ backgroundColor: data.hex }}
                />
              )}
            </div>
          )}

          {/* Gradient preview */}
          {data.preview.type === "gradient" && data.preview.css && (
            <div
              className="h-20 w-full"
              style={{ background: data.preview.css }}
            />
          )}

          {/* Contrast preview */}
          {data.preview.type === "contrast" && data.preview.colors && (
            <div className="grid grid-cols-2 h-24">
              <div
                className="flex items-center justify-center p-4"
                style={{
                  backgroundColor: data.preview.colors[0],
                  color: data.preview.colors[1],
                }}
              >
                <span className="text-lg font-semibold">Aa</span>
              </div>
              <div
                className="flex items-center justify-center p-4"
                style={{
                  backgroundColor: data.preview.colors[1],
                  color: data.preview.colors[0],
                }}
              >
                <span className="text-lg font-semibold">Aa</span>
              </div>
            </div>
          )}

          {/* Box shadow preview */}
          {data.preview.type === "shadow" && data.preview.css && (
            <div className="p-8 flex items-center justify-center bg-muted/30">
              <div
                className="size-24 rounded-lg bg-background"
                style={{ boxShadow: data.preview.css }}
              />
            </div>
          )}
        </div>
      )}

      {/* Color info grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <ColorValue label="HEX" value={data.hex} onCopy={copy} />
        <ColorValue
          label="RGB"
          value={`rgb(${data.rgb.r}, ${data.rgb.g}, ${data.rgb.b})`}
          onCopy={copy}
        />
        <ColorValue
          label="HSL"
          value={`hsl(${data.hsl.h}, ${data.hsl.s}%, ${data.hsl.l}%)`}
          onCopy={copy}
        />
      </div>

      {/* Full text output */}
      {data.textOutput && (
        <div className="rounded-lg border bg-muted/20 p-3 font-mono text-sm whitespace-pre-wrap overflow-auto max-h-[200px]">
          {data.textOutput}
        </div>
      )}

      {/* Copy all button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => copy(data.textOutput)}
        className="self-start"
      >
        <Copy className="mr-2 size-4" />
        {copied ? "Copied!" : "Copy All"}
      </Button>
    </div>
  );
}

function ColorValue({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: (text: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onCopy(value)}
      className="flex flex-col gap-1 rounded-lg border bg-muted/20 p-2 text-left hover:bg-muted/40 transition-colors"
    >
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-mono truncate">{value}</span>
    </button>
  );
}
