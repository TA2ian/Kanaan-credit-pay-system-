'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Download, Upload, Database, Wifi, WifiOff, Image as ImageIcon, Trash2 } from 'lucide-react';
import { getCustomers, getDebts, getPayments, saveCustomers, saveDebts, savePayments } from '../lib/db';

interface UtilitiesProps {
  isOfflineSimulated: boolean;
  onToggleOfflineSimulated: () => void;
  onRefresh: () => void;
}

export function UtilitiesTab({ isOfflineSimulated, onToggleOfflineSimulated, onRefresh }: UtilitiesProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);

  useEffect(() => {
    const savedLogo = localStorage.getItem('company_logo');
    if (savedLogo) {
      setLogoBase64(savedLogo);
    }
  }, []);

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
      alert('فشل في تصدير البيانات للنسخة الاحتياطية.');
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
          if (confirm('تنبيه! استيراد هذه النسخة سيقوم بمسح واستبدال كافة الحسابات الحالية على الهاتف. هل تريد المتابعة؟')) {
            saveCustomers(parsed.customers);
            saveDebts(parsed.debts || []);
            savePayments(parsed.payments || []);
            onRefresh();
            alert('تم استيراد النسخة بنجاح.');
          }
        } else {
          alert('الملف المختار لا يطابق الصيغة الهيكلية لنظام كنعان.');
        }
      } catch {
        alert('فشل قراءة ملف النسخة الاحتياطية.');
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
      alert('تم حفظ الشعار بنجاح! سيظهر الآن في كشوفات الحساب.');
    };
    reader.readAsDataURL(file);
  };

  const clearLogo = () => {
    if (confirm('هل أنت متأكد من حذف الشعار الحالي؟')) {
      localStorage.removeItem('company_logo');
      setLogoBase64(null);
    }
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
    </div>
  );
}
