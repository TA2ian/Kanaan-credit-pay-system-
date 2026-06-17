/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Customer, TransactionType, CustomerClassification, Transaction } from '../lib/db';
import { X, UserPlus, FileSpreadsheet, PlusCircle, Calendar, ShieldCheck, DollarSign, Contact, Archive } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency } from '../lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// 1. ADD / EDIT CUSTOMER MODAL
interface CustomerModalProps extends ModalProps {
  customer?: Customer; // If provided, we are in edit mode
  onSave: (name: string, phone: string, email?: string, notes?: string, region?: string, classification?: CustomerClassification) => void;
}

export function CustomerModal({ isOpen, onClose, customer, onSave }: CustomerModalProps) {
  const [name, setName] = useState(customer?.name || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [email, setEmail] = useState(customer?.email || '');
  const [notes, setNotes] = useState(customer?.notes || '');
  const [region, setRegion] = useState(customer?.region || '');
  const [classification, setClassification] = useState<CustomerClassification | undefined>(customer?.classification);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (customer) {
      setName(customer.name);
      setPhone(customer.phone);
      setEmail(customer.email || '');
      setNotes(customer.notes || '');
      setRegion(customer.region || '');
      setClassification(customer.classification);
    } else {
      setName('');
      setPhone('');
      setEmail('');
      setNotes('');
      setRegion('');
      setClassification(undefined);
    }
    setError('');
  }, [customer, isOpen]);

  const handlePickContact = async () => {
    setError('');
    
    // Check if nesting in an iframe prevents using the Top Frame API
    const isInsideIframe = window.self !== window.top;
    if (isInsideIframe) {
      setError('⚠️ لا يمكن استعراض مذكرات الهاتف عندما يكون التطبيق داخل بيئة استعراض فرعية (iFrame). يرجى فتح التطبيق في نافذة مستقلة/خارجية (Open in New Tab) في الشريط العلوي لتتمكن من ملء بيانات عملائك بضغطة زر.');
      return;
    }

    try {
      if ('contacts' in navigator && (navigator as any).contacts) {
        const props = ['name', 'tel'];
        const opts = { multiple: false };
        const contacts = await (navigator as any).contacts.select(props, opts);
        if (contacts && contacts.length > 0) {
          const contact = contacts[0];
          if (contact.name && contact.name.length > 0) {
            setName(contact.name[0]);
          }
          if (contact.tel && contact.tel.length > 0) {
            const rawPhone = contact.tel[0];
            const cleanPhone = rawPhone.replace(/[^\d+]/g, '');
            setPhone(cleanPhone);
          }
        }
      } else {
        setError('واجهة برمجة تحديد جهات الاتصال غير متوافقة مع متصفحك الحالي، تأكد من دعم تطبيق PWA المتقدم.');
      }
    } catch (err: any) {
      console.error(err);
      setError('حدث خطأ أثناء جلب جهة الاتصال: ' + (err.message || 'الصلاحية مرفوضة'));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('يرجى ملء اسم العميل الكريم.');
      return;
    }
    if (!phone.trim()) {
      setError('يرجى ملء رقم الهاتف الواتساب.');
      return;
    }
    onSave(name.trim(), phone.trim(), email.trim(), notes.trim(), region.trim(), classification);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs cursor-default"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ willChange: 'opacity' }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div 
            className="w-full max-w-md overflow-hidden bg-white rounded-[28px] shadow-2xl border border-slate-100 relative z-10"
            initial={{ scale: 0.95, y: 15, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 15, opacity: 0 }}
            style={{ willChange: 'transform, opacity' }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-100 transition-colors">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2.5 tracking-tight">
                <UserPlus className="w-5 h-5 text-indigo-600" style={{ color: 'var(--brand-color)' }} />
                {customer ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}
              </h3>
              <button 
                type="button"
                onClick={onClose}
                className="p-1.5 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-3.5 custom-scrollbar max-h-[80vh] overflow-y-auto">
              {error && (
                <div className="p-3.5 text-xs font-bold text-rose-600 bg-rose-50 rounded-2xl border border-rose-100 shadow-inner-sm">
                  {error}
                </div>
              )}

              {('contacts' in navigator && (window as any).ContactsManager) && (
                <button
                  type="button"
                  onClick={handlePickContact}
                  className="w-full flex items-center justify-center gap-2.5 py-3 px-4 bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-100 rounded-2xl text-[10px] font-black transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-xs"
                >
                  <Contact className="w-4 h-4 text-indigo-600" style={{ color: 'var(--brand-color)' }} />
                  استيراد من جهات الاتصال
                </button>
              )}

              <div className="space-y-3.5">
                <div className="group">
                  <label className="block mb-1 text-[10px] font-black text-slate-400 uppercase tracking-wider">اسم العميل بالكامل *</label>
                  <input
                    type="text"
                    placeholder="مثال: خالد بن أحمد الحامد"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm font-black bg-slate-50 border border-slate-200 rounded-2xl focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all shadow-xs"
                    style={{ borderColor: 'var(--brand-color-soft)' }}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="group">
                    <label className="block mb-1 text-[10px] font-black text-slate-400 uppercase tracking-wider">جوال الواتساب *</label>
                    <input
                      type="text"
                      placeholder="0958280936"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm font-black bg-slate-50 border border-slate-200 rounded-2xl focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all shadow-xs"
                      style={{ borderColor: 'var(--brand-color-soft)' }}
                      dir="ltr"
                      required
                    />
                  </div>
                  <div className="group">
                    <label className="block mb-1 text-[10px] font-black text-slate-400 uppercase tracking-wider">تصنيف العميل</label>
                    <select 
                      value={classification || ''}
                      onChange={(e) => setClassification(e.target.value as CustomerClassification || undefined)}
                      className="w-full px-4 py-2.5 text-sm font-black bg-slate-50 border border-slate-200 rounded-2xl focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all appearance-none shadow-xs"
                      style={{ borderColor: 'var(--brand-color-soft)' }}
                    >
                      <option value="">-- غير مصنف --</option>
                      <option value="distinct">🌟 عميل مميز</option>
                      <option value="struggling">⚠️ عميل متعثر</option>
                      <option value="new">🆕 عميل جديد</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="group">
                    <label className="block mb-1 text-[10px] font-black text-slate-400 uppercase tracking-wider">البريد الإلكتروني</label>
                    <input
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm font-black bg-slate-50 border border-slate-200 rounded-2xl focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all shadow-xs"
                      style={{ borderColor: 'var(--brand-color-soft)' }}
                      dir="ltr"
                    />
                  </div>
                  <div className="group">
                    <label className="block mb-1 text-[10px] font-black text-slate-400 uppercase tracking-wider">المنطقة / العنوان</label>
                    <input
                      type="text"
                      placeholder="دمشق، الميدان..."
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm font-black bg-slate-50 border border-slate-200 rounded-2xl focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all shadow-xs"
                      style={{ borderColor: 'var(--brand-color-soft)' }}
                    />
                  </div>
                </div>

                <div className="group">
                  <label className="block mb-1 text-[10px] font-black text-slate-400 uppercase tracking-wider">ملاحظات إضافية</label>
                  <textarea
                    placeholder="اكتب أي ملاحظات فنية أو محاسبية حول العميل..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2.5 text-sm font-black bg-slate-50 border border-slate-200 rounded-2xl focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all resize-none shadow-xs"
                    style={{ borderColor: 'var(--brand-color-soft)' }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 text-xs font-black text-white rounded-2xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  style={{ backgroundColor: 'var(--brand-color)' }}
                >
                  حفظ البيانات
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 text-xs font-black text-slate-500 bg-slate-100 hover:bg-slate-200 border border-slate-100 rounded-2xl transition-all cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// 2. ADD TRANSACTION MODAL (Debt or Payment)
interface TransactionModalProps extends ModalProps {
  customers?: Customer[]; // Optional list for selection
  customerId?: string; // Optional if selecting from list
  customerName?: string;
  type: TransactionType; // 'debt' (قيد دين) or 'payment' (قيد دفعة مستلمة)
  initialAmount?: number;
  initialNotes?: string;
  onSave: (customerId: string, type: TransactionType, amount: number, notes?: string, dueDate?: string) => void;
}

export function TransactionModal({ isOpen, onClose, customers, customerId, customerName, type, initialAmount, initialNotes, onSave }: TransactionModalProps) {
  const [selectedCustomerId, setSelectedCustomerId] = useState(customerId || '');
  const [amount, setAmount] = useState(initialAmount?.toString() || '');
  const [notes, setNotes] = useState(initialNotes || '');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');

  React.useEffect(() => {
    setSelectedCustomerId(customerId || '');
    setAmount(initialAmount?.toString() || '');
    setNotes(initialNotes || '');
    
    // Default due date to 15 days out
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 15);
    setDueDate(defaultDate.toISOString().split('T')[0]);
    setError('');
  }, [isOpen, customerId, type, customers, initialAmount, initialNotes]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const idToUse = selectedCustomerId || customerId;
    if (!idToUse) {
      setError('يرجى تحديد العميل المستهدف أولاً لتسجيل المعاملة المالية.');
      return;
    }
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      setError('يرجى إدخال مبلغ مالي صحيح أكبر من الصفر.');
      return;
    }
    onSave(
      idToUse,
      type,
      val,
      notes.trim(),
      type === 'debt' && dueDate ? dueDate : undefined
    );
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs cursor-default"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ willChange: 'opacity' }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div 
            className="w-full max-w-md overflow-hidden bg-white rounded-[28px] shadow-2xl border border-slate-100 relative z-10"
            initial={{ scale: 0.95, y: 15, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 15, opacity: 0 }}
            style={{ willChange: 'transform, opacity' }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-6 py-5 border-b border-slate-100 transition-colors ${
              type === 'debt' ? 'bg-amber-50/70' : 'bg-emerald-50/70'
            }`}>
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2.5 tracking-tight">
                {type === 'debt' ? (
                  <>
                    <PlusCircle className="w-5 h-5 text-amber-600" />
                    <span className="text-amber-900">إضافة قيد دين جديد</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <span className="text-emerald-900">تسجيل دفعة سداد مستلمة</span>
                  </>
                )}
              </h3>
              <button 
                type="button"
                onClick={onClose}
                className="p-1.5 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 custom-scrollbar max-h-[85vh] overflow-y-auto">
              <div className="p-3.5 rounded-[22px] bg-slate-50 border border-slate-100 shadow-xs">
                <span className="text-[9px] font-black text-slate-400 uppercase mb-0.5 block">لصالح العميل المستهدف:</span>
                {customers ? (
                    <select 
                        value={selectedCustomerId}
                        onChange={(e) => setSelectedCustomerId(e.target.value)}
                        className="w-full text-sm font-black text-indigo-700 bg-transparent border-none focus:ring-0 p-0 appearance-none cursor-pointer"
                        style={{ color: 'var(--brand-color)' }}
                    >
                        <option value="">-- اختر عميلاً من القائمة --</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                ) : (
                    <span className="text-sm font-black text-slate-800">{customerName || '---'}</span>
                )}
              </div>

              {error && (
                <div className="p-3.5 text-xs font-bold text-rose-600 bg-rose-50 rounded-2xl border border-rose-100 shadow-sm">
                  {error}
                </div>
              )}

              <div className="space-y-3.5">
                <div className="group">
                  <label className="block mb-1 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    {type === 'debt' ? 'قيمة الدين الجديد ($) *' : 'المبلغ المدفوع ($) *'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-4 py-2.5 text-lg font-black text-slate-800 bg-slate-50 border border-slate-200 rounded-[20px] focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all shadow-xs"
                      style={{ borderColor: 'var(--brand-color-soft)' }}
                      required
                    />
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-indigo-600 opacity-60" style={{ color: 'var(--brand-color)' }}>
                      <DollarSign className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {type === 'debt' && (
                  <div className="group">
                    <label className="block mb-1 text-[10px] font-black text-slate-400 uppercase tracking-wider">تاريخ استحقاق السداد *</label>
                    <div className="relative">
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm font-black text-slate-700 bg-slate-50 border border-slate-200 rounded-[20px] focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all shadow-xs"
                        style={{ borderColor: 'var(--brand-color-soft)' }}
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="group">
                  <label className="block mb-1 text-[10px] font-black text-slate-400 uppercase tracking-wider">البيان / ملاحظات العملية</label>
                  <input
                    type="text"
                    placeholder={type === 'debt' ? 'ثمن مواد، صنف تجاري، طلبية...' : 'سداد نقدي، تحويل حساب، شيك...'}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm font-black text-slate-700 bg-slate-50 border border-slate-200 rounded-[20px] focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all shadow-xs"
                    style={{ borderColor: 'var(--brand-color-soft)' }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className={`flex-1 py-3 px-6 text-xs font-black text-white rounded-[20px] shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                    type === 'debt' 
                      ? 'bg-amber-600 hover:bg-amber-700' 
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  حفظ القيد
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 text-xs font-black text-slate-500 bg-slate-100 hover:bg-slate-200 border border-slate-100 rounded-[20px] transition-all cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
