import {
  base64ToBytes,
  base64ToUrlSafe,
  bytesToBase64,
  bytesToHex,
  bytesToUtf8,
  hexToBytes,
  normalizeBase64,
  parseBigInt,
  parseDataUrl,
  sniffImageMime,
  utf8ToBytes,
  wrap76,
} from "../lib/bytes-codec";
import type { ToolDefinition } from "../types";

export const base64Tools: ToolDefinition[] = [
  {
    slug: "base64-text",
    name: "Base64 Encode / Decode (Text)",
    description: "Encode or decode UTF-8 text to/from Base64",
    section: "base64",
    aliases: ["base64", "btoa", "atob"],
    inputType: "text",
    outputType: "text",
    allowSwap: true,
    options: [
      {
        id: "mode",
        label: "Mode",
        type: "select",
        default: "encode",
        options: [
          { value: "encode", label: "Encode" },
          { value: "decode", label: "Decode" },
        ],
      },
      {
        id: "urlSafe",
        label: "URL-safe Base64",
        type: "toggle",
        default: false,
      },
      {
        id: "lineWrap",
        label: "Line wrap (76 chars)",
        type: "toggle",
        default: false,
      },
    ],
    transform: (input, opts) => {
      const str = String(input);
      if (!str) return "";
      try {
        if (opts.mode === "encode") {
          const bytes = utf8ToBytes(str);
          let result = bytesToBase64(bytes);
          if (opts.urlSafe) {
            result = base64ToUrlSafe(result);
          }
          if (opts.lineWrap) {
            result = wrap76(result);
          }
          return result;
        }
        const normalized = normalizeBase64(str, Boolean(opts.urlSafe));
        const bytes = base64ToBytes(normalized);
        return bytesToUtf8(bytes);
      } catch {
        return { type: "error", message: "Invalid Base64 string" };
      }
    },
    examples: [{ input: "Hello, World!", output: "SGVsbG8sIFdvcmxkIQ==" }],
  },
  {
    slug: "base64-file",
    name: "Base64 Encode / Decode (File)",
    description: "Convert files to/from Base64",
    section: "base64",
    aliases: ["file-base64", "binary-base64"],
    inputType: "text",
    outputType: "text",
    acceptsFile: true,
    fileAccept: "*/*",
    options: [
      {
        id: "mode",
        label: "Mode",
        type: "select",
        default: "encode",
        options: [
          { value: "encode", label: "File → Base64" },
          { value: "decode", label: "Base64 → Download" },
        ],
      },
      {
        id: "filename",
        label: "Download filename",
        type: "text",
        default: "decoded.bin",
        visibleWhen: { optionId: "mode", equals: "decode" },
      },
      {
        id: "mime",
        label: "MIME type",
        type: "text",
        default: "application/octet-stream",
        visibleWhen: { optionId: "mode", equals: "decode" },
      },
    ],
    transform: async (input, opts) => {
      if (opts.mode === "encode") {
        if (input instanceof File) {
          const buffer = await input.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          return bytesToBase64(bytes);
        }
        return { type: "error", message: "Please drop a file" };
      }
      const raw = String(input).trim();
      if (!raw) return "";

      try {
        let base64 = raw;
        let detectedMime = "application/octet-stream";
        const dataUrl = parseDataUrl(raw);
        if (dataUrl) {
          if (!dataUrl.isBase64) {
            return {
              type: "error",
              message: "Data URL must be base64-encoded",
            };
          }
          base64 = dataUrl.data;
          detectedMime = dataUrl.mime || detectedMime;
        }

        const urlSafe = /[-_]/.test(base64);
        const normalized = normalizeBase64(base64, urlSafe);
        const bytes = base64ToBytes(normalized);
        const filename = String(opts.filename || "decoded.bin");
        const mime = String(opts.mime || detectedMime);

        return { type: "download", data: bytes, filename, mime };
      } catch {
        return { type: "error", message: "Invalid Base64 string" };
      }
    },
  },
  {
    slug: "base64-url-convert",
    name: "Base64 ↔ Base64URL",
    description: "Convert between standard Base64 and URL-safe Base64",
    section: "base64",
    aliases: ["base64url", "url-safe-base64"],
    inputType: "text",
    outputType: "text",
    allowSwap: true,
    options: [
      {
        id: "mode",
        label: "Mode",
        type: "select",
        default: "toUrl",
        options: [
          { value: "toUrl", label: "Base64 → Base64URL" },
          { value: "toStd", label: "Base64URL → Base64" },
        ],
      },
    ],
    transform: (input, opts) => {
      const str = String(input).trim();
      if (!str) return "";
      if (opts.mode === "toUrl") {
        return str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
      }
      let result = str.replace(/-/g, "+").replace(/_/g, "/");
      while (result.length % 4) result += "=";
      return result;
    },
  },
  {
    slug: "base64-image-preview",
    name: "Base64 → Image Preview",
    description: "Preview an image from Base64 or Data URL",
    section: "base64",
    aliases: ["image-preview", "data-url-preview"],
    inputType: "text",
    outputType: "image",
    inputPlaceholder: "Paste Base64 or data:image/... URL",
    transform: (input) => {
      const str = String(input).trim();
      if (!str) return "";
      const dataUrl = parseDataUrl(str);
      if (dataUrl?.mime.startsWith("image/")) {
        if (!dataUrl.isBase64) {
          return { type: "error", message: "Image data URL must be base64" };
        }
        return { type: "image", data: str };
      }

      try {
        const normalized = normalizeBase64(str, true);
        const bytes = base64ToBytes(normalized);
        const mime = sniffImageMime(bytes) ?? "image/png";
        const base64 = bytesToBase64(bytes);
        return { type: "image", data: `data:${mime};base64,${base64}` };
      } catch {
        return { type: "error", message: "Invalid Base64 string" };
      }
    },
  },
  {
    slug: "image-to-base64",
    name: "Image → Base64",
    description: "Convert an image file to Base64 or Data URL",
    section: "base64",
    aliases: ["img-base64", "image-data-url"],
    inputType: "file",
    fileAccept: "image/*",
    outputType: "text",
    options: [
      {
        id: "includeDataUrl",
        label: "Include data: prefix",
        type: "toggle",
        default: true,
      },
    ],
    transform: async (input, opts) => {
      if (!(input instanceof File)) {
        return { type: "error", message: "Please drop an image file" };
      }
      const buffer = await input.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const base64 = bytesToBase64(bytes);
      if (opts.includeDataUrl) {
        return `data:${input.type};base64,${base64}`;
      }
      return base64;
    },
  },
  {
    slug: "hex-encode",
    name: "Hex Encode / Decode",
    description: "Convert text to/from hexadecimal representation",
    section: "base64",
    aliases: ["hexadecimal", "hex", "text-to-hex"],
    inputType: "text",
    outputType: "text",
    allowSwap: true,
    options: [
      {
        id: "mode",
        label: "Mode",
        type: "select",
        default: "encode",
        options: [
          { value: "encode", label: "Text → Hex" },
          { value: "decode", label: "Hex → Text" },
        ],
      },
      { id: "uppercase", label: "Uppercase", type: "toggle", default: false },
      { id: "prefix", label: "0x prefix", type: "toggle", default: false },
      {
        id: "spacing",
        label: "Space between bytes",
        type: "toggle",
        default: false,
      },
    ],
    transform: (input, opts) => {
      const str = String(input);
      if (!str) return "";
      if (opts.mode === "encode") {
        const bytes = utf8ToBytes(str);
        let hex = bytesToHex(bytes, Boolean(opts.uppercase));
        if (opts.spacing) {
          hex = hex.match(/.{1,2}/g)?.join(" ") ?? hex;
        }
        if (opts.prefix) hex = `0x${hex.replace(/ /g, " 0x")}`;
        return hex;
      }
      try {
        const bytes = hexToBytes(str);
        return bytesToUtf8(bytes);
      } catch {
        return { type: "error", message: "Invalid hex string" };
      }
    },
    examples: [{ input: "Hello", output: "48656c6c6f" }],
  },
  {
    slug: "bytes-viewer",
    name: "Bytes Viewer",
    description: "View text as hex dump with offset and ASCII columns",
    section: "base64",
    aliases: ["hex-dump", "hex-viewer", "binary-viewer"],
    inputType: "text",
    outputType: "text",
    options: [
      {
        id: "bytesPerLine",
        label: "Bytes per line",
        type: "number",
        default: 16,
        min: 8,
        max: 32,
      },
    ],
    transform: (input, opts) => {
      const str = String(input);
      if (!str) return "";
      const bytes = utf8ToBytes(str);
      const perLine = Number(opts.bytesPerLine) || 16;
      const lines: string[] = [];

      for (let i = 0; i < bytes.length; i += perLine) {
        const chunk = bytes.slice(i, i + perLine);
        const offset = i.toString(16).padStart(8, "0");
        const hex = Array.from(chunk)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(" ");
        const ascii = Array.from(chunk)
          .map((b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : "."))
          .join("");
        lines.push(`${offset}  ${hex.padEnd(perLine * 3 - 1)}  |${ascii}|`);
      }
      return lines.join("\n");
    },
  },
  {
    slug: "base64-converter",
    name: "Binary / Octal / Decimal Converter",
    description:
      "Convert numbers between binary, octal, decimal, and hexadecimal",
    section: "base64",
    aliases: ["bin", "oct", "dec", "number-base"],
    inputType: "text",
    outputType: "text",
    options: [
      {
        id: "fromBase",
        label: "From Base",
        type: "select",
        default: "10",
        options: [
          { value: "2", label: "Binary (2)" },
          { value: "8", label: "Octal (8)" },
          { value: "10", label: "Decimal (10)" },
          { value: "16", label: "Hexadecimal (16)" },
        ],
      },
    ],
    transform: (input, opts) => {
      const str = String(input).trim().replace(/\s/g, "");
      if (!str) return "";
      try {
        const fromBase = Number(opts.fromBase);
        const normalized = fromBase === 16 ? str.replace(/^0x/i, "") : str;
        const num = parseBigInt(normalized, fromBase);
        return [
          `Binary:      ${num.toString(2)}`,
          `Octal:       ${num.toString(8)}`,
          `Decimal:     ${num.toString(10)}`,
          `Hexadecimal: ${num.toString(16).toUpperCase()}`,
        ].join("\n");
      } catch {
        return { type: "error", message: "Invalid number" };
      }
    },
    examples: [
      {
        input: "255",
        output:
          "Binary:      11111111\nOctal:       377\nDecimal:     255\nHexadecimal: FF",
      },
    ],
  },
  {
    slug: "utf-inspector",
    name: "UTF-8 / UTF-16 Code Unit Inspector",
    description: "Inspect code points, surrogate pairs, and byte lengths",
    section: "base64",
    aliases: ["codepoint", "unicode-inspector", "emoji-bytes"],
    inputType: "text",
    outputType: "text",
    transform: (input) => {
      const str = String(input);
      if (!str) return "";
      const result: string[] = [
        "Char | CodePoint | UTF-8 Bytes | UTF-16 Units",
        "─".repeat(50),
      ];

      for (const char of str) {
        const codePoint = char.codePointAt(0);
        if (codePoint === undefined) continue;
        const utf8Bytes = utf8ToBytes(char);
        const utf16Units = char.length; // 1 for BMP, 2 for surrogate pair
        result.push(
          `${char.padEnd(4)} | U+${codePoint.toString(16).toUpperCase().padStart(4, "0")} | ${utf8Bytes.length} byte(s) | ${utf16Units} unit(s)`,
        );
      }

      const totalUtf8 = utf8ToBytes(str).length;
      const totalCodePoints = Array.from(str).length;
      const totalUtf16 = str.length;
      const graphemeCount =
        typeof Intl !== "undefined" && "Segmenter" in Intl
          ? Array.from(new Intl.Segmenter().segment(str)).length
          : undefined;
      result.push("─".repeat(50));
      result.push(
        `Total: ${totalCodePoints} code points, ${totalUtf8} UTF-8 bytes, ${totalUtf16} UTF-16 units${graphemeCount ? `, ${graphemeCount} graphemes` : ""}`,
      );
      return result.join("\n");
    },
    examples: [
      { input: "👋🌍", output: "Shows emoji code points and byte sizes" },
    ],
  },
  {
    slug: "ascii-binary",
    name: "ASCII ↔ Binary",
    description: "Convert text to/from 8-bit binary representation",
    section: "base64",
    aliases: ["text-binary", "binary-text"],
    inputType: "text",
    outputType: "text",
    allowSwap: true,
    options: [
      {
        id: "mode",
        label: "Mode",
        type: "select",
        default: "toBinary",
        options: [
          { value: "toBinary", label: "Text → Binary" },
          { value: "toText", label: "Binary → Text" },
        ],
      },
      {
        id: "spacing",
        label: "Space between bytes",
        type: "toggle",
        default: true,
      },
    ],
    transform: (input, opts) => {
      const str = String(input);
      if (!str) return "";
      if (opts.mode === "toBinary") {
        const bytes = utf8ToBytes(str);
        const binary = Array.from(bytes).map((b) =>
          b.toString(2).padStart(8, "0"),
        );
        return opts.spacing ? binary.join(" ") : binary.join("");
      }
      try {
        const clean = str.replace(/\s/g, "");
        if (clean.length % 8 !== 0)
          return {
            type: "error",
            message: "Invalid binary (must be multiple of 8 bits)",
          };
        const matches = clean.match(/.{8}/g) ?? [];
        const bytes = new Uint8Array(matches.map((b) => Number.parseInt(b, 2)));
        return bytesToUtf8(bytes);
      } catch {
        return { type: "error", message: "Invalid binary string" };
      }
    },
  },
];
