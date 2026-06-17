/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DatabaseState, computeFinancialSummary, getCustomerBalances } from '../lib/db';
import { formatCurrency } from '../lib/utils';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  CalendarDays,
  Activity,
  PieChart as PieIcon
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  AreaChart, 
  Area,
  PieChart as RechartsPieChart, 
  Pie, 
  Cell
} from 'recharts';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';


interface DashboardTabProps {
  db: DatabaseState;
  onSelectCustomer: (customerId: string) => void;
}

export function DashboardTab({ db, onSelectCustomer }: DashboardTabProps) {
  const navigate = useNavigate();
  
  // Memoize all heavy operations and chart calculations to prevent unnecessary re-renders
  const { 
    summary, 
    balances, 
    topDebtors, 
    sortedTxs, 
    collectionRate, 
    chartFlowData, 
    pieData,
    settledCount,
    activeDebtorsCount,
    overdueDebtorsCount
  } = React.useMemo(() => {
    const s = computeFinancialSummary(db);
    const b = getCustomerBalances(db);
    
    // Sort customers to find top debtors (non-zero balance and descending)
    const top = [...b]
      .filter(x => x.remainingDebt > 0)
      .sort((a, x) => x.remainingDebt - a.remainingDebt)
      .slice(0, 5);

    // Get last 5 transactions
    const txs = [...db.transactions]
      .sort((a, x) => x.id.localeCompare(a.id))
      .slice(0, 5);

    // Calculate debt collection percentage
    const rate = s.grandTotalDebt > 0 
      ? Math.round((s.grandTotalPaid / s.grandTotalDebt) * 100) 
      : 100;

    // -- Chart Data Prep 1: Debt vs Repayments dates grouped --
    const dateMap: { [date: string]: { date: string, debt: number, payment: number } } = {};
    const sortedTxsForChart = [...db.transactions].sort((a, x) => a.date.localeCompare(x.date));
    
    sortedTxsForChart.forEach(tx => {
      const rawDate = tx.date;
      // Format date string from YYYY-MM-DD to MM-DD for nicer chart labeling
      const parts = rawDate.split('-');
      const label = parts.length === 3 ? `${parts[1]}-${parts[2]}` : rawDate;

      if (!dateMap[label]) {
        dateMap[label] = { date: label, debt: 0, payment: 0 };
      }
      if (tx.type === 'debt') {
        dateMap[label].debt += tx.amount;
      } else {
        dateMap[label].payment += tx.amount;
      }
    });

    let flowData = Object.values(dateMap).slice(-8); // display last 8 entries
    if (flowData.length === 0) {
      flowData = [
        { date: '05-11', debt: 4500, payment: 0 },
        { date: '05-16', debt: 1200, payment: 0 },
        { date: '05-21', debt: 15000, payment: 0 },
        { date: '05-25', debt: 0, payment: 2000 },
        { date: '05-28', debt: 0, payment: 8500 },
        { date: '06-01', debt: 3000, payment: 3000 },
      ];
    }

    // -- Chart Data Prep 2: Pie Segments --
    const settled = b.filter(x => x.remainingDebt === 0).length;
    const activeDebtors = b.filter(x => x.remainingDebt > 0 && !x.isOverdue).length;
    const overdueDebtors = b.filter(x => x.remainingDebt > 0 && x.isOverdue).length;

    const pData = [
      { name: 'عملاء مسددين بالكامل', value: settled || 1, color: '#10b981' },
      { name: 'مدينين ملتزمين بالوقت', value: activeDebtors || 1, color: '#4f46e5' },
      { name: 'متأخرين عن السداد', value: overdueDebtors || 1, color: '#f59e0b' }
    ];

    return {
      summary: s,
      balances: b,
      topDebtors: top,
      sortedTxs: txs,
      collectionRate: rate,
      chartFlowData: flowData,
      pieData: pData,
      settledCount: settled,
      activeDebtorsCount: activeDebtors,
      overdueDebtorsCount: overdueDebtors
    };
  }, [db.customers, db.transactions]);

  const overdueBalances = React.useMemo(() => {
    return balances.filter(b => b.isOverdue && b.remainingDebt > 0);
  }, [balances]);

  return (
    <div className="space-y-6">
      
      {/* 1. Quick Financial Stats Board */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Main Financial Flow Segment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Metric Card 1: Total outstanding */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            whileHover={{ y: -3, transition: { duration: 0.12 } }}
            style={{ willChange: 'transform, opacity' }}
            className="p-5 bg-white rounded-2xl border border-slate-100 shadow-2xs hover:shadow-xs flex items-center justify-between transition-shadow duration-200"
          >
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-500">إجمالي الديون المعلقة</span>
              <h4 className="text-2xl font-black text-rose-600">{formatCurrency(summary.grandTotalRemaining)}</h4>
              <p className="text-[10px] text-slate-400">مجموع المتبقي بذمّة كافة العملاء</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0 transition-colors">
              <DollarSign className="w-6 h-6 shrink-0" />
            </div>
          </motion.div>

          {/* Metric Card 2: Total paid */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            whileHover={{ y: -3, transition: { duration: 0.12 } }}
            style={{ willChange: 'transform, opacity' }}
            className="p-5 bg-white rounded-2xl border border-slate-100 shadow-2xs hover:shadow-xs flex items-center justify-between transition-all duration-200"
          >
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-500">إجمالي السداد المحصل</span>
              <h4 className="text-2xl font-black text-emerald-600">{formatCurrency(summary.grandTotalPaid)}</h4>
              <p className="text-[10px] text-emerald-500 font-bold">معدل تحصيل {collectionRate}%</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 transition-colors">
              <CheckCircle2 className="w-6 h-6 shrink-0" />
            </div>
          </motion.div>
        </div>

        {/* Collection & Customer Ledger Segment (Paired Side-by-Side Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card 3: Active debtors (Modern styled) */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            whileHover={{ y: -3, transition: { duration: 0.12 } }}
            style={{ willChange: 'transform, opacity' }}
            onClick={() => navigate('/customers')}
            title="الانتقال إلى قسم العملاء"
            className="p-5 bg-indigo-50/25 rounded-2xl border border-indigo-100/70 shadow-2xs hover:shadow-xs hover:border-indigo-300 flex items-center justify-between transition-all duration-200 relative overflow-hidden group cursor-pointer"
          >
            <div className="space-y-2 z-10 text-right">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-xs font-bold text-indigo-950/70">العملاء المدينون حالياً</span>
              </div>
              <div>
                <h4 className="text-2xl font-black text-indigo-950">
                  {summary.activeCustomersCount}{' '}
                  <span className="text-xs font-medium text-slate-500">عمليا</span>
                </h4>
                <p className="text-[10px] text-indigo-700/75 mt-0.5">من أصل {db.customers.length} مسجّلين بالكامل</p>
              </div>
              {/* Modern mini visual-bar tracking */}
              <div className="w-24 h-1 bg-indigo-100/70 rounded-full overflow-hidden mt-1">
                <div 
                  className="h-full bg-indigo-600 rounded-full transition-all duration-300" 
                  style={{ width: `${db.customers.length ? Math.min((summary.activeCustomersCount / db.customers.length) * 100, 100) : 0}%` }}
                />
              </div>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                navigate('/customers');
              }}
              title="الانتقال إلى قسم العملاء"
              className="w-12 h-12 rounded-xl bg-white shadow-2xs border border-indigo-50 flex items-center justify-center text-indigo-600 hover:bg-indigo-50 transition-all duration-200 z-10 cursor-pointer"
            >
              <Users className="w-6 h-6 shrink-0" />
            </button>
            <div className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full bg-indigo-100/10 blur-xl pointer-events-none" />
          </motion.div>

          {/* Card 4: Overdue counts (Modern style matched) */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            whileHover={{ y: -3, transition: { duration: 0.12 } }}
            style={{ willChange: 'transform, opacity' }}
            className={`p-5 rounded-2xl border shadow-2xs hover:shadow-xs flex items-center justify-between transition-all duration-200 relative overflow-hidden group ${
              summary.overdueCount > 0 
                ? 'bg-amber-50/25 border-amber-200/80' 
                : 'bg-white border-slate-100'
            }`}
          >
            <div className="space-y-2 z-10 text-right">
              <div className="flex items-center gap-1.5">
                {summary.overdueCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
                <span className={`text-xs font-bold ${summary.overdueCount > 0 ? 'text-amber-950/70' : 'text-slate-500'}`}>
                  ديون فات موعد استحقاقها
                </span>
              </div>
              <div>
                <h4 className={`text-2xl font-black ${summary.overdueCount > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
                  {summary.overdueCount}{' '}
                  <span className="text-xs font-medium text-slate-500">حسابات</span>
                </h4>
                <p className={`text-[10px] mt-0.5 ${summary.overdueCount > 0 ? 'text-amber-750/75' : 'text-slate-400'}`}>
                  {summary.overdueCount > 0 ? 'يرجى مراجعة نافذة تذكير الـ AI' : 'كل العملاء ملتزمون بالدفع في الوقت'}
                </p>
              </div>
              {/* Pulse tag when overdue */}
              {summary.overdueCount > 0 ? (
                <span className="inline-block text-[8px] font-bold text-amber-700 bg-amber-100/60 rounded-full px-2 py-0.5 transition-colors">
                  يتطلب إرسال إشعار
                </span>
              ) : (
                <span className="inline-block text-[8px] font-bold text-emerald-600 bg-emerald-50 rounded-full px-2 py-0.5 transition-colors">
                  الوضع مستقر ومثالي
                </span>
              )}
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-2xs transition-all duration-200 group-hover:scale-105 z-10 ${
              summary.overdueCount > 0 
                ? 'bg-white border border-amber-100/80 text-amber-600' 
                : 'bg-slate-50 border border-slate-100 text-slate-400'
            }`}>
              <Clock className={`w-6 h-6 shrink-0 ${summary.overdueCount > 0 ? 'animate-pulse' : ''}`} />
            </div>
            <div className={`absolute -bottom-8 -right-8 w-24 h-24 rounded-full blur-xl pointer-events-none ${
              summary.overdueCount > 0 ? 'bg-amber-100/20' : 'bg-slate-100/10'
            }`} />
          </motion.div>
        </div>
      </div>

      {/* 2. Overdue Warning Alert Box */}
      {overdueBalances.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-5 bg-amber-50 rounded-2xl border border-amber-200/60 text-amber-850 flex items-start gap-3.5 transition-colors"
        >
          <AlertTriangle className="w-5.5 h-5.5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-3 text-right w-full" dir="rtl">
            <h5 className="font-bold text-sm text-amber-900">مستحقات متأخرة تنتظر المتابعة!</h5>
            
            {/* Clickable Customer Buttons */}
            <div className="space-y-1.5 bg-white/70 p-3 rounded-xl border border-amber-200/30 transition-colors">
              <span className="block font-black text-amber-800 text-[10px] mb-1">العملاء المتأخرون عن السداد حالياً (اضغط لتوليد رسالة تذكير ذكية AI):</span>
              <div className="flex flex-wrap gap-2">
                {overdueBalances.map((b) => (
                  <button
                    key={b.customer.id}
                    onClick={() => navigate(`/reminders?id=${b.customer.id}`)}
                    className="inline-flex items-center gap-1.5 bg-amber-100/80 hover:bg-amber-200/90 text-amber-900 border border-amber-300/60 px-2.5 py-1 rounded-lg font-bold text-xs cursor-pointer transition-all hover:scale-[1.02] shadow-3xs"
                    title={`انقر لتوليد رسالة مخصصة بالذكاء الاصطناعي لـ ${b.customer.name}`}
                  >
                    <span>{b.customer.name}</span>
                    <span className="text-[10px] bg-white/65 px-1 py-0.5 rounded text-amber-800 font-semibold transition-colors">{formatCurrency(b.remainingDebt)}</span>
                  </button>
                ))}
              </div>
            </div>

            <p className="text-amber-700 leading-relaxed font-semibold">
              هناك {overdueBalances.length} عملاء تجاوزوا تاريخ السداد المتفق عليه دون إغلاق حساباتهم بالكامل. يمكنك ممارسة ضغطة زر واحدة على أي من الأسماء المدرجة أعلاه ليقوم محرك الذكاء الاصطناعي بصياغة رسالة تحصيل مخصصة بأسلوب رائق مخصص له.
            </p>
          </div>
        </motion.div>
      )}


      {/* 3. Top Debtors & Progress Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Collection Target Circular Gauge */}
        <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-xs lg:col-span-1 space-y-5 transition-colors">
          <h4 className="text-sm font-bold text-slate-800">مؤشر أداء التحصيل المالي</h4>
          
          <div className="relative flex flex-col items-center justify-center py-6">
            <svg className="w-36 h-36 transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r="64"
                stroke="#f1f5f9"
                strokeWidth="12"
                fill="transparent"
              />
              <circle
                cx="72"
                cy="72"
                r="64"
                stroke="#10b981"
                strokeWidth="12"
                fill="transparent"
                strokeDasharray={402}
                strokeDashoffset={402 - (402 * collectionRate) / 100}
                className="transition-all duration-1000 ease-out"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-slate-800 transition-colors">{collectionRate}%</span>
              <span className="text-[10px] text-slate-400 font-bold transition-colors">نسبة التحصيل</span>
            </div>
          </div>

          <div className="space-y-3.5 pt-2 text-xs font-bold">
            <div className="flex items-center justify-between border-b border-slate-50 pb-2">
              <span className="text-slate-500">إجمالي المبيعات الآجلة</span>
              <span className="font-bold text-slate-800">{formatCurrency(summary.grandTotalDebt)}</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-50 pb-2">
              <span className="text-slate-500">المحصل النقدي الفعل</span>
              <span className="font-bold text-emerald-600">✓ {formatCurrency(summary.grandTotalPaid)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">الديون المستحقة حالياً</span>
              <span className="font-bold text-rose-500">{formatCurrency(summary.grandTotalRemaining)}</span>
            </div>
          </div>
        </div>

        {/* Top 5 Debtors Ledger */}
        <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-xs lg:col-span-2 space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 transition-colors">
              <TrendingUp className="w-4 h-4 text-rose-500" />
              أكبر العملاء مديونية (الـ 5 الأوائل)
            </h4>
            <span className="text-[10px] bg-rose-50 text-rose-600 px-2 py-1 rounded-md font-bold transition-colors">ترتيب تنازلي</span>
          </div>

          {topDebtors.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-slate-400 text-xs transition-colors">
              <p>لا يوجد عملاء مدينون حالياً وبذلك تكون ذمتكم المالية سليمة تماماً! 🎉</p>
            </div>
          ) : (
            <div className="space-y-4.5 pt-2">
              {topDebtors.map((item, index) => {
                const percentage = summary.grandTotalRemaining > 0 
                  ? Math.min(100, Math.round((item.remainingDebt / summary.grandTotalRemaining) * 100)) 
                  : 0;

                return (
                  <div key={item.customer.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <button 
                        onClick={() => onSelectCustomer(item.customer.id)}
                        className="font-bold text-slate-700 hover:text-indigo-600 text-right cursor-pointer hover:underline transition-all"
                      >
                        {index + 1}. {item.customer.name}
                      </button>
                      <span className="font-black text-rose-600">{formatCurrency(item.remainingDebt)}</span>
                    </div>

                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex transition-colors">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ${
                          index === 0 ? 'bg-rose-500' :
                          index === 1 ? 'bg-amber-500' :
                          'bg-indigo-600'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-405 font-medium transition-colors">
                      <span>هاتف: {item.customer.phone}</span>
                      <span>يمثل {percentage}% ممن بعهدتهم ديون</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 4. Aesthetic Interactive Graphs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Graph A: Flow Trend over time (Middle/Large block) */}
        <div className="lg:col-span-2 p-6 bg-white rounded-2xl border border-slate-100 shadow-xs space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 transition-colors">
              <Activity className="w-4.5 h-4.5 text-indigo-600" />
              حركة المشتريات بالآجل مقابل المقبوضات
            </h4>
            <span className="text-[10px] bg-slate-100 text-slate-600 font-bold py-1 px-2.5 rounded-lg transition-colors">التدفق المالي الأخير</span>
          </div>

          <div className="h-68">
            <ResponsiveContainer width="100%" height="100%" debounce={150}>
              <BarChart data={chartFlowData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tickLine={false} style={{ fontSize: '10px', fontWeight: 'bold' }} stroke="#64748b" />
                <YAxis tickLine={false} style={{ fontSize: '10px', fontWeight: 'bold' }} stroke="#64748b" />
                <RechartsTooltip 
                  contentStyle={{ 
                    direction: 'rtl', 
                    textAlign: 'right', 
                    borderRadius: '12px', 
                    backgroundColor: '#ffffff',
                    border: '1px solid #f1f5f9',
                    color: '#0f172a'
                  }} 
                  labelFormatter={(lbl) => `التاريخ: ${lbl}`}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '10px', color: '#64748b' }} />
                <Bar name="إجمالي ديون جديدة (دين)" dataKey="debt" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                <Bar name="إجمالي مبالغ محصلة (سداد)" dataKey="payment" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graph B: Customer Segmentation Pie Chart */}
        <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-805 flex items-center gap-1.5 transition-colors">
              <PieIcon className="w-4.5 h-4.5 text-indigo-600" />
              توزيع وتصنيف حسابات العملاء
            </h4>
          </div>

          <div className="h-52 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%" debounce={150}>
              <RechartsPieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ 
                    direction: 'rtl', 
                    textAlign: 'right', 
                    borderRadius: '12px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #f1f5f9',
                    color: '#0f172a'
                  }} 
                />
              </RechartsPieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-slate-800 transition-colors">{balances.length}</span>
              <span className="text-[10px] text-slate-400 font-bold transition-colors">إجمالي العملاء</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-bold">
            <button
              onClick={() => navigate('/customers?filter=settled')}
              title="الانتقال وقصر القائمة على العملاء المسددين بالكامل (خالص)"
              className="p-2 bg-emerald-50/50 hover:bg-emerald-100/70 border border-emerald-100/40 hover:border-emerald-300 rounded-xl transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer text-center focus:outline-none"
            >
              <span className="text-emerald-700 block transition-colors">مسددين</span>
              <span className="text-slate-800 text-xs font-black mt-0.5 block transition-colors">{settledCount}</span>
            </button>
            <button
              onClick={() => navigate('/customers?filter=debtors')}
              title="الانتقال وقصر القائمة على العملاء الملتزمين حالياً بالديون"
              className="p-2 bg-indigo-50/50 hover:bg-indigo-100/70 border border-indigo-100/40 hover:border-indigo-300 rounded-xl transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer text-center focus:outline-none"
            >
              <span className="text-indigo-700 block transition-colors">ملتزمين</span>
              <span className="text-slate-800 text-xs font-black mt-0.5 block transition-colors">{activeDebtorsCount}</span>
            </button>
            <button
              onClick={() => navigate('/customers?filter=overdue')}
              title="الانتقال وقصر القائمة على العملاء المتأخرين عن السداد"
              className="p-2 bg-amber-50/50 hover:bg-amber-100/70 border border-amber-100/40 hover:border-amber-300 rounded-xl transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer text-center focus:outline-none"
            >
              <span className="text-amber-700 block transition-colors">متأخرين</span>
              <span className="text-slate-800 text-xs font-black mt-0.5 block transition-colors">{overdueDebtorsCount}</span>
            </button>
          </div>
        </div>

      </div>

      {/* 5. Recent Operations Ledger */}
      <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-xs space-y-4 transition-colors">
        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 transition-colors">
          <CalendarDays className="w-4 h-4 text-indigo-600" />
          أحدث الحركات المالية المسجلة بالدفتر
        </h4>

        {sortedTxs.length === 0 ? (
          <div className="h-24 flex items-center justify-center text-slate-400 text-xs text-center transition-colors">
            <p>لم يتم تسجيل أي حركات ديون أو سداد حتى الآن.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs transition-colors">
              <thead>
                <tr className="border-b border-slate-150 text-slate-400 font-bold transition-colors">
                  <th className="pb-3 pt-1 font-bold text-right">التاريخ</th>
                  <th className="pb-3 pt-1 font-bold text-right">العميل</th>
                  <th className="pb-3 pt-1 font-bold text-right">نوع الحركة</th>
                  <th className="pb-3 pt-1 font-bold text-right">البيان / تفاصيل</th>
                  <th className="pb-3 pt-1 font-bold text-right">القيمة المالية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 transition-colors">
                {sortedTxs.map((tx) => {
                  const customer = db.customers.find(c => c.id === tx.customerId);
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors font-medium">
                      <td className="py-3.5 text-slate-500">{tx.date}</td>
                      <td className="py-3.5 font-bold text-slate-700">
                        {customer ? (
                          <button 
                            onClick={() => onSelectCustomer(tx.customerId)}
                            className="text-slate-700 hover:text-indigo-600 hover:underline cursor-pointer transition-colors"
                          >
                            {customer.name}
                          </button>
                        ) : 'عميل محذوف'}
                      </td>
                      <td className="py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors ${
                          tx.type === 'debt' 
                            ? 'bg-rose-50 text-rose-600' 
                            : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          {tx.type === 'debt' ? (
                            <>
                              <ArrowUpRight className="w-3 h-3 text-rose-500" />
                              دين جديد
                            </>
                          ) : (
                            <>
                              <ArrowDownLeft className="w-3 h-3 text-emerald-500" />
                              دفعة سداد
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-500 font-medium">{tx.notes || '---'}</td>
                      <td className={`py-3.5 font-black text-sm text-right transition-colors ${
                        tx.type === 'debt' ? 'text-rose-600' : 'text-emerald-600'
                      }`}>
                        {tx.type === 'debt' ? '+' : '-'}{formatCurrency(tx.amount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
