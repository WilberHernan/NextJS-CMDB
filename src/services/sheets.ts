import { sheets } from '@googleapis/sheets';
import type { Sede } from '@/lib/sedes';

let sheetsClient: ReturnType<typeof sheets> | null = null;

function fixPrivateKey (pk: string): string {
  return pk.replace(/\\n/g, '\n').replace(/"?-----/g, '-----').trim();
}

async function loadCredentials (): Promise<{
  client_email: string;
  private_key: string;
}> {
  const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;
  const keyJsonRaw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_JSON;

  if (keyJsonRaw) {
    try {
      const parsed = JSON.parse(keyJsonRaw);
      if (parsed.client_email && parsed.private_key) {
        return {
          client_email: parsed.client_email,
          private_key: fixPrivateKey(parsed.private_key),
        };
      }
    } catch {
      console.warn('GOOGLE_SERVICE_ACCOUNT_KEY_JSON inválido, probando KEY_PATH...');
    }
  }

  if (keyPath) {
    const fs = await import('fs');
    const raw = fs.readFileSync(keyPath, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      client_email: parsed.client_email,
      private_key: fixPrivateKey(parsed.private_key),
    };
  }

  throw new Error(
    'Se requiere GOOGLE_SERVICE_ACCOUNT_KEY_JSON (JSON válido) ' +
      'o GOOGLE_SERVICE_ACCOUNT_KEY_PATH (ruta al archivo)'
  );
}

export async function getSheetsClient () {
  if (sheetsClient) return sheetsClient;

  const { JWT } = await import('google-auth-library');
  const credentials = await loadCredentials();

  const client = new JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  sheetsClient = sheets({ version: 'v4', auth: client });
  return sheetsClient;
}

/** Mapa de env var → sede para errores descriptivos */
const ENV_VAR_MAP: Record<Sede, string> = {
  CCYS: 'SPREADSHEET_ID_CCYS',
  REGIONAL: 'SPREADSHEET_ID_REGIONAL',
  CIUDAD_JARDIN: 'SPREADSHEET_ID_CIUDAD_JARDIN',
};

const SPREADSHEET_IDS: Record<Sede, string | undefined> = {
  CCYS: process.env.SPREADSHEET_ID_CCYS,
  REGIONAL: process.env.SPREADSHEET_ID_REGIONAL,
  CIUDAD_JARDIN: process.env.SPREADSHEET_ID_CIUDAD_JARDIN,
};

/** Retorna el Spreadsheet ID según la sede. Default: CCYS. */
function getSpreadsheetId (sede: Sede = 'CCYS'): string {
  const id = SPREADSHEET_IDS[sede];
  if (!id) {
    const varName = ENV_VAR_MAP[sede];
    throw new Error(
      `Falta ${varName} en .env — no se puede conectar con la sede ${sede}`
    );
  }
  return id;
}

export async function getSheetData (sheetName: string, sede: Sede = 'CCYS') {
  const client = await getSheetsClient();
  const res = await client.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(sede),
    range: sheetName,
  });
  const raw = res.data.values;
  if (!raw || raw.length === 0) return null;

  // Google Sheets API returns any[][] — normalize every cell to string
  // so downstream code always gets predictable types.
  return raw.map((row: unknown[]) =>
    row.map((cell: unknown) => (cell == null ? '' : String(cell)))
  );
}

export async function appendSheetRow (
  sheetName: string,
  values: string[],
  sede: Sede = 'CCYS'
) {
  const client = await getSheetsClient();
  const res = await client.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(sede),
    range: sheetName,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [values] },
  });
  return res.data;
}

export async function updateSheetRow (
  sheetName: string,
  row: number,
  values: string[],
  sede: Sede = 'CCYS'
) {
  const client = await getSheetsClient();
  const res = await client.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(sede),
    range: `${sheetName}!A${row}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [values] },
  });
  return res.data;
}

export async function getSheetId (
  sheetName: string,
  sede: Sede = 'CCYS'
): Promise<number> {
  const client = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId(sede);

  const sheetMeta = await client.spreadsheets.get({
    spreadsheetId,
    ranges: [],
    includeGridData: false,
  });
  const sheet = sheetMeta.data.sheets?.find(
    (s) => s.properties?.title === sheetName
  );
  const sheetId = sheet?.properties?.sheetId;
  if (sheetId === undefined || sheetId === null) {
    throw new Error(`Sheet "${sheetName}" not found in ${sede}`);
  }
  return sheetId;
}

export async function formatSheetRow (
  sheetName: string,
  row: number,
  hexColor: string,
  sede: Sede = 'CCYS'
) {
  const client = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId(sede);
  const id = await getSheetId(sheetName, sede);

  const r = parseInt(hexColor.slice(1, 3), 16) / 255;
  const g = parseInt(hexColor.slice(3, 5), 16) / 255;
  const b = parseInt(hexColor.slice(5, 7), 16) / 255;

  await client.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          repeatCell: {
            range: {
              sheetId: id,
              startRowIndex: row - 1,
              endRowIndex: row,
              startColumnIndex: 0,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: r, green: g, blue: b },
              },
            },
            fields: 'userEnteredFormat.backgroundColor',
          },
        },
      ],
    },
  });
}

export async function deleteSheetRow (
  sheetName: string,
  row: number,
  sede: Sede = 'CCYS'
) {
  const client = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId(sede);
  const sheetId = await getSheetId(sheetName, sede);

  await client.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: row - 1,
              endIndex: row,
            },
          },
        },
      ],
    },
  });
}
