import { webcrypto as nodeCrypto } from "node:crypto";
import { md5 } from "@noble/hashes/legacy.js";
import { base58 } from "@scure/base";
import { bech32, bech32m } from "bech32";
import {
  base64ToBytes,
  bytesToBase64,
  bytesToHex,
  bytesToUtf8,
  hexToBytes,
  normalizeBase64,
  utf8ToBytes,
} from "../lib/bytes-codec";
import type { ToolDefinition } from "../types";

const cryptoRef = globalThis.crypto ?? nodeCrypto;

export const cryptoTools: ToolDefinition[] = [
  {
    slug: "crypto-suite",
    name: "Crypto & Hashing Suite",
    description: "Hashes, HMAC, PBKDF2, AES-GCM, JWT",
    section: "crypto",
    aliases: ["hash", "hmac", "jwt", "aes"],
    inputType: "text",
    outputType: "text",
    useWorker: "hash",
    acceptsFile: true,
    fileAccept: "*/*",
    runPolicy: "manual",
    options: [
      {
        id: "mode",
        label: "Mode",
        type: "select",
        default: "hash-text",
        options: [
          { value: "hash-text", label: "Hash (text)" },
          { value: "hash-file", label: "Hash (file)" },
          { value: "hmac", label: "HMAC" },
          { value: "pbkdf2", label: "PBKDF2" },
          { value: "aes-encrypt", label: "AES-GCM encrypt" },
          { value: "aes-decrypt", label: "AES-GCM decrypt" },
          { value: "jwt-decode", label: "JWT decode" },
          { value: "jwt-verify", label: "JWT verify (HS*)" },
          { value: "base58check-encode", label: "Base58Check encode" },
          { value: "base58check-decode", label: "Base58Check decode" },
          { value: "bech32-encode", label: "Bech32 encode" },
          { value: "bech32-decode", label: "Bech32 decode" },
        ],
      },
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
        visibleWhen: { optionId: "mode", equals: ["hash-text", "hash-file"] },
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
        visibleWhen: {
          optionId: "mode",
          equals: ["hash-text", "hash-file", "hmac", "pbkdf2"],
        },
      },
      {
        id: "secret",
        label: "Secret key",
        type: "text",
        default: "",
        visibleWhen: { optionId: "mode", equals: ["hmac", "jwt-verify"] },
      },
      {
        id: "inputEncoding",
        label: "Input encoding",
        type: "select",
        default: "utf8",
        options: [
          { value: "utf8", label: "UTF-8" },
          { value: "hex", label: "Hex" },
          { value: "base64", label: "Base64" },
        ],
        visibleWhen: {
          optionId: "mode",
          equals: ["base58check-encode", "base58check-decode", "bech32-encode"],
        },
      },
      {
        id: "bech32Prefix",
        label: "Bech32 prefix (hrp)",
        type: "text",
        default: "bc",
        visibleWhen: { optionId: "mode", equals: "bech32-encode" },
      },
      {
        id: "bech32Variant",
        label: "Bech32 variant",
        type: "select",
        default: "bech32",
        options: [
          { value: "bech32", label: "bech32" },
          { value: "bech32m", label: "bech32m" },
        ],
        visibleWhen: {
          optionId: "mode",
          equals: ["bech32-encode", "bech32-decode"],
        },
      },
      {
        id: "pbkdf2Salt",
        label: "Salt",
        type: "text",
        default: "",
        visibleWhen: { optionId: "mode", equals: "pbkdf2" },
      },
      {
        id: "pbkdf2Iterations",
        label: "Iterations",
        type: "number",
        default: 100000,
        min: 1000,
        max: 1000000,
        visibleWhen: { optionId: "mode", equals: "pbkdf2" },
      },
      {
        id: "pbkdf2Length",
        label: "Key length (bytes)",
        type: "number",
        default: 32,
        min: 16,
        max: 64,
        visibleWhen: { optionId: "mode", equals: "pbkdf2" },
      },
      {
        id: "aesKey",
        label: "AES key",
        type: "text",
        default: "",
        visibleWhen: {
          optionId: "mode",
          equals: ["aes-encrypt", "aes-decrypt"],
        },
      },
      {
        id: "aesKeyEncoding",
        label: "Key encoding",
        type: "select",
        default: "utf8",
        options: [
          { value: "utf8", label: "UTF-8" },
          { value: "base64", label: "Base64" },
          { value: "hex", label: "Hex" },
        ],
        visibleWhen: {
          optionId: "mode",
          equals: ["aes-encrypt", "aes-decrypt"],
        },
      },
      {
        id: "aesIv",
        label: "IV (base64/hex)",
        type: "text",
        default: "",
        visibleWhen: {
          optionId: "mode",
          equals: ["aes-encrypt", "aes-decrypt"],
        },
      },
    ],
    transform: async (input, opts) => {
      const mode = String(opts.mode);
      const output = String(opts.output || "hex");

      const hasFile = typeof File !== "undefined";
      const isFileInput = hasFile && input instanceof File;

      if (mode === "hash-file") {
        if (!isFileInput) {
          return { type: "error", message: "Please drop a file" };
        }
        const file = input as File;
        const buffer = await file.arrayBuffer();
        return formatDigest(
          await digestBytes(new Uint8Array(buffer), opts),
          output,
          file,
        );
      }

      if (isFileInput) {
        return {
          type: "error",
          message: "Clear the file input to use text modes",
        };
      }

      const text = String(input ?? "");
      if (!text && !["hash-text", "jwt-decode"].includes(mode)) return "";

      switch (mode) {
        case "hash-text": {
          const bytes = utf8ToBytes(text);
          return formatDigest(await digestBytes(bytes, opts), output);
        }
        case "hmac": {
          if (!opts.secret)
            return { type: "error", message: "Secret key is required" };
          if (String(opts.algorithm || "SHA-256") === "MD5") {
            return { type: "error", message: "MD5 is not supported for HMAC" };
          }
          const secretBytes = utf8ToBytes(String(opts.secret));
          const key = await cryptoRef.subtle.importKey(
            "raw",
            toArrayBuffer(secretBytes),
            { name: "HMAC", hash: String(opts.algorithm || "SHA-256") },
            false,
            ["sign"],
          );
          const signature = await cryptoRef.subtle.sign(
            "HMAC",
            key,
            toArrayBuffer(utf8ToBytes(text)),
          );
          return output === "base64"
            ? bytesToBase64(new Uint8Array(signature))
            : bytesToHex(new Uint8Array(signature));
        }
        case "pbkdf2": {
          if (String(opts.algorithm || "SHA-256") === "MD5") {
            return {
              type: "error",
              message: "MD5 is not supported for PBKDF2",
            };
          }
          const salt = utf8ToBytes(String(opts.pbkdf2Salt || ""));
          const keyMaterial = await cryptoRef.subtle.importKey(
            "raw",
            toArrayBuffer(utf8ToBytes(text)),
            "PBKDF2",
            false,
            ["deriveBits"],
          );
          const bits = await cryptoRef.subtle.deriveBits(
            {
              name: "PBKDF2",
              salt: toArrayBuffer(salt),
              iterations: Number(opts.pbkdf2Iterations) || 100000,
              hash: String(opts.algorithm || "SHA-256"),
            },
            keyMaterial,
            (Number(opts.pbkdf2Length) || 32) * 8,
          );
          const bytes = new Uint8Array(bits);
          return output === "base64" ? bytesToBase64(bytes) : bytesToHex(bytes);
        }
        case "aes-encrypt": {
          const keyBytesResult = safeDecodeByEncoding(
            String(opts.aesKey || ""),
            String(opts.aesKeyEncoding),
          );
          if (!keyBytesResult.bytes.length) {
            return { type: "error", message: "AES key is required" };
          }
          if (keyBytesResult.error) {
            return { type: "error", message: keyBytesResult.error };
          }
          const ivBytesResult = opts.aesIv
            ? safeDecodeByEncoding(
                String(opts.aesIv),
                inferEncoding(String(opts.aesIv)),
              )
            : { bytes: cryptoRef.getRandomValues(new Uint8Array(12)) };
          if (ivBytesResult.error) {
            return { type: "error", message: ivBytesResult.error };
          }
          const key = await cryptoRef.subtle.importKey(
            "raw",
            toArrayBuffer(keyBytesResult.bytes),
            { name: "AES-GCM" },
            false,
            ["encrypt"],
          );
          const ciphertext = await cryptoRef.subtle.encrypt(
            { name: "AES-GCM", iv: toArrayBuffer(ivBytesResult.bytes) },
            key,
            toArrayBuffer(utf8ToBytes(text)),
          );
          return JSON.stringify(
            {
              iv: bytesToBase64(new Uint8Array(ivBytesResult.bytes)),
              ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
            },
            null,
            2,
          );
        }
        case "aes-decrypt": {
          const keyBytesResult = safeDecodeByEncoding(
            String(opts.aesKey || ""),
            String(opts.aesKeyEncoding),
          );
          if (!keyBytesResult.bytes.length) {
            return { type: "error", message: "AES key is required" };
          }
          if (keyBytesResult.error) {
            return { type: "error", message: keyBytesResult.error };
          }
          let payload: { iv: string; ciphertext: string };
          try {
            payload = JSON.parse(text);
          } catch {
            return {
              type: "error",
              message: "Provide JSON with iv + ciphertext",
            };
          }
          const ivBytesResult = safeDecodeByEncoding(
            payload.iv,
            inferEncoding(payload.iv),
          );
          if (ivBytesResult.error) {
            return { type: "error", message: ivBytesResult.error };
          }
          const cipherBytes = base64ToBytes(
            normalizeBase64(payload.ciphertext, true),
          );
          const key = await cryptoRef.subtle.importKey(
            "raw",
            toArrayBuffer(keyBytesResult.bytes),
            { name: "AES-GCM" },
            false,
            ["decrypt"],
          );
          const plaintext = await cryptoRef.subtle.decrypt(
            { name: "AES-GCM", iv: toArrayBuffer(ivBytesResult.bytes) },
            key,
            toArrayBuffer(cipherBytes),
          );
          return bytesToUtf8(new Uint8Array(plaintext));
        }
        case "jwt-decode": {
          return decodeJwt(text);
        }
        case "jwt-verify": {
          if (!opts.secret)
            return { type: "error", message: "Secret key is required" };
          return verifyJwt(text, String(opts.secret));
        }
        case "base58check-encode": {
          const decoded = safeDecodeByEncoding(
            text,
            String(opts.inputEncoding || "utf8"),
          );
          if (decoded.error) return { type: "error", message: decoded.error };
          const checksum = await doubleSha256(decoded.bytes);
          const payload = concatBytes(decoded.bytes, checksum.slice(0, 4));
          return base58.encode(payload);
        }
        case "base58check-decode": {
          try {
            const decoded = base58.decode(text.trim());
            if (decoded.length < 5) {
              return { type: "error", message: "Invalid Base58Check payload" };
            }
            const payload = decoded.slice(0, -4);
            const checksum = decoded.slice(-4);
            const expected = (await doubleSha256(payload)).slice(0, 4);
            const valid = bytesToHex(checksum) === bytesToHex(expected);
            const utf8 = safeBytesToUtf8(payload);
            return JSON.stringify(
              {
                valid,
                hex: bytesToHex(payload),
                text: utf8 ?? null,
              },
              null,
              2,
            );
          } catch {
            return { type: "error", message: "Invalid Base58Check string" };
          }
        }
        case "bech32-encode": {
          const decoded = safeDecodeByEncoding(
            text,
            String(opts.inputEncoding || "utf8"),
          );
          if (decoded.error) return { type: "error", message: decoded.error };
          const hrp = String(opts.bech32Prefix || "bc");
          const variant = String(opts.bech32Variant || "bech32");
          const words = (variant === "bech32m" ? bech32m : bech32).toWords(
            decoded.bytes,
          );
          return (variant === "bech32m" ? bech32m : bech32).encode(hrp, words);
        }
        case "bech32-decode": {
          try {
            const variant = String(opts.bech32Variant || "bech32");
            const decoded =
              variant === "bech32m"
                ? bech32m.decode(text.trim())
                : bech32.decode(text.trim());
            const bytes = (variant === "bech32m" ? bech32m : bech32).fromWords(
              decoded.words,
            );
            const utf8 = safeBytesToUtf8(new Uint8Array(bytes));
            return JSON.stringify(
              {
                hrp: decoded.prefix,
                hex: bytesToHex(new Uint8Array(bytes)),
                text: utf8 ?? null,
              },
              null,
              2,
            );
          } catch {
            return { type: "error", message: "Invalid bech32 string" };
          }
        }
        default:
          return "";
      }
    },
  },
];

