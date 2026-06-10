/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  DatabaseState, 
  Customer, 
  Transaction, 
  getCustomerBalances, 
  CustomerBalance,
  deleteCustomer,
  deleteTransaction
} from '../lib/db';
import { useFirebase } from '../lib/FirebaseContext';
import { formatCurrency, formatDate, formatPhoneNumberForUrl } from '../lib/utils';
import { 
  Search, 
  UserPlus, 
  Trash2, 
  Phone, 
  Mail, 
  FileText, 
  Calendar, 
  Plus, 
  Minus, 
  ArrowLeft,
  ChevronLeft,
  Printer,
  FileSpreadsheet,
  AlertCircle,
  X,
  Sparkles,
  MapPin,
  SlidersHorizontal,
  ArrowUpDown,
  Send
} from 'lucide-react';
import { QuickActionFAB } from './QuickActionFAB';
import { StatementPreviewModal } from './StatementPreviewModal';
import { motion, AnimatePresence } from 'motion/react';


interface CustomersTabProps {
  db: DatabaseState;
  onRefresh: () => void;
  selectedCustomerIdInitially: string | null;
  clearInitialSelection: () => void;
  onAddCustomerTrigger: () => void;
  onAddTransactionTrigger: (customerId: string, type: 'debt' | 'payment') => void;
  onEditCustomerTrigger: (customer: Customer) => void;
}

