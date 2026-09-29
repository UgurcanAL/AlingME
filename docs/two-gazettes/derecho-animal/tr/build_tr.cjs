// Builds the Derecho Animal submission files from manuscript.txt.
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, FootnoteReferenceRun, AlignmentType,
  Footer, PageNumber, Table, TableRow, TableCell, WidthType, BorderStyle,
  ShadingType, TabStopType,
} = require('docx');

const dir = __dirname;
const root = path.join(__dirname, '..');
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
  caption('Tablo 1. Hüküm düzeyindeki karşılaştırmadan sonra varlığını sürdüren, 2010/63/AB sayılı Direktif ile Türk hukuku arasındaki ayrışmalar'),
  makeTable([1700, 2400, 2800, 2100], ['Konu', '2010/63/AB sayılı Direktif', 'Türk hukuku', 'Değerlendirme'], [
    ['Proje değerlendirmesi ve izninin bağımsızlığı', 'Yetkili makam; görev devredilen kuruluşlar her türlü çıkar çatışmasından arınmış olmalıdır (md. 38(4), 59(1)).', 'Kurum içi kurul değerlendirir ve izin verir; başkan ve veteriner hekim kurum çalışanıdır; tüm üyeleri kurum atar; iki bağımsız üye (sucul kurullarda bir).', 'Tarafsızlık sivil üyelere ve itiraz üzerine merkezi incelemeye dayanır.'],
    ['Uzun süreli şiddetli acı', 'Üye Devlet Komisyon\'a bildirilen geçici bir tedbir kabul etmedikçe yasaktır (md. 15(2), 55(3)).', 'Herhangi bir yerel kurul vaka bazında izin verebilir; geriye dönük değerlendirme zorunludur; bildirim yoktur.', 'Birlikte devlet tedbiri olan karar Türkiye\'de yerel bir karardır.'],
    ['Sucul denetim ve kurullar', 'Her yıl kullanıcıların en az üçte biri denetlenir (md. 34).', 'Sucul Yönetmelik üçte birlik tabana yer vermez; kurulda bir bağımsız üye.', 'Kullanılan en büyük hayvan grubu için daha zayıf kurallar.'],
    ['Şeffaflık', 'Özetler bir AB veri tabanında yayımlanır; yıllık istatistikler (md. 43, 54).', 'Özetler yalnızca Bakanlık bir veri tabanı oluşturursa yayımlanır; gizlilik hükümleri; istatistikler 2020\'de sona erer.', 'Uygulamada proje düzeyinde şeffaflık yoktur.'],
    ['Personel', 'Eğitimle yetkinlik (md. 23, Ek V); yetkin kişi veya uzman (md. 6, 25).', 'Yöneticiler için deneyim eğitimin yerine geçebilir; sucul çalışmada doktora muafiyeti; veteriner hekim merkezli roller.', 'Eğitimde daha gevşek, meslekte daha katı.'],
    ['Yaptırımlar', 'Etkili, orantılı ve caydırıcı (md. 60).', '5996 ve 5199 sayılı Kanunlar uyarınca sabit, hayvan başına tarifeler; yalnızca idari.', 'Yaptırımlar ihlal edenin kaynaklarına göre ölçeklenmez.'],
  ]),
  afterTable(),
];

