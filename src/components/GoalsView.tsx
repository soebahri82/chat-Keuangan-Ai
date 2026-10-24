import React, { useState } from 'react';
import {
  Target,
  Sparkles,
  Plus,
  Trash2,
  Check,
  X,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  PiggyBank,
  PieChart,
  ShieldAlert,
  Download,
  Upload,
  Share2,
  Copy,
} from 'lucide-react';
import { FinancialGoal, Transaction, Category, AppData } from '../types';
import { formatRupiah, formatDateIndo, exportToJSON } from '../utils/formatters';
import { getCategoryColorClasses } from '../utils/categoryIcons';

interface GoalsViewProps {
  goals: FinancialGoal[];
  onAddGoal: (goal: Omit<FinancialGoal, 'id'>) => void;
  onUpdateGoal: (goal: FinancialGoal) => void;
  onDeleteGoal: (id: string) => void;
  monthlyBudget: number;
  onUpdateMonthlyBudget: (val: number) => void;
  transactions: Transaction[];
  initialBalance: number;
  onImportAppData: (data: Partial<AppData>) => void;
  onNavigateToChat: () => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({
  goals,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  monthlyBudget,
  onUpdateMonthlyBudget,
  transactions,
  initialBalance,
  onImportAppData,
  onNavigateToChat,
}) => {
  // Modal states
  const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState(false);
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<FinancialGoal | null>(null);
  const [allocateAmount, setAllocateAmount] = useState('');

  // Form states for new goal
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTargetAmount, setGoalTargetAmount] = useState('');
  const [goalCurrentAmount, setGoalCurrentAmount] = useState('');
  const [goalDate, setGoalDate] = useState('');
  const [goalCategory, setGoalCategory] = useState('Tabungan');
  const [goalColor, setGoalColor] = useState('emerald');

  // Budget edit state
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState(monthlyBudget.toString());

  // Share message copied alert
  const [isCopied, setIsCopied] = useState(false);

  // Month calculations
  const now = new Date();
  const currentMonthStr = now.toISOString().slice(0, 7);
  const monthExpense = transactions
    .filter(t => t.type === 'expense' && t.date.startsWith(currentMonthStr))
    .reduce((s, t) => s + t.amount, 0);
  const monthIncome = transactions
    .filter(t => t.type === 'income' && t.date.startsWith(currentMonthStr))
    .reduce((s, t) => s + t.amount, 0);

  const budgetUsedPct = monthlyBudget > 0 ? Math.round((monthExpense / monthlyBudget) * 100) : 0;
  const budgetRemaining = monthlyBudget - monthExpense;

  // Days left in current month
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = Math.max(1, daysInMonth - now.getDate());
  const dailySafeSpend = budgetRemaining > 0 ? Math.round(budgetRemaining / daysLeft) : 0;

  // 50/30/20 Rule Analysis
  // Needs: Makanan, Transportasi, Tagihan listrik/air, Tempat tinggal, Kesehatan, Pendidikan
  // Wants: Hiburan, Belanja pribadi
  // Savings: Donasi, Tabungan/Investasi, Cicilan/Utang
  const needsExpense = transactions
    .filter(
      t =>
        t.type === 'expense' &&
        t.date.startsWith(currentMonthStr) &&
        [
          'Makanan dan minuman',
          'Transportasi dan bensin',
          'Tagihan listrik, air, dan internet',
          'Belanja rumah tangga',
          'Tempat tinggal',
          'Kesehatan',
          'Pendidikan',
        ].includes(t.category)
    )
    .reduce((s, t) => s + t.amount, 0);

  const wantsExpense = transactions
    .filter(
      t =>
        t.type === 'expense' &&
        t.date.startsWith(currentMonthStr) &&
        ['Hiburan', 'Belanja pribadi'].includes(t.category)
    )
    .reduce((s, t) => s + t.amount, 0);

  const savingsExpense = Math.max(0, monthIncome - monthExpense);

  const totalEvaluated = monthIncome > 0 ? monthIncome : monthExpense;
  const needsPct = totalEvaluated > 0 ? Math.round((needsExpense / totalEvaluated) * 100) : 0;
  const wantsPct = totalEvaluated > 0 ? Math.round((wantsExpense / totalEvaluated) * 100) : 0;
  const savingsPct = totalEvaluated > 0 ? Math.round((savingsExpense / totalEvaluated) * 100) : 0;

