/**
 * Node-compatible transform functions for Raycast extension
 * These functions mirror the web app transforms but use Node.js APIs
 */

import * as crypto from "node:crypto";
import * as Diff from "diff";
import yaml from "js-yaml";
import { customAlphabet, nanoid } from "nanoid";
import { v4 as uuidv4 } from "uuid";

export type TransformResult = string | { type: "error"; message: string };
export type TransformFn = (
  input: string,
  options: Record<string, unknown>,
) => TransformResult | Promise<TransformResult>;

// ============= URL & Encoding =============

export function urlEncode(
  input: string,
  opts: Record<string, unknown>,
): TransformResult {
  if (!input) return "";
  try {
    if (opts.mode === "encode") {
      let result =
        opts.type === "component"
          ? encodeURIComponent(input)
          : encodeURI(input);
      if (opts.spaceAsPlus) result = result.replace(/%20/g, "+");
      return result;
    }
    const decoded = opts.spaceAsPlus ? input.replace(/\+/g, "%20") : input;
    return opts.type === "component"
      ? decodeURIComponent(decoded)
      : decodeURI(decoded);
  } catch {
    return { type: "error", message: "Invalid encoded string" };
  }
}

export function parseUrl(input: string): TransformResult {
  const str = input.trim();
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
}

export function queryStringJson(
  input: string,
  opts: Record<string, unknown>,
): TransformResult {
  const str = input.trim();
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
      message: opts.mode === "toJson" ? "Invalid query string" : "Invalid JSON",
    };
  }
}

export function utmStripper(input: string): TransformResult {
  const str = input.trim();
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
}

