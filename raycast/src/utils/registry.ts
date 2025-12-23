/**
 * Raycast Tool Registry
 * Contains metadata and transform mappings for all compatible tools
 */

import * as transforms from "./transforms";

export type ToolOptionMeta = {
  id: string;
  label: string;
  type: "toggle" | "select" | "number" | "text";
  default: unknown;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
};

export type ToolMeta = {
  slug: string;
  name: string;
  description: string;
  section: string;
  sectionName: string;
  aliases: string[];
  inputType: "text" | "none" | "dual";
  options?: ToolOptionMeta[];
  inputPlaceholder?: string;
  transform: transforms.TransformFn;
};

export type SectionMeta = {
  id: string;
  name: string;
  icon: string;
};

export const SECTIONS: SectionMeta[] = [
  { id: "encoding", name: "URL & Encoding", icon: "Link" },
  { id: "base64", name: "Base64 & Bytes", icon: "Document" },
  { id: "text", name: "Text Transforms", icon: "Text" },
  { id: "formats", name: "JSON, YAML, XML", icon: "CodeBlock" },
  { id: "diff", name: "Diff & Compare", icon: "ArrowLeftRight" },
  { id: "crypto", name: "Crypto & Hashing", icon: "Lock" },
  { id: "ids", name: "IDs & Tokens", icon: "Hashtag" },
  { id: "datetime", name: "Date & Time", icon: "Clock" },
  { id: "numbers", name: "Numbers & Bits", icon: "Calculator" },
  { id: "http", name: "HTTP Helpers", icon: "Globe" },
  { id: "code", name: "Code Cleanup", icon: "Terminal" },
];