export function CustomersTab({
  db,
  onRefresh,
  selectedCustomerIdInitially,
  clearInitialSelection,
  onAddCustomerTrigger,
  onAddTransactionTrigger,
  onEditCustomerTrigger,
}: CustomersTabProps) {
  const { user, deleteCustomerFromFS, deleteTransactionFromFS } = useFirebase();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'debtors' | 'settled' | 'overdue'>('all');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [sortType, setSortType] = useState<'default' | 'debt_desc' | 'oldest_debt'>('default');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  
  // Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message?: string;
    details?: {
      type: 'debt' | 'payment' | 'customer';
      amountLabel?: string;
      secondaryLabel?: string;
      dateLabel?: string;
      notesLabel?: string;
    };
    onConfirm: () => void;
  } | null>(null);

  // Sync initial select request from dashboard clicks
  React.useEffect(() => {
    if (selectedCustomerIdInitially) {
      setSelectedCustomerId(selectedCustomerIdInitially);
      clearInitialSelection();
    }
  }, [selectedCustomerIdInitially]);

  // Sync initial filter request from classification clicks
  React.useEffect(() => {
    const queryFilter = searchParams.get('filter');
    if (queryFilter && ['all', 'debtors', 'settled', 'overdue'].includes(queryFilter)) {
      setFilterType(queryFilter as 'all' | 'debtors' | 'settled' | 'overdue');
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('filter');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const balances = useMemo(() => getCustomerBalances(db), [db]);

  // Extract all unique regions dynamically from current customer balances
  const regions = useMemo(() => {
    const list = balances
      .map(b => b.customer.region?.trim())
      .filter((r): r is string => !!r && r.length > 0);
    return Array.from(new Set(list));
  }, [balances]);

  // Map balances with precomputed oldest unpaid debt date for high-performance sorting
  const balancesWithOldestDebt = useMemo(() => {
    return balances.map(item => {
      const debts = db.transactions.filter(tx => tx.customerId === item.customer.id && tx.type === 'debt');
      const sortedDebts = [...debts].sort((a, b) => a.date.localeCompare(b.date));
      const oldestDebtDate = item.remainingDebt > 0 && sortedDebts.length > 0 ? sortedDebts[0].date : '9999-12-31';
      return {
        ...item,
        oldestDebtDate
      };
    });
  }, [balances, db.transactions]);

  // Filter & Sort customers list
  const filteredCustomers = useMemo(() => {
    const queryNormalized = searchQuery.trim().toLowerCase();
    
    let result = balancesWithOldestDebt.filter(item => {
      const matchSearch = 
        item.customer.name.toLowerCase().includes(queryNormalized) || 
        item.customer.phone.includes(searchQuery) ||
        (item.customer.notes && item.customer.notes.toLowerCase().includes(queryNormalized)) ||
        (item.customer.region && item.customer.region.toLowerCase().includes(queryNormalized));

      if (!matchSearch) return false;

      // Filter by dynamic region
      if (selectedRegion !== 'all') {
        if (!item.customer.region || item.customer.region.trim() !== selectedRegion) {
          return false;
        }
      }

      if (filterType === 'debtors') {
        return item.remainingDebt > 0;
      }
      if (filterType === 'settled') {
        return item.remainingDebt === 0;
      }
      if (filterType === 'overdue') {
        return item.isOverdue && item.remainingDebt > 0;
      }
      return true;
    });

    // Sort according to user preference
    if (sortType === 'debt_desc') {
      result.sort((a, b) => b.remainingDebt - a.remainingDebt);
    } else if (sortType === 'oldest_debt') {
      result.sort((a, b) => a.oldestDebtDate.localeCompare(b.oldestDebtDate));
    } else {
      // Default: sort by newest created customer
      result.sort((a, b) => b.customer.createdAt.localeCompare(a.customer.createdAt));
    }

    return result;
  }, [balancesWithOldestDebt, searchQuery, filterType, selectedRegion, sortType]);

  const activeCustomerInfo = useMemo(() => {
    if (!selectedCustomerId) return null;
    return balances.find(b => b.customer.id === selectedCustomerId) || null;
  }, [balances, selectedCustomerId]);

  const activeTransactions = useMemo(() => {
    if (!selectedCustomerId) return [];
    return db.transactions
      .filter(tx => tx.customerId === selectedCustomerId)
      .sort((a, b) => b.date.localeCompare(a.date)); // Newest first
  }, [db.transactions, selectedCustomerId]);

  const generateWhatsAppLink = (phone: string, text: string) => {
    return `https://wa.me/${formatPhoneNumberForUrl(phone)}?text=${encodeURIComponent(text)}`;
  };

  const handleExportStatementToWhatsApp = async () => {
    if (!activeCustomerInfo) return;
    const { customer, totalDebt, totalPaid, remainingDebt } = activeCustomerInfo;

    // Create details for WhatsApp transmission
    let text = `💼 *كشف مالي معتمد - مجموعة كنعان الذكية* 🧾\n`;
    text += `*العميل الكريم:* ${customer.name}\n`;
    if (customer.region) {
      text += `*المنطقة / البلد:* ${customer.region}\n`;
    }
    text += `*جوال:* ${customer.phone}\n`;
    text += `-------------------------------------\n`;
    text += `• الرصيد المطلوب كلياً ذمة: *${formatCurrency(remainingDebt)}*\n`;
    text += `• إجمالي المسحوبات (الدين): *${formatCurrency(totalDebt)}*\n`;
    text += `• إجمالي المدفوع الموثق: *${formatCurrency(totalPaid)}*\n`;
    text += `-------------------------------------\n`;
    text += `📂 *المرفق المالي:* تم الآن إصدار وتنزيل كشف الحساب المالي التفصيلي كملف PDF رسمي موقع وموثق باسمكم، يرجى تفقده بالمرفقات. 🌾📎\n\n`;
    text += `أخوكم عبدالرحمن كنعان لتوزيع الأغذية والمشروبات 🌾\n`;
    text += `للاستعلام والطلب: 0958280936 📞`;

    window.open(generateWhatsAppLink(customer.phone, text), '_blank');
  };

  const handleDeleteCustomerClicked = (id: string, name: string) => {
    const customer = db.customers.find(c => c.id === id);
    const regionText = customer?.region ? customer.region : 'غير محددة';
    const phoneText = customer?.phone ? customer.phone : 'غير متوفر';

    setConfirmDialog({
      isOpen: true,
      title: 'حذف حساب العميل',
      details: {
        type: 'customer',
        amountLabel: name,
        secondaryLabel: `المنطقة: ${regionText}`,
        dateLabel: `الهاتف: ${phoneText}`,
        notesLabel: customer?.notes || undefined,
      },
      onConfirm: async () => {
        if (user) {
          await deleteCustomerFromFS(id);
        } else {
          deleteCustomer(id);
        }
        setSelectedCustomerId(null);
        onRefresh();
        setConfirmDialog(null);
      }
    });
  };

  const handleDeleteTxClicked = (txId: string) => {
    const tx = db.transactions.find(t => t.id === txId);
    if (!tx) return;

    setConfirmDialog({
      isOpen: true,
      title: 'تأكيد حذف القيد المالي',
      details: {
        type: tx.type,
        amountLabel: formatCurrency(tx.amount),
        secondaryLabel: tx.type === 'debt' ? 'دين مالي (مسحوب)' : 'سداد مالي (دفعة مقبوضة)',
        dateLabel: formatDate(tx.date),
        notesLabel: tx.notes || undefined,
      },
      onConfirm: async () => {
        if (user) {
          await deleteTransactionFromFS(txId);
        } else {
          deleteTransaction(txId);
        }
        onRefresh();
        setConfirmDialog(null);
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
      {/* Statement Preview Modal */}
      {activeCustomerInfo && (
        <StatementPreviewModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          balance={activeCustomerInfo}
          transactions={activeTransactions}
        />
      )}
      
      {/* Confirmation Dialog Component */}
      <AnimatePresence>
        {confirmDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmDialog(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />
            
            {/* Dialog Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full text-right border border-slate-100 z-10 relative overflow-hidden"
              dir="rtl"
            >
              {/* Top Accent Bar */}
              <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-l from-rose-500 via-amber-500 to-rose-600" />

              {/* Header Icon + Title */}
              <div className="flex items-center gap-3 mb-5 mt-2">
                <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 leading-tight">
                    {confirmDialog.title}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 mt-1">
                    إجراء حساس يتطلب التحقق لضمان الدقة
                  </p>
                </div>
              </div>

              {/* Message */}
              {confirmDialog.message && (
                <p className="text-xs text-slate-600 font-medium leading-relaxed mb-6 bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                  {confirmDialog.message}
                </p>
              )}

              {/* Transaction / Customer Structured Details */}
              {confirmDialog.details && (
                <div className="mb-5 space-y-3">
                  <div className="text-center p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                    <span className="text-[9px] font-bold text-slate-400 block mb-1">
                      {confirmDialog.details.type === 'customer' ? 'الاسم الكامل للعميل المراد حذفه' : 'القيمة المالية المسجلة بالقيد'}
                    </span>
                    <span className={`text-base font-black ${
                      confirmDialog.details.type === 'debt' 
                        ? 'text-rose-600' 
                        : confirmDialog.details.type === 'payment' 
                        ? 'text-emerald-600' 
                        : 'text-slate-800'
                    }`}>
                      {confirmDialog.details.amountLabel}
                    </span>
                    {confirmDialog.details.secondaryLabel && (
                      <span className="text-[10px] font-black text-slate-500 block mt-1.5 bg-white border border-slate-200/40 rounded-full py-0.5 px-3.5 inline-block mx-auto shadow-xs">
                        {confirmDialog.details.secondaryLabel}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-1.5 text-[11px] font-bold text-slate-600 bg-slate-50/40 rounded-xl p-1">
                    {confirmDialog.details.dateLabel && (
                      <div className="flex items-center justify-between p-2 hover:bg-white rounded-lg transition-all">
                        <span className="text-slate-400 font-medium select-none">
                          {confirmDialog.details.type === 'customer' ? 'رقم الهاتف:' : 'تاريخ القيد:'}
                        </span>
                        <span>{confirmDialog.details.dateLabel}</span>
                      </div>
                    )}
                    {confirmDialog.details.notesLabel && (
                      <div className="p-2 hover:bg-white rounded-lg transition-all border border-dashed border-slate-100 mt-1">
                        <span className="text-slate-400 font-medium block mb-1 select-none">
                          بيان الملاحظة الموثقة:
                        </span>
                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed bg-slate-100/30 rounded-lg p-2 text-right">
                          {confirmDialog.details.notesLabel}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Security warning notice */}
              <div className="text-[9px] text-rose-500 font-bold bg-rose-50/30 border border-rose-100/30 rounded-xl p-2.5 text-center mb-5">
                ⚠️ تنبيه: بمجرد التأكيد، سيتم حذف السجل نهائياً وتحديث كافة التقارير والحسابات المرتبطة تلقائياً. لا يمكن التراجع عن هذا الإجراء لضمان الدقة المالية.
              </div>

              {/* Actions Footer */}
              <div className="flex gap-2.5">
                <button 
                  onClick={() => setConfirmDialog(null)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200/50 hover:border-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-center"
                >
                  إلغاء التراجع
                </button>
                <button 
                  onClick={confirmDialog.onConfirm}
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-center"
                >
                  تأكيد الحذف
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* LEFT COLUMN: CUSTOMERS DIRECTORY */}
      <div className={`lg:col-span-1 space-y-4 ${selectedCustomerId ? 'hidden lg:block' : 'block'}`}>
        {/* Actions & Filters Header */}
        <div className="flex flex-col gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">قائمة العملاء ({filteredCustomers.length})</h3>
            <button
              onClick={onAddCustomerTrigger}
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 py-2 px-3.5 rounded-xl transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              عميل جديد
            </button>
          </div>

          {/* Search box */}
          <div className="relative">
            <input
              type="text"
              placeholder="ابحث بالاسم، برقم الهاتف، أو الملاحظات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all text-right placeholder-slate-400 font-medium"
            />
            <Search className="w-4 h-4 absolute inset-y-0 right-3.5 flex items-center my-auto text-slate-400 pointer-events-none" />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 left-3 flex items-center my-auto text-slate-400 hover:text-indigo-600 transition-colors p-1 rounded-full hover:bg-slate-200/55 cursor-pointer animate-fade-in"
                title="مسح البحث"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <Sparkles className="w-3.5 h-3.5 absolute inset-y-0 left-3.5 my-auto text-indigo-400 pointer-events-none" />
            )}
          </div>

          {/* Smart Search metadata tag helpers */}
          <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 px-1 leading-none -mt-1 shrink-0 pb-1">
            <span className="flex items-center gap-0.5 text-indigo-600">
              <Sparkles className="w-3 h-3 text-indigo-500 animate-pulse" />
              فلترة ذكية فورية نشطة
            </span>
            <span>الاسم • الهاتف • الملاحظات</span>
          </div>

          {/* Sort & Region filter controls */}
          <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-[10px] font-bold">
            <div className="space-y-1 text-right">
              <label className="text-[9px] text-slate-400 block font-bold flex items-center gap-0.5">
                <MapPin className="w-3 h-3 text-indigo-500 shrink-0" />
                تصفية بالمنطقة:
              </label>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] text-slate-700 font-bold focus:outline-hidden focus:border-indigo-500 cursor-pointer"
              >
                <option value="all">كل المناطق ({balances.length})</option>
                {regions.map(r => (
                  <option key={r} value={r}>
                    {r} ({balances.filter(b => b.customer.region?.trim() === r).length})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1 text-right">
              <label className="text-[9px] text-slate-400 block font-bold flex items-center gap-0.5">
                <ArrowUpDown className="w-3 h-3 text-indigo-500 shrink-0" />
                ترتيب الحسابات:
              </label>
              <select
                value={sortType}
                onChange={(e) => setSortType(e.target.value as any)}
                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] text-slate-700 font-bold focus:outline-hidden focus:border-indigo-500 cursor-pointer"
              >
                <option value="default">الأحدث انضماماً 🆕</option>
                <option value="debt_desc">الأكثر مديونية 📉</option>
                <option value="oldest_debt">أقدم ذمة لم تسدد ⏳</option>
              </select>
            </div>
          </div>

          {/* Filter segment tabs */}
          <div className="grid grid-cols-4 gap-1 bg-slate-50 p-1 rounded-xl text-[10px] font-bold">
            <button
              onClick={() => setFilterType('all')}
              className={`py-1.5 rounded-lg text-center cursor-pointer transition-all ${
                filterType === 'all' ? 'bg-white text-slate-800 shadow-xs border border-slate-200/50' : 'text-slate-500 hover:text-slate-800 border border-transparent'
              }`}
            >
              الكل ({balances.length})
            </button>
            <button
              onClick={() => setFilterType('debtors')}
              className={`py-1.5 rounded-lg text-center cursor-pointer transition-all ${
                filterType === 'debtors' ? 'bg-white text-rose-600 shadow-xs border border-rose-100/45' : 'text-slate-500 hover:text-rose-500 border border-transparent'
              }`}
            >
              دين ({balances.filter(b => b.remainingDebt > 0).length})
            </button>
            <button
              onClick={() => setFilterType('settled')}
              className={`py-1.5 rounded-lg text-center cursor-pointer transition-all ${
                filterType === 'settled' ? 'bg-white text-emerald-600 shadow-xs border border-emerald-100/45' : 'text-slate-500 hover:text-emerald-500 border border-transparent'
              }`}
            >
              خالص ({balances.filter(b => b.remainingDebt === 0).length})
            </button>
            <button
              onClick={() => setFilterType('overdue')}
              className={`py-1.5 rounded-lg text-center cursor-pointer transition-all ${
                filterType === 'overdue' ? 'bg-white text-amber-600 shadow-xs border border-amber-100/45' : 'text-slate-500 hover:text-amber-500 border border-transparent'
              }`}
            >
              متأخر ({balances.filter(b => b.isOverdue && b.remainingDebt > 0).length})
            </button>
          </div>
        </div>

        {/* Dynamic Customers List */}
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {filteredCustomers.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-100 text-slate-400 text-xs">
              <AlertCircle className="w-8 h-8 text-slate-350 mx-auto mb-2" />
              لا يوجد عملاء يطابقون خيارات البحث الحالية.
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredCustomers.map((item, idx) => {
                const isSelected = selectedCustomerId === item.customer.id;
                
                const queryNormalized = searchQuery.trim().toLowerCase();
                const nameMatch = queryNormalized && item.customer.name.toLowerCase().includes(queryNormalized);
                const phoneMatch = queryNormalized && item.customer.phone.includes(queryNormalized);
                const notesMatch = queryNormalized && item.customer.notes && item.customer.notes.toLowerCase().includes(queryNormalized);

                return (
                  <motion.div
                    key={item.customer.id}
                    layoutId={`client-card-${item.customer.id}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.2, delay: Math.min(idx * 0.015, 0.15), ease: "easeOut" }}
                    whileHover={{ scale: 1.01, x: -1 }}
                    whileTap={{ scale: 0.995 }}
                    style={{ willChange: "transform, opacity" }}
                    onClick={() => setSelectedCustomerId(item.customer.id)}
                    className={`p-4 bg-white rounded-2xl border cursor-pointer flex items-center justify-between group transition-[border-color,background-color] duration-150 ${
                      isSelected 
                        ? 'border-indigo-500 bg-indigo-50/10 shadow-xs' 
                        : 'border-slate-100 shadow-2xs hover:border-slate-200'
                    }`}
                  >
                    <div className="space-y-1.5 text-right flex-1 min-w-0 pr-1">
                      <h4 className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                        {item.customer.name}
                        {nameMatch && (
                          <span className="bg-indigo-50 border border-indigo-100/50 text-indigo-600 px-1 py-0.5 rounded text-[8px] font-black shrink-0 scale-90">الاسم</span>
                        )}
                      </h4>
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                        <span>{item.customer.phone}</span>
                        {item.customer.region && (
                          <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md font-bold text-[8px] flex items-center gap-0.5" title="المنطقة أو المدينة">
                            <MapPin className="w-2.5 h-2.5 text-indigo-500" />
                            {item.customer.region}
                          </span>
                        )}
                        {item.isOverdue && (
                          <span className="bg-amber-50 text-amber-600 px-1 py-0.5 rounded-sm font-bold text-[8px]">فات الاستحقاق</span>
                        )}
                        {sortType === 'oldest_debt' && item.remainingDebt > 0 && item.oldestDebtDate !== '9999-12-31' && (
                          <span className="bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded-sm font-bold text-[8px] tracking-tight">
                            أقدم مستحق: {item.oldestDebtDate}
                          </span>
                        )}
                        {phoneMatch && (
                          <span className="bg-blue-50 border border-blue-100/50 text-blue-600 px-1 py-0.5 rounded-md font-bold text-[8px] tracking-tight">رقم مطابق</span>
                        )}
                        {notesMatch && (
                          <span className="bg-purple-50 border border-purple-100/50 text-purple-600 px-1 py-0.5 rounded-md font-bold text-[8px] tracking-tight truncate max-w-[100px]" title={item.customer.notes}>ملاحظة مطابقة</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-left shrink-0 pl-1">
                      <span className="text-[10px] text-slate-400 block font-semibold mb-0.5">المتبقي</span>
                      <span className={`text-xs font-black ${
                        item.remainingDebt > 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}>
                        {formatCurrency(item.remainingDebt)}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: CHOSEN CUSTOMER STATEMENT OF ACCOUNT */}
      <div className={`lg:col-span-2 ${selectedCustomerId ? 'block' : 'hidden lg:block'}`}>
        <AnimatePresence mode="wait">
          {!activeCustomerInfo ? (
            <motion.div 
              key="placeholder-account"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              style={{ willChange: "transform, opacity" }}
              className="h-96 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-400 space-y-3"
            >
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-700">اضغط على أي عميل لمتابعة كشف الحساب</h4>
                <p className="text-xs mt-1">يمكنك من هنا مراجعة تفاصيل المعاملات، تسجيل دفعات السداد المستلمة، وتعديل جهات الاتصال أو طباعتها.</p>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key={activeCustomerInfo.customer.id}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              style={{ willChange: "transform, opacity" }}
              className="space-y-5 bg-white rounded-2xl border border-slate-100 p-6 shadow-xs relative"
            >
              
          {/* Back Button (Only seen on mobile/tablet) */}
              <button
                type="button"
                onClick={() => setSelectedCustomerId(null)}
                className="lg:hidden flex items-center gap-1 text-xs font-semibold text-indigo-600 mb-3 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                الرجوع لدليل العملاء
              </button>

            {/* Profile Info Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-5 border-b border-slate-100 gap-4">
              <div className="space-y-1.5 text-right">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md font-bold">بطاقة عميل</span>
                  {activeCustomerInfo.customer.region && (
                    <span className="text-[10px] bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md font-bold flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                      {activeCustomerInfo.customer.region}
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-slate-800">{activeCustomerInfo.customer.name}</h3>
                
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
                  <div className="flex items-center gap-1" dir="ltr">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{activeCustomerInfo.customer.phone}</span>
                  </div>
                  {activeCustomerInfo.customer.email && (
                    <div className="flex items-center gap-1" dir="ltr">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{activeCustomerInfo.customer.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>انضم: {formatDate(activeCustomerInfo.customer.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Edit / Delete profile control center */}
              <div className="flex items-center gap-2 self-start md:self-center">
                <button
                  onClick={() => onEditCustomerTrigger(activeCustomerInfo.customer)}
                  className="px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer"
                >
                  تعديل الملف
                </button>
                <button
                  onClick={() => handleDeleteCustomerClicked(activeCustomerInfo.customer.id, activeCustomerInfo.customer.name)}
                  className="p-2 bg-red-50 hover:bg-red-150 text-red-600 rounded-xl transition-all cursor-pointer"
                  title="حذف العميل نهائياً"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 mb-4">
               <button
                  onClick={() => setIsExportModalOpen(true)}
                  className="w-full flex justify-center items-center gap-3 px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl transition-all cursor-pointer shadow-md text-lg font-black"
                  title="تصدير كشف حساب"
                >
                  <FileText className="w-6 h-6" />
                  معاينة وتصدير كشف الحساب
                </button>
            </div>

            {/* Detailed financial status summary for selected customer */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl text-right">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold block">إجمالي الديون المسجلة</span>
                <span className="text-base font-black text-rose-600">{formatCurrency(activeCustomerInfo.totalDebt)}</span>
              </div>
              <div className="space-y-1 border-r border-slate-200 pr-3">
                <span className="text-[10px] text-slate-400 font-bold block">إجمالي المسدد الفعلي</span>
                <span className="text-base font-black text-emerald-600">✓ {formatCurrency(activeCustomerInfo.totalPaid)}</span>
              </div>
              <div className="space-y-1 border-r border-slate-200 pr-3">
                <span className="text-[10px] text-slate-400 font-bold block">الذمة المتبقية الحالية</span>
                <span className={`text-base font-black ${
                  activeCustomerInfo.remainingDebt > 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}>
                  {formatCurrency(activeCustomerInfo.remainingDebt)}
                </span>
              </div>
            </div>

            {activeCustomerInfo.customer.notes && (
              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/40 text-xs text-indigo-900">
                <strong>ملاحظة التاجر: </strong>
                {activeCustomerInfo.customer.notes}
              </div>
            )}

            {/* Print Account & New Entries Triggers */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportStatementToWhatsApp}
                  className="flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>مشاركة واتساب كنعان 🌾</span>
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onAddTransactionTrigger(activeCustomerInfo.customer.id, 'payment')}
                  className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 py-2 px-3.5 rounded-xl transition-all cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                  تسجيل سداد دفعة
                </button>
                <button
                  onClick={() => onAddTransactionTrigger(activeCustomerInfo.customer.id, 'debt')}
                  className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 py-2 px-3.5 rounded-xl transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  تسجيل دين جديد
                </button>
              </div>
            </div>

            {/* Individual Account Statement Record list */}
            <div className="pt-2">
              <h4 className="text-xs font-bold text-slate-700 mb-2">الدقتر التفصيلي للحركات المالية</h4>
              
              {activeTransactions.length === 0 ? (
                <div className="p-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                  لا توجد أي قيود مالية مقيدة في ذمة هذا العميل حتى الآن.
                </div>
              ) : (
                <div className="border border-slate-100 rounded-2xl overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
                  <table className="w-full min-w-[650px] text-right text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-505 text-[10px] font-bold">
                        <th className="px-4 py-2.5">التاريخ</th>
                        <th className="px-4 py-2.5">نوع الحركة</th>
                        <th className="px-4 py-2.5 text-slate-600">بيان المعاملة</th>
                        <th className="px-4 py-2.5 text-amber-900">موعد الاستحقاق</th>
                        <th className="px-4 py-2.5">القيمة المالية</th>
                        <th className="px-4 py-2.5 text-center">إجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {activeTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 font-medium text-slate-500">{tx.date}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-sm font-bold text-[9px] ${
                              tx.type === 'debt' 
                                ? 'bg-rose-50 text-rose-600' 
                                : 'bg-emerald-50 text-emerald-600'
                            }`}>
                              {tx.type === 'debt' ? 'دين جديد (+)' : 'سداد دفعة (-)'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600 max-w-[180px] truncate" title={tx.notes}>
                            {tx.notes || '---'}
                          </td>
                          <td className="px-4 py-3 text-slate-500">
                            {tx.dueDate ? (
                              <span className="font-semibold text-rose-500">{tx.dueDate}</span>
                            ) : (
                              <span className="text-slate-300">بلا تاريخ استحقاق</span>
                            )}
                          </td>
                          <td className={`px-4 py-3 font-bold ${
                            tx.type === 'debt' ? 'text-rose-600' : 'text-emerald-600'
                          }`}>
                            {tx.type === 'debt' ? '+' : '-'}{formatCurrency(tx.amount)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleDeleteTxClicked(tx.id)}
                              className="text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-100 p-1.5 rounded-lg transition-all cursor-pointer inline-flex items-center justify-center shadow-2xs hover:shadow-xs hover:scale-105 active:scale-95"
                              title="حذف هذا القيد المالي"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </motion.div>
        )}
        </AnimatePresence>
      </div>

    </div>
  );
}
