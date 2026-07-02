// ============================================================
// GURBANI TRADERS - Settings Service
// ============================================================

import { getDatabase } from './database';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export interface AppSettings {
  business_name: string;
  shop_address: string;
  contact1: string;
  contact2: string;
  currency: string;
  currency_code: string;
  dark_mode: string;
  low_stock_threshold: string;
  tax_enabled: string;
  tax_rate: string;
}

// ─── GET ALL SETTINGS ─────────────────────────────────────────
export const getAllSettings = (): AppSettings => {
  const db = getDatabase();
  const rows = db.getAllSync(`SELECT key, value FROM settings`) as Array<{ key: string; value: string }>;
  const settings: any = {};
  rows.forEach(row => { settings[row.key] = row.value; });
  return settings as AppSettings;
};

// ─── GET SETTING ──────────────────────────────────────────────
export const getSetting = (key: string): string | null => {
  const db = getDatabase();
  const result = db.getAllSync(`SELECT value FROM settings WHERE key = ?`, [key]) as any[];
  return result[0]?.value || null;
};

// ─── SET SETTING ──────────────────────────────────────────────
export const setSetting = (key: string, value: string): void => {
  const db = getDatabase();
  db.execSync(`
    INSERT INTO settings (key, value) VALUES ('${key}', '${escapeSql(value)}')
    ON CONFLICT(key) DO UPDATE SET value = '${escapeSql(value)}', updated_at = datetime('now')
  `);
};

// ─── BACKUP DATABASE ──────────────────────────────────────────
export const backupDatabase = async (): Promise<string> => {
  const db = getDatabase();

  // Export all tables to JSON
  const tables = ['products', 'customers', 'suppliers', 'bills', 'bill_items',
    'purchase_orders', 'purchase_items', 'customer_payments', 'categories', 'custom_units', 'settings'];

  const backup: any = { version: 1, created_at: new Date().toISOString(), tables: {} };

  for (const table of tables) {
    backup.tables[table] = db.getAllSync(`SELECT * FROM ${table}`);
  }

  const backupJson = JSON.stringify(backup, null, 2);
  const fileName = `gurbani_traders_backup_${new Date().toISOString().slice(0, 10)}.json`;
  const filePath = `${FileSystem.documentDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(filePath, backupJson);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(filePath, {
      mimeType: 'application/json',
      dialogTitle: 'Save Backup File',
    });
  }

  return filePath;
};

// ─── RESTORE DATABASE ─────────────────────────────────────────
export const restoreDatabase = async (jsonData: string): Promise<void> => {
  const db = getDatabase();
  const backup = JSON.parse(jsonData);

  // Clear and restore each table (except settings which we merge)
  const tablesToRestore = ['categories', 'custom_units', 'products', 'customers', 'suppliers',
    'bills', 'bill_items', 'purchase_orders', 'purchase_items', 'customer_payments'];

  for (const table of tablesToRestore) {
    if (backup.tables[table]) {
      db.execSync(`DELETE FROM ${table}`);
      for (const row of backup.tables[table]) {
        const cols = Object.keys(row).join(', ');
        const vals = Object.values(row).map(v =>
          v === null ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`
        ).join(', ');
        db.execSync(`INSERT OR IGNORE INTO ${table} (${cols}) VALUES (${vals})`);
      }
    }
  }
};

// ─── GET ACTIVITY LOG ─────────────────────────────────────────
export const getActivityLog = (limit = 20): any[] => {
  const db = getDatabase();
  return db.getAllSync(
    `SELECT * FROM activity_log ORDER BY created_at DESC LIMIT ${limit}`
  );
};

const escapeSql = (str: string): string => str.replace(/'/g, "''");
