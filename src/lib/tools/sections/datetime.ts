import type { ToolDefinition } from "../types";

export const datetimeTools: ToolDefinition[] = [
  {
    slug: "epoch-converter",
    name: "Unix Epoch Converter",
    description: "Convert between Unix timestamps and human-readable dates",
    section: "datetime",
    aliases: ["timestamp", "unix-time", "epoch"],
    inputType: "text",
    outputType: "text",
    inputPlaceholder: "Enter timestamp or date...",
    options: [
      {
        id: "mode",
        label: "Mode",
        type: "select",
        default: "auto",
        options: [
          { value: "auto", label: "Auto-detect" },
          { value: "toDate", label: "Timestamp → Date" },
          { value: "toTimestamp", label: "Date → Timestamp" },
        ],
      },
      {
        id: "unit",
        label: "Timestamp unit",
        type: "select",
        default: "auto",
        options: [
          { value: "auto", label: "Auto-detect" },
          { value: "seconds", label: "Seconds" },
          { value: "milliseconds", label: "Milliseconds" },
        ],
      },
    ],
    transform: (input, opts) => {
      const str = String(input).trim();
      if (!str) {
        // Return current time
        const now = Date.now();
        return [
          "Current time:",
          `  Seconds: ${Math.floor(now / 1000)}`,
          `  Milliseconds: ${now}`,
          `  ISO: ${new Date(now).toISOString()}`,
        ].join("\n");
      }

      const isNumeric = /^\d+$/.test(str);
      let mode = opts.mode;

      if (mode === "auto") {
        mode = isNumeric ? "toDate" : "toTimestamp";
      }

      if (mode === "toDate") {
        let ts = Number.parseInt(str, 10);
        let unit = opts.unit;

        if (unit === "auto") {
          // Assume milliseconds if > 1e12, else seconds
          unit = ts > 1e12 ? "milliseconds" : "seconds";
        }

        if (unit === "seconds") ts *= 1000;

        const date = new Date(ts);
        if (Number.isNaN(date.getTime())) {
          return { type: "error", message: "Invalid timestamp" };
        }

        return [
          `Timestamp: ${str} (${unit})`,
          "",
          `ISO 8601: ${date.toISOString()}`,
          `UTC: ${date.toUTCString()}`,
          `Local: ${date.toLocaleString()}`,
          `Relative: ${getRelativeTime(date)}`,
        ].join("\n");
      }

      // Parse date string
      const date = new Date(str);
      if (Number.isNaN(date.getTime())) {
        return { type: "error", message: "Invalid date format" };
      }

      return [
        `Parsed: ${str}`,
        "",
        `Seconds: ${Math.floor(date.getTime() / 1000)}`,
        `Milliseconds: ${date.getTime()}`,
        `ISO 8601: ${date.toISOString()}`,
      ].join("\n");
    },
  },
  {
    slug: "iso-parser",
    name: "ISO 8601 Parser",
    description: "Parse and analyze ISO 8601 date strings",
    section: "datetime",
    aliases: ["parse-date", "date-parser"],
    inputType: "text",
    outputType: "text",
    inputPlaceholder: "Enter ISO 8601 date (e.g., 2024-01-15T10:30:00Z)...",
    transform: (input) => {
      const str = String(input).trim();
      if (!str) return "";

      const date = new Date(str);
      if (Number.isNaN(date.getTime())) {
        return { type: "error", message: "Invalid date format" };
      }

      const tzOffset = -date.getTimezoneOffset();
      const tzSign = tzOffset >= 0 ? "+" : "-";
      const tzHours = Math.floor(Math.abs(tzOffset) / 60)
        .toString()
        .padStart(2, "0");
      const tzMins = (Math.abs(tzOffset) % 60).toString().padStart(2, "0");

      return [
        `Input: ${str}`,
        "",
        "Components:",
        `  Year: ${date.getFullYear()}`,
        `  Month: ${date.getMonth() + 1} (${date.toLocaleString("en", { month: "long" })})`,
        `  Day: ${date.getDate()}`,
        `  Hour: ${date.getHours()}`,
        `  Minute: ${date.getMinutes()}`,
        `  Second: ${date.getSeconds()}`,
        `  Millisecond: ${date.getMilliseconds()}`,
        "",
        "Timezone:",
        `  Local offset: ${tzSign}${tzHours}:${tzMins}`,
        `  Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`,
        "",
        "Timestamps:",
        `  Epoch (s): ${Math.floor(date.getTime() / 1000)}`,
        `  Epoch (ms): ${date.getTime()}`,
        "",
        "Day info:",
        `  Day of week: ${date.toLocaleString("en", { weekday: "long" })}`,
        `  Day of year: ${getDayOfYear(date)}`,
        `  Week of year: ${getWeekNumber(date)}`,
      ].join("\n");
    },
  },
  {
    slug: "relative-time",
    name: "Relative Time",
    description: 'Show relative time (e.g., "3 hours ago", "in 2 days")',
    section: "datetime",
    aliases: ["time-ago", "from-now"],
    inputType: "text",
    outputType: "text",
    inputPlaceholder: "Enter date or timestamp...",
    transform: (input) => {
      const str = String(input).trim();
      if (!str) return "";

      let date: Date;
      if (/^\d+$/.test(str)) {
        const ts = Number.parseInt(str, 10);
        date = new Date(ts > 1e12 ? ts : ts * 1000);
      } else {
        date = new Date(str);
      }

      if (Number.isNaN(date.getTime())) {
        return { type: "error", message: "Invalid date" };
      }

      const now = new Date();
      const diff = date.getTime() - now.getTime();
      const absDiff = Math.abs(diff);

      return [
        `Date: ${date.toISOString()}`,
        `Now: ${now.toISOString()}`,
        "",
        `Relative: ${getRelativeTime(date)}`,
        "",
        "Difference:",
        `  ${formatDurationDetailed(absDiff)}`,
        `  ${absDiff} milliseconds`,
        `  ${(absDiff / 1000).toFixed(2)} seconds`,
        `  ${(absDiff / 60000).toFixed(2)} minutes`,
        `  ${(absDiff / 3600000).toFixed(2)} hours`,
        `  ${(absDiff / 86400000).toFixed(2)} days`,
      ].join("\n");
    },
  },
  {
    slug: "add-duration",
    name: "Add / Subtract Duration",
    description: "Add or subtract time from a date",
    section: "datetime",
    aliases: ["date-math", "add-time"],
    inputType: "text",
    outputType: "text",
    inputPlaceholder: "Enter date (leave empty for now)...",
    options: [
      {
        id: "days",
        label: "Days",
        type: "number",
        default: 0,
        min: -9999,
        max: 9999,
      },
      {
        id: "hours",
        label: "Hours",
        type: "number",
        default: 0,
        min: -9999,
        max: 9999,
      },
      {
        id: "minutes",
        label: "Minutes",
        type: "number",
        default: 0,
        min: -9999,
        max: 9999,
      },
      {
        id: "seconds",
        label: "Seconds",
        type: "number",
        default: 0,
        min: -9999,
        max: 9999,
      },
    ],
    transform: (input, opts) => {
      const str = String(input).trim();
      let date: Date;

      if (!str) {
        date = new Date();
      } else if (/^\d+$/.test(str)) {
        const ts = Number.parseInt(str, 10);
        date = new Date(ts > 1e12 ? ts : ts * 1000);
      } else {
        date = new Date(str);
      }

      if (Number.isNaN(date.getTime())) {
        return { type: "error", message: "Invalid date" };
      }

      const ms =
        Number(opts.days) * 86400000 +
        Number(opts.hours) * 3600000 +
        Number(opts.minutes) * 60000 +
        Number(opts.seconds) * 1000;

      const result = new Date(date.getTime() + ms);

      const parts: string[] = [];
      if (opts.days) parts.push(`${opts.days}d`);
      if (opts.hours) parts.push(`${opts.hours}h`);
      if (opts.minutes) parts.push(`${opts.minutes}m`);
      if (opts.seconds) parts.push(`${opts.seconds}s`);

      return [
        `Original: ${date.toISOString()}`,
        `Duration: ${parts.length > 0 ? (ms >= 0 ? "+" : "") + parts.join(" ") : "0"}`,
        "",
        `Result: ${result.toISOString()}`,
        `Local: ${result.toLocaleString()}`,
        `Epoch (s): ${Math.floor(result.getTime() / 1000)}`,
      ].join("\n");
    },
  },
  {
    slug: "timezone-converter",
    name: "Timezone Converter",
    description: "Convert times between different timezones",
    section: "datetime",
    aliases: ["tz", "timezone"],
    inputType: "text",
    outputType: "text",
    inputPlaceholder: "Enter date (leave empty for now)...",
    options: [
      {
        id: "from",
        label: "From timezone",
        type: "select",
        default: "local",
        options: getTimezoneOptions(),
      },
      {
        id: "to",
        label: "To timezone",
        type: "select",
        default: "UTC",
        options: getTimezoneOptions(),
      },
    ],
    transform: (input, opts) => {
      const str = String(input).trim();
      const date = str ? new Date(str) : new Date();

      if (Number.isNaN(date.getTime())) {
        return { type: "error", message: "Invalid date" };
      }

      const fromTz =
        opts.from === "local"
          ? Intl.DateTimeFormat().resolvedOptions().timeZone
          : String(opts.from);
      const toTz =
        opts.to === "local"
          ? Intl.DateTimeFormat().resolvedOptions().timeZone
          : String(opts.to);

      const formatOptions: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZoneName: "short",
      };

      const fromFormatted = date.toLocaleString("en-GB", {
        ...formatOptions,
        timeZone: fromTz,
      });
      const toFormatted = date.toLocaleString("en-GB", {
        ...formatOptions,
        timeZone: toTz,
      });

      return [
        `From (${fromTz}): ${fromFormatted}`,
        `To (${toTz}): ${toFormatted}`,
        "",
        `UTC: ${date.toISOString()}`,
        `Epoch: ${date.getTime()}`,
      ].join("\n");
    },
  },
  {
    slug: "week-number",
    name: "Week Number Calculator",
    description: "Get ISO week number and day of week",
    section: "datetime",
    aliases: ["iso-week", "weekday"],
    inputType: "text",
    outputType: "text",
    inputPlaceholder: "Enter date (leave empty for today)...",
    transform: (input) => {
      const str = String(input).trim();
      const date = str ? new Date(str) : new Date();

      if (Number.isNaN(date.getTime())) {
        return { type: "error", message: "Invalid date" };
      }

      const weekNum = getWeekNumber(date);
      const dayOfWeek = date.getDay();
      const dayOfYear = getDayOfYear(date);
      const daysInMonth = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0,
      ).getDate();
      const daysInYear =
        (date.getFullYear() % 4 === 0 && date.getFullYear() % 100 !== 0) ||
        date.getFullYear() % 400 === 0
          ? 366
          : 365;

      const dayNames = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];

      return [
        `Date: ${date.toDateString()}`,
        "",
        `ISO Week: ${weekNum}`,
        `Day of week: ${dayNames[dayOfWeek]} (${dayOfWeek})`,
        `Day of month: ${date.getDate()} of ${daysInMonth}`,
        `Day of year: ${dayOfYear} of ${daysInYear}`,
        "",
        `Quarter: Q${Math.ceil((date.getMonth() + 1) / 3)}`,
        `Is leap year: ${daysInYear === 366 ? "Yes" : "No"}`,
      ].join("\n");
    },
  },
  {
    slug: "date-diff",
    name: "Date Difference",
    description: "Calculate the difference between two dates",
    section: "datetime",
    aliases: ["days-between", "date-delta"],
    inputType: "text",
    outputType: "text",
    inputPlaceholder: "date1\n---SEPARATOR---\ndate2",
    transform: (input) => {
      const str = String(input);
      const parts = str.split(/---SEPARATOR---|\n---\n/);

      if (parts.length < 2) {
        return {
          type: "error",
          message: "Use ---SEPARATOR--- to separate two dates",
        };
      }

      const date1 = new Date(parts[0].trim());
      const date2 = new Date(parts[1].trim());

      if (Number.isNaN(date1.getTime()) || Number.isNaN(date2.getTime())) {
        return { type: "error", message: "Invalid date format" };
      }

      const diff = Math.abs(date2.getTime() - date1.getTime());
      const sign = date2.getTime() > date1.getTime() ? "" : "-";

      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      return [
        `Date 1: ${date1.toISOString()}`,
        `Date 2: ${date2.toISOString()}`,
        "",
        "Difference:",
        `  ${sign}${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds`,
        "",
        "In units:",
        `  Milliseconds: ${sign}${diff}`,
        `  Seconds: ${sign}${(diff / 1000).toFixed(2)}`,
        `  Minutes: ${sign}${(diff / 60000).toFixed(2)}`,
        `  Hours: ${sign}${(diff / 3600000).toFixed(2)}`,
        `  Days: ${sign}${(diff / 86400000).toFixed(2)}`,
        `  Weeks: ${sign}${(diff / 604800000).toFixed(2)}`,
        `  Months (approx): ${sign}${(diff / 2629746000).toFixed(2)}`,
        `  Years (approx): ${sign}${(diff / 31556952000).toFixed(2)}`,
      ].join("\n");
    },
  },
];