export function htmlEntities(
  input: string,
  opts: Record<string, unknown>,
): TransformResult {
  if (!input) return "";
  const entities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  if (opts.mode === "encode") {
    return input.replace(/[&<>"']/g, (c) => entities[c] || c);
  }
  const reversed = Object.fromEntries(
    Object.entries(entities).map(([k, v]) => [v, k]),
  );
  return input.replace(/&(?:amp|lt|gt|quot|#39);/g, (e) => reversed[e] || e);
}

export function unicodeEscape(
  input: string,
  opts: Record<string, unknown>,
): TransformResult {
  if (!input) return "";
  if (opts.mode === "escape") {
    return input
      .split("")
      .map((c) => {
        const code = c.charCodeAt(0);
        return code > 127 ? `\\u${code.toString(16).padStart(4, "0")}` : c;
      })
      .join("");
  }
  return input.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16)),
  );
}

export function jsonStringEscape(
  input: string,
  opts: Record<string, unknown>,
): TransformResult {
  if (!input) return "";
  if (opts.mode === "escape") {
    return JSON.stringify(input).slice(1, -1);
  }
  try {
    return JSON.parse(`"${input}"`);
  } catch {
    return { type: "error", message: "Invalid escaped string" };
  }
}

// ============= Base64 & Bytes =============

export function base64Text(
  input: string,
  opts: Record<string, unknown>,
): TransformResult {
  if (!input) return "";
  try {
    if (opts.mode === "encode") {
      let result = Buffer.from(input, "utf-8").toString("base64");
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
    let decoded = input.replace(/\s/g, "");
    if (opts.urlSafe) {
      decoded = decoded.replace(/-/g, "+").replace(/_/g, "/");
      while (decoded.length % 4) decoded += "=";
    }
    return Buffer.from(decoded, "base64").toString("utf-8");
  } catch {
    return { type: "error", message: "Invalid Base64 string" };
  }
}

export function base64UrlConvert(
  input: string,
  opts: Record<string, unknown>,
): TransformResult {
  const str = input.trim();
  if (!str) return "";
  if (opts.mode === "toUrl") {
    return str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  let result = str.replace(/-/g, "+").replace(/_/g, "/");
  while (result.length % 4) result += "=";
  return result;
}

export function hexEncode(
  input: string,
  opts: Record<string, unknown>,
): TransformResult {
  if (!input) return "";
  if (opts.mode === "encode") {
    const bytes = Buffer.from(input, "utf-8");
    let hex = bytes.toString("hex");
    if (opts.spacing) hex = hex.match(/.{2}/g)?.join(" ") || hex;
    if (opts.uppercase) hex = hex.toUpperCase();
    if (opts.prefix) hex = `0x${hex.replace(/ /g, " 0x")}`;
    return hex;
  }
  try {
    const clean = input.replace(/0x/gi, "").replace(/\s/g, "");
    return Buffer.from(clean, "hex").toString("utf-8");
  } catch {
    return { type: "error", message: "Invalid hex string" };
  }
}

export function bytesViewer(
  input: string,
  opts: Record<string, unknown>,
): TransformResult {
  if (!input) return "";
  const bytes = Buffer.from(input, "utf-8");
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

export function asciiBinary(
  input: string,
  opts: Record<string, unknown>,
): TransformResult {
  if (!input) return "";
  if (opts.mode === "toBinary") {
    const binary = input
      .split("")
      .map((c) => c.charCodeAt(0).toString(2).padStart(8, "0"));
    return opts.spacing ? binary.join(" ") : binary.join("");
  }
  try {
    const clean = input.replace(/\s/g, "");
    if (clean.length % 8 !== 0)
      return {
        type: "error",
        message: "Invalid binary (must be multiple of 8 bits)",
      };
    const bytes = clean.match(/.{8}/g) || [];
    return bytes.map((b) => String.fromCharCode(parseInt(b, 2))).join("");
  } catch {
    return { type: "error", message: "Invalid binary string" };
  }
}

// ============= Text Transforms =============

export function caseConverter(
  input: string,
  opts: Record<string, unknown>,
): TransformResult {
  if (!input) return "";
  const words = input
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  switch (opts.case) {
    case "camel":
      return words
        .map((w, i) => (i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)))
        .join("");
    case "pascal":
      return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("");
    case "snake":
      return words.join("_");
    case "kebab":
      return words.join("-");
    case "constant":
      return words.join("_").toUpperCase();
    case "title":
      return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    case "sentence":
      return words
        .map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
        .join(" ");
    case "lower":
      return input.toLowerCase();
    case "upper":
      return input.toUpperCase();
    default:
      return input;
  }
}

export function slugify(
  input: string,
  opts: Record<string, unknown>,
): TransformResult {
  let str = input;
  if (!str) return "";
  if (opts.lowercase) str = str.toLowerCase();
  if (opts.asciiOnly)
    str = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const sep = String(opts.separator || "-");
  return str
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, sep)
    .replace(new RegExp(`${sep}+`, "g"), sep)
    .replace(new RegExp(`^${sep}|${sep}$`, "g"), "");
}

export function sortLines(
  input: string,
  opts: Record<string, unknown>,
): TransformResult {
  if (!input) return "";
  const lines = input.split("\n");
  const collator = new Intl.Collator(undefined, {
    numeric: opts.order === "natural" || opts.order === "numeric",
    sensitivity: opts.caseInsensitive ? "base" : "variant",
  });
  lines.sort((a, b) => {
    if (opts.order === "numeric") {
      const numA = parseFloat(a) || 0;
      const numB = parseFloat(b) || 0;
      return numA - numB;
    }
    return collator.compare(a, b);
  });
  if (opts.order === "desc") lines.reverse();
  return lines.join("\n");
}

export function uniqueLines(
  input: string,
  opts: Record<string, unknown>,
): TransformResult {
  if (!input) return "";
  const lines = input.split("\n");
  const seen = new Set<string>();
  const result: string[] = [];
  for (const line of lines) {
    const key = opts.caseInsensitive ? line.toLowerCase() : line;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(line);
    }
  }
  if (!opts.preserveOrder) result.sort();
  return result.join("\n");
}

export function textStats(input: string): TransformResult {
  if (!input) return "";
  const lines = input.split("\n");
  const words = input.split(/\s+/).filter(Boolean);
  const bytes = Buffer.from(input, "utf-8").length;
  const longestLine = Math.max(...lines.map((l) => l.length));

  return [
    `Characters: ${input.length}`,
    `Characters (no spaces): ${input.replace(/\s/g, "").length}`,
    `Words: ${words.length}`,
    `Lines: ${lines.length}`,
    `Longest line: ${longestLine} chars`,
    `Bytes (UTF-8): ${bytes}`,
    `Paragraphs: ${input.split(/\n\s*\n/).filter(Boolean).length}`,
  ].join("\n");
}

export function joinSplit(
  input: string,
  opts: Record<string, unknown>,
): TransformResult {
  if (!input) return "";
  const delim = String(opts.delimiter)
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t");
  if (opts.mode === "join") {
    return input.split("\n").join(delim);
  }
  return input.split(delim).join("\n");
}

export function reverseText(
  input: string,
  opts: Record<string, unknown>,
): TransformResult {
  if (!input) return "";
  switch (opts.mode) {
    case "chars":
      return [...input].reverse().join("");
    case "words":
      return input.split(/(\s+)/).reverse().join("");
    case "lines":
      return input.split("\n").reverse().join("\n");
    default:
      return input;
  }
}

// ============= JSON, YAML, XML Formats =============

export function jsonFormat(
  input: string,
  opts: Record<string, unknown>,
): TransformResult {
  const str = input.trim();
  if (!str) return "";
  try {
    let obj = JSON.parse(str);
    if (opts.sortKeys) obj = sortObjectKeys(obj);
    return opts.mode === "minify"
      ? JSON.stringify(obj)
      : JSON.stringify(obj, null, Number(opts.indent) || 2);
  } catch (e) {
    return { type: "error", message: `Invalid JSON: ${(e as Error).message}` };
  }
}

export function jsonValidate(input: string): TransformResult {
  const str = input.trim();
  if (!str) return "";
  try {
    JSON.parse(str);
    return "✓ Valid JSON";
  } catch (e) {
    const msg = (e as Error).message;
    return `✗ Invalid JSON\n\n${msg}`;
  }
}

export function yamlJson(
  input: string,
  opts: Record<string, unknown>,
): TransformResult {
  const str = input.trim();
  if (!str) return "";
  try {
    if (opts.mode === "yamlToJson") {
      const obj = yaml.load(str);
      return JSON.stringify(obj, null, Number(opts.indent) || 2);
    }
    const obj = JSON.parse(str);
    return yaml.dump(obj, { indent: Number(opts.indent) || 2 });
  } catch (e) {
    return { type: "error", message: (e as Error).message };
  }
}

export function envParser(
  input: string,
  opts: Record<string, unknown>,
): TransformResult {
  const str = input.trim();
  if (!str) return "";

  if (opts.mode === "toJson") {
    const result: Record<string, string> = {};
    const secretPatterns = /key|secret|password|token|api|auth/i;

    for (const line of str.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        let value = match[2].trim();
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        if (opts.maskSecrets && secretPatterns.test(match[1])) {
          value = "***MASKED***";
        }
        result[match[1].trim()] = value;
      }
    }
    return JSON.stringify(result, null, 2);
  }

  try {
    const obj = JSON.parse(str);
    return Object.entries(obj)
      .map(([k, v]) => `${k}=${String(v).includes(" ") ? `"${v}"` : v}`)
      .join("\n");
  } catch {
    return { type: "error", message: "Invalid JSON" };
  }
}

