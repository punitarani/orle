export function utf8ToBytes(input: string): Uint8Array {
  return new TextEncoder().encode(input);
}

export function bytesToUtf8(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export function base64ToBytes(input: string): Uint8Array {
  const binary = atob(input);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function normalizeBase64(input: string, urlSafe: boolean): string {
  let normalized = input.trim().replace(/\s+/g, "");
  if (urlSafe) {
    normalized = normalized.replace(/-/g, "+").replace(/_/g, "/");
  }
  while (normalized.length % 4) normalized += "=";
  return normalized;
}

export function base64ToUrlSafe(input: string): string {
  return input.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function wrap76(input: string): string {
  return input.match(/.{1,76}/g)?.join("\n") ?? input;
}

export function bytesToHex(bytes: Uint8Array, uppercase = false): string {
  let hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  if (uppercase) hex = hex.toUpperCase();
  return hex;
}

export function hexToBytes(input: string): Uint8Array {
  const clean = input.replace(/0x/gi, "").replace(/\s/g, "");
  if (clean.length === 0) return new Uint8Array();
  if (!/^[0-9a-fA-F]+$/.test(clean)) {
    throw new Error("Invalid hex string");
  }
  const normalized = clean.length % 2 === 0 ? clean : `0${clean}`;
  const matches = normalized.match(/.{2}/g) ?? [];
  return new Uint8Array(matches.map((h) => Number.parseInt(h, 16)));
}

export function parseDataUrl(input: string): {
  mime: string;
  data: string;
  isBase64: boolean;
} | null {
  const match = input.match(/^data:([^,]*?),(.*)$/s);
  if (!match) return null;
  const meta = match[1] || "text/plain;charset=US-ASCII";
  const data = match[2] || "";
  const isBase64 = meta.includes(";base64");
  const mime = meta.split(";")[0] || "application/octet-stream";
  return { mime, data, isBase64 };
}

export function sniffImageMime(bytes: Uint8Array): string | null {
  if (bytes.length >= 8) {
    if (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    ) {
      return "image/png";
    }
  }

  if (bytes.length >= 3) {
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return "image/jpeg";
    }
  }

  if (bytes.length >= 6) {
    const header = String.fromCharCode(...bytes.subarray(0, 6));
    if (header === "GIF87a" || header === "GIF89a") {
      return "image/gif";
    }
  }

  if (bytes.length >= 12) {
    const riff = String.fromCharCode(...bytes.subarray(0, 4));
    const webp = String.fromCharCode(...bytes.subarray(8, 12));
    if (riff === "RIFF" && webp === "WEBP") {
      return "image/webp";
    }
  }

  const preview = bytesToAscii(bytes.subarray(0, 256));
  if (preview.includes("<svg")) {
    return "image/svg+xml";
  }

  return null;
}

function bytesToAscii(bytes: Uint8Array): string {
  let text = "";
  for (const byte of bytes) {
    text += byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : " ";
  }
  return text.toLowerCase();
}

export function parseBigInt(input: string, base: number): bigint {
  const clean = input.trim().replace(/\s+/g, "").toLowerCase();
  if (!clean) throw new Error("Invalid number");
  if (base < 2 || base > 36) throw new Error("Unsupported base");

  const digits = "0123456789abcdefghijklmnopqrstuvwxyz";
  let value = 0n;
  for (const char of clean) {
    const digit = digits.indexOf(char);
    if (digit < 0 || digit >= base) {
      throw new Error("Invalid number");
    }
    value = value * BigInt(base) + BigInt(digit);
  }
  return value;
}
