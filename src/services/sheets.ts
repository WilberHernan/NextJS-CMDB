import { sheets } from "@googleapis/sheets";

let sheetsClient: ReturnType<typeof sheets> | null = null;

function fixPrivateKey(pk: string): string {
  return pk.replace(/\\n/g, "\n").replace(/"?-----/g, "-----").trim();
}

async function loadCredentials(): Promise<{
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
      console.warn("GOOGLE_SERVICE_ACCOUNT_KEY_JSON inválido, probando KEY_PATH...");
    }
  }

  if (keyPath) {
    const fs = await import("fs");
    const raw = fs.readFileSync(keyPath, "utf-8");
    const parsed = JSON.parse(raw);
    return {
      client_email: parsed.client_email,
      private_key: fixPrivateKey(parsed.private_key),
    };
  }

  throw new Error(
    "Se requiere GOOGLE_SERVICE_ACCOUNT_KEY_JSON (JSON válido) " +
      "o GOOGLE_SERVICE_ACCOUNT_KEY_PATH (ruta al archivo)"
  );
}

export async function getSheetsClient() {
  if (sheetsClient) return sheetsClient;

  const { JWT } = await import("google-auth-library");
  const credentials = await loadCredentials();

  const client = new JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  sheetsClient = sheets({ version: "v4", auth: client });
  return sheetsClient;
}

function getSpreadsheetId(): string {
  const id = process.env.SPREADSHEET_ID;
  if (!id) throw new Error("SPREADSHEET_ID must be set");
  return id;
}

export async function getSheetData(sheetName: string) {
  const client = await getSheetsClient();
  const res = await client.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: sheetName,
  });
  return (res.data.values as string[][]) ?? null;
}

export async function appendSheetRow(sheetName: string, values: string[]) {
  const client = await getSheetsClient();
  const res = await client.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: sheetName,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [values] },
  });
  return res.data;
}

export async function updateSheetRow(
  sheetName: string,
  row: number,
  values: string[]
) {
  const client = await getSheetsClient();
  const res = await client.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
    range: `${sheetName}!A${row}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values] },
  });
  return res.data;
}

export async function deleteSheetRow(sheetName: string, row: number) {
  const client = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

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
    throw new Error(`Sheet "${sheetName}" not found`);
  }

  await client.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex: row - 1,
              endIndex: row,
            },
          },
        },
      ],
    },
  });
}
