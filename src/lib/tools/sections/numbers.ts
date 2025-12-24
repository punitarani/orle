import { parseBigInt } from "../lib/bytes-codec";
import type { ToolDefinition } from "../types";

export const numberTools: ToolDefinition[] = [
  {
    slug: "numbers-suite",
    name: "Numbers & Bits Suite",
    description: "Base convert, byte sizes, IP utilities",
    section: "numbers",
    aliases: ["base", "ip", "cidr", "crc"],
    inputType: "text",
    outputType: "text",
    runPolicy: "manual",
    options: [
      {
        id: "mode",
        label: "Mode",
        type: "select",
        default: "base-convert",
        options: [
          { value: "base-convert", label: "Base converter" },
          { value: "bitwise", label: "Bitwise calculator" },
          { value: "humanize-bytes", label: "Humanize bytes" },
          { value: "parse-bytes", label: "Parse bytes" },
          { value: "ipv4", label: "IPv4 ↔ int" },
          { value: "cidr", label: "CIDR calculator" },
          { value: "ipv6", label: "IPv6 expand/compress" },
          { value: "crc32", label: "CRC32 checksum" },
        ],
      },
      {
        id: "fromBase",
        label: "From base",
        type: "number",
        default: 10,
        min: 2,
        max: 36,
        visibleWhen: { optionId: "mode", equals: "base-convert" },
      },
      {
        id: "toBase",
        label: "To base",
        type: "number",
        default: 16,
        min: 2,
        max: 36,
        visibleWhen: { optionId: "mode", equals: "base-convert" },
      },
      {
        id: "bitwiseOp",
        label: "Operation",
        type: "select",
        default: "and",
        options: [
          { value: "and", label: "AND" },
          { value: "or", label: "OR" },
          { value: "xor", label: "XOR" },
          { value: "not", label: "NOT" },
          { value: "lshift", label: "Left shift" },
          { value: "rshift", label: "Right shift" },
        ],
        visibleWhen: { optionId: "mode", equals: "bitwise" },
      },
      {
        id: "bitwiseValue",
        label: "Second value",
        type: "number",
        default: 0,
        visibleWhen: { optionId: "mode", equals: "bitwise" },
      },
    ],
    transform: (input, opts) => {
      const text = String(input ?? "").trim();
      const mode = String(opts.mode);

      switch (mode) {
        case "base-convert": {
          if (!text) return "";
          try {
            const fromBase = Number(opts.fromBase) || 10;
            const normalized = stripBasePrefix(text, fromBase);
            const num = parseBigInt(normalized, fromBase);
            return num.toString(Number(opts.toBase) || 16);
          } catch {
            return { type: "error", message: "Invalid number" };
          }
        }
        case "bitwise": {
          const value = Number(text);
          const other = Number(opts.bitwiseValue) || 0;
          const op = String(opts.bitwiseOp);
          if (Number.isNaN(value)) return "";
          let result = 0;
          switch (op) {
            case "and":
              result = value & other;
              break;
            case "or":
              result = value | other;
              break;
            case "xor":
              result = value ^ other;
              break;
            case "not":
              result = ~value;
              break;
            case "lshift":
              result = value << other;
              break;
            case "rshift":
              result = value >> other;
              break;
          }
          return [
            `Decimal: ${result}`,
            `Binary: ${result.toString(2)}`,
            `Hex: ${result.toString(16).toUpperCase()}`,
          ].join("\n");
        }
        case "humanize-bytes": {
          const bytes = Number(text);
          if (Number.isNaN(bytes)) return "";
          return formatBytes(bytes);
        }
        case "parse-bytes": {
          const parsed = parseBytes(text);
          if (!parsed) return { type: "error", message: "Invalid byte value" };
          return `${Math.round(parsed)} bytes`;
        }
        case "ipv4": {
          if (!text) return "";
          if (/^\d+$/.test(text)) {
            return intToIpv4(Number(text));
          }
          const intVal = ipv4ToInt(text);
          if (intVal === null)
            return { type: "error", message: "Invalid IPv4" };
          return `${intVal}`;
        }
        case "cidr": {
          if (!text.includes("/"))
            return { type: "error", message: "Use CIDR format" };
          const [ip, maskStr] = text.split("/");
          const mask = Number(maskStr);
          if (Number.isNaN(mask) || mask < 0 || mask > 32) {
            return { type: "error", message: "CIDR mask must be 0-32" };
          }
          const base = ipv4ToInt(ip);
          if (base === null) return { type: "error", message: "Invalid IPv4" };
          const maskBits = mask === 0 ? 0 : (~0 << (32 - mask)) >>> 0;
          const network = base & maskBits;
          const broadcast = network | (~maskBits >>> 0);
          return [
            `Network: ${intToIpv4(network)}`,
            `Broadcast: ${intToIpv4(broadcast)}`,
            `Hosts: ${Math.max(0, 2 ** (32 - mask) - 2)}`,
          ].join("\n");
        }
        case "ipv6": {
          if (!text) return "";
          const parsed = parseIpv6(text);
          if (!parsed) return { type: "error", message: "Invalid IPv6" };
          const expanded = parsed
            .map((part) => part.padStart(4, "0"))
            .join(":");
          const compressed = compressIpv6(parsed);
          return [`Expanded: ${expanded}`, `Compressed: ${compressed}`].join(
            "\n",
          );
        }
        case "crc32": {
          if (!text) return "";
          return crc32(text).toString(16).toUpperCase();
        }
        default:
          return "";
      }
    },
  },
];

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".").map((p) => Number(p));
  if (parts.length !== 4) return null;
  if (parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
    return null;
  }
  return (
    (((parts[0] << 24) >>> 0) |
      (parts[1] << 16) |
      (parts[2] << 8) |
      parts[3]) >>>
    0
  );
}

