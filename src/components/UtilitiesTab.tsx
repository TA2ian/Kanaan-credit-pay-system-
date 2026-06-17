'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Download, Upload, Database, Wifi, WifiOff, Image as ImageIcon, Trash2, ChevronDown, ChevronUp, BookOpen, Sparkles, Key, ShieldAlert, Check, X, Building2, AlertTriangle, RefreshCw, Share2, Mail, Phone } from 'lucide-react';
import { getCustomers, getDebts, getPayments, saveCustomers, saveDebts, savePayments } from '../lib/db';
import { usePopup } from '../lib/PopupContext';
import { useFirebase } from '../lib/FirebaseContext';
import { GuideTab } from './GuideTab';

interface UtilitiesProps {
  isOfflineSimulated: boolean;
  onToggleOfflineSimulated: () => void;
  onRefresh: () => void;
}

export function UtilitiesTab({ isOfflineSimulated, onToggleOfflineSimulated, onRefresh }: UtilitiesProps) {
  const { profile, updateBusinessProfile, wipeAllInFS } = useFirebase();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Business Identity States
  const [inputBusinessName, setInputBusinessName] = useState('');
  const [inputBusinessEmoji, setInputBusinessEmoji] = useState('🌾');
  const [inputBusinessDesc, setInputBusinessDesc] = useState('');
  const [inputCopyrightText, setInputCopyrightText] = useState('');
  const [isSavingIdentity, setIsSavingIdentity] = useState(false);
  const [isIdentitySaved, setIsIdentitySaved] = useState(false);

  // Full Data Wipe States
  const [wipeKeyword, setWipeKeyword] = useState('');
  const [isWiping, setIsWiping] = useState(false);

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

    if (profile) {
      setInputBusinessName(profile.businessName || '');
      setInputBusinessEmoji(profile.businessEmoji || '🌾');
      setInputBusinessDesc(profile.businessDesc || '');
      setInputCopyrightText(profile.copyrightText || '');
    }

    // Load custom Gemini Keys on mount
    setCustomApiKey(localStorage.getItem('custom_gemini_api_key') || '');
    setCustomApiUrl(localStorage.getItem('custom_gemini_api_url') || '');
    setDisableDefaultKey(localStorage.getItem('disable_default_gemini_key') === 'true');
  }, [profile]);

  const handleSaveIdentity = async () => {
    if (!inputBusinessName.trim()) {
      showAlert({
        title: 'اسم الشركة مطلوب',
        message: 'يرجى إدخال اسم الشركة أو النشاط التجاري لتحديث الهوية.',
        type: 'warning'
      });
      return;
    }

    if (profile?.role !== 'manager') {
      showAlert({
        title: 'صلاحيات غير كافية',
        message: 'عذراً، يتاح فقط للمدير العام الحاصل على الصلاحيات الكاملة تعديل الاسم والهوية الموحدة لتطابق الحسابات.',
        type: 'warning'
      });
      return;
    }

    setIsSavingIdentity(true);
    try {
      await updateBusinessProfile({
        businessName: inputBusinessName.trim(),
        businessEmoji: inputBusinessEmoji,
        businessDesc: inputBusinessDesc.trim(),
        copyrightText: inputCopyrightText.trim()
      });
      setIsIdentitySaved(true);
      setTimeout(() => setIsIdentitySaved(false), 3000);
      showAlert({
        title: 'تم تحديث الهوية بنجاح',
        message: 'تم تحديث اسم الشركة والشعار الرمزي واللون الرئيسي للهوية سحابياً لجميع الأجهزة المتصلة بالتطبيق.',
        type: 'success'
      });
    } catch (err: any) {
      showAlert({
        title: 'فشل التحديث',
        message: 'حصل خطأ ما أثناء حفظ تعديلات الهوية الموحدة: ' + (err.message || err),
        type: 'error'
      });
    } finally {
      setIsSavingIdentity(false);
    }
  };

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

  const handleWipeAllData = async () => {
    const isManager = profile?.role === 'manager' || profile?.userId === profile?.companyId;
    if (!isManager) {
      showAlert({
        title: 'صلاحيات غير كافية',
        message: 'عذراً، تتاح صلاحية تصفير وحذف كافة بيانات المؤسسة للمدير العام فقط.',
        type: 'warning'
      });
      return;
    }

    if (wipeKeyword.trim() !== 'حذف نهائي') {
      showAlert({
        title: 'تأكيد غير صحيح',
        message: 'يرجى كتابة كلمة "حذف نهائي" بدقة متناهية لتفعيل خيار المسح الشامل والآمن.',
        type: 'warning'
      });
      return;
    }

    showConfirm({
      title: 'أنت على وشك مسح كل شيء!',
      message: 'تحذير نهائي: هذا الإجراء سيمحو كافة بيانات الزبائن، والديون، والتحصيلات، ولن تتمكن من استرجاعها بأي وسيلة من قاعدة السحاب. هل أنت متأكد تماماً من قرار الحذف والتصفير؟',
      isDanger: true,
      confirmText: 'نعم، امسح كل البيانات سحابياً',
      cancelText: 'تراجع وإلغاء',
      onConfirm: async () => {
        setIsWiping(true);
        try {
          await wipeAllInFS();
          setWipeKeyword('');
          onRefresh();
          showAlert({
            title: 'تم تصفير النظام بالكامل',
            message: 'نجحت العملية! تم مسح وحذف كافة السجلات المالية والزبائن سحابياً من قاعدة البيانات بنجاح.',
            type: 'success'
          });
        } catch (err: any) {
          showAlert({
            title: 'فشل تصفير السجلات',
            message: 'حصل خطأ غير متوقع أثناء عملية الحذف: ' + (err.message || err),
            type: 'error'
          });
        } finally {
          setIsWiping(false);
        }
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

  // Panels state - which sections are expanded
  const [expandedPanels, setExpandedPanels] = useState<Record<string, boolean>>({
    'branding': true,
    'data': false,
    'connection': false
  });

  const togglePanel = (panelId: string) => {
    setExpandedPanels(prev => ({
      ...prev,
      [panelId]: !prev[panelId]
    }));
  };

  const PanelHeader = ({ id, label, icon: Icon, colorClass }: { id: string, label: string, icon: any, colorClass: 'amber' | 'indigo' | 'sky' }) => {
    const isExpanded = expandedPanels[id];
    
    // Static class mapping for Tailwind reliability
    const colorStyles = {
      amber: isExpanded 
        ? 'bg-white border-amber-200 shadow-sm ring-1 ring-amber-100' 
        : 'bg-slate-50/50 border-slate-100',
      indigo: isExpanded 
        ? 'bg-white border-indigo-200 shadow-sm ring-1 ring-indigo-100' 
        : 'bg-slate-50/50 border-slate-100',
      sky: isExpanded 
        ? 'bg-white border-sky-200 shadow-sm ring-1 ring-sky-100' 
        : 'bg-slate-50/50 border-slate-100',
    };

    const iconStyles = {
      amber: isExpanded ? 'bg-amber-100 text-amber-700' : 'bg-slate-200/50 text-slate-500',
      indigo: isExpanded ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200/50 text-slate-500',
      sky: isExpanded ? 'bg-sky-100 text-sky-700' : 'bg-slate-200/50 text-slate-500',
    };

    const textStyles = {
      amber: isExpanded ? 'text-amber-900' : 'text-slate-800',
      indigo: isExpanded ? 'text-indigo-900' : 'text-slate-800',
      sky: isExpanded ? 'text-sky-900' : 'text-slate-800',
    };

    return (
      <button 
        onClick={() => togglePanel(id)}
        className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-500 font-bold border hover:scale-[1.005] group ${colorStyles[colorClass]}`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors duration-500 ${iconStyles[colorClass]}`}>
            <Icon className={`w-5 h-5 transition-transform duration-500 ${isExpanded ? 'scale-110' : 'group-hover:scale-110'}`} />
          </div>
          <span className={`transition-colors duration-500 ${textStyles[colorClass]}`}>{label}</span>
        </div>
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100/50 group-hover:bg-white transition-colors">
          {isExpanded ? <ChevronUp className="w-4 h-4 opacity-60" /> : <ChevronDown className="w-4 h-4 opacity-60" />}
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transition-colors" dir="rtl">
      <div className="flex items-center gap-3 border-b pb-4">
        <Database className="w-6 h-6 text-indigo-600" />
        <h3 className="text-lg font-bold text-slate-900 transition-colors">أدوات النظام والمزامنة</h3>
      </div>

      <div className="space-y-4">
        {/* Category 1: Branding & Identity */}
        <div className="space-y-2">
          <PanelHeader id="branding" label="هوية الحساب والشعار" icon={Building2} colorClass="amber" />
          {expandedPanels['branding'] && (
            <div className="p-1 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              {/* Logo Settings */}
              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-100/50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="font-bold text-slate-800 flex items-center gap-2 transition-colors">
                      <ImageIcon className="w-4 h-4 text-sky-600" />
                      شعار الفواتير وكشوفات الحساب
                    </div>
                    <p className="text-xs text-slate-500 mt-1 transition-colors">تخصيص الشعار الذي يظهر أعلى كشف الحساب عند التصدير لملف PDF.</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {logoBase64 && (
                      <div className="w-12 h-12 bg-white rounded-full border border-slate-200 overflow-hidden shrink-0 shadow-sm transition-colors">
                        <img src={logoBase64} alt="شعار النظام" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex flex-col gap-2">
                      <button onClick={() => logoInputRef.current?.click()} className="px-4 py-2 rounded-lg font-bold text-sm bg-sky-100 hover:bg-sky-200 text-sky-800 transition-all cursor-pointer">
                        {logoBase64 ? 'تغيير الشعار' : 'إرفاق شعار'}
                      </button>
                      {logoBase64 && (
                        <button onClick={clearLogo} className="px-4 py-1.5 rounded-lg font-bold text-xs bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center gap-1 transition-all cursor-pointer">
                          <Trash2 className="w-3 h-3" /> حذف الشعار الحالي
                        </button>
                      )}
                    </div>
                    <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </div>
                </div>
              </div>

              {/* Business Identity */}
              <div className="bg-slate-50/80 border border-slate-100/50 p-5 rounded-xl space-y-4 transition-colors">
                <div className="flex items-center gap-2 border-b border-slate-200/40 pb-3">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <h4 className="font-bold text-slate-800 text-sm transition-colors">تفاصيل الاسم الموحد والمظهر</h4>
                </div>

                {profile?.role !== 'manager' ? (
                  <div className="bg-amber-50/30 border border-amber-100 rounded-xl p-3 flex gap-2 text-xs text-amber-800 font-bold items-start animate-in fade-in transition-colors">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                    <span>عذراً، يتاح لمدير الحساب العام المالك فقط تعديل اسم المؤسسة وباقي معالم الهوية.</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 block transition-colors">
                          اسم الشركة / النشاط التجاري الحالي:
                        </label>
                        <input 
                          type="text" 
                          value={inputBusinessName}
                          onChange={(e) => setInputBusinessName(e.target.value)}
                          maxLength={80}
                          placeholder="مثال: مجموعة كنعان لتوزيع الأغذية"
                          className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-200 font-bold shadow-sm transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200/50">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 block transition-colors">
                          وصف العمل (يظهر أسفل الاسم بالكشف):
                        </label>
                        <input 
                          type="text" 
                          value={inputBusinessDesc}
                          onChange={(e) => setInputBusinessDesc(e.target.value)}
                          maxLength={150}
                          placeholder="مثال: لتوزيع الأغذية والمشروبات"
                          className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-200 font-bold shadow-sm transition-all"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 block transition-colors">
                          نص الحقوق المخصص لأسفل الصفحة:
                        </label>
                        <input 
                          type="text" 
                          value={inputCopyrightText}
                          onChange={(e) => setInputCopyrightText(e.target.value)}
                          maxLength={120}
                          placeholder="مثال: كافة الحقوق محفوظة لشركة كنعان"
                          className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-200 font-bold shadow-sm transition-all"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-200/50">
                      <span className="text-[10px] text-slate-400 font-bold transition-colors">
                        * سيتم تحديث الهوية لكافة المندوبين المسجلين تلقائياً.
                      </span>
                      <button 
                        type="button"
                        onClick={handleSaveIdentity}
                        disabled={isSavingIdentity}
                        className={`px-5 py-2 rounded-xl font-bold text-xs text-white transition flex items-center gap-1.5 cursor-pointer shadow-sm ${
                          isIdentitySaved ? 'bg-emerald-600' : 'bg-amber-500 hover:bg-amber-600'
                        }`}
                      >
                        {isSavingIdentity ? 'جاري الحفظ...' : (isIdentitySaved ? <Check className="w-3.5 h-3.5" /> : null)}
                        {isSavingIdentity ? 'جاري الحفظ...' : (isIdentitySaved ? 'تم حفظ الهوية!' : 'حفظ تعديلات الهوية الموحدة')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Category 2: Data Management */}
        <div className="space-y-2">
          <PanelHeader id="data" label="إدارة البيانات والنسخ الاحتياطي" icon={Database} colorClass="indigo" />
          {expandedPanels['data'] && (
            <div className="p-1 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onClick={handleExport} className="flex items-center gap-3 p-4 bg-slate-50/80 hover:bg-indigo-50/50 border border-slate-100 rounded-xl transition-all text-right group shadow-xs cursor-pointer">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-all">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 transition-colors">تصدير قاعدة البيانات (Backup)</div>
                    <p className="text-[10px] text-slate-500 transition-colors">حفظ نسخة كاملة من سجلات الحسابات والديون.</p>
                  </div>
                </button>

                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 p-4 bg-slate-50/80 hover:bg-emerald-50/50 border border-slate-100 rounded-xl transition-all text-right group shadow-xs cursor-pointer">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-all">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 transition-colors">استيراد نسخة احتياطية (Restore)</div>
                    <p className="text-[10px] text-slate-500 transition-colors">استبدال السجلات الحالية بنسخة محفوظة سابقاً.</p>
                  </div>
                  <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
                </button>
              </div>

              {/* Danger Zone: Full Database Wipe */}
              <div className="bg-rose-50/30 border border-rose-100/40 p-5 rounded-xl space-y-4 transition-colors">
                <div className="flex items-center gap-2 border-b border-rose-200/50 pb-3">
                  <AlertTriangle className="w-4 h-4 text-rose-500 transition-colors" />
                  <div>
                    <h4 className="font-bold text-rose-900 text-sm transition-colors">منطقة الخطر: تصفير شامل للنظام</h4>
                    <p className="text-[10px] text-rose-600 mt-0.5 transition-colors">مسح وحذف سجلات كافة الزبائن والعمليات المالية من السحاب نهائياً.</p>
                  </div>
                </div>

                {!(profile?.role === 'manager' || profile?.userId === profile?.companyId) ? (
                  <div className="bg-white/60 rounded-xl p-3 border border-rose-100/30 text-center transition-colors">
                    <span className="text-[10px] text-rose-700/80 font-bold block">
                      ⚠️ يتطلب صلاحيات المدير العام للقيام بهذا الإجراء العنيف.
                    </span>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    <div className="text-[10px] text-rose-800 leading-relaxed font-semibold bg-white/70 p-3 rounded-lg border border-rose-100/40 transition-colors">
                      تنبيه: سيؤدي هذا الإجراء إلى حذف كافة البيانات لجميع المندوبين المرتبطين بهذه المؤسسة في لحظة واحدة.
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-rose-950 block transition-colors">
                        لتأكيد الحذف الكلي، اكتب <span className="underline font-extrabold text-rose-700 px-1 font-mono">حذف نهائي</span> أدناه:
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input 
                          type="text" 
                          value={wipeKeyword}
                          onChange={(e) => setWipeKeyword(e.target.value)}
                          placeholder='اكتب هنا "حذف نهائي"'
                          className="flex-1 text-xs p-2.5 bg-white border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-200 font-bold shadow-sm transition-all"
                        />
                        <button
                          type="button"
                          onClick={handleWipeAllData}
                          disabled={isWiping || wipeKeyword.trim() !== 'حذف نهائي'}
                          className={`px-5 py-2.5 rounded-xl font-bold text-xs text-white transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer ${
                            wipeKeyword.trim() === 'حذف نهائي'
                              ? 'bg-rose-600 hover:bg-rose-700 hover:scale-[1.02] active:scale-95 shadow-rose-900/20'
                              : 'bg-rose-300 cursor-not-allowed opacity-60'
                          }`}
                        >
                          {isWiping ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              جاري المسح...
                            </>
                          ) : (
                            <>
                              <Trash2 className="w-3.5 h-3.5" />
                              تأكيد المسح النهائي
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Category 3: Connection & AI */}
        <div className="space-y-2">
          <PanelHeader id="connection" label="الاتصال والمزامنة والذكاء الاصطناعي" icon={Wifi} colorClass="sky" />
          {expandedPanels['connection'] && (
            <div className="p-1 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              {/* Offline Simulator */}
              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-100/50 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
                <div>
                  <div className="font-bold text-slate-800 flex items-center gap-2 transition-colors">
                    <Wifi className="w-4 h-4 text-sky-600" />
                    محاكي الإتصال لـ "كنعان الميداني"
                  </div>
                  <p className="text-xs text-slate-500 mt-1 transition-colors">تحديد ما إذا كان الهاتف يعمل حالياً بدون شبكة إنترنت (محاكاة الوضع الميداني).</p>
                </div>
                <button onClick={onToggleOfflineSimulated} className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer ${isOfflineSimulated ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-green-100 text-green-800 border border-green-200'}`}>
                  {isOfflineSimulated ? (
                    <>
                      <WifiOff className="w-4 h-4" />
                      وضع الأوفلاين (ميداني)
                    </>
                  ) : (
                    <>
                      <Wifi className="w-4 h-4" />
                      وضع الأونلاين (متصل)
                    </>
                  )}
                </button>
              </div>

              {/* Gemini API Custom Configuration */}
              <div className="bg-slate-50/80 border border-slate-100/50 p-5 rounded-xl space-y-4 transition-colors">
                <div className="flex items-center gap-2 border-b border-slate-200/40 pb-3">
                  <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm transition-colors">محرك كنعان الذكي (Gemini AI)</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5 transition-colors">تخصيص مفاتيح وربط الذكاء الاصطناعي لتحليل الحسابات وتوليد التذكيرات.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block flex items-center gap-1 text-[11px] transition-colors">
                      <Key className="w-3.5 h-3.5 text-indigo-500" />
                      مفتاح Gemini API المخصص:
                    </label>
                    <input 
                      type="password" 
                      value={customApiKey}
                      onChange={(e) => setCustomApiKey(e.target.value)}
                      placeholder="AIzaSyD..."
                      className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-150 font-mono text-left shadow-xs transition-all"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block text-[11px] transition-colors">
                      عنوان الرابط المخصص (اختياري):
                    </label>
                    <input 
                      type="url" 
                      value={customApiUrl}
                      onChange={(e) => setCustomApiUrl(e.target.value)}
                      placeholder="https://generativelanguage..."
                      className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-150 font-mono text-left shadow-xs transition-all"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="bg-white/90 border border-slate-100 rounded-xl p-3 transition-colors">
                  <label className="flex items-start gap-2.5 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={disableDefaultKey}
                      onChange={(e) => setDisableDefaultKey(e.target.checked)}
                      className="mt-1 h-3.5 w-3.5 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded transition"
                    />
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-extrabold text-slate-800 flex items-center gap-1.5 group-hover:text-indigo-700 transition">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                        الاعتماد حصراً على مفتاحي المخصص (تعطيل الافتراضي)
                      </span>
                      <p className="text-[10px] text-slate-500 leading-normal transition-colors">
                        لن يتم إرسال أي بيانات لنظام جيميناي إلا من خلال مفتاحك المدخل أعلاه لضمان خصوصية مطلقة.
                      </p>
                    </div>
                  </label>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5 transition-colors">
                    <div className={`w-2 h-2 rounded-full ${customApiKey ? 'bg-emerald-500' : (disableDefaultKey ? 'bg-rose-500' : 'bg-indigo-500')} animate-pulse`} />
                    <span>الحالة:</span>
                    <span className={customApiKey ? 'text-emerald-600' : (disableDefaultKey ? 'text-rose-600' : 'text-indigo-600')}>
                      {customApiKey ? 'يعمل بالمفتاح المخصص' : (disableDefaultKey ? 'مُعطل' : 'يعمل بالمفتاح الافتراضي للموقع')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {(customApiKey || customApiUrl || disableDefaultKey) && (
                      <button 
                        onClick={handleDisconnectGemini}
                        className="px-3 py-1.5 rounded-lg font-bold text-[11px] bg-rose-50 hover:bg-rose-100 text-rose-600 transition-all cursor-pointer flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" /> مسح إعداداتي
                      </button>
                    )}

                    <button 
                      onClick={handleSaveGeminiConfig}
                      className={`px-5 py-1.5 rounded-xl font-bold text-[11px] text-white transition-all flex items-center gap-1 shadow-sm cursor-pointer ${
                        isSaved ? 'bg-emerald-600' : 'bg-indigo-600 hover:bg-indigo-700'
                      }`}
                    >
                      {isSaved ? <Check className="w-3.5 h-3.5" /> : null}
                      {isSaved ? 'تم الحفظ!' : 'حفظ إعدادات الـ API'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Category 4: About Developer & Tech */}
        <div className="space-y-2">
          <PanelHeader id="developer" label="حول المطور والتقنية" icon={BookOpen} colorClass="sky" />
          {expandedPanels['developer'] && (
            <div className="p-1 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="bg-gradient-to-br from-white to-sky-50/30 p-6 rounded-2xl border border-sky-100/50 shadow-sm transition-colors">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  {/* Developer Avatar/Icon */}
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-sky-600 to-indigo-600 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                    <div className="relative w-24 h-24 bg-white rounded-full flex items-center justify-center border-4 border-white shadow-xl overflow-hidden shrink-0">
                      <span className="text-4xl select-none">👨‍💻</span>
                    </div>
                  </div>

                  <div className="flex-1 text-center md:text-right space-y-3">
                    <h4 className="text-xl font-black text-slate-900">مطور نظام كنعان الميداني</h4>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-2xl">
                      رؤيتنا هي تمكين التجار والمناديب في الميدان بأدوات تقنية فائقة الذكاء، تجمع بين سرعة الأداء وسهولة الوصول، مع الحفاظ على أعلى معايير أمان البيانات.
                    </p>
                    
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
                      <span className="px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-[10px] font-bold border border-sky-200">React 18</span>
                      <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-bold border border-indigo-200">Firebase Auth</span>
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold border border-emerald-200">Gemini AI</span>
                      <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-[10px] font-bold border border-slate-200">Tailwind CSS</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                  <a href="mailto:ma7m0ud.997@outlook.com" className="flex items-center justify-center gap-2 p-3 bg-white border border-slate-100 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all group">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <Mail className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-700">البريد المباشر</span>
                  </a>
                  <a 
                    href="https://wa.me/963991660229?text=%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85%20%D8%B9%D9%84%D9%8A%D9%83%D9%85%D8%8C%20%D8%A3%D8%AD%D8%AA%D8%A7%D8%AC%20%D8%AF%D8%B9%D9%85%20%D8%A8%D8%AE%D8%B5%D9%88%D8%B5%20%D9%86%D8%B8%D8%A7%D9%85%20%D9%83%D9%86%D8%B9%D8%A7%D9%86%20%D8%A7%D9%84%D9%85%D9%8A%D8%AF%D8%A7%D9%86%D9%8A" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 p-3 bg-white border border-slate-100 rounded-xl hover:border-emerald-300 hover:shadow-md transition-all group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <Phone className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-700">واتساب الدعم</span>
                  </a>
                </div>

                <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400">صنع بكل ❤️ لدعم التجار والمبدعين</span>
                  <div className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(56,189,248,0.6)]" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Guide Accordion (Existing style preserved for consistency) */}
      <div className="mt-8 pt-6 border-t border-slate-100 transition-colors">
        <button 
          onClick={() => setIsGuideOpen(!isGuideOpen)}
          className={`w-full flex items-center justify-between p-4 rounded-xl text-right transition font-bold border shadow-sm cursor-pointer ${
            isGuideOpen 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isGuideOpen ? 'bg-emerald-200/50' : 'bg-emerald-100 shadow-xs'}`}>
              <BookOpen className={`w-4 h-4 transition-colors ${isGuideOpen ? 'text-emerald-700' : 'text-emerald-600'}`} />
            </div>
            دليل استخدام نظام كنعان الميداني الكامل
          </div>
          {isGuideOpen ? <ChevronUp className="w-5 h-5 opacity-60" /> : <ChevronDown className="w-5 h-5 opacity-60 transition-transform" />}
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