// ============= Diff =============

export function textDiff(
  input: string,
  opts: Record<string, unknown>,
): TransformResult {
  const parts = input.split(/---SEPARATOR---|\n---\n/);
  if (parts.length < 2) {
    return { type: "error", message: "Enter text in both panels to compare" };
  }

  let text1 = parts[0].trim();
  let text2 = parts[1].trim();

  if (opts.ignoreCase) {
    text1 = text1.toLowerCase();
    text2 = text2.toLowerCase();
  }

  if (opts.ignoreWhitespace) {
    text1 = text1.replace(/\s+/g, " ").trim();
    text2 = text2.replace(/\s+/g, " ").trim();
  }

  let diff: Diff.Change[];
  switch (opts.mode) {
    case "words":
      diff = Diff.diffWords(text1, text2);
      break;
    case "chars":
      diff = Diff.diffChars(text1, text2);
      break;
    default:
      diff = Diff.diffLines(text1, text2);
  }

  let additions = 0;
  let deletions = 0;
  const output: string[] = [];

  for (const part of diff) {
    if (part.added) {
      additions += part.value.length;
      output.push(`+ ${part.value}`);
    } else if (part.removed) {
      deletions += part.value.length;
      output.push(`- ${part.value}`);
    }
  }

  return `Additions: ${additions}, Deletions: ${deletions}\n\n${output.join("\n")}`;
}