const stats = [['2010', '270.307', '55.275'], ['2011', '201.606', '50.035'], ['2012', '173.152', '54.039'], ['2013', '167.634', '30.226'], ['2014', '213.366', '45.894'], ['2015', '386.745', '216.418'], ['2016', '451.914', '249.213'], ['2017', '265.109', '132.498'], ['2018', '236.297', '68.057'], ['2019', '213.641', '76.377'], ['2020', '209.212', '77.435']];
const TABLE2 = () => [
  caption('Tablo 2. Türkiye\'de bilimsel amaçlarla kullanılan hayvanlar, 2010–2020, HADMEK\'in raporladığı şekliyle (rakamlar raporlardaki grafiklerden okunmuştur){{fn: HADMEK, *2010–2014 faaliyet raporu*; HADMEK, *2015–2016 faaliyet raporu*; HADMEK, *2017 yılı hayvan deneyleri istatistik raporu* (Ankara: T.C. Orman ve Su İşleri Bakanlığı, 2018); HADMEK, *2018–2020 yılları Hayvan Deneyleri Merkezi Etik Kurulu faaliyet raporu* (Ankara: T.C. Tarım ve Orman Bakanlığı, 2021).}}'),
  makeTable([1400, 2200, 2200], ['Yıl', 'Kullanılan hayvan', 'Bunun balık olanı'], stats, [AlignmentType.LEFT, AlignmentType.RIGHT, AlignmentType.RIGHT]),
  afterTable(),
];

