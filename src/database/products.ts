// ============================================================
// GURBANI TRADERS - Products Service
// CRUD operations for inventory products
// ============================================================

import { getDatabase } from './database';

export interface Product {
  id: number;
  name: string;
  category: string;
  brand?: string;
  purchase_price: number;
  selling_price: number;
  quantity: number;
  unit: string;
  low_stock_threshold: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface StockHistory {
  id: number;
  product_id: number;
  type: 'add' | 'reduce' | 'adjustment' | 'sale' | 'purchase';
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  note?: string;
  reference_id?: number;
  created_at: string;
}

// ─── GET ALL PRODUCTS ────────────────────────────────────────
export const getAllProducts = (search?: string, category?: string): Product[] => {
  const db = getDatabase();
  let query = `SELECT * FROM products WHERE is_active = 1`;
  const params: any[] = [];

  if (search) {
    query += ` AND (name LIKE ? OR brand LIKE ? OR category LIKE ?)`;
    const term = `%${search}%`;
    params.push(term, term, term);
  }
  if (category && category !== 'All') {
    query += ` AND category = ?`;
    params.push(category);
  }

  query += ` ORDER BY name ASC`;
  return db.getAllSync(query, params) as Product[];
};

// ─── GET PRODUCT BY ID ───────────────────────────────────────
export const getProductById = (id: number): Product | null => {
  const db = getDatabase();
  const result = db.getAllSync(
    `SELECT * FROM products WHERE id = ?`,
    [id]
  ) as Product[];
  return result[0] || null;
};

// ─── ADD NEW PRODUCT ─────────────────────────────────────────
export const addProduct = (data: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'is_active'>): number => {
  const db = getDatabase();
  db.execSync(`
    INSERT INTO products (name, category, brand, purchase_price, selling_price, quantity, unit, low_stock_threshold)
    VALUES (
      '${escapeSql(data.name)}',
      '${escapeSql(data.category)}',
      ${data.brand ? `'${escapeSql(data.brand)}'` : 'NULL'},
      ${data.purchase_price},
      ${data.selling_price},
      ${data.quantity},
      '${escapeSql(data.unit)}',
      ${data.low_stock_threshold || 10}
    )
  `);

  const result = db.getAllSync(`SELECT last_insert_rowid() as id`) as any[];
  const id = result[0].id;

  // Log initial stock if quantity > 0
  if (data.quantity > 0) {
    logStockHistory(id, 'add', data.quantity, 0, data.quantity, 'Initial stock');
  }

  // Log activity
  logActivity('product', `New product added: ${data.name}`, id, 'product');

  return id;
};

// ─── UPDATE PRODUCT ──────────────────────────────────────────
export const updateProduct = (id: number, data: Partial<Omit<Product, 'id' | 'created_at'>>): void => {
  const db = getDatabase();
  const fields: string[] = [];

  if (data.name !== undefined) fields.push(`name = '${escapeSql(data.name)}'`);
  if (data.category !== undefined) fields.push(`category = '${escapeSql(data.category)}'`);
  if (data.brand !== undefined) fields.push(`brand = ${data.brand ? `'${escapeSql(data.brand)}'` : 'NULL'}`);
  if (data.purchase_price !== undefined) fields.push(`purchase_price = ${data.purchase_price}`);
  if (data.selling_price !== undefined) fields.push(`selling_price = ${data.selling_price}`);
  if (data.unit !== undefined) fields.push(`unit = '${escapeSql(data.unit)}'`);
  if (data.low_stock_threshold !== undefined) fields.push(`low_stock_threshold = ${data.low_stock_threshold}`);
  fields.push(`updated_at = datetime('now')`);

  db.execSync(`UPDATE products SET ${fields.join(', ')} WHERE id = ${id}`);
};

// ─── DELETE (SOFT DELETE) PRODUCT ───────────────────────────
export const deleteProduct = (id: number): void => {
  const db = getDatabase();
  db.execSync(`UPDATE products SET is_active = 0 WHERE id = ${id}`);
};

// ─── ADJUST STOCK ─────────────────────────────────────────────
export const adjustStock = (
  productId: number,
  type: 'add' | 'reduce' | 'adjustment',
  quantity: number,
  note?: string
): void => {
  const db = getDatabase();
  const product = getProductById(productId);
  if (!product) throw new Error('Product not found');

  let newQuantity = product.quantity;
  if (type === 'add') newQuantity += quantity;
  else if (type === 'reduce') newQuantity = Math.max(0, newQuantity - quantity);
  else if (type === 'adjustment') newQuantity = quantity;

  db.execSync(`
    UPDATE products SET quantity = ${newQuantity}, updated_at = datetime('now')
    WHERE id = ${productId}
  `);

  logStockHistory(productId, type, quantity, product.quantity, newQuantity, note);
  logActivity('stock', `Stock ${type}: ${product.name} (${quantity} ${product.unit})`, productId, 'product');
};

// ─── GET LOW STOCK PRODUCTS ──────────────────────────────────
export const getLowStockProducts = (): Product[] => {
  const db = getDatabase();
  return db.getAllSync(
    `SELECT * FROM products WHERE is_active = 1 AND quantity <= low_stock_threshold ORDER BY quantity ASC`
  ) as Product[];
};

// ─── GET TOTAL STOCK VALUE ───────────────────────────────────
export const getTotalStockValue = (): { purchase_value: number; selling_value: number } => {
  const db = getDatabase();
  const result = db.getAllSync(`
    SELECT
      SUM(quantity * purchase_price) as purchase_value,
      SUM(quantity * selling_price) as selling_value
    FROM products WHERE is_active = 1
  `) as any[];
  return {
    purchase_value: result[0]?.purchase_value || 0,
    selling_value: result[0]?.selling_value || 0,
  };
};

// ─── STOCK HISTORY ───────────────────────────────────────────
export const getStockHistory = (productId?: number, limit = 50): StockHistory[] => {
  const db = getDatabase();
  let query = `
    SELECT sh.*, p.name as product_name, p.unit
    FROM stock_history sh
    JOIN products p ON sh.product_id = p.id
  `;
  if (productId) query += ` WHERE sh.product_id = ${productId}`;
  query += ` ORDER BY sh.created_at DESC LIMIT ${limit}`;
  return db.getAllSync(query) as StockHistory[];
};

// ─── GET CATEGORIES ──────────────────────────────────────────
export const getCategories = (): string[] => {
  const db = getDatabase();
  const result = db.getAllSync(`SELECT name FROM categories ORDER BY name ASC`) as any[];
  return result.map(r => r.name);
};

export const addCategory = (name: string): void => {
  const db = getDatabase();
  db.execSync(`INSERT OR IGNORE INTO categories (name) VALUES ('${escapeSql(name)}')`);
};

// ─── GET CUSTOM UNITS ────────────────────────────────────────
export const getCustomUnits = (): string[] => {
  const db = getDatabase();
  const result = db.getAllSync(`SELECT name FROM custom_units ORDER BY name ASC`) as any[];
  return result.map(r => r.name);
};

export const addCustomUnit = (name: string): void => {
  const db = getDatabase();
  db.execSync(`INSERT OR IGNORE INTO custom_units (name) VALUES ('${escapeSql(name)}')`);
};

// ─── INTERNAL HELPERS ─────────────────────────────────────────
const logStockHistory = (
  productId: number,
  type: string,
  quantity: number,
  prevQty: number,
  newQty: number,
  note?: string
): void => {
  const db = getDatabase();
  db.execSync(`
    INSERT INTO stock_history (product_id, type, quantity, previous_quantity, new_quantity, note)
    VALUES (${productId}, '${type}', ${quantity}, ${prevQty}, ${newQty}, ${note ? `'${escapeSql(note)}'` : 'NULL'})
  `);
};

const logActivity = (type: string, description: string, refId?: number, refType?: string, amount?: number): void => {
  const db = getDatabase();
  db.execSync(`
    INSERT INTO activity_log (type, description, reference_id, reference_type, amount)
    VALUES ('${type}', '${escapeSql(description)}', ${refId || 'NULL'}, ${refType ? `'${refType}'` : 'NULL'}, ${amount || 'NULL'})
  `);
};

const escapeSql = (str: string): string => str.replace(/'/g, "''");
