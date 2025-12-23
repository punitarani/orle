import type { ToolDefinition } from "../types";

export const cryptoTools: ToolDefinition[] = [
  {
    slug: "hash-text",
    name: "Hash Generator (Text)",
    description: "Generate MD5, SHA-1, SHA-256, SHA-384, SHA-512 hashes",
    section: "crypto",
    aliases: ["sha256", "sha512", "md5", "checksum"],
    inputType: "text",
    outputType: "text",
    useWorker: "hash",
    options: [
      {
        id: "algorithm",
        label: "Algorithm",
        type: "select",
        default: "SHA-256",
        options: [
          { value: "MD5", label: "MD5" },
          { value: "SHA-1", label: "SHA-1" },
          { value: "SHA-256", label: "SHA-256" },
          { value: "SHA-384", label: "SHA-384" },
          { value: "SHA-512", label: "SHA-512" },
        ],
      },
      { id: "uppercase", label: "Uppercase", type: "toggle", default: false },
    ],
    transform: async (input, opts) => {
      const str = String(input);
      if (!str) return "";

      const algorithm = String(opts.algorithm);
      const encoder = new TextEncoder();
      const data = encoder.encode(str);

      // MD5 needs special handling since Web Crypto doesn't support it
      if (algorithm === "MD5") {
        return md5(str).then((h) => (opts.uppercase ? h.toUpperCase() : h));
      }

      const hashBuffer = await crypto.subtle.digest(algorithm, data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      let hex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

      if (opts.uppercase) hex = hex.toUpperCase();
      return hex;
    },
  },
  {
    slug: "hash-file",
    name: "File Hash Generator",
    description: "Generate hash checksums for files",
    section: "crypto",
    aliases: ["file-checksum", "file-sha256"],
    inputType: "file",
    outputType: "text",
    useWorker: "hash",
    options: [
      {
        id: "algorithm",
        label: "Algorithm",
        type: "select",
        default: "SHA-256",
        options: [
          { value: "SHA-1", label: "SHA-1" },
          { value: "SHA-256", label: "SHA-256" },
          { value: "SHA-384", label: "SHA-384" },
          { value: "SHA-512", label: "SHA-512" },
        ],
      },
    ],
    transform: async (input, opts) => {
      if (!(input instanceof File)) {
        return { type: "error", message: "Please drop a file" };
      }

      const buffer = await input.arrayBuffer();
      const algorithm = String(opts.algorithm);
      const hashBuffer = await crypto.subtle.digest(algorithm, buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      return [
        `File: ${input.name}`,
        `Size: ${formatBytes(input.size)}`,
        `Algorithm: ${algorithm}`,
        `Hash: ${hex}`,
      ].join("\n");
    },
  },
  {
    slug: "hmac",
    name: "HMAC Generator",
    description: "Generate HMAC signatures using various algorithms",
    section: "crypto",
    aliases: ["hmac-sha256", "message-auth"],
    inputType: "text",
    outputType: "text",
    options: [
      { id: "secret", label: "Secret key", type: "text", default: "" },
      {
        id: "algorithm",
        label: "Algorithm",
        type: "select",
        default: "SHA-256",
        options: [
          { value: "SHA-1", label: "HMAC-SHA-1" },
          { value: "SHA-256", label: "HMAC-SHA-256" },
          { value: "SHA-384", label: "HMAC-SHA-384" },
          { value: "SHA-512", label: "HMAC-SHA-512" },
        ],
      },
      {
        id: "output",
        label: "Output",
        type: "select",
        default: "hex",
        options: [
          { value: "hex", label: "Hex" },
          { value: "base64", label: "Base64" },
        ],
      },
    ],
    transform: async (input, opts) => {
      const message = String(input);
      const secret = String(opts.secret);
      if (!message) return "";
      if (!secret) return { type: "error", message: "Secret key is required" };

      const encoder = new TextEncoder();
      const keyData = encoder.encode(secret);
      const messageData = encoder.encode(message);

      const key = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: String(opts.algorithm) },
        false,
        ["sign"],
      );

      const signature = await crypto.subtle.sign("HMAC", key, messageData);
      const array = new Uint8Array(signature);

      if (opts.output === "base64") {
        return btoa(String.fromCharCode(...array));
      }
      return Array.from(array)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    },
  },
  {
    slug: "pbkdf2",
    name: "PBKDF2 Derivation",
    description: "Derive keys using PBKDF2",
    section: "crypto",
    aliases: ["key-derivation", "password-hash"],
    inputType: "text",
    outputType: "text",
    inputPlaceholder: "Enter password...",
    options: [
      { id: "salt", label: "Salt", type: "text", default: "" },
      {
        id: "iterations",
        label: "Iterations",
        type: "number",
        default: 100000,
        min: 1000,
        max: 1000000,
      },
      {
        id: "keyLength",
        label: "Key length (bytes)",
        type: "number",
        default: 32,
        min: 16,
        max: 64,
      },
      {
        id: "algorithm",
        label: "Algorithm",
        type: "select",
        default: "SHA-256",
        options: [
          { value: "SHA-1", label: "SHA-1" },
          { value: "SHA-256", label: "SHA-256" },
          { value: "SHA-512", label: "SHA-512" },
        ],
      },
    ],
    transform: async (input, opts) => {
      const password = String(input);
      const salt = String(opts.salt) || "default-salt";
      if (!password) return "";

      const encoder = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        "PBKDF2",
        false,
        ["deriveBits"],
      );

      const derivedBits = await crypto.subtle.deriveBits(
        {
          name: "PBKDF2",
          salt: encoder.encode(salt),
          iterations: Number(opts.iterations),
          hash: String(opts.algorithm),
        },
        keyMaterial,
        Number(opts.keyLength) * 8,
      );

      const hex = Array.from(new Uint8Array(derivedBits))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      return [
        `Salt: ${salt}`,
        `Iterations: ${opts.iterations}`,
        `Key length: ${opts.keyLength} bytes`,
        `Algorithm: ${opts.algorithm}`,
        "",
        `Derived key (hex): ${hex}`,
        `Derived key (base64): ${btoa(String.fromCharCode(...new Uint8Array(derivedBits)))}`,
      ].join("\n");
    },
  },
  {
    slug: "jwt-decode",
    name: "JWT Decoder",
    description: "Decode JWT tokens and show header, payload, and expiration",
    section: "crypto",
    aliases: ["jwt", "json-web-token"],
    inputType: "text",
    outputType: "text",
    inputPlaceholder: "Paste JWT token here...",
    transform: (input) => {
      const token = String(input).trim();
      if (!token) return "";

      const parts = token.split(".");
      if (parts.length !== 3) {
        return {
          type: "error",
          message: "Invalid JWT format (expected 3 parts)",
        };
      }

      try {
        const decodeBase64Url = (str: string) => {
          let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
          while (base64.length % 4) base64 += "=";
          return JSON.parse(atob(base64));
        };

        const header = decodeBase64Url(parts[0]);
        const payload = decodeBase64Url(parts[1]);

        const lines = [
          "=== HEADER ===",
          JSON.stringify(header, null, 2),
          "",
          "=== PAYLOAD ===",
          JSON.stringify(payload, null, 2),
          "",
          "=== SIGNATURE ===",
          parts[2],
        ];

        if (payload.exp) {
          const expDate = new Date(payload.exp * 1000);
          const now = new Date();
          const isExpired = expDate < now;
          lines.push("", "=== EXPIRATION ===");
          lines.push(`Expires: ${expDate.toISOString()}`);
          lines.push(`Status: ${isExpired ? "✗ EXPIRED" : "✓ VALID"}`);
          if (!isExpired) {
            const diff = expDate.getTime() - now.getTime();
            lines.push(`Expires in: ${formatDuration(diff)}`);
          }
        }

        if (payload.iat) {
          lines.push(`Issued: ${new Date(payload.iat * 1000).toISOString()}`);
        }

        return lines.join("\n");
      } catch {
        return { type: "error", message: "Failed to decode JWT" };
      }
    },
  },
  {
    slug: "jwt-expired",
    name: "JWT Expiration Checker",
    description: "Check if a JWT is expired and show remaining time",
    section: "crypto",
    aliases: ["jwt-check", "token-expiry"],
    inputType: "text",
    outputType: "text",
    transform: (input) => {
      const token = String(input).trim();
      if (!token) return "";

      const parts = token.split(".");
      if (parts.length !== 3) {
        return { type: "error", message: "Invalid JWT format" };
      }

      try {
        let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        while (base64.length % 4) base64 += "=";
        const payload = JSON.parse(atob(base64));

        if (!payload.exp) {
          return "This JWT has no expiration (exp) claim";
        }

        const expDate = new Date(payload.exp * 1000);
        const now = new Date();
        const isExpired = expDate < now;

        if (isExpired) {
          const diff = now.getTime() - expDate.getTime();
          return `✗ EXPIRED\n\nExpired: ${expDate.toISOString()}\nExpired ${formatDuration(diff)} ago`;
        }

        const diff = expDate.getTime() - now.getTime();
        return `✓ VALID\n\nExpires: ${expDate.toISOString()}\nExpires in: ${formatDuration(diff)}`;
      } catch {
        return { type: "error", message: "Failed to decode JWT" };
      }
    },
  },
  {
    slug: "random-bytes",
    name: "Random Bytes Generator",
    description: "Generate cryptographically secure random bytes",
    section: "crypto",
    aliases: ["random", "secure-random"],
    inputType: "none",
    outputType: "text",
    options: [
      {
        id: "length",
        label: "Length (bytes)",
        type: "number",
        default: 32,
        min: 1,
        max: 1024,
      },
      {
        id: "format",
        label: "Format",
        type: "select",
        default: "hex",
        options: [
          { value: "hex", label: "Hex" },
          { value: "base64", label: "Base64" },
          { value: "base64url", label: "Base64URL" },
        ],
      },
    ],
    transform: (_, opts) => {
      const length = Number(opts.length) || 32;
      const bytes = new Uint8Array(length);
      crypto.getRandomValues(bytes);

      switch (opts.format) {
        case "base64":
          return btoa(String.fromCharCode(...bytes));
        case "base64url":
          return btoa(String.fromCharCode(...bytes))
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "");
        default:
          return Array.from(bytes)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
      }
    },
  },
  {
    slug: "password-generator",
    name: "Password Generator",
    description: "Generate secure random passwords",
    section: "crypto",
    aliases: ["passgen", "secure-password"],
    inputType: "none",
    outputType: "text",
    options: [
      {
        id: "length",
        label: "Length",
        type: "number",
        default: 16,
        min: 4,
        max: 128,
      },
      {
        id: "uppercase",
        label: "Uppercase (A-Z)",
        type: "toggle",
        default: true,
      },
      {
        id: "lowercase",
        label: "Lowercase (a-z)",
        type: "toggle",
        default: true,
      },
      { id: "numbers", label: "Numbers (0-9)", type: "toggle", default: true },
      {
        id: "symbols",
        label: "Symbols (!@#$...)",
        type: "toggle",
        default: true,
      },
      {
        id: "avoidAmbiguous",
        label: "Avoid ambiguous (0O1lI)",
        type: "toggle",
        default: false,
      },
      {
        id: "count",
        label: "Generate count",
        type: "number",
        default: 1,
        min: 1,
        max: 10,
      },
    ],
    transform: (_, opts) => {
      let chars = "";
      const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const lower = "abcdefghijklmnopqrstuvwxyz";
      const nums = "0123456789";
      const syms = "!@#$%^&*()_+-=[]{}|;:,.<>?";
      const ambiguous = "0O1lI";

      if (opts.uppercase) chars += upper;
      if (opts.lowercase) chars += lower;
      if (opts.numbers) chars += nums;
      if (opts.symbols) chars += syms;

      if (!chars) chars = lower + nums;

      if (opts.avoidAmbiguous) {
        chars = chars
          .split("")
          .filter((c) => !ambiguous.includes(c))
          .join("");
      }

      const length = Number(opts.length) || 16;
      const count = Number(opts.count) || 1;
      const passwords: string[] = [];

      for (let i = 0; i < count; i++) {
        const bytes = new Uint8Array(length);
        crypto.getRandomValues(bytes);
        const password = Array.from(bytes)
          .map((b) => chars[b % chars.length])
          .join("");
        passwords.push(password);
      }

      return passwords.join("\n");
    },
  },
  {
    slug: "aes-encrypt",
    name: "AES-GCM Encrypt / Decrypt",
    description: "Encrypt or decrypt text using AES-GCM",
    section: "crypto",
    aliases: ["aes", "encrypt", "decrypt"],
    inputType: "text",
    outputType: "text",
    options: [
      {
        id: "mode",
        label: "Mode",
        type: "select",
        default: "encrypt",
        options: [
          { value: "encrypt", label: "Encrypt" },
          { value: "decrypt", label: "Decrypt" },
        ],
      },
      { id: "password", label: "Password", type: "text", default: "" },
    ],
    transform: async (input, opts) => {
      const text = String(input);
      const password = String(opts.password);
      if (!text) return "";
      if (!password) return { type: "error", message: "Password is required" };

      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      // Derive key from password
      const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        "PBKDF2",
        false,
        ["deriveBits", "deriveKey"],
      );

      const salt = encoder.encode("orle-aes-salt");
      const key = await crypto.subtle.deriveKey(
        { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"],
      );

      if (opts.mode === "encrypt") {
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encrypted = await crypto.subtle.encrypt(
          { name: "AES-GCM", iv },
          key,
          encoder.encode(text),
        );

        // Combine IV + ciphertext and encode as base64
        const combined = new Uint8Array(iv.length + encrypted.byteLength);
        combined.set(iv, 0);
        combined.set(new Uint8Array(encrypted), iv.length);

        return btoa(String.fromCharCode(...combined));
      }

      try {
        const combined = new Uint8Array(
          atob(text)
            .split("")
            .map((c) => c.charCodeAt(0)),
        );
        const iv = combined.slice(0, 12);
        const ciphertext = combined.slice(12);

        const decrypted = await crypto.subtle.decrypt(
          { name: "AES-GCM", iv },
          key,
          ciphertext,
        );

        return decoder.decode(decrypted);
      } catch {
        return {
          type: "error",
          message: "Decryption failed (wrong password or corrupted data)",
        };
      }
    },
  },
  {
    slug: "bcrypt-verify",
    name: "Bcrypt Info",
    description:
      "Analyze bcrypt hash structure (cannot generate without backend)",
    section: "crypto",
    aliases: ["bcrypt"],
    inputType: "text",
    outputType: "text",
    inputPlaceholder: "Paste bcrypt hash (e.g., $2b$10$...)",
    transform: (input) => {
      const hash = String(input).trim();
      if (!hash) return "";

      const match = hash.match(/^\$(\d[a-z]?)\$(\d{2})\$(.{22})(.{31})$/);
      if (!match) {
        return { type: "error", message: "Invalid bcrypt hash format" };
      }

      const [, version, costStr, salt, digest] = match;
      const cost = Number.parseInt(costStr, 10);
      const iterations = 2 ** cost;

      return [
        `Version: ${version}`,
        `Cost factor: ${cost}`,
        `Iterations: ${iterations.toLocaleString()}`,
        `Salt (base64): ${salt}`,
        `Digest (base64): ${digest}`,
        "",
        "Note: Bcrypt verification requires a backend due to its computational cost.",
      ].join("\n");
    },
  },
  {
    slug: "crc32",
    name: "CRC32 Checksum",
    description: "Calculate CRC32 checksum",
    section: "crypto",
    aliases: ["crc", "checksum"],
    inputType: "text",
    outputType: "text",
    transform: (input) => {
      const str = String(input);
      if (!str) return "";

      const crc = crc32(str);
      return [
        `CRC32: ${crc.toString(16).toUpperCase().padStart(8, "0")}`,
        `Decimal: ${crc}`,
      ].join("\n");
    },
  },
];

