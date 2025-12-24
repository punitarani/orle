import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { PRESETS } from "../src/lib/tools/presets";
import { base64Tools } from "../src/lib/tools/sections/base64";
import { codeTools } from "../src/lib/tools/sections/code";
import { colorTools } from "../src/lib/tools/sections/colors";
import { cryptoTools } from "../src/lib/tools/sections/crypto";
import { dataTools } from "../src/lib/tools/sections/data";
import { datetimeTools } from "../src/lib/tools/sections/datetime";
import { diffTools } from "../src/lib/tools/sections/diff";
import { encodingTools } from "../src/lib/tools/sections/encoding";
import { formatTools } from "../src/lib/tools/sections/formats";
import { httpTools } from "../src/lib/tools/sections/http";
import { idTools } from "../src/lib/tools/sections/ids";
import { imageTools } from "../src/lib/tools/sections/images";
import { markdownTools } from "../src/lib/tools/sections/markdown";
import { numberTools } from "../src/lib/tools/sections/numbers";
import { regexTools } from "../src/lib/tools/sections/regex";
import { textTools } from "../src/lib/tools/sections/text";

const tools = [
  ...encodingTools,
  ...base64Tools,
  ...textTools,
  ...formatTools,
  ...diffTools,
  ...cryptoTools,
  ...idTools,
  ...datetimeTools,
  ...numberTools,
  ...httpTools,
  ...imageTools,
  ...colorTools,
  ...codeTools,
  ...regexTools,
  ...dataTools,
  ...markdownTools,
];

const toolMeta = tools.map((tool) => ({
  slug: tool.slug,
  name: tool.name,
  description: tool.description,
  section: tool.section,
  aliases: tool.aliases,
  inputType: tool.inputType,
  outputType: tool.outputType,
  options: tool.options,
  inputPlaceholder: tool.inputPlaceholder,
  outputPlaceholder: tool.outputPlaceholder,
  allowSwap: tool.allowSwap,
  acceptsFile: tool.acceptsFile,
  fileAccept: tool.fileAccept,
  runPolicy: tool.runPolicy,
  debounceMs: tool.debounceMs,
}));

const mergedMeta = [...toolMeta, ...PRESETS].filter((tool, index, arr) => {
  return arr.findIndex((item) => item.slug === tool.slug) === index;
});

const outputPath = resolve(process.cwd(), "src/lib/tools/tools.generated.json");

await writeFile(outputPath, `${JSON.stringify(mergedMeta, null, 2)}\n`, "utf8");
console.log(`Wrote ${mergedMeta.length} tools to ${outputPath}`);