async function digestBytes(
  bytes: Uint8Array,
  opts: Record<string, unknown>,
): Promise<Uint8Array> {
  const algorithm = String(opts.algorithm || "SHA-256");
  if (algorithm === "MD5") {
    return md5(bytes);
  }
  const digest = await cryptoRef.subtle.digest(algorithm, toArrayBuffer(bytes));
  return new Uint8Array(digest);
}

function formatDigest(bytes: Uint8Array, output: string, file?: File): string {
  const hash = output === "base64" ? bytesToBase64(bytes) : bytesToHex(bytes);
  if (!file) return hash;
  return [
    `File: ${file.name}`,
    `Size: ${file.size} bytes`,
    `Hash: ${hash}`,
  ].join("\n");
}

function decodeByEncoding(value: string, encoding: string): Uint8Array {
  if (!value) return new Uint8Array();
  switch (encoding) {
    case "hex":
      return hexToBytes(value);
    case "base64":
      return base64ToBytes(normalizeBase64(value, true));
    default:
      return utf8ToBytes(value);
  }
}

function inferEncoding(value: string): string {
  if (/^[0-9a-fA-F]+$/.test(value)) return "hex";
  if (/^[A-Za-z0-9+/=\-_]+$/.test(value)) return "base64";
  return "utf8";
}

