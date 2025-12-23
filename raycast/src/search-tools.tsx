import {
  Action,
  ActionPanel,
  Clipboard,
  Icon,
  List,
  showToast,
  Toast,
} from "@raycast/api";
import { useCallback, useMemo, useState } from "react";
import ToolForm from "./components/tool-form";
import { SECTIONS, searchTools, type ToolMeta } from "./utils/registry";

export default function SearchTools() {
  const [searchText, setSearchText] = useState("");

  const filteredTools = useMemo(() => {
    return searchTools(searchText);
  }, [searchText]);

  // Group tools by section
  const toolsBySection = useMemo(() => {
    const grouped = new Map<string, ToolMeta[]>();
    for (const tool of filteredTools) {
      const section = tool.section;
      if (!grouped.has(section)) {
        grouped.set(section, []);
      }
      grouped.get(section)?.push(tool);
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
        // Show all sections when no search
        SECTIONS.map((section) => {
          const sectionTools = toolsBySection.get(section.id) || [];
          if (sectionTools.length === 0) return null;
          return (
            <List.Section
              key={section.id}
              title={section.name}
              subtitle={`${sectionTools.length} tools`}
            >
              {sectionTools.map((tool) => (
                <ToolListItem key={tool.slug} tool={tool} />
              ))}
            </List.Section>
          );
        })
      ) : (
        // Show flat list when searching
        <List.Section
          title="Results"
          subtitle={`${filteredTools.length} tools`}
        >
          {filteredTools.map((tool) => (
            <ToolListItem key={tool.slug} tool={tool} showSection />
          ))}
        </List.Section>
      )}
    </List>
  );
}

function ToolListItem({
  tool,
  showSection = false,
}: {
  tool: ToolMeta;
  showSection?: boolean;
}) {
  const subtitle = showSection ? tool.sectionName : tool.description;

  const handleQuickTransform = useCallback(async () => {
    try {
      const clipboardText = await Clipboard.readText();
      if (!clipboardText) {
        await showToast({
          style: Toast.Style.Failure,
          title: "Clipboard is empty",
        });
        return;
      }

      // Get default options
      const options: Record<string, unknown> = {};
      for (const opt of tool.options || []) {
        options[opt.id] = opt.default;
      }

      const result = await tool.transform(clipboardText, options);

      if (typeof result === "object" && result.type === "error") {
        await showToast({
          style: Toast.Style.Failure,
          title: "Transform failed",
          message: result.message,
        });
        return;
      }

      await Clipboard.copy(String(result));
      await showToast({
        style: Toast.Style.Success,
        title: "Copied to clipboard",
        message: "Transformed clipboard content",
      });
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Error",
        message: String(error),
      });
    }
  }, [tool]);

  const handleQuickGenerate = useCallback(async () => {
    try {
      // Get default options
      const options: Record<string, unknown> = {};
      for (const opt of tool.options || []) {
        options[opt.id] = opt.default;
      }

      const result = await tool.transform("", options);

      if (typeof result === "object" && result.type === "error") {
        await showToast({
          style: Toast.Style.Failure,
          title: "Generate failed",
          message: result.message,
        });
        return;
      }

      await Clipboard.copy(String(result));
      await showToast({
        style: Toast.Style.Success,
        title: "Copied to clipboard",
        message: String(result).substring(0, 50),
      });
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Error",
        message: String(error),
      });
    }
  }, [tool]);

  return (
    <List.Item
      title={tool.name}
      subtitle={subtitle}
      keywords={tool.aliases}
      accessories={[
        { text: tool.inputType === "none" ? "Generator" : "Transform" },
      ]}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <Action.Push
              title="Open Tool"
              icon={Icon.ArrowRight}
              target={<ToolForm tool={tool} />}
            />
            {tool.inputType === "none" ? (
              <Action
                title="Generate & Copy"
                icon={Icon.Clipboard}
                onAction={handleQuickGenerate}
                shortcut={{ modifiers: ["cmd"], key: "return" }}
              />
            ) : (
              <Action
                title="Transform Clipboard"
                icon={Icon.Clipboard}
                onAction={handleQuickTransform}
                shortcut={{ modifiers: ["cmd"], key: "return" }}
              />
            )}
          </ActionPanel.Section>
          <ActionPanel.Section>
            <Action.OpenInBrowser
              title="Open in orle.dev"
              url={`https://orle.dev/tools/${tool.slug}`}
              shortcut={{ modifiers: ["cmd", "shift"], key: "o" }}
            />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}