// ============= Crypto & Hashing =============

export async function hashText(
  input: string,
  opts: Record<string, unknown>,
): Promise<TransformResult> {
  if (!input) return "";
  const algorithm = String(opts.algorithm).toLowerCase().replace("-", "");
  let hash: string;

  if (algorithm === "md5") {
    hash = crypto.createHash("md5").update(input).digest("hex");
  } else {
    const algoMap: Record<string, string> = {
      sha1: "sha1",
      sha256: "sha256",
      sha384: "sha384",
      sha512: "sha512",
    };
    hash = crypto
      .createHash(algoMap[algorithm] || "sha256")
      .update(input)
      .digest("hex");
  }

  return opts.uppercase ? hash.toUpperCase() : hash;
}

export async function hmacGenerate(
  input: string,
  opts: Record<string, unknown>,
): Promise<TransformResult> {
  if (!input) return "";
  const secret = String(opts.secret);
  if (!secret) return { type: "error", message: "Secret key is required" };

  const algorithm = String(opts.algorithm).toLowerCase().replace("-", "");
  const algoMap: Record<string, string> = {
    sha1: "sha1",
    sha256: "sha256",
    sha384: "sha384",
    sha512: "sha512",
  };

  const hmac = crypto.createHmac(algoMap[algorithm] || "sha256", secret);
  hmac.update(input);

  if (opts.output === "base64") {
    return hmac.digest("base64");
  }
  return hmac.digest("hex");
}

export function jwtDecode(input: string): TransformResult {
  const token = input.trim();
  if (!token) return "";

  const parts = token.split(".");
  if (parts.length !== 3) {
    return { type: "error", message: "Invalid JWT format (expected 3 parts)" };
  }

  try {
    const decodeBase64Url = (str: string) => {
      let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
      while (base64.length % 4) base64 += "=";
      return JSON.parse(Buffer.from(base64, "base64").toString("utf-8"));
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
    }

    return lines.join("\n");
  } catch {
    return { type: "error", message: "Failed to decode JWT" };
  }
}

export function randomBytes(opts: Record<string, unknown>): TransformResult {
  const length = Number(opts.length) || 32;
  const bytes = crypto.randomBytes(length);

  switch (opts.format) {
    case "base64":
      return bytes.toString("base64");
    case "base64url":
      return bytes.toString("base64url");
    default:
      return bytes.toString("hex");
  }
}

export function passwordGenerator(
  opts: Record<string, unknown>,
): TransformResult {
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
  if (opts.avoidAmbiguous)
    chars = chars
      .split("")
      .filter((c) => !ambiguous.includes(c))
      .join("");

  const length = Number(opts.length) || 16;
  const count = Number(opts.count) || 1;
  const passwords: string[] = [];

  for (let i = 0; i < count; i++) {
    const bytes = crypto.randomBytes(length);
    const password = Array.from(bytes)
      .map((b) => chars[b % chars.length])
      .join("");
    passwords.push(password);
  }

  return passwords.join("\n");
}

