import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import PDFWorker from "pdfjs-dist/build/pdf.worker.min.mjs?worker&inline";

export async function readPDF(buffer: ArrayBuffer) {
  const worker = new PDFWorker();
  GlobalWorkerOptions.workerPort = worker;
  const task = getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
  });
  try {
    const pdf = await task.promise;
    const parts: string[] = [];
    for (let i = 1; i <= Math.min(30, pdf.numPages); i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      parts.push(
        content.items
          .map((item) =>
            "str" in item ? item.str + (item.hasEOL ? "\n" : " ") : "",
          )
          .join(""),
      );
      page.cleanup();
    }
    return { text: parts.join("\n"), truncated: pdf.numPages > 30 };
  } finally {
    await task.destroy();
    worker.terminate();
    GlobalWorkerOptions.workerPort = null;
  }
}
