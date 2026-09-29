// Builds the Derecho Animal submission files from manuscript.txt.
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, FootnoteReferenceRun, AlignmentType,
  Footer, PageNumber, Table, TableRow, TableCell, WidthType, BorderStyle,
  ShadingType, TabStopType,
} = require('docx');

const dir = __dirname;
const FONT = 'Times New Roman';
const BODY = 24; // half-points: 12 pt
const NOTE = 20; // 10 pt
const TITLE = 32; // 16 pt

// *italic* markup -> runs
function runs(text, size = BODY, extra = {}) {
  const out = [];
  const parts = text.split(/(\*[^*]+\*)/);
  for (const p of parts) {
    if (!p) continue;
    if (p.startsWith('*') && p.endsWith('*')) out.push(new TextRun({ text: p.slice(1, -1), italics: true, size, font: FONT, ...extra }));
    else out.push(new TextRun({ text: p, size, font: FONT, ...extra }));
  }
  return out;
}

const footnotes = {};
let fnId = 0;
function bodyRuns(text, size = BODY) {
  const out = [];
  const re = /\{\{fn:\s*([\s\S]*?)\}\}/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    out.push(...runs(text.slice(last, m.index), size));
    fnId += 1;
    footnotes[fnId] = {
      children: [new Paragraph({ alignment: AlignmentType.LEFT, spacing: { line: 240 }, children: runs(m[1].trim(), NOTE) })],
    };
    out.push(new FootnoteReferenceRun(fnId));
    last = re.lastIndex;
  }
  out.push(...runs(text.slice(last), size));
  return out;
}

const bodyPara = (text) => new Paragraph({
  alignment: AlignmentType.JUSTIFIED, spacing: { line: 240, after: 160 }, indent: { firstLine: 425 },
  children: bodyRuns(text),
});
const heading = (text) => new Paragraph({
  alignment: AlignmentType.LEFT, keepNext: true, spacing: { before: 280, after: 160, line: 240 },
  children: [new TextRun({ text, bold: true, size: BODY, font: FONT })],
});

// ---------- tables ----------
const border = { style: BorderStyle.SINGLE, size: 4, color: '808080' };
const borders = { top: border, bottom: border, left: border, right: border };
function cell(text, width, { header = false, align = AlignmentType.LEFT } = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA }, borders,
    shading: header ? { type: ShadingType.CLEAR, color: 'auto', fill: 'E7E6E6' } : undefined,
    margins: { top: 60, bottom: 60, left: 90, right: 90 },
    children: [new Paragraph({ alignment: align, spacing: { line: 240 }, children: bodyRuns(text, NOTE).map((r) => r) })],
  });
}
function makeTable(widths, header, rows, aligns) {
  const total = widths.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: total, type: WidthType.DXA }, columnWidths: widths,
    rows: [
      new TableRow({ tableHeader: true, children: header.map((h, i) => cell(h, widths[i], { header: true, align: aligns ? aligns[i] : AlignmentType.LEFT })) }),
      ...rows.map((r) => new TableRow({ cantSplit: true, children: r.map((c, i) => cell(c, widths[i], { align: aligns ? aligns[i] : AlignmentType.LEFT })) })),
    ],
  });
}
const caption = (text) => new Paragraph({
  alignment: AlignmentType.LEFT, keepNext: true, spacing: { before: 200, after: 100, line: 240 },
  children: bodyRuns(text, NOTE).map((r) => r),
});
const afterTable = () => new Paragraph({ spacing: { after: 120 }, children: [] });