export function crc32(input: string): TransformResult {
  if (!input) return "";

  const table = Array.from({ length: 256 }, (_, i) => {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    return c;
  });

  let crc = 0xffffffff;
  for (let i = 0; i < input.length; i++) {
    crc = table[(crc ^ input.charCodeAt(i)) & 0xff] ^ (crc >>> 8);
  }
  const result = (crc ^ 0xffffffff) >>> 0;

  return [
    `CRC32: ${result.toString(16).toUpperCase().padStart(8, "0")}`,
    `Decimal: ${result}`,
  ].join("\n");
}

// ============= IDs & Tokens =============

export function uuidGenerator(opts: Record<string, unknown>): TransformResult {
  const count = Math.min(Number(opts.count) || 1, 100);
  const uuids: string[] = [];

  for (let i = 0; i < count; i++) {
    let uuid = uuidv4();
    if (opts.noDashes) uuid = uuid.replace(/-/g, "");
    if (opts.uppercase) uuid = uuid.toUpperCase();
    if (opts.braces) uuid = `{${uuid}}`;
    uuids.push(uuid);
  }

  return uuids.join("\n");
}

export function ulidGenerator(opts: Record<string, unknown>): TransformResult {
  const ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  const count = Math.min(Number(opts.count) || 1, 100);
  const ulids: string[] = [];

  for (let i = 0; i < count; i++) {
    const now = Date.now();
    let str = "";
    let time = now;
    for (let j = 9; j >= 0; j--) {
      str = ENCODING[time % 32] + str;
      time = Math.floor(time / 32);
    }
    const random = crypto.randomBytes(10);
    for (let j = 0; j < 16; j++) {
      str += ENCODING[random[j % 10] % 32];
    }
    ulids.push(opts.lowercase ? str.toLowerCase() : str);
  }

  return ulids.join("\n");
}

export function nanoidGenerator(
  opts: Record<string, unknown>,
): TransformResult {
  const count = Math.min(Number(opts.count) || 1, 100);
  const length = Number(opts.length) || 21;
  const ids: string[] = [];

  const alphabets: Record<string, string> = {
    default: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_-",
    alphanumeric:
      "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
    lowercase: "0123456789abcdefghijklmnopqrstuvwxyz",
    numbers: "0123456789",
    hex: "0123456789abcdef",
  };

  const alphabet = alphabets[String(opts.alphabet)] || alphabets.default;
  const generator =
    opts.alphabet === "default"
      ? () => nanoid(length)
      : customAlphabet(alphabet, length);

  for (let i = 0; i < count; i++) {
    ids.push(generator());
  }

  return ids.join("\n");
}

export function slugIdGenerator(
  opts: Record<string, unknown>,
): TransformResult {
  const adjectives = [
    "quick",
    "lazy",
    "happy",
    "sad",
    "bright",
    "dark",
    "warm",
    "cold",
    "fast",
    "slow",
    "bold",
    "calm",
    "clever",
    "brave",
    "gentle",
    "fierce",
    "kind",
    "proud",
    "wise",
  ];
  const nouns = [
    "fox",
    "dog",
    "cat",
    "bird",
    "fish",
    "bear",
    "wolf",
    "lion",
    "tree",
    "rock",
    "lake",
    "river",
    "cloud",
    "star",
    "moon",
    "sun",
    "wind",
    "fire",
    "wave",
    "leaf",
  ];

  const count = Math.min(Number(opts.count) || 1, 20);
  const sep = String(opts.separator || "-");
  const numDigits = Number(opts.numDigits) || 4;
  const ids: string[] = [];

  for (let i = 0; i < count; i++) {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    let id = `${adj}${sep}${noun}`;
    if (opts.numbers) {
      const num = Math.floor(Math.random() * 10 ** numDigits)
        .toString()
        .padStart(numDigits, "0");
      id += `${sep}${num}`;
    }
    ids.push(id);
  }

  return ids.join("\n");
}

// ============= Date & Time =============

