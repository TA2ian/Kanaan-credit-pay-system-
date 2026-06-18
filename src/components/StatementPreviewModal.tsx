import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Printer, Wand2, FileText, Settings, Laptop, Smartphone, Check } from 'lucide-react';
import { BaseModal } from './BaseModal';
import { Customer, Transaction, CustomerBalance } from '../lib/db';
import { formatCurrency, getGeminiHeaders } from '../lib/utils';
import { PrintStatementTemplate } from './PrintStatementTemplate';

interface StatementPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: CustomerBalance;
  transactions: Transaction[];
  archivedTransactions: Transaction[];
  hidePayments?: boolean;
  hideWithdrawals?: boolean;
  initialPaperSize?: 'A4' | '80mm' | '58mm';
}

export function StatementPreviewModal({ 
  isOpen, 
  onClose, 
  balance, 
  transactions, 
  archivedTransactions,
  hidePayments = false,
  hideWithdrawals = false,
  initialPaperSize
}: StatementPreviewModalProps) {
  const [includeReminder, setIncludeReminder] = useState(false);
  const [aiReminder, setAiReminder] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isPrintView, setIsPrintView] = useState(false);

  // Auto-detect classification of printer or paper size
  const [printPaperSize, setPrintPaperSize] = useState<'A4' | '80mm' | '58mm'>(() => {
    if (initialPaperSize) return initialPaperSize;
    
    const stored = localStorage.getItem('pos_default_paper_size');
    if (stored === 'A4' || stored === '80mm' || stored === '58mm') {
      return stored as 'A4' | '80mm' | '58mm';
    }
    
    // Auto-detect heuristic:
    // Mobile/Tablet devices are usually carrying thermal 58mm portable BT printers in trucks/vans.
    // Desktop setups usually run on desktop POS 80mm or standard A4 billing.
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    return isMobile ? '58mm' : '80mm';
  });

  // Keep state in sync with initialPaperSize if passed dynamically (e.g., from direct print buttons)
  useEffect(() => {
    if (initialPaperSize) {
      setPrintPaperSize(initialPaperSize);
    }
  }, [initialPaperSize]);

  const handlePaperSizeChange = (size: 'A4' | '80mm' | '58mm') => {
    setPrintPaperSize(size);
    localStorage.setItem('pos_default_paper_size', size);
  };

  const generateAiReminder = async () => {
    setIsGeneratingAi(true);
    setAiReminder(''); 
    try {
      const response = await fetch('/api/gemini/reminder', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getGeminiHeaders()
        },
        body: JSON.stringify({
          customerName: balance.customer.name,
          amount: balance.remainingDebt,
          notes: balance.customer.notes,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'خطأ في توليد التذكير');
      setAiReminder(data.message);
      setIncludeReminder(true);
    } catch (error: any) {
      setAiReminder('خطأ: ' + error.message);
      setIncludeReminder(true);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  if (isPrintView) {
    const content = (
      <div id="print-overlay" className="fixed inset-0 z-[100] bg-slate-100 overflow-y-auto flex flex-col items-center justify-start print:static print:h-auto print:overflow-visible print:bg-white print:p-0 print:m-0" dir="rtl">
        <div className="w-full max-w-3xl px-2 sm:px-4 flex-1 pb-8 print:p-0 print:max-w-none print:w-full print:block">
          <PrintStatementTemplate 
            balance={balance} 
            transactions={transactions} 
            archivedTransactions={archivedTransactions} 
            reminder={includeReminder ? aiReminder : ''} 
            onClose={() => setIsPrintView(false)} 
            hidePayments={hidePayments}
            hideWithdrawals={hideWithdrawals}
            paperSize={printPaperSize}
          />
        </div>
      </div>
    );
    return createPortal(content, document.body);
  }

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="خيارات الطباعة والمعاينة الحرارية">
      <div className="p-4 space-y-4">
        {/* Customer Balance Summary card */}
        <div className="bg-slate-50 p-4 rounded-2xl space-y-2 text-right">
            <h3 className="font-bold text-slate-800">{balance.customer.name}</h3>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-white p-2 rounded-xl border border-slate-100">
                    <div className="text-slate-500 font-bold">الدين</div>
                    <div className="font-black text-rose-600">{formatCurrency(balance.totalDebt)}</div>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-100">
                    <div className="text-slate-500 font-bold">المسدد</div>
                    <div className="font-black text-emerald-600">{formatCurrency(balance.totalPaid)}</div>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-100">
                    <div className="text-slate-500 font-bold">المتبقي</div>
                    <div className="font-black text-rose-600">{formatCurrency(balance.remainingDebt)}</div>
                </div>
            </div>
        </div>

        {/* Paper Size / POS Printer Picker */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-1.5 font-bold text-sm text-slate-700">
            <Settings className="w-4 h-4 text-indigo-500" />
            <span>تحديد قياس ورق طابعة الفواتير (POS)</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* A4 Option */}
            <button
              type="button"
              onClick={() => handlePaperSizeChange('A4')}
              className={`p-3 rounded-xl border text-center flex flex-col items-center gap-1.5 transition-all text-xs cursor-pointer ${
                printPaperSize === 'A4'
                  ? 'border-indigo-600 bg-indigo-50/40 text-indigo-900 font-bold ring-2 ring-indigo-500/10'
                  : 'border-slate-100 bg-white text-slate-600 hover:border-slate-200'
              }`}
            >
              <FileText className="w-5 h-5 text-indigo-500" />
              <span>A4 المكتبي</span>
              <span className="text-[10px] text-slate-400 font-normal">ورق عادي</span>
              {printPaperSize === 'A4' && <span className="text-[9px] font-bold text-indigo-600 px-1.5 py-0.5 bg-indigo-100/50 rounded-full">إعداد افتراضي</span>}
            </button>

            {/* 80mm POS Option */}
            <button
              type="button"
              onClick={() => handlePaperSizeChange('80mm')}
              className={`p-3 rounded-xl border text-center flex flex-col items-center gap-1.5 transition-all text-xs cursor-pointer ${
                printPaperSize === '80mm'
                  ? 'border-indigo-600 bg-indigo-50/40 text-indigo-900 font-bold ring-2 ring-indigo-500/10'
                  : 'border-slate-100 bg-white text-slate-600 hover:border-slate-200'
              }`}
            >
              <Laptop className="w-5 h-5 text-indigo-500" />
              <span>80mm POS</span>
              <span className="text-[10px] text-slate-400 font-normal">طابعة كاشير عملية</span>
              {printPaperSize === '80mm' && <span className="text-[9px] font-bold text-indigo-600 px-1.5 py-0.5 bg-indigo-100/50 rounded-full">إعداد افتراضي</span>}
            </button>

            {/* 58mm Portable Option */}
            <button
              type="button"
              onClick={() => handlePaperSizeChange('58mm')}
              className={`p-3 rounded-xl border text-center flex flex-col items-center gap-1.5 transition-all text-xs cursor-pointer ${
                printPaperSize === '58mm'
                  ? 'border-indigo-600 bg-indigo-50/40 text-indigo-900 font-bold ring-2 ring-indigo-500/10'
                  : 'border-slate-100 bg-white text-slate-600 hover:border-slate-200'
              }`}
            >
              <Smartphone className="w-5 h-5 text-emerald-500" />
              <span>58mm المحمولة</span>
              <span className="text-[10px] text-slate-400 font-normal">مناديب بلوتوث</span>
              {printPaperSize === '58mm' && <span className="text-[9px] font-bold text-emerald-600 px-1.5 py-0.5 bg-emerald-100/50 rounded-full">إعداد افتراضي</span>}
            </button>
          </div>
          
          <p className="text-[10px] text-slate-400 leading-normal text-right">
            📌 يكتشف النظام الميداني تلقائياً الطابعة المتصلة بجهاز المندوب ويوائم عناصر الفاتورة الحرارية تلقائياً لتفادي الهدر بالورق.
          </p>
        </div>

        {/* AI Reminders Option wrapper */}
        <div className="space-y-2 border-t pt-3">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-sm text-slate-700">
                <input type="checkbox" checked={includeReminder} onChange={(e) => setIncludeReminder(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                إضافة رسالة تذكير ذكية (AI) للفاتورة
            </label>
            
            {includeReminder && (
                <div className="space-y-2 animate-slide-up">
                    <button type="button" onClick={generateAiReminder} className="flex items-center gap-2 text-xs text-indigo-700 bg-indigo-50 hover:bg-indigo-100/60 transition px-2 py-1 rounded-lg">
                        <Wand2 className="w-3.5 h-3.5 animate-pulse"/> {isGeneratingAi ? 'جاري الصياغة...' : 'تأليف رسالة تحصيل مهذبة بالذكاء كنعان'}
                    </button>
                    <textarea value={aiReminder} onChange={(e) => setAiReminder(e.target.value)} className="w-full border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 p-2.5 text-sm rounded-xl text-right font-sans" rows={3} placeholder="اكتب الملاحظة أو اضغط توليد لتشغيل الذكاء الاصطناعي..." />
                </div>
            )}
        </div>

        {/* Launch Preview Buttons */}
        <button 
          type="button"
          onClick={() => setIsPrintView(true)}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black p-3.5 rounded-2xl cursor-pointer shadow-lg shadow-indigo-100 transition duration-150"
        >
          <Printer className="w-5 h-5" />
          معاينة وتأكيد الطباعة ({printPaperSize})
        </button>
      </div>
    </BaseModal>
  );
}
