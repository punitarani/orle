import { toASCII, toUnicode } from "punycode";
import type { ToolDefinition } from "../types";

export const encodingTools: ToolDefinition[] = [
  {
    slug: "encoding-suite",
    name: "URL & Encoding Suite",
    description: "URL, HTML, Unicode, and query helpers",
    section: "encoding",
    aliases: ["url", "html", "unicode", "punycode"],
    inputType: "text",
    outputType: "text",
    runPolicy: "manual",
    options: [
      {
        id: "mode",
        label: "Mode",
        type: "select",
        default: "url-encode",
        options: [
          { value: "url-encode", label: "URL encode" },
          { value: "url-decode", label: "URL decode" },
          { value: "query-parse", label: "Querystring → JSON" },
          { value: "query-build", label: "JSON → Querystring" },
          { value: "html-encode", label: "HTML entities encode" },
          { value: "html-decode", label: "HTML entities decode" },
          { value: "unicode-normalize", label: "Unicode normalize" },
          { value: "punycode-encode", label: "Punycode encode" },
          { value: "punycode-decode", label: "Punycode decode" },
          { value: "rot13", label: "ROT13" },
        ],
      },
      {
        id: "normalizeForm",
        label: "Normalize form",
        type: "select",
        default: "NFC",
        options: [
          { value: "NFC", label: "NFC" },
          { value: "NFD", label: "NFD" },
          { value: "NFKC", label: "NFKC" },
          { value: "NFKD", label: "NFKD" },
        ],
        visibleWhen: { optionId: "mode", equals: "unicode-normalize" },
      },
    ],
    transform: (input, opts) => {
      const text = String(input ?? "");
      const mode = String(opts.mode);

      switch (mode) {
        case "url-encode":
          return encodeURIComponent(text);
        case "url-decode":
          try {
            return decodeURIComponent(text);
          } catch {
            return { type: "error", message: "Invalid URL encoding" };
          }
        case "query-parse": {
          const params = new URLSearchParams(text.trim().replace(/^\?/, ""));
          const obj: Record<string, string | string[]> = {};
          params.forEach((value, key) => {
            if (key in obj) {
              const existing = obj[key];
              obj[key] = Array.isArray(existing)
                ? [...existing, value]
                : [existing, value];
            } else {
              obj[key] = value;
            }
          });
          return JSON.stringify(obj, null, 2);
        }
        case "query-build": {
          try {
            const obj = JSON.parse(text);
            const params = new URLSearchParams();
            for (const [key, value] of Object.entries(
              obj as Record<string, unknown>,
            )) {
              if (Array.isArray(value)) {
                for (const item of value) {
                  params.append(key, String(item));
                }
              } else if (value !== undefined && value !== null) {
                params.append(key, String(value));
              }
            }
            return params.toString();
          } catch {
            return { type: "error", message: "Invalid JSON input" };
          }
        }
        case "html-encode": {
          return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
        }
        case "html-decode": {
          return text
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&amp;/g, "&");
        }
        case "unicode-normalize":
          return text.normalize(String(opts.normalizeForm || "NFC"));
        case "punycode-encode":
          return toASCII(text);
        case "punycode-decode":
          return toUnicode(text);
        case "rot13":
          return text.replace(/[a-zA-Z]/g, (char) => {
            const base = char <= "Z" ? 65 : 97;
            const code = char.charCodeAt(0) - base;
            return String.fromCharCode(((code + 13) % 26) + base);
          });
        default:
          return "";
      }
    },
  },
];
