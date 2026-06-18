import React, { useRef, useState, useEffect } from 'react';
import { Customer, Transaction, CustomerBalance } from '../lib/db';
import { formatCurrency, formatPhoneNumberForUrl, triggerHaptic } from '../lib/utils';
import { usePopup } from '../lib/PopupContext';
import { useFirebase } from '../lib/FirebaseContext';
import { ArrowRight, Share2, Loader2, Printer } from 'lucide-react';
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
  paperSize?: 'A4' | '80mm' | '58mm';
}

export const PrintStatementTemplate: React.FC<PrintStatementTemplateProps> = ({ 
  balance, 
  transactions, 
  archivedTransactions, 
  reminder, 
  onClose,
  hidePayments = false,
  hideWithdrawals = false,
  paperSize = '80mm'
}) => {
  const { customer, totalDebt, totalPaid, remainingDebt } = balance;
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

  // Handle native printer triggered via dynamic CSS page sizes
  const handleNativePrint = () => {
    triggerHaptic('light');

    // Remove any existing dynamic print styles
    const existing = document.getElementById('dynamic-print-styles');
    if (existing) existing.remove();

    let styleContent = '';
    
    if (paperSize === '80mm') {
      styleContent = `
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            width: 80mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #print-overlay {
            background: white !important;
            width: 80mm !important;
            max-width: 80mm !important;
            padding: 0 !important;
            margin: 0 !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            visibility: visible !important;
          }
          /* Ensure that only our target printed wrapper is visible */
          #print-overlay, #print-overlay * {
            visibility: visible !important;
          }
        }
      `;
    } else if (paperSize === '58mm') {
      styleContent = `
        @media print {
          @page {
            size: 58mm auto;
            margin: 0;
          }
          body {
            width: 58mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #print-overlay {
            background: white !important;
            width: 58mm !important;
            max-width: 58mm !important;
            padding: 0 !important;
            margin: 0 !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            visibility: visible !important;
          }
          #print-overlay, #print-overlay * {
            visibility: visible !important;
          }
        }
      `;
    } else {
      styleContent = `
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm;
          }
          body {
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #print-overlay {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          #print-overlay, #print-overlay * {
            visibility: visible !important;
          }
        }
      `;
    }

    const style = document.createElement('style');
    style.id = 'dynamic-print-styles';
    style.innerHTML = styleContent;
    document.head.appendChild(style);

    // Give browser a short buffer to compute page dimensions then trigger print
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const generatePdfBlob = async () => {
    if (!contentRef.current) return null;
    
    try {
      const isThermal = paperSize === '80mm' || paperSize === '58mm';
      const opt = {
        margin: isThermal ? 4 : 15,
        filename: `كشف حساب - ${customer.name}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2.2, 
          useCORS: true,
          logging: false,
          scrollY: 0,
          scrollX: 0
        },
        jsPDF: { 
          unit: 'mm', 
          format: paperSize === '58mm' ? [58, 200] : paperSize === '80mm' ? [80, 240] : 'a4', 
          orientation: 'portrait' 
        }
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
    triggerHaptic('light');

    const busName = profile?.businessName || 'مجموعة كنعان الذكية';
    const delName = profile?.delegateName || 'عبدالرحمن كنعان';
    const delPhone = profile?.phone || '0958280936';

    const text = `💼 *كشف مالي معتمد - ${busName}* 🧾\n*العميل الكريم:* ${customer.name}\n*المنطقة / البلد:* ${customer.region || 'غير محددة'}\n*جوال:* ${customer.phone}\n-------------------------------------\n• الرصيد المطلوب كلياً ذمة: *${formatCurrency(remainingDebt)}*\n• إجمالي المسحوبات (الدين): *${formatCurrency(totalDebt)}*\n• إجمالي المدفوع الموثق: *${formatCurrency(totalPaid)}*\n-------------------------------------\nأخوكم ${delName} لتوزيع الأغذية والمشروبات 🌾\nللاستعلام والطلب: ${delPhone} 📞${reminder ? `\n\nملاحظة: ${reminder}` : ''}`;
    
    try {
      const pdfBlob = await generatePdfBlob();
      
      if (!pdfBlob) {
        triggerHaptic('warning');
        window.open(`https://wa.me/${formatPhoneNumberForUrl(customer.phone)}?text=${encodeURIComponent(text)}`, '_blank');
        return;
      }
      
      const file = new File([pdfBlob], `كشف حساب - ${customer.name}.pdf`, { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          triggerHaptic('success');
          await navigator.share({
            files: [file],
            title: `كشف حساب ${customer.name}`
          });
        } catch (shareError: any) {
          if (shareError.name === 'AbortError') return;
          throw shareError;
        }
      } else {
        const fileURL = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = fileURL;
        link.download = `كشف حساب - ${customer.name}.pdf`;
        link.click();
        URL.revokeObjectURL(fileURL);

        triggerHaptic('success');
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
      triggerHaptic('warning');
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

  const is80mm = paperSize === '80mm';
  const is58mm = paperSize === '58mm';
  const isThermal = is80mm || is58mm;

  return (
    <div className="w-full flex flex-col items-center pt-4 sm:pt-8 print:p-0">
      {/* Controls Container (Hidden during actual print) */}
      <div className="w-full max-w-2xl flex flex-wrap items-center gap-2 mb-6 sm:mb-8 px-4 print:hidden">
        {onClose && (
          <button 
            type="button" 
            onClick={onClose} 
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2 rounded-xl text-sm font-bold shadow-sm cursor-pointer transition"
          >
            <ArrowRight className="w-4 h-4" />
            تراجع وإغلاق
          </button>
        )}
        
        <button 
          type="button" 
          onClick={handleNativePrint} 
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm cursor-pointer transition leading-none"
        >
          <Printer className="w-4 h-4" />
          طباعة حرارية فورية
        </button>

        <button 
          type="button" 
          onClick={sendWhatsApp} 
          disabled={isGenerating} 
          className={`flex items-center gap-2 ${isGenerating ? 'bg-emerald-400' : 'bg-emerald-600 hover:bg-emerald-700'} text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm cursor-pointer transition mr-auto leading-none`}
        >
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
          {isGenerating ? "جاري التجهيز..." : "تصدير PDF ومشاركة"}
        </button>
      </div>

      {/* Printable Area Wrapper */}
      <div className="w-full flex justify-center print:block print:w-full" dir="rtl">
        {isThermal ? (
          /* ======================================================== */
          /* THERMAL POS RECEIPTS LAYOUT                             */
          /* ======================================================== */
          <div 
            id="pdf-content-wrapper" 
            ref={contentRef} 
            className={`bg-white text-black text-right mx-auto font-mono select-none antialiased ${
              is58mm 
                ? 'w-[210px] p-1.5 text-[9px] leading-tight print:w-[58mm] print:max-w-[58mm] print:p-0' 
                : 'w-[300px] p-3 text-xs leading-normal print:w-[80mm] print:max-w-[80mm] print:p-0'
            }`}
          >
            {/* Stamp Logo Or Business Name */}
            <div className="text-center pt-2 pb-1">
              <div className="flex justify-center mb-1">
                <div className="w-12 h-12 rounded-full border-2 border-dashed border-black flex items-center justify-center p-0.5" style={{ minWidth: '48px', minHeight: '48px' }}>
                  {logoBase64 ? (
                    <img src={logoBase64} alt="لوجو كنعان" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <span className="text-[9px] font-bold">كنعان</span>
                  )}
                </div>
              </div>
              <h1 className="text-sm font-black uppercase tracking-tight">{profile?.businessName || 'مجموعة كنعان'}</h1>
              <p className="text-[9px] font-bold text-slate-700">{profile?.businessDesc || 'لتوزيع الأغذية والخدمات الميدانية'}</p>
              <p className="text-[9px] font-semibold" dir="ltr">{profile?.phone || '0958280936'}</p>
            </div>

            {/* Divider */}
            <div className="border-t border-dashed border-black my-1.5" />

            {/* Receipt Info */}
            <div className={`space-y-0.5 ${is58mm ? 'text-[8.5px]' : 'text-[10px]'}`}>
              <div className="flex justify-between">
                <span className="font-bold">كشف حساب مالي:</span>
                <span className="font-bold">#POS-{Date.now().toString().slice(-5)}</span>
              </div>
              <div className="flex justify-between">
                <span>العميل الموثق:</span>
                <span className="font-black">{customer.name}</span>
              </div>
              {customer.phone && (
                <div className="flex justify-between">
                  <span>هاتف العميل:</span>
                  <span className="font-semibold">{customer.phone}</span>
                </div>
              )}
              {customer.region && (
                <div className="flex justify-between">
                  <span>منطقة العميل:</span>
                  <span className="font-semibold">{customer.region}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>التاريخ والوقت:</span>
                <span>{new Date().toLocaleString('ar-SA')}</span>
              </div>
              {profile?.delegateName && (
                <div className="flex justify-between">
                  <span>المندوب الميداني:</span>
                  <span>{profile.delegateName}</span>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-dashed border-black my-2" />

            {/* Transactions Section */}
            <div>
              <h2 className="text-center font-black pb-1 uppercase tracking-wider underline">سجل الحركات الميدانية</h2>
              
              {is58mm ? (
                /* Compact Stack Layout for 58mm POS */
                <div className="space-y-1 my-1">
                  {filteredTransactions.map((tx, idx) => (
                    <div key={idx} className="border-b border-dotted border-slate-300 pb-1 flex justify-between items-start">
                      <div className="flex flex-col text-right max-w-[130px]">
                        <span className="text-[8px] text-slate-500">{tx.date}</span>
                        <span className="font-bold break-all">
                          {tx.type === 'payment' ? '💵 سداد دفعة' : '🚚 دين جديد'} 
                          {tx.notes ? ` (${tx.notes})` : ''}
                        </span>
                      </div>
                      <span className="font-black whitespace-nowrap pt-1">
                        {tx.type === 'payment' ? '-' : '+'}{formatCurrency(tx.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                /* Wide Condensed Column Layout for 80mm POS */
                <table className="w-full text-right text-[10px] border-collapse">
                  <thead>
                    <tr className="border-b border-dashed border-black">
                      <th className="py-1 font-black w-1/4">التاريخ</th>
                      <th className="py-1 font-black w-2/4 text-center">البيان/الحركة</th>
                      <th className="py-1 font-black w-1/4 text-left">المبلغ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((tx, idx) => (
                      <tr key={idx} className="border-b border-dotted border-slate-200">
                        <td className="py-1.5">{tx.date}</td>
                        <td className="py-1.5 text-center truncate max-w-[120px]">
                          {tx.type === 'payment' ? '💵 سداد دفعة' : '🚚 دين جديد'} 
                          {tx.notes ? ` - ${tx.notes}` : ''}
                        </td>
                        <td className="py-1.5 font-bold text-left whitespace-nowrap">
                          {tx.type === 'payment' ? '-' : ''}{formatCurrency(tx.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-dashed border-black my-2" />

            {/* Mini Summary */}
            <div className="space-y-1">
              {!hideWithdrawals && (
                <div className="flex justify-between">
                  <span>إجمالي تسليمات البضائع:</span>
                  <span className="font-bold">{formatCurrency(totalDebt)}</span>
                </div>
              )}
              {!hidePayments && (
                <div className="flex justify-between">
                  <span>إجمالي المدفوعات المسددة:</span>
                  <span className="font-bold text-emerald-700">{formatCurrency(totalPaid)}</span>
                </div>
              )}
              
              {/* Grand Holy POS Total */}
              <div className="border border-black p-1.5 font-black text-center mt-2 space-y-0.5">
                <span className="text-[10px] block">⏳ الرصيد المطلوب كلياً ذمة</span>
                <span className="text-sm block" dir="ltr">{formatCurrency(remainingDebt)}</span>
              </div>
            </div>

            {reminder && (
              <div className="mt-2.5 p-1.5 border border-dashed border-slate-800 text-center text-[8.5px]">
                <span className="font-black block text-slate-800 underline">📝 ملاحظة مرافقة:</span>
                <p className="leading-tight mt-0.5 break-words">{reminder}</p>
              </div>
            )}

            {/* Barcode/QR Mock Stamp */}
            <div className="text-center pt-4 pb-2 space-y-1">
              <p className="text-[7.5px] text-slate-600 block leading-tight">
                === فاتورة ذمة إلكترونية معتمدة كنعان ===
              </p>
              <div className="flex justify-center my-1.5 font-mono text-[9px] tracking-widest text-slate-800">
                |||||||| | | |||||||| ||||||| ||||||| ||
              </div>
              <p className="text-[8px] font-bold text-slate-700">شكراً لتعاملكم الموثوق معنا 🌾</p>
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* STANDARD A4 OFFICE BILLING LAYOUT                         */
          /* ======================================================== */
          <div 
            id="pdf-content-wrapper" 
            ref={contentRef} 
            className="w-full max-w-[750px] min-w-[320px] mx-auto p-4 sm:p-8 text-sm sm:text-base border print:border-none print:p-0 print:m-0 print:max-w-none print:w-full" 
            style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#e2e8f0' }}
          >
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
                <h2 className="text-base sm:text-xl font-black mb-0.5" style={{ color: '#1e40af' }}>كشف حساب معتمد</h2>
                <h3 className="text-xs sm:text-sm font-bold block leading-normal py-0.5" style={{ color: '#0f172a' }}>{customer.name}</h3>
                <p className="text-[9px] sm:text-xs font-semibold mt-0.5" style={{ color: '#64748b' }}>{new Date().toLocaleDateString('ar-SA')}</p>
              </div>
              
              {/* Left Section: Company Logo */}
              <div className="flex justify-end items-center">
                <div style={{ width: '64px', height: '64px', minWidth: '64px', minHeight: '64px', border: '3px solid #D4AF37', backgroundColor: '#ffffff', flexShrink: 0 }} className="rounded-full overflow-hidden flex items-center justify-center shadow-sm font-mono">
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
              <div className={`p-2.5 rounded-xl flex flex-col justify-center min-h-[55px] sm:min-h-[65px]`} style={{ backgroundColor: '#ffffff', borderColor: '#fda4af', borderWidth: 1 }}>
                <p className={`text-[10px] sm:text-xs font-bold mb-1 flex items-center justify-center gap-1`} style={{ color: '#64748b' }}>الرصيد المطلوب النهائي</p>
                <p className={`text-sm sm:text-lg font-black text-center`} style={{ color: '#e11d48' }}>{formatCurrency(remainingDebt)}</p>
                <p className={`text-center text-[9px] sm:text-[10px] font-bold mt-0.5`} style={{ color: '#475569' }}>⏳ مستحق للتحصيل</p>
              </div>
              
              {!hidePayments && (
                <div className={`p-2.5 rounded-xl flex flex-col justify-center min-h-[55px] sm:min-h-[65px]`} style={{ backgroundColor: '#ffffff', borderColor: '#6ee7b7', borderWidth: 1 }}>
                  <p className={`text-[10px] sm:text-xs font-bold mb-1 text-center`} style={{ color: '#64748b' }}>إجمالي الدفعات المسددة</p>
                  <p className={`text-sm sm:text-lg font-black text-center`} style={{ color: '#059669' }}>{formatCurrency(totalPaid)}</p>
                  <p className={`text-center text-[9px] sm:text-[10px] font-bold mt-0.5`} style={{ color: '#64748b' }}>{transactions.filter(t => t.type === 'payment').length} حركة قبض</p>
                </div>
              )}

              {!hideWithdrawals && (
                <div className={`p-2.5 rounded-xl flex flex-col justify-center min-h-[55px] sm:min-h-[65px]`} style={{ backgroundColor: '#ffffff', borderColor: '#bfdbfe', borderWidth: 1 }}>
                  <p className={`text-[10px] sm:text-xs font-bold mb-1 text-center`} style={{ color: '#64748b' }}>إجمالي مسحوبات البضاعة</p>
                  <p className={`text-sm sm:text-lg font-black text-center`} style={{ color: '#1e40af' }}>{formatCurrency(totalDebt)}</p>
                  <p className={`text-center text-[9px] sm:text-[10px] font-bold mt-0.5`} style={{ color: '#64748b' }}>{transactions.filter(t => t.type === 'debt').length} حركة تسليم</p>
                </div>
              )}
            </div>
            
            {/* Transactions lists */}
            <div className={`space-y-6 sm:space-y-8 mb-6 sm:mb-8`}>
              {!hideWithdrawals && (
                <section>
                  <h3 className={`text-base sm:text-lg font-bold mb-2 flex items-center gap-2`} style={{ color: '#1e40af' }}>🚚 التسليمات (الدين)</h3>
                  <table className={`w-full text-right text-xs sm:text-sm border-collapse`}>
                    <thead>
                      <tr className="border-b-2" style={{ borderColor: '#e2e8f0' }}>
                        <th className={`py-2 font-bold w-1/3`} style={{ color: '#1e40af' }}>التاريخ</th>
                        <th className={`py-2 font-bold w-1/3 text-center`} style={{ color: '#1e40af' }}>البيان والملاحظات</th>
                        <th className={`py-2 font-bold w-1/3 text-left`} style={{ color: '#1e40af' }}>المبلغ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.filter(tx => tx.type === 'debt').map((tx, i) => (
                        <tr key={i} className="border-b animate-slide-up" style={{ borderColor: '#f1f5f9' }}>
                          <td className={`py-2 sm:py-3`} style={{ color: '#475569' }}>{tx.date}</td>
                          <td className={`py-2 sm:py-3 text-center truncate max-w-[120px] sm:max-w-none`} style={{ color: '#475569' }}>{tx.notes || '---'}</td>
                          <td className={`py-2 sm:py-3 font-bold text-left`} dir="ltr" style={{ color: '#1e40af' }}>{formatCurrency(tx.amount)}</td>
                        </tr>
                      ))}
                      <tr className="border-b-2" style={{ borderColor: '#e2e8f0' }}>
                        <td colSpan={2} className={`py-3 sm:py-4 font-black text-center`} style={{ color: '#1e40af' }}>المجموع الكلي للمسحوبات</td>
                        <td className={`py-3 sm:py-4 font-black text-left`} dir="ltr" style={{ color: '#1e40af' }}>{formatCurrency(totalDebt)}</td>
                      </tr>
                    </tbody>
                  </table>
                </section>
              )}

              {!hidePayments && (
                <section>
                  <h3 className={`text-base sm:text-lg font-bold mb-2 flex items-center gap-2`} style={{ color: '#059669' }}>💵 الدفعات والتحصيل</h3>
                  <table className={`w-full text-right text-xs sm:text-sm border-collapse`}>
                    <thead>
                      <tr className="border-b-2" style={{ borderColor: '#e2e8f0' }}>
                        <th className={`py-2 font-bold w-1/3`} style={{ color: '#059669' }}>التاريخ</th>
                        <th className={`py-2 font-bold w-1/3 text-center`} style={{ color: '#059669' }}>البيان وملاحظات التسجيل</th>
                        <th className={`py-2 font-bold w-1/3 text-left`} style={{ color: '#059669' }}>المبلغ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.filter(tx => tx.type === 'payment').map((tx, i) => (
                        <tr key={i} className="border-b animate-slide-up" style={{ borderColor: '#f1f5f9' }}>
                          <td className={`py-2 sm:py-3`} style={{ color: '#475569' }}>{tx.date}</td>
                          <td className={`py-2 sm:py-3 text-center truncate max-w-[100px] sm:max-w-none`} style={{ color: '#475569' }}>{tx.notes || '---'}</td>
                          <td className={`py-2 sm:py-3 font-bold text-left`} dir="ltr" style={{ color: '#059669' }}>{formatCurrency(tx.amount)}</td>
                        </tr>
                      ))}
                      <tr className="border-b-2" style={{ borderColor: '#e2e8f0' }}>
                        <td colSpan={2} className={`py-3 sm:py-4 font-black text-center`} style={{ color: '#059669' }}>إجمالي التحصيل الفعلي</td>
                        <td className={`py-3 sm:py-4 font-black text-left`} dir="ltr" style={{ color: '#059669' }}>{formatCurrency(totalPaid)}</td>
                      </tr>
                    </tbody>
                  </table>
                </section>
              )}
            </div>

            {/* Final Balance Large Card */}
            <div className={`rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-2 mb-6 sm:mb-8`} style={{ backgroundColor: '#fff1f2', borderColor: '#fda4af', borderWidth: 1 }}>
              <div className={`flex items-center justify-center gap-2 font-black text-base sm:text-xl`} style={{ color: '#e11d48' }}>
                 <span>⏳ الرصيد المستحق النهائي المطلوب سداده</span>
              </div>
              <div className={`text-2xl sm:text-3xl font-black`} dir="ltr" style={{ color: '#e11d48' }}>
                {formatCurrency(remainingDebt)}
              </div>
            </div>

            {reminder && (
              <div className="mt-8 p-4 rounded-xl border-r-4 animate-slide-up" style={{ backgroundColor: '#fff1f2', borderColor: '#f43f5e', color: '#881337' }}>
                <h4 className="font-bold mb-1">تنبيه وملاحظة هامة:</h4>
                <p>{reminder}</p>
              </div>
            )}

            {/* Footer */}
            <div className="pt-4 border-t text-center text-xs" style={{ borderColor: '#e2e8f0', color: '#94a3b8' }}>
               {profile?.businessName || 'مجموعة كنعان'} — المندوب: {profile?.delegateName || 'عبدالرحمن كنعان'} ({profile?.phone || '0958280936'}) • {profile?.copyrightText || 'حقوق الحسابات والنظام محفوظة تلقائياً'} • كشف معتمد تلقائياً برقم #POS-{Date.now().toString().slice(-5)} • {new Date().toLocaleDateString('ar-SA')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
