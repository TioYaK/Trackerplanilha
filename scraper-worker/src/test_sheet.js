import fs from 'fs';

function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

async function testFetchSheet() {
  const url = 'https://docs.google.com/spreadsheets/d/11ODx6WKc8qrlp_QLffMLgn9M95o42JiDhgUnG1w9K5Y/export?format=csv';
  console.log('Fetching:', url);
  const res = await fetch(url);
  const text = await res.text();
  const lines = text.split('\n').filter(Boolean);
  
  console.log(`Total linhas: ${lines.length}`);
  
  let found = 0;
  // Procurar pelas ultimas 50 linhas para ver se achamos o "Xeroza pomba" e como as colunas estão vindo
  for (let i = Math.max(1, lines.length - 100); i < lines.length; i++) {
      if (lines[i].toLowerCase().includes('xeroza')) {
          console.log(`\nAchou na linha ${i+1}:`);
          console.log('RAW:', lines[i]);
          const cols = parseCsvLine(lines[i]);
          console.log('COLS:');
          cols.forEach((c, idx) => console.log(`  [${idx}]: ${c}`));
          
          const sistema = (cols[1] || '').replace(/"/g, '').trim().toLowerCase();
          const rawChar = (cols[2] || '').replace(/"/g, '').trim();
          const statusD = (cols[3] || '').replace(/"/g, '').trim().toLowerCase();
          const statusF = (cols[5] || '').replace(/"/g, '').trim().toLowerCase();
          const servidor = (cols[6] || '').replace(/"/g, '').trim() || 'Auroria';

          console.log('\nVARIÁVEIS VISTAS PELO BOT:');
          console.log(`  - Sistema (Index 1): '${sistema}'`);
          console.log(`  - Character (Index 2): '${rawChar}'`);
          console.log(`  - StatusD (Index 3): '${statusD}'`);
          console.log(`  - StatusF (Index 5): '${statusF}'`);
          console.log(`  - Servidor (Index 6): '${servidor}'`);
          
          found++;
      }
  }
  
  if (found === 0) console.log('\nNão achou o texto "xeroza" nas últimas 100 linhas!');
}

testFetchSheet();
