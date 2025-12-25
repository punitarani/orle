import { base32, base58 } from "@scure/base";
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
    slug: "bytes-suite",
    name: "Bytes & Encodings Suite",
    description: "Base64, hex, binary, and file conversions",
    section: "base64",
    aliases: ["base64", "hex", "binary", "bytes"],
    inputType: "text",
    outputType: "preview",
    acceptsFile: true,
    fileAccept: "*/*",
    runPolicy: "manual",
    options: [
      {
        id: "mode",
        label: "Mode",
        type: "select",
        default: "base64-text",
        options: [
          { value: "base64-text", label: "Text → Base64" },
          { value: "base64-decode", label: "Base64 → Text" },
          { value: "base64url-text", label: "Text → Base64URL" },
          { value: "base64url-decode", label: "Base64URL → Text" },
          { value: "base32-text", label: "Text → Base32" },
          { value: "base32-decode", label: "Base32 → Text" },
          { value: "base58-text", label: "Text → Base58" },
          { value: "base58-decode", label: "Base58 → Text" },
          { value: "hex-text", label: "Text → Hex" },
          { value: "hex-decode", label: "Hex → Text" },
          { value: "binary-text", label: "Text → Binary" },
          { value: "binary-decode", label: "Binary → Text" },
          { value: "file-to-base64", label: "File → Base64" },
          { value: "base64-to-file", label: "Base64 → Download" },
          { value: "data-url", label: "Data URL inspector" },
          { value: "image-preview", label: "Base64 image preview" },
          { value: "bytes-viewer", label: "Bytes viewer" },
          { value: "utf-inspector", label: "UTF inspector" },
          { value: "number-base", label: "Number base convert" },
        ],
      },
      {
        id: "lineWrap",
        label: "Line wrap (76 chars)",
        type: "toggle",
        default: false,
        visibleWhen: { optionId: "mode", equals: "base64-text" },
      },
      {
        id: "uppercase",
        label: "Uppercase",
        type: "toggle",
        default: false,
        visibleWhen: { optionId: "mode", equals: "hex-text" },
      },
      {
        id: "prefix",
        label: "0x prefix",
        type: "toggle",
        default: false,
        visibleWhen: { optionId: "mode", equals: "hex-text" },
      },
      {
        id: "spacing",
        label: "Space between bytes",
        type: "toggle",
        default: true,
        visibleWhen: { optionId: "mode", equals: ["hex-text", "binary-text"] },
      },
      {
        id: "bytesPerLine",
        label: "Bytes per line",
        type: "number",
        default: 16,
        min: 8,
        max: 32,
        visibleWhen: { optionId: "mode", equals: "bytes-viewer" },
      },
      {
        id: "filename",
        label: "Download filename",
        type: "text",
        default: "decoded.bin",
        visibleWhen: { optionId: "mode", equals: "base64-to-file" },
      },
      {
        id: "mime",
        label: "MIME type",
        type: "text",
        default: "application/octet-stream",
        visibleWhen: { optionId: "mode", equals: "base64-to-file" },
      },
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
        visibleWhen: { optionId: "mode", equals: "number-base" },
      },
    ],
    transform: async (input, opts) => {
      const mode = String(opts.mode);

      const hasFile = typeof File !== "undefined";
      const isFileInput = hasFile && input instanceof File;
      if (mode === "file-to-base64") {
        if (!isFileInput) {
          return { type: "error", message: "Please drop a file" };
        }
        const buffer = await (input as File).arrayBuffer();
        return bytesToBase64(new Uint8Array(buffer));
      }

      if (isFileInput) {
        return {
          type: "error",
          message: "Clear the file input to use text modes",
        };
      }

      const text = String(input ?? "");
      if (!text && !["utf-inspector", "bytes-viewer"].includes(mode)) {
        return "";
      }

      switch (mode) {
        case "base64-text": {
          const base64 = bytesToBase64(utf8ToBytes(text));
          return opts.lineWrap ? wrap76(base64) : base64;
        }
        case "base64-decode": {
          try {
            const normalized = normalizeBase64(text, false);
            return bytesToUtf8(base64ToBytes(normalized));
          } catch {
            return { type: "error", message: "Invalid Base64 string" };
          }
        }
        case "base64url-text": {
          const base64 = bytesToBase64(utf8ToBytes(text));
          return base64ToUrlSafe(base64);
        }
        case "base64url-decode": {
          try {
            const normalized = normalizeBase64(text, true);
            return bytesToUtf8(base64ToBytes(normalized));
          } catch {
            return { type: "error", message: "Invalid Base64URL string" };
          }
        }
        case "base32-text":
          return base32.encode(utf8ToBytes(text));
        case "base32-decode":
          try {
            return bytesToUtf8(base32.decode(text.trim()));
          } catch {
            return { type: "error", message: "Invalid Base32 string" };
          }
        case "base58-text":
          return base58.encode(utf8ToBytes(text));
        case "base58-decode":
          try {
            return bytesToUtf8(base58.decode(text.trim()));
          } catch {
            return { type: "error", message: "Invalid Base58 string" };
          }
        case "hex-text": {
          const bytes = utf8ToBytes(text);
          let hex = bytesToHex(bytes, Boolean(opts.uppercase));
          if (opts.spacing) {
            hex = hex.match(/.{1,2}/g)?.join(" ") ?? hex;
          }
          if (opts.prefix) hex = `0x${hex.replace(/ /g, " 0x")}`;
          return hex;
        }
        case "hex-decode": {
          try {
            const bytes = hexToBytes(text);
            return bytesToUtf8(bytes);
          } catch (error) {
            return { type: "error", message: (error as Error).message };
          }
        }
        case "binary-text": {
          const bytes = utf8ToBytes(text);
          const bits = Array.from(bytes).map((b) =>
            b.toString(2).padStart(8, "0"),
          );
          return opts.spacing ? bits.join(" ") : bits.join("");
        }
        case "binary-decode": {
          const clean = text.replace(/\s/g, "");
          if (!/^[01]*$/.test(clean)) {
            return {
              type: "error",
              message: "Binary input must use 0 or 1 only",
            };
          }
          if (clean.length % 8 !== 0) {
            return {
              type: "error",
              message: "Invalid binary (must be multiple of 8 bits)",
            };
          }
          const matches = clean.match(/.{8}/g) ?? [];
          const bytes = new Uint8Array(
            matches.map((b) => Number.parseInt(b, 2)),
          );
          return bytesToUtf8(bytes);
        }
        case "base64-to-file": {
          const raw = text.trim();
          if (!raw) return "";
          let base64 = raw;
          let detectedMime = "application/octet-stream";
          const dataUrl = parseDataUrl(raw);
          if (dataUrl) {
            if (!dataUrl.isBase64) {
              return { type: "error", message: "Data URL must be base64" };
            }
            base64 = dataUrl.data;
            detectedMime = dataUrl.mime || detectedMime;
          }
          let bytes: Uint8Array;
          try {
            const urlSafe = /[-_]/.test(base64);
            const normalized = normalizeBase64(base64, urlSafe);
            bytes = base64ToBytes(normalized);
          } catch {
            return { type: "error", message: "Invalid Base64 data" };
          }
          return {
            type: "download",
            data: bytes,
            filename: String(opts.filename || "decoded.bin"),
            mime: String(opts.mime || detectedMime),
          };
        }
        case "data-url": {
          const parsed = parseDataUrl(text.trim());
          if (!parsed) return { type: "error", message: "Invalid data URL" };
          const size = parsed.isBase64
            ? base64ToBytes(normalizeBase64(parsed.data, true)).length
            : parsed.data.length;
          return [
            `MIME: ${parsed.mime}`,
            `Base64: ${parsed.isBase64 ? "yes" : "no"}`,
            `Size: ${size} bytes`,
          ].join("\n");
        }
        case "image-preview": {
          const str = text.trim();
          if (str.startsWith("data:image/")) {
            return { type: "image", data: str };
          }
          let bytes: Uint8Array;
          try {
            const normalized = normalizeBase64(str, true);
            bytes = base64ToBytes(normalized);
          } catch {
            return { type: "error", message: "Invalid Base64 image data" };
          }
          const mime = sniffImageMime(bytes) ?? "image/png";
          const base64 = bytesToBase64(bytes);
          return { type: "image", data: `data:${mime};base64,${base64}` };
        }
        case "bytes-viewer": {
          const bytes = utf8ToBytes(text);
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
        }
        case "utf-inspector": {
          const result: string[] = [
            "Char | CodePoint | UTF-8 Bytes | UTF-16 Units",
            "─".repeat(50),
          ];
          for (const char of text) {
            const codePoint = char.codePointAt(0);
            if (codePoint === undefined) continue;
            const utf8Bytes = utf8ToBytes(char);
            const utf16Units = char.length;
            result.push(
              `${char.padEnd(4)} | U+${codePoint.toString(16).toUpperCase().padStart(4, "0")} | ${utf8Bytes.length} byte(s) | ${utf16Units} unit(s)`,
            );
          }
          const totalUtf8 = utf8ToBytes(text).length;
          const totalCodePoints = Array.from(text).length;
          const totalUtf16 = text.length;
          result.push("─".repeat(50));
          result.push(
            `Total: ${totalCodePoints} code points, ${totalUtf8} UTF-8 bytes, ${totalUtf16} UTF-16 units`,
          );
          return result.join("\n");
        }
        case "number-base": {
          const clean = text.trim().replace(/\s/g, "");
          if (!clean) return "";
          try {
            const fromBase = Number(opts.fromBase || "10");
            const normalized =
              fromBase === 16 ? clean.replace(/^0x/i, "") : clean;
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
        }
        default:
          return "";
      }
    },
  },
];
