import type { ToolDefinition } from "../types";

export const encodingTools: ToolDefinition[] = [
  {
    slug: "url-encode",
    name: "URL Encode / Decode",
    description: "Encode or decode URL components and full URLs",
    section: "encoding",
    aliases: [
      "urlencode",
      "percent-encoding",
      "encodeuri",
      "encodeURIComponent",
    ],
    inputType: "text",
    outputType: "text",
    allowSwap: true,
    inputPlaceholder: "Enter text to encode...",
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
        id: "type",
        label: "Type",
        type: "select",
        default: "component",
        options: [
          { value: "component", label: "Component (encodeURIComponent)" },
          { value: "full", label: "Full URL (encodeURI)" },
        ],
      },
      {
        id: "spaceAsPlus",
        label: "Space as +",
        type: "toggle",
        default: false,
      },
    ],
    transform: (input, opts) => {
      const str = String(input);
      if (!str) return "";
      try {
        if (opts.mode === "encode") {
          let result =
            opts.type === "component"
              ? encodeURIComponent(str)
              : encodeURI(str);
          if (opts.spaceAsPlus) result = result.replace(/%20/g, "+");
          return result;
        }
        const decoded = opts.spaceAsPlus ? str.replace(/\+/g, "%20") : str;
        return opts.type === "component"
          ? decodeURIComponent(decoded)
          : decodeURI(decoded);
      } catch {
        return { type: "error", message: "Invalid encoded string" };
      }
    },
    examples: [
      { input: "hello world", output: "hello%20world" },
      {
        input: "https://example.com/path?q=hello world",
        output: "https://example.com/path?q=hello%20world",
      },
    ],
  },
  {
    slug: "url-parse",
    name: "Parse URL",
    description: "Break down a URL into its components",
    section: "encoding",
    aliases: ["url-parts", "url-components", "parse-uri"],
    inputType: "text",
    outputType: "text",
    inputPlaceholder: "Enter a URL to parse...",
    transform: (input) => {
      const str = String(input).trim();
      if (!str) return "";
      try {
        const url = new URL(str);
        const params = Object.fromEntries(url.searchParams.entries());
        return JSON.stringify(
          {
            protocol: url.protocol,
            host: url.host,
            hostname: url.hostname,
            port: url.port || "(default)",
            pathname: url.pathname,
            search: url.search,
            searchParams: params,
            hash: url.hash,
            origin: url.origin,
          },
          null,
          2,
        );
      } catch {
        return { type: "error", message: "Invalid URL" };
      }
    },
    examples: [{ input: "https://example.com:8080/path?a=1&b=2#section" }],
  },
  {
    slug: "query-string-json",
    name: "Query String ↔ JSON",
    description: "Convert between query strings and JSON objects",
    section: "encoding",
    aliases: ["querystring", "qs", "search-params"],
    inputType: "text",
    outputType: "text",
    allowSwap: true,
    options: [
      {
        id: "mode",
        label: "Mode",
        type: "select",
        default: "toJson",
        options: [
          { value: "toJson", label: "Query String → JSON" },
          { value: "toQuery", label: "JSON → Query String" },
        ],
      },
    ],
    transform: (input, opts) => {
      const str = String(input).trim();
      if (!str) return "";
      try {
        if (opts.mode === "toJson") {
          const clean = str.startsWith("?") ? str.slice(1) : str;
          const params = new URLSearchParams(clean);
          return JSON.stringify(Object.fromEntries(params.entries()), null, 2);
        }
        const obj = JSON.parse(str);
        return new URLSearchParams(obj).toString();
      } catch {
        return {
          type: "error",
          message:
            opts.mode === "toJson" ? "Invalid query string" : "Invalid JSON",
        };
      }
    },
    examples: [
      {
        input: "a=1&b=2&c=hello",
        output: '{\n  "a": "1",\n  "b": "2",\n  "c": "hello"\n}',
      },
    ],
  },
  {
    slug: "utm-stripper",
    name: "UTM / Tracking Stripper",
    description: "Remove common tracking parameters from URLs",
    section: "encoding",
    aliases: ["remove-tracking", "clean-url", "fbclid", "gclid"],
    inputType: "text",
    outputType: "text",
    transform: (input) => {
      const str = String(input).trim();
      if (!str) return "";
      try {
        const url = new URL(str);
        const trackingParams = [
          "utm_source",
          "utm_medium",
          "utm_campaign",
          "utm_term",
          "utm_content",
          "fbclid",
          "gclid",
          "msclkid",
          "twclid",
          "igshid",
          "mc_eid",
          "mc_cid",
          "ref",
          "source",
          "campaign",
          "_ga",
          "_gl",
          "yclid",
          "dclid",
        ];
        for (const p of trackingParams) {
          url.searchParams.delete(p);
        }
        return url.toString();
      } catch {
        return { type: "error", message: "Invalid URL" };
      }
    },
    examples: [
      {
        input: "https://example.com/page?utm_source=twitter&id=123",
        output: "https://example.com/page?id=123",
      },
    ],
  },
  {
    slug: "url-normalize",
    name: "URL Normalizer",
    description:
      "Normalize URLs: lowercase host, remove default ports, clean slashes",
    section: "encoding",
    aliases: ["clean-url", "normalize-uri"],
    inputType: "text",
    outputType: "text",
    transform: (input) => {
      const str = String(input).trim();
      if (!str) return "";
      try {
        const url = new URL(str);
        // Remove default ports
        if (
          (url.protocol === "http:" && url.port === "80") ||
          (url.protocol === "https:" && url.port === "443")
        ) {
          url.port = "";
        }
        // Collapse multiple slashes in path
        url.pathname = url.pathname.replace(/\/+/g, "/");
        // Remove trailing ?
        let result = url.toString();
        if (result.endsWith("?")) result = result.slice(0, -1);
        return result;
      } catch {
        return { type: "error", message: "Invalid URL" };
      }
    },
  },
  {
    slug: "data-url",
    name: "Data URL Builder / Parser",
    description: "Build or parse data: URLs (base64 encoded)",
    section: "encoding",
    aliases: ["data-uri", "base64-url"],
    inputType: "text",
    outputType: "text",
    options: [
      {
        id: "mode",
        label: "Mode",
        type: "select",
        default: "build",
        options: [
          { value: "build", label: "Build Data URL" },
          { value: "parse", label: "Parse Data URL" },
        ],
      },
      {
        id: "mimeType",
        label: "MIME Type",
        type: "text",
        default: "text/plain",
      },
    ],
    transform: (input, opts) => {
      const str = String(input);
      if (!str) return "";
      if (opts.mode === "build") {
        const base64 = btoa(unescape(encodeURIComponent(str)));
        return `data:${opts.mimeType};base64,${base64}`;
      }
      try {
        const match = str.match(/^data:([^;,]+)?(?:;base64)?,(.*)$/);
        if (!match)
          return { type: "error", message: "Invalid data URL format" };
        const [, mime, data] = match;
        const decoded = decodeURIComponent(escape(atob(data)));
        return JSON.stringify(
          { mimeType: mime || "text/plain", content: decoded },
          null,
          2,
        );
      } catch {
        return { type: "error", message: "Failed to parse data URL" };
      }
    },
  },
  {
    slug: "punycode",
    name: "IDN / Punycode Converter",
    description: "Convert between Unicode domains and ASCII Punycode",
    section: "encoding",
    aliases: ["idn", "internationalized-domain"],
    inputType: "text",
    outputType: "text",
    options: [
      {
        id: "mode",
        label: "Mode",
        type: "select",
        default: "toAscii",
        options: [
          { value: "toAscii", label: "Unicode → Punycode" },
          { value: "toUnicode", label: "Punycode → Unicode" },
        ],
      },
    ],
    transform: async (input, opts) => {
      const str = String(input).trim();
      if (!str) return "";
      const punycode = await import("punycode");
      try {
        return opts.mode === "toAscii"
          ? punycode.toASCII(str)
          : punycode.toUnicode(str);
      } catch {
        return { type: "error", message: "Invalid domain" };
      }
    },
    examples: [{ input: "münchen.example", output: "xn--mnchen-3ya.example" }],
  },
  {
    slug: "html-entities",
    name: "HTML Entity Encode / Decode",
    description: "Convert special characters to HTML entities and back",
    section: "encoding",
    aliases: ["html-escape", "htmlencode", "amp"],
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
    ],
    transform: (input, opts) => {
      const str = String(input);
      if (!str) return "";
      const entities: Record<string, string> = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };
      if (opts.mode === "encode") {
        return str.replace(/[&<>"']/g, (c) => entities[c] || c);
      }
      const reversed = Object.fromEntries(
        Object.entries(entities).map(([k, v]) => [v, k]),
      );
      return str.replace(/&(?:amp|lt|gt|quot|#39);/g, (e) => reversed[e] || e);
    },
    examples: [
      {
        input: '<div class="test">',
        output: "&lt;div class=&quot;test&quot;&gt;",
      },
    ],
  },
  {
    slug: "xml-escape",
    name: "XML Escape / Unescape",
    description: "Escape or unescape XML special characters",
    section: "encoding",
    aliases: ["xml-entities"],
    inputType: "text",
    outputType: "text",
    allowSwap: true,
    options: [
      {
        id: "mode",
        label: "Mode",
        type: "select",
        default: "escape",
        options: [
          { value: "escape", label: "Escape" },
          { value: "unescape", label: "Unescape" },
        ],
      },
    ],
    transform: (input, opts) => {
      const str = String(input);
      if (!str) return "";
      const entities: Record<string, string> = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      };
      if (opts.mode === "escape") {
        return str.replace(/[&<>"']/g, (c) => entities[c] || c);
      }
      const reversed = Object.fromEntries(
        Object.entries(entities).map(([k, v]) => [v, k]),
      );
      return str.replace(/&(?:amp|lt|gt|quot|apos);/g, (e) => reversed[e] || e);
    },
  },
  {
    slug: "unicode-escape",
    name: "Unicode Escape / Unescape",
    description: "Convert to/from \\uXXXX Unicode escape sequences",
    section: "encoding",
    aliases: ["unicode", "utf16-escape"],
    inputType: "text",
    outputType: "text",
    allowSwap: true,
    options: [
      {
        id: "mode",
        label: "Mode",
        type: "select",
        default: "escape",
        options: [
          { value: "escape", label: "Escape" },
          { value: "unescape", label: "Unescape" },
        ],
      },
    ],
    transform: (input, opts) => {
      const str = String(input);
      if (!str) return "";
      if (opts.mode === "escape") {
        return str
          .split("")
          .map((c) => {
            const code = c.charCodeAt(0);
            return code > 127 ? `\\u${code.toString(16).padStart(4, "0")}` : c;
          })
          .join("");
      }
      return str.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
        String.fromCharCode(Number.parseInt(hex, 16)),
      );
    },
    examples: [{ input: "Hello 世界", output: "Hello \\u4e16\\u754c" }],
  },
  {
    slug: "json-string-escape",
    name: "JSON String Escape / Unescape",
    description: "Escape or unescape strings for JSON embedding",
    section: "encoding",
    aliases: ["json-escape", "stringify"],
    inputType: "text",
    outputType: "text",
    allowSwap: true,
    options: [
      {
        id: "mode",
        label: "Mode",
        type: "select",
        default: "escape",
        options: [
          { value: "escape", label: "Escape" },
          { value: "unescape", label: "Unescape" },
        ],
      },
    ],
    transform: (input, opts) => {
      const str = String(input);
      if (!str) return "";
      if (opts.mode === "escape") {
        return JSON.stringify(str).slice(1, -1);
      }
      try {
        return JSON.parse(`"${str}"`);
      } catch {
        return { type: "error", message: "Invalid escaped string" };
      }
    },
    examples: [
      {
        input: 'Line1\nLine2\t"quoted"',
        output: 'Line1\\nLine2\\t\\"quoted\\"',
      },
    ],
  },
];
