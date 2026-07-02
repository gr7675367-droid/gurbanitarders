// ============================================================
// GURBANI TRADERS - Billing Service
// Sales bills with credit/Udhaar support
// ============================================================

import { getDatabase, generateBillNumber } from './database';
import { getProductById } from './products';

export interface BillItem {
  product_id: number;
  product_name: string;
  quantity: number;
  unit: string;
  purchase_price: number;
  selling_price: number;
  discount: number;
  total: number;
}

export interface Bill {
  id: number;
  bill_number: string;
  customer_id?: number;
  customer_name?: string;
  subtotal: number;
  discount: number;
  discount_type: string;
  total: number;
  paid_amount: number;
  credit_amount: number;
  payment_method: string;
  status: string;
  notes?: string;
  created_at: string;
  items?: BillItem[];
}

export interface CreateBillData {
  customer_id?: number;
  customer_name?: string;
  items: Omit<BillItem, 'total'>[];
  discount?: number;
  discount_type?: 'amount' | 'percent';
  paid_amount: number;
  payment_method?: string;
  notes?: string;
}

// ─── CREATE BILL ─────────────────────────────────────────────
export const createBill = (data: CreateBillData): { bill_id: number; bill_number: string } => {
  const db = getDatabase();

  // Calculate totals
  let subtotal = 0;
  const itemsWithTotals = data.items.map(item => {
    const itemTotal = (item.selling_price * item.quantity) - item.discount;
    subtotal += itemTotal;
    return { ...item, total: itemTotal };
  });

  let discountAmount = 0;
  if (data.discount && data.discount > 0) {
    if (data.discount_type === 'percent') {
      discountAmount = (subtotal * data.discount) / 100;
    } else {
      discountAmount = data.discount;
    }
  }

  const total = Math.max(0, subtotal - discountAmount);
  const paidAmount = Math.min(data.paid_amount, total);
  const creditAmount = Math.max(0, total - paidAmount);
  const status = creditAmount > 0 ? 'credit' : 'completed';
  const billNumber = generateBillNumber();

  // Insert bill
  db.execSync(`
    INSERT INTO bills (
      bill_number, customer_id, customer_name, subtotal, discount, discount_type,
      total, paid_amount, credit_amount, payment_method, status, notes
    ) VALUES (
      '${billNumber}',
      ${data.customer_id || 'NULL'},
      ${data.customer_name ? `'${escapeSql(data.customer_name)}'` : 'NULL'},
      ${subtotal}, ${discountAmount}, '${data.discount_type || 'amount'}',
      ${total}, ${paidAmount}, ${creditAmount},
      '${data.payment_method || 'cash'}', '${status}',
      ${data.notes ? `'${escapeSql(data.notes)}'` : 'NULL'}
    )
  `);

  const billResult = db.getAllSync(`SELECT last_insert_rowid() as id`) as any[];
  const billId = billResult[0].id;

  // Insert bill items and update stock
  for (const item of itemsWithTotals) {
    db.execSync(`
      INSERT INTO bill_items (
        bill_id, product_id, product_name, quantity, unit,
        purchase_price, selling_price, discount, total
      ) VALUES (
        ${billId}, ${item.product_id}, '${escapeSql(item.product_name)}',
        ${item.quantity}, '${escapeSql(item.unit)}',
        ${item.purchase_price}, ${item.selling_price}, ${item.discount}, ${item.total}
      )
    `);

    // Reduce stock
    const product = getProductById(item.product_id);
    if (product) {
      const newQty = Math.max(0, product.quantity - item.quantity);
      db.execSync(`
        UPDATE products SET quantity = ${newQty}, updated_at = datetime('now')
        WHERE id = ${item.product_id}
      `);
      db.execSync(`
        INSERT INTO stock_history (product_id, type, quantity, previous_quantity, new_quantity, note, reference_id)
        VALUES (${item.product_id}, 'sale', ${item.quantity}, ${product.quantity}, ${newQty}, 'Sale: ${billNumber}', ${billId})
      `);
    }
  }

  // Update customer credit if applicable
  if (data.customer_id && creditAmount > 0) {
    db.execSync(`
      UPDATE customers
      SET credit_balance = credit_balance + ${creditAmount},
          total_purchases = total_purchases + ${total},
          updated_at = datetime('now')
      WHERE id = ${data.customer_id}
    `);

    // Log credit
    db.execSync(`
      INSERT INTO customer_payments (customer_id, bill_id, amount, type, note)
      VALUES (${data.customer_id}, ${billId}, ${creditAmount}, 'credit', 'Credit from bill ${billNumber}')
    `);
  } else if (data.customer_id) {
    db.execSync(`
      UPDATE customers
      SET total_purchases = total_purchases + ${total},
          updated_at = datetime('now')
      WHERE id = ${data.customer_id}
    `);
  }

  // Log activity
  db.execSync(`
    INSERT INTO activity_log (type, description, reference_id, reference_type, amount)
    VALUES ('sale', 'Bill created: ${billNumber} | Total: ${total}', ${billId}, 'bill', ${total})
  `);

  return { bill_id: billId, bill_number: billNumber };
};

