const fs = require('fs'); const path = require('path');
const { Document, Packer, Paragraph, TextRun, AlignmentType, Footer, PageNumber } = require('docx');
const F = 'Times New Roman';
const runs = (t) => t.split(/(\*\*[^*]+\*\*)/).filter(Boolean).map((p) => p.startsWith('**') ? new TextRun({ text: p.slice(2, -2), bold: true, font: F, size: 24 }) : new TextRun({ text: p, font: F, size: 24 }));
const lines = fs.readFileSync(path.join(__dirname, 'niyet-metni.txt'), 'utf8').split('\n').filter((l) => l.trim());
const kids = lines.map((l) => {
  if (l.startsWith('#TITLE ')) return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 160 }, children: [new TextRun({ text: l.slice(7), bold: true, font: F, size: 30 })] });
  if (l.startsWith('#META ')) return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 280 }, children: [new TextRun({ text: l.slice(6), italics: true, font: F, size: 20 })] });
  if (l.startsWith('## ')) return new Paragraph({ keepNext: true, spacing: { before: 200, after: 100 }, children: [new TextRun({ text: l.slice(3), bold: true, font: F, size: 24 })] });
  return new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 120, line: 276 }, children: runs(l) });
});
const doc = new Document({ creator: 'Uğurcan Al', title: 'Yeşil Nesil Laboratuvarı', sections: [{ properties: { page: { margin: { top: 1134, bottom: 1134, left: 1247, right: 1247 } } }, footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], font: F, size: 20 })] })] }) }, children: kids }] });
Packer.toBuffer(doc).then((b) => fs.writeFileSync(path.join(__dirname, 'COP31-Yesil-Nesil-niyet-metni.docx'), b));
