const JSZip = require('jszip');

function decodeXmlEntities(text) {
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
  return index - 1; // 0-based
}

async function parseXlsxDirect(buffer) {
  const zip = await JSZip.loadAsync(buffer);
  
  // 1. Find sharedStrings.xml
  let sharedStrings = [];
  const sstFile = Object.values(zip.files).find(f => f.name.replace(/\\/g, '/').match(/xl\/sharedstrings\.xml/i));
  if (sstFile) {
    const sstXml = await sstFile.async('string');
    // Extract every <si> ... </si> or <x:si> ... </x:si>
    const siRegex = /<(?:\w+:)?si\b[^>]*>([\s\S]*?)<\/(?:\w+:)?si>/gi;
    let match;
    while ((match = siRegex.exec(sstXml)) !== null) {
      const siContent = match[1];
      // Inside <si>, extract text from all <t> or <x:t> tags
      const tRegex = /<(?:\w+:)?t\b[^>]*>([\s\S]*?)<\/(?:\w+:)?t>/gi;
      let textParts = [];
      let tMatch;
      while ((tMatch = tRegex.exec(siContent)) !== null) {
        textParts.push(decodeXmlEntities(tMatch[1]));
      }
      sharedStrings.push(textParts.join(''));
    }
  }

  // 2. Find first sheet
  const sheetFile = Object.values(zip.files).find(f => f.name.replace(/\\/g, '/').match(/xl\/worksheets\/sheet1\.xml/i))
    || Object.values(zip.files).find(f => f.name.replace(/\\/g, '/').match(/xl\/worksheets\/sheet\d+\.xml/i));
    
  if (!sheetFile) {
    throw new Error("Workbook mein koi worksheet nahi mili.");
  }

  const sheetXml = await sheetFile.async('string');
  
  // 3. Extract rows
  const rowRegex = /<(?:\w+:)?row\b([^>]*)>([\s\S]*?)<\/(?:\w+:)?row>/gi;
  const rows = [];
  let rowMatch;

  while ((rowMatch = rowRegex.exec(sheetXml)) !== null) {
    const rowAttrs = rowMatch[1];
    const rowContent = rowMatch[2];
    const rMatch = rowAttrs.match(/\br="(\d+)"/);
    const rowNumber = rMatch ? parseInt(rMatch[1], 10) : rows.length + 1;

    // Extract cells inside row
    const cellRegex = /<(?:\w+:)?c\b([^>]*)>(?:([\s\S]*?)<\/(?:\w+:)?c>|)/gi;
    const rowValues = [];
    let cellMatch;

    while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
      const cellAttrs = cellMatch[1];
      const cellBody = cellMatch[2] || '';

      const refMatch = cellAttrs.match(/\br="([A-Z]+)(\d+)"/i);
      if (!refMatch) continue;
      const colLetter = refMatch[1].toUpperCase();
      const colIndex = colLetterToIndex(colLetter);

      const typeMatch = cellAttrs.match(/\bt="([^"]+)"/i);
      const cellType = typeMatch ? typeMatch[1] : '';

      let val = '';
      if (cellType === 's') {
        // Shared string index
        const vMatch = cellBody.match(/<(?:\w+:)?v\b[^>]*>([\s\S]*?)<\/(?:\w+:)?v>/i);
        if (vMatch) {
          const sstIdx = parseInt(vMatch[1].trim(), 10);
          val = sharedStrings[sstIdx] ?? '';
        }
      } else if (cellType === 'inlineStr') {
        // Inline string
        const tRegex = /<(?:\w+:)?t\b[^>]*>([\s\S]*?)<\/(?:\w+:)?t>/gi;
        let parts = [];
        let tMatch;
        while ((tMatch = tRegex.exec(cellBody)) !== null) {
          parts.push(decodeXmlEntities(tMatch[1]));
        }
        val = parts.join('');
      } else {
        // Number, string, boolean
        const vMatch = cellBody.match(/<(?:\w+:)?v\b[^>]*>([\s\S]*?)<\/(?:\w+:)?v>/i);
        if (vMatch) {
          val = decodeXmlEntities(vMatch[1].trim());
        }
      }

      rowValues[colIndex] = val;
    }

    // Ensure array indices are filled
    rows.push({ rowNumber, values: rowValues });
  }

  return rows;
}

// Test with our badBuffer from before!
const ExcelJS = require('exceljs');

async function test() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Sheet1');
  ws.addRow(['Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer', 'Marks', 'Negative Marks', 'Explanation']);
  ws.addRow(['Which HTML tag is used for the largest heading?', '<h6>', '<h1>', '<heading>', '<head>', 'B', 1, 0, '<h1> is largest']);
  const buffer = await wb.xlsx.writeBuffer();

  // Create namespaced buffer (which failed with ExcelJS)
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
  const badBuffer = await zip.generateAsync({ type: 'nodebuffer' });

  console.log("Parsing badBuffer directly with parseXlsxDirect...");
  const rows = await parseXlsxDirect(badBuffer);
  console.log("Direct parser parsed rows successfully!", rows.length);
  console.log("Headers:", rows[0].values);
  console.log("Row 2:", rows[1].values);
}

test().catch(console.error);
