import JSZip from "jszip";
import ExcelJS from "exceljs";
// All fixture content is synthetic, authored here; no customer files.
export function demoPDF() {
  const lines = [
    "Evento: Briefing de teste",
    "Data: 10/12/2026",
    "Publico: 240 pessoas",
    "Cidade: Niteroi",
    "Objetivo: reunir equipes",
    "Orcamento: R$ 78.000",
  ];
  const content = `BT /F1 12 Tf 50 780 Td ${lines.map((l, i) => `${i ? "0 -24 Td " : ""}(${l}) Tj`).join("\n")} ET`;
  const objs = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objs.forEach((o, i) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const start = Buffer.byteLength(pdf);
  pdf += `xref\n0 6\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((o) => String(o).padStart(10, "0") + " 00000 n \n")
    .join("")}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`;
  return {
    name: "briefing-ficticio.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from(pdf),
  };
}
export async function briefingFixtures() {
  const docx = new JSZip();
  docx.file(
    "[Content_Types].xml",
    '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
  );
  docx.file(
    "word/document.xml",
    '<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Horários do evento: das 18h às 22h; demonstração DOCX</w:t></w:r></w:p><w:p><w:r><w:t>Tema e referências: encontro das equipes fictícias</w:t></w:r></w:p></w:body></w:document>',
  );
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Escopo fictício");
  sheet.addRow([
    "Formato e duração do serviço",
    "Jantar das 19h às 22h; demonstração XLSX",
  ]);
  sheet.addRow([
    "Som, imagem, palco e iluminação",
    "Dois microfones sem fio e uma tela",
  ]);
  return [
    demoPDF(),
    {
      name: "detalhes-ficticios.docx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      buffer: await docx.generateAsync({ type: "nodebuffer" }),
    },
    {
      name: "escopo-ficticio.xlsx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      buffer: Buffer.from(await workbook.xlsx.writeBuffer()),
    },
  ];
}
