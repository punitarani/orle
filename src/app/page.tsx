import Link from "next/link";
import { HomeOmnibox } from "@/components/home/home-omnibox";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { tools } from "@/lib/tools/registry";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl space-y-10 sm:space-y-12">
      <Card className="relative overflow-hidden rounded-2xl border text-center sm:rounded-3xl">
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-background to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(90%_80%_at_50%_-10%,rgba(14,165,233,0.3),rgba(15,23,42,0))]" />
          <div className="absolute inset-0 bg-[radial-gradient(70%_45%_at_85%_20%,rgba(56,189,248,0.2),rgba(15,23,42,0))]" />
        </div>
        <CardContent className="relative z-10 space-y-5 px-5 py-10 sm:space-y-6 sm:px-10 sm:py-12">
          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground sm:text-xs sm:tracking-[0.3em]">
              orle.dev
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
              Find or build the tool you need.
            </h1>
            <p className="mx-auto max-w-xl text-sm text-muted-foreground sm:text-base">
              {tools.length}+ local-first utilities for encoding, formatting,
              and automation.
            </p>
          </div>

          <HomeOmnibox />
        </CardContent>
      </Card>

      <section className="space-y-8 sm:space-y-10">
        <div className="space-y-4">
          <h2 className="text-base font-semibold tracking-tight sm:text-lg">
            Popular tools
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ToolCard
              slug="json-format"
              name="JSON Formatter"
              description="Pretty print or minify JSON"
            />
            <ToolCard
              slug="base64-text"
              name="Base64 Encode/Decode"
              description="Convert text to and from Base64"
            />
            <ToolCard
              slug="uuid-generator"
              name="UUID Generator"
              description="Generate random UUID v4 identifiers"
            />
            <ToolCard
              slug="hash-text"
              name="Hash Generator"
              description="SHA-256, MD5, and more"
            />
            <ToolCard
              slug="url-encode"
              name="URL Encode/Decode"
              description="Encode or decode URL components"
            />
            <ToolCard
              slug="epoch-converter"
              name="Epoch Converter"
              description="Convert timestamps to dates"
            />
            <ToolCard
              slug="text-diff"
              name="Text Diff"
              description="Compare text side by side"
            />
            <ToolCard
              slug="color-converter"
              name="Color Converter"
              description="Convert hex, RGB, HSL"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function ToolCard({
  slug,
  name,
  description,
}: {
  slug: string;
  name: string;
  description: string;
}) {
  return (
    <Link href={`/tools/${slug}`}>
      <Card className="group h-full border-muted/70 bg-muted/20 transition hover:-translate-y-0.5 hover:bg-muted/40">
        <CardContent className="space-y-1 p-3">
          <CardTitle className="text-[13px]">{name}</CardTitle>
          <p className="text-[11px] text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
