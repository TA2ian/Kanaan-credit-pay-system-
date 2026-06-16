/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  getDatabase, 
  DatabaseState, 
  Customer, 
  TransactionType,
  addCustomer,
  updateCustomer,
  addTransaction,
  computeFinancialSummary
} from './lib/db';
import { formatCurrency } from './lib/utils';
import { DashboardTab } from './components/DashboardTab';
import { CustomersTab } from './components/CustomersTab';
import { RemindersTab } from './components/RemindersTab';
import { UtilitiesTab } from './components/UtilitiesTab';
import { CustomerModal, TransactionModal } from './components/Modals';
import { useFirebase } from './lib/FirebaseContext';
import { LoginScreen } from './components/LoginScreen';
import { QuickActionFAB } from './components/QuickActionFAB';
import { 
  LayoutDashboard, 
  Users, 
  BellRing, 
  Settings, 
  WifiOff, 
  HelpCircle,
  TrendingDown,
  BookOpen,
  LogOut,
  RefreshCw,
  UserCheck,
  UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { HashRouter, useNavigate, useLocation, useSearchParams } from 'react-router-dom';

export default function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}

function AppContent() {
  const { 
    user, 
    loading, 
    customers, 
    transactions, 
    addCustomerToFS, 
    updateCustomerInFS, 
    addTransactionToFS, 
    logOut 
  } = useFirebase();

  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Validate active route as tabs, defaulting to dashboard
  const validTabs = ['dashboard', 'customers', 'reminders', 'utilities'];
  const activeTabFromPath = location.pathname.slice(1);
  const activeTab = validTabs.includes(activeTabFromPath) 
    ? (activeTabFromPath as 'dashboard' | 'customers' | 'reminders' | 'utilities') 
    : 'dashboard';

  const setActiveTab = (tab: 'dashboard' | 'customers' | 'reminders' | 'utilities') => {
    navigate(`/${tab}`);
  };

  // Automatically correct invalid routes by redirecting to dashboard
  useEffect(() => {
    const currentPath = location.pathname.slice(1);
    if (!validTabs.includes(currentPath) && currentPath !== '') {
      navigate('/dashboard', { replace: true });
    }
  }, [location.pathname, navigate]);

  const navigationCustomerId = searchParams.get('id');

  // Connection Simulation state
  const [isOfflineSimulated, setIsOfflineSimulated] = useState<boolean>(false);

  // Modal Dialog States
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>(undefined);

  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txCustomerId, setTxCustomerId] = useState('');
  const [txCustomerName, setTxCustomerName] = useState('');
  const [txType, setTxType] = useState<TransactionType>('debt');

  // Ground dynamic DB on user login session
  const db: DatabaseState = user 
    ? { version: 1, customers, transactions } 
    : { version: 1, customers: [], transactions: [] };

  const handleToggleOffline = () => {
    setIsOfflineSimulated(!isOfflineSimulated);
  };

  // Customer modal callback (writes to Firestore)
  const handleSaveCustomer = async (name: string, phone: string, email?: string, notes?: string, region?: string) => {
    if (user) {
      if (editingCustomer) {
        await updateCustomerInFS(editingCustomer.id, name, phone, email, notes, region);
      } else {
        await addCustomerToFS(name, phone, email, notes, region);
      }
    } else {
      if (editingCustomer) {
        updateCustomer(editingCustomer.id, name, phone, email, notes, region);
      } else {
        addCustomer(name, phone, email, notes, region);
      }
    }
    setEditingCustomer(undefined);
    setIsCustomerModalOpen(false);
  };

  // Transaction modal callback (writes to Firestore)
  const handleSaveTransaction = async (customerId: string, type: TransactionType, amount: number, notes?: string, dueDate?: string) => {
    if (user) {
      await addTransactionToFS(customerId, type, amount, notes, dueDate);
    } else {
      addTransaction(customerId, type, amount, notes, dueDate);
    }
    setIsTxModalOpen(false);
  };

  // Triggers
  const triggerAddCustomer = () => {
    setEditingCustomer(undefined);
    setIsCustomerModalOpen(true);
  };

  const triggerEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsCustomerModalOpen(true);
  };

  const triggerAddTransaction = (customerId: string, type: TransactionType) => {
    const customer = db.customers.find(c => c.id === customerId);
    if (!customer) return;
    setTxCustomerId(customerId);
    setTxCustomerName(customer.name);
    setTxType(type);
    setIsTxModalOpen(true);
  };

  const triggerAddGenericTransaction = (type: TransactionType) => {
    setTxCustomerId('');
    setTxCustomerName('');
    setTxType(type);
    setIsTxModalOpen(true);
  };

  const handleSelectCustomerFromDashboard = (customerId: string) => {
    navigate(`/customers?id=${customerId}`);
  };

  const summary = computeFinancialSummary(db);

  // 1. Loading State Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans text-right" dir="rtl">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          style={{ willChange: 'transform, opacity' }}
          className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl text-center space-y-6 max-w-sm w-full relative overflow-hidden"
        >
          {/* Animated pulsing gradient background accent */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500 animate-pulse" />
          
          <div className="relative flex items-center justify-center mx-auto w-20 h-20">
            {/* Outer rings with glowing and rotating animation */}
            <motion.div 
              className="absolute inset-0 rounded-full border-4 border-indigo-100 border-t-indigo-600"
              animate={{ rotate: 360 }}
              style={{ willChange: 'transform' }}
              transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
            />
            <motion.div 
              className="absolute inset-2 rounded-full border border-dashed border-emerald-500/60"
              animate={{ rotate: -360 }}
              style={{ willChange: 'transform' }}
              transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
            />
            {/* Center icon / emoji representing the food group */}
            <span className="text-4xl animate-bounce">🌾</span>
          </div>

          <div className="space-y-2">
            <motion.h3 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{ willChange: 'transform, opacity' }}
              className="text-sm font-black text-slate-800"
            >
              جاري التفويض والربط السحابي
            </motion.h3>
            <motion.p 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              style={{ willChange: 'transform, opacity' }}
              className="text-[11px] text-slate-450 leading-relaxed font-semibold"
            >
              يرجى الانتظار ثوانٍ قلائل لحين جلب بروتوكولات حماية التاجر والتحقق من حساب المتجر القائم...
            </motion.p>
          </div>
          
          {/* Subtle loading loader bar overlay dots */}
          <div className="flex justify-center gap-1.5 pt-1">
            <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
            <span className="w-2 h-2 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
          </div>
        </motion.div>
      </div>
    );
  }

  // 2. Logged out / Login Screen
  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-800" dir="rtl">
      
      {/* A. SIDEBAR NAVIGATION - VISIBLE ONLY ON DESKTOP */}
      <aside className="w-68 bg-slate-950 text-white flex flex-col border-l border-slate-900 shrink-0 hidden md:flex sticky top-0 h-screen overflow-y-auto">
        {/* Branding */}
        <div className="p-6 shrink-0 border-b border-slate-900 pb-5 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-radial-at-t from-sky-900 to-sky-950 border border-amber-500/30 rounded-xl flex items-center justify-center font-black text-xl text-white shadow-md shadow-slate-950 shrink-0">
              🌾
            </div>
            <div>
              <h1 className="text-xs font-black tracking-tight text-white leading-tight">مجموعة كنعان الذكية</h1>
              <span className="text-[10px] text-amber-500 font-bold block mt-0.5">حقيبة كنعان مندوب v1.5</span>
            </div>
          </div>
        </div>

        {/* Dynamic Tenant Profile Block */}
        <div className="p-4 mx-4 mt-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between gap-3 shrink-0">
          <div className="truncate text-right">
            <span className="text-[9px] text-amber-500 font-bold block">حساب المندوب المعتمد</span>
            <span className="text-[11px] font-black text-slate-200 truncate block mt-0.5" title={user.email || ''}>
              {user.email}
            </span>
          </div>
          <button 
            onClick={() => logOut()} 
            className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition-all cursor-pointer shrink-0"
            title="تسجيل الخروج"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Vertical Nav links */}
        <div className="flex-grow p-4 space-y-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-right cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4.5 h-4.5 shrink-0 opacity-90" />
            <span>لوحة التحكم والتحليل</span>
          </button>

          <button
            onClick={() => setActiveTab('customers')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-right cursor-pointer ${
              activeTab === 'customers'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Users className="w-4.5 h-4.5 shrink-0 opacity-90" />
            <span>العملاء والدفعات ({db.customers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('reminders')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-right cursor-pointer ${
              activeTab === 'reminders'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <BellRing className="w-4.5 h-4.5 shrink-0 opacity-90" />
            <span className="flex-1">التذكيرات وصياغة AI</span>
            {summary.overdueCount > 0 && (
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('utilities')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-right cursor-pointer ${
              activeTab === 'utilities'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Settings className="w-4.5 h-4.5 shrink-0 opacity-90" />
            <span>أدوات النظام والمزامنة</span>
          </button>
        </div>

        {/* Offline status info widget from CSS design mockup */}
        <div className="p-4 m-4 bg-slate-850/40 rounded-xl border border-slate-800 mt-auto shrink-0">
          <p className="text-[10px] text-slate-400 mb-1">وضعية المزامنة</p>
          <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5 leading-none">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>آمنة وسحابية (مزامنة فورية)</span>
          </div>
        </div>
      </aside>

      {/* B. MAIN VIEWPORT CONTAINER */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        
        {/* State/Connection Alert Header */}
        {isOfflineSimulated && (
          <div className="bg-red-500 text-white text-xs font-bold py-2.5 px-4 shadow-sm text-center flex items-center justify-center gap-1.5 transition-colors relative z-30">
            <WifiOff className="w-4 h-4 animate-pulse shrink-0" />
            <span>تنبيه: أنت تعمل في وضعية عدم الاتصال المحاكاة - سيتم الاحتفاظ بالعمليات في المزامنة المعلقة فور إعادة تشغيل الاتصال.</span>
          </div>
        )}

        {/* C. HEADER */}

        {/* C1. Desktop Main Header (Hidden on Mobile) */}
        <header className="h-18 bg-white border-b border-slate-200 hidden md:flex items-center justify-between px-8 shrink-0 relative z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-md font-extrabold text-slate-900 tracking-tight">
              {activeTab === 'dashboard' && 'نظرة عامة على البيانات والتحليلات'}
              {activeTab === 'customers' && 'كشف حسابات العملاء والدفعات'}
              {activeTab === 'reminders' && 'مساعد التذكيرات الذكي وصياغة Gemini AI'}
              {activeTab === 'utilities' && 'نسخ احتياطي واسترجاع وإعدادات الدفتر'}
            </h2>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-1 rounded">المزامنة: سحابي فوري ⚡</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 bg-slate-50 py-1.5 px-3 rounded-xl border border-slate-150 text-[11px] font-bold">
              <div className="space-y-0.5 text-right">
                <span className="text-[9px] text-slate-400 font-medium block">إجمالي الديون المعلقة:</span>
                <span className="text-xs font-black text-rose-600">{formatCurrency(summary.grandTotalRemaining)}</span>
              </div>
              <div className="h-5 w-px bg-slate-200" />
              <div className="space-y-0.5 text-right">
                <span className="text-[9px] text-slate-400 font-medium block">إجمالي المحصل بالخزينة:</span>
                <span className="text-xs font-black text-emerald-600">✓ {formatCurrency(summary.grandTotalPaid)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={triggerAddCustomer}
                className="bg-sky-900 hover:bg-sky-950 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-xs shrink-0 cursor-pointer border-b-2 border-amber-400 flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4 text-amber-400 shrink-0" />
                <span>إضافة عميل جديد</span>
              </button>
            </div>
          </div>
        </header>

        {/* C2. Mobile Brand Header (Hidden on Desktop) */}
        <header className="bg-white border-b border-slate-100 shadow-2xs shrink-0 block md:hidden relative z-20">
          <div className="px-4 py-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-radial-at-t from-sky-900 to-sky-950 border border-amber-500/35 rounded-xl flex items-center justify-center text-white font-bold shadow shadow-amber-100 shrink-0">
                  🌾
                </div>
                <div>
                  <h1 className="text-xs font-black text-slate-800 leading-none">مجموعة كنعان الذكية</h1>
                  <p className="text-[9px] text-amber-600 font-bold mt-1">حساب المندوب: {user.email}</p>
                </div>
              </div>
              
              <div className="flex gap-1.5">
                <button
                  onClick={() => logOut()}
                  className="bg-rose-50 text-rose-600 text-[10px] font-bold p-1.5 rounded-lg hover:bg-rose-100 transition-colors shrink-0 flex items-center justify-center cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
                <button
                  onClick={triggerAddCustomer}
                  className="bg-sky-900 hover:bg-sky-950 border-b border-amber-500 text-white text-[9px] font-black px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>عميل جديد</span>
                </button>
              </div>
            </div>

            {/* Mobile ledger header banner summary */}
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded-xl border border-slate-150 text-[10px] font-bold text-center">
              <div>
                <span className="text-slate-450 block">الديون المستحقة</span>
                <span className="text-xs font-black text-rose-600">{formatCurrency(summary.grandTotalRemaining)}</span>
              </div>
              <div className="border-r border-slate-200">
                <span className="text-slate-450 block">المحصل الجاري</span>
                <span className="text-xs font-black text-emerald-600">{formatCurrency(summary.grandTotalPaid)}</span>
              </div>
            </div>

            {/* Horizontal tab scroll header on Mobile */}
            <div className="flex items-center overflow-x-auto pb-0.5 gap-1.5 scrollbar-none">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-2 px-3 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                لوحة التحكم
              </button>
              <button
                onClick={() => setActiveTab('customers')}
                className={`py-2 px-3 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                  activeTab === 'customers'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                العملاء ({db.customers.length})
              </button>
              <button
                onClick={() => setActiveTab('reminders')}
                className={`py-2 px-3 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                  activeTab === 'reminders'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                التذكيرات AI
              </button>
              <button
                onClick={() => setActiveTab('utilities')}
                className={`py-2 px-3 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                  activeTab === 'utilities'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                أدوات النظام والمزامنة
              </button>
            </div>

          </div>
        </header>

        {/* D. BODY AND SCENE CONTENT CONTAINER */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto md:max-w-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              style={{ willChange: "transform, opacity" }}
            >
              {activeTab === 'dashboard' && (
                <DashboardTab 
                  db={db} 
                  onSelectCustomer={handleSelectCustomerFromDashboard} 
                />
              )}

              {activeTab === 'customers' && (
                <CustomersTab
                  db={db}
                  onRefresh={() => {}}
                  selectedCustomerIdInitially={navigationCustomerId}
                  clearInitialSelection={() => navigate('/customers', { replace: true })}
                  onAddCustomerTrigger={triggerAddCustomer}
                  onAddTransactionTrigger={triggerAddTransaction}
                  onEditCustomerTrigger={triggerEditCustomer}
                />
              )}

              {activeTab === 'reminders' && (
                <RemindersTab 
                  db={db} 
                />
              )}

              {activeTab === 'utilities' && (
                <UtilitiesTab
                  onRefresh={() => {}}
                  isOfflineSimulated={isOfflineSimulated}
                  onToggleOfflineSimulated={handleToggleOffline}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* E. FOOTER */}
        <footer className="bg-white border-t border-slate-100 text-center py-4 text-slate-400 text-[10px] shrink-0 font-medium space-y-1">
          <p>كنعان لتوزيع المواد الغذائية والمشروبات © ٢٠٢٦ | المندوب عبدالرحمن كنعان 🌾 هاتف: 0958280936</p>
          <p className="text-[9px] text-slate-350">حقوق الحسابات والنظام مطورة ومحفوظة بالكامل لسلسلة التوزيع البرية</p>
        </footer>

      </div>

      {/* F. MODALS dialog controller */}
      <QuickActionFAB 
          onAddDebt={() => triggerAddGenericTransaction('debt')}
          onAddPayment={() => triggerAddGenericTransaction('payment')}
      />
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => {
          setIsCustomerModalOpen(false);
          setEditingCustomer(undefined);
        }}
        customer={editingCustomer}
        onSave={handleSaveCustomer}
      />

      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        customers={db.customers}
        customerId={txCustomerId}
        customerName={txCustomerName}
        type={txType}
        onSave={handleSaveTransaction}
      />

    </div>
  );
}
