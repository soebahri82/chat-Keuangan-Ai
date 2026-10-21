import React from 'react';
import {
  MessageSquare,
  LayoutDashboard,
  Receipt,
  FolderKanban,
  Sparkles,
  Wallet,
  TrendingUp,
  TrendingDown,
  PlusCircle,
  Target,
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';

export type ActiveTab = 'chat' | 'dashboard' | 'goals' | 'transactions' | 'categories';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  totalBalance: number;
  totalIncomeMonth: number;
  totalExpenseMonth: number;
  onOpenManualModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  totalBalance,
  totalIncomeMonth,
  totalExpenseMonth,
  onOpenManualModal,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('chat')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 flex items-center justify-center shadow-md shadow-emerald-500/20 text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">
                  ChatKeuangan
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-md">
                  AI
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                Pencatatan Keuangan Berbasis Chat
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs (Desktop) */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'chat'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Chat AI</span>
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard & Grafik</span>
            </button>
            <button
              onClick={() => setActiveTab('goals')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'goals'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>Target & Budget</span>
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'transactions'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Transaksi</span>
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'categories'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FolderKanban className="w-4 h-4" />
              <span>Kategori & Saldo</span>
            </button>
          </nav>

          {/* Right: Balance Pill & Manual Add */}
          <div className="flex items-center space-x-3">
            <div
              onClick={() => setActiveTab('dashboard')}
              className="hidden lg:flex items-center space-x-3 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/80 px-3 py-1.5 rounded-xl cursor-pointer hover:bg-emerald-100/80 transition"
              title="Klik untuk membuka rincian dashboard"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <Wallet className="w-3.5 h-3.5" />
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  Total Saldo
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-emerald-400 leading-none">
                  {formatRupiah(totalBalance)}
                </div>
              </div>
            </div>

            <button
              onClick={onOpenManualModal}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 transition shadow-sm"
              title="Catat manual jika tidak ingin via chat"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tambah Transaksi</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Tab Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 px-1 py-1.5">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex flex-col items-center py-1 px-2 text-xs font-medium rounded-lg ${
            activeTab === 'chat'
              ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <MessageSquare className="w-4 h-4 mb-0.5" />
          <span>Chat AI</span>
        </button>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center py-1 px-2 text-xs font-medium rounded-lg ${
            activeTab === 'dashboard'
              ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 mb-0.5" />
          <span>Dashboard</span>
        </button>
        <button
          onClick={() => setActiveTab('goals')}
          className={`flex flex-col items-center py-1 px-2 text-xs font-medium rounded-lg ${
            activeTab === 'goals'
              ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Target className="w-4 h-4 mb-0.5" />
          <span>Target</span>
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex flex-col items-center py-1 px-2 text-xs font-medium rounded-lg ${
            activeTab === 'transactions'
              ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Receipt className="w-4 h-4 mb-0.5" />
          <span>Transaksi</span>
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex flex-col items-center py-1 px-2 text-xs font-medium rounded-lg ${
            activeTab === 'categories'
              ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <FolderKanban className="w-4 h-4 mb-0.5" />
          <span>Kategori</span>
        </button>
      </div>
    </header>
  );
};
