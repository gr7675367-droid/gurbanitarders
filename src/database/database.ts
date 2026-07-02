// ============================================================
// GURBANI TRADERS - Database Layer (SQLite)
// Full relational schema for all business data
// ============================================================

import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export const getDatabase = (): SQLite.SQLiteDatabase => {
  if (!db) {
    db = SQLite.openDatabaseSync('gurbani_traders.db');
  }
  return db;
};

// ────────────────────────────────────────────────────────────
// INITIALIZE ALL TABLES
// ────────────────────────────────────────────────────────────
export const initializeDatabase = async (): Promise<void> => {
  const database = getDatabase();

  // Settings table
  database.execSync(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Categories table
  database.execSync(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Custom units table
  database.execSync(`
    CREATE TABLE IF NOT EXISTS custom_units (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Products table
  database.execSync(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'General',
      brand TEXT,
      purchase_price REAL NOT NULL DEFAULT 0,
      selling_price REAL NOT NULL DEFAULT 0,
      quantity REAL NOT NULL DEFAULT 0,
      unit TEXT NOT NULL DEFAULT 'Piece',
      low_stock_threshold REAL DEFAULT 10,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Stock history table - tracks all in/out/adjustment
  database.execSync(`
    CREATE TABLE IF NOT EXISTS stock_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('add','reduce','adjustment','sale','purchase')),
      quantity REAL NOT NULL,
      previous_quantity REAL NOT NULL,
      new_quantity REAL NOT NULL,
      note TEXT,
      reference_id INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
  `);

  // Customers table
  database.execSync(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      mobile TEXT,
      address TEXT,
      credit_balance REAL DEFAULT 0,
      total_purchases REAL DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Suppliers table
  database.execSync(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      total_purchases REAL DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Bills (Sales) table
  database.execSync(`
    CREATE TABLE IF NOT EXISTS bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_number TEXT NOT NULL UNIQUE,
      customer_id INTEGER,
      customer_name TEXT,
      subtotal REAL NOT NULL DEFAULT 0,
      discount REAL DEFAULT 0,
      discount_type TEXT DEFAULT 'amount',
      total REAL NOT NULL DEFAULT 0,
      paid_amount REAL DEFAULT 0,
      credit_amount REAL DEFAULT 0,
      payment_method TEXT DEFAULT 'cash',
      status TEXT DEFAULT 'completed' CHECK(status IN ('completed','cancelled','credit')),
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );
  `);

  // Bill items table
  database.execSync(`
    CREATE TABLE IF NOT EXISTS bill_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      purchase_price REAL NOT NULL,
      selling_price REAL NOT NULL,
      discount REAL DEFAULT 0,
      total REAL NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (bill_id) REFERENCES bills(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
  `);

  // Purchase orders table (from suppliers)
  database.execSync(`
    CREATE TABLE IF NOT EXISTS purchase_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT NOT NULL UNIQUE,
      supplier_id INTEGER,
      supplier_name TEXT,
      total REAL NOT NULL DEFAULT 0,
      paid_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'received',
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    );
  `);

  // Purchase order items
  database.execSync(`
    CREATE TABLE IF NOT EXISTS purchase_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      purchase_price REAL NOT NULL,
      total REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES purchase_orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
  `);

  // Customer payments (Udhaar payments)
  database.execSync(`
    CREATE TABLE IF NOT EXISTS customer_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      bill_id INTEGER,
      amount REAL NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('payment','credit','refund')),
      note TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (bill_id) REFERENCES bills(id)
    );
  `);

  // Activity log
  database.execSync(`
    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      reference_id INTEGER,
      reference_type TEXT,
      amount REAL,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Insert default settings
  const defaultSettings = [
    ['business_name', 'GURBANI TRADERS'],
    ['shop_address', 'Karachi, Pakistan'],
    ['contact1', '03334223716'],
    ['contact2', '03113581308'],
    ['currency', 'Rs.'],
    ['currency_code', 'PKR'],
    ['dark_mode', '0'],
    ['low_stock_threshold', '10'],
    ['tax_enabled', '0'],
    ['tax_rate', '0'],
  ];

  for (const [key, value] of defaultSettings) {
    database.execSync(
      `INSERT OR IGNORE INTO settings (key, value) VALUES ('${key}', '${value}');`
    );
  }

  // Insert default categories
  const defaultCategories = [
    'General', 'Food & Grocery', 'Beverages', 'Household',
    'Electronics', 'Clothing', 'Stationery', 'Medicine', 'Other'
  ];
  for (const cat of defaultCategories) {
    database.execSync(
      `INSERT OR IGNORE INTO categories (name) VALUES ('${cat}');`
    );
  }

  console.log('✅ Database initialized successfully');
};

// ────────────────────────────────────────────────────────────
// HELPER: Generate unique IDs
// ────────────────────────────────────────────────────────────
export const generateBillNumber = (): string => {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const time = now.getTime().toString().slice(-5);
  return `GT-${date}-${time}`;
};

export const generateOrderNumber = (): string => {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const time = now.getTime().toString().slice(-5);
  return `PO-${date}-${time}`;
};
