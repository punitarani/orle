declare module "prettier/parser-babel" {
  const parser: unknown;
  export = parser;
}

declare module "prettier/parser-html" {
  const parser: unknown;
  export = parser;
}

declare module "prettier/parser-markdown" {
  const parser: unknown;
  export = parser;
}

declare module "prettier/parser-postcss" {
  const parser: unknown;
  export = parser;
}

declare module "prettier/parser-typescript" {
  const parser: unknown;
  export = parser;
}

declare module "culori" {
  export const converter: (...args: unknown[]) => unknown;
  export const formatHex: (...args: unknown[]) => unknown;
  export const formatRgb: (...args: unknown[]) => unknown;
  export const parse: (...args: unknown[]) => unknown;
  export const wcagContrast: (...args: unknown[]) => unknown;
}

declare module "papaparse" {
  const Papa: unknown;
  export default Papa;
}

declare module "turndown" {
  const TurndownService: unknown;
  export default TurndownService;
}
