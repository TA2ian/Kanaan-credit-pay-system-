import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Printer, Wand2 } from 'lucide-react';
import { BaseModal } from './BaseModal';
import { Customer, Transaction, CustomerBalance } from '../lib/db';
import { formatCurrency, getGeminiHeaders } from '../lib/utils';
import { PrintStatementTemplate } from './PrintStatementTemplate';

interface StatementPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: CustomerBalance;
  transactions: Transaction[];
}

export function StatementPreviewModal({ isOpen, onClose, balance, transactions }: StatementPreviewModalProps) {
  const [includeReminder, setIncludeReminder] = useState(false);
  const [aiReminder, setAiReminder] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isPrintView, setIsPrintView] = useState(false);

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
          <PrintStatementTemplate balance={balance} transactions={transactions} reminder={includeReminder ? aiReminder : ''} onClose={() => setIsPrintView(false)} />
        </div>
      </div>
    );
    return createPortal(content, document.body);
  }

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="معاينة وتصدير كشف الحساب">
      <div className="p-4 space-y-4">
        <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-right">
            <h3 className="font-bold text-slate-800">{balance.customer.name}</h3>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-white p-2 rounded">
                    <div className="text-slate-500 font-bold">الدين</div>
                    <div className="font-black text-rose-600">{formatCurrency(balance.totalDebt)}</div>
                </div>
                <div className="bg-white p-2 rounded">
                    <div className="text-slate-500 font-bold">المسدد</div>
                    <div className="font-black text-emerald-600">{formatCurrency(balance.totalPaid)}</div>
                </div>
                <div className="bg-white p-2 rounded">
                    <div className="text-slate-500 font-bold">المتبقي</div>
                    <div className="font-black text-rose-600">{formatCurrency(balance.remainingDebt)}</div>
                </div>
            </div>
        </div>

        <div className="space-y-2 border-t pt-4">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                <input type="checkbox" checked={includeReminder} onChange={(e) => setIncludeReminder(e.target.checked)} className="h-4 w-4" />
                إضافة رسالة تذكير (AI)
            </label>
            
            {includeReminder && (
                <div className="space-y-2">
                    <button type="button" onClick={generateAiReminder} className="flex items-center gap-2 text-xs text-indigo-700 bg-indigo-50 px-2 py-1 rounded">
                        <Wand2 className="w-3 h-3"/> {isGeneratingAi ? 'جاري التوليد...' : 'توليد رسالة تذكير ذكية'}
                    </button>
                    <textarea value={aiReminder} onChange={(e) => setAiReminder(e.target.value)} className="w-full border p-2 text-sm rounded-lg" rows={3} />
                </div>
            )}
        </div>

        <button 
          type="button"
          onClick={() => setIsPrintView(true)}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold p-3 rounded-xl hover:bg-indigo-700 cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          معاينة الطباعة (HTML)
        </button>
      </div>
    </BaseModal>
  );
}
