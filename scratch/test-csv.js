function parseCsvText(text) {
  const lines = [];
  let row = [];
  let cell = '';
  let inQuotes = false;
  
  // Normalize CRLF to LF
  const cleanText = text.replace(/^\uFEFF/, ''); // Strip UTF-8 BOM
  
  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        cell += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((char === ',' || char === '\t' || char === ';') && !inQuotes) {
      row.push(cell.trim());
      cell = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      row.push(cell.trim());
      cell = '';
      if (row.some(c => c !== '')) {
        lines.push(row);
      }
      row = [];
    } else {
      cell += char;
    }
  }
  
  if (cell !== '' || row.length > 0) {
    row.push(cell.trim());
    if (row.some(c => c !== '')) {
      lines.push(row);
    }
  }
  
  return lines;
}

const sampleCsv = `Question,Option A,Option B,Option C,Option D,Correct Answer,Marks,Negative Marks,Explanation
"What does HTML stand for?",Hyper Text Markup Language,High Text Markup Language,Hyperlink and Text Markup Language,Home Tool Markup Language,A,1,0,"HTML stands for Hyper Text Markup Language"
"Which HTML tag is used for the largest heading?","<h6>","<h1>","<heading>","<head>",B,1,0,"<h1> is largest"`;

console.log(parseCsvText(sampleCsv));
