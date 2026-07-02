// ============================================================
// GURBANI TRADERS - Suppliers Service
// ============================================================

import { getDatabase, generateOrderNumber } from './database';

export interface Supplier {
  id: number;
  name: string;
  phone?: string;
  address?: string;
  total_purchases: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrder {
  id: number;
  order_number: string;
  supplier_id?: number;
  supplier_name?: string;
  total: number;
  paid_amount: number;
  status: string;
  notes?: string;
  created_at: string;
}

// ─── GET ALL SUPPLIERS ────────────────────────────────────────
export const getAllSuppliers = (search?: string): Supplier[] => {
  const db = getDatabase();
  let query = `SELECT * FROM suppliers WHERE is_active = 1`;
  if (search) query += ` AND (name LIKE '%${search}%' OR phone LIKE '%${search}%')`;
  query += ` ORDER BY name ASC`;
  return db.getAllSync(query) as Supplier[];
};

// ─── GET SUPPLIER BY ID ───────────────────────────────────────
export const getSupplierById = (id: number): Supplier | null => {
  const db = getDatabase();
  const result = db.getAllSync(`SELECT * FROM suppliers WHERE id = ?`, [id]) as Supplier[];
  return result[0] || null;
};

// ─── ADD SUPPLIER ─────────────────────────────────────────────
export const addSupplier = (data: Pick<Supplier, 'name' | 'phone' | 'address'>): number => {
  const db = getDatabase();
  db.execSync(`
    INSERT INTO suppliers (name, phone, address)
    VALUES (
      '${escapeSql(data.name)}',
      ${data.phone ? `'${escapeSql(data.phone)}'` : 'NULL'},
      ${data.address ? `'${escapeSql(data.address)}'` : 'NULL'}
    )
  `);
  const result = db.getAllSync(`SELECT last_insert_rowid() as id`) as any[];
  return result[0].id;
};

// ─── UPDATE SUPPLIER ──────────────────────────────────────────
export const updateSupplier = (id: number, data: Partial<Supplier>): void => {
  const db = getDatabase();
  const fields: string[] = [];
  if (data.name !== undefined) fields.push(`name = '${escapeSql(data.name)}'`);
  if (data.phone !== undefined) fields.push(`phone = ${data.phone ? `'${escapeSql(data.phone)}'` : 'NULL'}`);
  if (data.address !== undefined) fields.push(`address = ${data.address ? `'${escapeSql(data.address)}'` : 'NULL'}`);
  fields.push(`updated_at = datetime('now')`);
  db.execSync(`UPDATE suppliers SET ${fields.join(', ')} WHERE id = ${id}`);
};

// ─── DELETE SUPPLIER ──────────────────────────────────────────
export const deleteSupplier = (id: number): void => {
  const db = getDatabase();
  db.execSync(`UPDATE suppliers SET is_active = 0 WHERE id = ${id}`);
};

// ─── CREATE PURCHASE ORDER ────────────────────────────────────
export const createPurchaseOrder = (data: {
  supplier_id?: number;
  supplier_name?: string;
  items: Array<{
    product_id: number;
    product_name: string;
    quantity: number;
    unit: string;
    purchase_price: number;
  }>;
  paid_amount?: number;
  notes?: string;
}): number => {
  const db = getDatabase();
  const orderNumber = generateOrderNumber();
  const total = data.items.reduce((sum, item) => sum + item.quantity * item.purchase_price, 0);

  db.execSync(`
    INSERT INTO purchase_orders (order_number, supplier_id, supplier_name, total, paid_amount, notes)
    VALUES (
      '${orderNumber}',
      ${data.supplier_id || 'NULL'},
      ${data.supplier_name ? `'${escapeSql(data.supplier_name)}'` : 'NULL'},
      ${total}, ${data.paid_amount || total},
      ${data.notes ? `'${escapeSql(data.notes)}'` : 'NULL'}
    )
  `);

  const result = db.getAllSync(`SELECT last_insert_rowid() as id`) as any[];
  const orderId = result[0].id;

  for (const item of data.items) {
    db.execSync(`
      INSERT INTO purchase_items (order_id, product_id, product_name, quantity, unit, purchase_price, total)
      VALUES (${orderId}, ${item.product_id}, '${escapeSql(item.product_name)}',
        ${item.quantity}, '${escapeSql(item.unit)}', ${item.purchase_price}, ${item.quantity * item.purchase_price})
    `);

    // Update product stock and purchase price
    const product = db.getAllSync(`SELECT * FROM products WHERE id = ?`, [item.product_id]) as any[];
    if (product[0]) {
      const newQty = product[0].quantity + item.quantity;
      db.execSync(`
        UPDATE products SET quantity = ${newQty}, purchase_price = ${item.purchase_price}, updated_at = datetime('now')
        WHERE id = ${item.product_id}
      `);
      db.execSync(`
        INSERT INTO stock_history (product_id, type, quantity, previous_quantity, new_quantity, note, reference_id)
        VALUES (${item.product_id}, 'purchase', ${item.quantity}, ${product[0].quantity}, ${newQty}, 'Purchase: ${orderNumber}', ${orderId})
      `);
    }
  }

  // Update supplier total
  if (data.supplier_id) {
    db.execSync(`
      UPDATE suppliers SET total_purchases = total_purchases + ${total}, updated_at = datetime('now')
      WHERE id = ${data.supplier_id}
    `);
  }

  db.execSync(`
    INSERT INTO activity_log (type, description, reference_id, reference_type, amount)
    VALUES ('purchase', 'Purchase order: ${orderNumber} | Total: ${total}', ${orderId}, 'purchase', ${total})
  `);

  return orderId;
};

// ─── GET PURCHASE ORDERS ──────────────────────────────────────
export const getPurchaseOrders = (supplierId?: number): PurchaseOrder[] => {
  const db = getDatabase();
  let query = `SELECT * FROM purchase_orders`;
  if (supplierId) query += ` WHERE supplier_id = ${supplierId}`;
  query += ` ORDER BY created_at DESC LIMIT 100`;
  return db.getAllSync(query) as PurchaseOrder[];
};

const escapeSql = (str: string): string => str.replace(/'/g, "''");
