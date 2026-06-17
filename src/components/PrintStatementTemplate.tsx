import React, { useRef, useState, useEffect } from 'react';
import { Customer, Transaction, CustomerBalance } from '../lib/db';
import { formatCurrency, formatPhoneNumberForUrl } from '../lib/utils';
import { usePopup } from '../lib/PopupContext';
import { useFirebase } from '../lib/FirebaseContext';
import { ArrowRight, Share2, Loader2 } from 'lucide-react';
// @ts-ignore
import html2pdf from 'html2pdf.js';

interface PrintStatementTemplateProps {
  balance: CustomerBalance;
  transactions: Transaction[];
  archivedTransactions: Transaction[];
  reminder: string;
  onClose?: () => void;
  hidePayments?: boolean;
  hideWithdrawals?: boolean;
}

export const PrintStatementTemplate: React.FC<PrintStatementTemplateProps> = ({ 
  balance, 
  transactions, 
  archivedTransactions, 
  reminder, 
  onClose,
  hidePayments = false,
  hideWithdrawals = false
}) => {
  const { customer, totalDebt, totalPaid, remainingDebt } = balance;
  const totalArchived = archivedTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  const { profile } = useFirebase();
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const { showAlert } = usePopup();

  // Filter local transactions based on props
  const filteredTransactions = transactions.filter(tx => {
    if (hidePayments && tx.type === 'payment') return false;
    if (hideWithdrawals && tx.type === 'debt') return false;
    return true;
  });

  const filteredTotalDebt = filteredTransactions.filter(t => t.type === 'debt').reduce((sum, t) => sum + t.amount, 0);
  const filteredTotalPaid = filteredTransactions.filter(t => t.type === 'payment').reduce((sum, t) => sum + t.amount, 0);

  useEffect(() => {
    const savedLogo = localStorage.getItem('company_logo');
    if (savedLogo) {
      setLogoBase64(savedLogo);
    }
  }, []);

  const generatePdfBlob = async () => {
    if (!contentRef.current) return null;
    
    try {
      const opt = {
        margin: 15, // 15mm margins
        filename: `كشف حساب - ${customer.name}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true,
          logging: false,
          scrollY: 0,
          scrollX: 0
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      // @ts-ignore
      const pdfEngine = window.html2pdf || html2pdf;
      if (!pdfEngine) {
         console.warn('html2pdf engine not found.');
         return null;
      }

      const pdfBlob = await pdfEngine().set(opt).from(contentRef.current).output('blob');
      return pdfBlob;
    } catch (e) {
      console.error('PDF Generation Error:', e);
      return null;
    }
  };

  const sendWhatsApp = async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    const busName = profile?.businessName || 'مجموعة كنعان الذكية';
    const delName = profile?.delegateName || 'عبدالرحمن كنعان';
    const delPhone = profile?.phone || '0958280936';

    const text = `💼 *كشف مالي معتمد - ${busName}* 🧾\n*العميل الكريم:* ${customer.name}\n*المنطقة / البلد:* ${customer.region || 'غير محددة'}\n*جوال:* ${customer.phone}\n-------------------------------------\n• الرصيد المطلوب كلياً ذمة: *${formatCurrency(remainingDebt)}*\n• إجمالي المسحوبات (الدين): *${formatCurrency(totalDebt)}*\n• إجمالي المدفوع الموثق: *${formatCurrency(totalPaid)}*\n-------------------------------------\nأخوكم ${delName} لتوزيع الأغذية والمشروبات 🌾\nللاستعلام والطلب: ${delPhone} 📞${reminder ? `\n\nملاحظة: ${reminder}` : ''}`;
    
    try {
      const pdfBlob = await generatePdfBlob();
      
      if (!pdfBlob) {
        // Fallback: Send just text message if PDF failed
        window.open(`https://wa.me/${formatPhoneNumberForUrl(customer.phone)}?text=${encodeURIComponent(text)}`, '_blank');
        return;
      }
      
      const file = new File([pdfBlob], `كشف حساب - ${customer.name}.pdf`, { type: 'application/pdf' });

      // Try native Share API first
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `كشف حساب ${customer.name}`
          });
        } catch (shareError: any) {
          if (shareError.name === 'AbortError') return;
          // Sub-fallback if share fails for some reason
          throw shareError;
        }
      } else {
        // Fallback for Desktop: Download PDF and open WhatsApp web
        const fileURL = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = fileURL;
        link.download = `كشف حساب - ${customer.name}.pdf`;
        link.click();
        URL.revokeObjectURL(fileURL);

        showAlert({
          title: 'تنزيل ومشاركة كشف الحساب',
          message: 'تم تخزين وتنزيل كشف الحساب كملف PDF على جهازكم.\nسيتم الآن توجيهكم لتطبيق واتساب، يرجى إرسال الرسالة وإرفاق الملف بشكل يدوي.',
          type: 'success'
        });
        window.open(`https://wa.me/${formatPhoneNumberForUrl(customer.phone)}?text=${encodeURIComponent(text)}`, '_blank');
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('Error sharing:', error);
      showAlert({
        title: 'تنبيه إرسال واتساب',
        message: 'حدث خطأ تقني غير متوقع أثناء مشاركة ملف PDF، سيتم توجيهكم الآن إلى واتساب لمشاركة النص التفصيلي للكشف المالي فقط.',
        type: 'warning'
      });
      window.open(`https://wa.me/${formatPhoneNumberForUrl(customer.phone)}?text=${encodeURIComponent(text)}`, '_blank');
    } finally {
        setIsGenerating(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center pt-4 sm:pt-8 print:p-0">
      {/* Controls Container */}
      <div className="w-full max-w-2xl flex flex-wrap justify-between items-center gap-2 mb-6 sm:mb-8 print:hidden">
        {onClose && (
          <button type="button" onClick={onClose} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2 rounded-lg text-sm font-bold shadow-sm cursor-pointer transition">
            <ArrowRight className="w-4 h-4" />
            تراجع وإغلاق
          </button>
        )}
        
        <button type="button" onClick={sendWhatsApp} disabled={isGenerating} className={`flex items-center gap-2 ${isGenerating ? 'bg-emerald-400' : 'bg-emerald-600 hover:bg-emerald-700'} text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm cursor-pointer transition mr-auto`}>
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
          {isGenerating ? "جاري التجهيز..." : "تصدير أو إرسال عبر واتساب"}
        </button>
      </div>

      {/* Printable Area Container */}
      <div className="w-full flex justify-center print:block print:w-full" dir="rtl">
        <div id="pdf-content-wrapper" ref={contentRef} className={`w-full max-w-[750px] min-w-[320px] mx-auto p-4 sm:p-8 text-sm sm:text-base border print:border-none print:p-0 print:m-0 print:max-w-none print:w-full`} style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#e2e8f0' }}>
        {/* Header */}
        <div className="grid grid-cols-3 items-center gap-2 mb-4 sm:mb-6 w-full">
          {/* Right Section: Company details */}
          <div className="text-right">
            <h1 className="text-base sm:text-2xl font-black mb-0.5 leading-tight" style={{ color: '#1e40af' }}>{profile?.businessName || 'مجموعة كنعان'}</h1>
            <p className="text-[10px] sm:text-sm font-bold leading-tight" style={{ color: '#f97316' }}>{profile?.businessDesc || 'لتوزيع الأغذية والمشروبات والخدمات'}</p>
            <p className="text-[10px] sm:text-sm font-semibold mt-1 text-right" dir="ltr" style={{ color: '#1e293b' }}>{profile?.phone || '0958280936'}</p>
          </div>
          
          {/* Middle Section: Statement information */}
          <div className="text-center">
            <h2 className="text-base sm:text-xl font-black mb-0.5" style={{ color: '#1e40af' }}>كشف حساب</h2>
            <h3 className="text-xs sm:text-sm font-bold block leading-normal py-0.5" style={{ color: '#0f172a' }}>{customer.name}</h3>
            <p className="text-[9px] sm:text-xs font-semibold mt-0.5" style={{ color: '#64748b' }}>{new Date().toLocaleDateString('ar-SA')}</p>
          </div>
          
          {/* Left Section: Company Logo */}
          <div className="flex justify-end items-center">
            <div style={{ width: '64px', height: '64px', minWidth: '64px', minHeight: '64px', border: '3px solid #D4AF37', backgroundColor: '#ffffff', flexShrink: 0 }} className="rounded-full overflow-hidden flex items-center justify-center shadow-sm">
               {logoBase64 ? (
                 <img src={logoBase64} alt="شعار كنعان" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
               ) : (
                 <span className="text-[10px] font-bold px-1 text-center" style={{ color: 'rgba(30, 64, 175, 0.2)' }}>شعار</span>
               )}
            </div>
          </div>
        </div>
        <div className="border-b-4 mb-4 sm:mb-6 w-full" style={{ borderColor: '#1e40af' }}></div>

        {/* Summary Cards */}
      <div className={`grid grid-cols-${(!hidePayments && !hideWithdrawals) ? '3' : '2'} gap-2 sm:gap-3 mb-4 sm:mb-6 w-full`}>
        <div className={`p-2 rounded-lg flex flex-col justify-center min-h-[55px] sm:min-h-[65px]`} style={{ backgroundColor: '#ffffff', borderColor: '#fda4af', borderWidth: 1 }}>
          <p className={`text-[10px] sm:text-xs font-bold mb-1 flex items-center justify-center gap-1`} style={{ color: '#64748b' }}>الرصيد المستحق</p>
          <p className={`text-xs sm:text-lg font-black text-center`} style={{ color: '#e11d48' }}>{formatCurrency(remainingDebt)}</p>
          <p className={`text-center text-[9px] sm:text-[10px] font-bold mt-0.5`} style={{ color: '#475569' }}>⏳ مستحق</p>
        </div>
        
        {!hidePayments && (
          <div className={`p-2 rounded-lg flex flex-col justify-center min-h-[55px] sm:min-h-[65px]`} style={{ backgroundColor: '#ffffff', borderColor: '#6ee7b7', borderWidth: 1 }}>
            <p className={`text-[10px] sm:text-xs font-bold mb-1 text-center`} style={{ color: '#64748b' }}>إجمالي المدفوع الموثق</p>
            <p className={`text-xs sm:text-lg font-black text-center`} style={{ color: '#059669' }}>{formatCurrency(totalPaid)}</p>
            <p className={`text-center text-[9px] sm:text-[10px] font-bold mt-0.5`} style={{ color: '#64748b' }}>{transactions.filter(t => t.type === 'payment').length} دفعة</p>
          </div>
        )}

        {!hideWithdrawals && (
          <div className={`p-2 rounded-lg flex flex-col justify-center min-h-[55px] sm:min-h-[65px]`} style={{ backgroundColor: '#ffffff', borderColor: '#bfdbfe', borderWidth: 1 }}>
            <p className={`text-[10px] sm:text-xs font-bold mb-1 text-center`} style={{ color: '#64748b' }}>إجمالي البضاعة</p>
            <p className={`text-xs sm:text-lg font-black text-center`} style={{ color: '#1e40af' }}>{formatCurrency(totalDebt)}</p>
            <p className={`text-center text-[9px] sm:text-[10px] font-bold mt-0.5`} style={{ color: '#64748b' }}>{transactions.filter(t => t.type === 'debt').length} تسليم</p>
          </div>
        )}
      </div>
      
      {/* Transactions */}
      <div className={`space-y-6 sm:space-y-8 mb-6 sm:mb-8`}>
        {!hideWithdrawals && (
          <section>
            <h3 className={`text-base sm:text-lg font-bold mb-2 flex items-center gap-2`} style={{ color: '#1e40af' }}>🚚 التسليمات</h3>
            <table className={`w-full text-right text-xs sm:text-sm border-collapse`}>
              <thead>
                <tr className="border-b-2" style={{ borderColor: '#e2e8f0' }}>
                  <th className={`py-2 font-bold w-1/3`} style={{ color: '#1e40af' }}>التاريخ</th>
                  <th className={`py-2 font-bold w-1/3 text-center`} style={{ color: '#1e40af' }}>البيان</th>
                  <th className={`py-2 font-bold w-1/3 text-left`} style={{ color: '#1e40af' }}>المبلغ</th>
                </tr>
              </thead>
              <tbody>
                {transactions.filter(tx => tx.type === 'debt').map((tx, i) => (
                  <tr key={i} className="border-b" style={{ borderColor: '#f1f5f9' }}>
                    <td className={`py-2 sm:py-3`} style={{ color: '#475569' }}>{tx.date}</td>
                    <td className={`py-2 sm:py-3 text-center truncate max-w-[100px] sm:max-w-none`} style={{ color: '#475569' }}>{tx.notes || '---'}</td>
                    <td className={`py-2 sm:py-3 font-bold text-left`} dir="ltr" style={{ color: '#1e40af' }}>{formatCurrency(tx.amount)}</td>
                  </tr>
                ))}
                <tr className="border-b-2" style={{ borderColor: '#e2e8f0' }}>
                  <td colSpan={2} className={`py-3 sm:py-4 font-black text-center`} style={{ color: '#1e40af' }}>المجموع</td>
                  <td className={`py-3 sm:py-4 font-black text-left`} dir="ltr" style={{ color: '#1e40af' }}>{formatCurrency(totalDebt)}</td>
                </tr>
              </tbody>
            </table>
          </section>
        )}

        {!hidePayments && (
          <section>
            <h3 className={`text-base sm:text-lg font-bold mb-2 flex items-center gap-2`} style={{ color: '#059669' }}>💵 الدفعات</h3>
            <table className={`w-full text-right text-xs sm:text-sm border-collapse`}>
              <thead>
                <tr className="border-b-2" style={{ borderColor: '#e2e8f0' }}>
                  <th className={`py-2 font-bold w-1/3`} style={{ color: '#059669' }}>التاريخ</th>
                  <th className={`py-2 font-bold w-1/3 text-center`} style={{ color: '#059669' }}>ملاحظة</th>
                  <th className={`py-2 font-bold w-1/3 text-left`} style={{ color: '#059669' }}>المبلغ</th>
                </tr>
              </thead>
              <tbody>
                {transactions.filter(tx => tx.type === 'payment').map((tx, i) => (
                  <tr key={i} className="border-b" style={{ borderColor: '#f1f5f9' }}>
                    <td className={`py-2 sm:py-3`} style={{ color: '#475569' }}>{tx.date}</td>
                    <td className={`py-2 sm:py-3 text-center truncate max-w-[80px] sm:max-w-none`} style={{ color: '#475569' }}>{tx.notes || '---'}</td>
                    <td className={`py-2 sm:py-3 font-bold text-left`} dir="ltr" style={{ color: '#059669' }}>{formatCurrency(tx.amount)}</td>
                  </tr>
                ))}
                <tr className="border-b-2" style={{ borderColor: '#e2e8f0' }}>
                  <td colSpan={2} className={`py-3 sm:py-4 font-black text-center`} style={{ color: '#059669' }}>المجموع</td>
                  <td className={`py-3 sm:py-4 font-black text-left`} dir="ltr" style={{ color: '#059669' }}>{formatCurrency(totalPaid)}</td>
                </tr>
              </tbody>
            </table>
          </section>
        )}
      </div>

      {/* Final Balance Large Card */}
      <div className={`rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row justify-between items-center gap-2 mb-6 sm:mb-8`} style={{ backgroundColor: '#fff1f2', borderColor: '#fda4af', borderWidth: 1 }}>
        <div className={`flex items-center justify-center gap-2 font-black text-base sm:text-xl`} style={{ color: '#e11d48' }}>
           <span>⏳ الرصيد المستحق</span>
        </div>
        <div className={`text-2xl sm:text-3xl font-black`} dir="ltr" style={{ color: '#e11d48' }}>
          {formatCurrency(remainingDebt)}
        </div>
      </div>

      {reminder && (
        <div className="mt-8 p-4 rounded border-r-4" style={{ backgroundColor: '#fff1f2', borderColor: '#f43f5e', color: '#881337' }}>
          <h4 className="font-bold mb-1">ملاحظة:</h4>
          <p>{reminder}</p>
        </div>
      )}

      {/* Footer */}
      <div className="pt-4 border-t text-center text-xs" style={{ borderColor: '#e2e8f0', color: '#94a3b8' }}>
         {profile?.businessName || 'كنعان للخدمات البرية'} — للتوزيع والخدمات الميدانية المعتمدة • هاتف: {profile?.phone || '0958280936'} • {new Date().toLocaleDateString('ar-SA')}
      </div>
      </div>
      </div>
    </div>
  );
};
