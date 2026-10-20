import type { BriefingAttachment } from "./types";

const maxText = 100_000;
export async function readBriefingFile(
  file: File,
): Promise<BriefingAttachment> {
  const kind = file.name.split(".").pop()?.toLowerCase();
  if (kind !== "pdf" && kind !== "docx" && kind !== "xlsx")
    throw new Error("Escolha um PDF, DOCX ou XLSX.");
  if (file.size > 10 * 1024 * 1024)
    throw new Error(
      "Este arquivo ultrapassa 10 MB. Use uma versão menor ou cole o texto do briefing.",
    );
  const attachment: BriefingAttachment = {
    id: crypto.randomUUID(),
    name: file.name,
    size: file.size,
    kind,
    text: "",
    included: true,
    at: new Date().toISOString(),
    status: "ready",
    detail: "",
  };
  try {
    const buffer = await file.arrayBuffer();
    let text = "";
    let truncated = false;
    if (kind === "pdf") {
      const { readPDF } = await import("./read-pdf");
      const pdf = await readPDF(buffer);
      text = pdf.text;
      truncated = pdf.truncated;
    } else if (kind === "docx") {
      const { default: JSZip } = await import("jszip");
      const zip = await JSZip.loadAsync(buffer);
      const body = zip.file("word/document.xml");
      if (!body) throw new Error("Documento sem corpo de texto.");
      const xml = new DOMParser().parseFromString(
        await body.async("string"),
        "application/xml",
      );
      if (xml.querySelector("parsererror"))
        throw new Error("Não foi possível ler o documento.");
      text = Array.from(xml.getElementsByTagNameNS("*", "p"))
        .map((p) =>
          Array.from(p.getElementsByTagNameNS("*", "t"))
            .map((t) => t.textContent)
            .join(""),
        )
        .join("\n");
    } else {
      const { default: ExcelJS } = await import("exceljs");
      const book = new ExcelJS.Workbook();
      await book.xlsx.load(buffer);
      const rows: string[] = [];
      for (const sheet of book.worksheets.slice(0, 10)) {
        rows.push(`Planilha: ${sheet.name}`);
        sheet.eachRow((row, index) => {
          if (index > 1000) {
            truncated = true;
            return;
          }
          const cells: string[] = [];
          row.eachCell((cell) => {
            if (cells.length < 40) cells.push(cell.text);
          });
          rows.push(cells.join(cells.length === 2 ? ": " : " | "));
        });
      }
      truncated ||= book.worksheets.length > 10;
      text = rows.join("\n");
    }
    truncated ||= text.length > maxText;
    attachment.text = text.slice(0, maxText).trim();
    if (attachment.text.length < 20)
      throw new Error("Sem texto legível suficiente.");
    attachment.detail = truncated
      ? "Leitura parcial: limite de páginas, planilhas ou texto. Confira e complemente abaixo."
      : "Texto lido no navegador. Confira antes de analisar.";
  } catch {
    attachment.status = "manual";
    attachment.detail =
      kind === "pdf"
        ? "Não encontramos texto legível. O PDF pode ser uma imagem ou estar protegido. Cole a transcrição abaixo; OCR fica para a integração real."
        : "Não foi possível ler este arquivo. Cole seu conteúdo abaixo ou use outra versão do documento.";
  }
  return attachment;
}

// Original presentation files live in this browser only, outside localStorage.
function fileDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("adviser-demo-files", 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore("presentations");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(
        new Error(
          "Armazenamento de arquivos indisponível neste navegador. Use um link da apresentação.",
        ),
      );
  });
}
export async function savePresentationFile(id: string, file: File) {
  const db = await fileDB();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction("presentations", "readwrite");
      transaction.objectStore("presentations").put(file, id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = transaction.onabort = () =>
        reject(
          new Error(
            "Não foi possível guardar o arquivo. Use um link ou tente um arquivo menor.",
          ),
        );
    });
  } finally {
    db.close();
  }
}
export async function getPresentationFile(
  id: string,
): Promise<Blob | undefined> {
  const db = await fileDB();
  try {
    return await new Promise((resolve, reject) => {
      const request = db
        .transaction("presentations")
        .objectStore("presentations")
        .get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(new Error("Arquivo indisponível neste navegador."));
    });
  } finally {
    db.close();
  }
}

export async function clearPresentationFiles() {
  const db = await fileDB();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction("presentations", "readwrite");
      transaction.objectStore("presentations").clear();
      transaction.oncomplete = () => resolve();
      transaction.onerror = transaction.onabort = () =>
        reject(
          new Error(
            "Não foi possível limpar os arquivos locais. Tente novamente antes de reiniciar.",
          ),
        );
    });
  } finally {
    db.close();
  }
}
