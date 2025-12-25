import cronstrue from "cronstrue";
import type { ToolDefinition } from "../types";

export const datetimeTools: ToolDefinition[] = [
  {
    slug: "datetime-suite",
    name: "Date & Time Suite",
    description: "Epoch, duration, timezone, and cron helpers",
    section: "datetime",
    aliases: ["epoch", "timestamp", "timezone"],
    inputType: "text",
    outputType: "text",
    runPolicy: "manual",
    options: [
      {
        id: "mode",
        label: "Mode",
        type: "select",
        default: "epoch-iso",
        options: [
          { value: "epoch-iso", label: "Epoch ↔ ISO" },
          { value: "duration-add", label: "Add/subtract duration" },
          { value: "duration-parse", label: "Parse duration" },
          { value: "timezone", label: "Timezone convert" },
          { value: "relative", label: "Relative time" },
          { value: "cron", label: "Cron explain" },
        ],
      },
      {
        id: "duration",
        label: "Duration (e.g. 1h 2m)",
        type: "text",
        default: "1h",
        visibleWhen: { optionId: "mode", equals: "duration-add" },
      },
      {
        id: "direction",
        label: "Direction",
        type: "select",
        default: "add",
        options: [
          { value: "add", label: "Add" },
          { value: "subtract", label: "Subtract" },
        ],
        visibleWhen: { optionId: "mode", equals: "duration-add" },
      },
      {
        id: "fromTz",
        label: "From TZ (IANA)",
        type: "text",
        default: "UTC",
        visibleWhen: { optionId: "mode", equals: "timezone" },
      },
      {
        id: "toTz",
        label: "To TZ (IANA)",
        type: "text",
        default: "UTC",
        visibleWhen: { optionId: "mode", equals: "timezone" },
      },
    ],
    transform: (input, opts) => {
      const text = String(input ?? "").trim();
      const mode = String(opts.mode);

      switch (mode) {
        case "epoch-iso": {
          if (!text) return "";
          if (/^\d+$/.test(text)) {
            const ms = text.length <= 10 ? Number(text) * 1000 : Number(text);
            const date = new Date(ms);
            return [
              `Epoch (ms): ${ms}`,
              `Epoch (s): ${Math.floor(ms / 1000)}`,
              `ISO: ${date.toISOString()}`,
              `Local: ${date.toLocaleString()}`,
            ].join("\n");
          }
          const date = new Date(text);
          if (Number.isNaN(date.getTime())) {
            return { type: "error", message: "Invalid date" };
          }
          return [
            `Epoch (ms): ${date.getTime()}`,
            `Epoch (s): ${Math.floor(date.getTime() / 1000)}`,
            `ISO: ${date.toISOString()}`,
            `Local: ${date.toLocaleString()}`,
          ].join("\n");
        }
        case "duration-add": {
          const base = text ? new Date(text) : new Date();
          if (Number.isNaN(base.getTime())) {
            return { type: "error", message: "Invalid base date" };
          }
          const delta = parseDuration(String(opts.duration || ""));
          const result = new Date(
            opts.direction === "subtract"
              ? base.getTime() - delta
              : base.getTime() + delta,
          );
          return [
            `Base: ${base.toISOString()}`,
            `Result: ${result.toISOString()}`,
          ].join("\n");
        }
        case "duration-parse": {
          if (!text) return "";
          const ms = parseDuration(text);
          return [
            `Milliseconds: ${ms}`,
            `Seconds: ${Math.floor(ms / 1000)}`,
            `Minutes: ${(ms / 60000).toFixed(2)}`,
            `Hours: ${(ms / 3600000).toFixed(2)}`,
          ].join("\n");
        }
        case "timezone": {
          if (!text) return "";
          const date = new Date(text);
          if (Number.isNaN(date.getTime())) {
            return { type: "error", message: "Invalid date" };
          }
          const fromTz = String(opts.fromTz || "UTC");
          const toTz = String(opts.toTz || "UTC");
          const from = new Intl.DateTimeFormat("en-US", {
            timeZone: fromTz,
            dateStyle: "full",
            timeStyle: "long",
          }).format(date);
          const to = new Intl.DateTimeFormat("en-US", {
            timeZone: toTz,
            dateStyle: "full",
            timeStyle: "long",
          }).format(date);
          return [`${fromTz}: ${from}`, `${toTz}: ${to}`].join("\n");
        }
        case "relative": {
          const date = text ? new Date(text) : new Date();
          if (Number.isNaN(date.getTime())) {
            return { type: "error", message: "Invalid date" };
          }
          const diff = date.getTime() - Date.now();
          return formatRelative(diff);
        }
        case "cron": {
          if (!text) return "";
          try {
            return cronstrue.toString(text.trim());
          } catch (error) {
            return { type: "error", message: (error as Error).message };
          }
        }
        default:
          return "";
      }
    },
  },
];

function parseDuration(value: string): number {
  const regex = /(\d+)\s*(ms|d|h|m|s)/gi;
  let total = 0;
  let match: RegExpExecArray | null = regex.exec(value);
  while (match) {
    const amount = Number(match[1]);
    const unit = match[2].toLowerCase();
    switch (unit) {
      case "d":
        total += amount * 86400000;
        break;
      case "h":
        total += amount * 3600000;
        break;
      case "m":
        total += amount * 60000;
        break;
      case "s":
        total += amount * 1000;
        break;
      case "ms":
        total += amount;
        break;
    }
    match = regex.exec(value);
  }
  return total;
}

function formatRelative(diffMs: number): string {
  const suffix = diffMs >= 0 ? "from now" : "ago";
  const abs = Math.abs(diffMs);
  const seconds = Math.round(abs / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);
  if (days >= 1) return `${days} day(s) ${suffix}`;
  if (hours >= 1) return `${hours} hour(s) ${suffix}`;
  if (minutes >= 1) return `${minutes} minute(s) ${suffix}`;
  if (seconds <= 5) return "just now";
  return `${seconds} second(s) ${suffix}`;
}