const TABLE1 = () => [
  caption('Table 1. Divergences between Directive 2010/63/EU and Turkish law that survive a provision-level comparison'),
  makeTable([1700, 2400, 2800, 2100], ['Issue', 'Directive 2010/63/EU', 'Turkish law', 'Assessment'], [
    ['Independence of project evaluation and authorisation', 'Competent authority; delegated bodies must be free of any conflict of interests (arts. 38(4), 59(1)).', 'In-house committee evaluates and authorises; chair and veterinarian are employees; all members appointed by the institution; two independent members (one on aquatic committees).', 'Impartiality rests on lay members and central review on appeal.'],
    ['Severe, long-lasting pain', 'Prohibited unless the Member State adopts a provisional measure notified to the Commission (arts. 15(2), 55(3)).', 'Any local committee may allow it case by case; retrospective assessment required; no notification.', 'A state measure in the Union is a local decision in Türkiye.'],
    ['Aquatic inspection and committees', 'At least one third of users inspected each year (art. 34).', 'Aquatic Regulation omits the one-third floor; one independent committee member.', 'Weaker rules for the largest group of animals used.'],
    ['Transparency', 'Summaries published in an EU database; annual statistics (arts. 43, 54).', 'Summaries published only if the Ministry creates a database; confidentiality provisions; statistics end in 2020.', 'No project-level transparency in practice.'],
    ['Personnel', 'Competence through training (art. 23, Annex V); competent person or expert (arts. 6, 25).', 'Experience can replace training for managers; doctorate exemption for aquatic work; veterinarian-centred roles.', 'Looser on training, stricter on profession.'],
    ['Sanctions', 'Effective, proportionate and dissuasive (art. 60).', 'Fixed per-animal schedules under Laws No. 5996 and 5199; administrative only.', 'Sanctions do not scale with the offender\'s resources.'],
  ]),
  afterTable(),
];

const stats = [['2010', '270,307', '55,275'], ['2011', '201,606', '50,035'], ['2012', '173,152', '54,039'], ['2013', '167,634', '30,226'], ['2014', '213,366', '45,894'], ['2015', '386,745', '216,418'], ['2016', '451,914', '249,213'], ['2017', '265,109', '132,498'], ['2018', '236,297', '68,057'], ['2019', '213,641', '76,377'], ['2020', '209,212', '77,435']];
const TABLE2 = () => [
  caption('Table 2. Animals used for scientific purposes in Türkiye, 2010–2020, as reported by HADMEK (figures read from the reports\' charts){{fn: HADMEK, *2010–2014 faaliyet raporu*; HADMEK, *2015–2016 faaliyet raporu*; HADMEK, *2017 yılı hayvan deneyleri istatistik raporu* [Statistical Report on Animal Experiments 2017] (Ankara: T.C. Orman ve Su İşleri Bakanlığı, 2018); HADMEK, *2018–2020 yılları Hayvan Deneyleri Merkezi Etik Kurulu faaliyet raporu* [Activity Report 2018–2020] (Ankara: T.C. Tarım ve Orman Bakanlığı, 2021).}}'),
  makeTable([1400, 2200, 2200], ['Year', 'Animals used', 'Of which fish'], stats, [AlignmentType.LEFT, AlignmentType.RIGHT, AlignmentType.RIGHT]),
  afterTable(),
];

