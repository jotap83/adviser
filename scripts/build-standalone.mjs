import { build } from "vite";
import fs from "node:fs/promises";
const results = await build({
  base: "./",
  build: {
    write: false,
    assetsInlineLimit: 10000000,
    cssCodeSplit: false,
    rolldownOptions: { output: { codeSplitting: false } },
  },
});
const output = (Array.isArray(results) ? results : [results]).flatMap(
  (r) => r.output,
);
const js = output.filter((x) => x.type === "chunk");
if (js.length !== 1) throw new Error("Expected a single self-contained script");
const css = output
  .filter((x) => x.type === "asset" && x.fileName.endsWith(".css"))
  .map((x) => x.source)
  .join("\n");
const diagram = await fs.readFile("public/fluxo.svg", "utf8");
const script = (
  "window.adviserDiagramUrl=URL.createObjectURL(new Blob([" +
  JSON.stringify(diagram) +
  '],{type:"image/svg+xml"}));' +
  js[0].code
).replaceAll("</script", "<\\/script");
const icon =
  "data:image/svg+xml;base64," +
  Buffer.from(await fs.readFile("public/favicon.svg")).toString("base64");
const html = `<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Adviser · Protótipo navegável</title><link rel="icon" href="${icon}"><style>${css}</style></head><body><div id="root"></div><script type="module">${script}</script></body></html>`;
await fs.mkdir("standalone", { recursive: true });
await fs.writeFile("standalone/adviser-prototipo.html", html);
console.log(
  `Standalone created: ${Math.round(Buffer.byteLength(html) / 1024)} KB`,
);
