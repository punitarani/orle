import { createId as cuid2 } from "@paralleldrive/cuid2";
import { customAlphabet, nanoid } from "nanoid";
import { ulid } from "ulid";
import {
  validate as uuidValidate,
  version as uuidVersion,
  v1 as uuidv1,
  v3 as uuidv3,
  v4 as uuidv4,
  v5 as uuidv5,
  v6 as uuidv6,
  v7 as uuidv7,
} from "uuid";
import type { ToolDefinition } from "../types";

const UUID_NAMESPACES = {
  dns: uuidv5.DNS,
  url: uuidv5.URL,
} as const;

const NANOID_ALPHABETS: Record<string, string> = {
  default: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_-",
  alphanumeric:
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  lowercase: "0123456789abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  hex: "0123456789abcdef",
};

export const idTools: ToolDefinition[] = [
  {
    slug: "id-suite",
    name: "ID & Token Suite",
    description: "Generate, validate, and inspect common ID formats",
    section: "ids",
    aliases: ["uuid", "ulid", "nanoid", "cuid2", "ksuid"],
    inputType: "text",
    outputType: "text",
    runPolicy: "manual",
    options: [
      {
        id: "mode",
        label: "Mode",
        type: "select",
        default: "uuid-generate",
        options: [
          { value: "uuid-generate", label: "UUID generate" },
          { value: "uuid-validate", label: "UUID validate" },
          { value: "uuid-parse", label: "UUID parse" },
          { value: "ulid-generate", label: "ULID generate" },
          { value: "ulid-parse", label: "ULID parse" },
          { value: "nanoid-generate", label: "NanoID generate" },
          { value: "cuid2-generate", label: "CUID2 generate" },
          { value: "ksuid-generate", label: "KSUID generate" },
          { value: "snowflake-generate", label: "Snowflake-like generate" },
          { value: "random-string", label: "Secure random string" },
          { value: "detect-id", label: "Detect / validate ID" },
        ],
      },
      {
        id: "uuidVersion",
        label: "UUID version",
        type: "select",
        default: "4",
        options: [
          { value: "1", label: "v1" },
          { value: "3", label: "v3" },
          { value: "4", label: "v4" },
          { value: "5", label: "v5" },
          { value: "6", label: "v6" },
          { value: "7", label: "v7" },
        ],
        visibleWhen: { optionId: "mode", equals: "uuid-generate" },
      },
      {
        id: "uuidNamespace",
        label: "UUID namespace",
        type: "select",
        default: "dns",
        options: [
          { value: "dns", label: "DNS" },
          { value: "url", label: "URL" },
          { value: "custom", label: "Custom" },
        ],
        visibleWhen: { optionId: "uuidVersion", equals: ["3", "5"] },
      },
      {
        id: "uuidNamespaceCustom",
        label: "Custom namespace UUID",
        type: "text",
        default: "",
        visibleWhen: { optionId: "uuidNamespace", equals: "custom" },
      },
      {
        id: "uuidName",
        label: "Name",
        type: "text",
        default: "",
        visibleWhen: { optionId: "uuidVersion", equals: ["3", "5"] },
      },
      {
        id: "count",
        label: "Count",
        type: "number",
        default: 1,
        min: 1,
        max: 100,
        visibleWhen: {
          optionId: "mode",
          equals: [
            "uuid-generate",
            "ulid-generate",
            "nanoid-generate",
            "cuid2-generate",
            "ksuid-generate",
            "snowflake-generate",
            "random-string",
          ],
        },
      },
      {
        id: "uppercase",
        label: "Uppercase",
        type: "toggle",
        default: false,
        visibleWhen: { optionId: "mode", equals: "uuid-generate" },
      },
      {
        id: "noDashes",
        label: "No dashes",
        type: "toggle",
        default: false,
        visibleWhen: { optionId: "mode", equals: "uuid-generate" },
      },
      {
        id: "braces",
        label: "With braces {}",
        type: "toggle",
        default: false,
        visibleWhen: { optionId: "mode", equals: "uuid-generate" },
      },
      {
        id: "ulidLowercase",
        label: "Lowercase",
        type: "toggle",
        default: false,
        visibleWhen: { optionId: "mode", equals: "ulid-generate" },
      },
      {
        id: "nanoidLength",
        label: "NanoID length",
        type: "number",
        default: 21,
        min: 2,
        max: 64,
        visibleWhen: { optionId: "mode", equals: "nanoid-generate" },
      },
      {
        id: "nanoidAlphabet",
        label: "NanoID alphabet",
        type: "select",
        default: "default",
        options: [
          { value: "default", label: "Default" },
          { value: "alphanumeric", label: "Alphanumeric" },
          { value: "lowercase", label: "Lowercase" },
          { value: "numbers", label: "Numbers" },
          { value: "hex", label: "Hex" },
        ],
        visibleWhen: { optionId: "mode", equals: "nanoid-generate" },
      },
      {
        id: "randomLength",
        label: "Random length",
        type: "number",
        default: 32,
        min: 4,
        max: 256,
        visibleWhen: { optionId: "mode", equals: "random-string" },
      },
      {
        id: "randomAlphabet",
        label: "Random alphabet",
        type: "text",
        default:
          "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
        visibleWhen: { optionId: "mode", equals: "random-string" },
      },
      {
        id: "snowflakeWorker",
        label: "Snowflake worker id",
        type: "number",
        default: 1,
        min: 0,
        max: 1023,
        visibleWhen: { optionId: "mode", equals: "snowflake-generate" },
      },
      {
        id: "snowflakeEpoch",
        label: "Epoch (ms)",
        type: "number",
        default: 1288834974657,
        min: 0,
        visibleWhen: { optionId: "mode", equals: "snowflake-generate" },
      },
    ],
    transform: (input, opts) => {
      const mode = String(opts.mode);
      const count = Math.min(Number(opts.count) || 1, 100);

      switch (mode) {
        case "uuid-generate": {
          const version = String(opts.uuidVersion || "4");
          const ids: string[] = [];
          for (let i = 0; i < count; i++) {
            let uuid = generateUuid(version, opts);
            if (opts.noDashes) uuid = uuid.replace(/-/g, "");
            if (opts.uppercase) uuid = uuid.toUpperCase();
            if (opts.braces) uuid = `{${uuid}}`;
            ids.push(uuid);
          }
          return ids.join("\n");
        }
        case "uuid-validate": {
          const value = String(input).trim();
          if (!value) return "";
          const valid = uuidValidate(value);
          return valid ? `Valid UUID v${uuidVersion(value)}` : "Invalid UUID";
        }
        case "uuid-parse": {
          const value = String(input).trim();
          if (!value) return "";
          if (!uuidValidate(value)) {
            return { type: "error", message: "Invalid UUID" };
          }
          const version = uuidVersion(value);
          const parsed = parseUuidDetails(value, version);
          return [
            `UUID: ${value}`,
            `Version: v${version}`,
            `Variant: ${parsed.variant}`,
            parsed.timestamp ? `Timestamp: ${parsed.timestamp}` : undefined,
            parsed.date ? `Date: ${parsed.date}` : undefined,
          ]
            .filter(Boolean)
            .join("\n");
        }
        case "ulid-generate": {
          const ids: string[] = [];
          for (let i = 0; i < count; i++) {
            const value = ulid();
            ids.push(opts.ulidLowercase ? value.toLowerCase() : value);
          }
          return ids.join("\n");
        }
        case "ulid-parse": {
          const value = String(input).trim().toUpperCase();
          if (!value) return "";
          if (!/^[0-9A-HJKMNP-TV-Z]{26}$/.test(value)) {
            return { type: "error", message: "Invalid ULID" };
          }
          const timestamp = decodeUlidTime(value);
          const date = new Date(timestamp);
          return [
            `ULID: ${value}`,
            `Timestamp: ${timestamp}`,
            `ISO: ${date.toISOString()}`,
            `Local: ${date.toLocaleString()}`,
          ].join("\n");
        }
        case "nanoid-generate": {
          const ids: string[] = [];
          const length = Number(opts.nanoidLength) || 21;
          const alphabet =
            NANOID_ALPHABETS[String(opts.nanoidAlphabet)] ||
            NANOID_ALPHABETS.default;
          const generator =
            opts.nanoidAlphabet === "default"
              ? () => nanoid(length)
              : customAlphabet(alphabet, length);
          for (let i = 0; i < count; i++) ids.push(generator());
          return ids.join("\n");
        }
        case "cuid2-generate": {
          const ids: string[] = [];
          for (let i = 0; i < count; i++) ids.push(cuid2());
          return ids.join("\n");
        }
        case "ksuid-generate": {
          const ids: string[] = [];
          for (let i = 0; i < count; i++) ids.push(generateKsuid());
          return ids.join("\n");
        }
        case "snowflake-generate": {
          const worker = Number(opts.snowflakeWorker) || 0;
          const epoch = Number(opts.snowflakeEpoch) || 0;
          const ids: string[] = [];
          for (let i = 0; i < count; i++) {
            ids.push(generateSnowflake(worker, epoch).toString());
          }
          return ids.join("\n");
        }
        case "random-string": {
          const length = Math.max(4, Number(opts.randomLength) || 32);
          const alphabet = String(
            opts.randomAlphabet || NANOID_ALPHABETS.default,
          );
          const generator = customAlphabet(alphabet, length);
          const ids: string[] = [];
          for (let i = 0; i < count; i++) ids.push(generator());
          return ids.join("\n");
        }
        case "detect-id": {
          const value = String(input).trim();
          if (!value) return "";
          const detection = detectId(value);
          return detection.join("\n");
        }
        default:
          return "";
      }
    },
  },
];

