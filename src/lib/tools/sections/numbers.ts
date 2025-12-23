import type { ToolDefinition } from "../types";

export const numberTools: ToolDefinition[] = [
  {
    slug: "base-converter",
    name: "Base Converter",
    description:
      "Convert numbers between decimal, hex, binary, octal, base36, base62",
    section: "numbers",
    aliases: ["radix", "hex", "binary", "octal"],
    inputType: "text",
    outputType: "text",
    options: [
      {
        id: "fromBase",
        label: "From base",
        type: "select",
        default: "10",
        options: [
          { value: "2", label: "Binary (2)" },
          { value: "8", label: "Octal (8)" },
          { value: "10", label: "Decimal (10)" },
          { value: "16", label: "Hexadecimal (16)" },
          { value: "36", label: "Base36" },
          { value: "62", label: "Base62" },
        ],
      },
    ],
    transform: (input, opts) => {
      const str = String(input).trim().replace(/\s/g, "");
      if (!str) return "";

      const fromBase = Number(opts.fromBase);
      let num: bigint;

      try {
        if (fromBase === 62) {
          num = fromBase62(str);
        } else {
          num = BigInt(
            fromBase === 10
              ? str
              : `0${"box"[Math.log2(fromBase)] || "x"}${str.toLowerCase()}`,
          );
          // Fallback for bases not supported by BigInt literal
          if (fromBase === 36) {
            num = BigInt(Number.parseInt(str, 36));
          }
        }
      } catch {
        return {
          type: "error",
          message: "Invalid number for the selected base",
        };
      }

      const results = [
        `Input: ${str} (base ${fromBase})`,
        "",
        `Binary (2):      ${num.toString(2)}`,
        `Octal (8):       ${num.toString(8)}`,
        `Decimal (10):    ${num.toString(10)}`,
        `Hex (16):        ${num.toString(16).toUpperCase()}`,
        `Base36:          ${num.toString(36)}`,
        `Base62:          ${toBase62(num)}`,
      ];

      return results.join("\n");
    },
  },
  {
    slug: "bitwise",
    name: "Bitwise Playground",
    description: "Visualize AND, OR, XOR, NOT, and SHIFT operations",
    section: "numbers",
    aliases: ["and", "or", "xor", "shift", "binary-ops"],
    inputType: "text",
    outputType: "text",
    inputPlaceholder: "Enter two numbers (one per line)...",
    options: [
      {
        id: "operation",
        label: "Operation",
        type: "select",
        default: "and",
        options: [
          { value: "and", label: "AND (&)" },
          { value: "or", label: "OR (|)" },
          { value: "xor", label: "XOR (^)" },
          { value: "not", label: "NOT (~) - first number only" },
          { value: "lshift", label: "Left shift (<<)" },
          { value: "rshift", label: "Right shift (>>)" },
        ],
      },
      {
        id: "bits",
        label: "Bit width",
        type: "number",
        default: 32,
        min: 8,
        max: 64,
      },
    ],
    transform: (input, opts) => {
      const lines = String(input)
        .trim()
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      if (lines.length === 0) return "";

      const bits = Number(opts.bits) || 32;
      const parseNum = (s: string) => {
        if (s.startsWith("0x")) return Number.parseInt(s, 16);
        if (s.startsWith("0b")) return Number.parseInt(s.slice(2), 2);
        if (s.startsWith("0o")) return Number.parseInt(s.slice(2), 8);
        return Number.parseInt(s, 10);
      };

      const a = parseNum(lines[0]);
      const b = lines[1] ? parseNum(lines[1]) : 0;

      if (Number.isNaN(a) || Number.isNaN(b)) {
        return { type: "error", message: "Invalid number" };
      }

      const formatBinary = (n: number) =>
        (n >>> 0).toString(2).padStart(bits, "0").slice(-bits);

      let result: number;
      let opSymbol: string;

      switch (opts.operation) {
        case "and":
          result = a & b;
          opSymbol = "&";
          break;
        case "or":
          result = a | b;
          opSymbol = "|";
          break;
        case "xor":
          result = a ^ b;
          opSymbol = "^";
          break;
        case "not":
          result = ~a;
          opSymbol = "~";
          break;
        case "lshift":
          result = a << b;
          opSymbol = "<<";
          break;
        case "rshift":
          result = a >> b;
          opSymbol = ">>";
          break;
        default:
          result = 0;
          opSymbol = "?";
      }

      const output = [`A: ${a.toString().padStart(12)} = ${formatBinary(a)}`];

      if (opts.operation !== "not") {
        output.push(`B: ${b.toString().padStart(12)} = ${formatBinary(b)}`);
      }

      output.push(
        `${"─".repeat(50)}`,
        `${opts.operation === "not" ? "~A" : `A ${opSymbol} B`}: ${result.toString().padStart(10)} = ${formatBinary(result)}`,
        "",
        `Hex: 0x${(result >>> 0).toString(16).toUpperCase()}`,
      );

      return output.join("\n");
    },
  },
  {
    slug: "ieee754",
    name: "IEEE 754 Float Decoder",
    description:
      "Decode floating point numbers to sign, exponent, and mantissa",
    section: "numbers",
    aliases: ["float", "double", "floating-point"],
    inputType: "text",
    outputType: "text",
    options: [
      {
        id: "precision",
        label: "Precision",
        type: "select",
        default: "single",
        options: [
          { value: "single", label: "Single (32-bit)" },
          { value: "double", label: "Double (64-bit)" },
        ],
      },
    ],
    transform: (input, opts) => {
      const str = String(input).trim();
      if (!str) return "";

      const num = Number.parseFloat(str);
      if (Number.isNaN(num) && str.toLowerCase() !== "nan") {
        return { type: "error", message: "Invalid number" };
      }

      const buffer = new ArrayBuffer(8);
      const view = new DataView(buffer);

      if (opts.precision === "single") {
        view.setFloat32(0, num);
        const bits = view.getUint32(0);
        const sign = (bits >>> 31) & 1;
        const exponent = (bits >>> 23) & 0xff;
        const mantissa = bits & 0x7fffff;

        return [
          `Number: ${num}`,
          "",
          "32-bit IEEE 754:",
          `  Hex: 0x${bits.toString(16).toUpperCase().padStart(8, "0")}`,
          `  Binary: ${bits.toString(2).padStart(32, "0")}`,
          "",
          "Components:",
          `  Sign:     ${sign} (${sign === 0 ? "positive" : "negative"})`,
          `  Exponent: ${exponent} (biased), ${exponent - 127} (unbiased)`,
          `  Mantissa: 0x${mantissa.toString(16).padStart(6, "0")} (${mantissa})`,
          "",
          `Formula: ${sign === 0 ? "" : "-"}1.${mantissa.toString(2).padStart(23, "0")} × 2^${exponent - 127}`,
        ].join("\n");
      }

      view.setFloat64(0, num);
      const hi = view.getUint32(0);
      const lo = view.getUint32(4);
      const sign = (hi >>> 31) & 1;
      const exponent = (hi >>> 20) & 0x7ff;
      const mantissaHi = hi & 0xfffff;

      return [
        `Number: ${num}`,
        "",
        "64-bit IEEE 754:",
        `  Hex: 0x${hi.toString(16).toUpperCase().padStart(8, "0")}${lo.toString(16).toUpperCase().padStart(8, "0")}`,
        "",
        "Components:",
        `  Sign:     ${sign} (${sign === 0 ? "positive" : "negative"})`,
        `  Exponent: ${exponent} (biased), ${exponent - 1023} (unbiased)`,
        `  Mantissa: 0x${mantissaHi.toString(16).padStart(5, "0")}${lo.toString(16).padStart(8, "0")}`,
      ].join("\n");
    },
  },
  {
    slug: "endianness",
    name: "Endianness Converter",
    description: "Swap byte order (little-endian ↔ big-endian)",
    section: "numbers",
    aliases: ["byte-swap", "little-endian", "big-endian"],
    inputType: "text",
    outputType: "text",
    options: [
      {
        id: "size",
        label: "Word size",
        type: "select",
        default: "32",
        options: [
          { value: "16", label: "16-bit" },
          { value: "32", label: "32-bit" },
          { value: "64", label: "64-bit" },
        ],
      },
      {
        id: "format",
        label: "Input format",
        type: "select",
        default: "hex",
        options: [
          { value: "hex", label: "Hex" },
          { value: "decimal", label: "Decimal" },
        ],
      },
    ],
    transform: (input, opts) => {
      const str = String(input).trim().replace(/^0x/i, "");
      if (!str) return "";

      let num: bigint;
      try {
        if (opts.format === "hex") {
          num = BigInt(`0x${str}`);
        } else {
          num = BigInt(str);
        }
      } catch {
        return { type: "error", message: "Invalid number" };
      }

      const size = Number(opts.size);
      const bytes = size / 8;

      // Extract bytes
      const byteArray: bigint[] = [];
      let temp = num;
      for (let i = 0; i < bytes; i++) {
        byteArray.push(temp & 0xffn);
        temp >>= 8n;
      }

      // Reverse bytes
      const _swapped = byteArray.reduce(
        (acc, b, i) => acc | (b << BigInt(i * 8)),
        0n,
      );
      const reversed = byteArray
        .reverse()
        .reduce((acc, b, i) => acc | (b << BigInt(i * 8)), 0n);

      const hexPad = bytes * 2;

      return [
        `Input: 0x${num.toString(16).toUpperCase().padStart(hexPad, "0")}`,
        `Swapped: 0x${reversed.toString(16).toUpperCase().padStart(hexPad, "0")}`,
        "",
        `Original bytes: ${byteArray
          .reverse()
          .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
          .join(" ")}`,
        `Swapped bytes:  ${byteArray
          .reverse()
          .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
          .join(" ")}`,
        "",
        `Original decimal: ${num}`,
        `Swapped decimal:  ${reversed}`,
      ].join("\n");
    },
  },
  {
    slug: "humanize-bytes",
    name: "Humanize Bytes",
    description: "Convert between bytes and human-readable sizes (KB, MB, GB)",
    section: "numbers",
    aliases: ["bytes", "filesize", "kb", "mb", "gb"],
    inputType: "text",
    outputType: "text",
    options: [
      {
        id: "mode",
        label: "Mode",
        type: "select",
        default: "auto",
        options: [
          { value: "auto", label: "Auto-detect" },
          { value: "toHuman", label: "Bytes → Human" },
          { value: "toBytes", label: "Human → Bytes" },
        ],
      },
      {
        id: "standard",
        label: "Standard",
        type: "select",
        default: "binary",
        options: [
          { value: "binary", label: "Binary (KiB, MiB - 1024)" },
          { value: "decimal", label: "Decimal (KB, MB - 1000)" },
        ],
      },
    ],
    transform: (input, opts) => {
      const str = String(input).trim();
      if (!str) return "";

      const base = opts.standard === "binary" ? 1024 : 1000;
      const binaryUnits = ["B", "KiB", "MiB", "GiB", "TiB", "PiB"];
      const decimalUnits = ["B", "KB", "MB", "GB", "TB", "PB"];
      const units = opts.standard === "binary" ? binaryUnits : decimalUnits;

      // Try to parse as human-readable
      const humanMatch = str.match(/^([\d.]+)\s*([a-zA-Z]+)?$/);
      if (humanMatch) {
        const value = Number.parseFloat(humanMatch[1]);
        const unit = (humanMatch[2] || "B").toUpperCase().replace("I", "i");

        // Find unit index
        let unitIndex = 0;
        for (let i = 0; i < units.length; i++) {
          if (units[i].toUpperCase().replace("I", "i") === unit) {
            unitIndex = i;
            break;
          }
        }

        const bytes = Math.round(value * base ** unitIndex);

        // Show in all units
        const results = [`Bytes: ${bytes.toLocaleString()}`];
        for (let i = 1; i < units.length; i++) {
          const converted = bytes / base ** i;
          if (converted >= 0.01) {
            results.push(`${units[i]}: ${converted.toFixed(2)}`);
          }
        }

        return results.join("\n");
      }

      return { type: "error", message: "Invalid input" };
    },
    examples: [
      {
        input: "1073741824",
        output:
          "Bytes: 1,073,741,824\nKiB: 1048576.00\nMiB: 1024.00\nGiB: 1.00",
      },
    ],
  },
  {
    slug: "cidr-calculator",
    name: "CIDR / Subnet Calculator",
    description: "Calculate subnet mask, range, broadcast, and host count",
    section: "numbers",
    aliases: ["subnet", "ip-range", "netmask"],
    inputType: "text",
    outputType: "text",
    inputPlaceholder: "Enter CIDR (e.g., 192.168.1.0/24)...",
    transform: (input) => {
      const str = String(input).trim();
      if (!str) return "";

      const match = str.match(/^(\d+\.\d+\.\d+\.\d+)\/(\d+)$/);
      if (!match) {
        return {
          type: "error",
          message: "Invalid CIDR notation (e.g., 192.168.1.0/24)",
        };
      }

      const [, ip, prefixStr] = match;
      const prefix = Number.parseInt(prefixStr, 10);

      if (prefix < 0 || prefix > 32) {
        return { type: "error", message: "Prefix must be 0-32" };
      }

      const ipParts = ip.split(".").map(Number);
      if (ipParts.some((p) => p < 0 || p > 255)) {
        return { type: "error", message: "Invalid IP address" };
      }

      const ipNum =
        (ipParts[0] << 24) +
        (ipParts[1] << 16) +
        (ipParts[2] << 8) +
        ipParts[3];
      const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
      const network = (ipNum & mask) >>> 0;
      const broadcast = (network | (~mask >>> 0)) >>> 0;
      const hostMin = prefix < 31 ? network + 1 : network;
      const hostMax = prefix < 31 ? broadcast - 1 : broadcast;
      const hostCount =
        prefix < 31 ? broadcast - network - 1 : prefix === 31 ? 2 : 1;

      const toIp = (n: number) =>
        [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff].join(
          ".",
        );

      const toBinary = (n: number) =>
        [
          ((n >>> 24) & 0xff).toString(2).padStart(8, "0"),
          ((n >>> 16) & 0xff).toString(2).padStart(8, "0"),
          ((n >>> 8) & 0xff).toString(2).padStart(8, "0"),
          (n & 0xff).toString(2).padStart(8, "0"),
        ].join(".");

      return [
        `CIDR: ${str}`,
        "",
        `Network: ${toIp(network)}`,
        `Broadcast: ${toIp(broadcast)}`,
        `Subnet mask: ${toIp(mask)}`,
        `Wildcard: ${toIp(~mask >>> 0)}`,
        "",
        `Host range: ${toIp(hostMin)} - ${toIp(hostMax)}`,
        `Usable hosts: ${hostCount.toLocaleString()}`,
        `Total addresses: ${(2 ** (32 - prefix)).toLocaleString()}`,
        "",
        `Network (binary): ${toBinary(network)}`,
        `Mask (binary): ${toBinary(mask)}`,
      ].join("\n");
    },
  },
  {
    slug: "ip-integer",
    name: "IP ↔ Integer",
    description: "Convert between IPv4 dotted quad and 32-bit integer",
    section: "numbers",
    aliases: ["ip-to-int", "int-to-ip"],
    inputType: "text",
    outputType: "text",
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
    transform: (input, opts) => {
      const str = String(input).trim();
      if (!str) return "";

      const isIp = /^\d+\.\d+\.\d+\.\d+$/.test(str);
      const mode = opts.mode === "auto" ? (isIp ? "toInt" : "toIp") : opts.mode;

      if (mode === "toInt") {
        const parts = str.split(".").map(Number);
        if (parts.length !== 4 || parts.some((p) => p < 0 || p > 255)) {
          return { type: "error", message: "Invalid IP address" };
        }
        const num =
          ((parts[0] << 24) + (parts[1] << 16) + (parts[2] << 8) + parts[3]) >>>
          0;
        return [
          `IP: ${str}`,
          `Integer: ${num}`,
          `Hex: 0x${num.toString(16).toUpperCase().padStart(8, "0")}`,
          `Binary: ${num.toString(2).padStart(32, "0")}`,
        ].join("\n");
      }

      const num = Number.parseInt(str, 10);
      if (Number.isNaN(num) || num < 0 || num > 0xffffffff) {
        return {
          type: "error",
          message: "Invalid integer (must be 0-4294967295)",
        };
      }
      const ip = [
        (num >>> 24) & 0xff,
        (num >>> 16) & 0xff,
        (num >>> 8) & 0xff,
        num & 0xff,
      ].join(".");

      return [
        `Integer: ${num}`,
        `IP: ${ip}`,
        `Hex: 0x${num.toString(16).toUpperCase().padStart(8, "0")}`,
      ].join("\n");
    },
  },
  {
    slug: "ipv6-format",
    name: "IPv6 Expand / Compress",
    description: "Expand or compress IPv6 addresses",
    section: "numbers",
    aliases: ["ipv6", "expand-ipv6", "compress-ipv6"],
    inputType: "text",
    outputType: "text",
    options: [
      {
        id: "mode",
        label: "Mode",
        type: "select",
        default: "expand",
        options: [
          { value: "expand", label: "Expand (full form)" },
          { value: "compress", label: "Compress (short form)" },
        ],
      },
    ],
    transform: (input, opts) => {
      const str = String(input).trim();
      if (!str) return "";

      // Parse IPv6
      let groups: string[];
      if (str.includes("::")) {
        const [left, right] = str.split("::");
        const leftGroups = left ? left.split(":") : [];
        const rightGroups = right ? right.split(":") : [];
        const missing = 8 - leftGroups.length - rightGroups.length;
        groups = [...leftGroups, ...Array(missing).fill("0"), ...rightGroups];
      } else {
        groups = str.split(":");
      }

      if (groups.length !== 8) {
        return { type: "error", message: "Invalid IPv6 address" };
      }

      // Expand each group to 4 hex digits
      const expanded = groups.map((g) => g.padStart(4, "0"));

      if (opts.mode === "expand") {
        return expanded.join(":");
      }

      // Compress: remove leading zeros and find longest run of zeros
      const compressed = expanded.map((g) => g.replace(/^0+/, "") || "0");

      // Find longest run of zero groups
      let bestStart = -1;
      let bestLen = 0;
      let currentStart = -1;
      let currentLen = 0;

      for (let i = 0; i < compressed.length; i++) {
        if (compressed[i] === "0") {
          if (currentStart === -1) currentStart = i;
          currentLen++;
        } else {
          if (currentLen > bestLen) {
            bestStart = currentStart;
            bestLen = currentLen;
          }
          currentStart = -1;
          currentLen = 0;
        }
      }
      if (currentLen > bestLen) {
        bestStart = currentStart;
        bestLen = currentLen;
      }

      if (bestLen > 1) {
        const before = compressed.slice(0, bestStart).join(":");
        const after = compressed.slice(bestStart + bestLen).join(":");
        return `${before}::${after}`;
      }

      return compressed.join(":");
    },
  },
  {
    slug: "percentage",
    name: "Percentage Calculator",
    description: "Calculate percentages, percent change, and ratios",
    section: "numbers",
    aliases: ["percent", "ratio"],
    inputType: "text",
    outputType: "text",
    inputPlaceholder: "Enter two numbers (one per line)...",
    options: [
      {
        id: "mode",
        label: "Calculation",
        type: "select",
        default: "of",
        options: [
          { value: "of", label: "X% of Y" },
          { value: "is", label: "X is what % of Y" },
          { value: "change", label: "Percent change from X to Y" },
          { value: "increase", label: "Increase X by Y%" },
        ],
      },
    ],
    transform: (input, opts) => {
      const lines = String(input)
        .trim()
        .split("\n")
        .map((l) => Number.parseFloat(l.trim()));
      if (lines.length < 2 || lines.some(Number.isNaN)) {
        return { type: "error", message: "Enter two numbers, one per line" };
      }

      const [x, y] = lines;

      switch (opts.mode) {
        case "of":
          return `${x}% of ${y} = ${((x / 100) * y).toFixed(4)}`;
        case "is":
          if (y === 0)
            return { type: "error", message: "Cannot divide by zero" };
          return `${x} is ${((x / y) * 100).toFixed(4)}% of ${y}`;
        case "change": {
          if (x === 0)
            return {
              type: "error",
              message: "Cannot calculate change from zero",
            };
          const change = ((y - x) / Math.abs(x)) * 100;
          return `Change from ${x} to ${y} = ${change >= 0 ? "+" : ""}${change.toFixed(4)}%`;
        }
        case "increase":
          return `${x} increased by ${y}% = ${x * (1 + y / 100)}`;
        default:
          return "";
      }
    },
  },
];

// Helper functions
const BASE62_CHARS =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function toBase62(num: bigint): string {
  if (num === 0n) return "0";
  let result = "";
  while (num > 0n) {
    result = BASE62_CHARS[Number(num % 62n)] + result;
    num = num / 62n;
  }
  return result;
}

function fromBase62(str: string): bigint {
  let result = 0n;
  for (const char of str) {
    const index = BASE62_CHARS.indexOf(char);
    if (index === -1) throw new Error("Invalid base62 character");
    result = result * 62n + BigInt(index);
  }
  return result;
}