function intToIpv4(value: number): string {
  return [
    (value >>> 24) & 255,
    (value >>> 16) & 255,
    (value >>> 8) & 255,
    value & 255,
  ].join(".");
}

function parseIpv6(value: string): string[] | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parts = trimmed.split("::");
  if (parts.length > 2) return null;

  const left = parts[0] ? parts[0].split(":").filter(Boolean) : [];
  const right = parts[1] ? parts[1].split(":").filter(Boolean) : [];
  const total = left.length + right.length;
  if (total > 8) return null;

  const missing = 8 - total;
  const zeros = new Array(missing).fill("0");
  const full = [...left, ...zeros, ...right];
  if (full.length !== 8) return null;

  for (const part of full) {
    if (!/^[0-9a-fA-F]{1,4}$/.test(part)) return null;
  }
  return full.map((part) => part.toLowerCase());
}

function compressIpv6(parts: string[]): string {
  const normalized = parts.map((part) => part.replace(/^0+/, "") || "0");
  let bestStart = -1;
  let bestLen = 0;
  let currentStart = -1;
  let currentLen = 0;

  normalized.forEach((part, idx) => {
    if (part === "0") {
      if (currentStart === -1) currentStart = idx;
      currentLen += 1;
      if (currentLen > bestLen) {
        bestLen = currentLen;
        bestStart = currentStart;
      }
    } else {
      currentStart = -1;
      currentLen = 0;
    }
  });

  if (bestLen <= 1) {
    return normalized.join(":");
  }

  const left = normalized.slice(0, bestStart).join(":");
  const right = normalized.slice(bestStart + bestLen).join(":");
  if (!left && !right) return "::";
  if (!left) return `::${right}`;
  if (!right) return `${left}::`;
  return `${left}::${right}`;
}

function stripBasePrefix(value: string, base: number): string {
  const trimmed = value.trim();
  if (base === 16) return trimmed.replace(/^0x/i, "");
  if (base === 2) return trimmed.replace(/^0b/i, "");
  if (base === 8) return trimmed.replace(/^0o/i, "");
  return trimmed;
}

function parseBytes(value: string): number | null {
  const match = value
    .trim()
    .match(/^(\d+(?:\.\d+)?)\s*([KMGT]?i?B|B|bytes?)$/i);
  if (!match) return null;
  const amount = Number(match[1]);
  if (Number.isNaN(amount)) return null;
  const unit = match[2].toUpperCase();
  const scale = unit.startsWith("K")
    ? 1024
    : unit.startsWith("M")
      ? 1024 ** 2
      : unit.startsWith("G")
        ? 1024 ** 3
        : unit.startsWith("T")
          ? 1024 ** 4
          : 1;
  return amount * scale;
}

function crc32(str: string): number {
  const table = Array.from({ length: 256 }, (_, i) => {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    return c;
  });

  let crc = 0xffffffff;
  for (let i = 0; i < str.length; i++) {
    crc = table[(crc ^ str.charCodeAt(i)) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