function generateUuid(version: string, opts: Record<string, unknown>): string {
  switch (version) {
    case "1":
      return uuidv1();
    case "3": {
      const name = String(opts.uuidName || "");
      const ns = resolveNamespace(opts);
      return uuidv3(name || "orle", ns);
    }
    case "5": {
      const name = String(opts.uuidName || "");
      const ns = resolveNamespace(opts);
      return uuidv5(name || "orle", ns);
    }
    case "6":
      return uuidv6();
    case "7":
      return uuidv7();
    default:
      return uuidv4();
  }
}

function resolveNamespace(opts: Record<string, unknown>): string {
  const namespace = String(opts.uuidNamespace || "dns");
  if (namespace === "custom") {
    const custom = String(opts.uuidNamespaceCustom || "");
    return uuidValidate(custom) ? custom : UUID_NAMESPACES.dns;
  }
  return (
    UUID_NAMESPACES[namespace as keyof typeof UUID_NAMESPACES] ??
    UUID_NAMESPACES.dns
  );
}

function decodeUlidTime(value: string): number {
  const chars = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  let time = 0n;
  for (const char of value.slice(0, 10)) {
    time = time * 32n + BigInt(chars.indexOf(char));
  }
  return Number(time);
}

function parseUuidDetails(
  uuid: string,
  version: number,
): {
  variant: string;
  timestamp?: string;
  date?: string;
} {
  const hex = uuid.replace(/-/g, "");
  const variantByte = Number.parseInt(hex.slice(16, 18), 16);
  const variant =
    (variantByte & 0b10000000) === 0
      ? "NCS"
      : (variantByte & 0b11000000) === 0b10000000
        ? "RFC4122"
        : (variantByte & 0b11100000) === 0b11000000
          ? "Microsoft"
          : "Future";

  if (version === 1) {
    const timeLow = BigInt(`0x${hex.slice(0, 8)}`);
    const timeMid = BigInt(`0x${hex.slice(8, 12)}`);
    const timeHigh = BigInt(`0x${hex.slice(12, 16)}`) & 0x0fffn;
    const timestamp = (timeHigh << 48n) | (timeMid << 32n) | timeLow;
    const unix100ns = timestamp - 0x01b21dd213814000n;
    const ms = Number(unix100ns / 10000n);
    return { variant, timestamp: `${ms}`, date: new Date(ms).toISOString() };
  }

  if (version === 6) {
    const timeHigh = BigInt(`0x${hex.slice(0, 12)}`);
    const timeLow = BigInt(`0x${hex.slice(12, 16)}`) & 0x0fffn;
    const timestamp = (timeHigh << 12n) | timeLow;
    const unix100ns = timestamp - 0x01b21dd213814000n;
    const ms = Number(unix100ns / 10000n);
    return { variant, timestamp: `${ms}`, date: new Date(ms).toISOString() };
  }

  if (version === 7) {
    const ms = Number(BigInt(`0x${hex.slice(0, 12)}`));
    return { variant, timestamp: `${ms}`, date: new Date(ms).toISOString() };
  }

  return { variant };
}