const BIB = [
  'AAALAC International. "Directory of Accredited Organizations." Erişim tarihi 26 Ağustos 2026. https://www.aaalac.org/accreditation/directory/directory-of-accredited-organizations-search-result/.',
  'Akben, D. "Alman hukukunda ve Türk hukukunda hayvanların korunmasının karşılaştırılması." *Dokuz Eylül Üniversitesi Hukuk Fakültesi Dergisi* 25, no. 2 (2023): 1047–1102. https://doi.org/10.33717/deuhfd.1375617.',
  'Avrupa Birliği. Bilimsel Amaçlarla Kullanılan Hayvanların Korunmasına İlişkin 22 Eylül 2010 tarihli ve 2010/63/AB sayılı Avrupa Parlamentosu ve Konsey Direktifi. *Avrupa Birliği Resmî Gazetesi* L 276, 20 Ekim 2010, 33–79.',
  'Avrupa Birliği. Çevreyle İlgili Mevzuat Alanındaki Raporlama Yükümlülüklerinin Uyumlaştırılmasına İlişkin 5 Haziran 2019 tarihli ve (AB) 2019/1010 sayılı Avrupa Parlamentosu ve Konsey Tüzüğü. *Avrupa Birliği Resmî Gazetesi* L 170, 25 Haziran 2019, 115–27.',
  'Avrupa Komisyonu, Komşuluk ve Genişleme Müzakereleri Genel Müdürlüğü. *Screening Report Turkey: Chapter 12 – Food Safety, Veterinary and Phytosanitary Policy*. Brüksel: Avrupa Komisyonu, 2007. https://enlargement.ec.europa.eu/screening-report-turkey-chapter-12-food-safety-veterinary-and-phytosanitary-policy_en.',
  'Bayne, K., T. H. Morris ve M. P. France. "Legislation and Oversight of the Conduct of Research Using Animals: A Global Overview." *The UFAW Handbook on the Care and Management of Laboratory and Other Research Animals* içinde, 8. bs., editörler R. Hubrecht ve J. Kirkwood, 107–23. Chichester: Wiley-Blackwell, 2010.',
  'Busquet, F. "New European Union Statistics on Laboratory Animal Use – What Really Counts!" *ALTEX* 37, no. 2 (2020): 167–86. https://doi.org/10.14573/altex.2003241.',
  'Demirel, B. ve G. Uluköy. "Hayvan refahı bakış açısı ile bilimsel çalışmalarda sucul omurgalı canlıların kullanımının mevzuat açısından incelenmesi." *Mediterranean Fisheries and Aquaculture Research* 8, no. 2 (2025): 105–27. https://doi.org/10.63039/medfar.1818317.',
  'FELASA. "Education & Training." Erişim tarihi 26 Ağustos 2026. https://felasa.eu/education-training.',
  'Fiorito, G., A. Affuso, J. Basil *vd.* "Guidelines for the Care and Welfare of Cephalopods in Research – A Consensus Based on an Initiative by CephRes, FELASA and the Boyd Group." *Laboratory Animals* 49, no. 2 ek (2015): 1–90. https://doi.org/10.1177/0023677215580006.',
  'Gölcü, B. M. ve A. Aksoy. "Avrupa Birliği ve Türkiye\'de deney hayvanları mevzuatına genel bir bakış." *Türkiye Klinikleri Journal of Laboratory Animals* 1, no. 1 (2017): 56–62. https://doi.org/10.5336/jlabanim.2016-52876.',
  'Grimm, H. ve M. Dusseldorp. "The (Re)turn of the 3Rs: An Inquiry into the Normative Nature of Russell and Burch\'s Principles of Humane Experimental Technique." *Laboratory Animals* 59, no. 5 (2025): 556–69. https://doi.org/10.1177/00236772251326352.',
  'Hajosi, D. ve H. Grimm. "Mission Impossible Accomplished? A European Cross-National Comparative Study on the Integration of the Harm-Benefit Analysis into Law and Policy Documents." *PLOS ONE* 19, no. 2 (2024): e0297375. https://doi.org/10.1371/journal.pone.0297375.',
  'Hayvan Deneyleri Merkezi Etik Kurulu [HADMEK]. *2010–2014 yılları deney hayvanı kullanımı faaliyet raporu*. Ankara: T.C. Orman ve Su İşleri Bakanlığı, 2015.',
  'Hayvan Deneyleri Merkezi Etik Kurulu [HADMEK]. *2015–2016 yılları Hayvan Deneyleri Merkezi Etik Kurulu faaliyet raporu*. Ankara: T.C. Orman ve Su İşleri Bakanlığı, 2017.',
  'Hayvan Deneyleri Merkezi Etik Kurulu [HADMEK]. *2017 yılı hayvan deneyleri istatistik raporu*. Ankara: T.C. Orman ve Su İşleri Bakanlığı, 2018.',
  'Hayvan Deneyleri Merkezi Etik Kurulu [HADMEK]. *2018–2020 yılları Hayvan Deneyleri Merkezi Etik Kurulu faaliyet raporu*. Ankara: T.C. Tarım ve Orman Bakanlığı, 2021.',
  'Hayvan Deneyleri Merkezi Etik Kurulu [HADMEK]. *2026 yılı deney hayvanı kullanım sertifikası eğitim programları listesi*. 25 Eylül 2026. Erişim tarihi 28 Eylül 2026. https://hadmek.tarimorman.gov.tr/Duyuru/Detay/16896.',
  'İstanbul Medipol Üniversitesi. *Hayvan Deneyleri Yerel Etik Kurulu Yönergesi*. İstanbul: Medipol Üniversitesi, t.y.',
  'İstanbul Üniversitesi-Cerrahpaşa. *Hayvan Deneyleri Yerel Etik Kurulu (İÜC-HADYEK) Yönergesi*. İstanbul: İÜC, 2021.',
  'İzmir Yüksek Teknoloji Enstitüsü. *İYTE Hayvan Deneyleri Yerel Etik Kurulu Yönergesi*. İzmir: İYTE, 2014.',
  'İzmirli, S., S. J. Aldavood, A. Yasar ve C. J. C. Phillips. "Introducing Ethical Evaluation of the Use of Animals in Experiments in the Near East." *Alternatives to Laboratory Animals* 38, no. 4 (2010): 331–36. https://doi.org/10.1177/026119291003800410.',
  'Kiraga, Ł. ve A. Dzikowski. "Ethical Concerns of the Veterinarian in Relation to Experimental Animals and *in Vivo* Research." *Animals* 13, no. 15 (2023): 2476. https://doi.org/10.3390/ani13152476.',
  'Türkiye. Bilimsel Amaçlar İçin Kullanılan Sucul Omurgalı Canlıların Refah ve Korunmasına Dair Yönetmelik. *Resmî Gazete* S. 30751, 20 Nisan 2019. *Resmî Gazete* S. 32052, 23 Aralık 2022 ve S. 32529, 27 Nisan 2024 ile değişik.',
  'Türkiye. Deneysel ve Diğer Bilimsel Amaçlar İçin Kullanılan Hayvanların Refah ve Korunmasına Dair Yönetmelik. *Resmî Gazete* S. 28141, 13 Aralık 2011. *Resmî Gazete* S. 28253, 3 Nisan 2012 ve S. 30825, 8 Temmuz 2019 ile değişik.',
  'Türkiye. Hayvan Deneyleri Etik Kurullarının Çalışma Usul ve Esaslarına Dair Yönetmelik. *Resmî Gazete* S. 28914, 15 Şubat 2014.',
  'Türkiye. Hayvanları Koruma Kanunu. 24 Haziran 2004 tarihli ve 5199 sayılı Kanun. *Resmî Gazete* S. 25509, 1 Temmuz 2004. Konsolide metin. Erişim tarihi 28 Eylül 2026. https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=5199&MevzuatTur=1&MevzuatTertip=5.',
  'Türkiye. Veteriner Hizmetleri, Bitki Sağlığı, Gıda ve Yem Kanunu. 11 Haziran 2010 tarihli ve 5996 sayılı Kanun. *Resmî Gazete* S. 27610, 13 Haziran 2010. Konsolide metin. Erişim tarihi 28 Eylül 2026. https://www.mevzuat.gov.tr/MevzuatMetin/1.5.5996.pdf.',
  'Uludağ, Ö. "Hayvan deneyi çalışmalarında etik kuralların tarihçesi ve önemi." *Adıyaman Üniversitesi Sağlık Bilimleri Dergisi* 5, no. 1 (2019): 1401–13. https://doi.org/10.30569/adiyamansaglik.482098.',
];

