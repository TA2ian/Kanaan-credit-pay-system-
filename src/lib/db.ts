// /lib/db.ts

export type CustomerClassification = 'distinct' | 'struggling' | 'new';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  region: string;
  totalDebt: number;
  createdAt: string;
  classification?: CustomerClassification;
}

export type TransactionType = 'debt' | 'payment';

export interface Transaction {
  id: string;
  customerId: string;
  type: TransactionType;
  amount: number;
  date: string;
  dueDate?: string;
  notes?: string;
  isArchived?: boolean;
}

export interface Debt {
  id: string;
  customerId: string;
  totalAmount: number;
  remainingAmount: number;
  dueDate: string;
  notes: string;
  status: 'unpaid' | 'partial' | 'paid';
  createdAt: string;
}

export interface Payment {
  id: string;
  debtId: string;
  customerId: string;
  amountPaid: number;
  paymentDate: string;
  notes: string;
}

export interface DatabaseState {
  version: number;
  customers: Customer[];
  transactions: Transaction[];
}

export interface CustomerBalance {
  customer: Customer;
  totalDebt: number;
  totalPaid: number;
  remainingDebt: number;
  lastActive: string;
  isOverdue: boolean;
}

export interface FinancialSummary {
  grandTotalDebt: number;
  grandTotalPaid: number;
  grandTotalRemaining: number;
  overdueCount: number;
  activeCustomersCount: number;
}

const CUSTOMERS_KEY = 'kanaan_customers_v1';
const DEBTS_KEY = 'kanaan_debts_v1';
const PAYMENTS_KEY = 'kanaan_payments_v1';
const STORAGE_KEY = 'daftar_al_duyun_db';

// عينة البيانات التجريبية الافتراضية
const SAMPLE_CUSTOMERS: Customer[] = [
  { id: 'cust-1', name: 'سوبرماركت الياسمين (أبو محمد)', phone: '+963933111222', region: 'دمشق القديم - باب توما', totalDebt: 950, createdAt: '2026-04-10T10:00:00Z' },
  { id: 'cust-2', name: 'بقالة الخير والبركة (هاني المصري)', phone: '+963955666777', region: 'الميدان - الشارع العام', totalDebt: 450, createdAt: '2026-04-15T11:30:00Z' }
];

export function getDatabase(): DatabaseState {
    if (typeof window === 'undefined') return { version: 1, customers: [], transactions: [] };
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : { version: 1, customers: [], transactions: [] };
}

export function saveDatabase(state: DatabaseState): void {
  if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function isClient(): boolean {
  return typeof window !== 'undefined';
}

export function initializeDatabase(forceReset = false) {
  if (!isClient()) return;
  if (forceReset || !localStorage.getItem(CUSTOMERS_KEY)) {
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(SAMPLE_CUSTOMERS));
  }
}

export function getCustomers(): Customer[] {
  if (!isClient()) return [];
  initializeDatabase();
  return JSON.parse(localStorage.getItem(CUSTOMERS_KEY) || '[]');
}

export function saveCustomers(customers: Customer[]) {
  if (isClient()) localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
}

export function getDebts(): Debt[] {
  if (!isClient()) return [];
  initializeDatabase();
  return JSON.parse(localStorage.getItem(DEBTS_KEY) || '[]');
}

export function saveDebts(debts: Debt[]) {
  if (isClient()) localStorage.setItem(DEBTS_KEY, JSON.stringify(debts));
}

export function getPayments(): Payment[] {
  if (!isClient()) return [];
  initializeDatabase();
  return JSON.parse(localStorage.getItem(PAYMENTS_KEY) || '[]');
}

export function savePayments(payments: Payment[]) {
  if (isClient()) localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));
}

// إضافة عميل جديد
export function addCustomer(name: string, phone: string, email: string, notes: string, region: string, classification?: CustomerClassification): Customer {
  const list = getCustomers();
  const index = `cust-${Date.now()}`;
  const newCustomer: Customer = { id: index, name, phone, region, totalDebt: 0, createdAt: new Date().toISOString(), email, notes, classification };
  list.push(newCustomer);
  saveCustomers(list);
  return newCustomer;
}

export function updateCustomer(id: string, name: string, phone: string, email: string, notes: string, region: string, classification?: CustomerClassification): Customer {
  const list = getCustomers();
  const index = list.findIndex(c => c.id === id);
  if (index === -1) throw new Error('Customer not found');
  list[index] = { ...list[index], name, phone, email, notes, region, classification };
  saveCustomers(list);
  return list[index];
}

export function addTransaction(customerId: string, type: TransactionType, amount: number, notes?: string, dueDate?: string): Transaction {                
  const db = getDatabase();
  const newTx: Transaction = {
    id: 'tx-' + Date.now(),
    customerId,
    type,
    amount,
    date: new Date().toISOString().split('T')[0],
    dueDate: type === 'debt' ? dueDate : undefined,
    notes: notes?.trim() || undefined,
  };
  db.transactions.push(newTx);
  saveDatabase(db);
  return newTx;
}

export function deleteCustomer(id: string) {
  const customers = getCustomers().filter((c) => c.id !== id);
  const debts = getDebts().filter((d) => d.customerId !== id);
  const payments = getPayments().filter((p) => p.customerId !== id);
  saveCustomers(customers);
  saveDebts(debts);
  savePayments(payments);
}

export function deleteTransaction(txId: string): void {
  const db = getDatabase();
  db.transactions = db.transactions.filter(tx => tx.id !== txId);
  saveDatabase(db);
}

export function getCustomerBalances(state: DatabaseState): CustomerBalance[] {
  const todayStr = new Date().toISOString().split('T')[0];
  
  return state.customers.map(customer => {
    const custTxs = state.transactions.filter(tx => tx.customerId === customer.id);
    let totalDebt = 0;
    let totalPaid = 0;
    let lastActive = customer.createdAt;
    let isOverdue = false;

    custTxs.forEach(tx => {
      if (tx.type === 'debt') {
        totalDebt += tx.amount;
        if (tx.dueDate && tx.dueDate < todayStr) {
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
