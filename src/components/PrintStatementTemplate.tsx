import React, { useRef, useState } from 'react';
import { Customer, Transaction, CustomerBalance } from '../lib/db';
import { formatCurrency, formatPhoneNumberForUrl } from '../lib/utils';
import { Printer, Share2, FileText, Receipt, Download } from 'lucide-react';
// @ts-ignore
import html2pdf from 'html2pdf.js';

interface PrintStatementTemplateProps {
  balance: CustomerBalance;
  transactions: Transaction[];
  reminder: string;
}

export const PrintStatementTemplate: React.FC<PrintStatementTemplateProps> = ({ balance, transactions, reminder }) => {
  const { customer, totalDebt, totalPaid, remainingDebt } = balance;
  const [viewMode, setViewMode] = useState<'a4' | 'thermal'>('a4');
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const savedLogo = localStorage.getItem('company_logo');
    if (savedLogo) {
      setLogoBase64(savedLogo);
    }
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const downloadPdf = () => {
    if (!contentRef.current) return;
    const opt = {
      margin: 10,
      filename: `كشف حساب - ${customer.name}.pdf`,
      image: { type: 'jpeg' as 'jpeg', quality: 1 },
      html2canvas: { scale: 3, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as 'portrait' }
    };
    html2pdf().set(opt).from(contentRef.current).save();
  };

  const sendWhatsApp = async () => {
    const text = `💼 *كشف مالي معتمد - مجموعة كنعان الذكية* 🧾\n*العميل الكريم:* ${customer.name}\n*المنطقة / البلد:* ${customer.region || 'غير محددة'}\n*جوال:* ${customer.phone}\n-------------------------------------\n• الرصيد المطلوب كلياً ذمة: *$${remainingDebt.toLocaleString()}*\n• إجمالي المسحوبات (الدين): *$${totalDebt.toLocaleString()}*\n• إجمالي المدفوع الموثق: *$${totalPaid.toLocaleString()}*\n-------------------------------------\n📂 *المرفق المالي:* تم الآن إصدار وتنزيل كشف الحساب المالي التفصيلي كملف PDF رسمي موقع وموثق باسمكم، يرجى تفقده بالمرفقات. 🌾📎\n\nأخوكم عبدالرحمن كنعان لتوزيع الأغذية والمشروبات 🌾\nللاستعلام والطلب: 0958280936 📞${reminder ? `\n\nملاحظة: ${reminder}` : ''}`;
    
    if (!contentRef.current) return;

    try {
      const opt = {
          margin: 10,
          filename: `كشف حساب - ${customer.name}.pdf`,
          image: { type: 'jpeg' as 'jpeg', quality: 1 },
          html2canvas: { scale: 3, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as 'portrait' }
      };

      // Generate PDF
      const pdfBlob = await html2pdf().set(opt).from(contentRef.current).output('blob');
      const file = new File([pdfBlob], `كشف حساب - ${customer.name}.pdf`, { type: 'application/pdf' });

      // Try native Share API first (works on mobile, allows sending files + text directly to WhatsApp)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `كشف حساب ${customer.name}`,
          text: text,
        });
      } else {
        // Fallback for Desktop/Unsupported browsers: Download PDF and open WhatsApp web
        html2pdf().set(opt).from(contentRef.current).save();
        alert('تم تنزيل كشف الحساب كملف PDF يدعم اللغة العربية بالكامل.\nسيتم الآن فتح واتساب، يرجى إرسال الرسالة المعمول لها نسخ ثم إرفاق الملف المحمل يدوياً.');
        window.open(`https://wa.me/${formatPhoneNumberForUrl(customer.phone)}?text=${encodeURIComponent(text)}`, '_blank');
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return;
      }
      console.error('Error sharing:', error);
      alert('حدث خطأ أثناء محاولة المشاركة أو توليد الملف.');
    }
  };

  return (
    <div className="w-full overflow-x-auto bg-slate-100/50 p-2 sm:p-4 rounded-xl">
      <div className={viewMode === 'thermal' ? 'p-1 w-[58mm] min-w-[58mm] mx-auto text-[10px] bg-white text-right shadow-sm' : 'p-4 sm:p-8 w-full max-w-[650px] min-w-[320px] mx-auto bg-slate-50 text-right font-sans rounded-2xl shadow-sm'} dir="rtl">
        {/* Controls */}
        <div className="flex flex-wrap gap-2 mb-8 print:hidden justify-center bg-white border border-slate-200 p-3 rounded-xl shadow-xs sticky left-0 right-0">
        <button onClick={() => setViewMode(viewMode === 'a4' ? 'thermal' : 'a4')} className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm">
          {viewMode === 'a4' ? <Receipt className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
          {viewMode === 'a4' ? 'نص حراري' : 'A4 عرض'}
        </button>
        <button onClick={handlePrint} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm cursor-pointer">
          <Printer className="w-4 h-4" />
          طباعة
        </button>
        <button onClick={downloadPdf} className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm cursor-pointer">
          <Download className="w-4 h-4" />
          تنزيل PDF
        </button>
        <button onClick={sendWhatsApp} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm cursor-pointer">
          <Share2 className="w-4 h-4" />
          مشاركة واتساب
        </button>
      </div>

      <div ref={contentRef} className={`${viewMode === 'thermal' ? 'p-2' : 'p-4 sm:p-6'} rounded-xl shadow-sm`} dir="rtl" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderWidth: 1 }}>
        {/* Header */}
      <div className={`flex ${viewMode === 'thermal' ? 'flex-col text-center gap-4' : 'justify-between items-center'} mb-6 w-full`}>
        <div className={viewMode === 'thermal' ? 'text-center' : 'text-right'}>
          <h1 className={`${viewMode === 'thermal' ? 'text-xl' : 'text-2xl'} font-black mb-1 leading-tight`} style={{ color: '#1e40af' }}>كنعان</h1>
          <p className={`${viewMode === 'thermal' ? 'text-xs' : 'text-sm'} font-bold mb-1`} style={{ color: '#f97316' }}>مندوب مواد غذائية ومشروبات</p>
          <p className={`${viewMode === 'thermal' ? 'text-xs' : 'text-sm'}`} dir="ltr" style={{ textAlign: viewMode === 'thermal' ? "center" : "right", color: '#1e293b' }}>0958280936</p>
        </div>
        <div className="text-center flex-1">
          <h2 className={`${viewMode === 'thermal' ? 'text-xl' : 'text-3xl'} font-black mb-2`} style={{ color: '#1e40af' }}>كشف حساب</h2>
          <h3 className={`${viewMode === 'thermal' ? 'text-lg' : 'text-xl'} font-bold mb-1`} style={{ color: '#0f172a' }}>{customer.name}</h3>
          <p className={`${viewMode === 'thermal' ? 'text-[10px]' : 'text-sm'}`} style={{ color: '#64748b' }}>{new Date().toLocaleDateString('ar-SA')}</p>
        </div>
        <div className={`flex justify-center shrink-0 ${viewMode === 'thermal' ? 'w-full' : 'w-32 justify-end'}`}>
          <div className={`${viewMode === 'thermal' ? 'w-16 h-16' : 'w-24 h-24'} rounded-full overflow-hidden flex items-center justify-center shadow-sm`} style={{ border: '4px solid #D4AF37', backgroundColor: '#ffffff' }}>
             {logoBase64 ? (
               <img src={logoBase64} alt="شعار كنعان" className="w-full h-full object-cover" />
             ) : (
               <span className="text-xs font-bold px-2 text-center" style={{ color: 'rgba(30, 64, 175, 0.2)' }}>شعار</span>
             )}
          </div>
        </div>
      </div>
      <div className="border-b-4 mb-8 w-full" style={{ borderColor: '#1e40af' }}></div>

      {/* Summary Cards */}
      <div className={`flex ${viewMode === 'thermal' ? 'flex-col gap-2' : 'gap-4'} mb-8 justify-between w-full`}>
        <div className={`flex-1 p-3 rounded-xl shadow-sm flex flex-col justify-center min-h-[80px]`} style={{ backgroundColor: '#ffffff', borderColor: '#fda4af', borderWidth: 1 }}>
          <p className={`${viewMode === 'thermal' ? 'text-[10px]' : 'text-sm'} font-bold mb-2 flex items-center justify-center gap-2`} style={{ color: '#64748b' }}>الرصيد المستحق</p>
          <p className={`${viewMode === 'thermal' ? 'text-lg' : 'text-2xl'} font-black text-center`} style={{ color: '#e11d48' }}>{formatCurrency(remainingDebt)}</p>
          <p className={`text-center ${viewMode === 'thermal' ? 'text-[9px]' : 'text-xs'} font-bold mt-1`} style={{ color: '#475569' }}>⏳ مستحق</p>
        </div>
        <div className={`flex-1 p-3 rounded-xl shadow-sm flex flex-col justify-center min-h-[80px]`} style={{ backgroundColor: '#ffffff', borderColor: '#6ee7b7', borderWidth: 1 }}>
          <p className={`${viewMode === 'thermal' ? 'text-[10px]' : 'text-sm'} font-bold mb-2 text-center`} style={{ color: '#64748b' }}>إجمالي المسدّد</p>
          <p className={`${viewMode === 'thermal' ? 'text-lg' : 'text-2xl'} font-black text-center`} style={{ color: '#059669' }}>{formatCurrency(totalPaid)}</p>
          <p className={`text-center ${viewMode === 'thermal' ? 'text-[9px]' : 'text-xs'} font-bold mt-1`} style={{ color: '#64748b' }}>{transactions.filter(t => t.type === 'payment').length} دفعة</p>
        </div>
        <div className={`flex-1 p-3 rounded-xl shadow-sm flex flex-col justify-center min-h-[80px]`} style={{ backgroundColor: '#ffffff', borderColor: '#bfdbfe', borderWidth: 1 }}>
          <p className={`${viewMode === 'thermal' ? 'text-[10px]' : 'text-sm'} font-bold mb-2 text-center`} style={{ color: '#64748b' }}>إجمالي البضاعة</p>
          <p className={`${viewMode === 'thermal' ? 'text-lg' : 'text-2xl'} font-black text-center`} style={{ color: '#1e40af' }}>{formatCurrency(totalDebt)}</p>
          <p className={`text-center ${viewMode === 'thermal' ? 'text-[9px]' : 'text-xs'} font-bold mt-1`} style={{ color: '#64748b' }}>{transactions.filter(t => t.type === 'debt').length} تسليم</p>
        </div>
      </div>

      {/* Transactions */}
      <div className={`space-y-${viewMode === 'thermal' ? '4' : '8'} mb-8`}>
        <section>
          <h3 className={`${viewMode === 'thermal' ? 'text-xs' : 'text-lg'} font-bold mb-2 flex items-center gap-2`} style={{ color: '#1e40af' }}>🚚 التسليمات</h3>
          <table className={`w-full text-right ${viewMode === 'thermal' ? 'text-[9px]' : ''} border-collapse`}>
            <thead>
              <tr className="border-b-2" style={{ borderColor: '#e2e8f0' }}>
                <th className={`${viewMode === 'thermal' ? 'py-1' : 'py-2'} font-bold w-1/3`} style={{ color: '#1e40af' }}>التاريخ</th>
                <th className={`${viewMode === 'thermal' ? 'py-1' : 'py-2'} font-bold w-1/3 text-center`} style={{ color: '#1e40af' }}>البيان</th>
                <th className={`${viewMode === 'thermal' ? 'py-1' : 'py-2'} font-bold w-1/3 text-left`} style={{ color: '#1e40af' }}>المبلغ</th>
              </tr>
            </thead>
            <tbody>
              {transactions.filter(tx => tx.type === 'debt').map((tx, i) => (
                <tr key={i} className="border-b" style={{ borderColor: '#f1f5f9' }}>
                  <td className={`${viewMode === 'thermal' ? 'py-1' : 'py-3'}`} style={{ color: '#475569' }}>{tx.date}</td>
                  <td className={`${viewMode === 'thermal' ? 'py-1' : 'py-3'} text-center`} style={{ color: '#475569' }}>{tx.notes || '---'}</td>
                  <td className={`${viewMode === 'thermal' ? 'py-1' : 'py-3'} font-bold text-left`} dir="ltr" style={{ color: '#1e40af' }}>{formatCurrency(tx.amount)}</td>
                </tr>
              ))}
              <tr className="border-b-2" style={{ borderColor: '#e2e8f0' }}>
                <td colSpan={2} className={`${viewMode === 'thermal' ? 'py-2' : 'py-4'} font-black text-center`} style={{ color: '#1e40af' }}>المجموع</td>
                <td className={`${viewMode === 'thermal' ? 'py-2' : 'py-4'} font-black text-left`} dir="ltr" style={{ color: '#1e40af' }}>{formatCurrency(totalDebt)}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h3 className={`${viewMode === 'thermal' ? 'text-xs' : 'text-lg'} font-bold mb-2 flex items-center gap-2`} style={{ color: '#059669' }}>💵 الدفعات</h3>
          <table className={`w-full text-right ${viewMode === 'thermal' ? 'text-[9px]' : ''} border-collapse`}>
            <thead>
              <tr className="border-b-2" style={{ borderColor: '#e2e8f0' }}>
                <th className={`${viewMode === 'thermal' ? 'py-1' : 'py-2'} font-bold w-1/3`} style={{ color: '#059669' }}>التاريخ</th>
                <th className={`${viewMode === 'thermal' ? 'py-1' : 'py-2'} font-bold w-1/3 text-center`} style={{ color: '#059669' }}>ملاحظة</th>
                <th className={`${viewMode === 'thermal' ? 'py-1' : 'py-2'} font-bold w-1/3 text-left`} style={{ color: '#059669' }}>المبلغ</th>
              </tr>
            </thead>
            <tbody>
              {transactions.filter(tx => tx.type === 'payment').map((tx, i) => (
                <tr key={i} className="border-b" style={{ borderColor: '#f1f5f9' }}>
                  <td className={`${viewMode === 'thermal' ? 'py-1' : 'py-3'}`} style={{ color: '#475569' }}>{tx.date}</td>
                  <td className={`${viewMode === 'thermal' ? 'py-1' : 'py-3'} text-center`} style={{ color: '#475569' }}>{tx.notes || '---'}</td>
                  <td className={`${viewMode === 'thermal' ? 'py-1' : 'py-3'} font-bold text-left`} dir="ltr" style={{ color: '#059669' }}>{formatCurrency(tx.amount)}</td>
                </tr>
              ))}
              <tr className="border-b-2" style={{ borderColor: '#e2e8f0' }}>
                <td colSpan={2} className={`${viewMode === 'thermal' ? 'py-2' : 'py-4'} font-black text-center`} style={{ color: '#059669' }}>المجموع</td>
                <td className={`${viewMode === 'thermal' ? 'py-2' : 'py-4'} font-black text-left`} dir="ltr" style={{ color: '#059669' }}>{formatCurrency(totalPaid)}</td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>

      {/* Final Balance Large Card */}
      <div className={`rounded-xl ${viewMode === 'thermal' ? 'p-2 flex-col gap-2 justify-center text-center' : 'p-4 flex justify-between items-center'} mb-8`} style={{ backgroundColor: '#fff1f2', borderColor: '#fda4af', borderWidth: 1 }}>
        <div className={`flex items-center justify-center gap-2 font-black ${viewMode === 'thermal' ? 'text-[10px]' : 'text-xl'}`} style={{ color: '#e11d48' }}>
           <span>⏳ الرصيد المستحق</span>
        </div>
        <div className={`${viewMode === 'thermal' ? 'text-lg' : 'text-3xl'} font-black`} dir="ltr" style={{ color: '#e11d48' }}>
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
         كنعان — مندوب مواد غذائية ومشروبات • {new Date().toLocaleDateString('ar-SA')}
      </div>
      </div>
      </div>
    </div>
  );
};