// Helper functions
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const absDiff = Math.abs(diff);
  const isPast = diff < 0;

  const seconds = Math.floor(absDiff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  let value: number;
  let unit: string;

  if (years > 0) {
    value = years;
    unit = "year";
  } else if (months > 0) {
    value = months;
    unit = "month";
  } else if (weeks > 0) {
    value = weeks;
    unit = "week";
  } else if (days > 0) {
    value = days;
    unit = "day";
  } else if (hours > 0) {
    value = hours;
    unit = "hour";
  } else if (minutes > 0) {
    value = minutes;
    unit = "minute";
  } else {
    value = seconds;
    unit = "second";
  }

  const plural = value !== 1 ? "s" : "";

  if (value === 0) return "just now";
  return isPast
    ? `${value} ${unit}${plural} ago`
    : `in ${value} ${unit}${plural}`;
}

function formatDurationDetailed(ms: number): string {
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);

  const parts: string[] = [];
  if (days) parts.push(`${days} day${days !== 1 ? "s" : ""}`);
  if (hours) parts.push(`${hours} hour${hours !== 1 ? "s" : ""}`);
  if (minutes) parts.push(`${minutes} minute${minutes !== 1 ? "s" : ""}`);
  if (seconds || parts.length === 0)
    parts.push(`${seconds} second${seconds !== 1 ? "s" : ""}`);

  return parts.join(", ");
}

function getWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

function getTimezoneOptions(): { value: string; label: string }[] {
  return [
    { value: "local", label: "Local" },
    { value: "UTC", label: "UTC" },
    { value: "America/New_York", label: "New York (EST/EDT)" },
    { value: "America/Los_Angeles", label: "Los Angeles (PST/PDT)" },
    { value: "America/Chicago", label: "Chicago (CST/CDT)" },
    { value: "Europe/London", label: "London (GMT/BST)" },
    { value: "Europe/Paris", label: "Paris (CET/CEST)" },
    { value: "Europe/Berlin", label: "Berlin (CET/CEST)" },
    { value: "Asia/Tokyo", label: "Tokyo (JST)" },
    { value: "Asia/Shanghai", label: "Shanghai (CST)" },
    { value: "Asia/Kolkata", label: "India (IST)" },
    { value: "Asia/Dubai", label: "Dubai (GST)" },
    { value: "Australia/Sydney", label: "Sydney (AEST/AEDT)" },
    { value: "Pacific/Auckland", label: "Auckland (NZST/NZDT)" },
  ];
}
