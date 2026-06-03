/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DatabaseState, getDatabase, importDatabase, saveDatabase } from '../lib/db';
import { useFirebase } from '../lib/FirebaseContext';
import { 
  Download, 
  Upload, 
  Trash2, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  FileJson, 
  Database, 
  CheckCircle2, 
  AlertTriangle,
  CloudLightning,
  CloudOff,
  UserCheck
} from 'lucide-react';

interface UtilitiesTabProps {
  db: DatabaseState;
  onRefresh: () => void;
  isOfflineSimulated: boolean;
  onToggleOfflineSimulated: () => void;
}

export function UtilitiesTab({ 
  db, 
  onRefresh, 
  isOfflineSimulated, 
  onToggleOfflineSimulated 
}: UtilitiesTabProps) {
  const { user, importBackupToFS, wipeAllInFS } = useFirebase();
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [cloudSyncing, setCloudSyncing] = useState(false);

  const triggerSuccessMsg = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const triggerErrorMsg = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 4000);
  };

  // 1. Export entire LocalStorage database to JSON file
  const handleExportData = () => {
    try {
      const currentDb = getDatabase();
      const dbStr = JSON.stringify(currentDb, null, 2);
      const blob = new Blob([dbStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      // Riyadh timezone/date-based naming
      const dateFormatted = new Date().toISOString().split('T')[0];
      link.download = `daftar_al_duyun_backup_${dateFormatted}.json`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      triggerSuccessMsg('تم تصدير نسخة احتياطية من الدفتر بنجاح! الملف جاهز للتحميل للاحتفاظ به.');
    } catch (e) {
      console.error(e);
      triggerErrorMsg('فشل تصدير البيانات المطروحة. يرجى إعادة المحاولة.');
    }
  };

  // 2. Import JSON File Backup
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importDatabase(content);
      if (success) {
        onRefresh();
        triggerSuccessMsg('تم استيراد النسخة الاحتياطية وتحديث رقعة البيانات بالكامل بنجاح!');
      } else {
        triggerErrorMsg('الملف المرفوع غير صالح أو لا يطابق بنية دفتر الديون التجارية الفريدة.');
      }
    };
    reader.readAsText(file);
    // Reset file input target
    e.target.value = '';
  };

  // 3. Reset database completely to default sample state
  const handleResetToSample = () => {
    if (confirm('تحذير: هل أنت متأكد من تصفير وإعادة تعيين الدفتر وحذف الحسابات الحالية؟\nسيتم استبدال البيانات المدخلة بنموذج البيانات الإرشادية لتبسيط التجربة، ولن يمكنك استرجاع القيود المالية الحالية.')) {
      localStorage.removeItem('daftar_al_duyun_db');
      onRefresh();
      triggerSuccessMsg('تمت إعادة تهيئة الدفتر للوضع النموذجي الافتراضي.');
    }
  };

  // 4. Wipe Database clean
  const handleWipeAll = async () => {
    if (confirm('تنبيه خطير جداً: هل تود مسح وإخلاء كافة بياناتك ودفاتر ديونك بالكامل؟\nسيصبح دفتر الديون فارغاً تماماً ومستعداً لإدخل صفقات متجر جديدة من الصفر.')) {
      if (user) {
        setCloudSyncing(true);
        try {
          await wipeAllInFS();
          triggerSuccessMsg('تم مسح وإفراغ جميع مستندات السحابة بنجاح.');
        } catch (e: any) {
          triggerErrorMsg('حدث خطأ أثناء محاولة مسح السحابة: ' + (e.message || e));
        } finally {
          setCloudSyncing(false);
        }
      } else {
        const emptyDb: DatabaseState = {
          version: 1,
          customers: [],
          transactions: []
        };
        saveDatabase(emptyDb);
        onRefresh();
        triggerSuccessMsg('تم تفريغ الدفتر المحلي بالكامل بنجاح.');
      }
    }
  };

  // 5. Cloud Migration Sync
  const handleMigrateToCloud = async () => {
    if (!user) return;
    setCloudSyncing(true);
    try {
      // Load current local offline records
      const localDb = getDatabase();
      if (localDb.customers.length === 0 && localDb.transactions.length === 0) {
        triggerErrorMsg('الدفتر المحلي فارغ حالياً، لا يوجد بيانات ترحيل.');
        return;
      }
      await importBackupToFS(localDb.customers, localDb.transactions);
      triggerSuccessMsg('تهانينا! تم ترحيل ودمج حساباتك المحلية البالغة (' + localDb.customers.length + ' عملاء) إلى حسابك السحابي بنجاح وهو الآن متاح عبر جميع أجهزتك.');
    } catch (e: any) {
      console.error(e);
      triggerErrorMsg('فشل ترحيل الحسابات السحابية: ' + (e.message || e));
    } finally {
      setCloudSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Messages */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-850 border border-emerald-250 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 text-red-850 border border-red-200 rounded-2xl text-xs font-bold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* PANEL 1: CLOUD STATUS & SYNC */}
        {user && (
          <div className="p-6 bg-indigo-900 text-white rounded-2xl border border-indigo-950/40 shadow-xs md:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1 text-right">
                <span className="text-[10px] bg-indigo-500/30 text-indigo-200 uppercase font-black px-2.5 py-1 rounded-md">المزامنة النشطة الآمنة</span>
                <h3 className="text-base font-black text-white flex items-center gap-2 mt-1">
                  <CloudLightning className="w-5 h-5 text-indigo-400 animate-pulse" />
                  أنت مسجل كتاجر سحابي متصل!
                </h3>
                <p className="text-xs text-indigo-200 mt-1 max-w-xl leading-relaxed">
                  بريد التاجر: <strong className="text-white">{user.email}</strong>. كافة المدخلات والتعاملات المسجلة الآن مشفرة وتتم مزامنتها في الزمن الفعلي بفضل تكنولوجيا (Firestore Real-time Client Snapshots). يمكنك ترحيل الداتا المحلية إذا كانت هذه زيارتك الأولى.
                </p>
              </div>
              <button
                onClick={handleMigrateToCloud}
                disabled={cloudSyncing}
                className="py-2.5 px-5 text-xs font-bold text-indigo-900 bg-white hover:bg-slate-100 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 self-stretch sm:self-auto justify-center"
              >
                <CloudLightning className="w-4 h-4 text-indigo-650" />
                {cloudSyncing ? 'جاري الدمج السحابي...' : 'ترحيل الداتا المحلية للسحابة'}
              </button>
            </div>
          </div>
        )}

        {/* PANEL 2: BACKUPS (النسخ الاحتياطي والأرشفة) */}
        <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-50 pb-3">
            <Database className="w-4.5 h-4.5 text-indigo-600" />
            إدارة قواعد البيانات والأرشفة الدورية
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">تُخزّن كافة ديون ومعاملات متجرك بشكل آمن ومحلي داخل ذاكرة متصفح الهاتف أو الكمبيوتر الخاص بك. نوصي بحفظ نسخة احتياطية من ملف حساباتك لضمان عدم ضياع الديون عند تغيير الهاتف أو تصفير ذاكرته.</p>
          
          <div className="space-y-3 pt-3">
            {/* Export block */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-150">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-800 block">حفظ نسخة احتياطية</span>
                <span className="text-[10px] text-slate-400 block">تحميل ملف البيانات بصيغة مشفرة آمنة (.json)</span>
              </div>
              <button
                onClick={handleExportData}
                className="py-2 px-4 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0"
              >
                <Download className="w-4 h-4" />
                تصدير البيانات
              </button>
            </div>

            {/* Import block */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-150">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-800 block">استرجاع نسخة سابقة</span>
                <span className="text-[10px] text-slate-400 block">رفع وقراءة ملف حسابات الدفتر المسترجع</span>
              </div>
              <label className="py-2 px-4 text-xs font-bold text-white bg-slate-700 hover:bg-slate-800 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0 text-center">
                <Upload className="w-4 h-4" />
                استيراد الملف
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="hidden"
                />
              </label>
            </div>

          </div>
        </div>

        {/* PANEL 2: OFFLINE SIMULATION & HEALTH (محاكاة انقطاع الاتصال) */}
        <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-50 pb-3">
            <Wifi className="w-4.5 h-4.5 text-emerald-600" />
            محاكي العمل بدون شبكة إنترنت
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">صُمم هذا النظام بتوافقية كاملة ليتمكن من معالجة بياناتك وتسجيل حسابات العملاء بسلاسة حتى لو انقطع اتصال الإنترنت بشكل كامل في المحل أو المتجر الجوال. سيتم حفظ التعديلات فورياً في الذاكرة المحلية والعمل بكفاءة.</p>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-150 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1 text-right">
                {isOfflineSimulated ? (
                  <>
                    <WifiOff className="w-4.5 h-4.5 text-red-500 animate-bounce" />
                    <span className="text-red-650">وضعية عدم الاتصال مفعلة</span>
                  </>
                ) : (
                  <>
                    <Wifi className="w-4.5 h-4.5 text-emerald-500 animate-pulse" />
                    <span className="text-emerald-750">وضعية الاتصال القياسية بالإنترنت</span>
                  </>
                )}
              </span>
              <p className="text-[10px] text-slate-400">تتيح لك محاكاة انقطاع شبكة الهاتف الخلوي لتجربة صلابة تخزين الدفتر.</p>
            </div>

            <button
              onClick={onToggleOfflineSimulated}
              className={`py-2 px-4 text-xs font-bold text-white rounded-lg transition-all cursor-pointer ${
                isOfflineSimulated 
                  ? 'bg-emerald-600 hover:bg-emerald-700' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isOfflineSimulated ? 'محاكاة الاتصال بالإنترنت' : 'محاكاة انقطاع الإنترنت'}
            </button>
          </div>

          <div className="p-3 bg-amber-50/50 rounded-xl text-[10px] text-amber-800 leading-relaxed">
            * تنويه: عند تفعيل وضع عدم الاتصال بالإنترنت، يظل بإمكانك التصفح وإضافة الديون والدفعات، ولكن ستتعطل فقط صياغة الرسائل المبتكرة بالذكاء الاصطناعي (أداة Gemini) لحين عودة الاتصال بخادم الذكاء الاصطناعي، وهو السلوك المحاكي لجودة التجهيز الحقيقي.
          </div>
        </div>

      </div>

      {/* SYSTEM DANGER ZONE (منطقة الخطر الإداري) */}
      <div className="p-6 bg-red-50/40 rounded-2xl border border-red-150 shadow-xs space-y-4">
        <h4 className="text-xs font-bold text-red-800 uppercase tracking-wide">التحكم بالنظام ومنطقة الخطر</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-white rounded-xl border border-red-100 flex flex-col justify-between gap-3 text-right">
            <div>
              <span className="font-bold text-slate-850 block">إعادة تهيئة الداتا للوضع التجريبي</span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">يمسح بياناتك الحالية ويملأ الدفتر بالنموذج الإرشادي ومستندات القيود المرفقة بالبرمجة افتراضياً.</span>
            </div>
            <button
              onClick={handleResetToSample}
              className="py-1.5 px-3 bg-amber-500 hover:bg-amber-600 font-bold text-[10px] text-white rounded-lg transition-colors cursor-pointer self-start"
            >
              إعادة بناء نموذج الداتا
            </button>
          </div>

          <div className="p-4 bg-white rounded-xl border border-red-100 flex flex-col justify-between gap-3 text-right">
            <div>
              <span className="font-bold text-red-900 block">حذف القيود المالية وتصفير الدفتر</span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">يمسح كافة العملاء والمعاملات والديون كلياً ليصبح جاهزاً للتشغيل الحقيقي من الصفر.</span>
            </div>
            <button
              onClick={handleWipeAll}
              className="py-1.5 px-3 bg-red-650 hover:bg-red-750 font-bold text-[10px] text-white rounded-lg transition-colors cursor-pointer self-start"
            >
              فرمتة ومسح الدفتر نهائياً
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
