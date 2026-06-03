/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Types matching the Arab merchant debt management system
export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  region?: string; // المنطقة أو المدينة
  createdAt: string;
}

export type TransactionType = 'debt' | 'payment'; // 'debt' = دين جديد, 'payment' = سداد دفعة

export interface Transaction {
  id: string;
  customerId: string;
  type: TransactionType;
  amount: number;
  date: string;
  dueDate?: string; // Only relevant for debts (تاريخ الاستحقاق)
  notes?: string;
}

export interface DatabaseState {
  customers: Customer[];
  transactions: Transaction[];
  version: number;
}

const STORAGE_KEY = 'daftar_al_duyun_db';

// High-quality Saudi/Arab merchant sample data to populate empty DB
const SAMPLE_DATA: DatabaseState = {
  version: 1,
  customers: [
    {
      id: 'cust-1',
      name: 'عبدالرحمن بن محمد العتيبي',
      phone: '+966501234567',
      email: 'alotaibi@example.com',
      notes: 'عميل دائم وموثوق، صاحب سوبرماركت العتيبي',
      region: 'الرياض',
      createdAt: '2026-05-10T08:30:00Z',
    },
    {
      id: 'cust-2',
      name: 'فاطمة أحمد الزهراني',
      phone: '+966541234567',
      email: 'fatimah.z@example.com',
      notes: 'طلب توريد منزلي شهري',
      region: 'جدة',
      createdAt: '2026-05-15T10:15:00Z',
    },
    {
      id: 'cust-3',
      name: 'مؤسسة خالد التجارية (أبو فهد)',
      phone: '+966561234567',
      email: 'khaled.est@example.com',
      notes: 'مشتريات مواد بناء بالآجل',
      region: 'الشرقية',
      createdAt: '2026-05-20T14:45:00Z',
    },
    {
      id: 'cust-4',
      name: 'صالح بن علي البارقي',
      phone: '+966555551234',
      email: 'saleh.barqi@example.com',
      notes: 'يطلب تفصيل أثاث مكتبي، ملتزم بالدفع',
      region: 'عسير',
      createdAt: '2026-05-25T11:00:00Z',
    }
  ],
  transactions: [
    // Customer 1: Abdurrahman (Needs 4500 debt, paid 2000 => Remaining 2500)
    {
      id: 'tx-101',
      customerId: 'cust-1',
      type: 'debt',
      amount: 4500,
      date: '2026-05-11',
      dueDate: '2026-06-15',
      notes: 'شراء بضاعة بوزن طن واحد دقيق وسكر آجل',
    },
    {
      id: 'tx-102',
      customerId: 'cust-1',
      type: 'payment',
      amount: 2000,
      date: '2026-05-25',
      notes: 'دفعة أولى نقداً',
    },
    // Customer 2: Fatimah (Needs 1200 debt => Remaining 1200)
    {
      id: 'tx-103',
      customerId: 'cust-2',
      type: 'debt',
      amount: 1200,
      date: '2026-05-16',
      dueDate: '2026-06-05',
      notes: 'طلب كعك وتجهيز حفلة تخرج عائلية',
    },
    // Customer 3: Khaled Est (Needs 15000 debt, paid 8500 => Remaining 6500, overdue)
    {
      id: 'tx-104',
      customerId: 'cust-3',
      type: 'debt',
      amount: 15000,
      date: '2026-05-21',
      dueDate: '2026-05-30', // Overdue relative to current date (2026-06-03)
      notes: 'تسليم دفعة طوب وأسمنت رمادي',
    },
    {
      id: 'tx-105',
      customerId: 'cust-3',
      type: 'payment',
      amount: 8500,
      date: '2026-05-28',
      notes: 'تحويل بنكي على مصرف الراجحي',
    },
    // Customer 4: Saleh (Paid completely, 3000 debt, 3000 paid => 0 remaining)
    {
      id: 'tx-106',
      customerId: 'cust-4',
      type: 'debt',
      amount: 3000,
      date: '2026-05-26',
      dueDate: '2026-06-10',
      notes: 'تفصيل طاولات اجتماعات عدد ٢',
    },
    {
      id: 'tx-107',
      customerId: 'cust-4',
      type: 'payment',
      amount: 3000,
      date: '2026-06-01',
      notes: 'سداد كامل الحساب نقداً والحمد لله',
    }
  ]
};

// Initialize or read DB
export function getDatabase(): DatabaseState {
  if (typeof window === 'undefined') {
    return { customers: [], transactions: [], version: 1 };
  }
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    saveDatabase(SAMPLE_DATA);
    return SAMPLE_DATA;
  }
  try {
    const parsed = JSON.parse(data) as DatabaseState;
    if (!parsed.customers || !parsed.transactions) {
      saveDatabase(SAMPLE_DATA);
      return SAMPLE_DATA;
    }
    return parsed;
  } catch (e) {
    console.error('Error parsing debt database, reinitializing...', e);
    saveDatabase(SAMPLE_DATA);
    return SAMPLE_DATA;
  }
}

