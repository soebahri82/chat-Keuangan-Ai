import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Scale,
  PieChart as PieIcon,
  BarChart3,
  Copy,
  Check,
  Printer,
  FileSpreadsheet,
  Sparkles,
  Info,
  DollarSign,
  Layers,
} from 'lucide-react';
import { Transaction, Category } from '../types';
import {
  formatRupiah,
  formatDateIndo,
  formatMonthYearIndo,
  formatShortRupiah,
  exportToCSV,
} from '../utils/formatters';
import { getCategoryColorClasses, getCategoryIcon } from '../utils/categoryIcons';

interface MonthlyReportProps {
  transactions: Transaction[];
  categories: Category[];
  initialBalance?: number;
}

// Distinct vibrant colors for pie slices
const PIE_COLORS = [
  '#10b981', // emerald-500
  '#06b6d4', // cyan-500
  '#f59e0b', // amber-500
  '#f43f5e', // rose-500
  '#8b5cf6', // purple-500
  '#3b82f6', // blue-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
  '#f97316', // orange-500
  '#6366f1', // indigo-500
  '#84cc16', // lime-500
];

export const MonthlyReport: React.FC<MonthlyReportProps> = ({
  transactions,
  categories,
  initialBalance = 0,
}) => {
  // Current month string 'YYYY-MM'
  const currentMonthStr = useMemo(() => {
    return new Date().toISOString().slice(0, 7);
  }, []);

  // Collect all unique available months sorted descending
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    monthSet.add(currentMonthStr);
    transactions.forEach(t => {
      if (t.date && t.date.length >= 7) {
        monthSet.add(t.date.slice(0, 7));
      }
    });
    return Array.from(monthSet).sort().reverse();
  }, [transactions, currentMonthStr]);

  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    // Pick current month or first available
    return availableMonths[0] || currentMonthStr;
  });

  const [chartView, setChartView] = useState<'both' | 'bar' | 'pieExpense' | 'pieIncome'>('both');
  const [copied, setCopied] = useState(false);

  // Filter transactions for selected month
  const monthlyTransactions = useMemo(() => {
    return transactions.filter(t => t.date && t.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  // Aggregate stats
  const totalIncome = useMemo(() => {
    return monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [monthlyTransactions]);

  const totalExpense = useMemo(() => {
    return monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [monthlyTransactions]);

  const netCashflow = totalIncome - totalExpense;
  const savingsRate =
    totalIncome > 0 ? Math.max(0, Math.round((netCashflow / totalIncome) * 100)) : 0;

  // Aggregate by Category
  const categorySummary = useMemo(() => {
    const map: Record<
      string,
      { category: string; income: number; expense: number; count: number }
    > = {};

    monthlyTransactions.forEach(t => {
      const cat = t.category || 'Lain-lain';
      if (!map[cat]) {
        map[cat] = { category: cat, income: 0, expense: 0, count: 0 };
      }
      map[cat].count += 1;
      if (t.type === 'income') {
        map[cat].income += t.amount;
      } else {
        map[cat].expense += t.amount;
      }
    });

    return Object.values(map);
  }, [monthlyTransactions]);

  // Data for Grouped Bar Chart (Income vs Expense by Category)
  const barChartData = useMemo(() => {
    return [...categorySummary]
      .sort((a, b) => b.expense + b.income - (a.expense + a.income))
      .map(item => ({
        name: item.category.length > 14 ? item.category.slice(0, 12) + '...' : item.category,
        fullName: item.category,
        Pemasukan: item.income,
        Pengeluaran: item.expense,
        total: item.income + item.expense,
      }));
  }, [categorySummary]);

  // Data for Expense Pie Chart
  const expensePieData = useMemo(() => {
    return categorySummary
      .filter(c => c.expense > 0)
      .map(c => ({
        name: c.category,
        value: c.expense,
        percent: totalExpense > 0 ? (c.expense / totalExpense) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [categorySummary, totalExpense]);

  // Data for Income Pie Chart
  const incomePieData = useMemo(() => {
    return categorySummary
      .filter(c => c.income > 0)
      .map(c => ({
        name: c.category,
        value: c.income,
        percent: totalIncome > 0 ? (c.income / totalIncome) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [categorySummary, totalIncome]);

  // Top spending category
  const topExpenseCat = expensePieData[0];
  // Top income category
  const topIncomeCat = incomePieData[0];

  // Month navigation helpers
  const currentMonthIndex = availableMonths.indexOf(selectedMonth);
  const hasPrevMonth = currentMonthIndex < availableMonths.length - 1;
  const hasNextMonth = currentMonthIndex > 0;

  const handlePrevMonth = () => {
    if (hasPrevMonth) {
      setSelectedMonth(availableMonths[currentMonthIndex + 1]);
    }
  };

  const handleNextMonth = () => {
    if (hasNextMonth) {
      setSelectedMonth(availableMonths[currentMonthIndex - 1]);
    }
  };

  // Copy monthly report summary to clipboard
  const handleCopySummary = () => {
    const monthLabel = formatMonthYearIndo(selectedMonth);
    let summaryText = `📊 *Laporan Keuangan Bulanan - ${monthLabel}*\n`;
    summaryText += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    summaryText += `💰 Total Pemasukan: ${formatRupiah(totalIncome)}\n`;
    summaryText += `💸 Total Pengeluaran: ${formatRupiah(totalExpense)}\n`;
    summaryText += `📈 Arus Kas Bersih: ${netCashflow >= 0 ? '+' : ''}${formatRupiah(netCashflow)}\n`;
    summaryText += `🎯 Rasio Tabungan: ${savingsRate}%\n\n`;

    if (expensePieData.length > 0) {
      summaryText += `📌 *Pengeluaran per Kategori:*\n`;
      expensePieData.forEach((item, idx) => {
        summaryText += `${idx + 1}. ${item.name}: ${formatRupiah(item.value)} (${item.percent.toFixed(1)}%)\n`;
      });
      summaryText += `\n`;
    }

    if (incomePieData.length > 0) {
      summaryText += `💵 *Pemasukan per Kategori:*\n`;
      incomePieData.forEach((item, idx) => {
        summaryText += `${idx + 1}. ${item.name}: ${formatRupiah(item.value)} (${item.percent.toFixed(1)}%)\n`;
      });
      summaryText += `\n`;
    }

    summaryText += `_Dibuat otomatis oleh ChatKeuangan AI_`;

    navigator.clipboard.writeText(summaryText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  // Export to CSV
  const handleExportCSV = () => {
    const rows = categorySummary.map(item => ({
      Bulan: formatMonthYearIndo(selectedMonth),
      Kategori: item.category,
      Pemasukan: item.income,
      Pengeluaran: item.expense,
      Selisih: item.income - item.expense,
      'Jumlah Transaksi': item.count,
    }));
    exportToCSV(`Laporan-Bulanan-${selectedMonth}.csv`, rows);
  };

  // Print report
  const handlePrint = () => {
    window.print();
  };

  // Custom Recharts Bar Tooltip
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataItem = payload[0]?.payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs">
          <p className="font-bold text-slate-200 border-b border-slate-700/80 pb-1 mb-2">
            {dataItem?.fullName || label}
          </p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                Pemasukan:
              </span>
              <span className="font-bold text-white">
                {formatRupiah(dataItem?.Pemasukan || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-rose-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                Pengeluaran:
              </span>
              <span className="font-bold text-white">
                {formatRupiah(dataItem?.Pengeluaran || 0)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Recharts Pie Tooltip
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      return (
        <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-xl border border-slate-700 text-xs">
          <p className="font-bold text-slate-200">{item.name}</p>
          <p className="text-emerald-400 font-bold mt-1">
            {formatRupiah(item.value)}
          </p>
          <p className="text-slate-400 text-[11px]">
            {item.payload.percent ? `${item.payload.percent.toFixed(1)}% dari total` : ''}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
      {/* Header with Title, Period Selector & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xs">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                  Laporan Bulanan Otomatis
                </h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                  <Sparkles className="w-3 h-3 mr-1" /> Recharts
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ringkasan komprehensif pemasukan dan pengeluaran per kategori yang diperbarui secara realtime.
              </p>
            </div>
          </div>
        </div>

        {/* Month Picker & Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Month Navigator */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={handlePrevMonth}
              disabled={!hasPrevMonth}
              aria-label="Bulan sebelumnya"
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Bulan sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-100 px-2 py-1 outline-none cursor-pointer"
            >
              {availableMonths.map(month => (
                <option key={month} value={month} className="bg-white dark:bg-slate-800">
                  {formatMonthYearIndo(month)}
                  {month === currentMonthStr ? ' (Bulan Ini)' : ''}
                </option>
              ))}
            </select>

            <button
              onClick={handleNextMonth}
              disabled={!hasNextMonth}
              aria-label="Bulan berikutnya"
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Bulan berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Action: Copy Text */}
          <button
            onClick={handleCopySummary}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition"
            title="Salin ringkasan ke papan klip"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600 font-bold">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Salin</span>
              </>
            )}
          </button>

          {/* Action: CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition"
            title="Unduh format CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CSV</span>
          </button>

          {/* Action: Print */}
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition"
            title="Cetak laporan"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cetak</span>
          </button>
        </div>
      </div>

      {/* Monthly Financial Highlights Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Income */}
        <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40">
          <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block">
            Pemasukan
          </span>
          <div className="text-base sm:text-xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-1">
            +{formatRupiah(totalIncome)}
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
            {monthlyTransactions.filter(t => t.type === 'income').length} transaksi
          </span>
        </div>

        {/* Total Expense */}
        <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-800/40">
          <span className="text-[11px] font-semibold text-rose-800 dark:text-rose-400 uppercase tracking-wider block">
            Pengeluaran
          </span>
          <div className="text-base sm:text-xl font-extrabold text-rose-700 dark:text-rose-300 mt-1">
            -{formatRupiah(totalExpense)}
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
            {monthlyTransactions.filter(t => t.type === 'expense').length} transaksi
          </span>
        </div>

        {/* Net Flow */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
            Arus Kas Bersih
          </span>
          <div
            className={`text-base sm:text-xl font-extrabold mt-1 ${
              netCashflow >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {netCashflow >= 0 ? '+' : ''}
            {formatRupiah(netCashflow)}
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
            {netCashflow >= 0 ? 'Surplus bulanan ✅' : 'Defisit bulanan ⚠️'}
          </span>
        </div>

        {/* Savings Rate */}
        <div className="p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-800/40">
          <span className="text-[11px] font-semibold text-teal-800 dark:text-teal-400 uppercase tracking-wider block">
            Rasio Tabungan
          </span>
          <div className="text-base sm:text-xl font-extrabold text-teal-700 dark:text-teal-300 mt-1">
            {savingsRate}%
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
            {savingsRate >= 20 ? 'Sehat (≥20%)' : savingsRate > 0 ? 'Cukup (<20%)' : 'Tanpa sisa'}
          </span>
        </div>
      </div>

      {/* Recharts Views Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center space-x-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl self-start">
          <button
            onClick={() => setChartView('both')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              chartView === 'both'
                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Tampilan Lengkap</span>
          </button>
          <button
            onClick={() => setChartView('bar')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              chartView === 'bar'
                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Komparasi Kategori</span>
          </button>
          <button
            onClick={() => setChartView('pieExpense')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              chartView === 'pieExpense'
                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5 text-rose-500" />
            <span>Donat Pengeluaran</span>
          </button>
          <button
            onClick={() => setChartView('pieIncome')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              chartView === 'pieIncome'
                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5 text-emerald-500" />
            <span>Donat Pemasukan</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-1">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Periode: <strong className="text-slate-700 dark:text-slate-200">{formatMonthYearIndo(selectedMonth)}</strong></span>
        </div>
      </div>

      {/* Main Charts Area powered by Recharts */}
      {monthlyTransactions.length === 0 ? (
        <div className="py-14 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Tidak ada transaksi di {formatMonthYearIndo(selectedMonth)}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Gunakan tab Chat AI untuk mencatat pemasukan atau pengeluaran baru pada periode ini.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* View 1: Both or Bar Chart */}
          {(chartView === 'both' || chartView === 'bar') && (
            <div className="bg-slate-50/60 dark:bg-slate-950/40 p-4 sm:p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-600" />
                    Grafik Komparasi Pemasukan vs Pengeluaran per Kategori
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Nilai nominal rupiah dalam kategori aktif pada {formatMonthYearIndo(selectedMonth)}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
                    <span className="text-slate-700 dark:text-slate-300">Pemasukan</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-rose-500 inline-block" />
                    <span className="text-slate-700 dark:text-slate-300">Pengeluaran</span>
                  </div>
                </div>
              </div>

              {/* Bar Chart Container */}
              <div className="w-full h-72 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={barChartData}
                    margin={{ top: 10, right: 10, left: -15, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                      height={45}
                    />
                    <YAxis
                      tickFormatter={formatShortRupiah}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: '8px', fontSize: '12px' }} />
                    <Bar
                      dataKey="Pemasukan"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                    <Bar
                      dataKey="Pengeluaran"
                      fill="#f43f5e"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* View 2: Pie Charts (Both, or dedicated pie) */}
          {(chartView === 'both' || chartView === 'pieExpense' || chartView === 'pieIncome') && (
            <div
              className={`grid grid-cols-1 ${
                chartView === 'both' ? 'lg:grid-cols-2' : ''
              } gap-6`}
            >
              {/* Expense Donut Chart */}
              {(chartView === 'both' || chartView === 'pieExpense') && (
                <div className="bg-slate-50/60 dark:bg-slate-950/40 p-4 sm:p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <PieIcon className="w-4 h-4 text-rose-500" />
                        Distribusi Pengeluaran ({formatRupiah(totalExpense)})
                      </h4>
                      <span className="text-[11px] font-semibold text-rose-600 bg-rose-100 dark:bg-rose-950/50 px-2 py-0.5 rounded-full">
                        {expensePieData.length} Kategori
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4">
                      Proporsi anggaran yang dialokasikan ke masing-masing kategori pengeluaran.
                    </p>

                    {expensePieData.length === 0 ? (
                      <div className="py-12 text-center text-xs text-slate-400">
                        Belum ada pengeluaran di bulan ini.
                      </div>
                    ) : (
                      <div className="w-full h-64 sm:h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Tooltip content={<CustomPieTooltip />} />
                            <Pie
                              data={expensePieData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={55}
                              outerRadius={85}
                              paddingAngle={3}
                            >
                              {expensePieData.map((_, index) => (
                                <Cell
                                  key={`cell-exp-${index}`}
                                  fill={PIE_COLORS[index % PIE_COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Legend
                              layout="horizontal"
                              verticalAlign="bottom"
                              align="center"
                              iconSize={9}
                              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  {/* Top Spending Callout */}
                  {topExpenseCat && (
                    <div className="mt-4 p-3 bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 rounded-xl text-xs text-rose-900 dark:text-rose-200 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <TrendingDown className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>
                          Biaya Terbesar: <strong>{topExpenseCat.name}</strong>
                        </span>
                      </div>
                      <span className="font-extrabold text-rose-700 dark:text-rose-300">
                        {formatRupiah(topExpenseCat.value)} ({topExpenseCat.percent.toFixed(1)}%)
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Income Donut Chart */}
              {(chartView === 'both' || chartView === 'pieIncome') && (
                <div className="bg-slate-50/60 dark:bg-slate-950/40 p-4 sm:p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <PieIcon className="w-4 h-4 text-emerald-500" />
                        Distribusi Pemasukan ({formatRupiah(totalIncome)})
                      </h4>
                      <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-100 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
                        {incomePieData.length} Kategori
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4">
                      Sumber pendapatan dan persentase kontribusi di {formatMonthYearIndo(selectedMonth)}.
                    </p>

                    {incomePieData.length === 0 ? (
                      <div className="py-12 text-center text-xs text-slate-400">
                        Belum ada pemasukan di bulan ini.
                      </div>
                    ) : (
                      <div className="w-full h-64 sm:h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Tooltip content={<CustomPieTooltip />} />
                            <Pie
                              data={incomePieData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={55}
                              outerRadius={85}
                              paddingAngle={3}
                            >
                              {incomePieData.map((_, index) => (
                                <Cell
                                  key={`cell-inc-${index}`}
                                  fill={PIE_COLORS[(index + 3) % PIE_COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Legend
                              layout="horizontal"
                              verticalAlign="bottom"
                              align="center"
                              iconSize={9}
                              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  {/* Top Income Callout */}
                  {topIncomeCat && (
                    <div className="mt-4 p-3 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          Pemasukan Utama: <strong>{topIncomeCat.name}</strong>
                        </span>
                      </div>
                      <span className="font-extrabold text-emerald-700 dark:text-emerald-300">
                        {formatRupiah(topIncomeCat.value)} ({topIncomeCat.percent.toFixed(1)}%)
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Per-Category Detailed Breakdown Table */}
          <div className="border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-800/60 px-5 py-3.5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Scale className="w-4 h-4 text-teal-600" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Rincian Anggaran Kategori ({formatMonthYearIndo(selectedMonth)})
                </h4>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Total {categorySummary.length} Kategori Aktif
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/80 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/40 dark:bg-slate-900/40 text-[11px] text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800">
                    <th className="py-2.5 px-4">Kategori</th>
                    <th className="py-2.5 px-4 text-center">Transaksi</th>
                    <th className="py-2.5 px-4 text-right">Pemasukan</th>
                    <th className="py-2.5 px-4 text-right">Pengeluaran</th>
                    <th className="py-2.5 px-4 text-right">Net Bersih</th>
                    <th className="py-2.5 px-4">Porsi Pengeluaran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {categorySummary
                    .sort((a, b) => b.expense + b.income - (a.expense + a.income))
                    .map((item, idx) => {
                      const expenseShare =
                        totalExpense > 0 ? (item.expense / totalExpense) * 100 : 0;
                      const net = item.income - item.expense;

                      // Find category icon
                      const matchedCat = categories.find(c => c.name === item.category);
                      const IconComponent = getCategoryIcon(matchedCat?.icon || 'MoreHorizontal');
                      const colorClasses = getCategoryColorClasses(matchedCat?.color || 'slate');

                      return (
                        <tr
                          key={idx}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2.5">
                              <div
                                className={`w-7 h-7 rounded-lg ${colorClasses.bg} ${colorClasses.text} flex items-center justify-center shrink-0`}
                              >
                                <IconComponent className="w-3.5 h-3.5" />
                              </div>
                              <span className="font-semibold text-slate-900 dark:text-white">
                                {item.category}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center text-slate-500 dark:text-slate-400 font-medium">
                            {item.count}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {item.income > 0 ? (
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                +{formatRupiah(item.income)}
                              </span>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {item.expense > 0 ? (
                              <span className="font-bold text-rose-600 dark:text-rose-400">
                                -{formatRupiah(item.expense)}
                              </span>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-bold">
                            <span
                              className={
                                net > 0
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : net < 0
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : 'text-slate-500'
                              }
                            >
                              {net > 0 ? '+' : ''}
                              {formatRupiah(net)}
                            </span>
                          </td>
                          <td className="py-3 px-4 min-w-[130px]">
                            {item.expense > 0 ? (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-[10px]">
                                  <span className="text-slate-500 font-medium">
                                    {expenseShare.toFixed(1)}%
                                  </span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div
                                    style={{ width: `${Math.min(100, expenseShare)}%` }}
                                    className="h-full bg-rose-500 rounded-full"
                                  />
                                </div>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">0% (Pemasukan)</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Executive Summary & Financial Assessment Card */}
          <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-5 sm:p-6 rounded-2xl border border-teal-800/50 shadow-md">
            <div className="flex items-start space-x-3.5">
              <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/30">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="space-y-1.5">
                <h4 className="font-bold text-sm text-teal-200">
                  Kesimpulan & Catatan Analisis Finansial Otomatis
                </h4>
                <div className="text-xs text-slate-300 leading-relaxed space-y-1">
                  <p>
                    Pada periode <strong className="text-white">{formatMonthYearIndo(selectedMonth)}</strong>, 
                    Anda mencatatkan total perputaran uang sebesar{' '}
                    <strong className="text-white">{formatRupiah(totalIncome + totalExpense)}</strong> melalui{' '}
                    <strong className="text-white">{monthlyTransactions.length} transaksi</strong>.
                  </p>
                  <p>
                    {netCashflow >= 0 ? (
                      <>
                        Arus kas Anda mengalami <span className="text-emerald-400 font-semibold">surplus sebesar {formatRupiah(netCashflow)}</span> dengan rasio tabungan <span className="text-emerald-400 font-semibold">{savingsRate}%</span>. 
                        {savingsRate >= 20 
                          ? ' Kondisi keuangan sangat prima dan memenuhi anjuran tabungan ideal di atas 20%.' 
                          : ' Saldo positif, namun Anda dapat memaksimalkannya lagi untuk alokasi dana darurat.'}
                      </>
                    ) : (
                      <>
                        Arus kas Anda mengalami <span className="text-rose-400 font-semibold">defisit sebesar -{formatRupiah(Math.abs(netCashflow))}</span>. 
                        Pengeluaran melampaui pemasukan bulan ini. Periksa pos anggaran dengan porsi terbesar untuk efisiensi di bulan depan.
                      </>
                    )}
                  </p>
                  {topExpenseCat && (
                    <p className="text-slate-400 text-[11px] pt-1">
                      💡 Tip hemat: Pengeluaran terbesar berfokus pada <span className="text-amber-300 font-medium">{topExpenseCat.name}</span> ({topExpenseCat.percent.toFixed(1)}% dari seluruh beban). Menetapkan pagu batas untuk kategori ini dapat mengamankan arus kas Anda.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
