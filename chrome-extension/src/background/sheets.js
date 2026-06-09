import { ensureUserContext, deleteRecent, recordRecent, updateRecentStatus } from "./backend";
import { authorizedGoogleRequest } from "./auth";
import { setState, state } from "./state";
import {
  COMPANY_INDEX,
  ROLE_INDEX,
  STATUS_INDEX,
  getFormattedDate,
  jaroWinklerSimilarity,
  parseExtractedEntity,
} from "./utils";

async function readSheetEntries(range) {
  const response = await authorizedGoogleRequest(
    `https://sheets.googleapis.com/v4/spreadsheets/${state.spreadsheetId}/values/${range}`
  );

  if (!response.ok) {
    throw new Error(`Failed to read spreadsheet range ${range}.`);
  }

  const data = await response.json();
  return data.values || [];
}

async function writeSheetValues(range, values) {
  const response = await authorizedGoogleRequest(
    `https://sheets.googleapis.com/v4/spreadsheets/${state.spreadsheetId}/values/${range}?valueInputOption=RAW`,
    {
      body: JSON.stringify({ values }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "PUT",
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to update spreadsheet range ${range}.`);
  }

  return response.json();
}

async function getRowRange(company, role) {
  const entries = await readSheetEntries("Sheet1!A1:D");

  for (let index = 0; index < entries.length; index += 1) {
    if (
      entries[index][COMPANY_INDEX] === company &&
      entries[index][ROLE_INDEX] === role
    ) {
      return index + 1;
    }
  }

  return null;
}

async function findPendingMatch(company, role, rowCount) {
  const entries = await readSheetEntries(`Sheet1!A1:D${rowCount}`);

  let bestIndex = 0;
  let bestScore = 0;

  for (let index = 0; index < entries.length; index += 1) {
    if (entries[index][STATUS_INDEX] !== "pending") {
      continue;
    }

    const similarity = jaroWinklerSimilarity(
      `${entries[index][COMPANY_INDEX]} ${entries[index][ROLE_INDEX]}`,
      `${company} ${role}`
    );

    if (similarity > bestScore) {
      bestScore = similarity;
      bestIndex = index;
    }
  }

  return bestIndex === 0 || bestScore <= 0.8 ? null : bestIndex + 1;
}

function normalizeManualEntry(data) {
  return {
    company: data.company,
    link: "=null",
    role: data.role,
    status: data.status,
  };
}

export async function updateSheet(data, isManual) {
  const entity = isManual ? normalizeManualEntry(data) : parseExtractedEntity(data);

  if (!entity?.company) {
    return null;
  }

  await ensureUserContext();

  const date = getFormattedDate(new Date());
  const matchingRow =
    entity.status !== "pending"
      ? await findPendingMatch(entity.company, entity.role, state.row + 1)
      : null;

  if (
    matchingRow == null &&
    entity.status !== "pending" &&
    entity.status !== "moving on"
  ) {
    return null;
  }

  const targetRow =
    matchingRow == null &&
    (entity.status === "pending" || entity.status === "moving on")
      ? state.row + 1
      : matchingRow;
  const spreadsheetRange = `Sheet1!A${targetRow}`;

  await writeSheetValues(spreadsheetRange, [
    [date, entity.company, entity.role, entity.status, entity.link],
  ]);

  if (matchingRow == null && targetRow === state.row + 1) {
    setState({ row: state.row + 1 });
  }

  await recordRecent([
    {
      email: state.email,
      recent: [entity.company, entity.role, entity.status, entity.link],
    },
  ]);

  return targetRow;
}

export async function deleteSheetRow(company, role) {
  await ensureUserContext();
  const rowRange = await getRowRange(company, role);

  if (rowRange == null) {
    return null;
  }

  const response = await authorizedGoogleRequest(
    `https://sheets.googleapis.com/v4/spreadsheets/${state.spreadsheetId}:batchUpdate`,
    {
      body: JSON.stringify({
        requests: [
          {
            deleteDimension: {
              range: {
                dimension: "ROWS",
                endIndex: rowRange,
                sheetId: 0,
                startIndex: rowRange - 1,
              },
            },
          },
        ],
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to delete row ${rowRange} from spreadsheet.`);
  }

  setState({ row: Math.max(state.row - 1, 0) });
  await deleteRecent(company, role);
  return rowRange;
}

export async function updateSheetStatus(company, role, status) {
  await ensureUserContext();
  const rowRange = await getRowRange(company, role);

  if (rowRange == null) {
    return null;
  }

  await writeSheetValues(`Sheet1!D${rowRange}`, [[status]]);
  await updateRecentStatus(company, role, status);

  return rowRange;
}
