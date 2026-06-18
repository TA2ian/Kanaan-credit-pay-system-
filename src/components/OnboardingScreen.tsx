/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useFirebase } from '../lib/FirebaseContext';
import { motion } from 'motion/react';
import { User, Shield, Briefcase, Building2, Phone, Sparkles, CheckCircle, ArrowLeft } from 'lucide-react';

export function OnboardingScreen() {
  const { createBusinessProfile, user } = useFirebase();
  const [businessName, setBusinessName] = useState('مجموعة كنعان الذكية');
  const [businessType, setBusinessType] = useState<'solo' | 'company'>('solo');
  const [phone, setPhone] = useState('');
  const [delegateName, setDelegateName] = useState(user?.displayName || 'عبدالرحمن كنعان');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!businessName.trim()) {
      setError('يرجى كتابة اسم الشركة أو اسم العمل التجاري المعتمد.');
      return;
    }
    if (!delegateName.trim()) {
      setError('يرجى تحديد الاسم الشخصي لمندوب أو مدير الحساب الأساسي.');
      return;
    }

    setLoading(true);
    try {
      await createBusinessProfile(
        businessName.trim(),
        businessType,
        'manager', // The creator is always the manager
        phone.trim(),
        delegateName.trim()
      );
    } catch (err: any) {
      console.error(err);
      setError('فشل حفظ إعدادات بطاقة المتجر التجاري الميداني: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8 transition-colors duration-300" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 360, damping: 26 }}
        style={{ willChange: "transform, opacity" }}
        className="w-full max-w-xl bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden transition-colors gpu-accelerated"
      >
        {/* Top Header Banner decoration */}
        <div className="p-8 text-center bg-radial-at-t from-sky-950 to-slate-900 border-b border-amber-500/20 text-white relative">
          <div className="absolute top-3 right-3 bg-indigo-500/20 text-indigo-300 font-bold px-3 py-1 rounded-lg text-[9px] border border-indigo-400/20 uppercase tracking-wider">
            تهيأة الحساب الميداني الأولية 🌾
          </div>
          <div className="mx-auto w-14 h-14 bg-gradient-to-br from-indigo-50 to-white/10 rounded-2xl flex items-center justify-center mb-4 shadow-lg text-2xl">
            📦
          </div>
          <h2 className="text-xl font-black text-amber-400 leading-tight">تخصيص ملف الشركة التجاري</h2>
          <p className="text-slate-350 text-xs mt-1.5 leading-relaxed font-semibold">
            يرجى تحديد هيكلية وتفاصيل كشف الحساب قبل الدخول للوحة التحكم والموزعين.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-xl text-xs font-bold leading-relaxed transition-colors">
              ⚠️ {error}
            </div>
          )}

          {/* Section 1: Business Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 block transition-colors">براند أو اسم الشركة المعتمد لعرضه في رأس الكشوف والتقارير</label>
            <div className="relative">
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="مثال: مجموعة كنعان الذكية"
                className="w-full pl-3 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
              />
              <Building2 className="w-4.5 h-4.5 text-slate-450 absolute inset-y-0 right-3.5 my-auto transition-colors" />
            </div>
          </div>

          {/* Section 2: Business Type selection */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-700 block transition-colors">طريقة ونموذج إدارة العمل القائم</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <button
                type="button"
                onClick={() => setBusinessType('solo')}
                className={`p-4 rounded-2xl border text-right transition-all cursor-pointer relative ${
                  businessType === 'solo'
                    ? 'border-indigo-500 bg-indigo-50 animate-in zoom-in-95 duration-200 ring-1 ring-indigo-500'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg shadow-sm transition-colors">👤</span>
                  {businessType === 'solo' && (
                    <CheckCircle className="w-4.5 h-4.5 text-indigo-600 fill-indigo-100" />
                  )}
                </div>
                <h4 className="text-xs font-black text-slate-800 mt-3 block transition-colors">عمل قائم على شخص واحد</h4>
                <p className="text-[10px] text-slate-450 mt-1 leading-relaxed font-semibold transition-colors">
                  بثقة تامة، تحكم كامل ومستقل بجميع الحسابات والعملاء (أنت المدير، المندوب، والمالك).
                </p>
              </button>

              <button
                type="button"
                onClick={() => setBusinessType('company')}
                className={`p-4 rounded-2xl border text-right transition-all cursor-pointer relative ${
                  businessType === 'company'
                    ? 'border-indigo-500 bg-indigo-50 animate-in zoom-in-95 duration-200 ring-1 ring-indigo-500'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg shadow-sm transition-colors">👥</span>
                  {businessType === 'company' && (
                    <CheckCircle className="w-4.5 h-4.5 text-indigo-600 fill-indigo-100" />
                  )}
                </div>
                <h4 className="text-xs font-black text-slate-800 mt-3 block transition-colors">شركة من عدة أفراد</h4>
                <p className="text-[10px] text-slate-450 mt-1 leading-relaxed font-semibold transition-colors">
                  تحكم هرمي متقدم بالصلاحيات مع إضافة فريق العمل كمساعد، محاسب مالي، ومندوب توزيع.
                </p>
              </button>

            </div>
          </div>

          {/* Section 3: Delegate Name & Telephone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 block transition-colors">اسم مدير/مندوب الحساب الأساسي</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={delegateName}
                  onChange={(e) => setDelegateName(e.target.value)}
                  placeholder="مثال: عبدالرحمن كنعان"
                  className="w-full pl-3 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
                />
                <User className="w-4.5 h-4.5 text-slate-450 absolute inset-y-0 right-3.5 my-auto transition-colors" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 block transition-colors">رقم جوال المندوب للتواصل</label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="أدخل رقم الهاتف للواتساب"
                  className="w-full pl-3 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all text-left shadow-sm"
                />
                <Phone className="w-4.5 h-4.5 text-slate-450 absolute inset-y-0 right-3.5 my-auto transition-colors" />
              </div>
            </div>

          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-2xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg"
          >
            <span>حفظ إعدادات المتجر والدخول للنظام مالي</span>
            <ArrowLeft className="w-4.5 h-4.5 shrink-0 rotate-180 text-amber-400" />
          </button>
        </form>

        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-400 font-bold transition-colors">
          * يمكنك دائماً تعديل وتفصيل براند واسم الشركة أو معلومات التواصل والتبديل من "تبويب أدوات النظام والمزامنة" لاحقاً.
        </div>
      </motion.div>
    </div>
  );
}
