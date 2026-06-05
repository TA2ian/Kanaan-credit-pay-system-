import React from 'react';
import { LayoutDashboard, Users, BellRing, Settings, BookOpen, Receipt, Server, Share2, Calculator } from 'lucide-react';

export function GuideTab() {
  return (
    <div className="space-y-6" dir="rtl">
      
      <div className="bg-gradient-to-r from-sky-900 to-indigo-900 rounded-2xl p-8 text-white shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20">
              <BookOpen className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black">دليل نظام كنعان</h2>
              <p className="text-sky-200 text-sm mt-1">تطبيق إدارة الحسابات والمناديب الذكي المصمم خصيصاً للميدان.</p>
            </div>
          </div>
        </div>
        <div className="absolute left-0 top-0 w-64 h-full bg-white/5 skew-x-12 -translate-x-32" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Section 1 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transition hover:shadow-md">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">لوحة التحكم والتحليلات</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                واجهة مركزية تقدم لك نظرة شاملة على نشاطك التجاري. تتيح لك متابعة إجمالي الديون المستحقة، والدفعات المحصلة، بالإضافة إلى عرض أحدث العمليات وأكثر العملاء مديونية لمساعدتك على اتخاذ قرارات سريعة.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transition hover:shadow-md">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">إدارة العملاء والدفعات</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                إضافة عدد لا محدود من الزبائن وتصنيفهم حسب المنطقة. يمكنك تسجيل عمليات البيع بالآجل (تسليم بضاعة) أو تحصيل الدفعات بكل سهولة وسرعة، مع عرض الرصيد المتبقي بشكل آلي ومحدث باستمرار.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transition hover:shadow-md">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">كشوفات الحساب والطباعة</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                تصميم احترافي لكشف الحساب يدعم تصدير وطباعة الفواتير بنمط A4 للشركات أو عبر طباعة الإيصال الحراري لتناسب طابعات البلوتوث المحمولة. مع تخصيص مدمج لإضافة شعار متجرك ليعكس هوية عملك.
              </p>
            </div>
          </div>
        </div>

        {/* Section 4 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transition hover:shadow-md">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">المساعد الذكي (AI) والتذكيرات الذكية</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                دعم مدمج بالذكاء الاصطناعي من Gemini لتحليل أرصدة الزبائن وصياغة رسائل للمطالبة بالسداد. يمكنك الآن <strong>بكبسة زر واحدة</strong> من لوحة التحكم النقر على العميل المتأخر ليقوم النظام تلقائياً بفتح صفحة التذكير وتشغيل الذكاء الاصطناعي لصياغة الرسالة المناسبة وإرسالها عبر الواتساب فوراً.
              </p>
            </div>
          </div>
        </div>

        {/* Section 5 */}
        <div className="bg-white p-6 rounded-2xl border border-blue-50/50 bg-blue-50/5 shadow-sm transition hover:shadow-md">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">التصنيفات التفاعلية للعملاء</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                تم دمج ميزة التصفية التفاعلية؛ حيث يمكنك تتبع حسابات العملاء وتوزيعهم بين (مسددين، ملتزمين، متأخرين) في الواجهة الرئيسية. بالنقر على أي تصنيف، سيتم توجيهك فورياً لتبويب العملاء وتفعيل الفلتر المطابق لمتابعة تلك الفئة المعينة بشكل سلس وبسيط.
              </p>
            </div>
          </div>
        </div>

        {/* Section 6 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transition hover:shadow-md">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">الحفظ السحابي والعمل دون إنترنت</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                النظام مصمم ليتحمل العمل في مناطق ضعف التغطية؛ يقوم بحفظ العمليات، وتتزامن البيانات تلقائياً مع السحابة فور عودة الشبكة ليضمن عدم ضياع أي قرش من مستحقاتك.
              </p>
            </div>
          </div>
        </div>

        {/* Section 7 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transition hover:shadow-md">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">تصدير واستيراد البيانات</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                من خلال تبويب "أدوات النظام"، يمكنك تصدير سجلاتك كاملة بصيغة JSON كنسخة احتياطية آمنة على جهازك لاسترجاعها في أي وقت دون الحاجة للاتصال بالإنترنت.
              </p>
            </div>
          </div>
        </div>

      </div>

      <div className="bg-sky-50 text-sky-800 p-6 rounded-2xl text-center border border-sky-100 mt-6">
         <h4 className="font-bold mb-2 flex items-center justify-center gap-2">
            <Calculator className="w-5 h-5" /> 
            نصيحة ميدانية
         </h4>
         <p className="text-sm max-w-2xl mx-auto opacity-90 leading-relaxed">
           احرص دائماً على إضافة تفاصيل البضاعة في خانة "البيان/الملاحظة" عند تسجيل عملية (تسليم بضاعة) ليتمكن العميل من مراجعة أصناف الفاتورة عند استلام كشف الحساب الخاص به لضمان الدقة والشفافية.
         </p>
      </div>

    </div>
  );
}