export function epochConverter(
  input: string,
  opts: Record<string, unknown>,
): TransformResult {
  const str = input.trim();
  if (!str) {
    const now = Date.now();
    return [
      "Current time:",
      `  Seconds: ${Math.floor(now / 1000)}`,
      `  Milliseconds: ${now}`,
      `  ISO: ${new Date(now).toISOString()}`,
    ].join("\n");
  }

  const isNumeric = /^\d+$/.test(str);
  let mode = opts.mode;
  if (mode === "auto") mode = isNumeric ? "toDate" : "toTimestamp";

  if (mode === "toDate") {
    let ts = parseInt(str, 10);
    let unit = opts.unit;
    if (unit === "auto") unit = ts > 1e12 ? "milliseconds" : "seconds";
    if (unit === "seconds") ts *= 1000;
    const date = new Date(ts);
    if (Number.isNaN(date.getTime()))
      return { type: "error", message: "Invalid timestamp" };
    return [
      `Timestamp: ${str} (${unit})`,
      "",
      `ISO 8601: ${date.toISOString()}`,
      `UTC: ${date.toUTCString()}`,
      `Local: ${date.toLocaleString()}`,
    ].join("\n");
  }

  const date = new Date(str);
  if (Number.isNaN(date.getTime()))
    return { type: "error", message: "Invalid date format" };
  return [
    `Parsed: ${str}`,
    "",
    `Seconds: ${Math.floor(date.getTime() / 1000)}`,
    `Milliseconds: ${date.getTime()}`,
    `ISO 8601: ${date.toISOString()}`,
  ].join("\n");
}

// ============= Numbers =============

export function cidrCalculator(input: string): TransformResult {
  const str = input.trim();
  if (!str) return "";

  const match = str.match(/^(\d+\.\d+\.\d+\.\d+)\/(\d+)$/);
  if (!match)
    return {
      type: "error",
      message: "Invalid CIDR notation (e.g., 192.168.1.0/24)",
    };

  const [, ip, prefixStr] = match;
  const prefix = parseInt(prefixStr, 10);
  if (prefix < 0 || prefix > 32)
    return { type: "error", message: "Prefix must be 0-32" };

  const ipParts = ip.split(".").map(Number);
  if (ipParts.some((p) => p < 0 || p > 255))
    return { type: "error", message: "Invalid IP address" };

  const ipNum =
    (ipParts[0] << 24) + (ipParts[1] << 16) + (ipParts[2] << 8) + ipParts[3];
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  const network = (ipNum & mask) >>> 0;
  const broadcast = (network | (~mask >>> 0)) >>> 0;
  const hostCount =
    prefix < 31 ? broadcast - network - 1 : prefix === 31 ? 2 : 1;

  const toIp = (n: number) =>
    [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff].join(
      ".",
    );

  return [
    `CIDR: ${str}`,
    "",
    `Network: ${toIp(network)}`,
    `Broadcast: ${toIp(broadcast)}`,
    `Subnet mask: ${toIp(mask)}`,
    `Wildcard: ${toIp(~mask >>> 0)}`,
    "",
    `Usable hosts: ${hostCount.toLocaleString()}`,
  ].join("\n");
}

export function ipInteger(
  input: string,
  opts: Record<string, unknown>,
): TransformResult {
  const str = input.trim();
  if (!str) return "";

  const isIp = /^\d+\.\d+\.\d+\.\d+$/.test(str);
  const mode = opts.mode === "auto" ? (isIp ? "toInt" : "toIp") : opts.mode;

  if (mode === "toInt") {
    const parts = str.split(".").map(Number);
    if (parts.length !== 4 || parts.some((p) => p < 0 || p > 255))
      return { type: "error", message: "Invalid IP address" };
    const num =
      ((parts[0] << 24) + (parts[1] << 16) + (parts[2] << 8) + parts[3]) >>> 0;
    return [
      `IP: ${str}`,
      `Integer: ${num}`,
      `Hex: 0x${num.toString(16).toUpperCase().padStart(8, "0")}`,
    ].join("\n");
  }

  const num = parseInt(str, 10);
  if (Number.isNaN(num) || num < 0 || num > 0xffffffff)
    return { type: "error", message: "Invalid integer (must be 0-4294967295)" };
  const ip = [
    (num >>> 24) & 0xff,
    (num >>> 16) & 0xff,
    (num >>> 8) & 0xff,
    num & 0xff,
  ].join(".");
  return [`Integer: ${num}`, `IP: ${ip}`].join("\n");
}

