/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  getDatabase, 
  DatabaseState, 
  Customer, 
  CustomerClassification,
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
import { TeamTab } from './components/TeamTab';
import { UtilitiesTab } from './components/UtilitiesTab';
import { CustomerModal, TransactionModal } from './components/Modals';
import { useFirebase } from './lib/FirebaseContext';
import { LoginScreen } from './components/LoginScreen';
import { OnboardingScreen } from './components/OnboardingScreen';
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
  UserPlus,
  UserCog
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

interface ThemePreset {
  id: string;
  name: string;
  primary: string;
  hover: string;
  light: string;
  lightHover: string;
  textColor: string;
}

export const THEME_PRESETS: Record<string, ThemePreset> = {
  amber: {
    id: 'amber',
    name: 'الكهرماني الذهبي',
    primary: '#f59e0b',
    hover: '#d97706',
    light: '#fef3c7',
    lightHover: '#fde68a',
    textColor: '#78350f'
  },
  blue: {
    id: 'blue',
    name: 'الأزرق الملكي',
    primary: '#3b82f6',
    hover: '#2563eb',
    light: '#e0f2fe',
    lightHover: '#bae6fd',
    textColor: '#0369a1'
  },
  emerald: {
    id: 'emerald',
    name: 'الأخضر الزمردي',
    primary: '#10b981',
    hover: '#059669',
    light: '#ecfdf5',
    lightHover: '#d1fae5',
    textColor: '#047857'
  },
  violet: {
    id: 'violet',
    name: 'البنفسجي الإمبراطوري',
    primary: '#8b5cf6',
    hover: '#7c3aed',
    light: '#f5f3ff',
    lightHover: '#ede9fe',
    textColor: '#6d28d9'
  },
  rose: {
    id: 'rose',
    name: 'الأحمر المرجاني',
    primary: '#f43f5e',
    hover: '#e11d48',
    light: '#fff1f2',
    lightHover: '#ffe4e6',
    textColor: '#be123c'
  },
  teal: {
    id: 'teal',
    name: 'السماوي التركوازي',
    primary: '#0d9488',
    hover: '#0f766e',
    light: '#f0fdfa',
    lightHover: '#ccfbf1',
    textColor: '#0f766e'
  },
  indigo: {
    id: 'indigo',
    name: 'الكحلي الداكن',
    primary: '#6366f1',
    hover: '#4f46e5',
    light: '#e0e7ff',
    lightHover: '#c7d2fe',
    textColor: '#4338ca'
  }
};

