/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useFirebase } from '../lib/FirebaseContext';
import { BookOpen, LogIn, Sparkles, Chrome, Mail, Lock, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export function LoginScreen() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } = useFirebase();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleResetPassword = async () => {
    if (!email) {
      setError('يرجى إدخال بريدك الإلكتروني أولاً لإرسال رابط استعادة كلمة المرور.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await resetPassword(email);
      setSuccess('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني بنجاح. يرجى مراجعة صندوق الوارد.');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found') {
        setError('لا يوجد حساب مرتبط بهذا البريد الإلكتروني.');
      } else {
        setError('تعذر إرسال رابط استعادة كلمة المرور. تأكد من صحة البريد الإلكتروني.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('يرجى ملء جميع الحقول المطلوبة.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
        setSuccess('تم إنشاء الحساب بنجاح! جاري توجيهك...');
      } else {
        await signInWithEmail(email, password);
        setSuccess('تم تسجيل الدخول بنجاح! أهلاً بك.');
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('البريد الإلكتروني مستخدم بالفعل بصفتك تاجر.');
      } else if (err.code === 'auth/weak-password') {
        setError('كلمة المرور ضعيفة جداً. يجب أن تكون ٦ خانات على الأقل.');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
      } else if (err.message && err.message.includes('auth/configuration-not-found')) {
        setError('تنبيه: ميزة تسجيل الدخول بالبريد الإلكتروني مغلقة بقنصل مشروع فايربيس حالياً. يرجى تفعيلها من لوحة تحكم Firebase Console أو استخدام تسجيل دخول Google المتاح فورياً.');
      } else {
        setError('حدث خطأ أثناء المصادقة الأمنية: ' + (err.message || err));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
      setSuccess('مرحباً بك! تم التفويض الآمن عبر حساب Google.');
    } catch (err: any) {
      console.error(err);
      setError('فشلت عملية المصادقة عبر Google. يرجى التأكد من اتصال الخادم وإعادة المحاولة.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 transition-colors duration-300" dir="rtl">
      <motion.div 
        initial={{ opacity: 0, y: 25, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", duration: 0.55, bounce: 0.12 }}
        style={{ willChange: 'transform, opacity' }}
        className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden flex flex-col transition-colors duration-300"
      >
        
        {/* Decorative Top Branding */}
        <div className="p-8 text-center bg-radial-at-t from-sky-900 to-slate-950 text-white relative border-b border-amber-500/20">
          <div className="absolute top-2 right-2 bg-amber-550/20 text-amber-400 font-bold px-2.5 py-0.5 rounded-lg text-[9px] border border-amber-500/30">
            شريك كنعان الموثوق 🌾
          </div>
          
          <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center mb-3 shadow-lg border-2 border-amber-400 p-1 relative transition-colors">
            <div className="absolute inset-0.5 rounded-full border border-dashed border-emerald-500"></div>
            <span className="text-3xl relative z-10">🚚</span>
          </div>
          
          <h2 className="text-lg font-black tracking-tight text-amber-400">مجموعة كنعان الذكية</h2>
          <p className="text-[11px] font-bold text-slate-250 mt-1">كنعان مندوب • توزيع المواد الغذائية والمشروبات</p>
          <span className="text-[9px] text-slate-400 font-semibold block mt-1.5">حقيبة الموزع والمندوب الرسمية لجدولة الحسابات</span>
        </div>

        {/* Auth Forms / Actions */}
        <div className="p-8 space-y-6">
          
          {/* Progress / Status Messages */}
          {error && (
            <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors">
              <AlertTriangle className="w-4.5 h-4.5 text-red-600 shrink-0" />
              <p className="leading-relaxed">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors">
              <CheckCircle2 className="w-4.5 h-4.5 text-indigo-600 shrink-0" />
              <p className="leading-relaxed">{success}</p>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block transition-colors">بريدك الإلكتروني (التاجر)</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="merchant@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all text-left shadow-sm"
                />
                <Mail className="w-4 h-4 text-slate-450 absolute inset-y-0 right-3.5 my-auto transition-colors" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700 transition-colors">كلمة المرور الحامية</label>
                {!isSignUp && (
                  <button 
                    type="button" 
                    onClick={handleResetPassword}
                    className="text-[10px] text-indigo-600 font-bold hover:underline cursor-pointer"
                  >
                    نسيت كلمة المرور؟
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all text-left shadow-sm"
                />
                <Lock className="w-4 h-4 text-slate-450 absolute inset-y-0 right-3.5 my-auto transition-colors" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-900 hover:bg-sky-950 text-white font-bold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md border-b-2 border-amber-400"
            >
              <LogIn className="w-4 h-4 text-amber-400" />
              {loading ? 'جاري التحقق التلقائي...' : isSignUp ? 'إنشاء حساب مندوب كنعان جديد' : 'تسجيل الدخول لبوابة الموزعين'}
            </button>

          </form>

          {/* Social login / standard partition divider */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-150 transition-colors"></div>
            <span className="flex-shrink mx-3 text-[10px] text-slate-400 font-bold uppercase transition-colors">أو الدخول عبر الحسابات المرتبطة</span>
            <div className="flex-grow border-t border-slate-150 transition-colors"></div>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-slate-100 shadow-sm"
          >
            <Chrome className="w-4.5 h-4.5 text-rose-500" />
            الدخول الآمن بكبسة زر بـ Google
          </button>

          {/* Toggle form button */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setError('');
                setIsSignUp(!isSignUp);
              }}
              className="text-xs font-bold text-indigo-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              {isSignUp ? 'لديك حساب بالفعل؟ سجل دخولك' : 'لا تملك حساب تاجر؟ سجل حساباً جديداً'}
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            </button>
          </div>

        </div>

        {/* Fine-print notice for premium Merchants */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-400 font-semibold leading-relaxed shrink-0 transition-colors">
          * يتم تشفير وإرسال كلمات المرور والحسابات بطبقة تشفير معيارية SSL كاملة مباشرة لخوادم Google Firebase دون تخزين وسيط.
        </div>

      </motion.div>
    </div>
  );
}