// ---------- bibliography ----------
const BIB = [
  'AAALAC International. "Directory of Accredited Organizations." Accessed August 26, 2026. https://www.aaalac.org/accreditation/directory/directory-of-accredited-organizations-search-result/.',
  'Akben, D. "Alman hukukunda ve Türk hukukunda hayvanların korunmasının karşılaştırılması [A Comparison of Animal Protection in German and Turkish Law]." *Dokuz Eylül Üniversitesi Hukuk Fakültesi Dergisi* 25, no. 2 (2023): 1047–1102. https://doi.org/10.33717/deuhfd.1375617.',
  'Bayne, K., T. H. Morris, and M. P. France. "Legislation and Oversight of the Conduct of Research Using Animals: A Global Overview." In *The UFAW Handbook on the Care and Management of Laboratory and Other Research Animals*, 8th ed., edited by R. Hubrecht and J. Kirkwood, 107–23. Chichester: Wiley-Blackwell, 2010.',
  'Busquet, F. "New European Union Statistics on Laboratory Animal Use – What Really Counts!" *ALTEX* 37, no. 2 (2020): 167–86. https://doi.org/10.14573/altex.2003241.',
  'Demirel, B., and G. Uluköy. "Hayvan refahı bakış açısı ile bilimsel çalışmalarda sucul omurgalı canlıların kullanımının mevzuat açısından incelenmesi [A Legislative Evaluation of the Use of Aquatic Vertebrates in Scientific Research from an Animal Welfare Perspective]." *Mediterranean Fisheries and Aquaculture Research* 8, no. 2 (2025): 105–27. https://doi.org/10.63039/medfar.1818317.',
  'Dokuz Eylül Üniversitesi. *Hayvan Deneyleri Yerel Etik Kurulu Çalışma Usul ve Esasları Yönergesi (DEÜ HADYEK)* [Directive on the Working Procedures and Principles of the Local Animal-Experiment Ethics Committee]. İzmir: Dokuz Eylül Üniversitesi, n.d.',
  'European Commission, Directorate-General for Neighbourhood and Enlargement Negotiations. *Screening Report Turkey: Chapter 12 – Food Safety, Veterinary and Phytosanitary Policy*. Brussels: European Commission, 2007. https://enlargement.ec.europa.eu/screening-report-turkey-chapter-12-food-safety-veterinary-and-phytosanitary-policy_en.',
  'European Union. Directive 2010/63/EU of the European Parliament and of the Council of September 22, 2010 on the protection of animals used for scientific purposes. *Official Journal of the European Union* L 276, October 20, 2010, 33–79.',
  'European Union. Regulation (EU) 2019/1010 of the European Parliament and of the Council of June 5, 2019 on the alignment of reporting obligations in the field of legislation related to the environment. *Official Journal of the European Union* L 170, June 25, 2019, 115–27.',
  'FELASA. "Education & Training." Accessed August 26, 2026. https://felasa.eu/education-training.',
  'Fiorito, G., A. Affuso, J. Basil, *et al.* "Guidelines for the Care and Welfare of Cephalopods in Research – A Consensus Based on an Initiative by CephRes, FELASA and the Boyd Group." *Laboratory Animals* 49, no. 2 suppl. (2015): 1–90. https://doi.org/10.1177/0023677215580006.',
  'Gölcü, B. M., and A. Aksoy. "Avrupa Birliği ve Türkiye\'de deney hayvanları mevzuatına genel bir bakış [An Overview of Legislation on the Use of Experimental Animals in the European Union and Turkey]." *Türkiye Klinikleri Journal of Laboratory Animals* 1, no. 1 (2017): 56–62. https://doi.org/10.5336/jlabanim.2016-52876.',
  'Grimm, H., and M. Dusseldorp. "The (Re)turn of the 3Rs: An Inquiry into the Normative Nature of Russell and Burch\'s Principles of Humane Experimental Technique." *Laboratory Animals* 59, no. 5 (2025): 556–69. https://doi.org/10.1177/00236772251326352.',
  'Hajosi, D., and H. Grimm. "Mission Impossible Accomplished? A European Cross-National Comparative Study on the Integration of the Harm-Benefit Analysis into Law and Policy Documents." *PLOS ONE* 19, no. 2 (2024): e0297375. https://doi.org/10.1371/journal.pone.0297375.',
  'Hayvan Deneyleri Merkezi Etik Kurulu [HADMEK]. *2010–2014 yılları deney hayvanı kullanımı faaliyet raporu* [Activity Report on the Use of Experimental Animals 2010–2014]. Ankara: T.C. Orman ve Su İşleri Bakanlığı, 2015.',
  'Hayvan Deneyleri Merkezi Etik Kurulu [HADMEK]. *2015–2016 yılları Hayvan Deneyleri Merkezi Etik Kurulu faaliyet raporu* [Activity Report 2015–2016]. Ankara: T.C. Orman ve Su İşleri Bakanlığı, 2017.',
  'Hayvan Deneyleri Merkezi Etik Kurulu [HADMEK]. *2017 yılı hayvan deneyleri istatistik raporu* [Statistical Report on Animal Experiments 2017]. Ankara: T.C. Orman ve Su İşleri Bakanlığı, 2018.',
  'Hayvan Deneyleri Merkezi Etik Kurulu [HADMEK]. *2018–2020 yılları Hayvan Deneyleri Merkezi Etik Kurulu faaliyet raporu* [Activity Report 2018–2020]. Ankara: T.C. Tarım ve Orman Bakanlığı, 2021.',
  'Hayvan Deneyleri Merkezi Etik Kurulu [HADMEK]. *2026 yılı deney hayvanı kullanım sertifikası eğitim programları listesi* [List of 2026 Laboratory-Animal User Certificate Programmes]. September 25, 2026. Accessed September 28, 2026. https://hadmek.tarimorman.gov.tr/Duyuru/Detay/16896.',
  'İstanbul Medipol Üniversitesi. *Hayvan Deneyleri Yerel Etik Kurulu Yönergesi* [Local Animal-Experiment Ethics Committee Rulebook]. İstanbul: Medipol Üniversitesi, n.d.',
  'İstanbul Üniversitesi-Cerrahpaşa. *Hayvan Deneyleri Yerel Etik Kurulu (İÜC-HADYEK) Yönergesi* [Local Animal-Experiment Ethics Committee Rulebook]. İstanbul: İÜC, 2021.',
  'İzmir Biyotıp ve Genom Merkezi. *İBG HADYEK Başvuru Kılavuzu / IBG-HADYEK Application Guideline*. İzmir: İBG, n.d. https://hadyek.ibg.edu.tr/.',
  'İzmir Yüksek Teknoloji Enstitüsü. *İYTE Hayvan Deneyleri Yerel Etik Kurulu Yönergesi* [Local Animal-Experiment Ethics Committee Rulebook]. İzmir: İYTE, 2014.',
  'İzmirli, S., S. J. Aldavood, A. Yasar, and C. J. C. Phillips. "Introducing Ethical Evaluation of the Use of Animals in Experiments in the Near East." *Alternatives to Laboratory Animals* 38, no. 4 (2010): 331–36. https://doi.org/10.1177/026119291003800410.',
  'Kiraga, Ł., and A. Dzikowski. "Ethical Concerns of the Veterinarian in Relation to Experimental Animals and *in Vivo* Research." *Animals* 13, no. 15 (2023): 2476. https://doi.org/10.3390/ani13152476.',
  'Türkiye. Bilimsel Amaçlar İçin Kullanılan Sucul Omurgalı Canlıların Refah ve Korunmasına Dair Yönetmelik [Regulation on the Welfare and Protection of Aquatic Vertebrates Used for Scientific Purposes]. *Resmî Gazete* No. 30751, April 20, 2019. Amended by *Resmî Gazete* No. 32052, December 23, 2022, and No. 32529, April 27, 2024.',
  'Türkiye. Deneysel ve Diğer Bilimsel Amaçlar İçin Kullanılan Hayvanların Refah ve Korunmasına Dair Yönetmelik [Regulation on the Welfare and Protection of Animals Used for Experimental and Other Scientific Purposes]. *Resmî Gazete* No. 28141, December 13, 2011. Amended by *Resmî Gazete* No. 28253, April 3, 2012, and No. 30825, July 8, 2019.',
  'Türkiye. Hayvan Deneyleri Etik Kurullarının Çalışma Usul ve Esaslarına Dair Yönetmelik [Regulation on the Working Procedures and Principles of Animal Experiment Ethics Committees]. *Resmî Gazete* No. 28914, February 15, 2014.',
  'Türkiye. Hayvanları Koruma Kanunu [Animal Protection Law]. Law No. 5199 of June 24, 2004. *Resmî Gazete* No. 25509, July 1, 2004. Consolidated text. Accessed September 28, 2026. https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=5199&MevzuatTur=1&MevzuatTertip=5.',
  'Türkiye. Veteriner Hizmetleri, Bitki Sağlığı, Gıda ve Yem Kanunu [Law on Veterinary Services, Plant Health, Food and Feed]. Law No. 5996 of June 11, 2010. *Resmî Gazete* No. 27610, June 13, 2010. Consolidated text. Accessed September 28, 2026. https://www.mevzuat.gov.tr/MevzuatMetin/1.5.5996.pdf.',
  'Uludağ, Ö. "Hayvan deneyi çalışmalarında etik kuralların tarihçesi ve önemi [History and Importance of Ethical Rules in Animal Experiment Studies]." *Adıyaman Üniversitesi Sağlık Bilimleri Dergisi* 5, no. 1 (2019): 1401–13. https://doi.org/10.30569/adiyamansaglik.482098.',
];
const bibPara = (t) => new Paragraph({
  alignment: AlignmentType.LEFT, spacing: { line: 240, after: 120 }, indent: { left: 567, hanging: 567 }, children: runs(t),
});

