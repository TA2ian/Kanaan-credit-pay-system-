'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Download, Upload, Database, Wifi, WifiOff, Image as ImageIcon, Trash2, ChevronDown, ChevronUp, BookOpen, Sparkles, Key, ShieldAlert, Check, X } from 'lucide-react';
import { getCustomers, getDebts, getPayments, saveCustomers, saveDebts, savePayments } from '../lib/db';
import { usePopup } from '../lib/PopupContext';
import { GuideTab } from './GuideTab';

interface UtilitiesProps {
  isOfflineSimulated: boolean;
  onToggleOfflineSimulated: () => void;
  onRefresh: () => void;
}

export function UtilitiesTab({ isOfflineSimulated, onToggleOfflineSimulated, onRefresh }: UtilitiesProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Gemini Key Config States
  const [customApiKey, setCustomApiKey] = useState('');
  const [customApiUrl, setCustomApiUrl] = useState('');
  const [disableDefaultKey, setDisableDefaultKey] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const { showAlert, showConfirm } = usePopup();

  useEffect(() => {
    const savedLogo = localStorage.getItem('company_logo');
    if (savedLogo) {
      setLogoBase64(savedLogo);
    }

    // Load custom Gemini Keys on mount
    setCustomApiKey(localStorage.getItem('custom_gemini_api_key') || '');
    setCustomApiUrl(localStorage.getItem('custom_gemini_api_url') || '');
    setDisableDefaultKey(localStorage.getItem('disable_default_gemini_key') === 'true');
  }, []);

  const handleSaveGeminiConfig = () => {
    if (customApiKey) {
      localStorage.setItem('custom_gemini_api_key', customApiKey.trim());
    } else {
      localStorage.removeItem('custom_gemini_api_key');
    }

    if (customApiUrl) {
      localStorage.setItem('custom_gemini_api_url', customApiUrl.trim());
    } else {
      localStorage.removeItem('custom_gemini_api_url');
    }

    if (disableDefaultKey) {
      localStorage.setItem('disable_default_gemini_key', 'true');
    } else {
      localStorage.removeItem('disable_default_gemini_key');
    }

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);

    showAlert({
      title: 'تم حفظ إعدادات Gemini',
      message: 'تم حفظ مفاتيح وعناوين الربط الخاصة بـ Gemini بنجاح على هذا المتصفح وتأكيد المزامنة.',
      type: 'success'
    });
  };

  const handleDisconnectGemini = () => {
    showConfirm({
      title: 'فك ربط وحذف الإعدادات',
      message: 'هل أنت متأكد من فك ربط وإزالة الـ API وعنوان الاتصال المخصص الخاص بك؟ سيعود النظام إلى استخدام المفتاح وخيار الاتصال الافتراضي للموقع.',
      isDanger: true,
      confirmText: 'نعم، فك الربط والحذف',
      cancelText: 'إلغاء',
      onConfirm: () => {
        localStorage.removeItem('custom_gemini_api_key');
        localStorage.removeItem('custom_gemini_api_url');
        localStorage.removeItem('disable_default_gemini_key');
        setCustomApiKey('');
        setCustomApiUrl('');
        setDisableDefaultKey(false);
        showAlert({
          title: 'تم فك الربط وحذف البيانات',
          message: 'تمت إزالة عنوان ومفتاح الـ API المخصص بنجاح، والرجوع للربط الافتراضي للموقع.',
          type: 'success'
        });
      }
    });
  };

  const handleExport = () => {
    try {
      const backup = {
        version: 'kanaan_v1',
        timestamp: new Date().toISOString(),
        customers: getCustomers(),
        debts: getDebts(),
        payments: getPayments(),
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `kanaan_backup_${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      showAlert({
        title: 'فشل تصدير البيانات',
        message: 'عذراً، فشل في تصدير البيانات وتوليد نسخة احتياطية محلية.',
        type: 'error'
      });
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.version === 'kanaan_v1' && Array.isArray(parsed.customers)) {
          showConfirm({
            title: 'تأكيد استيراد النسخة الاحتياطية',
            message: 'تنبيه! استيراد هذه النسخة سيقوم بمسح واستبدال كافة الحسابات الحالية على الهاتف. هل تريد المتابعة؟',
            isDanger: true,
            confirmText: 'نعم، استيراد واستبدال',
            cancelText: 'إلغاء',
            onConfirm: () => {
              saveCustomers(parsed.customers);
              saveDebts(parsed.debts || []);
              savePayments(parsed.payments || []);
              onRefresh();
              showAlert({
                title: 'تم استيراد البيانات',
                message: 'تم استيراد نسخة كنعان المعتمدة المحددة بالكامل وبنجاح لتحديث كافة البيانات.',
                type: 'success'
              });
            }
          });
        } else {
          showAlert({
            title: 'ملف غير متوافق',
            message: 'الملف المختار لا يطابق الصيغة الهيكلية المعتمدة لنظام كنعان.',
            type: 'warning'
          });
        }
      } catch {
        showAlert({
          title: 'خطأ قراءة الملف',
          message: 'فشل قراءة وفك تشفير ملف النسخة الاحتياطية المختار.',
          type: 'error'
        });
      }
    };
    reader.readAsText(file);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setLogoBase64(base64);
      localStorage.setItem('company_logo', base64);
      showAlert({
        title: 'تم حفظ الشعار بنجاح',
        message: 'تم حفظ الشعار بنجاح! سيظهر الآن تلقائياً في ترويسات جميع كشوفات الحساب.',
        type: 'success'
      });
    };
    reader.readAsDataURL(file);
  };

  const clearLogo = () => {
    showConfirm({
      title: 'حذف الشعار',
      message: 'هل أنت متأكد من حذف الشعار الحالي لإزالته المباشرة من كشوف الحساب الورقية والمصورة؟',
      isDanger: true,
      confirmText: 'نعم، حذف الشعار',
      cancelText: 'إلغاء',
      onConfirm: () => {
        localStorage.removeItem('company_logo');
        setLogoBase64(null);
        showAlert({
          title: 'تمت إزالة الشعار',
          message: 'تم حذف شعار الشركة المعتمد بنجاح من التطبيق.',
          type: 'success'
        });
      }
    });
  };

  return (
    <div className="space-y-6 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 shadow-sm" dir="rtl">
      <div className="flex items-center gap-3 border-b pb-4">
        <Database className="w-6 h-6 text-indigo-600" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">أدوات النظام والمزامنة</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button onClick={handleExport} className="flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition text-right">
          <Download className="w-5 h-5 text-indigo-600" />
          <div>
            <div className="font-bold text-slate-800">تصدير قاعدة البيانات (Backup)</div>
            <p className="text-xs text-slate-500">حفظ نسخة كاملة من زبائنك وديونك.</p>
          </div>
        </button>

        <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition text-right">
          <Upload className="w-5 h-5 text-green-600" />
          <div>
            <div className="font-bold text-slate-800">استيراد نسخة احتياطية (Restore)</div>
            <p className="text-xs text-slate-500">تنصيب سجلات محفوظة مسبقاً.</p>
          </div>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
        </button>
      </div>

      {/* Logo Settings */}
      <div className="bg-slate-50 p-4 rounded-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
             <div className="font-bold text-slate-800 flex items-center gap-2">
               <ImageIcon className="w-4 h-4 text-sky-600" />
               شعار الفواتير وكشوفات الحساب
             </div>
             <p className="text-xs text-slate-500 mt-1">تخصيص الشعار الذي يظهر أعلى كشف الحساب عند التصدير لملف PDF.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
             {logoBase64 && (
               <div className="w-12 h-12 bg-white rounded-full border border-slate-200 overflow-hidden shrink-0">
                 <img src={logoBase64} alt="شعار النظام" className="w-full h-full object-cover" />
               </div>
             )}
             <div className="flex flex-col gap-2">
               <button onClick={() => logoInputRef.current?.click()} className="px-4 py-2 rounded-lg font-bold text-sm bg-sky-100 hover:bg-sky-200 text-sky-800 transition">
                 {logoBase64 ? 'تغيير الشعار' : 'إرفاق شعار'}
               </button>
               {logoBase64 && (
                  <button onClick={clearLogo} className="px-4 py-1.5 rounded-lg font-bold text-xs bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center gap-1 transition">
                    <Trash2 className="w-3 h-3" /> حذف
                  </button>
               )}
             </div>
             <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
          </div>
        </div>
      </div>

      <div className="bg-slate-50 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="font-bold text-slate-800 flex items-center gap-2">
            محاكي الإتصال لـ "كنعان الميداني"
          </div>
          <p className="text-xs text-slate-500 mt-1">تحديد ما إذا كان الهاتف يعمل حالياً بدون شبكة إنترنت.</p>
        </div>
        <button onClick={onToggleOfflineSimulated} className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition ${isOfflineSimulated ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
          {isOfflineSimulated ? (
            <>
              <WifiOff className="w-4 h-4" />
              أوفلاين (ميداني)
            </>
          ) : (
            <>
              <Wifi className="w-4 h-4" />
              أونلاين (متصل)
            </>
          )}
        </button>
      </div>

      {/* Gemini API Custom Configuration */}
      <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200/60 pb-3">
          <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
          <div>
            <h4 className="font-bold text-slate-800 text-sm">إعدادات الذكاء الاصطناعي (Gemini AI) المخصصة</h4>
            <p className="text-[10px] text-slate-500 mt-0.5">تتيح لك استخدام مفتاح API وعناوين اتصال بديلة وخاصة بك لتوليد التذكيرات المالية وتحليل الحسابات.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block flex items-center gap-1">
              <Key className="w-3.5 h-3.5 text-indigo-500" />
              مفتاح Gemini API الخاص بك:
            </label>
            <input 
              type="password" 
              value={customApiKey}
              onChange={(e) => setCustomApiKey(e.target.value)}
              placeholder="مثال: AIzaSyD..."
              className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-150 font-mono tracking-wider text-left"
              dir="ltr"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block flex items-center gap-1">
              <span>رابط الـ API المخصص (عنوان اختياري):</span>
            </label>
            <input 
              type="url" 
              value={customApiUrl}
              onChange={(e) => setCustomApiUrl(e.target.value)}
              placeholder="مثال: https://generativelanguage.googleapis.com"
              className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-150 font-mono text-left"
              dir="ltr"
            />
          </div>
        </div>

        <div className="bg-white/80 border border-slate-100 rounded-xl p-3 space-y-2">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={disableDefaultKey}
              onChange={(e) => setDisableDefaultKey(e.target.checked)}
              className="mt-1 h-3.5 w-3.5 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
            />
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                تعطيل استخدام مفتاح الـ API الافتراضي للموقع
              </span>
              <p className="text-[10px] text-slate-500 leading-normal">
                عند تفعيل هذا الخيار، سيقوم السيرفر بمنع استخدام أي مفتاح افتراضي مثبت مسبقاً، ولن يتم إرسال طلبات الذكاء الاصطناعي إلا من خلال مفتاحك المخصص المدخل أعلاه.
              </p>
            </div>
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${customApiKey ? 'bg-emerald-500' : (disableDefaultKey ? 'bg-rose-500' : 'bg-indigo-500')}`} />
            <span>حالة الذكاء الاصطناعي:</span>
            <span className={customApiKey ? 'text-emerald-600' : (disableDefaultKey ? 'text-rose-600 font-extrabold' : 'text-indigo-600')}>
              {customApiKey ? 'متصل بالمفتاح الخاص بك' : (disableDefaultKey ? 'مُعطل (لا يوجد مفتاح)' : 'متصل بالـ API الافتراضي للموقع')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {(customApiKey || customApiUrl || disableDefaultKey) && (
              <button 
                onClick={handleDisconnectGemini}
                className="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-rose-55 hover:bg-rose-100 text-rose-600 transition flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" /> فك ربط وحذف مفتاحي
              </button>
            )}

            <button 
              onClick={handleSaveGeminiConfig}
              className={`px-5 py-1.5 rounded-xl font-bold text-xs text-white transition flex items-center gap-1 cursor-pointer ${
                isSaved ? 'bg-emerald-600' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {isSaved ? <Check className="w-3.5 h-3.5" /> : null}
              {isSaved ? 'تم الحفظ!' : 'حفظ إعدادات الـ API'}
            </button>
          </div>
        </div>
      </div>

      {/* Guide Accordion */}
      <div className="mt-8">
        <button 
          onClick={() => setIsGuideOpen(!isGuideOpen)}
          className={`w-full flex items-center justify-between p-4 rounded-xl text-right transition font-bold border shadow-sm ${
            isGuideOpen 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isGuideOpen ? 'bg-emerald-200/50' : 'bg-emerald-100'}`}>
              <BookOpen className={`w-4 h-4 ${isGuideOpen ? 'text-emerald-700' : 'text-emerald-600'}`} />
            </div>
            دليل استخدام نظام كنعان الميداني
          </div>
          {isGuideOpen ? <ChevronUp className="w-5 h-5 opacity-60" /> : <ChevronDown className="w-5 h-5 opacity-60" />}
        </button>
        
        {isGuideOpen && (
          <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <GuideTab />
          </div>
        )}
      </div>

    </div>
  );
}
