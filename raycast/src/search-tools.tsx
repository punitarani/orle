import { Action, ActionPanel, Icon, List } from "@raycast/api";
import { useMemo, useState } from "react";
import ToolForm from "./components/tool-form";
import { SECTION_META, searchTools } from "./runtime/loader";
import type { ToolMeta } from "./runtime/manifest-types";

export default function SearchTools() {
  const [searchText, setSearchText] = useState("");

  const filteredTools = useMemo(() => searchTools(searchText), [searchText]);

  const toolsBySection = useMemo(() => {
    const grouped = new Map<string, ToolMeta[]>();
    for (const tool of filteredTools) {
      if (!grouped.has(tool.section)) grouped.set(tool.section, []);
      grouped.get(tool.section)?.push(tool);
    }
    return grouped;
  }, [filteredTools]);

  return (
    <List
      searchBarPlaceholder="Search developer tools..."
      onSearchTextChange={setSearchText}
      throttle
    >
      {searchText.length === 0 ? (
        SECTION_META.map((section) => {
          const sectionTools = toolsBySection.get(section.id) || [];
          if (sectionTools.length === 0) return null;
          return (
            <List.Section
              key={section.id}
              title={section.name}
              subtitle={`${sectionTools.length} tools`}
            >
              {sectionTools.map((tool) => (
                <ToolListItem key={tool.slug} tool={tool} showSection />
              ))}
            </List.Section>
          );
        })
      ) : (
        <List.Section
          title="Results"
          subtitle={`${filteredTools.length} tools`}
        >
          {filteredTools.map((tool) => (
            <ToolListItem key={tool.slug} tool={tool} />
          ))}
        </List.Section>
      )}
    </List>
  );
}

function ToolListItem({ tool }: { tool: ToolMeta }) {
  return (
    <List.Item
      title={tool.name}
      subtitle={tool.description}
      keywords={tool.aliases}
      accessories={[
        { text: tool.inputType === "none" ? "Generator" : "Transform" },
        { text: tool.outputType },
      ]}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <Action.Push
              title="Open Tool"
              icon={Icon.ArrowRight}
              target={<ToolForm toolMeta={tool} />}
            />
          </ActionPanel.Section>
          <ActionPanel.Section>
            <Action.OpenInBrowser
              title="Open in Orle.dev"
              icon={Icon.Globe}
              url={`https://orle.dev/tools/${tool.slug}`}
            />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}