  // Handle Save New Goal
  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const targetVal = parseFloat(goalTargetAmount.replace(/[^0-9]/g, ''));
    const currentVal = parseFloat(goalCurrentAmount.replace(/[^0-9]/g, '')) || 0;

    if (!goalTitle.trim() || !targetVal) return;

    onAddGoal({
      title: goalTitle.trim(),
      targetAmount: targetVal,
      currentAmount: currentVal,
      targetDate: goalDate || undefined,
      category: goalCategory,
      color: goalColor,
    });

    setGoalTitle('');
    setGoalTargetAmount('');
    setGoalCurrentAmount('');
    setGoalDate('');
    setIsAddGoalModalOpen(false);
  };

  // Handle Allocate Savings to Goal
  const handleAllocateSavings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal) return;
    const addedAmount = parseFloat(allocateAmount.replace(/[^0-9]/g, ''));
    if (!addedAmount || addedAmount <= 0) return;

    const updated: FinancialGoal = {
      ...selectedGoal,
      currentAmount: Math.min(selectedGoal.targetAmount, selectedGoal.currentAmount + addedAmount),
    };

    onUpdateGoal(updated);
    setAllocateAmount('');
    setSelectedGoal(null);
    setIsAllocateModalOpen(false);
  };

  // Handle Copy / Share WhatsApp Report
  const handleCopyWhatsAppReport = () => {
    const text = `📊 *Laporan Keuangan ChatKeuangan AI*\n📅 Periode: ${formatDateIndo(now.toISOString().split('T')[0])}\n\n💰 *Total Saldo Aktif:* ${formatRupiah(initialBalance + transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0) - transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0))}\n🟢 *Pemasukan Bulan Ini:* +${formatRupiah(monthIncome)}\n🔴 *Pengeluaran Bulan Ini:* -${formatRupiah(monthExpense)}\n✨ *Arus Kas Bersih:* ${monthIncome - monthExpense >= 0 ? '+' : ''}${formatRupiah(monthIncome - monthExpense)}\n🎯 *Batas Anggaran:* ${formatRupiah(monthlyBudget)} (Terpakai ${budgetUsedPct}%)\n💡 *Sisa Anggaran Aman:* ${budgetRemaining >= 0 ? formatRupiah(budgetRemaining) : 'Defisit ' + formatRupiah(Math.abs(budgetRemaining))}\n\n_Dikelola dengan ChatKeuangan AI_`;

    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  // Handle Export Full Backup
  const handleExportFullBackup = () => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      initialBalance,
      monthlyBudget,
      transactions,
      goals,
    };
    exportToJSON(`chatkeuangan-backup-${now.toISOString().split('T')[0]}.json`, backupData);
  };

  // Handle Import JSON
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && (parsed.transactions || parsed.goals || parsed.initialBalance !== undefined)) {
          onImportAppData(parsed);
          alert('Data cadangan berhasil dipulihkan!');
        } else {
          alert('Format berkas tidak sesuai cadangan ChatKeuangan AI.');
        }
      } catch (err) {
        alert('Gagal membaca berkas JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 w-full max-w-full min-w-0 overflow-x-hidden">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-700 via-emerald-700 to-cyan-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold mb-3">
              <Target className="w-3.5 h-3.5 text-emerald-300" />
              <span>Target Impian & Anggaran Pintar</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Kelola Target Tabungan & Anggaran
            </h1>
            <p className="text-emerald-100/90 text-sm mt-1 max-w-xl">
              Rencanakan tujuan keuangan Anda, pantau batas pengeluaran bulanan, dan evaluasi kaidah finansial 50/30/20.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsAddGoalModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl text-xs font-bold shadow-md transition"
            >
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>Tambah Target Impian</span>
            </button>

            <button
              onClick={handleCopyWhatsAppReport}
              className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-emerald-900/60 hover:bg-emerald-900/80 text-white rounded-xl text-xs font-semibold backdrop-blur-sm border border-emerald-500/30 transition"
              title="Salin ringkasan keuangan untuk dibagikan ke WhatsApp"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-300" /> : <Share2 className="w-4 h-4" />}
              <span>{isCopied ? 'Tersalin!' : 'Bagikan ke WA'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Monthly Budget Meter Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${
                budgetUsedPct > 90
                  ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60'
                  : budgetUsedPct > 70
                  ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/60'
                  : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60'
              }`}
            >
              <PiggyBank className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Batas Anggaran Pengeluaran Bulanan
                </h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    budgetUsedPct > 90
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                      : budgetUsedPct > 70
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}
                >
                  {budgetUsedPct > 90 ? 'Mendekati / Melebihi Batas' : budgetUsedPct > 70 ? 'Waspada' : 'Aman'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Pengeluaran bulan ini: <strong className="text-slate-800 dark:text-slate-200">{formatRupiah(monthExpense)}</strong> dari batas <strong className="text-slate-800 dark:text-slate-200">{formatRupiah(monthlyBudget)}</strong> ({budgetUsedPct}% terpakai).
              </p>
            </div>
          </div>

          <div>
            {isEditingBudget ? (
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={tempBudget}
                  onChange={e => setTempBudget(e.target.value)}
                  className="w-36 px-3 py-1.5 text-xs font-bold bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                  placeholder="Misal: 4000000"
                  autoFocus
                />
                <button
                  onClick={() => {
                    const val = parseFloat(tempBudget.replace(/[^0-9]/g, ''));
                    if (!isNaN(val) && val > 0) onUpdateMonthlyBudget(val);
                    setIsEditingBudget(false);
                  }}
                  className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition"
                  title="Simpan"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsEditingBudget(false)}
                  className="p-2 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition"
                  title="Batal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setTempBudget(monthlyBudget.toString());
                  setIsEditingBudget(true);
                }}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                Ubah Batas Anggaran
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              style={{ width: `${Math.min(100, budgetUsedPct)}%` }}
              className={`h-full rounded-full transition-all duration-700 ${
                budgetUsedPct > 90
                  ? 'bg-rose-500'
                  : budgetUsedPct > 70
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
            <span>
              Sisa Anggaran: <strong className={budgetRemaining >= 0 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-600 font-bold'}>{budgetRemaining >= 0 ? formatRupiah(budgetRemaining) : 'Defisit ' + formatRupiah(Math.abs(budgetRemaining))}</strong>
            </span>
            <span>
              Rata-rata aman harian ({daysLeft} hari tersisa): <strong className="text-slate-800 dark:text-slate-200 font-bold">{formatRupiah(dailySafeSpend)} / hari</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Kaidah Finansial 50/30/20 & Backup Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kaidah Finansial 50/30/20 (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center space-x-2">
            <PieChart className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Evaluasi Kaidah Finansial 50/30/20
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Formula ideal pengelolaan dana: <strong>50%</strong> Kebutuhan Pokok, <strong>30%</strong> Keinginan/Gaya Hidup, dan <strong>20%</strong> Tabungan/Investasi.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {/* Needs */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/70 dark:border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Kebutuhan (50%)</span>
                <span className="font-bold text-indigo-600">{needsPct}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div style={{ width: `${Math.min(100, needsPct)}%` }} className="h-full bg-indigo-500 rounded-full" />
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                {formatRupiah(needsExpense)}
              </div>
              <span className="text-[10px] text-slate-400 block">Pangan, tempat tinggal, transportasi, tagihan</span>
            </div>

            {/* Wants */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/70 dark:border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Keinginan (30%)</span>
                <span className="font-bold text-amber-600">{wantsPct}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div style={{ width: `${Math.min(100, wantsPct)}%` }} className="h-full bg-amber-500 rounded-full" />
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                {formatRupiah(wantsExpense)}
              </div>
              <span className="text-[10px] text-slate-400 block">Hiburan, belanja pribadi, nongkrong</span>
            </div>

            {/* Savings */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/70 dark:border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Tabungan (20%)</span>
                <span className="font-bold text-emerald-600">{savingsPct}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div style={{ width: `${Math.min(100, savingsPct)}%` }} className="h-full bg-emerald-500 rounded-full" />
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                {formatRupiah(savingsExpense)}
              </div>
              <span className="text-[10px] text-slate-400 block">Surplus arus kas untuk tabungan & tujuan impian</span>
            </div>
          </div>
        </div>

        {/* Backup & Restore (1 col) - Very important for Vercel */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Download className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Cadangan Data (Backup & Restore)
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Sangat berguna saat aplikasi di-deploy ke <strong>Vercel</strong>. Unduh seluruh data keuangan ke berkas JSON atau pulihkan data kapan saja di perangkat lain.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={handleExportFullBackup}
              className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Cadangan Lengkap (.json)</span>
            </button>

            <label className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer transition">
              <Upload className="w-3.5 h-3.5 text-cyan-600" />
              <span>Pulihkan dari Berkas JSON</span>
              <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {/* Financial Goals Cards Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Target Impian Finansial ({goals.length})
            </h3>
          </div>
          <button
            onClick={() => setIsAddGoalModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Target Baru</span>
          </button>
        </div>

        {goals.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
            <Target className="w-10 h-10 text-slate-400 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Belum ada target impian yang dibuat
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Tetapkan target seperti Dana Darurat, Beli Rumah, atau Liburan untuk memotivasi pengelolaan keuangan Anda.
            </p>
            <button
              onClick={() => setIsAddGoalModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl"
            >
              Buat Target Pertama
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map(goal => {
              const progressPct =
                goal.targetAmount > 0
                  ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
                  : 0;
              const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
              const isAchieved = goal.currentAmount >= goal.targetAmount;

              return (
                <div
                  key={goal.id}
                  className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-300 dark:hover:border-slate-700 transition"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                          <Target className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {goal.title}
                          </h4>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {goal.category || 'Tabungan'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (confirm(`Hapus target "${goal.title}"?`)) {
                            onDeleteGoal(goal.id);
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded"
                        title="Hapus Target"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Progress Numbers */}
                    <div className="mt-4 flex justify-between items-baseline">
                      <div>
                        <div className="text-[11px] text-slate-400">Terkumpul</div>
                        <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                          {formatRupiah(goal.currentAmount)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] text-slate-400">Target</div>
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {formatRupiah(goal.targetAmount)}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mt-2">
                      <div
                        style={{ width: `${progressPct}%` }}
                        className={`h-full rounded-full transition-all duration-700 ${
                          isAchieved ? 'bg-emerald-500' : 'bg-cyan-500'
                        }`}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                      <span>{progressPct}% Tercapai</span>
                      <span>{isAchieved ? '🎉 Selesai!' : `Kurang ${formatRupiah(remaining)}`}</span>
                    </div>

                    {goal.targetDate && (
                      <div className="flex items-center space-x-1 text-[10px] text-slate-400 mt-2">
                        <Calendar className="w-3 h-3" />
                        <span>Target: {formatDateIndo(goal.targetDate)}</span>
                      </div>
                    )}
                  </div>

                  {/* Action button */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => {
                        setSelectedGoal(goal);
                        setIsAllocateModalOpen(true);
                      }}
                      className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
                    >
                      <PiggyBank className="w-3.5 h-3.5 text-emerald-600" />
                      <span>+ Tabung ke Target Ini</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Add Goal */}
      {isAddGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Buat Target Impian Baru
              </h3>
              <button onClick={() => setIsAddGoalModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Target Impian
                </label>
                <input
                  type="text"
                  value={goalTitle}
                  onChange={e => setGoalTitle(e.target.value)}
                  placeholder="Misal: Dana Darurat, Beli Motor, Umroh"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Nominal (Rp)
                  </label>
                  <input
                    type="number"
                    value={goalTargetAmount}
                    onChange={e => setGoalTargetAmount(e.target.value)}
                    placeholder="Contoh: 10000000"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Dana Awal Terkumpul
                  </label>
                  <input
                    type="number"
                    value={goalCurrentAmount}
                    onChange={e => setGoalCurrentAmount(e.target.value)}
                    placeholder="Contoh: 1000000"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Tanggal Tercapai
                </label>
                <input
                  type="date"
                  value={goalDate}
                  onChange={e => setGoalDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kategori Target
                </label>
                <select
                  value={goalCategory}
                  onChange={e => setGoalCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                >
                  <option value="Tabungan">Tabungan / Dana Darurat</option>
                  <option value="Investasi">Investasi Jangka Panjang</option>
                  <option value="Kendaraan">Kendaraan / Transportasi</option>
                  <option value="Elektronik">Gadget & Elektronik</option>
                  <option value="Tempat Tinggal">Rumah / Properti</option>
                  <option value="Liburan">Liburan / Wisata</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddGoalModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs"
                >
                  Simpan Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Allocate Savings */}
      {isAllocateModalOpen && selectedGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Tabung ke {selectedGoal.title}
              </h3>
              <button onClick={() => setIsAllocateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Terkumpul saat ini: {formatRupiah(selectedGoal.currentAmount)} dari target {formatRupiah(selectedGoal.targetAmount)}.
            </p>

            <form onSubmit={handleAllocateSavings} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nominal yang Ditabung (Rp)
                </label>
                <input
                  type="number"
                  value={allocateAmount}
                  onChange={e => setAllocateAmount(e.target.value)}
                  placeholder="Contoh: 500000"
                  className="w-full px-3 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                  autoFocus
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAllocateModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs"
                >
                  Setor Tabungan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
