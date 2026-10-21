import React, { useState } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Scale,
  Calendar,
  Clock,
  PieChart as PieChartIcon,
  BarChart3,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Transaction, Category } from '../types';
import { formatRupiah, formatDateIndo, getRelativeDateLabel } from '../utils/formatters';
import { getCategoryColorClasses } from '../utils/categoryIcons';

interface DashboardViewProps {
  initialBalance: number;
  transactions: Transaction[];
  categories: Category[];
  onNavigateToTransactions: () => void;
  onNavigateToChat: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  initialBalance,
  transactions,
  categories,
  onNavigateToTransactions,
  onNavigateToChat,
}) => {
  const [timeframe, setTimeframe] = useState<'thisMonth' | 'allTime' | 'last30Days'>('thisMonth');

  // Dates
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentMonthStr = todayStr.slice(0, 7); // YYYY-MM

  // 7 days ago
  const sevenDaysAgoDate = new Date(Date.now() - 7 * 86400000);
  const sevenDaysAgoStr = sevenDaysAgoDate.toISOString().split('T')[0];

  // Filtered transactions for selected timeframe
  const filteredTxs = transactions.filter(t => {
    if (timeframe === 'thisMonth') {
      return t.date.startsWith(currentMonthStr);
    }
    if (timeframe === 'last30Days') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
      return t.date >= thirtyDaysAgo;
    }
    return true;
  });

  // KPI Calculations
  const allTimeIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const allTimeExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalBalance = initialBalance + allTimeIncome - allTimeExpense;

  // Month stats
  const monthIncome = transactions
    .filter(t => t.type === 'income' && t.date.startsWith(currentMonthStr))
    .reduce((sum, t) => sum + t.amount, 0);
  const monthExpense = transactions
    .filter(t => t.type === 'expense' && t.date.startsWith(currentMonthStr))
    .reduce((sum, t) => sum + t.amount, 0);
  const monthNet = monthIncome - monthExpense;

  // Today stats
  const todayIncome = transactions
    .filter(t => t.type === 'income' && t.date === todayStr)
    .reduce((sum, t) => sum + t.amount, 0);
  const todayExpense = transactions
    .filter(t => t.type === 'expense' && t.date === todayStr)
    .reduce((sum, t) => sum + t.amount, 0);
  const todayCount = transactions.filter(t => t.date === todayStr).length;

  // Week stats (last 7 days)
  const weekIncome = transactions
    .filter(t => t.type === 'income' && t.date >= sevenDaysAgoStr)
    .reduce((sum, t) => sum + t.amount, 0);
  const weekExpense = transactions
    .filter(t => t.type === 'expense' && t.date >= sevenDaysAgoStr)
    .reduce((sum, t) => sum + t.amount, 0);
  const weekCount = transactions.filter(t => t.date >= sevenDaysAgoStr).length;

  // Category breakdown for expenses
  const expenseByCategory: Record<string, number> = {};
  filteredTxs
    .filter(t => t.type === 'expense')
    .forEach(t => {
      expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
    });

  const totalExpenseFiltered = Object.values(expenseByCategory).reduce((a, b) => a + b, 0);

  const categoryBreakdown = Object.entries(expenseByCategory)
    .map(([catName, amount]) => {
      const percentage =
        totalExpenseFiltered > 0 ? (amount / totalExpenseFiltered) * 100 : 0;
      return {
        category: catName,
        amount,
        percentage,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  // Daily cashflow for the last 7 days
  const last7DaysLabels: { date: string; label: string; income: number; expense: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
    const dayIncome = transactions
      .filter(t => t.type === 'income' && t.date === dStr)
      .reduce((sum, t) => sum + t.amount, 0);
    const dayExpense = transactions
      .filter(t => t.type === 'expense' && t.date === dStr)
      .reduce((sum, t) => sum + t.amount, 0);
    last7DaysLabels.push({
      date: dStr,
      label: dayLabel,
      income: dayIncome,
      expense: dayExpense,
    });
  }

  // Max value for 7-day bar chart scaling
  const maxDayVal = Math.max(
    ...last7DaysLabels.map(d => Math.max(d.income, d.expense)),
    100000
  );

  // Financial Health Indicator
  const savingsRate =
    monthIncome > 0 ? Math.max(0, Math.round((monthNet / monthIncome) * 100)) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner / Welcome with Quick AI Action */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-6 -mr-6 w-56 h-56 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <span>Ringkasan Keuangan Pintar</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Dashboard Keuangan Pribadi
            </h1>
            <p className="text-emerald-100/90 text-sm mt-1 max-w-xl">
              Pantau seluruh pemasukan, pengeluaran, saldo berjalan, dan grafik visual yang diolah otomatis oleh AI.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onNavigateToChat}
              className="flex items-center space-x-2 px-4 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl text-xs font-bold shadow-md transition"
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Catat via Chat AI</span>
            </button>
            <button
              onClick={onNavigateToTransactions}
              className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-900/60 hover:bg-emerald-900/80 text-white rounded-xl text-xs font-semibold backdrop-blur-sm border border-emerald-500/30 transition"
            >
              <span>Riwayat Transaksi</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI 4-Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Saldo */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Saldo Aktif
            </span>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {formatRupiah(totalBalance)}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Saldo awal: {formatRupiah(initialBalance)}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        {/* Pemasukan Bulan Ini */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Pemasukan (Bulan Ini)
            </span>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              +{formatRupiah(monthIncome)}
            </div>
            <span className="text-[11px] text-emerald-600/80 mt-1 block font-medium">
              Aliran dana masuk
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Pengeluaran Bulan Ini */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Pengeluaran (Bulan Ini)
            </span>
            <div className="text-xl sm:text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
              -{formatRupiah(monthExpense)}
            </div>
            <span className="text-[11px] text-rose-500/80 mt-1 block font-medium">
              Biaya & konsumsi
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        {/* Selisih Arus Kas Bersih */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Selisih / Arus Kas Bersih
            </span>
            <div
              className={`text-xl sm:text-2xl font-bold mt-1 ${
                monthNet >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {monthNet >= 0 ? '+' : ''}
              {formatRupiah(monthNet)}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {monthNet >= 0 ? 'Surplus anggaran ✅' : 'Defisit anggaran ⚠️'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Scale className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Ringkasan Hari Ini & Ringkasan Minggu Ini */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Hari Ini */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Ringkasan Hari Ini
                </h3>
                <span className="text-[11px] text-slate-400">
                  {formatDateIndo(todayStr)} ({todayCount} transaksi)
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl text-center">
            <div>
              <div className="text-[11px] text-slate-400">Pemasukan</div>
              <div className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                +{formatRupiah(todayIncome)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Pengeluaran</div>
              <div className="text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                -{formatRupiah(todayExpense)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Net Hari Ini</div>
              <div
                className={`text-xs sm:text-sm font-bold mt-0.5 ${
                  todayIncome - todayExpense >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {todayIncome - todayExpense >= 0 ? '+' : ''}
                {formatRupiah(todayIncome - todayExpense)}
              </div>
            </div>
          </div>
        </div>

        {/* Minggu Ini */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Ringkasan 7 Hari Terakhir
                </h3>
                <span className="text-[11px] text-slate-400">
                  Total {weekCount} aktivitas keuangan
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl text-center">
            <div>
              <div className="text-[11px] text-slate-400">Pemasukan</div>
              <div className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                +{formatRupiah(weekIncome)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Pengeluaran</div>
              <div className="text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                -{formatRupiah(weekExpense)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Net Mingguan</div>
              <div
                className={`text-xs sm:text-sm font-bold mt-0.5 ${
                  weekIncome - weekExpense >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {weekIncome - weekExpense >= 0 ? '+' : ''}
                {formatRupiah(weekIncome - weekExpense)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section: 7-Day Bar Chart & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Cashflow Bar Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Grafik Arus Kas 7 Hari Terakhir
              </h3>
            </div>
            <div className="flex items-center space-x-4 text-xs font-medium">
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
                <span className="text-slate-600 dark:text-slate-300">Pemasukan</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded bg-rose-500 inline-block" />
                <span className="text-slate-600 dark:text-slate-300">Pengeluaran</span>
              </div>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="h-60 flex items-end justify-between gap-2 pt-6 pb-2 border-b border-slate-100 dark:border-slate-800">
            {last7DaysLabels.map((day, idx) => {
              const incomeHeightPercent = Math.min(
                100,
                Math.max(4, Math.round((day.income / maxDayVal) * 100))
              );
              const expenseHeightPercent = Math.min(
                100,
                Math.max(4, Math.round((day.expense / maxDayVal) * 100))
              );

              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                  <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-full relative">
                    {/* Hover tooltip */}
                    <div className="absolute -top-12 opacity-0 group-hover:opacity-100 pointer-events-none transition bg-slate-900 text-white text-[10px] p-1.5 rounded shadow-lg z-20 whitespace-nowrap">
                      <div>Masuk: +{formatRupiah(day.income)}</div>
                      <div>Keluar: -{formatRupiah(day.expense)}</div>
                    </div>

                    {/* Income Bar */}
                    <div
                      style={{ height: `${day.income > 0 ? incomeHeightPercent : 2}%` }}
                      className={`w-3 sm:w-5 rounded-t-sm transition-all duration-500 ${
                        day.income > 0 ? 'bg-emerald-500 group-hover:bg-emerald-400' : 'bg-slate-200 dark:bg-slate-800'
                      }`}
                    />

                    {/* Expense Bar */}
                    <div
                      style={{ height: `${day.expense > 0 ? expenseHeightPercent : 2}%` }}
                      className={`w-3 sm:w-5 rounded-t-sm transition-all duration-500 ${
                        day.expense > 0 ? 'bg-rose-500 group-hover:bg-rose-400' : 'bg-slate-200 dark:bg-slate-800'
                      }`}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-2 truncate w-full text-center">
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Rata-rata pengeluaran harian: {formatRupiah(Math.round(weekExpense / 7))}</span>
            <span className="font-semibold text-emerald-600">Terupdate otomatis via Chat AI</span>
          </div>
        </div>

        {/* Category Breakdown (1 col) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <PieChartIcon className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Pengeluaran Kategori
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                Bulan Ini
              </span>
            </div>

            {categoryBreakdown.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Belum ada pengeluaran yang tercatat di bulan ini.
              </div>
            ) : (
              <div className="space-y-3 mt-2">
                {categoryBreakdown.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[65%]">
                        {item.category}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatRupiah(item.amount)} ({Math.round(item.percentage)}%)
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        style={{ width: `${item.percentage}%` }}
                        className={`h-full rounded-full ${
                          idx === 0
                            ? 'bg-rose-500'
                            : idx === 1
                            ? 'bg-amber-500'
                            : idx === 2
                            ? 'bg-cyan-500'
                            : idx === 3
                            ? 'bg-purple-500'
                            : 'bg-emerald-500'
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top spending category callout */}
          {categoryBreakdown.length > 0 && (
            <div className="mt-5 p-3 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-xl text-xs text-amber-900 dark:text-amber-200">
              <span className="font-bold">Kategori Terbesar: </span>
              {categoryBreakdown[0].category} ({formatRupiah(categoryBreakdown[0].amount)})
            </div>
          )}
        </div>
      </div>

      {/* Health & Insights Card */}
      <div className="bg-slate-900 dark:bg-slate-950 text-white p-6 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm">Indikator Kesehatan Finansial Bulan Ini</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Rasio tabungan: <span className="font-bold text-emerald-400">{savingsRate}%</span> dari total pemasukan.
                {savingsRate >= 20
                  ? ' Sangat baik! Anda menyisihkan lebih dari 20% penghasilan.'
                  : savingsRate > 0
                  ? ' Cukup baik. Pertahankan agar tidak defisit hingga akhir bulan.'
                  : ' Perhatian: Pengeluaran bulan ini menyamai atau melebihi pemasukan.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateToChat()}
            className="self-start md:self-auto text-xs px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-semibold transition shrink-0"
          >
            Minta Analisis AI Lengkap &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};
