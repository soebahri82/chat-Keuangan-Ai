import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  FolderPlus,
  Edit2,
  Check,
  X,
  Wallet,
  Settings,
  RotateCcw,
  Sparkles,
  ArrowDownLeft,
  ArrowUpRight,
  Bookmark,
} from 'lucide-react';
import { Category, TransactionType, UserPreferences } from '../types';
import { formatRupiah } from '../utils/formatters';
import { getCategoryColorClasses } from '../utils/categoryIcons';

interface CategoriesViewProps {
  categories: Category[];
  onAddCategory: (category: Omit<Category, 'id'>) => void;
  onDeleteCategory: (id: string) => void;
  initialBalance: number;
  onUpdateInitialBalance: (val: number) => void;
  userPreferences: UserPreferences;
  onResetAllData: () => void;
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({
  categories,
  onAddCategory,
  onDeleteCategory,
  initialBalance,
  onUpdateInitialBalance,
  userPreferences,
  onResetAllData,
}) => {
  const [activeTab, setActiveTab] = useState<TransactionType>('expense');
  const [isAdding, setIsAdding] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('emerald');
  const [newCatType, setNewCatType] = useState<TransactionType>('expense');

  // Initial balance edit
  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [tempBalance, setTempBalance] = useState(initialBalance.toString());

  const colors = [
    'emerald',
    'teal',
    'cyan',
    'blue',
    'amber',
    'orange',
    'rose',
    'red',
    'yellow',
    'purple',
    'pink',
    'slate',
  ];

  const filteredCategories = categories.filter(c => c.type === activeTab);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    onAddCategory({
      name: newCatName.trim(),
      type: newCatType,
      icon: newCatType === 'income' ? 'Coins' : 'ShoppingBag',
      color: newCatColor,
      isCustom: true,
    });

    setNewCatName('');
    setIsAdding(false);
  };

  const handleSaveBalance = () => {
    const val = parseFloat(tempBalance.replace(/[^0-9]/g, ''));
    if (!isNaN(val)) {
      onUpdateInitialBalance(val);
    }
    setIsEditingBalance(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          Pengaturan Kategori & Saldo
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Kelola kategori pemasukan & pengeluaran yang digunakan oleh AI, serta atur saldo awal Anda.
        </p>
      </div>

      {/* Saldo Awal Card */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Saldo Awal Dompet / Rekening
              </span>
              <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                {formatRupiah(initialBalance)}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Total saldo aktif dihitung dari: Saldo Awal + Seluruh Pemasukan - Seluruh Pengeluaran.
              </p>
            </div>
          </div>

          <div>
            {isEditingBalance ? (
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={tempBalance}
                  onChange={e => setTempBalance(e.target.value)}
                  className="w-36 px-3 py-1.5 text-xs font-bold bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                  placeholder="Contoh: 2500000"
                  autoFocus
                />
                <button
                  onClick={handleSaveBalance}
                  className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition"
                  title="Simpan"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsEditingBalance(false)}
                  className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl hover:bg-slate-200 transition"
                  title="Batal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setTempBalance(initialBalance.toString());
                  setIsEditingBalance(true);
                }}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                Ubah Saldo Awal
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category Management Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Tab Selector */}
          <div className="flex items-center space-x-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
            <button
              onClick={() => {
                setActiveTab('expense');
                setNewCatType('expense');
              }}
              className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'expense'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Kategori Pengeluaran ({categories.filter(c => c.type === 'expense').length})</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('income');
                setNewCatType('income');
              }}
              className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'income'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Kategori Pemasukan ({categories.filter(c => c.type === 'income').length})</span>
            </button>
          </div>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 transition shadow-xs w-fit"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Kategori Baru</span>
          </button>
        </div>

        {/* Add Category Form */}
        {isAdding && (
          <form
            onSubmit={handleAddSubmit}
            className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3"
          >
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Tambah Kategori {activeTab === 'income' ? 'Pemasukan' : 'Pengeluaran'} Baru
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Nama Kategori
                </label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  placeholder="Contoh: Skincare & Perawatan"
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Warna Label
                </label>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {colors.map(col => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setNewCatColor(col)}
                      className={`w-6 h-6 rounded-full border-2 transition ${
                        newCatColor === col ? 'border-slate-900 dark:border-white scale-110' : 'border-transparent'
                      } ${getCategoryColorClasses(col).bg}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-xs"
              >
                Simpan Kategori
              </button>
            </div>
          </form>
        )}

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {filteredCategories.map(cat => {
            const colorCls = getCategoryColorClasses(cat.color);

            return (
              <div
                key={cat.id}
                className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shadow-2xs hover:border-emerald-300 dark:hover:border-slate-700 transition"
              >
                <div className="flex items-center space-x-2.5">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${colorCls.bg}`}
                  >
                    {cat.name.charAt(0)}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                      {cat.name}
                    </h5>
                    <span className="text-[10px] text-slate-400">
                      {cat.isCustom ? 'Kustom' : 'Bawaan AI'}
                    </span>
                  </div>
                </div>

                {cat.isCustom && (
                  <button
                    onClick={() => {
                      if (confirm(`Hapus kategori "${cat.name}"?`)) {
                        onDeleteCategory(cat.id);
                      }
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                    title="Hapus kategori"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Keyword Learning & Data Reset Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center space-x-2.5">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Pembelajaran Preferensi AI
          </h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          AI secara otomatis mempelajari kebiasaan pencatatan Anda. Jika Anda mencatat kata kunci tertentu ke kategori spesifik, AI akan otomatis mengasosiasikannya di chat berikutnya.
        </p>

        <div className="flex flex-wrap gap-2 pt-1">
          {Object.entries(userPreferences.categoryKeywordMap || {}).map(([word, catName]) => (
            <div
              key={word}
              className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs"
            >
              <span className="font-semibold text-slate-800 dark:text-slate-200">"{word}"</span>
              <span className="text-slate-400">&rarr;</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">{catName}</span>
            </div>
          ))}
        </div>

        {/* Danger zone / Reset Data */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h5 className="text-xs font-bold text-rose-600 dark:text-rose-400">
              Reset Data Sampel
            </h5>
            <p className="text-[11px] text-slate-400">
              Kembalikan ke data awal bawaan jika Anda ingin memulai ulang.
            </p>
          </div>
          <button
            onClick={() => {
              if (
                confirm(
                  'Apakah Anda yakin ingin mereset seluruh data kembali ke kondisi default?'
                )
              ) {
                onResetAllData();
              }
            }}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 rounded-xl transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset ke Data Sampel</span>
          </button>
        </div>
      </div>
    </div>
  );
};
