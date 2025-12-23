import type { ToolDefinition } from "../types";

export const httpTools: ToolDefinition[] = [
  {
    slug: "http-status",
    name: "HTTP Status Code Lookup",
    description: "Look up HTTP status codes by number or keyword",
    section: "http",
    aliases: ["status-code", "404", "500", "200"],
    inputType: "text",
    outputType: "text",
    inputPlaceholder: "Enter status code or search keyword...",
    transform: (input) => {
      const str = String(input).trim().toLowerCase();
      if (!str) return "";

      const codes: Record<
        number,
        { name: string; description: string; category: string }
      > = {
        100: {
          name: "Continue",
          description: "Server received request headers, client should proceed",
          category: "Informational",
        },
        101: {
          name: "Switching Protocols",
          description: "Server switching to different protocol",
          category: "Informational",
        },
        200: {
          name: "OK",
          description: "Request succeeded",
          category: "Success",
        },
        201: {
          name: "Created",
          description: "Resource created successfully",
          category: "Success",
        },
        202: {
          name: "Accepted",
          description: "Request accepted for processing",
          category: "Success",
        },
        204: {
          name: "No Content",
          description: "Request succeeded with no response body",
          category: "Success",
        },
        206: {
          name: "Partial Content",
          description: "Partial resource returned (range request)",
          category: "Success",
        },
        301: {
          name: "Moved Permanently",
          description: "Resource permanently moved to new URL",
          category: "Redirection",
        },
        302: {
          name: "Found",
          description: "Resource temporarily at different URL",
          category: "Redirection",
        },
        303: {
          name: "See Other",
          description: "Response at different URI (use GET)",
          category: "Redirection",
        },
        304: {
          name: "Not Modified",
          description: "Resource not modified since last request",
          category: "Redirection",
        },
        307: {
          name: "Temporary Redirect",
          description: "Temporary redirect (preserve method)",
          category: "Redirection",
        },
        308: {
          name: "Permanent Redirect",
          description: "Permanent redirect (preserve method)",
          category: "Redirection",
        },
        400: {
          name: "Bad Request",
          description: "Server cannot process malformed request",
          category: "Client Error",
        },
        401: {
          name: "Unauthorized",
          description: "Authentication required",
          category: "Client Error",
        },
        403: {
          name: "Forbidden",
          description: "Server refuses to authorize request",
          category: "Client Error",
        },
        404: {
          name: "Not Found",
          description: "Resource not found",
          category: "Client Error",
        },
        405: {
          name: "Method Not Allowed",
          description: "HTTP method not supported for resource",
          category: "Client Error",
        },
        408: {
          name: "Request Timeout",
          description: "Server timed out waiting for request",
          category: "Client Error",
        },
        409: {
          name: "Conflict",
          description: "Request conflicts with current state",
          category: "Client Error",
        },
        410: {
          name: "Gone",
          description: "Resource permanently removed",
          category: "Client Error",
        },
        413: {
          name: "Payload Too Large",
          description: "Request entity too large",
          category: "Client Error",
        },
        415: {
          name: "Unsupported Media Type",
          description: "Media format not supported",
          category: "Client Error",
        },
        422: {
          name: "Unprocessable Entity",
          description: "Request well-formed but semantically incorrect",
          category: "Client Error",
        },
        429: {
          name: "Too Many Requests",
          description: "Rate limit exceeded",
          category: "Client Error",
        },
        500: {
          name: "Internal Server Error",
          description: "Generic server error",
          category: "Server Error",
        },
        501: {
          name: "Not Implemented",
          description: "Server does not support functionality",
          category: "Server Error",
        },
        502: {
          name: "Bad Gateway",
          description: "Invalid response from upstream server",
          category: "Server Error",
        },
        503: {
          name: "Service Unavailable",
          description: "Server temporarily unavailable",
          category: "Server Error",
        },
        504: {
          name: "Gateway Timeout",
          description: "Upstream server timed out",
          category: "Server Error",
        },
      };

      // Search by code or keyword
      const codeNum = Number.parseInt(str, 10);
      if (!Number.isNaN(codeNum) && codes[codeNum]) {
        const c = codes[codeNum];
        return `${codeNum} ${c.name}\n\nCategory: ${c.category}\nDescription: ${c.description}`;
      }

      // Search by keyword
      const results = Object.entries(codes).filter(
        ([, v]) =>
          v.name.toLowerCase().includes(str) ||
          v.description.toLowerCase().includes(str),
      );

      if (results.length === 0) {
        return "No matching status codes found";
      }

      return results
        .map(([code, v]) => `${code} ${v.name} - ${v.description}`)
        .join("\n");
    },
  },
  {
    slug: "mime-type",
    name: "MIME Type ↔ Extension Lookup",
    description: "Look up MIME types by extension or vice versa",
    section: "http",
    aliases: ["content-type", "file-type"],
    inputType: "text",
    outputType: "text",
    inputPlaceholder:
      "Enter extension (.js) or MIME type (application/json)...",
    transform: (input) => {
      const str = String(input).trim().toLowerCase().replace(/^\./, "");
      if (!str) return "";

      const mimeTypes: Record<string, string> = {
        html: "text/html",
        htm: "text/html",
        css: "text/css",
        js: "application/javascript",
        mjs: "application/javascript",
        json: "application/json",
        xml: "application/xml",
        txt: "text/plain",
        md: "text/markdown",
        csv: "text/csv",
        png: "image/png",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        gif: "image/gif",
        webp: "image/webp",
        svg: "image/svg+xml",
        ico: "image/x-icon",
        pdf: "application/pdf",
        zip: "application/zip",
        gz: "application/gzip",
        tar: "application/x-tar",
        mp3: "audio/mpeg",
        wav: "audio/wav",
        mp4: "video/mp4",
        webm: "video/webm",
        woff: "font/woff",
        woff2: "font/woff2",
        ttf: "font/ttf",
        otf: "font/otf",
        eot: "application/vnd.ms-fontobject",
        yaml: "application/x-yaml",
        yml: "application/x-yaml",
        wasm: "application/wasm",
        ts: "application/typescript",
        tsx: "application/typescript",
        jsx: "application/javascript",
      };

      // Check if it's an extension
      if (mimeTypes[str]) {
        return `Extension: .${str}\nMIME Type: ${mimeTypes[str]}`;
      }

      // Check if it's a MIME type
      const ext = Object.entries(mimeTypes).find(([, v]) => v === str);
      if (ext) {
        return `MIME Type: ${str}\nExtension: .${ext[0]}`;
      }

      // Search
      const results = Object.entries(mimeTypes).filter(
        ([k, v]) => k.includes(str) || v.includes(str),
      );

      if (results.length === 0) {
        return "No matching MIME types found";
      }

      return results.map(([ext, mime]) => `.${ext} → ${mime}`).join("\n");
    },
  },
  {
    slug: "auth-header",
    name: "Authorization Header Builder",
    description: "Build Basic or Bearer authorization headers",
    section: "http",
    aliases: ["basic-auth", "bearer-token"],
    inputType: "text",
    outputType: "text",
    options: [
      {
        id: "type",
        label: "Type",
        type: "select",
        default: "basic",
        options: [
          { value: "basic", label: "Basic (username:password)" },
          { value: "bearer", label: "Bearer Token" },
        ],
      },
    ],
    transform: (input, opts) => {
      const str = String(input).trim();
      if (!str) return "";

      if (opts.type === "bearer") {
        return `Authorization: Bearer ${str}`;
      }

      // Basic auth: expect username:password or just encode as-is
      const encoded = btoa(str);
      return [
        `Authorization: Basic ${encoded}`,
        "",
        `Decoded: ${str}`,
        `Base64: ${encoded}`,
      ].join("\n");
    },
  },
  {
    slug: "cookie-parser",
    name: "Cookie Parser / Builder",
    description: "Parse Set-Cookie headers or build Cookie headers",
    section: "http",
    aliases: ["set-cookie", "parse-cookie"],
    inputType: "text",
    outputType: "text",
    options: [
      {
        id: "mode",
        label: "Mode",
        type: "select",
        default: "parse",
        options: [
          { value: "parse", label: "Parse Set-Cookie" },
          { value: "build", label: "Build Cookie header" },
        ],
      },
    ],
    transform: (input, opts) => {
      const str = String(input).trim();
      if (!str) return "";

      if (opts.mode === "build") {
        // Expect JSON object
        try {
          const obj = JSON.parse(str);
          const cookies = Object.entries(obj)
            .map(([k, v]) => `${k}=${v}`)
            .join("; ");
          return `Cookie: ${cookies}`;
        } catch {
          return { type: "error", message: "Invalid JSON" };
        }
      }

      // Parse Set-Cookie
      const parts = str
        .replace(/^Set-Cookie:\s*/i, "")
        .split(";")
        .map((p) => p.trim());
      const [nameValue, ...attributes] = parts;
      const [name, value] = nameValue.split("=");

      const result = {
        name,
        value,
        attributes: {} as Record<string, string | boolean>,
      };

      for (const attr of attributes) {
        const [key, val] = attr.split("=");
        result.attributes[key.toLowerCase()] = val ?? true;
      }

      return JSON.stringify(result, null, 2);
    },
  },
  {
    slug: "header-normalize",
    name: "Header Normalizer",
    description: "Normalize HTTP header casing and format",
    section: "http",
    aliases: ["http-headers", "normalize-headers"],
    inputType: "text",
    outputType: "text",
    options: [
      {
        id: "format",
        label: "Format",
        type: "select",
        default: "canonical",
        options: [
          { value: "canonical", label: "Canonical (Content-Type)" },
          { value: "lowercase", label: "Lowercase (content-type)" },
        ],
      },
    ],
    transform: (input, opts) => {
      const str = String(input).trim();
      if (!str) return "";

      const lines = str.split("\n").filter(Boolean);
      const headers: [string, string][] = [];

      for (const line of lines) {
        const match = line.match(/^([^:]+):\s*(.*)$/);
        if (match) {
          let name = match[1].trim();
          if (opts.format === "canonical") {
            name = name
              .split("-")
              .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
              .join("-");
          } else {
            name = name.toLowerCase();
          }
          headers.push([name, match[2].trim()]);
        }
      }

      // Remove duplicates (keep last)
      const unique = new Map(headers);
      return Array.from(unique.entries())
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n");
    },
  },
  {
    slug: "curl-generator",
    name: "Generate cURL",
    description: "Generate cURL command from request parameters",
    section: "http",
    aliases: ["curl", "request-to-curl"],
    inputType: "text",
    outputType: "text",
    inputPlaceholder: "Enter URL or JSON { url, method, headers, body }...",
    options: [
      {
        id: "method",
        label: "Method",
        type: "select",
        default: "GET",
        options: [
          { value: "GET", label: "GET" },
          { value: "POST", label: "POST" },
          { value: "PUT", label: "PUT" },
          { value: "PATCH", label: "PATCH" },
          { value: "DELETE", label: "DELETE" },
        ],
      },
    ],
    transform: (input, opts) => {
      const str = String(input).trim();
      if (!str) return "";

      let url: string;
      let method = String(opts.method);
      let headers: Record<string, string> = {};
      let body = "";

      // Try to parse as JSON
      if (str.startsWith("{")) {
        try {
          const obj = JSON.parse(str);
          url = obj.url;
          method = obj.method || method;
          headers = obj.headers || {};
          body =
            typeof obj.body === "string" ? obj.body : JSON.stringify(obj.body);
        } catch {
          return { type: "error", message: "Invalid JSON" };
        }
      } else {
        url = str;
      }

      const parts = ["curl"];
      if (method !== "GET") parts.push(`-X ${method}`);

      for (const [k, v] of Object.entries(headers)) {
        parts.push(`-H '${k}: ${v}'`);
      }

      if (body) {
        parts.push(`-d '${body.replace(/'/g, "\\'")}'`);
      }

      parts.push(`'${url}'`);

      return parts.join(" \\\n  ");
    },
  },
  {
    slug: "curl-parser",
    name: "Parse cURL",
    description: "Parse cURL command into request components",
    section: "http",
    aliases: ["curl-to-request"],
    inputType: "text",
    outputType: "text",
    inputPlaceholder: "Paste cURL command...",
    transform: (input) => {
      const str = String(input).trim().replace(/\\\n/g, " ");
      if (!str) return "";

      const result: {
        method: string;
        url: string;
        headers: Record<string, string>;
        data?: string;
      } = {
        method: "GET",
        url: "",
        headers: {},
      };

      // Simple parser
      const parts = str.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i].replace(/^['"]|['"]$/g, "");

        if (part === "curl") continue;
        if (part === "-X" || part === "--request") {
          result.method = parts[++i]?.replace(/^['"]|['"]$/g, "") || "GET";
        } else if (part === "-H" || part === "--header") {
          const header = parts[++i]?.replace(/^['"]|['"]$/g, "");
          if (header) {
            const [key, ...vals] = header.split(":");
            result.headers[key.trim()] = vals.join(":").trim();
          }
        } else if (
          part === "-d" ||
          part === "--data" ||
          part === "--data-raw"
        ) {
          result.data = parts[++i]?.replace(/^['"]|['"]$/g, "");
        } else if (part.startsWith("http://") || part.startsWith("https://")) {
          result.url = part;
        } else if (!part.startsWith("-")) {
          result.url = part;
        }
      }

      return JSON.stringify(result, null, 2);
    },
  },
  {
    slug: "request-snippet",
    name: "Request Snippet Generator",
    description: "Generate request code in fetch, axios, or Python requests",
    section: "http",
    aliases: ["fetch", "axios", "python-requests"],
    inputType: "text",
    outputType: "text",
    inputPlaceholder: "Enter JSON { url, method, headers, body }...",
    options: [
      {
        id: "language",
        label: "Language",
        type: "select",
        default: "fetch",
        options: [
          { value: "fetch", label: "JavaScript (fetch)" },
          { value: "axios", label: "JavaScript (axios)" },
          { value: "python", label: "Python (requests)" },
        ],
      },
    ],
    transform: (input, opts) => {
      const str = String(input).trim();
      if (!str) return "";

      let config: {
        url: string;
        method?: string;
        headers?: Record<string, string>;
        body?: unknown;
      };
      try {
        config = JSON.parse(str);
      } catch {
        // Assume it's just a URL
        config = { url: str };
      }

      const { url, method = "GET", headers = {}, body } = config;

      if (opts.language === "fetch") {
        const options: string[] = [];
        if (method !== "GET") options.push(`  method: '${method}'`);
        if (Object.keys(headers).length > 0) {
          options.push(
            `  headers: ${JSON.stringify(headers, null, 4).replace(/\n/g, "\n  ")}`,
          );
        }
        if (body) {
          options.push(
            `  body: JSON.stringify(${JSON.stringify(body, null, 4).replace(/\n/g, "\n  ")})`,
          );
        }

        if (options.length === 0) {
          return `const response = await fetch('${url}');\nconst data = await response.json();`;
        }
        return `const response = await fetch('${url}', {\n${options.join(",\n")}\n});\nconst data = await response.json();`;
      }

      if (opts.language === "axios") {
        const cfg: string[] = [`  url: '${url}'`];
        if (method !== "GET") cfg.push(`  method: '${method.toLowerCase()}'`);
        if (Object.keys(headers).length > 0) {
          cfg.push(
            `  headers: ${JSON.stringify(headers, null, 4).replace(/\n/g, "\n  ")}`,
          );
        }
        if (body) {
          cfg.push(
            `  data: ${JSON.stringify(body, null, 4).replace(/\n/g, "\n  ")}`,
          );
        }
        return `const { data } = await axios({\n${cfg.join(",\n")}\n});`;
      }

      // Python
      const args: string[] = [`'${url}'`];
      if (Object.keys(headers).length > 0) {
        args.push(`headers=${JSON.stringify(headers)}`);
      }
      if (body) {
        args.push(`json=${JSON.stringify(body)}`);
      }
      return `import requests\n\nresponse = requests.${method.toLowerCase()}(${args.join(", ")})\ndata = response.json()`;
    },
  },
  {
    slug: "form-urlencoded",
    name: "Form-urlencoded Builder",
    description: "Build application/x-www-form-urlencoded body",
    section: "http",
    aliases: ["form-data", "post-body"],
    inputType: "text",
    outputType: "text",
    inputPlaceholder: "Enter JSON object or key=value pairs...",
    options: [
      {
        id: "mode",
        label: "Input format",
        type: "select",
        default: "json",
        options: [
          { value: "json", label: "JSON" },
          { value: "lines", label: "Key=value lines" },
        ],
      },
    ],
    transform: (input, opts) => {
      const str = String(input).trim();
      if (!str) return "";

      let params: Record<string, string>;

      if (opts.mode === "json") {
        try {
          params = JSON.parse(str);
        } catch {
          return { type: "error", message: "Invalid JSON" };
        }
      } else {
        params = {};
        for (const line of str.split("\n")) {
          const [key, ...vals] = line.split("=");
          if (key) params[key.trim()] = vals.join("=").trim();
        }
      }

      const encoded = new URLSearchParams(params).toString();
      return [
        "Content-Type: application/x-www-form-urlencoded",
        "",
        encoded,
        "",
        "--- Decoded ---",
        ...Object.entries(params).map(([k, v]) => `${k} = ${v}`),
      ].join("\n");
    },
  },
];
