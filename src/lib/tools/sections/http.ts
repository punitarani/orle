import type { ToolDefinition } from "../types";

const MIME_MAP: Record<string, string> = {
  html: "text/html",
  json: "application/json",
  xml: "application/xml",
  txt: "text/plain",
  csv: "text/csv",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  svg: "image/svg+xml",
};

export const httpTools: ToolDefinition[] = [
  {
    slug: "http-suite",
    name: "HTTP Helper Suite",
    description: "Headers, cURL, auth, and URL utilities",
    section: "http",
    aliases: ["curl", "headers", "auth"],
    inputType: "text",
    outputType: "text",
    runPolicy: "manual",
    options: [
      {
        id: "mode",
        label: "Mode",
        type: "select",
        default: "headers-to-json",
        options: [
          { value: "headers-to-json", label: "Headers → JSON" },
          { value: "json-to-headers", label: "JSON → Headers" },
          { value: "curl-build", label: "Build cURL" },
          { value: "curl-parse", label: "Parse cURL" },
          { value: "basic-auth", label: "Basic auth" },
          { value: "url-build", label: "URL builder" },
          { value: "mime", label: "MIME lookup" },
        ],
      },
      {
        id: "method",
        label: "Method",
        type: "select",
        default: "GET",
        options: [
          { value: "GET", label: "GET" },
          { value: "POST", label: "POST" },
          { value: "PUT", label: "PUT" },
          { value: "DELETE", label: "DELETE" },
        ],
        visibleWhen: { optionId: "mode", equals: "curl-build" },
      },
      {
        id: "url",
        label: "URL",
        type: "text",
        default: "https://example.com",
        visibleWhen: { optionId: "mode", equals: "curl-build" },
      },
      {
        id: "body",
        label: "Body",
        type: "text",
        default: "",
        visibleWhen: { optionId: "mode", equals: "curl-build" },
      },
      {
        id: "username",
        label: "Username",
        type: "text",
        default: "",
        visibleWhen: { optionId: "mode", equals: "basic-auth" },
      },
      {
        id: "password",
        label: "Password",
        type: "text",
        default: "",
        visibleWhen: { optionId: "mode", equals: "basic-auth" },
      },
    ],
    transform: (input, opts) => {
      const text = String(input ?? "");
      const mode = String(opts.mode);

      switch (mode) {
        case "headers-to-json": {
          const headers: Record<string, string> = {};
          text.split(/\r?\n/).forEach((line) => {
            const [key, ...rest] = line.split(":");
            if (!key || rest.length === 0) return;
            headers[key.trim()] = rest.join(":").trim();
          });
          return JSON.stringify(headers, null, 2);
        }
        case "json-to-headers": {
          try {
            const obj = JSON.parse(text) as Record<string, string>;
            return Object.entries(obj)
              .map(([key, value]) => `${key}: ${value}`)
              .join("\n");
          } catch {
            return { type: "error", message: "Invalid JSON" };
          }
        }
        case "curl-build": {
          const method = String(opts.method || "GET");
          const url = String(opts.url || "");
          const headers = text
            .split(/\r?\n/)
            .filter(Boolean)
            .map((line) => `-H "${line}"`)
            .join(" ");
          const body = String(opts.body || "");
          const bodyPart = body ? `-d '${body.replace(/'/g, "'\\''")}'` : "";
          return `curl -X ${method} ${headers} ${bodyPart} "${url}"`.trim();
        }
        case "curl-parse": {
          const parsed = parseCurl(text);
          if (!parsed) return { type: "error", message: "Invalid cURL" };
          return JSON.stringify(parsed, null, 2);
        }
        case "basic-auth": {
          const user = String(opts.username || "");
          const pass = String(opts.password || "");
          if (!user && !pass) return "";
          return btoa(`${user}:${pass}`);
        }
        case "url-build": {
          try {
            const obj = JSON.parse(text);
            const base = (obj as Record<string, string>).base || "";
            const params = new URLSearchParams(
              (obj as Record<string, string>).params || {},
            );
            const fragment = (obj as Record<string, string>).hash || "";
            const url = `${base}${params.toString() ? `?${params.toString()}` : ""}${fragment ? `#${fragment}` : ""}`;
            return url;
          } catch {
            return {
              type: "error",
              message: "Provide JSON with base, params, hash",
            };
          }
        }
        case "mime": {
          const ext = text.replace(/^\./, "").toLowerCase();
          return MIME_MAP[ext] || "application/octet-stream";
        }
        default:
          return "";
      }
    },
  },
];

type ParsedCurl = {
  method: string;
  url: string;
  headers: Record<string, string>;
  data?: string;
  user?: string;
};

function parseCurl(input: string): ParsedCurl | null {
  const tokens = tokenizeCurl(input);
  if (tokens.length === 0) return null;
  const withoutCurl = tokens[0] === "curl" ? tokens.slice(1) : tokens;

  let method = "GET";
  let url = "";
  const headers: Record<string, string> = {};
  let data: string | undefined;
  let user: string | undefined;

  for (let i = 0; i < withoutCurl.length; i += 1) {
    const token = withoutCurl[i];
    switch (token) {
      case "-X":
      case "--request":
        method = String(withoutCurl[i + 1] || "GET").toUpperCase();
        i += 1;
        break;
      case "-H":
      case "--header": {
        const header = withoutCurl[i + 1] || "";
        i += 1;
        const [key, ...rest] = header.split(":");
        if (key && rest.length) {
          headers[key.trim()] = rest.join(":").trim();
        }
        break;
      }
      case "-d":
      case "--data":
      case "--data-raw":
      case "--data-binary":
      case "--data-urlencode":
        data = withoutCurl[i + 1] || "";
        i += 1;
        break;
      case "-u":
      case "--user":
        user = withoutCurl[i + 1] || "";
        i += 1;
        break;
      default:
        if (!token.startsWith("-") && !url) {
          url = token;
        }
    }
  }

  if (!url) return null;
  if (data && method === "GET") method = "POST";

  return { method, url, headers, data, user };
}

function tokenizeCurl(input: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let inSingle = false;
  let inDouble = false;
  let escaped = false;

  for (const char of input.trim()) {
    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }
    if (char === "\\" && !inSingle) {
      escaped = true;
      continue;
    }
    if (char === "'" && !inDouble) {
      inSingle = !inSingle;
      continue;
    }
    if (char === '"' && !inSingle) {
      inDouble = !inDouble;
      continue;
    }
    if (char === " " && !inSingle && !inDouble) {
      if (current) {
        tokens.push(current);
        current = "";
      }
      continue;
    }
    current += char;
  }
  if (current) tokens.push(current);
  return tokens;
}
