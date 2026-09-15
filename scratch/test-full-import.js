const JSZip = require('jszip');
const ExcelJS = require('exceljs');

const QUIZ_IMPORT_HEADERS = [
  "Question", "Option A", "Option B", "Option C", "Option D",
  "Correct Answer", "Marks", "Negative Marks", "Explanation",
];

function decodeXmlEntities(text) {
  if (!text) return "";
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function colLetterToIndex(col) {
  let index = 0;
  for (let i = 0; i < col.length; i++) {
    index = index * 26 + (col.charCodeAt(i) - 64);
  }
  return index - 1;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;
  const clean = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    const next = clean[i + 1];
    if (ch === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((ch === ',' || ch === '\t' || ch === ';') && !inQuotes) {
      row.push(cell.trim());
      cell = '';
    } else if ((ch === '\r' || ch === '\n') && !inQuotes) {
      if (ch === '\r' && next === '\n') i++;
      row.push(cell.trim());
      cell = '';
      if (row.some(c => c !== '')) rows.push(row);
      row = [];
    } else {
      cell += ch;
    }
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell.trim());
    if (row.some(c => c !== '')) rows.push(row);
  }
  return rows;
}

async function parseXlsx(buffer) {
  const zip = await JSZip.loadAsync(buffer);
  
  // 1. Shared strings
  const sharedStrings = [];
  const sstFile = Object.values(zip.files).find(f => f.name.replace(/\\/g, '/').match(/xl\/sharedstrings\.xml/i));
  if (sstFile) {
    const sstXml = await sstFile.async('string');
    const siRegex = /<(?:\w+:)?si\b[^>]*>([\s\S]*?)<\/(?:\w+:)?si>/gi;
    let match;
    while ((match = siRegex.exec(sstXml)) !== null) {
      const siContent = match[1];
      const tRegex = /<(?:\w+:)?t\b[^>]*>([\s\S]*?)<\/(?:\w+:)?t>/gi;
      let textParts = [];
      let tMatch;
      while ((tMatch = tRegex.exec(siContent)) !== null) {
        textParts.push(decodeXmlEntities(tMatch[1]));
      }
      sharedStrings.push(textParts.join(''));
    }
  }

  // 2. First worksheet
  const sheetFile = Object.values(zip.files).find(f => f.name.replace(/\\/g, '/').match(/xl\/worksheets\/sheet1\.xml/i))
    || Object.values(zip.files).find(f => f.name.replace(/\\/g, '/').match(/xl\/worksheets\/sheet\d+\.xml/i));
  if (!sheetFile) throw new Error("Workbook mein koi sheet nahi mili.");

  const sheetXml = await sheetFile.async('string');
  const rowRegex = /<(?:\w+:)?row\b([^>]*)>([\s\S]*?)<\/(?:\w+:)?row>/gi;
  const rows = [];
  let rowMatch;

  while ((rowMatch = rowRegex.exec(sheetXml)) !== null) {
    const rowContent = rowMatch[2];
    const cellRegex = /<(?:\w+:)?c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:\w+:)?c>)/gi;
    const rowValues = [];
    let cellMatch;

    while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
      const cellAttrs = cellMatch[1];
      const cellBody = cellMatch[2] || '';
      const refMatch = cellAttrs.match(/\br="([A-Z]+)(\d+)"/i);
      if (!refMatch) continue;
      const colIndex = colLetterToIndex(refMatch[1].toUpperCase());
      const typeMatch = cellAttrs.match(/\bt="([^"]+)"/i);
      const cellType = typeMatch ? typeMatch[1] : '';

      let val = '';
      if (cellType === 's') {
        const vMatch = cellBody.match(/<(?:\w+:)?v\b[^>]*>([\s\S]*?)<\/(?:\w+:)?v>/i);
        if (vMatch) {
          val = sharedStrings[parseInt(vMatch[1].trim(), 10)] ?? '';
        }
      } else if (cellType === 'inlineStr') {
        const tRegex = /<(?:\w+:)?t\b[^>]*>([\s\S]*?)<\/(?:\w+:)?t>/gi;
        let parts = [];
        let tMatch;
        while ((tMatch = tRegex.exec(cellBody)) !== null) parts.push(decodeXmlEntities(tMatch[1]));
        val = parts.join('');
      } else {
        const vMatch = cellBody.match(/<(?:\w+:)?v\b[^>]*>([\s\S]*?)<\/(?:\w+:)?v>/i);
        if (vMatch) val = decodeXmlEntities(vMatch[1].trim());
      }
      rowValues[colIndex] = val;
    }
    rows.push(rowValues);
  }
  return rows;
}

async function extractTableRows(buffer) {
  const isZip = buffer.length > 4 && buffer[0] === 0x50 && buffer[1] === 0x4b;
  if (isZip) {
    return await parseXlsx(buffer);
  }
  return parseCsv(buffer.toString('utf-8'));
}

async function test() {
  console.log("Creating test spreadsheet with all questions from user screenshot...");
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Sheet1');
  ws.addRow(QUIZ_IMPORT_HEADERS);
  ws.addRow(["What does HTML stand for?", "Hyper Text Markup Language", "High Text Markup Language", "Hyperlink Text Language", "Home Tool Markup Language", "A", 1, 0, "HTML stands for Hyper Text Markup Language"]);
  ws.addRow(["Which HTML tag is used for the largest heading?", "<h6>", "<h1>", "<heading>", "<head>", "B", 1, 0, "<h1> is highest heading"]);
  ws.addRow(["What is correct HTML element for line break?", "<break>", "<lb>", "<br>", "<newline>", "C", 1, 0, "<br> is line break"]);
  
  const buffer = await wb.xlsx.writeBuffer();

  // Create the exact broken namespaced file that caused "Cannot read properties of undefined (reading 'sheets')"
  const zip = await JSZip.loadAsync(buffer);
  let workbookXml = await zip.file('xl/workbook.xml').async('string');
  let modifiedXml = workbookXml
    .replace('<workbook ', '<x:workbook xmlns:x="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ')
    .replace('</workbook>', '</x:workbook>')
    .replace(/<sheets>/g, '<x:sheets>')
    .replace(/<\/sheets>/g, '</x:sheets>')
    .replace(/<sheet /g, '<x:sheet ')
    .replace(/<\/sheet>/g, '</x:sheet>');
  zip.file('xl/workbook.xml', modifiedXml);
  const brokenBuffer = await zip.generateAsync({ type: 'nodebuffer' });

  // Test our parser on the broken buffer!
  const rows = await extractTableRows(brokenBuffer);
  console.log(`Parsed ${rows.length} rows successfully!`);
  rows.forEach((r, idx) => {
    console.log(`Row ${idx + 1}: Q='${r[0]}' | Opt A='${r[1]}' | Opt B='${r[2]}' | Opt C='${r[3]}' | Opt D='${r[4]}' | Ans='${r[5]}'`);
  });
}

test().catch(console.error);
