import React, { useMemo, useState, useEffect } from 'react';
import { Transaction } from '../lib/db';
import { Archive, X, CheckCircle2, AlertCircle, Sparkles, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency, formatDate } from '../lib/utils';

interface ArchiveAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[]; // Pass all active transactions to analyze
  onArchive: (ids: string[]) => void;
}

export function ArchiveAnalysisModal({ isOpen, onClose, transactions, onArchive }: ArchiveAnalysisModalProps) {
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'archiving' | 'success'>('idle');
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);

  // Advanced analysis: Find "Balanced Groups" (Debts that sum up to certain Payments)
  const analysis = useMemo(() => {
    const debts = transactions.filter(t => t.type === 'debt' && !t.isArchived).sort((a,b) => a.date.localeCompare(b.date));
    const payments = transactions.filter(t => t.type === 'payment' && !t.isArchived).sort((a,b) => a.date.localeCompare(b.date));
    
    let totalDebt = debts.reduce((sum, d) => sum + d.amount, 0);
    let totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    
    // Logic: we can archive any amount that is fully covered
    let archivableIds: string[] = [];
    let coveredAmount = 0;
    let paymentPool = totalPaid;
    
    for (const debt of debts) {
      if (paymentPool >= debt.amount) {
        archivableIds.push(debt.id);
        paymentPool -= debt.amount;
        coveredAmount += debt.amount;
      }
    }

    // Now find which payments are "fully used" to cover these debts
    let tempPool = coveredAmount;
    for (const p of payments) {
      if (tempPool >= p.amount) {
        archivableIds.push(p.id);
        tempPool -= p.amount;
      }
    }

    return {
      archivableIds,
      totalArchivableCount: archivableIds.length,
      coveredAmount,
      excessPayment: totalPaid - coveredAmount,
      remainingUnpaidDebt: totalDebt - coveredAmount
    };
  }, [transactions]);

  // Run AI Analysis when modal opens and we have something to archive
  useEffect(() => {
    if (isOpen && analysis.archivableIds.length > 0 && status === 'idle') {
      const getAiAdvice = async () => {
        setStatus('analyzing');
        try {
          const response = await fetch('/api/ai/analyze-archive', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              summary: {
                coveredAmount: analysis.coveredAmount,
                totalArchivable: analysis.totalArchivableCount,
                remainingDebt: analysis.remainingUnpaidDebt
              }
            })
          });
          const data = await response.json();
          if (data.advice) setAiAdvice(data.advice);
        } catch (e) {
          console.error('AI Advice error:', e);
        } finally {
          setStatus('idle');
        }
      };
      getAiAdvice();
    }
  }, [isOpen, analysis.archivableIds.length]);

  const handleArchive = async () => {
    setStatus('archiving');
    try {
      await onArchive(analysis.archivableIds);
      setStatus('success');
      setTimeout(() => {
        onClose();
        setTimeout(() => {
          setStatus('idle');
          setAiAdvice(null);
        }, 300);
      }, 1500);
    } catch (error) {
      console.error('Archive error:', error);
      setStatus('idle');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" 
            onClick={status === 'idle' ? onClose : undefined} 
          />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-0 relative z-10 overflow-hidden border border-slate-100"
            dir="rtl"
          >
            {/* AI Assistant Header Accent */}
            <div className="h-1.5 w-full bg-linear-to-r from-amber-400 via-emerald-500 to-indigo-600" />

            <AnimatePresence mode="wait">
              {status === 'success' ? (
                <motion.div 
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  className="py-12 flex flex-col items-center justify-center space-y-4"
                >
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                    <Check className="w-8 h-8 font-black" />
                  </div>
                  <div className="text-center px-6">
                    <h3 className="text-lg font-black text-slate-900">تمت الأرشفة بنجاح</h3>
                    <p className="text-xs text-slate-500 font-bold mt-1">تم ضغط الحساب ونقل العمليات المغلقة للأرشيف</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="analysis" className="p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-amber-600">
                        <Sparkles className="w-4 h-4 fill-amber-500" />
                        <span className="text-[10px] font-black uppercase tracking-wider">مساعد كنعان الذكي 🌾</span>
                      </div>
                      <h3 className="text-xl font-black text-slate-900">تحليل وتنظيف الحساب</h3>
                    </div>
                    {status === 'idle' && (
                      <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-2xl transition-colors cursor-pointer">
                        <X className="w-5 h-5 text-slate-400" />
                      </button>
                    )}
                  </div>

                  {status === 'analyzing' ? (
                    <div className="py-12 flex flex-col items-center justify-center space-y-4">
                      <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                      <p className="text-xs font-bold text-slate-500 animate-pulse">جاري تحليل العمليات المالية المتطابقة...</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-emerald-50/40 border border-emerald-100 p-3.5 rounded-2xl">
                          <div className="text-[10px] font-black text-emerald-700 mb-1 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> مبالغ مغلقة
                          </div>
                          <div className="text-xl font-black text-emerald-900 leading-none">{formatCurrency(analysis.coveredAmount)}</div>
                          <div className="text-[9px] text-emerald-600 font-bold mt-1">جاهزة للإخفاء (أرشفة)</div>
                        </div>
                        <div className="bg-amber-50/40 border border-amber-100 p-3.5 rounded-2xl">
                          <div className="text-[10px] font-black text-amber-700 mb-1 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" /> ذمم جارية
                          </div>
                          <div className="text-xl font-black text-amber-900 leading-none">{formatCurrency(analysis.remainingUnpaidDebt)}</div>
                          <div className="text-[9px] text-amber-600 font-bold mt-1">بذمة التاجر حالياً</div>
                        </div>
                      </div>

                      {/* AI Advice Box */}
                      <div className="bg-linear-to-br from-indigo-50/50 to-emerald-50/50 p-4 rounded-2xl border border-indigo-100/50 relative overflow-hidden group">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                          <span className="text-xs font-black text-indigo-900">تحليل المساعد الذكي:</span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium min-h-[40px]">
                          {aiAdvice || "يُفضل دائماً أرشفة الدفعات التي تغطي الديون السابقة بالكامل للحفاظ على كشف حساب واضح ومرتب يسهل عملية التحصيل القادمة."}
                        </p>
                        <Sparkles className="absolute -bottom-2 -left-2 w-10 h-10 text-indigo-200/40" />
                      </div>

                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-2 text-xs font-black text-slate-800 mb-2">
                          <Archive className="w-4 h-4 text-slate-400" />
                          تأثير الإجراء:
                        </div>
                        <ul className="space-y-1.5">
                          <li className="flex items-center gap-2.5 text-[11px] font-bold text-slate-500">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            تجميع وأرشفة <span className="text-slate-900">{analysis.totalArchivableCount}</span> عمليات متطابقة.
                          </li>
                          <li className="flex items-center gap-2.5 text-[11px] font-bold text-slate-500">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            يبقى الرصيد النهائي <span className="text-slate-900">ثابتاً بدقة 100%</span>.
                          </li>
                        </ul>
                      </div>

                      {analysis.archivableIds.length === 0 ? (
                        <div className="p-4 bg-slate-50 rounded-2xl text-center text-slate-400 text-xs font-bold border border-dashed border-slate-200">
                          لا توجد عمليات مغلقة حالياً للأرشفة الذكية.
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 pt-2">
                          <button 
                            onClick={handleArchive} 
                            disabled={status === 'archiving'}
                            className="flex-1 py-3.5 px-6 rounded-2xl bg-slate-900 text-white font-black text-sm hover:bg-slate-800 transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                          >
                            {status === 'archiving' ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Archive className="w-4 h-4" />
                            )}
                            تأكيد التنظيف الذكي
                          </button>
                          <button 
                            onClick={onClose} 
                            disabled={status === 'archiving'}
                            className="px-6 py-3.5 rounded-2xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-colors cursor-pointer"
                          >
                            لاحقاً
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