function decodeJwt(token: string): string {
  const parts = token.split(".");
  if (parts.length < 2) return "Invalid JWT";
  try {
    const header = parseBase64Json(parts[0]);
    const payload = parseBase64Json(parts[1]);
    return JSON.stringify({ header, payload }, null, 2);
  } catch {
    return "Invalid JWT";
  }
}

async function verifyJwt(token: string, secret: string): Promise<string> {
  const parts = token.split(".");
  if (parts.length !== 3) return "Invalid JWT";
  const [headerB64, payloadB64, signatureB64] = parts;
  const header = parseBase64Json(headerB64) as Record<string, unknown>;
  const alg = String(header.alg || "");
  if (!alg.startsWith("HS")) {
    return "Unsupported alg (only HS256/HS384/HS512)";
  }
  const hash =
    alg === "HS512" ? "SHA-512" : alg === "HS384" ? "SHA-384" : "SHA-256";
  const secretBytes = utf8ToBytes(secret);
  const key = await cryptoRef.subtle.importKey(
    "raw",
    toArrayBuffer(secretBytes),
    { name: "HMAC", hash },
    false,
    ["sign"],
  );
  const data = utf8ToBytes(`${headerB64}.${payloadB64}`);
  const signature = await cryptoRef.subtle.sign(
    "HMAC",
    key,
    toArrayBuffer(data),
  );
  const expected = base64UrlEncode(new Uint8Array(signature));
  return expected === signatureB64
    ? "✓ Signature valid"
    : "✗ Signature invalid";
}

