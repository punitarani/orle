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
          let result = btoa(unescape(encodeURIComponent(str)));
          if (opts.urlSafe) {
            result = result
              .replace(/\+/g, "-")
              .replace(/\//g, "_")
              .replace(/=+$/, "");
          }
          if (opts.lineWrap) {
            result = result.match(/.{1,76}/g)?.join("\n") || result;
          }
          return result;
        }
        let decoded = str.replace(/\s/g, "");
        if (opts.urlSafe) {
          decoded = decoded.replace(/-/g, "+").replace(/_/g, "/");
          while (decoded.length % 4) decoded += "=";
        }
        return decodeURIComponent(escape(atob(decoded)));
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
    inputType: "dual",
    outputType: "text",
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
    ],
    transform: async (input, opts) => {
      if (opts.mode === "encode") {
        if (input instanceof File) {
          const buffer = await input.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          let binary = "";
          bytes.forEach((b) => {
            binary += String.fromCharCode(b);
          });
          return btoa(binary);
        }
        return { type: "error", message: "Please drop a file" };
      }
      // For decode mode, return the base64 as-is (download handled by UI)
      return String(input);
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
      if (str.startsWith("data:image/")) {
        return { type: "image", data: str };
      }
      // Assume it's raw base64, try to detect format
      const formats = ["png", "jpeg", "gif", "webp", "svg+xml"];
      for (const fmt of formats) {
        try {
          const dataUrl = `data:image/${fmt};base64,${str}`;
          return { type: "image", data: dataUrl };
        } catch {}
      }
      return { type: "image", data: `data:image/png;base64,${str}` };
    },
  },
  {
    slug: "image-to-base64",
    name: "Image → Base64",
    description: "Convert an image file to Base64 or Data URL",
    section: "base64",
    aliases: ["img-base64", "image-data-url"],
    inputType: "file",
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
      let binary = "";
      bytes.forEach((b) => {
        binary += String.fromCharCode(b);
      });
      const base64 = btoa(binary);
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
        const encoder = new TextEncoder();
        const bytes = encoder.encode(str);
        let hex = Array.from(bytes)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(opts.spacing ? " " : "");
        if (opts.uppercase) hex = hex.toUpperCase();
        if (opts.prefix) hex = `0x${hex.replace(/ /g, " 0x")}`;
        return hex;
      }
      try {
        let clean = str.replace(/0x/gi, "").replace(/\s/g, "");
        if (clean.length % 2 !== 0) clean = `0${clean}`;
        const matches = clean.match(/.{2}/g) ?? [];
        const bytes = new Uint8Array(
          matches.map((h) => Number.parseInt(h, 16)),
        );
        return new TextDecoder().decode(bytes);
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
      const encoder = new TextEncoder();
      const bytes = encoder.encode(str);
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
        const num = Number.parseInt(str, Number(opts.fromBase));
        if (Number.isNaN(num))
          return { type: "error", message: "Invalid number" };
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
        const utf8Bytes = new TextEncoder().encode(char);
        const utf16Units = char.length; // 1 for BMP, 2 for surrogate pair
        result.push(
          `${char.padEnd(4)} | U+${codePoint.toString(16).toUpperCase().padStart(4, "0")} | ${utf8Bytes.length} byte(s) | ${utf16Units} unit(s)`,
        );
      }

      const totalUtf8 = new TextEncoder().encode(str).length;
      result.push("─".repeat(50));
      result.push(
        `Total: ${str.length} chars, ${totalUtf8} UTF-8 bytes, ${str.length} UTF-16 units`,
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
        const binary = str
          .split("")
          .map((c) => c.charCodeAt(0).toString(2).padStart(8, "0"));
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
        const bytes = matches.map((b) => Number.parseInt(b, 2));
        return String.fromCharCode(...bytes);
      } catch {
        return { type: "error", message: "Invalid binary string" };
      }
    },
  },
];
