import type { ColorResultData, ToolDefinition } from "../types";

export const colorTools: ToolDefinition[] = [
  {
    slug: "color-converter",
    name: "Color Converter",
    description: "Convert between HEX, RGB, HSL, and HSV",
    section: "colors",
    aliases: ["hex", "rgb", "hsl", "hsv", "color"],
    inputType: "text",
    outputType: "color",
    inputPlaceholder: "Enter color (#fff, rgb(255,255,255), hsl(0,0%,100%))...",
    transform: (input) => {
      const str = String(input).trim();
      if (!str) return "";

      const color = parseColor(str);
      if (!color) {
        return { type: "error", message: "Invalid color format" };
      }

      const { r, g, b } = color;
      const hex = rgbToHex(r, g, b);
      const hsl = rgbToHsl(r, g, b);
      const hsv = rgbToHsv(r, g, b);

      const textOutput = [
        `HEX: ${hex}`,
        `RGB: rgb(${r}, ${g}, ${b})`,
        `RGBA: rgba(${r}, ${g}, ${b}, 1)`,
        `HSL: hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
        `HSLA: hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, 1)`,
        `HSV: hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)`,
        "",
        "CSS Variables:",
        `  --color: ${hex};`,
        `  --color-rgb: ${r} ${g} ${b};`,
        `  --color-hsl: ${hsl.h} ${hsl.s}% ${hsl.l}%;`,
      ].join("\n");

      const result: ColorResultData = {
        type: "color",
        hex,
        rgb: { r, g, b },
        hsl: { h: hsl.h, s: hsl.s, l: hsl.l },
        textOutput,
        preview: {
          type: "swatch",
          colors: [hex],
        },
      };

      return result;
    },
  },
  {
    slug: "contrast-checker",
    name: "Contrast Checker (WCAG)",
    description: "Check color contrast ratio for accessibility",
    section: "colors",
    aliases: ["wcag", "accessibility", "a11y"],
    inputType: "text",
    outputType: "color",
    inputPlaceholder: "#000000\n#ffffff",
    transform: (input) => {
      const str = String(input);
      const parts = str.split(/---SEPARATOR---|\n---\n|\n/).filter(Boolean);
      if (parts.length < 2) {
        return {
          type: "error",
          message: "Enter two colors (one per line)",
        };
      }

      const color1 = parseColor(parts[0].trim());
      const color2 = parseColor(parts[1].trim());

      if (!color1 || !color2) {
        return { type: "error", message: "Invalid color format" };
      }

      const hex1 = rgbToHex(color1.r, color1.g, color1.b);
      const hex2 = rgbToHex(color2.r, color2.g, color2.b);

      const l1 = relativeLuminance(color1.r, color1.g, color1.b);
      const l2 = relativeLuminance(color2.r, color2.g, color2.b);
      const ratio = contrastRatio(l1, l2);

      const passAALarge = ratio >= 3;
      const passAANormal = ratio >= 4.5;
      const passAAALarge = ratio >= 4.5;
      const passAAANormal = ratio >= 7;

      const textOutput = [
        `Color 1: ${hex1}`,
        `Color 2: ${hex2}`,
        "",
        `Contrast Ratio: ${ratio.toFixed(2)}:1`,
        "",
        "WCAG 2.1 Compliance:",
        `  AA Large Text (3:1):    ${passAALarge ? "✓ Pass" : "✗ Fail"}`,
        `  AA Normal Text (4.5:1): ${passAANormal ? "✓ Pass" : "✗ Fail"}`,
        `  AAA Large Text (4.5:1): ${passAAALarge ? "✓ Pass" : "✗ Fail"}`,
        `  AAA Normal Text (7:1):  ${passAAANormal ? "✓ Pass" : "✗ Fail"}`,
      ].join("\n");

      const hsl1 = rgbToHsl(color1.r, color1.g, color1.b);

      const result: ColorResultData = {
        type: "color",
        hex: hex1,
        rgb: { r: color1.r, g: color1.g, b: color1.b },
        hsl: { h: hsl1.h, s: hsl1.s, l: hsl1.l },
        textOutput,
        preview: {
          type: "contrast",
          colors: [hex1, hex2],
        },
      };

      return result;
    },
  },
  {
    slug: "css-variables",
    name: "Generate CSS Variables",
    description: "Generate CSS custom properties from a color palette",
    section: "colors",
    aliases: ["css-vars", "palette-css"],
    inputType: "text",
    outputType: "text",
    inputPlaceholder:
      "Enter colors (one per line):\n#3b82f6 primary\n#10b981 success",
    transform: (input) => {
      const str = String(input).trim();
      if (!str) return "";

      const lines = str.split("\n").filter(Boolean);
      const vars: string[] = [":root {"];

      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const colorStr = parts[0];
        const name = parts[1] || `color-${vars.length}`;

        const color = parseColor(colorStr);
        if (!color) continue;

        const hex = rgbToHex(color.r, color.g, color.b);
        vars.push(`  --${name}: ${hex};`);
        vars.push(`  --${name}-rgb: ${color.r} ${color.g} ${color.b};`);
      }

      vars.push("}");
      return vars.join("\n");
    },
  },
  {
    slug: "gradient-generator",
    name: "Gradient Generator",
    description: "Generate CSS linear and radial gradients",
    section: "colors",
    aliases: ["linear-gradient", "radial-gradient"],
    inputType: "text",
    outputType: "color",
    inputPlaceholder: "Enter colors (one per line):\n#3b82f6\n#8b5cf6",
    options: [
      {
        id: "type",
        label: "Type",
        type: "select",
        default: "linear",
        options: [
          { value: "linear", label: "Linear" },
          { value: "radial", label: "Radial" },
        ],
      },
      {
        id: "angle",
        label: "Angle (deg)",
        type: "number",
        default: 90,
        min: 0,
        max: 360,
      },
    ],
    transform: (input, opts) => {
      const str = String(input).trim();
      if (!str) return "";

      const colors = str
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .map((c) => {
          const color = parseColor(c);
          return color ? rgbToHex(color.r, color.g, color.b) : c;
        });

      if (colors.length < 2) {
        return { type: "error", message: "Need at least 2 colors" };
      }

      const colorList = colors.join(", ");
      const gradientType = String(opts.type);
      const angle = Number(opts.angle);

      let gradient: string;
      if (gradientType === "radial") {
        gradient = `radial-gradient(circle, ${colorList})`;
      } else {
        gradient = `linear-gradient(${angle}deg, ${colorList})`;
      }

      const textOutput = [
        "CSS Gradient:",
        `  background: ${gradient};`,
        "",
        "Individual colors:",
        ...colors.map((c, i) => `  ${i + 1}. ${c}`),
      ].join("\n");

      // Get first color for ColorResultData compatibility
      const firstColor = parseColor(colors[0]) || { r: 0, g: 0, b: 0 };
      const hsl = rgbToHsl(firstColor.r, firstColor.g, firstColor.b);

      const result: ColorResultData = {
        type: "color",
        hex: colors[0],
        rgb: { r: firstColor.r, g: firstColor.g, b: firstColor.b },
        hsl: { h: hsl.h, s: hsl.s, l: hsl.l },
        textOutput,
        preview: {
          type: "gradient",
          colors,
          css: gradient,
        },
      };

      return result;
    },
  },
  {
    slug: "box-shadow",
    name: "Box Shadow Generator",
    description: "Generate CSS box-shadow with visual preview",
    section: "colors",
    aliases: ["shadow", "css-shadow"],
    inputType: "none",
    outputType: "text",
    options: [
      {
        id: "x",
        label: "X offset",
        type: "number",
        default: 0,
        min: -100,
        max: 100,
      },
      {
        id: "y",
        label: "Y offset",
        type: "number",
        default: 4,
        min: -100,
        max: 100,
      },
      {
        id: "blur",
        label: "Blur",
        type: "number",
        default: 6,
        min: 0,
        max: 100,
      },
      {
        id: "spread",
        label: "Spread",
        type: "number",
        default: 0,
        min: -100,
        max: 100,
      },
      {
        id: "color",
        label: "Color",
        type: "text",
        default: "rgba(0, 0, 0, 0.1)",
      },
      { id: "inset", label: "Inset", type: "toggle", default: false },
    ],
    transform: (_, opts) => {
      const x = Number(opts.x);
      const y = Number(opts.y);
      const blur = Number(opts.blur);
      const spread = Number(opts.spread);
      const color = String(opts.color);
      const inset = opts.inset ? "inset " : "";

      const shadow = `${inset}${x}px ${y}px ${blur}px ${spread}px ${color}`;

      return [
        "/* Box Shadow */",
        `box-shadow: ${shadow};`,
        "",
        "/* Multiple shadows */",
        `box-shadow: ${shadow}, ${inset}0 1px 2px rgba(0, 0, 0, 0.05);`,
        "",
        "/* Tailwind */",
        `shadow-[${x}px_${y}px_${blur}px_${spread}px_${color.replace(/\s/g, "_")}]`,
      ].join("\n");
    },
  },
  {
    slug: "border-radius",
    name: "Border Radius Generator",
    description: "Generate CSS border-radius with per-corner control",
    section: "colors",
    aliases: ["rounded", "corners"],
    inputType: "none",
    outputType: "text",
    options: [
      {
        id: "topLeft",
        label: "Top Left",
        type: "number",
        default: 8,
        min: 0,
        max: 100,
      },
      {
        id: "topRight",
        label: "Top Right",
        type: "number",
        default: 8,
        min: 0,
        max: 100,
      },
      {
        id: "bottomRight",
        label: "Bottom Right",
        type: "number",
        default: 8,
        min: 0,
        max: 100,
      },
      {
        id: "bottomLeft",
        label: "Bottom Left",
        type: "number",
        default: 8,
        min: 0,
        max: 100,
      },
      {
        id: "unit",
        label: "Unit",
        type: "select",
        default: "px",
        options: [
          { value: "px", label: "px" },
          { value: "%", label: "%" },
          { value: "rem", label: "rem" },
        ],
      },
    ],
    transform: (_, opts) => {
      const tl = Number(opts.topLeft);
      const tr = Number(opts.topRight);
      const br = Number(opts.bottomRight);
      const bl = Number(opts.bottomLeft);
      const unit = String(opts.unit);

      const allSame = tl === tr && tr === br && br === bl;

      const results = ["/* Border Radius */"];

      if (allSame) {
        results.push(`border-radius: ${tl}${unit};`);
      } else {
        results.push(
          `border-radius: ${tl}${unit} ${tr}${unit} ${br}${unit} ${bl}${unit};`,
        );
      }

      results.push("", "/* Individual corners */");
      results.push(`border-top-left-radius: ${tl}${unit};`);
      results.push(`border-top-right-radius: ${tr}${unit};`);
      results.push(`border-bottom-right-radius: ${br}${unit};`);
      results.push(`border-bottom-left-radius: ${bl}${unit};`);

      return results.join("\n");
    },
  },
  {
    slug: "clamp-calculator",
    name: "CSS Clamp Calculator",
    description: "Generate fluid typography with clamp()",
    section: "colors",
    aliases: ["fluid-type", "responsive-font"],
    inputType: "none",
    outputType: "text",
    options: [
      {
        id: "minSize",
        label: "Min size (rem)",
        type: "number",
        default: 1,
        min: 0.5,
        max: 10,
        step: 0.125,
      },
      {
        id: "maxSize",
        label: "Max size (rem)",
        type: "number",
        default: 2,
        min: 0.5,
        max: 10,
        step: 0.125,
      },
      {
        id: "minVw",
        label: "Min viewport (px)",
        type: "number",
        default: 320,
        min: 200,
        max: 1000,
      },
      {
        id: "maxVw",
        label: "Max viewport (px)",
        type: "number",
        default: 1200,
        min: 500,
        max: 2000,
      },
    ],
    transform: (_, opts) => {
      const minSize = Number(opts.minSize);
      const maxSize = Number(opts.maxSize);
      const minVw = Number(opts.minVw);
      const maxVw = Number(opts.maxVw);

      // Calculate the slope and intersection
      const slope = (maxSize - minSize) / (maxVw - minVw);
      const intersection = minSize - slope * minVw;

      // Convert to vw and rem
      const slopeVw = (slope * 100).toFixed(4);
      const intersectionRem = intersection.toFixed(4);

      const clampValue = `clamp(${minSize}rem, ${intersectionRem}rem + ${slopeVw}vw, ${maxSize}rem)`;

      return [
        "/* Fluid Typography */",
        `font-size: ${clampValue};`,
        "",
        "/* Breakdown */",
        `  Min: ${minSize}rem at ${minVw}px viewport`,
        `  Max: ${maxSize}rem at ${maxVw}px viewport`,
        `  Slope: ${slopeVw}vw`,
        `  Intersection: ${intersectionRem}rem`,
        "",
        "/* Usage */",
        ".heading {",
        `  font-size: ${clampValue};`,
        "}",
      ].join("\n");
    },
  },
  {
    slug: "rem-px",
    name: "REM ↔ PX Converter",
    description: "Convert between rem and pixels",
    section: "colors",
    aliases: ["px-to-rem", "rem-to-px"],
    inputType: "text",
    outputType: "text",
    inputPlaceholder: "Enter value (e.g., 16px or 1rem)...",
    options: [
      {
        id: "base",
        label: "Base font size (px)",
        type: "number",
        default: 16,
        min: 8,
        max: 24,
      },
    ],
    transform: (input, opts) => {
      const str = String(input).trim();
      if (!str) return "";

      const base = Number(opts.base) || 16;
      const values = str.split(/[\s,]+/).filter(Boolean);

      const results = values.map((v) => {
        const match = v.match(/^([\d.]+)(px|rem)?$/i);
        if (!match) return `${v}: Invalid`;

        const num = Number.parseFloat(match[1]);
        const unit = (match[2] || "").toLowerCase();

        if (unit === "rem") {
          const px = num * base;
          return `${num}rem = ${px}px`;
        }

        const rem = num / base;
        return `${num}px = ${rem.toFixed(4)}rem`;
      });

      return [`Base: ${base}px`, "", ...results].join("\n");
    },
  },
  {
    slug: "viewport-units",
    name: "Viewport Unit Helper",
    description: "Calculate vh/vw for specific viewport sizes",
    section: "colors",
    aliases: ["vh", "vw", "viewport"],
    inputType: "text",
    outputType: "text",
    inputPlaceholder: "Enter size in vh/vw (e.g., 50vh)...",
    options: [
      {
        id: "viewportWidth",
        label: "Viewport width (px)",
        type: "number",
        default: 1920,
        min: 320,
        max: 3840,
      },
      {
        id: "viewportHeight",
        label: "Viewport height (px)",
        type: "number",
        default: 1080,
        min: 320,
        max: 2160,
      },
    ],
    transform: (input, opts) => {
      const str = String(input).trim();
      const vw = Number(opts.viewportWidth);
      const vh = Number(opts.viewportHeight);

      if (!str) {
        return [
          `Viewport: ${vw}×${vh}px`,
          "",
          `1vw = ${(vw / 100).toFixed(2)}px`,
          `1vh = ${(vh / 100).toFixed(2)}px`,
          `1vmin = ${(Math.min(vw, vh) / 100).toFixed(2)}px`,
          `1vmax = ${(Math.max(vw, vh) / 100).toFixed(2)}px`,
        ].join("\n");
      }

      const values = str.split(/[\s,]+/).filter(Boolean);
      const results = values.map((v) => {
        const match = v.match(/^([\d.]+)(vh|vw|vmin|vmax)?$/i);
        if (!match) return `${v}: Invalid`;

        const num = Number.parseFloat(match[1]);
        const unit = (match[2] || "vw").toLowerCase();

        let px: number;
        switch (unit) {
          case "vw":
            px = (num / 100) * vw;
            break;
          case "vh":
            px = (num / 100) * vh;
            break;
          case "vmin":
            px = (num / 100) * Math.min(vw, vh);
            break;
          case "vmax":
            px = (num / 100) * Math.max(vw, vh);
            break;
          default:
            px = 0;
        }

        return `${num}${unit} = ${px.toFixed(2)}px`;
      });

      return [`Viewport: ${vw}×${vh}px`, "", ...results].join("\n");
    },
  },
  {
    slug: "color-blend",
    name: "Color Blender / Mixer",
    description: "Mix two colors with adjustable ratio",
    section: "colors",
    aliases: ["mix-colors", "blend"],
    inputType: "text",
    outputType: "text",
    inputPlaceholder: "#ff0000\n---SEPARATOR---\n#0000ff",
    options: [
      {
        id: "ratio",
        label: "Mix ratio (%)",
        type: "number",
        default: 50,
        min: 0,
        max: 100,
      },
      {
        id: "steps",
        label: "Show gradient steps",
        type: "number",
        default: 5,
        min: 2,
        max: 10,
      },
    ],
    transform: (input, opts) => {
      const str = String(input);
      const parts = str.split(/---SEPARATOR---|\n---\n|\n/);
      if (parts.length < 2) {
        return { type: "error", message: "Enter two colors" };
      }

      const color1 = parseColor(parts[0].trim());
      const color2 = parseColor(parts[1].trim());

      if (!color1 || !color2) {
        return { type: "error", message: "Invalid color format" };
      }

      const ratio = Number(opts.ratio) / 100;
      const steps = Number(opts.steps);

      const blend = (c1: number, c2: number, r: number) =>
        Math.round(c1 + (c2 - c1) * r);

      const mixed = {
        r: blend(color1.r, color2.r, ratio),
        g: blend(color1.g, color2.g, ratio),
        b: blend(color1.b, color2.b, ratio),
      };

      const results = [
        `Color 1: ${rgbToHex(color1.r, color1.g, color1.b)}`,
        `Color 2: ${rgbToHex(color2.r, color2.g, color2.b)}`,
        `Ratio: ${opts.ratio}%`,
        "",
        `Mixed: ${rgbToHex(mixed.r, mixed.g, mixed.b)}`,
        `RGB: rgb(${mixed.r}, ${mixed.g}, ${mixed.b})`,
        "",
        "Gradient steps:",
      ];

      for (let i = 0; i < steps; i++) {
        const r = i / (steps - 1);
        const step = {
          r: blend(color1.r, color2.r, r),
          g: blend(color1.g, color2.g, r),
          b: blend(color1.b, color2.b, r),
        };
        results.push(
          `  ${Math.round(r * 100)}%: ${rgbToHex(step.r, step.g, step.b)}`,
        );
      }

      return results.join("\n");
    },
  },
];

// Helper functions
function parseColor(str: string): { r: number; g: number; b: number } | null {
  str = str.trim().toLowerCase();

  // Hex
  let match = str.match(/^#?([0-9a-f]{3,8})$/);
  if (match) {
    let hex = match[1];
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((c) => c + c)
        .join("");
    }
    if (hex.length >= 6) {
      return {
        r: Number.parseInt(hex.slice(0, 2), 16),
        g: Number.parseInt(hex.slice(2, 4), 16),
        b: Number.parseInt(hex.slice(4, 6), 16),
      };
    }
  }

  // RGB/RGBA
  match = str.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (match) {
    return {
      r: Math.min(255, Number.parseInt(match[1], 10)),
      g: Math.min(255, Number.parseInt(match[2], 10)),
      b: Math.min(255, Number.parseInt(match[3], 10)),
    };
  }

  // HSL
  match = str.match(/hsla?\s*\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?/);
  if (match) {
    const h = Number.parseInt(match[1], 10);
    const s = Number.parseInt(match[2], 10) / 100;
    const l = Number.parseInt(match[3], 10) / 100;
    return hslToRgb(h, s, l);
  }

  return null;
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function rgbToHsl(
  r: number,
  g: number,
  b: number,
): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l: Math.round(l * 100) };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      break;
    case g:
      h = ((b - r) / d + 2) / 6;
      break;
    case b:
      h = ((r - g) / d + 4) / 6;
      break;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function hslToRgb(
  h: number,
  s: number,
  l: number,
): { r: number; g: number; b: number } {
  h /= 360;

  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  const hue2rgb = (t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  return {
    r: Math.round(hue2rgb(h + 1 / 3) * 255),
    g: Math.round(hue2rgb(h) * 255),
    b: Math.round(hue2rgb(h - 1 / 3) * 255),
  };
}

function rgbToHsv(
  r: number,
  g: number,
  b: number,
): { h: number; s: number; v: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    v: Math.round(v * 100),
  };
}

function relativeLuminance(r: number, g: number, b: number): number {
  const toLinear = (c: number) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
