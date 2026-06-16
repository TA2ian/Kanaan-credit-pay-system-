import React from 'react';
import { LayoutDashboard, Users, BellRing, Settings, BookOpen, Receipt, Server, Share2, Calculator, Key, Sparkles } from 'lucide-react';

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
                من خلال تبويب "أدوات النظام"، يمكنك تصدير سجلاتك كاملة بصيغة JSON كنسخة احتياطية آمنة على جهازك لاسترجاعها في أي وقت، مع واجهة ذكية تدعم السحب والإفلات ومعاينة البيانات قبل تنزيلها.
              </p>
            </div>
          </div>
        </div>

        {/* Section 8: Brand & Logo Customization */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transition hover:shadow-md">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
              <Receipt className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">تخصيص هوية المحل وهيدر الفواتير</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                يتيح لك النظام رفع أو سحب شعار خاص بمحلك التجاري من شاشة "أدوات النظام". يتم تخزينه بالكامل محلياً على المتصفح ليظهر تلقائياً مدمجاً في أعلى كشوفات الحساب المطبوعة والفواتير لتعزيز طابعك المهني.
              </p>
            </div>
          </div>
        </div>

        {/* Section 9: Network Simulator */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transition hover:shadow-md">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
              <Server className="w-5 h-5 text-teal-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">أداة محاكاة الشبكة بالميدان</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                بفضل مفتاح المحاكاة الذكي المتوفر في شاشة الإعدادات، يمكنك الآن إجبار النظام على الدخول في وضعية "عدم الاتصال" يدوياً لاختبار سلوك العمل والتأكد من مرونة حفظ العمليات وقدرة التزامن السحابي عند إعادة الاتصال.
              </p>
            </div>
          </div>
        </div>

        {/* Section 10: Gemini API Key Setup */}
        <div className="bg-gradient-to-br from-indigo-50/60 to-slate-50 border border-indigo-100/60 p-6 rounded-2xl shadow-sm transition hover:shadow-md col-span-1 md:col-span-2">
          <div className="flex flex-col md:flex-row items-start gap-5">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-100">
              <Key className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-4 flex-1">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-1.5">
                  تفعيل مفتاح Gemini AI مخصص وفك الارتباط
                  <Sparkles className="w-4 h-4 text-indigo-500 animate-bounce" />
                </h3>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                  يتيح لك نظام كنعان الميداني ربط مفتاح API مخصص أو استخدام عنوان بوابة اتصال بديلة لتوليد رسائل التذكير المالي وتحليل أرصدة الزبائن ذاتياً ومجاناً، مع إمكانية إزالة هذا الربط بالكامل للعودة إلى الاتصال الافتراضي في أي وقت.
                </p>
              </div>

              <div className="bg-white border border-slate-200/50 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-700">خطوات الحصول على مفتاح Gemini API وتفعيله بالنظام:</h4>
                <ol className="text-xs text-slate-600 space-y-2.5 list-decimal list-inside leading-relaxed pr-2">
                  <li>
                    <strong>الذهاب لمنصة Google AI Studio:</strong> قم بزيارتنا عبر الرابط الرسمي <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-bold hover:underline">aistudio.google.com</a> وسجل الدخول بحساب الجيميل الخاص بك.
                  </li>
                  <li>
                    <strong>الحصول على المفتاح:</strong> اضغط على زر <span className="font-bold text-slate-800">"Create API Key"</span> الموجود في القائمة الجانبية أو أعلى الصفحة.
                  </li>
                  <li>
                    <strong>توليد ونسخ الكود:</strong> اختر الخيار <span className="font-bold text-indigo-600">"Create API key in new project"</span> لتوليد المفتاح المجاني، ثم انسخ الكود الناتج (والذي يبدأ عادة بـ <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-750 font-mono">AIzaSy...</code>).
                  </li>
                  <li>
                    <strong>حفظ المفتاح بالتطبيق:</strong> توجه لتبويب <span className="font-bold text-slate-800">"أدوات النظام"</span> في كنعان الميداني، الصق الكود في حقل "مفتاح Gemini API" واضغط على <span className="font-bold text-indigo-600">"حفظ إعدادات الـ API"</span>.
                  </li>
                </ol>
              </div>

              <div className="bg-slate-100/60 border border-slate-200/20 rounded-xl p-3 text-xs text-slate-500 leading-relaxed flex items-start gap-2">
                <span className="text-amber-500 font-black text-sm">💡</span>
                <p>
                  <strong>التحكم والوقاية:</strong> إذا كنت ترغب في فك الارتباط لاحقاً، يمكنك التصفح مجدداً لأدوات النظام والضغط على زر <span className="font-bold text-rose-600">"فك ربط وحذف مفتاحي"</span> لتنظيف متصفحك فوراً. كما يمكنك تعزيز خصوصيتك عبر تفعيل ميزة <span className="font-bold text-slate-800">"تعطيل استخدام مفتاح الـ API الافتراضي للموقع"</span> للتأكد من عدم استخدام أي استهلاك غير مشفر خارج رغبتك.
                </p>
              </div>
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
