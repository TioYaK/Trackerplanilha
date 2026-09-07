import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import fs from 'fs';
import path from 'path';

const SHEET_ID = '11ODx6WKc8qrlp_QLffMLgn9M95o42JiDhgUnG1w9K5Y';
const CREDENTIALS_PATH = path.join(process.cwd(), 'google-credentials.json');

let docCache = null;

async function getDoc() {
  if (docCache) return docCache;
  
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    return null; // Retorna nulo graciosamente se as credenciais não existirem
  }

  try {
    const creds = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));

    const jwt = new JWT({
      email: creds.client_email,
      key: creds.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(SHEET_ID, jwt);
    await doc.loadInfo();
    docCache = doc;
    return doc;
  } catch (err) {
    console.error('[GoogleSheets] Erro ao inicializar API:', err.message);
    return null;
  }
}

/**
 * Atualiza o status de uma linha específica na planilha.
 * @param {number} rowIndex Linha exata da planilha (1-based, ex: 2389)
 * @param {Object} updates { statusD: "Processando", workerE: "Nome", statusF: "Sucesso" }
 */
export async function updateSheetRow(rowIndex, updates) {
  const doc = await getDoc();
  if (!doc) return false; // Ignora se não houver acesso configurado

  try {
    const sheet = doc.sheetsByIndex[0]; // Assume que é a primeira aba
    
    // Carrega apenas as células D, E e F daquela linha específica para poupar memória e tempo
    await sheet.loadCells(`D${rowIndex}:F${rowIndex}`);
    
    let hasChanges = false;

    if (updates.statusD !== undefined) {
      const cellD = sheet.getCellByA1(`D${rowIndex}`);
      cellD.value = updates.statusD;
      hasChanges = true;
    }
    
    if (updates.workerE !== undefined) {
      const cellE = sheet.getCellByA1(`E${rowIndex}`);
      cellE.value = updates.workerE;
      hasChanges = true;
    }
    
    if (updates.statusF !== undefined) {
      const cellF = sheet.getCellByA1(`F${rowIndex}`);
      cellF.value = updates.statusF;
      hasChanges = true;
    }
    
    if (hasChanges) {
      await sheet.saveUpdatedCells();
      return true;
    }
    return false;
  } catch (err) {
    console.error(`[GoogleSheets] Erro ao atualizar linha ${rowIndex}:`, err.message);
    return false;
  }
}