function AppContent() {
  const { 
    user, 
    loading, 
    profile,
    profileLoading,
    teamMembers,
    customers, 
    transactions, 
    isSyncing,
    isOnline,
    pendingSyncCount,
    addCustomerToFS, 
    updateCustomerInFS, 
    addTransactionToFS, 
    logOut 
  } = useFirebase();

  // Determine active members (active in the last 5 minutes)
  const activeMembersCount = React.useMemo(() => {
    if (!teamMembers) return 0;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    return teamMembers.filter(m => m.lastActive && m.lastActive > fiveMinutesAgo).length;
  }, [teamMembers]);

  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Connection Simulation state
  const [isOfflineSimulated, setIsOfflineSimulated] = useState<boolean>(false);

  // Modal Dialog States
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>(undefined);

  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txCustomerId, setTxCustomerId] = useState('');
  const [txCustomerName, setTxCustomerName] = useState('');
  const [txType, setTxType] = useState<TransactionType>('debt');
  const [txInitialAmount, setTxInitialAmount] = useState<number | undefined>(undefined);
  const [txInitialNotes, setTxInitialNotes] = useState<string | undefined>(undefined);

  const managerProfile = teamMembers?.find(m => m.role === 'manager' || m.userId === m.companyId);
  const businessName = managerProfile?.businessName || profile?.businessName || 'مجموعة كنعان الذكية';
  const themeColor = 'amber';
  const selectedTheme = THEME_PRESETS[themeColor] || THEME_PRESETS.amber;
  const businessDesc = managerProfile?.businessDesc || profile?.businessDesc || '';
  const copyrightText = managerProfile?.copyrightText || profile?.copyrightText || 'حقوق الحسابات والنظام مطورة ومحفوظة بالكامل لسلسلة التوزيع البرية';

  // Generate dynamic premium Visual Identity based on first character of business name & chosen theme color
  const renderVisualIdentity = (size: 'sm' | 'md' = 'md') => {
    const firstLetter = (businessName || 'ك').trim().charAt(0);
    const isMd = size === 'md';
    const dimensions = isMd ? 'w-10 h-10 text-base' : 'w-9 h-9 text-xs';
    
    const storedLogo = localStorage.getItem('company_logo');

    if (storedLogo) {
      return (
        <div 
          className={`${dimensions} relative overflow-hidden rounded-xl flex items-center justify-center transition-all duration-300 shadow-md`}
          style={{ border: `1px solid ${selectedTheme.primary}20` }}
        >
          <img src={storedLogo} alt="شعار الشركة" className="w-full h-full object-cover" />
        </div>
      );
    }

    return (
      <div 
        className={`${dimensions} relative overflow-hidden rounded-xl flex items-center justify-center font-black text-white select-none transition-all duration-300 shadow-md`}
        style={{
          background: `linear-gradient(135deg, ${selectedTheme.primary} 0%, ${selectedTheme.hover} 100%)`,
          boxShadow: `0 4px 10px -2px ${selectedTheme.primary}45, inset 0 1px 1.5px rgba(255,255,255,0.45)`,
          border: `1px solid ${selectedTheme.primary}20`
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none rounded-xl" />
        {/* Double layered inner frame */}
        <div className="absolute inset-0.5 rounded-[10px] border border-white/20 pointer-events-none" />
        {/* Monogram character */}
        <span className="relative z-10 font-sans antialiased font-black text-white px-0.5" style={{ textShadow: '0 1.5px 3px rgba(0,0,0,0.4)' }}>
          {firstLetter}
        </span>
      </div>
    );
  };

  const navigationCustomerId = searchParams.get('id');

  // Validate active route as tabs, defaulting to dashboard
  const showTeamTab = profile && profile.businessType === 'company' && (profile.role === 'manager' || profile.role === 'assistant');
  const validTabs = showTeamTab 
    ? ['dashboard', 'customers', 'reminders', 'team', 'utilities'] 
    : ['dashboard', 'customers', 'reminders', 'utilities'];

  const activeTabFromPath = location.pathname.slice(1);
  const activeTab = validTabs.includes(activeTabFromPath) 
    ? (activeTabFromPath as 'dashboard' | 'customers' | 'reminders' | 'team' | 'utilities') 
    : 'dashboard';

  const setActiveTab = (tab: 'dashboard' | 'customers' | 'reminders' | 'team' | 'utilities') => {
    navigate(`/${tab}`);
  };

  // Automatically correct invalid routes by redirecting to dashboard
  useEffect(() => {
    const currentPath = location.pathname.slice(1);
    if (!validTabs.includes(currentPath) && currentPath !== '') {
      navigate('/dashboard', { replace: true });
    }
  }, [location.pathname, navigate, validTabs]);

  // Ground dynamic DB on user login session
  const db: DatabaseState = user 
    ? { version: 1, customers, transactions } 
    : { version: 1, customers: [], transactions: [] };

  const handleToggleOffline = () => {
    setIsOfflineSimulated(!isOfflineSimulated);
  };

  // Customer modal callback (writes to Firestore)
  const handleSaveCustomer = async (name: string, phone: string, email?: string, notes?: string, region?: string, classification?: CustomerClassification) => {
    if (user) {
      if (editingCustomer) {
        await updateCustomerInFS(editingCustomer.id, name, phone, email, notes, region, classification);
      } else {
        await addCustomerToFS(name, phone, email, notes, region, classification);
      }
    } else {
      if (editingCustomer) {
        updateCustomer(editingCustomer.id, name, phone, email, notes, region, classification);
      } else {
        addCustomer(name, phone, email, notes, region, classification);
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

  const triggerAddTransaction = (customerId: string, type: TransactionType, initialAmount?: number, initialNotes?: string) => {
    const customer = db.customers.find(c => c.id === customerId);
    if (!customer) return;
    setTxCustomerId(customerId);
    setTxCustomerName(customer.name);
    setTxType(type);
    setTxInitialAmount(initialAmount);
    setTxInitialNotes(initialNotes);
    setIsTxModalOpen(true);
  };

  const triggerAddGenericTransaction = (type: TransactionType, initialAmount?: number, initialNotes?: string) => {
    setTxCustomerId('');
    setTxCustomerName('');
    setTxType(type);
    setTxInitialAmount(initialAmount);
    setTxInitialNotes(initialNotes);
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

  // 3. Profile Loading state
  if (profileLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans text-right" dir="rtl">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          style={{ willChange: 'transform, opacity' }}
          className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl text-center space-y-4 max-w-xs w-full relative overflow-hidden"
        >
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-sky-900 via-indigo-500 to-amber-500 animate-pulse" />
          <div className="relative flex items-center justify-center mx-auto w-14 h-14">
            <motion.div 
              className="absolute inset-0 rounded-full border-4 border-indigo-500/10 border-t-indigo-650"
              animate={{ rotate: 360 }}
              style={{ willChange: 'transform' }}
              transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
            />
            <span className="text-2xl animate-spin" style={{ animationDuration: '4s' }}>🌾</span>
          </div>
          <p className="text-xs font-black text-slate-850">جاري تفويض الملف المالي...</p>
        </motion.div>
      </div>
    );
  }

  // 4. Profile Onboarding setup required
  if (!profile) {
    return <OnboardingScreen />;
  }

  const translateRole = (role?: string) => {
    switch (role) {
      case 'manager': return 'المدير العام والمالك';
      case 'assistant': return 'مساعد المدير العام';
      case 'accountant': return 'المحاسب المالي';
      case 'representative': return 'المندوب الميداني';
      default: return 'شريك كنعان الموثوق';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-800 transition-colors duration-300" dir="rtl">
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --brand-color: ${selectedTheme.primary} !important;
          --brand-color-hover: ${selectedTheme.hover} !important;
          --brand-color-light: ${selectedTheme.light} !important;
          --brand-color-light-hover: ${selectedTheme.lightHover} !important;
          --brand-color-text: ${selectedTheme.textColor} !important;
        }
      `}} />
      
      {/* A. SIDEBAR NAVIGATION - VISIBLE ONLY ON DESKTOP */}
      <aside className="w-64 bg-slate-950 text-white flex flex-col border-l border-slate-900 shrink-0 hidden md:flex sticky top-0 h-screen overflow-y-auto">
        {/* Branding */}
        <div className="p-5 shrink-0 border-b border-slate-900 pb-4 bg-slate-950/50">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {renderVisualIdentity('sm')}
              <div>
                <h1 className="text-[11px] font-black tracking-tight text-white leading-tight truncate max-w-[120px]">{businessName}</h1>
                <span className="text-[9px] text-amber-500 font-bold block mt-0.5">كنعان الذكية v1.5</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Tenant Profile Block */}
        <div className="p-3 mx-3 mt-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between gap-3 shrink-0">
          <div className="truncate text-right">
            <span className="text-[8px] text-amber-500 font-bold block">{translateRole(profile?.role)}</span>
            <span className="text-[10px] font-black text-slate-200 truncate block mt-0.5" title={profile?.delegateName || user.email || ''}>
              {profile?.delegateName || user.email}
            </span>
          </div>
          <button 
            onClick={() => logOut()} 
            className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition-all cursor-pointer shrink-0"
            title="تسجيل الخروج"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Vertical Nav links */}
        <div className="flex-grow p-3 space-y-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[11px] font-black transition-all text-right cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0 opacity-90" />
            <span>لوحة التحكم</span>
          </button>

          <button
            onClick={() => setActiveTab('customers')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[11px] font-black transition-all text-right cursor-pointer ${
              activeTab === 'customers'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 shrink-0 opacity-90" />
            <span>العملاء ({db.customers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('reminders')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[11px] font-black transition-all text-right cursor-pointer ${
              activeTab === 'reminders'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <BellRing className="w-4 h-4 shrink-0 opacity-90" />
            <span className="flex-1">التذكيرات</span>
            {summary.overdueCount > 0 && (
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>

          {showTeamTab && (
            <button
              onClick={() => setActiveTab('team')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[11px] font-black transition-all text-right cursor-pointer ${
                activeTab === 'team'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <UserCog className="w-4 h-4 shrink-0 opacity-90" />
              <span>فريق العمل</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('utilities')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[11px] font-black transition-all text-right cursor-pointer ${
              activeTab === 'utilities'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4 shrink-0 opacity-90" />
            <span>الأدوات</span>
          </button>
        </div>

        {/* Offline status info widget from CSS design mockup */}
        <div className="p-3 m-3 bg-slate-850/40 rounded-xl border border-slate-800 mt-auto shrink-0 transition-colors">
          <p className="text-[9px] text-slate-400 mb-1">حالة الاتصال</p>
          <div className={`text-[10px] font-black flex items-center gap-1.5 leading-none ${
            !isOnline ? 'text-amber-400' : (isSyncing ? 'text-indigo-400' : 'text-emerald-400')
          }`}>
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              {isOnline && !isSyncing && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
              <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                !isOnline ? 'bg-amber-500 animate-pulse' : (isSyncing ? 'bg-indigo-500 animate-spin' : 'bg-emerald-500')
              }`}></span>
            </span>
            <span>
              {!isOnline ? 'وضع أوفلاين' : (isSyncing ? 'جاري المزامنة...' : 'مزامن لحظياً')}
            </span>
          </div>
          {!isOnline && pendingSyncCount > 0 && (
             <div className="mt-1.5 text-[8px] font-black text-white/40 bg-white/5 py-1 px-2 rounded-lg border border-white/5">
                ⌛ {pendingSyncCount} معاملة معلقة
             </div>
          )}
        </div>
      </aside>

      {/* B. MAIN VIEWPORT CONTAINER */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        
        {/* State/Connection Alert Header */}
        {!isOnline && (
          <div className="bg-amber-500 text-white text-[10px] font-black py-2 px-4 shadow-md text-center flex items-center justify-center gap-2 transition-all relative z-30 animate-in fade-in slide-in-from-top-1">
            <WifiOff className="w-3.5 h-3.5" />
            <span>أنت في وضع عدم الاتصال حالياً</span>
            {pendingSyncCount > 0 && (
              <span className="bg-white/20 px-2 py-0.5 rounded-lg border border-white/10">
                ⏳ {pendingSyncCount} معاملة بانتظار المزامنة
              </span>
            )}
          </div>
        )}

        {isOfflineSimulated && isOnline && (
          <div className="bg-slate-700 text-white text-[10px] font-black py-2 px-4 shadow-md text-center flex items-center justify-center gap-2 transition-all relative z-30">
            <WifiOff className="w-3.5 h-3.5 animate-pulse" />
            <span>تنبيه: محاكاة وضع أوفلاين نشطة للتدقيق الفني</span>
          </div>
        )}

        {/* C. HEADER */}

        {/* C1. Desktop Main Header (Hidden on Mobile) */}
        <header className="h-14 bg-white border-b border-slate-200 hidden md:flex items-center justify-between px-6 shrink-0 relative z-10 transition-colors">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-black text-slate-800 tracking-tight">
              {activeTab === 'dashboard' && 'البيانات والتحليلات'}
              {activeTab === 'customers' && 'كشف حسابات العملاء'}
              {activeTab === 'reminders' && 'مساعد التذكيرات الذكي'}
              {activeTab === 'utilities' && 'أدوات الدفتر'}
              {activeTab === 'team' && 'فريق العمل'}
            </h2>
            <div className="flex items-center gap-2">
              <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black transition-all ${
                isOnline 
                  ? (isSyncing ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600')
                  : 'bg-amber-50 text-amber-600'
              }`}>
                <span className={`w-1 h-1 rounded-full ${
                  !isOnline ? 'bg-amber-500 animate-pulse' : (isSyncing ? 'bg-indigo-500 animate-spin' : 'bg-emerald-500 animate-pulse')
                }`} />
                {!isOnline ? 'وضع أوفلاين' : (isSyncing ? 'جاري التحديث...' : 'مزامن لحظياً')}
              </span>
              
              {activeMembersCount > 1 && isOnline && (
                <span className="flex items-center gap-1 bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full text-[9px] font-black">
                  <UserCheck className="w-2.5 h-2.5" />
                  {activeMembersCount} نشطون
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-slate-50 py-1.5 px-3 rounded-xl border border-slate-150 text-[10px] font-black">
              <div className="space-y-0.5 text-right">
                <span className="text-[8px] text-slate-450 block">الديون:</span>
                <span className="text-rose-600">{formatCurrency(summary.grandTotalRemaining)}</span>
              </div>
              <div className="h-4 w-px bg-slate-200" />
              <div className="space-y-0.5 text-right">
                <span className="text-[8px] text-slate-450 block">المحصل:</span>
                <span className="text-emerald-600">{formatCurrency(summary.grandTotalPaid)}</span>
              </div>
            </div>

            <button
              onClick={triggerAddCustomer}
              className="bg-sky-900 hover:bg-sky-950 text-white font-black px-3 py-1.5 rounded-xl text-[10px] transition-all shadow-xs shrink-0 cursor-pointer border-b border-amber-500 flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>عميل جديد</span>
            </button>
          </div>
        </header>

        {/* C2. Mobile Brand Header (Hidden on Desktop) */}
        <header className="bg-white border-b border-slate-100 shadow-2xs shrink-0 block md:hidden relative z-20 transition-colors">
          <div className="px-4 py-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {renderVisualIdentity('sm')}
                <div>
                  <h1 className="text-xs font-black text-slate-800 leading-none truncate max-w-[140px]">{businessName}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-[9px] text-amber-600 font-bold">{translateRole(profile?.role)}</p>
                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                    <span className={`flex items-center gap-1 text-[8px] font-bold ${
                      !isOnline ? 'text-amber-600' : (isSyncing ? 'text-indigo-600' : 'text-emerald-600')
                    }`}>
                      <span className={`w-1 h-1 rounded-full ${
                        !isOnline ? 'bg-amber-500' : (isSyncing ? 'bg-indigo-500 animate-spin' : 'bg-emerald-500 animate-pulse')
                      }`} />
                      {!isOnline ? 'وضع أوفلاين' : (isSyncing ? 'جاري المزامنة' : 'متصل')}
                    </span>
                    {!isOnline && pendingSyncCount > 0 && (
                      <>
                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                        <span className="text-[8px] font-black text-indigo-600">⏳ {pendingSyncCount} معلقة</span>
                      </>
                    )}
                  </div>
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
              {showTeamTab && (
                <button
                  onClick={() => setActiveTab('team')}
                  className={`py-2 px-3 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                    activeTab === 'team'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  فريق العمل
                </button>
              )}
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
        <main className="flex-1 p-3 md:p-5 overflow-y-auto max-w-7xl w-full mx-auto md:max-w-none">
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

              {activeTab === 'team' && (
                <TeamTab />
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
        <footer className="bg-white border-t border-slate-100 text-center py-4 text-slate-400 text-[10px] shrink-0 font-medium space-y-1 transition-colors">
          <p>{businessName} {businessDesc ? `ـ ${businessDesc}` : 'لتوزيع الأغذية والمشروبات'} © ٢٠٢٦ | المندوب {profile?.delegateName || 'عبدالرحمن كنعان'} | {profile?.phone ? `هاتف: ${profile.phone}` : 'هاتف: 0958280936'}</p>
          <p className="text-[9px] text-slate-350">{copyrightText}</p>
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
        onClose={() => {
          setIsTxModalOpen(false);
          setTxInitialAmount(undefined);
          setTxInitialNotes(undefined);
        }}
        customers={db.customers}
        customerId={txCustomerId}
        customerName={txCustomerName}
        type={txType}
        initialAmount={txInitialAmount}
        initialNotes={txInitialNotes}
        onSave={handleSaveTransaction}
      />

    </div>
  );
}