const bibPara = (t) => new Paragraph({
  alignment: AlignmentType.LEFT, spacing: { line: 240, after: 120 }, indent: { left: 567, hanging: 567 }, children: runs(t),
});

// ---------- parse manuscript ----------
const src = fs.readFileSync(path.join(dir, 'manuscript_tr.txt'), 'utf8');
const blocks = src.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
const children = [];
for (const b of blocks) {
  if (b.startsWith('#TITLE ')) {
    const tpd = JSON.parse(fs.readFileSync(path.join(dir, 'ozet_tr.json'), 'utf8'));
    const lab = (l, v) => new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { line: 240, after: 160 }, children: [new TextRun({ text: l + ' ', bold: true, size: BODY, font: FONT }), new TextRun({ text: v, size: BODY, font: FONT })] });
    children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200, line: 240 }, children: [new TextRun({ text: b.slice(7), bold: true, size: TITLE, font: FONT })] }));
    children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 360, line: 240 }, children: [new TextRun({ text: tpd.title_en, size: 28, font: FONT })] }));
    children.push(lab('Özet:', tpd.abstract_tr), lab('Anahtar Kelimeler:', tpd.keywords_tr), lab('Abstract:', tpd.abstract_en), lab('Keywords:', tpd.keywords_en));
    children.push(new Paragraph({ spacing: { after: 200 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '808080', space: 1 } }, children: [] }));
  } else if (b.startsWith('#SUMMARY ')) {
    const t = b.slice(9);
    const i = t.indexOf(':');
    children.push(new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 360, line: 240 }, children: [new TextRun({ text: t.slice(0, i + 1), bold: true, size: BODY, font: FONT }), new TextRun({ text: t.slice(i + 1), size: BODY, font: FONT })] }));
  } else if (b === '#TABLE1') children.push(...TABLE1());
  else if (b === '#TABLE2') children.push(...TABLE2());
  else if (b === '#BIBLIOGRAPHY') { children.push(heading('Kaynakça')); BIB.forEach((t) => children.push(bibPara(t))); }
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

const manuscript = new Document({ creator: 'Anonymous', lastModifiedBy: 'Anonymous', title: 'Kâğıt Üzerinde Sadık, Uygulamada Gözlemlenemez', styles, footnotes, sections: [section(children)] });
Packer.toBuffer(manuscript).then((buf) => fs.writeFileSync(path.join(dir, 'Iki-Gazete-makale-TURKCE.docx'), buf));