function base64UrlToBase64(value: string): string {
  let base = value.replace(/-/g, "+").replace(/_/g, "/");
  while (base.length % 4) base += "=";
  return base;
}

function parseBase64Json(segment: string): unknown {
  const buffer = Buffer.from(base64UrlToBase64(segment), "base64");
  return JSON.parse(buffer.toString("utf-8"));
}

function base64UrlEncode(bytes: Uint8Array): string {
  return bytesToBase64(bytes)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function safeDecodeByEncoding(
  value: string,
  encoding: string,
): { bytes: Uint8Array; error?: string } {
  try {
    return { bytes: decodeByEncoding(value, encoding) };
  } catch (error) {
    return { bytes: new Uint8Array(), error: (error as Error).message };
  }
}

function safeBytesToUtf8(bytes: Uint8Array): string | null {
  try {
    return bytesToUtf8(bytes);
  } catch {
    return null;
  }
}

function concatBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
  const output = new Uint8Array(a.length + b.length);
  output.set(a, 0);
  output.set(b, a.length);
  return output;
}

async function doubleSha256(bytes: Uint8Array): Promise<Uint8Array> {
  const first = new Uint8Array(
    await cryptoRef.subtle.digest("SHA-256", toArrayBuffer(bytes)),
  );
  const second = new Uint8Array(
    await cryptoRef.subtle.digest("SHA-256", toArrayBuffer(first)),
  );
  return second;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  if (bytes.buffer instanceof ArrayBuffer) {
    const { byteOffset, byteLength } = bytes;
    return bytes.buffer.slice(byteOffset, byteOffset + byteLength);
  }
  return new Uint8Array(bytes).buffer;
}
