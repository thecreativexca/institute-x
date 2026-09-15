const ExcelJS = require('exceljs');
const JSZip = require('jszip');

// Function to clean/normalize XML in a buffer
async function normalizeXlsxBuffer(buffer) {
  try {
    const zip = await JSZip.loadAsync(buffer);
    let modified = false;

    for (const [filename, file] of Object.entries(zip.files)) {
      if (file.dir) continue;
      
      // Check if entry has backslashes or lowercase issues
      const normalizedPath = filename.replace(/\\/g, '/');
      
      // If it's an XML or rels file, normalize namespace prefixes
      if (normalizedPath.endsWith('.xml') || normalizedPath.endsWith('.rels')) {
        let content = await file.async('string');
        const origContent = content;

        // Remove XML prefixes on tags like <x:workbook>, </x:workbook>, <x:sheets>, etc.
        // e.g. <([a-zA-Z0-9_-]+):([a-zA-Z0-9_-]+) -> <$2
        // e.g. </([a-zA-Z0-9_-]+):([a-zA-Z0-9_-]+) -> </$2
        // We only strip prefixes on standard spreadsheetml tags or all tags in xl/
        content = content.replace(/<\/?([a-zA-Z0-9_-]+):([a-zA-Z0-9_-]+)(?=[ >/])/g, (match, prefix, tag) => {
          // If prefix is 'xml', keep it (e.g. xml:space)
          if (prefix === 'xml') return match;
          const isClosing = match.startsWith('</');
          return (isClosing ? '</' : '<') + tag;
        });

        if (content !== origContent || normalizedPath !== filename) {
          if (normalizedPath !== filename) {
            zip.remove(filename);
          }
          zip.file(normalizedPath, content);
          modified = true;
        }
      } else if (normalizedPath !== filename) {
        const content = await file.async('nodebuffer');
        zip.remove(filename);
        zip.file(normalizedPath, content);
        modified = true;
      }
    }

    if (modified) {
      return await zip.generateAsync({ type: 'nodebuffer' });
    }
  } catch (e) {
    console.log("Normalization error:", e.message);
  }
  return buffer;
}

async function run() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Sheet1');
  ws.addRow(['Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer', 'Marks', 'Negative Marks', 'Explanation']);
  ws.addRow(['Which HTML tag is used for the largest heading?', '<h6>', '<h1>', '<heading>', '<head>', 'B', 1, 0, '<h1> is largest']);
  const buffer = await wb.xlsx.writeBuffer();

  // Create namespaced buffer (which failed earlier)
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

  // Now clean the bad buffer
  const cleanedBuffer = await normalizeXlsxBuffer(badBuffer);

  // Try loading cleaned buffer in ExcelJS
  const wbClean = new ExcelJS.Workbook();
  await wbClean.xlsx.load(cleanedBuffer);
  console.log("Cleaned buffer loaded successfully! Rows:", wbClean.worksheets[0].rowCount);
  console.log("Row 2 Question:", wbClean.worksheets[0].getRow(2).getCell(1).value);
  console.log("Row 2 Option B:", wbClean.worksheets[0].getRow(2).getCell(3).value);
}

run().catch(console.error);
