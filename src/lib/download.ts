function canDownloadInBrowser() {
  return (
    typeof window !== 'undefined' &&
    typeof document !== 'undefined' &&
    typeof Blob !== 'undefined' &&
    typeof window.URL?.createObjectURL === 'function'
  );
}

export function downloadBlobFile(filename: string, parts: BlobPart | BlobPart[], mimeType: string) {
  if (!canDownloadInBrowser()) {
    return false;
  }

  const blobParts = Array.isArray(parts) ? parts : [parts];
  const objectUrl = window.URL.createObjectURL(new Blob(blobParts, { type: mimeType }));

  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(objectUrl);
  return true;
}

export function downloadTextFile(filename: string, contents: string, mimeType: string) {
  return downloadBlobFile(filename, contents, mimeType);
}

function toAsciiText(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapePdfText(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

export function buildSimplePdf(title: string, lines: string[]) {
  const printableLines = [toAsciiText(title), ...lines.map(toAsciiText)].filter(Boolean).slice(0, 34);
  const stream = printableLines
    .map((line, index) => {
      const fontSize = index === 0 ? 16 : 11;
      const y = 780 - index * 20;
      return [
        'BT',
        `/F1 ${fontSize} Tf`,
        `1 0 0 1 50 ${y} Tm`,
        `(${escapePdfText(line)}) Tj`,
        'ET',
      ].join('\n');
    })
    .join('\n');

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj',
    '2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj',
    `5 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  for (const object of objects) {
    offsets.push(pdf.length);
    pdf += `${object}\n`;
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;

  for (const offset of offsets.slice(1)) {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return pdf;
}