// Helper functions
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

// Simple MD5 implementation (for browser use only)
async function md5(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);

  // Use a simple implementation since Web Crypto doesn't support MD5
  let h0 = 0x67452301;
  let h1 = 0xefcdab89;
  let h2 = 0x98badcfe;
  let h3 = 0x10325476;

  const K = Array.from({ length: 64 }, (_, i) =>
    Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000),
  );
  const S = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5,
    9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11,
    16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10,
    15, 21,
  ];

  const padded = new Uint8Array((((data.length + 8) >> 6) << 6) + 64);
  padded.set(data);
  padded[data.length] = 0x80;
  const bits = data.length * 8;
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 8, bits, true);

  for (let i = 0; i < padded.length; i += 64) {
    const M = Array.from({ length: 16 }, (_, j) =>
      view.getUint32(i + j * 4, true),
    );
    let [a, b, c, d] = [h0, h1, h2, h3];

    for (let j = 0; j < 64; j++) {
      let f: number, g: number;
      if (j < 16) {
        f = (b & c) | (~b & d);
        g = j;
      } else if (j < 32) {
        f = (d & b) | (~d & c);
        g = (5 * j + 1) % 16;
      } else if (j < 48) {
        f = b ^ c ^ d;
        g = (3 * j + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * j) % 16;
      }

      const temp = d;
      d = c;
      c = b;
      const sum = (a + f + K[j] + M[g]) >>> 0;
      b = (b + ((sum << S[j]) | (sum >>> (32 - S[j])))) >>> 0;
      a = temp;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
  }

  const toHex = (n: number) => {
    const hex = n.toString(16).padStart(8, "0");
    const pairs = hex.match(/../g) ?? [];
    return pairs.reverse().join("");
  };
  return toHex(h0) + toHex(h1) + toHex(h2) + toHex(h3);
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
