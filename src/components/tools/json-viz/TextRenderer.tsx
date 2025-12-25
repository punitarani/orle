"use client";

import React from "react";
import { isColorFormat, isURL } from "@/lib/tools/json-viz/utils";

interface TextRendererProps {
  children: React.ReactNode;
}

/**
 * Linkify URLs in text
 */
function Linkify({ text }: { text: string }) {
  const words = text.split(" ");

  return (
    <span>
      {words.map((word) => {
        const key = `${word}-${Math.random().toString(36).substring(2, 9)}`;
        return (
          <React.Fragment key={key}>
            {isURL(word) ? (
              <a
                href={word}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-blue-600 hover:text-blue-700"
                onClick={(e) => e.stopPropagation()}
              >
                {word}
              </a>
            ) : (
              <span>{word}</span>
            )}
            <span> </span>
          </React.Fragment>
        );
      })}
    </span>
  );
}

/**
 * TextRenderer component that handles special content types
 * - URLs: Converts to clickable links
 * - Colors: Shows color swatch
 * - Default: Renders as string
 */
export function TextRenderer({ children }: TextRendererProps) {
  const text = String(children ?? "");

  // Handle URLs
  if (isURL(text)) {
    return <Linkify text={text} />;
  }

  // Handle color formats
  if (isColorFormat(text)) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span
          className="inline-block size-3 rounded border border-muted-foreground/30"
          style={{ backgroundColor: text }}
        />
        {text}
      </span>
    );
  }

  // Default rendering
  return <>{text}</>;
}
