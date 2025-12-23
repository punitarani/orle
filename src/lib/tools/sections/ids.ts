import { customAlphabet, nanoid } from "nanoid";
import { v4 as uuidv4 } from "uuid";
import type { ToolDefinition } from "../types";

export const idTools: ToolDefinition[] = [
  {
    slug: "uuid-generator",
    name: "UUID v4 Generator",
    description: "Generate random UUID v4 identifiers",
    section: "ids",
    aliases: ["uuid", "guid", "uuid4"],
    inputType: "none",
    outputType: "text",
    options: [
      {
        id: "count",
        label: "Count",
        type: "number",
        default: 1,
        min: 1,
        max: 100,
      },
      { id: "uppercase", label: "Uppercase", type: "toggle", default: false },
      { id: "noDashes", label: "No dashes", type: "toggle", default: false },
      { id: "braces", label: "With braces {}", type: "toggle", default: false },
    ],
    transform: (_, opts) => {
      const count = Math.min(Number(opts.count) || 1, 100);
      const uuids: string[] = [];

      for (let i = 0; i < count; i++) {
        let uuid = uuidv4();
        if (opts.noDashes) uuid = uuid.replace(/-/g, "");
        if (opts.uppercase) uuid = uuid.toUpperCase();
        if (opts.braces) uuid = `{${uuid}}`;
        uuids.push(uuid);
      }

      return uuids.join("\n");
    },
  },
  {
    slug: "ulid-generator",
    name: "ULID Generator",
    description: "Generate sortable ULID identifiers",
    section: "ids",
    aliases: ["ulid", "sortable-id"],
    inputType: "none",
    outputType: "text",
    options: [
      {
        id: "count",
        label: "Count",
        type: "number",
        default: 1,
        min: 1,
        max: 100,
      },
      { id: "lowercase", label: "Lowercase", type: "toggle", default: false },
    ],
    transform: (_, opts) => {
      const count = Math.min(Number(opts.count) || 1, 100);
      const ulids: string[] = [];

      for (let i = 0; i < count; i++) {
        const ulid = generateUlid();
        ulids.push(opts.lowercase ? ulid.toLowerCase() : ulid);
      }

      return ulids.join("\n");
    },
  },
  {
    slug: "nanoid-generator",
    name: "NanoID Generator",
    description: "Generate compact NanoID identifiers",
    section: "ids",
    aliases: ["nanoid", "short-id"],
    inputType: "none",
    outputType: "text",
    options: [
      {
        id: "count",
        label: "Count",
        type: "number",
        default: 1,
        min: 1,
        max: 100,
      },
      {
        id: "length",
        label: "Length",
        type: "number",
        default: 21,
        min: 2,
        max: 64,
      },
      {
        id: "alphabet",
        label: "Alphabet",
        type: "select",
        default: "default",
        options: [
          { value: "default", label: "Default (A-Za-z0-9_-)" },
          { value: "alphanumeric", label: "Alphanumeric (A-Za-z0-9)" },
          { value: "lowercase", label: "Lowercase (a-z0-9)" },
          { value: "numbers", label: "Numbers only (0-9)" },
          { value: "hex", label: "Hex (0-9a-f)" },
        ],
      },
    ],
    transform: (_, opts) => {
      const count = Math.min(Number(opts.count) || 1, 100);
      const length = Number(opts.length) || 21;
      const ids: string[] = [];

      const alphabets: Record<string, string> = {
        default:
          "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_-",
        alphanumeric:
          "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
        lowercase: "0123456789abcdefghijklmnopqrstuvwxyz",
        numbers: "0123456789",
        hex: "0123456789abcdef",
      };

      const alphabet = alphabets[String(opts.alphabet)] || alphabets.default;
      const generator =
        opts.alphabet === "default"
          ? () => nanoid(length)
          : customAlphabet(alphabet, length);

      for (let i = 0; i < count; i++) {
        ids.push(generator());
      }

      return ids.join("\n");
    },
  },
  {
    slug: "guid-formatter",
    name: "GUID Formatter",
    description: "Format GUID/UUID with different styles",
    section: "ids",
    aliases: ["format-uuid", "format-guid"],
    inputType: "text",
    outputType: "text",
    inputPlaceholder: "Enter UUID/GUID...",
    options: [
      {
        id: "format",
        label: "Format",
        type: "select",
        default: "standard",
        options: [
          {
            value: "standard",
            label: "Standard (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)",
          },
          {
            value: "noDashes",
            label: "No dashes (xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx)",
          },
          {
            value: "braces",
            label: "Braces ({xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx})",
          },
          {
            value: "urn",
            label: "URN (urn:uuid:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)",
          },
        ],
      },
      { id: "uppercase", label: "Uppercase", type: "toggle", default: false },
    ],
    transform: (input, opts) => {
      let guid = String(input).trim().toLowerCase();
      // Remove any existing formatting
      guid = guid.replace(/[{}\-urn:uuid]/g, "");

      if (!/^[0-9a-f]{32}$/i.test(guid)) {
        return { type: "error", message: "Invalid UUID/GUID" };
      }

      // Add dashes in standard format
      let formatted = `${guid.slice(0, 8)}-${guid.slice(8, 12)}-${guid.slice(12, 16)}-${guid.slice(16, 20)}-${guid.slice(20)}`;

      switch (opts.format) {
        case "noDashes":
          formatted = guid;
          break;
        case "braces":
          formatted = `{${formatted}}`;
          break;
        case "urn":
          formatted = `urn:uuid:${formatted}`;
          break;
      }

      return opts.uppercase ? formatted.toUpperCase() : formatted;
    },
  },
  {
    slug: "ulid-inspector",
    name: "ULID / Timestamp ID Inspector",
    description: "Extract timestamp from ULID or other timestamp-based IDs",
    section: "ids",
    aliases: ["parse-ulid", "ulid-time"],
    inputType: "text",
    outputType: "text",
    inputPlaceholder: "Enter ULID...",
    transform: (input) => {
      const id = String(input).trim().toUpperCase();
      if (!id) return "";

      // Validate ULID format (26 chars, Crockford Base32)
      if (!/^[0-9A-HJKMNP-TV-Z]{26}$/.test(id)) {
        return { type: "error", message: "Invalid ULID format" };
      }

      try {
        const timestamp = decodeUlidTime(id);
        const date = new Date(timestamp);

        return [
          `ULID: ${id}`,
          "",
          "Timestamp Component:",
          `  Unix (ms): ${timestamp}`,
          `  ISO: ${date.toISOString()}`,
          `  Local: ${date.toLocaleString()}`,
          "",
          "Random Component:",
          `  ${id.slice(10)}`,
        ].join("\n");
      } catch {
        return { type: "error", message: "Failed to parse ULID" };
      }
    },
  },
  {
    slug: "slug-id",
    name: "Slug ID Generator",
    description: "Generate human-readable short IDs (adjective-noun-1234)",
    section: "ids",
    aliases: ["human-id", "readable-id", "memorable-id"],
    inputType: "none",
    outputType: "text",
    options: [
      {
        id: "count",
        label: "Count",
        type: "number",
        default: 1,
        min: 1,
        max: 20,
      },
      { id: "separator", label: "Separator", type: "text", default: "-" },
      {
        id: "numbers",
        label: "Include numbers",
        type: "toggle",
        default: true,
      },
      {
        id: "numDigits",
        label: "Number digits",
        type: "number",
        default: 4,
        min: 2,
        max: 6,
      },
    ],
    transform: (_, opts) => {
      const adjectives = [
        "quick",
        "lazy",
        "happy",
        "sad",
        "bright",
        "dark",
        "warm",
        "cold",
        "fast",
        "slow",
        "loud",
        "quiet",
        "soft",
        "hard",
        "smooth",
        "rough",
        "bold",
        "calm",
        "clever",
        "brave",
        "gentle",
        "fierce",
        "kind",
        "proud",
        "wise",
        "young",
        "old",
        "new",
        "fresh",
        "clean",
        "clear",
        "sharp",
      ];

      const nouns = [
        "fox",
        "dog",
        "cat",
        "bird",
        "fish",
        "bear",
        "wolf",
        "lion",
        "tree",
        "rock",
        "lake",
        "river",
        "cloud",
        "star",
        "moon",
        "sun",
        "wind",
        "fire",
        "wave",
        "leaf",
        "stone",
        "brook",
        "peak",
        "vale",
        "hawk",
        "eagle",
        "raven",
        "swan",
        "oak",
        "pine",
        "maple",
        "cedar",
      ];

      const count = Math.min(Number(opts.count) || 1, 20);
      const sep = String(opts.separator);
      const numDigits = Number(opts.numDigits) || 4;
      const ids: string[] = [];

      for (let i = 0; i < count; i++) {
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        let id = `${adj}${sep}${noun}`;

        if (opts.numbers) {
          const num = Math.floor(Math.random() * 10 ** numDigits)
            .toString()
            .padStart(numDigits, "0");
          id += `${sep}${num}`;
        }

        ids.push(id);
      }

      return ids.join("\n");
    },
  },
];

// Helper functions
function generateUlid(): string {
  const ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  const TIME_LEN = 10;
  const RANDOM_LEN = 16;

  const now = Date.now();
  let str = "";

  // Encode timestamp (10 chars)
  let time = now;
  for (let i = TIME_LEN - 1; i >= 0; i--) {
    str = ENCODING[time % 32] + str;
    time = Math.floor(time / 32);
  }

  // Add random part (16 chars)
  const random = new Uint8Array(10);
  crypto.getRandomValues(random);
  for (let i = 0; i < RANDOM_LEN; i++) {
    str += ENCODING[random[i % 10] % 32];
  }

  return str;
}

function decodeUlidTime(ulid: string): number {
  const ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  const timeChars = ulid.slice(0, 10);
  let time = 0;

  for (const char of timeChars) {
    time = time * 32 + ENCODING.indexOf(char);
  }

  return time;
}
