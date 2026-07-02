// ============================================================
// GURBANI TRADERS - Customers Service
// Customer management with credit/Udhaar tracking
// ============================================================

import { getDatabase } from './database';

export interface Customer {
  id: number;
  name: string;
  mobile?: string;
  address?: string;
  credit_balance: number;
  total_purchases: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface CustomerPayment {
  id: number;
  customer_id: number;
  bill_id?: number;
  amount: number;
  type: 'payment' | 'credit' | 'refund';
  note?: string;
  created_at: string;
}

// ─── GET ALL CUSTOMERS ────────────────────────────────────────
export const getAllCustomers = (search?: string): Customer[] => {
  const db = getDatabase();
  let query = `SELECT * FROM customers WHERE is_active = 1`;
  if (search) {
    query += ` AND (name LIKE '%${search}%' OR mobile LIKE '%${search}%')`;
  }
  query += ` ORDER BY name ASC`;
  return db.getAllSync(query) as Customer[];
};

// ─── GET CUSTOMER BY ID ───────────────────────────────────────
export const getCustomerById = (id: number): Customer | null => {
  const db = getDatabase();
  const result = db.getAllSync(`SELECT * FROM customers WHERE id = ?`, [id]) as Customer[];
  return result[0] || null;
};

// ─── ADD CUSTOMER ─────────────────────────────────────────────
export const addCustomer = (data: Omit<Customer, 'id' | 'credit_balance' | 'total_purchases' | 'is_active' | 'created_at' | 'updated_at'>): number => {
  const db = getDatabase();
  db.execSync(`
    INSERT INTO customers (name, mobile, address)
    VALUES (
      '${escapeSql(data.name)}',
      ${data.mobile ? `'${escapeSql(data.mobile)}'` : 'NULL'},
      ${data.address ? `'${escapeSql(data.address)}'` : 'NULL'}
    )
  `);
  const result = db.getAllSync(`SELECT last_insert_rowid() as id`) as any[];
  return result[0].id;
};

// ─── UPDATE CUSTOMER ──────────────────────────────────────────
export const updateCustomer = (id: number, data: Partial<Customer>): void => {
  const db = getDatabase();
  const fields: string[] = [];
  if (data.name !== undefined) fields.push(`name = '${escapeSql(data.name)}'`);
  if (data.mobile !== undefined) fields.push(`mobile = ${data.mobile ? `'${escapeSql(data.mobile)}'` : 'NULL'}`);
  if (data.address !== undefined) fields.push(`address = ${data.address ? `'${escapeSql(data.address)}'` : 'NULL'}`);
  fields.push(`updated_at = datetime('now')`);
  db.execSync(`UPDATE customers SET ${fields.join(', ')} WHERE id = ${id}`);
};

// ─── DELETE CUSTOMER ──────────────────────────────────────────
export const deleteCustomer = (id: number): void => {
  const db = getDatabase();
  db.execSync(`UPDATE customers SET is_active = 0 WHERE id = ${id}`);
};

// ─── RECORD PAYMENT (Udhaar repayment) ───────────────────────
export const recordCustomerPayment = (customerId: number, amount: number, note?: string, billId?: number): void => {
  const db = getDatabase();
  db.execSync(`
    INSERT INTO customer_payments (customer_id, bill_id, amount, type, note)
    VALUES (${customerId}, ${billId || 'NULL'}, ${amount}, 'payment', ${note ? `'${escapeSql(note)}'` : 'NULL'})
  `);
  db.execSync(`
    UPDATE customers
    SET credit_balance = MAX(0, credit_balance - ${amount}),
        updated_at = datetime('now')
    WHERE id = ${customerId}
  `);

  db.execSync(`
    INSERT INTO activity_log (type, description, reference_id, reference_type, amount)
    VALUES ('payment', 'Credit payment received from customer', ${customerId}, 'customer', ${amount})
  `);
};

// ─── GET CUSTOMER PAYMENT HISTORY ────────────────────────────
export const getCustomerPaymentHistory = (customerId: number): CustomerPayment[] => {
  const db = getDatabase();
  return db.getAllSync(`
    SELECT cp.*, b.bill_number
    FROM customer_payments cp
    LEFT JOIN bills b ON cp.bill_id = b.id
    WHERE cp.customer_id = ${customerId}
    ORDER BY cp.created_at DESC
  `) as CustomerPayment[];
};

// ─── GET CUSTOMER BILLS ───────────────────────────────────────
export const getCustomerBills = (customerId: number) => {
  const db = getDatabase();
  return db.getAllSync(`
    SELECT * FROM bills WHERE customer_id = ${customerId}
    ORDER BY created_at DESC
  `);
};

// ─── TOTAL CREDIT OUTSTANDING ─────────────────────────────────
export const getTotalCreditOutstanding = (): number => {
  const db = getDatabase();
  const result = db.getAllSync(`SELECT COALESCE(SUM(credit_balance), 0) as total FROM customers WHERE is_active = 1`) as any[];
  return result[0]?.total || 0;
};

const escapeSql = (str: string): string => str.replace(/'/g, "''");
