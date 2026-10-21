import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Plus,
  Trash2,
  Edit3,
  ArrowDownLeft,
  ArrowUpRight,
  FileSpreadsheet,
  FileJson,
  Calendar,
  Sparkles,
  ArrowUpDown,
} from 'lucide-react';
import { Transaction, Category, TransactionType } from '../types';
import {
  formatRupiah,
  formatDateIndo,
  getRelativeDateLabel,
  exportToCSV,
  exportToJSON,
} from '../utils/formatters';
import { getCategoryColorClasses } from '../utils/categoryIcons';

interface TransactionsViewProps {
  transactions: Transaction[];
  categories: Category[];
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onOpenManualModal: () => void;
  onNavigateToChat: () => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  categories,
  onEditTransaction,
  onDeleteTransaction,
  onOpenManualModal,
  onNavigateToChat,
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [sortBy, setSortBy] = useState<'dateDesc' | 'dateAsc' | 'amountDesc' | 'amountAsc'>('dateDesc');

  // Dates
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentMonthStr = todayStr.slice(0, 7);
  const sevenDaysAgoStr = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => {
        // Search
        if (search) {
          const s = search.toLowerCase();
          const matchDesc = t.description.toLowerCase().includes(s);
          const matchCat = t.category.toLowerCase().includes(s);
          const matchNotes = t.notes?.toLowerCase().includes(s);
          const matchAmount = t.amount.toString().includes(s);
          if (!matchDesc && !matchCat && !matchNotes && !matchAmount) return false;
        }

        // Type
        if (typeFilter !== 'all' && t.type !== typeFilter) return false;

        // Category
        if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;

        // Time
        if (timeFilter === 'today' && t.date !== todayStr) return false;
        if (timeFilter === 'week' && t.date < sevenDaysAgoStr) return false;
        if (timeFilter === 'month' && !t.date.startsWith(currentMonthStr)) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'dateDesc') {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        if (sortBy === 'dateAsc') {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        }
        if (sortBy === 'amountDesc') {
          return b.amount - a.amount;
        }
        if (sortBy === 'amountAsc') {
          return a.amount - b.amount;
        }
        return 0;
      });
  }, [transactions, search, typeFilter, categoryFilter, timeFilter, sortBy]);

  // Summaries of filtered
  const filteredIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);
  const filteredExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);

  const handleExportCSV = () => {
    const rows = filteredTransactions.map(t => ({
      ID: t.id,
      Tanggal: t.date,
      Tipe: t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      Kategori: t.category,
      Deskripsi: t.description,
      Nominal: t.amount,
      Catatan: t.notes || '',
    }));
    exportToCSV(`transaksi-chatkeuangan-${todayStr}.csv`, rows);
  };

  const handleExportJSON = () => {
    exportToJSON(`transaksi-chatkeuangan-${todayStr}.json`, filteredTransactions);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Riwayat Transaksi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Kelola, telusuri, dan ekspor catatan keuangan yang terekam dari chat AI.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ekspor CSV</span>
          </button>
          <button
            onClick={handleExportJSON}
            className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          >
            <FileJson className="w-3.5 h-3.5 text-cyan-600" />
            <span>Ekspor JSON</span>
          </button>
          <button
            onClick={onOpenManualModal}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Transaksi</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari deskripsi, kategori, atau nominal..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
            >
              <option value="all">Semua Tipe Transaksi</option>
              <option value="expense">Hanya Pengeluaran (-)</option>
              <option value="income">Hanya Pemasukan (+)</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
            >
              <option value="all">Semua Kategori</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>
                  {cat.name} ({cat.type === 'income' ? '+' : '-'})
                </option>
              ))}
            </select>
          </div>

          {/* Period Filter */}
          <div>
            <select
              value={timeFilter}
              onChange={e => setTimeFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
            >
              <option value="all">Semua Waktu</option>
              <option value="today">Hari Ini Saja</option>
              <option value="week">7 Hari Terakhir</option>
              <option value="month">Bulan Ini</option>
            </select>
          </div>
        </div>

        {/* Sort & Quick Filter Stats */}
        <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 gap-2 text-xs">
          <div className="flex items-center space-x-3 text-slate-500 dark:text-slate-400">
            <span>Ditemukan: <strong className="text-slate-900 dark:text-white">{filteredTransactions.length}</strong> transaksi</span>
            <span>•</span>
            <span className="text-emerald-600 font-semibold">+{formatRupiah(filteredIncome)}</span>
            <span>•</span>
            <span className="text-rose-600 font-semibold">-{formatRupiah(filteredExpense)}</span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-400">Urutkan:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-2 py-1 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300"
            >
              <option value="dateDesc">Tanggal Terbaru</option>
              <option value="dateAsc">Tanggal Terlama</option>
              <option value="amountDesc">Nominal Terbesar</option>
              <option value="amountAsc">Nominal Terkecil</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Tidak ada transaksi yang cocok
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Coba ubah kata kunci pencarian atau catat transaksi baru langsung via Chat AI.
          </p>
          <button
            onClick={onNavigateToChat}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-500 transition shadow-xs mt-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Buka Chat AI</span>
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs divide-y divide-slate-100 dark:divide-slate-800">
          {filteredTransactions.map(tx => {
            const isIncome = tx.type === 'income';

            return (
              <div
                key={tx.id}
                className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition group"
              >
                {/* Left: Icon & Description */}
                <div className="flex items-center space-x-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isIncome
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                    }`}
                  >
                    {isIncome ? (
                      <ArrowDownLeft className="w-5 h-5" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {tx.description}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {tx.category}
                      </span>
                      <span>•</span>
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{getRelativeDateLabel(tx.date)}</span>
                      </span>
                      {tx.notes && (
                        <>
                          <span>•</span>
                          <span className="italic text-slate-400">{tx.notes}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Amount & Actions */}
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div
                      className={`text-sm sm:text-base font-bold ${
                        isIncome
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isIncome ? '+' : '-'}
                      {formatRupiah(tx.amount)}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {isIncome ? 'Pemasukan' : 'Pengeluaran'}
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onEditTransaction(tx)}
                      className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-lg transition"
                      title="Edit transaksi"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Hapus transaksi "${tx.description}"?`)) {
                          onDeleteTransaction(tx.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition"
                      title="Hapus transaksi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
