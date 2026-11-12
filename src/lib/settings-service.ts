import { getDb } from "./database";
import { generateId } from "./id-generator";

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDb();
  const rows = await db.select<any[]>(
    "SELECT setting_value FROM app_settings WHERE setting_key = $1",
    [key]
  );
  return rows.length > 0 ? rows[0].setting_value : null;
}

export async function saveSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  const existing = await db.select<any[]>(
    "SELECT id FROM app_settings WHERE setting_key = $1",
    [key]
  );
  const now = new Date().toISOString();
  if (existing.length > 0) {
    await db.execute(
      "UPDATE app_settings SET setting_value = $1, updated_at = $2 WHERE id = $3",
      [value, now, existing[0].id]
    );
  } else {
    await db.execute(
      "INSERT INTO app_settings (id, setting_key, setting_value, updated_at) VALUES ($1, $2, $3, $4)",
      [generateId("setting"), key, value, now]
    );
  }
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const db = await getDb();
  const rows = await db.select<any[]>("SELECT setting_key, setting_value FROM app_settings");
  const settings: Record<string, string> = {};
  for (const row of rows) {
    settings[row.setting_key] = row.setting_value || "";
  }
  return settings;
}
