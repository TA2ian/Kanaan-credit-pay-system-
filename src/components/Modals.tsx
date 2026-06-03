/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Customer, TransactionType } from '../lib/db';
import { X, UserPlus, FileSpreadsheet, PlusCircle, Calendar, ShieldCheck, DollarSign } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// 1. ADD / EDIT CUSTOMER MODAL
interface CustomerModalProps extends ModalProps {
  customer?: Customer; // If provided, we are in edit mode
  onSave: (name: string, phone: string, email?: string, notes?: string, region?: string) => void;
}

export function CustomerModal({ isOpen, onClose, customer, onSave }: CustomerModalProps) {
  const [name, setName] = useState(customer?.name || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [email, setEmail] = useState(customer?.email || '');
  const [notes, setNotes] = useState(customer?.notes || '');
  const [region, setRegion] = useState(customer?.region || '');
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (customer) {
      setName(customer.name);
      setPhone(customer.phone);
      setEmail(customer.email || '');
      setNotes(customer.notes || '');
      setRegion(customer.region || '');
    } else {
      setName('');
      setPhone('');
      setEmail('');
      setNotes('');
      setRegion('');
    }
    setError('');
  }, [customer, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('يرجى إدخال اسم العميل بشكل صحيح.');
      return;
    }
    if (!phone.trim()) {
      setError('يرجى إدخال رقم الهاتف الجوال للتواصل عبر واتساب.');
      return;
    }
    // Simple phone regex or general check
    if (phone.trim().length < 7) {
      setError('يرجى كتابة رقم هاتف صالح (مثال: +963958280936 أو 0958280936).');
      return;
    }

    onSave(name, phone, email, notes, region);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="w-full max-w-md overflow-hidden bg-white rounded-2xl shadow-xl border border-slate-100 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-600" />
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs font-semibold text-red-600 bg-red-50 rounded-xl border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label className="block mb-1.5 text-xs font-bold text-slate-700">اسم العميل ثنائي أو ثلاثي *</label>
            <input
              type="text"
              placeholder="مثال: خالد بن أحمد الحامد"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-colors"
              required
            />
          </div>

          <div>
            <label className="block mb-1.5 text-xs font-bold text-slate-700">رقم جوال الواتساب *</label>
            <input
              type="text"
              placeholder="مثال: 0958280936 أو 963958280936"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-colors"
              dir="ltr"
              required
            />
            <p className="mt-1 text-[10px] text-slate-500">مفضل إدخال رقم الجوال السوري (مثال: 0958280936) وسيقوم النظام بربطه تلقائياً بالرمز الدولي +963.</p>
          </div>

          <div>
            <label className="block mb-1.5 text-xs font-bold text-slate-700">البريد الإلكتروني (اختياري)</label>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-colors"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block mb-1.5 text-xs font-bold text-slate-700">المنطقة / المدينة (مثال: الرياض، جدة، الشرقية، عسير)</label>
            <input
              type="text"
              placeholder="مثال: الرياض"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block mb-1.5 text-xs font-bold text-slate-700">ملاحظات أو نوع النشاط</label>
            <textarea
              placeholder="اكتب أي ملاحظات حول العميل وموثوقيته أو نوع تعامله المعتاد..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-colors resize-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl focus:ring-4 focus:ring-emerald-100 transition-all cursor-pointer"
            >
              حفظ وتأكيد
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
      </div>
    </div>
  );
}

// 2. ADD TRANSACTION MODAL (Debt or Payment)
interface TransactionModalProps extends ModalProps {
  customerId: string;
  customerName: string;
  type: TransactionType; // 'debt' (قيد دين) or 'payment' (قيد دفعة مستلمة)
  onSave: (customerId: string, type: TransactionType, amount: number, notes?: string, dueDate?: string) => void;
}

export function TransactionModal({ isOpen, onClose, customerId, customerName, type, onSave }: TransactionModalProps) {
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');

  React.useEffect(() => {
    setAmount('');
    setNotes('');
    
    // Default due date to 15 days out
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 15);
    setDueDate(defaultDate.toISOString().split('T')[0]);
    setError('');
  }, [isOpen, customerId, type]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('يرجى إدخال مبلغ مالي صحيح أكبر من الصفر.');
      return;
    }

    onSave(customerId, type, parsedAmount, notes, type === 'debt' ? dueDate : undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="w-full max-w-md overflow-hidden bg-white rounded-2xl shadow-xl border border-slate-100 animate-slide-up">
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
            <span className="text-base font-bold text-slate-800">{customerName}</span>
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
      </div>
    </div>
  );
}