function generateSnowflake(workerId: number, epoch: number): bigint {
  const timestamp = BigInt(Date.now() - epoch) & 0x1fffffffffffffn;
  const worker = BigInt(workerId & 0x3ff);
  const sequence = BigInt(Math.floor(Math.random() * 4096));
  return (timestamp << 22n) | (worker << 12n) | sequence;
}

function generateKsuid(): string {
  const payload = new Uint8Array(16);
  crypto.getRandomValues(payload);
  const timestamp = Math.floor(Date.now() / 1000) - 1400000000;
  const timeBytes = new Uint8Array(4);
  const view = new DataView(timeBytes.buffer);
  view.setUint32(0, timestamp, false);
  const bytes = new Uint8Array(20);
  bytes.set(timeBytes, 0);
  bytes.set(payload, 4);
  return base62Encode(bytes);
}

function base62Encode(bytes: Uint8Array): string {
  const alphabet =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let value = 0n;
  for (const byte of bytes) {
    value = (value << 8n) + BigInt(byte);
  }
  let output = "";
  while (value > 0n) {
    const mod = value % 62n;
    output = alphabet[Number(mod)] + output;
    value /= 62n;
  }
  return output.padStart(27, "0");
}

function detectId(value: string): string[] {
  const results: string[] = [];
  if (uuidValidate(value)) {
    results.push(`UUID v${uuidVersion(value)} (valid)`);
  }
  if (/^[0-9A-HJKMNP-TV-Z]{26}$/i.test(value)) {
    results.push("ULID (valid format)");
  }
  if (/^[A-Za-z0-9_-]{10,64}$/.test(value)) {
    results.push("NanoID / random string (possible)");
  }
  if (/^[0-9A-Za-z]{27}$/.test(value)) {
    results.push("KSUID (possible)");
  }
  if (results.length === 0) {
    results.push("Unknown / unsupported format");
  }
  return results;
}