// ---------- parse manuscript ----------
const src = fs.readFileSync(path.join(dir, 'manuscript.txt'), 'utf8');
const blocks = src.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
const children = [];
for (const b of blocks) {
  if (b.startsWith('#TITLE ')) {
    const tpd = JSON.parse(fs.readFileSync(path.join(dir, 'titlepage.json'), 'utf8'));
    const lab = (l, v) => new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { line: 240, after: 160 }, children: [new TextRun({ text: l + ' ', bold: true, size: BODY, font: FONT }), new TextRun({ text: v, size: BODY, font: FONT })] });
    children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200, line: 240 }, children: [new TextRun({ text: b.slice(7), bold: true, size: TITLE, font: FONT })] }));
    children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 360, line: 240 }, children: [new TextRun({ text: tpd.title_es, size: 28, font: FONT })] }));
    children.push(lab('Abstract:', tpd.abstract_en), lab('Keywords:', tpd.keywords_en), lab('Resumen:', tpd.abstract_es), lab('Palabras clave:', tpd.keywords_es));
    children.push(new Paragraph({ spacing: { after: 200 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '808080', space: 1 } }, children: [] }));
  } else if (b.startsWith('#SUMMARY ')) {
    const t = b.slice(9);
    const i = t.indexOf(':');
    children.push(new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 360, line: 240 }, children: [new TextRun({ text: t.slice(0, i + 1), bold: true, size: BODY, font: FONT }), new TextRun({ text: t.slice(i + 1), size: BODY, font: FONT })] }));
  } else if (b === '#TABLE1') children.push(...TABLE1());
  else if (b === '#TABLE2') children.push(...TABLE2());
  else if (b === '#BIBLIOGRAPHY') { children.push(heading('Bibliography')); BIB.forEach((t) => children.push(bibPara(t))); }
  else if (b.startsWith('### ')) children.push(heading(b.slice(4)));
  else if (b.startsWith('## ')) children.push(heading(b.slice(3)));
  else children.push(bodyPara(b.replace(/\n/g, ' ')));
}

