type PrettierPlugin = import("prettier").Plugin;

declare module "prettier/parser-babel" {
  const plugin: PrettierPlugin;
  export = plugin;
}

declare module "prettier/parser-html" {
  const plugin: PrettierPlugin;
  export = plugin;
}

declare module "prettier/parser-markdown" {
  const plugin: PrettierPlugin;
  export = plugin;
}

declare module "prettier/parser-postcss" {
  const plugin: PrettierPlugin;
  export = plugin;
}

declare module "prettier/parser-typescript" {
  const plugin: PrettierPlugin;
  export = plugin;
}

declare module "culori" {
  type Color = Record<string, unknown>;
  export const converter: (
    mode: string,
  ) => (color: unknown) => Color | null | undefined;
  export const formatHex: (color: unknown) => string;
  export const formatRgb: (color: unknown) => string;
  export const parse: (input: string) => Color | null | undefined;
  export const wcagContrast: (a: unknown, b: unknown) => number;
}

declare module "papaparse" {
  export type ParseError = { message: string };
  export type ParseResult = { data: unknown; errors: ParseError[] };
  export function parse(
    input: string,
    config?: { header?: boolean; delimiter?: string; skipEmptyLines?: boolean },
  ): ParseResult;
  export function unparse(
    input: unknown,
    config?: { delimiter?: string; header?: boolean },
  ): string;
  const Papa: {
    parse: typeof parse;
    unparse: typeof unparse;
  };
  export default Papa;
}

declare module "turndown" {
  export default class TurndownService {
    turndown(html: string): string;
  }
}