// All Raycast-compatible tools with their transforms
export const TOOLS: ToolMeta[] = [
  // URL & Encoding
  {
    slug: "url-encode",
    name: "URL Encode / Decode",
    description: "Encode or decode URL components and full URLs",
    section: "encoding",
    sectionName: "URL & Encoding",
    aliases: ["urlencode", "percent-encoding", "encodeuri"],
    inputType: "text",
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
          { value: "component", label: "Component" },
          { value: "full", label: "Full URL" },
        ],
      },
      {
        id: "spaceAsPlus",
        label: "Space as +",
        type: "toggle",
        default: false,
      },
    ],
    transform: transforms.urlEncode,
  },
  {
    slug: "url-parse",
    name: "Parse URL",
    description: "Break down a URL into its components",
    section: "encoding",
    sectionName: "URL & Encoding",
    aliases: ["url-parts", "url-components"],
    inputType: "text",
    transform: transforms.parseUrl,
  },
  {
    slug: "query-string-json",
    name: "Query String ↔ JSON",
    description: "Convert between query strings and JSON objects",
    section: "encoding",
    sectionName: "URL & Encoding",
    aliases: ["querystring", "qs", "search-params"],
    inputType: "text",
    options: [
      {
        id: "mode",
        label: "Mode",
        type: "select",
        default: "toJson",
        options: [
          { value: "toJson", label: "Query → JSON" },
          { value: "toQuery", label: "JSON → Query" },
        ],
      },
    ],
    transform: transforms.queryStringJson,
  },
  {
    slug: "utm-stripper",
    name: "UTM / Tracking Stripper",
    description: "Remove common tracking parameters from URLs",
    section: "encoding",
    sectionName: "URL & Encoding",
    aliases: ["remove-tracking", "clean-url"],
    inputType: "text",
    transform: transforms.utmStripper,
  },
  {
    slug: "html-entities",
    name: "HTML Entity Encode / Decode",
    description: "Convert special characters to HTML entities and back",
    section: "encoding",
    sectionName: "URL & Encoding",
    aliases: ["html-escape", "htmlencode"],
    inputType: "text",
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
    transform: transforms.htmlEntities,
  },
  {
    slug: "unicode-escape",
    name: "Unicode Escape / Unescape",
    description: "Convert to/from \\uXXXX Unicode escape sequences",
    section: "encoding",
    sectionName: "URL & Encoding",
    aliases: ["unicode", "utf16-escape"],
    inputType: "text",
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
    transform: transforms.unicodeEscape,
  },
  {
    slug: "json-string-escape",
    name: "JSON String Escape / Unescape",
    description: "Escape or unescape strings for JSON embedding",
    section: "encoding",
    sectionName: "URL & Encoding",
    aliases: ["json-escape", "stringify"],
    inputType: "text",
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
    transform: transforms.jsonStringEscape,
  },

  // Base64 & Bytes
  {
    slug: "base64-text",
    name: "Base64 Encode / Decode (Text)",
    description: "Encode or decode UTF-8 text to/from Base64",
    section: "base64",
    sectionName: "Base64 & Bytes",
    aliases: ["base64", "btoa", "atob"],
    inputType: "text",
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
    transform: transforms.base64Text,
  },
  {
    slug: "base64-url-convert",
    name: "Base64 ↔ Base64URL",
    description: "Convert between standard Base64 and URL-safe Base64",
    section: "base64",
    sectionName: "Base64 & Bytes",
    aliases: ["base64url", "url-safe-base64"],
    inputType: "text",
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
    transform: transforms.base64UrlConvert,
  },
  {
    slug: "hex-encode",
    name: "Hex Encode / Decode",
    description: "Convert text to/from hexadecimal representation",
    section: "base64",
    sectionName: "Base64 & Bytes",
    aliases: ["hexadecimal", "hex", "text-to-hex"],
    inputType: "text",
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
    transform: transforms.hexEncode,
  },
  {
    slug: "bytes-viewer",
    name: "Bytes Viewer",
    description: "View text as hex dump with offset and ASCII columns",
    section: "base64",
    sectionName: "Base64 & Bytes",
    aliases: ["hex-dump", "hex-viewer"],
    inputType: "text",
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
    transform: transforms.bytesViewer,
  },
  {
    slug: "ascii-binary",
    name: "ASCII ↔ Binary",
    description: "Convert text to/from 8-bit binary representation",
    section: "base64",
    sectionName: "Base64 & Bytes",
    aliases: ["text-binary", "binary-text"],
    inputType: "text",
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
    transform: transforms.asciiBinary,
  },

  // Text Transforms
  {
    slug: "case-converter",
    name: "Case Converter",
    description:
      "Convert text between camelCase, PascalCase, snake_case, and more",
    section: "text",
    sectionName: "Text Transforms",
    aliases: ["camelcase", "snakecase", "pascalcase", "kebabcase"],
    inputType: "text",
    options: [
      {
        id: "case",
        label: "Convert to",
        type: "select",
        default: "camel",
        options: [
          { value: "camel", label: "camelCase" },
          { value: "pascal", label: "PascalCase" },
          { value: "snake", label: "snake_case" },
          { value: "kebab", label: "kebab-case" },
          { value: "constant", label: "CONSTANT_CASE" },
          { value: "title", label: "Title Case" },
          { value: "sentence", label: "Sentence case" },
          { value: "lower", label: "lowercase" },
          { value: "upper", label: "UPPERCASE" },
        ],
      },
    ],
    transform: transforms.caseConverter,
  },
  {
    slug: "slugify",
    name: "Slugify",
    description: "Convert text to URL-friendly slugs",
    section: "text",
    sectionName: "Text Transforms",
    aliases: ["url-slug", "permalink"],
    inputType: "text",
    options: [
      { id: "separator", label: "Separator", type: "text", default: "-" },
      { id: "lowercase", label: "Lowercase", type: "toggle", default: true },
      { id: "asciiOnly", label: "ASCII only", type: "toggle", default: true },
    ],
    transform: transforms.slugify,
  },
  {
    slug: "sort-lines",
    name: "Sort Lines",
    description: "Sort lines alphabetically, numerically, or naturally",
    section: "text",
    sectionName: "Text Transforms",
    aliases: ["alphabetize", "order-lines"],
    inputType: "text",
    options: [
      {
        id: "order",
        label: "Order",
        type: "select",
        default: "asc",
        options: [
          { value: "asc", label: "A → Z" },
          { value: "desc", label: "Z → A" },
          { value: "numeric", label: "Numeric" },
          { value: "natural", label: "Natural" },
        ],
      },
      {
        id: "caseInsensitive",
        label: "Case insensitive",
        type: "toggle",
        default: false,
      },
    ],
    transform: transforms.sortLines,
  },
  {
    slug: "unique-lines",
    name: "Unique Lines / Remove Duplicates",
    description: "Remove duplicate lines from text",
    section: "text",
    sectionName: "Text Transforms",
    aliases: ["dedupe", "distinct", "remove-duplicates"],
    inputType: "text",
    options: [
      {
        id: "preserveOrder",
        label: "Preserve order",
        type: "toggle",
        default: true,
      },
      {
        id: "caseInsensitive",
        label: "Case insensitive",
        type: "toggle",
        default: false,
      },
    ],
    transform: transforms.uniqueLines,
  },
  {
    slug: "text-stats",
    name: "Text Statistics",
    description: "Count characters, words, lines, and more",
    section: "text",
    sectionName: "Text Transforms",
    aliases: ["word-count", "char-count"],
    inputType: "text",
    transform: transforms.textStats,
  },
  {
    slug: "join-split",
    name: "Join / Split by Delimiter",
    description: "Join lines into one or split by delimiter",
    section: "text",
    sectionName: "Text Transforms",
    aliases: ["split", "join", "delimiter"],
    inputType: "text",
    options: [
      {
        id: "mode",
        label: "Mode",
        type: "select",
        default: "join",
        options: [
          { value: "join", label: "Join lines" },
          { value: "split", label: "Split by delimiter" },
        ],
      },
      { id: "delimiter", label: "Delimiter", type: "text", default: ", " },
    ],
    transform: transforms.joinSplit,
  },
  {
    slug: "reverse-text",
    name: "Reverse Text",
    description: "Reverse characters, words, or lines",
    section: "text",
    sectionName: "Text Transforms",
    aliases: ["mirror", "flip"],
    inputType: "text",
    options: [
      {
        id: "mode",
        label: "Reverse",
        type: "select",
        default: "chars",
        options: [
          { value: "chars", label: "Characters" },
          { value: "words", label: "Words" },
          { value: "lines", label: "Lines" },
        ],
      },
    ],
    transform: transforms.reverseText,
  },

  // JSON, YAML, XML
  {
    slug: "json-format",
    name: "JSON Formatter / Minifier",
    description: "Pretty print or minify JSON with options",
    section: "formats",
    sectionName: "JSON, YAML, XML",
    aliases: ["json-pretty", "json-beautify", "json-minify"],
    inputType: "text",
    options: [
      {
        id: "mode",
        label: "Mode",
        type: "select",
        default: "format",
        options: [
          { value: "format", label: "Format" },
          { value: "minify", label: "Minify" },
        ],
      },
      {
        id: "indent",
        label: "Indent spaces",
        type: "number",
        default: 2,
        min: 1,
        max: 8,
      },
      { id: "sortKeys", label: "Sort keys", type: "toggle", default: false },
    ],
    transform: transforms.jsonFormat,
  },
  {
    slug: "json-validate",
    name: "JSON Validator",
    description: "Validate JSON and show error location",
    section: "formats",
    sectionName: "JSON, YAML, XML",
    aliases: ["json-lint", "json-check"],
    inputType: "text",
    transform: transforms.jsonValidate,
  },
  {
    slug: "yaml-json",
    name: "YAML ↔ JSON",
    description: "Convert between YAML and JSON",
    section: "formats",
    sectionName: "JSON, YAML, XML",
    aliases: ["yaml", "yml"],
    inputType: "text",
    options: [
      {
        id: "mode",
        label: "Mode",
        type: "select",
        default: "yamlToJson",
        options: [
          { value: "yamlToJson", label: "YAML → JSON" },
          { value: "jsonToYaml", label: "JSON → YAML" },
        ],
      },
      {
        id: "indent",
        label: "Indent",
        type: "number",
        default: 2,
        min: 1,
        max: 8,
      },
    ],
    transform: transforms.yamlJson,
  },
  {
    slug: "env-parser",
    name: ".env Parser",
    description: "Parse .env files to JSON and back",
    section: "formats",
    sectionName: "JSON, YAML, XML",
    aliases: ["dotenv", "environment-variables"],
    inputType: "text",
    options: [
      {
        id: "mode",
        label: "Mode",
        type: "select",
        default: "toJson",
        options: [
          { value: "toJson", label: ".env → JSON" },
          { value: "toEnv", label: "JSON → .env" },
        ],
      },
      {
        id: "maskSecrets",
        label: "Mask secrets",
        type: "toggle",
        default: false,
      },
    ],
    transform: transforms.envParser,
  },

  // Diff
  {
    slug: "text-diff",
    name: "Text Diff",
    description: "Compare two texts and show differences",
    section: "diff",
    sectionName: "Diff & Compare",
    aliases: ["compare", "diff"],
    inputType: "dual",
    options: [
      {
        id: "mode",
        label: "Mode",
        type: "select",
        default: "lines",
        options: [
          { value: "lines", label: "Lines" },
          { value: "words", label: "Words" },
          { value: "chars", label: "Characters" },
        ],
      },
      {
        id: "ignoreCase",
        label: "Ignore case",
        type: "toggle",
        default: false,
      },
      {
        id: "ignoreWhitespace",
        label: "Ignore whitespace",
        type: "toggle",
        default: false,
      },
    ],
    transform: transforms.textDiff,
  },

  // Crypto & Hashing
  {
    slug: "hash-text",
    name: "Hash Generator (Text)",
    description: "Generate MD5, SHA-1, SHA-256, SHA-384, SHA-512 hashes",
    section: "crypto",
    sectionName: "Crypto & Hashing",
    aliases: ["sha256", "sha512", "md5", "checksum"],
    inputType: "text",
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
    transform: transforms.hashText,
  },
  {
    slug: "hmac",
    name: "HMAC Generator",
    description: "Generate HMAC signatures using various algorithms",
    section: "crypto",
    sectionName: "Crypto & Hashing",
    aliases: ["hmac-sha256", "message-auth"],
    inputType: "text",
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
    transform: transforms.hmacGenerate,
  },
  {
    slug: "jwt-decode",
    name: "JWT Decoder",
    description: "Decode JWT tokens and show header, payload, and expiration",
    section: "crypto",
    sectionName: "Crypto & Hashing",
    aliases: ["jwt", "json-web-token"],
    inputType: "text",
    inputPlaceholder: "Paste JWT token here...",
    transform: transforms.jwtDecode,
  },
  {
    slug: "random-bytes",
    name: "Random Bytes Generator",
    description: "Generate cryptographically secure random bytes",
    section: "crypto",
    sectionName: "Crypto & Hashing",
    aliases: ["random", "secure-random"],
    inputType: "none",
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
    transform: (_, opts) => transforms.randomBytes(opts),
  },
  {
    slug: "password-generator",
    name: "Password Generator",
    description: "Generate secure random passwords",
    section: "crypto",
    sectionName: "Crypto & Hashing",
    aliases: ["passgen", "secure-password"],
    inputType: "none",
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
    transform: (_, opts) => transforms.passwordGenerator(opts),
  },
  {
    slug: "crc32",
    name: "CRC32 Checksum",
    description: "Calculate CRC32 checksum",
    section: "crypto",
    sectionName: "Crypto & Hashing",
    aliases: ["crc", "checksum"],
    inputType: "text",
    transform: transforms.crc32,
  },

  // IDs & Tokens
  {
    slug: "uuid-generator",
    name: "UUID v4 Generator",
    description: "Generate random UUID v4 identifiers",
    section: "ids",
    sectionName: "IDs & Tokens",
    aliases: ["uuid", "guid", "uuid4"],
    inputType: "none",
    options: [
      {
        id: "count",
        label: "Count",
        type: "number",
        default: 1,
        min: 1,
        max: 100,
      },
      { id: "uppercase", label: "Uppercase", type: "toggle", default: false },
      { id: "noDashes", label: "No dashes", type: "toggle", default: false },
      { id: "braces", label: "With braces {}", type: "toggle", default: false },
    ],
    transform: (_, opts) => transforms.uuidGenerator(opts),
  },
  {
    slug: "ulid-generator",
    name: "ULID Generator",
    description: "Generate sortable ULID identifiers",
    section: "ids",
    sectionName: "IDs & Tokens",
    aliases: ["ulid", "sortable-id"],
    inputType: "none",
    options: [
      {
        id: "count",
        label: "Count",
        type: "number",
        default: 1,
        min: 1,
        max: 100,
      },
      { id: "lowercase", label: "Lowercase", type: "toggle", default: false },
    ],
    transform: (_, opts) => transforms.ulidGenerator(opts),
  },
  {
    slug: "nanoid-generator",
    name: "NanoID Generator",
    description: "Generate compact NanoID identifiers",
    section: "ids",
    sectionName: "IDs & Tokens",
    aliases: ["nanoid", "short-id"],
    inputType: "none",
    options: [
      {
        id: "count",
        label: "Count",
        type: "number",
        default: 1,
        min: 1,
        max: 100,
      },
      {
        id: "length",
        label: "Length",
        type: "number",
        default: 21,
        min: 2,
        max: 64,
      },
      {
        id: "alphabet",
        label: "Alphabet",
        type: "select",
        default: "default",
        options: [
          { value: "default", label: "Default (A-Za-z0-9_-)" },
          { value: "alphanumeric", label: "Alphanumeric" },
          { value: "lowercase", label: "Lowercase" },
          { value: "numbers", label: "Numbers only" },
          { value: "hex", label: "Hex" },
        ],
      },
    ],
    transform: (_, opts) => transforms.nanoidGenerator(opts),
  },
  {
    slug: "slug-id",
    name: "Slug ID Generator",
    description: "Generate human-readable short IDs (adjective-noun-1234)",
    section: "ids",
    sectionName: "IDs & Tokens",
    aliases: ["human-id", "readable-id"],
    inputType: "none",
    options: [
      {
        id: "count",
        label: "Count",
        type: "number",
        default: 1,
        min: 1,
        max: 20,
      },
      { id: "separator", label: "Separator", type: "text", default: "-" },
      {
        id: "numbers",
        label: "Include numbers",
        type: "toggle",
        default: true,
      },
      {
        id: "numDigits",
        label: "Number digits",
        type: "number",
        default: 4,
        min: 2,
        max: 6,
      },
    ],
    transform: (_, opts) => transforms.slugIdGenerator(opts),
  },

  // Date & Time
  {
    slug: "epoch-converter",
    name: "Unix Epoch Converter",
    description: "Convert between Unix timestamps and human-readable dates",
    section: "datetime",
    sectionName: "Date & Time",
    aliases: ["timestamp", "unix-time", "epoch"],
    inputType: "text",
    inputPlaceholder: "Enter timestamp or date...",
    options: [
      {
        id: "mode",
        label: "Mode",
        type: "select",
        default: "auto",
        options: [
          { value: "auto", label: "Auto-detect" },
          { value: "toDate", label: "Timestamp → Date" },
          { value: "toTimestamp", label: "Date → Timestamp" },
        ],
      },
      {
        id: "unit",
        label: "Timestamp unit",
        type: "select",
        default: "auto",
        options: [
          { value: "auto", label: "Auto-detect" },
          { value: "seconds", label: "Seconds" },
          { value: "milliseconds", label: "Milliseconds" },
        ],
      },
    ],
    transform: transforms.epochConverter,
  },

  // Numbers
  {
    slug: "cidr-calculator",
    name: "CIDR / Subnet Calculator",
    description: "Calculate subnet mask, range, broadcast, and host count",
    section: "numbers",
    sectionName: "Numbers & Bits",
    aliases: ["subnet", "ip-range", "netmask"],
    inputType: "text",
    inputPlaceholder: "Enter CIDR (e.g., 192.168.1.0/24)...",
    transform: transforms.cidrCalculator,
  },
  {
    slug: "ip-integer",
    name: "IP ↔ Integer",
    description: "Convert between IPv4 dotted quad and 32-bit integer",
    section: "numbers",
    sectionName: "Numbers & Bits",
    aliases: ["ip-to-int", "int-to-ip"],
    inputType: "text",
    options: [
      {
        id: "mode",
        label: "Mode",
        type: "select",
        default: "auto",
        options: [
          { value: "auto", label: "Auto-detect" },
          { value: "toInt", label: "IP → Integer" },
          { value: "toIp", label: "Integer → IP" },
        ],
      },
    ],
    transform: transforms.ipInteger,
  },

  // HTTP Helpers
  {
    slug: "http-status",
    name: "HTTP Status Code Lookup",
    description: "Look up HTTP status codes by number or keyword",
    section: "http",
    sectionName: "HTTP Helpers",
    aliases: ["status-code", "404", "500", "200"],
    inputType: "text",
    inputPlaceholder: "Enter status code or search keyword...",
    transform: transforms.httpStatus,
  },
  {
    slug: "auth-header",
    name: "Authorization Header Builder",
    description: "Build Basic or Bearer authorization headers",
    section: "http",
    sectionName: "HTTP Helpers",
    aliases: ["basic-auth", "bearer-token"],
    inputType: "text",
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
    transform: transforms.authHeader,
  },

  // Code Cleanup
  {
    slug: "escape-builder",
    name: "Escape Builders",
    description: "Escape strings for JSON, Regex, Bash, SQL",
    section: "code",
    sectionName: "Code Cleanup",
    aliases: ["escape", "quote", "literal"],
    inputType: "text",
    options: [
      {
        id: "format",
        label: "Format",
        type: "select",
        default: "json",
        options: [
          { value: "json", label: "JSON string" },
          { value: "regex", label: "Regex literal" },
          { value: "bash", label: "Bash string" },
          { value: "sql", label: "SQL literal" },
          { value: "html", label: "HTML attribute" },
          { value: "url", label: "URL component" },
        ],
      },
    ],
    transform: transforms.escapeBuilder,
  },
];

// Get tool by slug
export function getToolBySlug(slug: string): ToolMeta | undefined {
  return TOOLS.find((t) => t.slug === slug);
}

// Get tools by section
export function getToolsBySection(sectionId: string): ToolMeta[] {
  return TOOLS.filter((t) => t.section === sectionId);
}

// Get section by ID
export function getSectionById(id: string): SectionMeta | undefined {
  return SECTIONS.find((s) => s.id === id);
}

// Search tools
export function searchTools(query: string): ToolMeta[] {
  if (!query.trim()) return TOOLS;
  const lower = query.toLowerCase();
  return TOOLS.filter(
    (t) =>
      t.name.toLowerCase().includes(lower) ||
      t.description.toLowerCase().includes(lower) ||
      t.aliases.some((a) => a.toLowerCase().includes(lower)),
  ).sort((a, b) => {
    // Prioritize exact name matches
    const aNameMatch = a.name.toLowerCase().startsWith(lower) ? 0 : 1;
    const bNameMatch = b.name.toLowerCase().startsWith(lower) ? 0 : 1;
    return aNameMatch - bNameMatch;
  });
}
