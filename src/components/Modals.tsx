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
            className="w-full max-w-md overflow-hidden bg-white rounded-2xl shadow-xl border border-slate-100 relative z-10"
            initial={{ scale: 0.95, y: 15, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 15, opacity: 0 }}
            style={{ willChange: 'transform, opacity' }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <UserPlus className="w-4.5 h-4.5 text-emerald-600" />
                {customer ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}
              </h3>
              <button 
                type="button"
                onClick={onClose}
                className="p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
              {error && (
                <div className="p-2.5 text-[11px] font-semibold text-red-600 bg-red-50 rounded-xl border border-red-100">
                  {error}
                </div>
              )}

              {('contacts' in navigator && (window as any).ContactsManager) && (
                <button
                  type="button"
                  onClick={handlePickContact}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  <Contact className="w-4 h-4" />
                  استيراد من جهات الاتصال
                </button>
              )}

              <div className="space-y-3.5">
                <div>
                  <label className="block mb-1 text-[11px] font-bold text-slate-600">اسم العميل ثنائي أو ثلاثي *</label>
                  <input
                    type="text"
                    placeholder="مثال: خالد بن أحمد الحامد"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-colors"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1 text-[11px] font-bold text-slate-600">جوال الواتساب *</label>
                    <input
                      type="text"
                      placeholder="0958280936"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-colors"
                      dir="ltr"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-[11px] font-bold text-slate-600">تصنيف العميل</label>
                    <select 
                      value={classification || ''}
                      onChange={(e) => setClassification(e.target.value as CustomerClassification || undefined)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-colors"
                    >
                      <option value="">غير مصنف</option>
                      <option value="distinct">عميل مميز</option>
                      <option value="struggling">عميل متعثر</option>
                      <option value="new">عميل جديد</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1 text-[11px] font-bold text-slate-600">البريد (اختياري)</label>
                    <input
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-colors"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-[11px] font-bold text-slate-600">المنطقة / الحي</label>
                    <input
                      type="text"
                      placeholder="مثال: الحاضر..."
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-1 text-[11px] font-bold text-slate-600">ملاحظات أو نوع النشاط</label>
                  <textarea
                    placeholder="اكتب أي ملاحظات حول العميل..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-colors resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  حفظ وتأكيد
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2 px-4 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
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
            className="w-full max-w-md overflow-hidden bg-white rounded-2xl shadow-xl border border-slate-100 relative z-10"
            initial={{ scale: 0.95, y: 15, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 15, opacity: 0 }}
            style={{ willChange: 'transform, opacity' }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-6 py-4 border-b border-slate-100 ${
              type === 'debt' ? 'bg-amber-50/70' : 'bg-emerald-50/70'
            }`}>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                {type === 'debt' ? (
                  <>
                    <PlusCircle className="w-5 h-5 text-amber-600" />
                    <span className="text-amber-800">إضافة قيد دين جديد</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <span className="text-emerald-800">تسجيل دفعة سداد مستلمة</span>
                  </>
                )}
              </h3>
              <button 
                type="button"
                onClick={onClose}
                className="p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-xs text-slate-500 block">لصالح العميل:</span>
                {customers ? (
                    <select 
                        value={selectedCustomerId}
                        onChange={(e) => setSelectedCustomerId(e.target.value)}
                        className="w-full text-base font-bold text-slate-800 bg-transparent border-none focus:ring-0 p-0"
                    >
                        <option value="">اختر عميلاً من القائمة...</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                ) : (
                    <span className="text-base font-bold text-slate-800">{customerName || '---'}</span>
                )}
              </div>

              {error && (
                <div className="p-3 text-xs font-semibold text-red-600 bg-red-50 rounded-xl border border-red-100">
                  {error}
                </div>
              )}

              <div>
                <label className="block mb-1.5 text-xs font-bold text-slate-700">
                  {type === 'debt' ? 'قيمة الدين الجديد (بالدولار $) *' : 'المبلغ المسدد الموثق (بالدولار $) *'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-3 pr-10 py-2.5 text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-colors"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400 text-xs font-bold">
                    $
                  </div>
                </div>
              </div>

              {type === 'debt' && (
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-slate-700">تاريخ استحقاق السداد المتوقع *</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-colors"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block mb-1.5 text-xs font-bold text-slate-700">بيان القيد / ملاحظات البيع</label>
                <input
                  type="text"
                  placeholder={type === 'debt' ? 'ثمن مواد تجارية، صنف فلان، إلخ...' : 'سداد دفعة نقدية، تحويل بنكي حساب الراجحي، إلخ...'}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-colors"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className={`flex-1 py-2.5 px-4 text-sm font-bold text-white rounded-xl focus:ring-4 transition-all cursor-pointer ${
                    type === 'debt' 
                      ? 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-100' 
                      : 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-100'
                  }`}
                >
                  تأكيد وحفظ القيد
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
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
