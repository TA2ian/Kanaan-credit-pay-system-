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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Main Financial Flow Segment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Metric Card 1: Total outstanding */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            whileHover={{ y: -2, transition: { duration: 0.12 } }}
            style={{ willChange: 'transform, opacity' }}
            className="p-4 bg-white rounded-2xl border border-slate-100 shadow-2xs hover:shadow-xs flex items-center justify-between transition-shadow duration-200"
          >
            <div className="space-y-0.5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">إجمالي الديون المعلقة</span>
              <h4 className="text-xl font-black text-rose-600">{formatCurrency(summary.grandTotalRemaining)}</h4>
              <p className="text-[9px] text-slate-400 font-medium">مجموع المتبقي بذمّة العملاء</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0 transition-colors">
              <DollarSign className="w-5 h-5 shrink-0" />
            </div>
          </motion.div>

          {/* Metric Card 2: Total paid */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            whileHover={{ y: -2, transition: { duration: 0.12 } }}
            style={{ willChange: 'transform, opacity' }}
            className="p-4 bg-white rounded-2xl border border-slate-100 shadow-2xs hover:shadow-xs flex items-center justify-between transition-all duration-200"
          >
            <div className="space-y-0.5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">إجمالي السداد المحصل</span>
              <h4 className="text-xl font-black text-emerald-600">{formatCurrency(summary.grandTotalPaid)}</h4>
              <p className="text-[9px] text-emerald-500 font-bold">معدل تحصيل {collectionRate}%</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 transition-colors">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            </div>
          </motion.div>
        </div>

        {/* Collection & Customer Ledger Segment (Paired Side-by-Side Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Card 3: Active debtors (Modern styled) */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            whileHover={{ y: -2, transition: { duration: 0.12 } }}
            style={{ willChange: 'transform, opacity' }}
            onClick={() => navigate('/customers')}
            title="الانتقال إلى قسم العملاء"
            className="p-4 bg-indigo-50/25 rounded-2xl border border-indigo-100/70 shadow-2xs hover:shadow-xs hover:border-indigo-300 flex items-center justify-between transition-all duration-200 relative overflow-hidden group cursor-pointer"
          >
            <div className="space-y-1.5 z-10 text-right">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-[10px] font-black text-indigo-900/60 uppercase tracking-wider">العملاء المدينون</span>
              </div>
              <div>
                <h4 className="text-xl font-black text-indigo-950">
                  {summary.activeCustomersCount}
                  <span className="text-[10px] font-bold text-slate-400 mr-1">عملاء</span>
                </h4>
                <p className="text-[9px] text-indigo-700/75 font-medium">من أصل {db.customers.length} مسجلين</p>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white shadow-2xs border border-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-50 transition-all duration-200 z-10">
              <Users className="w-5 h-5 shrink-0" />
            </div>
            <div className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full bg-indigo-100/10 blur-xl pointer-events-none" />
          </motion.div>

          {/* Card 4: Overdue counts (Modern style matched) */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            whileHover={{ y: -2, transition: { duration: 0.12 } }}
            style={{ willChange: 'transform, opacity' }}
            className={`p-4 rounded-2xl border shadow-2xs hover:shadow-xs flex items-center justify-between transition-all duration-200 relative overflow-hidden group ${
              summary.overdueCount > 0 
                ? 'bg-amber-50/25 border-amber-200/80' 
                : 'bg-white border-slate-100'
            }`}
          >
            <div className="space-y-1.5 z-10 text-right">
              <div className="flex items-center gap-1.5">
                {summary.overdueCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
                <span className={`text-[10px] font-black uppercase tracking-wider ${summary.overdueCount > 0 ? 'text-amber-900/60' : 'text-slate-400'}`}>
                  ديون متأخرة
                </span>
              </div>
              <div>
                <h4 className={`text-xl font-black ${summary.overdueCount > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
                  {summary.overdueCount}
                  <span className="text-[10px] font-bold text-slate-400 mr-1">حسابات</span>
                </h4>
                <p className={`text-[9px] font-medium mt-0.5 ${summary.overdueCount > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
                  {summary.overdueCount > 0 ? 'يتطلب متابعة عاجلة' : 'الوضع مستقر حالياً'}
                </p>
              </div>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-2xs transition-all duration-200 group-hover:scale-105 z-10 ${
              summary.overdueCount > 0 
                ? 'bg-white border border-amber-100/80 text-amber-600' 
                : 'bg-slate-50 border border-slate-100 text-slate-400'
            }`}>
              <Clock className={`w-5 h-5 shrink-0 ${summary.overdueCount > 0 ? 'animate-pulse' : ''}`} />
            </div>
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
        <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-xs lg:col-span-1 flex flex-col justify-between transition-colors">
          <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider">مؤشر أداء التحصيل</h4>
          
          <div className="relative flex flex-col items-center justify-center py-4">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="#f8fafc"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="#10b981"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={351.8}
                strokeDashoffset={351.8 - (351.8 * collectionRate) / 100}
                className="transition-all duration-1000 ease-out"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-slate-800 transition-colors">{collectionRate}%</span>
              <span className="text-[9px] text-slate-400 font-bold transition-colors uppercase">التحصيل</span>
            </div>
          </div>

          <div className="space-y-2 pt-2 text-[10px] font-bold">
            <div className="flex items-center justify-between border-b border-slate-50 pb-1.5">
              <span className="text-slate-400">إجمالي المبيعات</span>
              <span className="font-bold text-slate-700">{formatCurrency(summary.grandTotalDebt)}</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-50 pb-1.5">
              <span className="text-slate-400">المحصل الفعلي</span>
              <span className="font-bold text-emerald-600">{formatCurrency(summary.grandTotalPaid)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">الطلبات المعلقة</span>
              <span className="font-bold text-rose-500">{formatCurrency(summary.grandTotalRemaining)}</span>
            </div>
          </div>
        </div>

        {/* Top 5 Debtors Ledger */}
        <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-xs lg:col-span-2 space-y-3 transition-colors">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5 transition-colors">
              <TrendingUp className="w-3.5 h-3.5 text-rose-500" />
              أكبر المديونيات (الـ 5 الأوائل)
            </h4>
            <span className="text-[9px] bg-rose-50 text-rose-600 px-2 py-0.5 rounded font-black transition-colors">تنازلي</span>
          </div>

          {topDebtors.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-slate-400 text-xs transition-colors">
              <p>لا يوجد عملاء مدينون حالياً 🎉</p>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              {topDebtors.map((item, index) => {
                const percentage = summary.grandTotalRemaining > 0 
                  ? Math.min(100, Math.round((item.remainingDebt / summary.grandTotalRemaining) * 100)) 
                  : 0;

                return (
                  <div key={item.customer.id} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <button 
                        onClick={() => onSelectCustomer(item.customer.id)}
                        className="font-black text-slate-700 hover:text-indigo-600 text-right cursor-pointer hover:underline transition-all"
                      >
                        {index + 1}. {item.customer.name}
                      </button>
                      <span className="font-black text-rose-600">{formatCurrency(item.remainingDebt)}</span>
                    </div>

                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex transition-colors">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ${
                          index === 0 ? 'bg-rose-500' :
                          index === 1 ? 'bg-amber-500' :
                          'bg-indigo-600'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
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
        <div className="lg:col-span-2 p-5 bg-white rounded-2xl border border-slate-100 shadow-xs space-y-3 transition-colors">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5 transition-colors">
              <Activity className="w-3.5 h-3.5 text-indigo-600" />
              حركة المبيعات والمقبوضات
            </h4>
            <span className="text-[9px] bg-slate-50 text-slate-500 font-black py-0.5 px-2 rounded transition-colors uppercase">التدفق المالي</span>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%" debounce={150}>
              <BarChart data={chartFlowData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} style={{ fontSize: '9px', fontWeight: 'bold' }} stroke="#94a3b8" />
                <YAxis tickLine={false} axisLine={false} style={{ fontSize: '9px', fontWeight: 'bold' }} stroke="#94a3b8" />
                <RechartsTooltip 
                  contentStyle={{ 
                    direction: 'rtl', 
                    textAlign: 'right', 
                    borderRadius: '16px', 
                    backgroundColor: '#ffffff',
                    border: '1px solid #f1f5f9',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                  }} 
                  labelFormatter={(lbl) => `التاريخ: ${lbl}`}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'black', paddingTop: '10px', textTransform: 'uppercase' }} />
                <Bar name="ديون" dataKey="debt" fill="#f43f5e" radius={[3, 3, 0, 0]} barSize={12} />
                <Bar name="سداد" dataKey="payment" fill="#10b981" radius={[3, 3, 0, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graph B: Customer Segmentation Pie Chart */}
        <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between space-y-3 transition-colors">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5 transition-colors">
              <PieIcon className="w-3.5 h-3.5 text-indigo-600" />
              تصنيف الحسابات
            </h4>
          </div>

          <div className="h-44 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%" debounce={150}>
              <RechartsPieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={65}
                  paddingAngle={8}
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
                    borderRadius: '16px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #f1f5f9',
                    fontSize: '11px',
                    fontWeight: 'bold'
                  }} 
                />
              </RechartsPieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-xl font-black text-slate-800 transition-colors">{balances.length}</span>
              <span className="text-[8px] text-slate-400 font-black uppercase transition-colors">عملاء</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-center text-[9px] font-black uppercase">
            <button
              onClick={() => navigate('/customers?filter=settled')}
              className="p-1.5 bg-emerald-50/50 hover:bg-emerald-100/70 border border-emerald-100/40 rounded-xl transition-all cursor-pointer"
            >
              <span className="text-emerald-700 block">مسدد</span>
              <span className="text-slate-800 text-xs font-black mt-0.5 block">{settledCount}</span>
            </button>
            <button
              onClick={() => navigate('/customers?filter=debtors')}
              className="p-1.5 bg-indigo-50/50 hover:bg-indigo-100/70 border border-indigo-100/40 rounded-xl transition-all cursor-pointer"
            >
              <span className="text-indigo-700 block">مدين</span>
              <span className="text-slate-800 text-xs font-black mt-0.5 block">{activeDebtorsCount}</span>
            </button>
            <button
              onClick={() => navigate('/customers?filter=overdue')}
              className="p-1.5 bg-amber-50/50 hover:bg-amber-100/70 border border-amber-100/40 rounded-xl transition-all cursor-pointer"
            >
              <span className="text-amber-700 block">متأخر</span>
              <span className="text-slate-800 text-xs font-black mt-0.5 block">{overdueDebtorsCount}</span>
            </button>
          </div>
        </div>

      </div>

      {/* 5. Recent Operations Ledger */}
      <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-xs space-y-3 transition-colors">
        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5 transition-colors">
          <CalendarDays className="w-3.5 h-3.5 text-indigo-600" />
          أحدث الحركات المالية
        </h4>

        {sortedTxs.length === 0 ? (
          <div className="h-20 flex items-center justify-center text-slate-400 text-[10px] text-center transition-colors">
            <p>لم يتم تسجيل أي حركات حتى الآن.</p>
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-right text-[11px] transition-colors">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-black uppercase tracking-wider transition-colors">
                  <th className="pb-2 pt-1 font-black text-right">التاريخ</th>
                  <th className="pb-2 pt-1 font-black text-right">العميل</th>
                  <th className="pb-2 pt-1 font-black text-right">الحركة</th>
                  <th className="pb-2 pt-1 font-black text-right">البيان</th>
                  <th className="pb-2 pt-1 font-black text-right">القيمة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 transition-colors">
                {sortedTxs.map((tx) => {
                  const customer = db.customers.find(c => c.id === tx.customerId);
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors font-bold">
                      <td className="py-2.5 text-slate-400 text-[10px]">{tx.date}</td>
                      <td className="py-2.5 font-black text-slate-700">
                        {customer ? (
                          <button 
                            onClick={() => onSelectCustomer(tx.customerId)}
                            className="text-slate-700 hover:text-indigo-600 cursor-pointer transition-colors"
                          >
                            {customer.name}
                          </button>
                        ) : 'محذوف'}
                      </td>
                      <td className="py-2.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black transition-colors ${
                          tx.type === 'debt' 
                            ? 'bg-rose-50 text-rose-600' 
                            : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          {tx.type === 'debt' ? 'دين' : 'سداد'}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-400 font-medium max-w-[120px] truncate">{tx.notes || '---'}</td>
                      <td className={`py-2.5 font-black text-xs text-right transition-colors ${
                        tx.type === 'debt' ? 'text-rose-600' : 'text-emerald-600'
                      }`}>
                        {formatCurrency(tx.amount)}</td>
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