export function saveDatabase(state: DatabaseState): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}

// Helpers for computation
export interface CustomerBalance {
  customer: Customer;
  totalDebt: number;
  totalPaid: number;
  remainingDebt: number;
  lastActive: string;
  isOverdue: boolean;
}

export function getCustomerBalances(state: DatabaseState): CustomerBalance[] {
  const todayStr = '2026-06-03'; // Hardcoded stable date matching CURRENT METADATA for accuracy
  
  return state.customers.map(customer => {
    const custTxs = state.transactions.filter(tx => tx.customerId === customer.id);
    let totalDebt = 0;
    let totalPaid = 0;
    let lastActive = customer.createdAt;
    let isOverdue = false;

    custTxs.forEach(tx => {
      if (tx.type === 'debt') {
        totalDebt += tx.amount;
        // Check if this specific pending debt is overdue
        if (tx.dueDate && tx.dueDate < todayStr) {
          // Verify if this debt is not fully covered by payments
          isOverdue = true;
        }
      } else {
        totalPaid += tx.amount;
      }
      if (tx.date > lastActive) {
        lastActive = tx.date;
      }
    });

    const remainingDebt = Math.max(0, totalDebt - totalPaid);
    
    // An overdue state only matters if remaining debt is greater than zero
    const hasRemaining = remainingDebt > 0;

    return {
      customer,
      totalDebt,
      totalPaid,
      remainingDebt,
      lastActive,
      isOverdue: hasRemaining && isOverdue,
    };
  });
}

// Global Financial Summary
export interface FinancialSummary {
  grandTotalDebt: number;
  grandTotalPaid: number;
  grandTotalRemaining: number;
  overdueCount: number;
  activeCustomersCount: number;
}

export function computeFinancialSummary(state: DatabaseState): FinancialSummary {
  const balances = getCustomerBalances(state);
  let grandTotalDebt = 0;
  let grandTotalPaid = 0;
  let grandTotalRemaining = 0;
  let overdueCount = 0;
  let activeCustomersCount = 0;

  balances.forEach(b => {
    grandTotalDebt += b.totalDebt;
    grandTotalPaid += b.totalPaid;
    grandTotalRemaining += b.remainingDebt;
    if (b.remainingDebt > 0) {
      activeCustomersCount++;
      if (b.isOverdue) {
        overdueCount++;
      }
    }
  });

  return {
    grandTotalDebt,
    grandTotalPaid,
    grandTotalRemaining,
    overdueCount,
    activeCustomersCount,
  };
}

// Add Customer
export function addCustomer(name: string, phone: string, email?: string, notes?: string, region?: string): Customer {
  const db = getDatabase();
  const newCust: Customer = {
    id: 'cust-' + Date.now(),
    name: name.trim(),
    phone: phone.trim(),
    email: email?.trim() || undefined,
    notes: notes?.trim() || undefined,
    region: region?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };
  db.customers.push(newCust);
  saveDatabase(db);
  return newCust;
}

// Edit Customer
export function updateCustomer(id: string, name: string, phone: string, email?: string, notes?: string, region?: string): Customer {
  const db = getDatabase();
  const idx = db.customers.findIndex(c => c.id === id);
  if (idx === -1) {
    throw new Error('Customer not found');
  }
  db.customers[idx] = {
    ...db.customers[idx],
    name: name.trim(),
    phone: phone.trim(),
    email: email?.trim() || undefined,
    notes: notes?.trim() || undefined,
    region: region?.trim() || undefined,
  };
  saveDatabase(db);
  return db.customers[idx];
}

// Delete Customer & their transactions
export function deleteCustomer(id: string): void {
  const db = getDatabase();
  db.customers = db.customers.filter(c => c.id !== id);
  db.transactions = db.transactions.filter(tx => tx.customerId !== id);
  saveDatabase(db);
}

// Add Transaction (Debt or Payment)
export function addTransaction(customerId: string, type: TransactionType, amount: number, notes?: string, dueDate?: string): Transaction {
  const db = getDatabase();
  const newTx: Transaction = {
    id: 'tx-' + Date.now(),
    customerId,
    type,
    amount,
    date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    dueDate: type === 'debt' ? dueDate : undefined,
    notes: notes?.trim() || undefined,
  };
  db.transactions.push(newTx);
  saveDatabase(db);
  return newTx;
}

// Delete Transaction
export function deleteTransaction(txId: string): void {
  const db = getDatabase();
  db.transactions = db.transactions.filter(tx => tx.id !== txId);
  saveDatabase(db);
}

// Restore whole database
export function importDatabase(jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString) as DatabaseState;
    if (parsed && Array.isArray(parsed.customers) && Array.isArray(parsed.transactions)) {
      saveDatabase({
        version: parsed.version || 1,
        customers: parsed.customers,
        transactions: parsed.transactions,
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to import database:', error);
    return false;
  }
}
