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

interface DashboardTabProps {
  db: DatabaseState;
  onSelectCustomer: (customerId: string) => void;
}

export function DashboardTab({ db, onSelectCustomer }: DashboardTabProps) {
  const summary = computeFinancialSummary(db);
  const balances = getCustomerBalances(db);
  
  // Sort customers to find top debtors (non-zero balance and descending)
  const topDebtors = [...balances]
    .filter(b => b.remainingDebt > 0)
    .sort((a, b) => b.remainingDebt - a.remainingDebt)
    .slice(0, 5);

  // Get last 5 transactions
  const sortedTxs = [...db.transactions]
    .sort((a, b) => b.id.localeCompare(a.id))
    .slice(0, 5);

  // Calculate debt collection percentage
  const collectionRate = summary.grandTotalDebt > 0 
    ? Math.round((summary.grandTotalPaid / summary.grandTotalDebt) * 100) 
    : 100;

  // -- Chart Data Prep 1: Debt vs Repayments dates grouped --
  const dateMap: { [date: string]: { date: string, debt: number, payment: number } } = {};
  
  const sortedTxsForChart = [...db.transactions].sort((a, b) => a.date.localeCompare(b.date));
  
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

  let chartFlowData = Object.values(dateMap).slice(-8); // display last 8 entries
  
  if (chartFlowData.length === 0) {
    chartFlowData = [
      { date: '05-11', debt: 4500, payment: 0 },
      { date: '05-16', debt: 1200, payment: 0 },
      { date: '05-21', debt: 15000, payment: 0 },
      { date: '05-25', debt: 0, payment: 2000 },
      { date: '05-28', debt: 0, payment: 8500 },
      { date: '06-01', debt: 3000, payment: 3000 },
    ];
  }

  // -- Chart Data Prep 2: Pie Segments --
  const settledCount = balances.filter(b => b.remainingDebt === 0).length;
  const activeDebtorsCount = balances.filter(b => b.remainingDebt > 0 && !b.isOverdue).length;
  const overdueDebtorsCount = balances.filter(b => b.remainingDebt > 0 && b.isOverdue).length;

  const pieData = [
    { name: 'عملاء مسددين بالكامل', value: settledCount || 1, color: '#10b981' },
    { name: 'مدينين ملتزمين بالوقت', value: activeDebtorsCount || 1, color: '#4f46e5' },
    { name: 'متأخرين عن السداد', value: overdueDebtorsCount || 1, color: '#f59e0b' }
  ];

  return (
    <div className="space-y-6">
      
      {/* 1. Quick Financial Stats Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric Card 1: Total outstanding */}
        <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500">إجمالي الديون المعلقة</span>
            <h4 className="text-2xl font-black text-rose-600">{formatCurrency(summary.grandTotalRemaining)}</h4>
            <p className="text-[10px] text-slate-400">مجموع المتبقي بذمّة كافة العملاء</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
            <DollarSign className="w-6 h-6 shrink-0" />
          </div>
        </div>

        {/* Metric Card 2: Total paid */}
        <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500">إجمالي السداد المحصل</span>
            <h4 className="text-2xl font-black text-emerald-600">{formatCurrency(summary.grandTotalPaid)}</h4>
            <p className="text-[10px] text-emerald-500 font-medium font-bold">معدل تحصيل {collectionRate}%</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-6 h-6 shrink-0" />
          </div>
        </div>

        {/* Metric Card 3: Active debtors */}
        <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500">العملاء المدينون حالياً</span>
            <h4 className="text-2xl font-black text-slate-800">{summary.activeCustomersCount} <span className="text-xs font-medium text-slate-500">عملاء</span></h4>
            <p className="text-[10px] text-slate-400">من أصل {db.customers.length} مسجلين</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-650">
            <Users className="w-6 h-6 shrink-0" />
          </div>
        </div>

        {/* Metric Card 4: Overdue counts */}
        <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500">ديون فات موعد استحقاقها</span>
            <h4 className={`text-2xl font-black ${summary.overdueCount > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
              {summary.overdueCount} <span className="text-xs font-medium text-slate-500">تنبيهات</span>
            </h4>
            <p className="text-[10px] text-slate-400">تتطلب تذكير فوري عبر الـ AI</p>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            summary.overdueCount > 0 ? 'bg-amber-50 text-amber-600 animate-pulse' : 'bg-slate-100 text-slate-400'
          }`}>
            <Clock className="w-6 h-6 shrink-0" />
          </div>
        </div>
      </div>

      {/* 2. Overdue Warning Alert Box */}
      {summary.overdueCount > 0 && (
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/60 text-amber-850 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <h5 className="font-bold text-sm">مستحقات متأخرة تنتظر المتابعة!</h5>
            <p className="text-amber-700 leading-relaxed">هناك {summary.overdueCount} عملاء تجاوزوا تاريخ السداد المتفق عليه دون إغلاق حساباتهم بالكامل. يمكنك مراجعة صفحة <strong>التذكيرات</strong> لتوليد رسائل مخصصة بمساعدة الذكاء الاصطناعي وجدولة سدادهم.</p>
          </div>
        </div>
      )}

      {/* 3. Aesthetic Interactive Graphs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Graph A: Flow Trend over time (Middle/Large block) */}
        <div className="lg:col-span-2 p-6 bg-white rounded-2xl border border-slate-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Activity className="w-4.5 h-4.5 text-indigo-600" />
              حركة المشتريات بالآجل مقابل المقبوضات
            </h4>
            <span className="text-[10px] bg-slate-100 text-slate-600 font-bold py-1 px-2.5 rounded-lg">التدفق المالي الأخير</span>
          </div>

          <div className="h-68">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartFlowData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tickLine={false} style={{ fontSize: '10px', fontWeight: 'bold' }} />
                <YAxis tickLine={false} style={{ fontSize: '10px', fontWeight: 'bold' }} />
                <RechartsTooltip 
                  contentStyle={{ direction: 'rtl', textAlign: 'right', borderRadius: '12px', border: '1px solid #f1f5f9' }} 
                  labelFormatter={(lbl) => `التاريخ: ${lbl}`}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '10px' }} />
                <Bar name="إجمالي ديون جديدة (دين)" dataKey="debt" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                <Bar name="إجمالي مبالغ محصلة (سداد)" dataKey="payment" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graph B: Customer Segmentation Pie Chart */}
        <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <PieIcon className="w-4.5 h-4.5 text-indigo-600" />
              توزيع وتصنيف حسابات العملاء
            </h4>
          </div>

          <div className="h-52 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
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
                <RechartsTooltip contentStyle={{ direction: 'rtl', textAlign: 'right', borderRadius: '12px' }} />
              </RechartsPieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-slate-800">{balances.length}</span>
              <span className="text-[10px] text-slate-400 font-bold">إجمالي العملاء</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-bold">
            <div className="p-2 bg-emerald-50/50 rounded-xl">
              <span className="text-emerald-600 block">مسددين</span>
              <span className="text-slate-800 text-xs">{settledCount}</span>
            </div>
            <div className="p-2 bg-indigo-50/50 rounded-xl">
              <span className="text-indigo-600 block font-semibold">ملتزمين</span>
              <span className="text-slate-800 text-xs">{activeDebtorsCount}</span>
            </div>
            <div className="p-2 bg-amber-50/50 rounded-xl">
              <span className="text-amber-600 block">متأخرين</span>
              <span className="text-slate-800 text-xs">{overdueDebtorsCount}</span>
            </div>
          </div>
        </div>

      </div>

      {/* 4. Top Debtors & Progress Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Collection Target Circular Gauge */}
        <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-xs lg:col-span-1 space-y-5">
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
              <span className="text-3xl font-black text-slate-800">{collectionRate}%</span>
              <span className="text-[10px] text-slate-400 font-bold">نسبة التحصيل</span>
            </div>
          </div>

          <div className="space-y-3.5 pt-2 text-xs font-bold">
            <div className="flex items-center justify-between border-b border-slate-50 pb-2">
              <span className="text-slate-500">إجمالي المبيعات الآجلة</span>
              <span className="font-bold text-slate-800">{formatCurrency(summary.grandTotalDebt)}</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-50 pb-2">
              <span className="text-slate-500">المحصل النقدي الفعلي</span>
              <span className="font-bold text-emerald-600">✓ {formatCurrency(summary.grandTotalPaid)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">الديون المستحقة حالياً</span>
              <span className="font-bold text-rose-500">{formatCurrency(summary.grandTotalRemaining)}</span>
            </div>
          </div>
        </div>

        {/* Top 5 Debtors Ledger */}
        <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-xs lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-rose-500" />
              أكبر العملاء مديونية (الـ 5 الأوائل)
            </h4>
            <span className="text-[10px] bg-rose-50 text-rose-600 px-2 py-1 rounded-md font-bold">ترتيب تنازلي</span>
          </div>

          {topDebtors.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-slate-400 text-xs">
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
                        className="font-bold text-slate-700 hover:text-indigo-650 text-right cursor-pointer hover:underline transition-all"
                      >
                        {index + 1}. {item.customer.name}
                      </button>
                      <span className="font-black text-rose-600">{formatCurrency(item.remainingDebt)}</span>
                    </div>

                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ${
                          index === 0 ? 'bg-rose-500' :
                          index === 1 ? 'bg-amber-500' :
                          'bg-indigo-600'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-405 font-medium">
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

      {/* 5. Recent Operations Ledger */}
      <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
          <CalendarDays className="w-4 h-4 text-indigo-600" />
          أحدث الحركات المالية المسجلة بالدفتر
        </h4>

        {sortedTxs.length === 0 ? (
          <div className="h-24 flex items-center justify-center text-slate-400 text-xs text-center">
            <p>لم يتم تسجيل أي حركات ديون أو سداد حتى الآن.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-150 text-slate-400 font-bold">
                  <th className="pb-3 pt-1 font-bold text-right">التاريخ</th>
                  <th className="pb-3 pt-1 font-bold text-right">العميل</th>
                  <th className="pb-3 pt-1 font-bold text-right">نوع الحركة</th>
                  <th className="pb-3 pt-1 font-bold text-right">البيان / تفاصيل</th>
                  <th className="pb-3 pt-1 font-bold text-right">القيمة المالية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedTxs.map((tx) => {
                  const customer = db.customers.find(c => c.id === tx.customerId);
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors font-medium">
                      <td className="py-3.5 text-slate-500">{tx.date}</td>
                      <td className="py-3.5 font-bold text-slate-700">
                        {customer ? (
                          <button 
                            onClick={() => onSelectCustomer(tx.customerId)}
                            className="text-slate-700 hover:text-indigo-650 hover:underline cursor-pointer"
                          >
                            {customer.name}
                          </button>
                        ) : 'عميل محذوف'}
                      </td>
                      <td className="py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          tx.type === 'debt' 
                            ? 'bg-rose-50 text-rose-600' 
                            : 'bg-emerald-50 text-emerald-650'
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
                      <td className={`py-3.5 font-black text-sm text-right ${
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