// ============= HTTP Helpers =============

export function httpStatus(input: string): TransformResult {
  const str = input.trim().toLowerCase();
  if (!str) return "";

  const codes: Record<number, { name: string; description: string }> = {
    200: { name: "OK", description: "Request succeeded" },
    201: { name: "Created", description: "Resource created successfully" },
    204: {
      name: "No Content",
      description: "Request succeeded with no response body",
    },
    301: {
      name: "Moved Permanently",
      description: "Resource permanently moved",
    },
    302: {
      name: "Found",
      description: "Resource temporarily at different URL",
    },
    304: {
      name: "Not Modified",
      description: "Resource not modified since last request",
    },
    400: {
      name: "Bad Request",
      description: "Server cannot process malformed request",
    },
    401: { name: "Unauthorized", description: "Authentication required" },
    403: {
      name: "Forbidden",
      description: "Server refuses to authorize request",
    },
    404: { name: "Not Found", description: "Resource not found" },
    405: {
      name: "Method Not Allowed",
      description: "HTTP method not supported",
    },
    422: {
      name: "Unprocessable Entity",
      description: "Semantically incorrect request",
    },
    429: { name: "Too Many Requests", description: "Rate limit exceeded" },
    500: { name: "Internal Server Error", description: "Generic server error" },
    502: { name: "Bad Gateway", description: "Invalid response from upstream" },
    503: {
      name: "Service Unavailable",
      description: "Server temporarily unavailable",
    },
    504: { name: "Gateway Timeout", description: "Upstream server timed out" },
  };

  const codeNum = parseInt(str, 10);
  if (!Number.isNaN(codeNum) && codes[codeNum]) {
    const c = codes[codeNum];
    return `${codeNum} ${c.name}\n\n${c.description}`;
  }

  const results = Object.entries(codes).filter(
    ([, v]) =>
      v.name.toLowerCase().includes(str) ||
      v.description.toLowerCase().includes(str),
  );
  if (results.length === 0) return "No matching status codes found";
  return results
    .map(([code, v]) => `${code} ${v.name} - ${v.description}`)
    .join("\n");
}

export function authHeader(
  input: string,
  opts: Record<string, unknown>,
): TransformResult {
  if (!input.trim()) return "";
  if (opts.type === "bearer") return `Authorization: Bearer ${input.trim()}`;
  const encoded = Buffer.from(input).toString("base64");
  return [
    `Authorization: Basic ${encoded}`,
    "",
    `Decoded: ${input}`,
    `Base64: ${encoded}`,
  ].join("\n");
}

// ============= Code Cleanup =============

export function escapeBuilder(
  input: string,
  opts: Record<string, unknown>,
): TransformResult {
  if (!input) return "";
  switch (opts.format) {
    case "json":
      return JSON.stringify(input);
    case "regex":
      return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    case "bash":
      return `'${input.replace(/'/g, "'\\''")}'`;
    case "sql":
      return `'${input.replace(/'/g, "''")}'`;
    case "html":
      return input
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    case "url":
      return encodeURIComponent(input);
    default:
      return input;
  }
}

// ============= Helpers =============

function sortObjectKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(sortObjectKeys);
  if (obj !== null && typeof obj === "object") {
    return Object.keys(obj as Record<string, unknown>)
      .sort()
      .reduce(
        (result, key) => {
          result[key] = sortObjectKeys((obj as Record<string, unknown>)[key]);
          return result;
        },
        {} as Record<string, unknown>,
      );
  }
  return obj;
}
