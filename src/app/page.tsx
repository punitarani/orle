import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getToolsBySection, SECTIONS, tools } from "@/lib/tools/registry";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Hero */}
      <div className="space-y-3 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          Developer Tools
        </h1>
        <p className="mx-auto max-w-xl text-base text-muted-foreground sm:text-lg">
          {tools.length}+ tools for encoding, hashing, formatting, and more.
        </p>
        <p className="mx-auto flex items-center justify-center gap-2 text-sm text-muted-foreground sm:text-base">
          <span className="size-2 shrink-0 rounded-full bg-emerald-500" />
          <span>100% client-side — no data leaves your machine</span>
        </p>
      </div>

      {/* Featured Tools */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ToolCard
          slug="base64-text"
          name="Base64 Encode/Decode"
          description="Convert text to and from Base64"
        />
        <ToolCard
          slug="json-format"
          name="JSON Formatter"
          description="Pretty print or minify JSON"
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
          slug="epoch-converter"
          name="Epoch Converter"
          description="Unix timestamps to dates"
        />
        <ToolCard
          slug="url-encode"
          name="URL Encode/Decode"
          description="Encode or decode URL components"
        />
      </div>

      {/* All Sections */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">All Tools</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((section) => {
            const sectionTools = getToolsBySection(section.id);
            const Icon = section.icon;

            return (
              <Card key={section.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="size-5 text-muted-foreground" />
                    <CardTitle className="text-base">{section.name}</CardTitle>
                  </div>
                  {section.description && (
                    <CardDescription>{section.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {sectionTools.slice(0, 6).map((tool) => (
                      <Link key={tool.slug} href={`/tools/${tool.slug}`}>
                        <Badge
                          variant="secondary"
                          className="cursor-pointer hover:bg-secondary/80"
                        >
                          {tool.name.length > 20
                            ? `${tool.name.slice(0, 20)}...`
                            : tool.name}
                        </Badge>
                      </Link>
                    ))}
                    {sectionTools.length > 6 && (
                      <Badge variant="outline">
                        +{sectionTools.length - 6} more
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
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
      <Card className="h-full transition-colors hover:bg-muted/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