// ─── GET BILLS ────────────────────────────────────────────────
export const getBills = (limit = 50, customerId?: number): Bill[] => {
  const db = getDatabase();
  let query = `SELECT * FROM bills`;
  if (customerId) query += ` WHERE customer_id = ${customerId}`;
  query += ` ORDER BY created_at DESC LIMIT ${limit}`;
  return db.getAllSync(query) as Bill[];
};

// ─── GET BILL BY ID WITH ITEMS ────────────────────────────────
export const getBillById = (id: number): Bill | null => {
  const db = getDatabase();
  const bills = db.getAllSync(`SELECT * FROM bills WHERE id = ?`, [id]) as Bill[];
  if (!bills[0]) return null;

  const items = db.getAllSync(`SELECT * FROM bill_items WHERE bill_id = ?`, [id]) as BillItem[];
  return { ...bills[0], items };
};

// ─── TODAY SALES SUMMARY ─────────────────────────────────────
export const getTodaySalesSummary = (): { total: number; count: number; profit: number } => {
  const db = getDatabase();
  const result = db.getAllSync(`
    SELECT
      COALESCE(SUM(b.total), 0) as total,
      COUNT(b.id) as count
    FROM bills b
    WHERE DATE(b.created_at) = DATE('now') AND b.status != 'cancelled'
  `) as any[];

  const profitResult = db.getAllSync(`
    SELECT COALESCE(SUM((bi.selling_price - bi.purchase_price) * bi.quantity), 0) as profit
    FROM bill_items bi
    JOIN bills b ON bi.bill_id = b.id
    WHERE DATE(b.created_at) = DATE('now') AND b.status != 'cancelled'
  `) as any[];

  return {
    total: result[0]?.total || 0,
    count: result[0]?.count || 0,
    profit: profitResult[0]?.profit || 0,
  };
};

// ─── MONTHLY SALES ────────────────────────────────────────────
export const getMonthlySales = (month?: string): { total: number; count: number; profit: number } => {
  const db = getDatabase();
  const monthStr = month || new Date().toISOString().slice(0, 7); // YYYY-MM

  const result = db.getAllSync(`
    SELECT COALESCE(SUM(total), 0) as total, COUNT(id) as count
    FROM bills
    WHERE strftime('%Y-%m', created_at) = '${monthStr}' AND status != 'cancelled'
  `) as any[];

  const profitResult = db.getAllSync(`
    SELECT COALESCE(SUM((bi.selling_price - bi.purchase_price) * bi.quantity), 0) as profit
    FROM bill_items bi
    JOIN bills b ON bi.bill_id = b.id
    WHERE strftime('%Y-%m', b.created_at) = '${monthStr}' AND b.status != 'cancelled'
  `) as any[];

  return {
    total: result[0]?.total || 0,
    count: result[0]?.count || 0,
    profit: profitResult[0]?.profit || 0,
  };
};

// ─── SALES REPORT ─────────────────────────────────────────────
export const getSalesReport = (from: string, to: string) => {
  const db = getDatabase();
  const bills = db.getAllSync(`
    SELECT * FROM bills
    WHERE DATE(created_at) BETWEEN '${from}' AND '${to}'
    AND status != 'cancelled'
    ORDER BY created_at DESC
  `) as Bill[];

  const summary = db.getAllSync(`
    SELECT
      COALESCE(SUM(total), 0) as total_sales,
      COALESCE(SUM(paid_amount), 0) as total_paid,
      COALESCE(SUM(credit_amount), 0) as total_credit,
      COUNT(id) as bill_count
    FROM bills
    WHERE DATE(created_at) BETWEEN '${from}' AND '${to}'
    AND status != 'cancelled'
  `) as any[];

  const profit = db.getAllSync(`
    SELECT COALESCE(SUM((bi.selling_price - bi.purchase_price) * bi.quantity), 0) as total_profit
    FROM bill_items bi
    JOIN bills b ON bi.bill_id = b.id
    WHERE DATE(b.created_at) BETWEEN '${from}' AND '${to}'
    AND b.status != 'cancelled'
  `) as any[];

  return { bills, summary: summary[0], profit: profit[0]?.total_profit || 0 };
};

const escapeSql = (str: string): string => str.replace(/'/g, "''");