const footer = new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ children: [PageNumber.CURRENT], size: BODY, font: FONT })] })] });
const section = (kids) => ({
  properties: { page: { margin: { top: 1418, bottom: 1418, left: 1418, right: 1418 } } },
  footers: { default: footer }, children: kids,
});
const styles = { default: { document: { run: { font: FONT, size: BODY } } } };

const manuscript = new Document({ creator: 'Anonymous', lastModifiedBy: 'Anonymous', title: 'Faithful on Paper, Unobservable in Practice', styles, footnotes, sections: [section(children)] });
Packer.toBuffer(manuscript).then((buf) => fs.writeFileSync(path.join(dir, '1-UPLOAD-manuscript-for-review.docx'), buf));

// ---------- title page (portadilla) ----------
const tp = JSON.parse(fs.readFileSync(path.join(dir, 'titlepage.json'), 'utf8'));
const label = (l, v, italicV = false) => new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { line: 240, after: 160 }, children: [new TextRun({ text: l + ' ', bold: true, size: BODY, font: FONT }), new TextRun({ text: v, size: BODY, font: FONT, italics: italicV })] });
const tpKids = [
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: tp.title_es, bold: true, size: TITLE, font: FONT })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: tp.title_en, bold: true, size: TITLE, font: FONT })] }),
  label('Autor/a / Author:', tp.author),
  label('Filiación institucional / Affiliation:', tp.affiliation),
  label('Correo electrónico / E-mail:', tp.email),
  label('Nota biográfica / Biographical note:', tp.bio),
  label('ORCID:', tp.orcid),
  label('Resumen:', tp.abstract_es),
  label('Abstract:', tp.abstract_en),
  label('Palabras clave:', tp.keywords_es),
  label('Keywords:', tp.keywords_en),
];
const titlePage = new Document({ creator: 'Anonymous', lastModifiedBy: 'Anonymous', styles, sections: [section(tpKids)] });
Packer.toBuffer(titlePage).then((buf) => fs.writeFileSync(path.join(dir, '2-UPLOAD-title-page-portadilla.docx'), buf));
