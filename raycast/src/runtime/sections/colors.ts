import { converter, formatHex, formatRgb, parse, wcagContrast } from "culori";
import type { ToolDefinition } from "../types";

const toRgb = converter("rgb");
const toHsl = converter("hsl");
const toHsv = converter("hsv");
const toLab = converter("lab");
const toLch = converter("lch");

export const colorTools: ToolDefinition[] = [
  {
    slug: "color-suite",
    name: "Color & CSS Suite",
    description: "Convert colors, compute contrast, generate palettes",
    section: "colors",
    aliases: ["color", "contrast", "css"],
    inputType: "text",
    outputType: "text",
    runPolicy: "manual",
    options: [
      {
        id: "mode",
        label: "Mode",
        type: "select",
        default: "color-convert",
        options: [
          { value: "color-convert", label: "Convert color" },
          { value: "contrast", label: "Contrast ratio" },
          { value: "lighten", label: "Lighten/Darken" },
          { value: "accessible-text", label: "Accessible text color" },
          { value: "blend", label: "Alpha blend" },
        ],
      },
      {
        id: "color2",
        label: "Second color",
        type: "text",
        default: "#ffffff",
        visibleWhen: { optionId: "mode", equals: ["contrast", "blend"] },
      },
      {
        id: "amount",
        label: "Amount (0-1)",
        type: "number",
        default: 0.1,
        min: -1,
        max: 1,
        visibleWhen: { optionId: "mode", equals: "lighten" },
      },
      {
        id: "minContrast",
        label: "Min contrast",
        type: "number",
        default: 4.5,
        min: 1,
        max: 21,
        visibleWhen: { optionId: "mode", equals: "accessible-text" },
      },
      {
        id: "blendAlpha",
        label: "Overlay alpha (0-1)",
        type: "number",
        default: 0.5,
        min: 0,
        max: 1,
        visibleWhen: { optionId: "mode", equals: "blend" },
      },
    ],
    transform: (input, opts) => {
      const text = String(input ?? "").trim();
      const mode = String(opts.mode);
      if (!text) return "";

      if (mode === "contrast") {
        const color1 = parse(text);
        const color2 = parse(String(opts.color2 || ""));
        if (!color1 || !color2) {
          return { type: "error", message: "Invalid colors" };
        }
        const ratio = wcagContrast(color1, color2).toFixed(2);
        return `Contrast ratio: ${ratio}:1`;
      }

      if (mode === "lighten") {
        const color = parse(text);
        if (!color) return { type: "error", message: "Invalid color" };
        const rgb = toRgb(color);
        if (!rgb) return { type: "error", message: "Unsupported color" };
        const amount = Number(opts.amount) || 0;
        const adjust = (channel: number) =>
          Math.min(1, Math.max(0, channel + amount));
        const adjusted = {
          r: adjust(rgb.r),
          g: adjust(rgb.g),
          b: adjust(rgb.b),
          mode: "rgb",
        };
        return formatHex(adjusted);
      }

      if (mode === "accessible-text") {
        const background = parse(text);
        if (!background) return { type: "error", message: "Invalid color" };
        const black = parse("#000000");
        const white = parse("#ffffff");
        if (!black || !white)
          return { type: "error", message: "Color parse failed" };
        const contrastBlack = wcagContrast(background, black);
        const contrastWhite = wcagContrast(background, white);
        const minContrast = Number(opts.minContrast) || 4.5;
        const recommended =
          contrastBlack >= minContrast || contrastBlack >= contrastWhite
            ? "#000000"
            : "#ffffff";
        return [
          `Recommended: ${recommended}`,
          `Contrast vs black: ${contrastBlack.toFixed(2)}:1`,
          `Contrast vs white: ${contrastWhite.toFixed(2)}:1`,
        ].join("\n");
      }

      if (mode === "blend") {
        const base = parse(text);
        const overlay = parse(String(opts.color2 || ""));
        if (!base || !overlay)
          return { type: "error", message: "Invalid colors" };
        const baseRgb = toRgb(base);
        const overlayRgb = toRgb(overlay);
        if (!baseRgb || !overlayRgb)
          return { type: "error", message: "Unsupported colors" };
        const alpha = Math.min(1, Math.max(0, Number(opts.blendAlpha) || 0));
        const blended = {
          mode: "rgb",
          r: baseRgb.r * (1 - alpha) + overlayRgb.r * alpha,
          g: baseRgb.g * (1 - alpha) + overlayRgb.g * alpha,
          b: baseRgb.b * (1 - alpha) + overlayRgb.b * alpha,
        };
        return formatHex(blended);
      }

      const color = parse(text);
      if (!color) return { type: "error", message: "Invalid color" };
      const rgb = toRgb(color);
      const hsl = toHsl(color);
      const hsv = toHsv(color);
      const lab = toLab(color);
      const lch = toLch(color);
      if (!rgb || !hsl || !hsv || !lab || !lch) {
        return { type: "error", message: "Unsupported color" };
      }
      return [
        `HEX: ${formatHex(color)}`,
        `RGB: ${formatRgb(rgb)}`,
        `HSL: ${formatChannels([hsl.h, hsl.s, hsl.l])}`,
        `HSV: ${formatChannels([hsv.h, hsv.s, hsv.v])}`,
        `LAB: ${formatChannels([lab.l, lab.a, lab.b])}`,
        `LCH: ${formatChannels([lch.l, lch.c, lch.h])}`,
      ].join("\n");
    },
  },
];

function formatChannels(channels: Array<number | undefined>): string {
  return channels
    .map((value) => (value === undefined ? "n/a" : value.toFixed(2)))
    .join(", ");
}
