import React, { useState, useEffect } from 'react';
import {
  Transaction,
  Category,
  ChatMessage,
  UserPreferences,
  TransactionProposal,
  FinancialGoal,
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_EXPENSE_CATEGORIES,
  INITIAL_SEED_TRANSACTIONS,
  DEFAULT_GOALS,
  AppData,
} from './types';
import { Navbar, ActiveTab } from './components/Navbar';
import { ChatView } from './components/ChatView';
import { DashboardView } from './components/DashboardView';
import { GoalsView } from './components/GoalsView';
import { TransactionsView } from './components/TransactionsView';
import { CategoriesView } from './components/CategoriesView';
import { TransactionModal } from './components/TransactionModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { fetchAppData, saveAppData, resetAppData } from './services/api';

const LOCAL_STORAGE_KEY = 'chatkeuangan_ai_state_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');

  // App Core State
  const [initialBalance, setInitialBalance] = useState<number>(2500000);
  const [monthlyBudget, setMonthlyBudget] = useState<number>(4000000);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_SEED_TRANSACTIONS);
  const [goals, setGoals] = useState<FinancialGoal[]>(DEFAULT_GOALS);
  const [categories, setCategories] = useState<Category[]>([
    ...DEFAULT_INCOME_CATEGORIES,
    ...DEFAULT_EXPENSE_CATEGORIES,
  ]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: 'Halo! Saya asisten ChatKeuangan AI Anda. Anda cukup mengetik pengeluaran atau pemasukan dengan bahasa sehari-hari, contohnya:\n\n• "Beli bensin 50 ribu"\n• "Makan siang 25 ribu dan kopi 15 ribu"\n• "Terima gaji 5 juta"\n• "Berapa sisa uang saya bulan ini?"\n\nSilakan coba ketik transaksi Anda di bawah atau klik salah satu saran cepat!',
      timestamp: new Date().toISOString(),
      intent: 'general',
    },
  ]);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    categoryKeywordMap: {
      bensin: 'Transportasi dan bensin',
      pertamax: 'Transportasi dan bensin',
      makan: 'Makanan dan minuman',
      kopi: 'Makanan dan minuman',
      gaji: 'Gaji',
      listrik: 'Tagihan listrik, air, dan internet',
      pulsa: 'Tagihan listrik, air, dan internet',
    },
  });

  // Modal State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Load Initial State from Server or LocalStorage
  useEffect(() => {
    async function loadData() {
      try {
        const serverData = await fetchAppData();
        if (serverData && serverData.transactions && serverData.transactions.length > 0) {
          if (serverData.initialBalance !== undefined) setInitialBalance(serverData.initialBalance);
          if (serverData.monthlyBudget !== undefined) setMonthlyBudget(serverData.monthlyBudget);
          if (serverData.transactions) setTransactions(serverData.transactions);
          if (serverData.goals) setGoals(serverData.goals);
          if (serverData.categories && serverData.categories.length > 0) {
            setCategories(serverData.categories);
          }
          if (serverData.messages && serverData.messages.length > 0) {
            setMessages(serverData.messages);
          }
          if (serverData.preferences) setUserPreferences(serverData.preferences);
          return;
        }
      } catch (err) {
        console.warn('Could not load from server, checking localStorage:', err);
      }

      // Local storage fallback
      try {
        const local = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (local) {
          const parsed = JSON.parse(local);
          if (parsed.initialBalance !== undefined) setInitialBalance(parsed.initialBalance);
          if (parsed.monthlyBudget !== undefined) setMonthlyBudget(parsed.monthlyBudget);
          if (parsed.transactions) setTransactions(parsed.transactions);
          if (parsed.goals) setGoals(parsed.goals);
          if (parsed.categories) setCategories(parsed.categories);
          if (parsed.messages) setMessages(parsed.messages);
          if (parsed.preferences) setUserPreferences(parsed.preferences);
        }
      } catch (err) {
        console.error('Error loading localStorage:', err);
      }
    }

    loadData();
  }, []);

  // Sync state whenever changes occur
  useEffect(() => {
    const payload = {
      initialBalance,
      monthlyBudget,
      transactions,
      goals,
      categories,
      messages,
      preferences: userPreferences,
    };
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
    // Also sync to server in background
    saveAppData(payload);
  }, [initialBalance, monthlyBudget, transactions, goals, categories, messages, userPreferences]);

  // Handle saving transaction proposals confirmed in chat
  const handleSaveTransactions = (proposals: TransactionProposal[]) => {
    const newTxs: Transaction[] = proposals.map((p, idx) => ({
      id: 'tx-' + Date.now() + '-' + idx,
      type: p.type,
      amount: p.amount,
      category: p.category,
      description: p.description,
      date: p.date,
      createdAt: new Date().toISOString(),
      notes: p.notes,
    }));

    setTransactions(prev => [...newTxs, ...prev]);

    // Learn keywords
    const updatedMap = { ...userPreferences.categoryKeywordMap };
    proposals.forEach(p => {
      const words = p.description.toLowerCase().split(/\s+/);
      words.forEach(w => {
        if (w.length > 3 && !['tadi', 'saya', 'beli', 'bayar', 'buat', 'pada'].includes(w)) {
          updatedMap[w] = p.category;
        }
      });
    });
    setUserPreferences(prev => ({
      ...prev,
      categoryKeywordMap: updatedMap,
    }));
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleUpdateTransaction = (updated: Transaction) => {
    setTransactions(prev => prev.map(t => (t.id === updated.id ? updated : t)));
  };

  const handleSaveManualModal = (data: Omit<Transaction, 'id' | 'createdAt'> & { id?: string }) => {
    if (data.id) {
      // Edit
      setTransactions(prev =>
        prev.map(t =>
          t.id === data.id
            ? {
                ...t,
                type: data.type,
                amount: data.amount,
                category: data.category,
                description: data.description,
                date: data.date,
                notes: data.notes,
              }
            : t
        )
      );
    } else {
      // Create new
      const newTx: Transaction = {
        id: 'tx-manual-' + Date.now(),
        type: data.type,
        amount: data.amount,
        category: data.category,
        description: data.description,
        date: data.date,
        createdAt: new Date().toISOString(),
        notes: data.notes,
      };
      setTransactions(prev => [newTx, ...prev]);
    }
  };

  const handleAddGoal = (newGoal: Omit<FinancialGoal, 'id'>) => {
    const goal: FinancialGoal = {
      ...newGoal,
      id: 'goal-' + Date.now(),
    };
    setGoals(prev => [goal, ...prev]);
  };

  const handleUpdateGoal = (updated: FinancialGoal) => {
    setGoals(prev => prev.map(g => (g.id === updated.id ? updated : g)));
  };

  const handleDeleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const handleImportAppData = (imported: Partial<AppData>) => {
    if (imported.initialBalance !== undefined) setInitialBalance(imported.initialBalance);
    if (imported.monthlyBudget !== undefined) setMonthlyBudget(imported.monthlyBudget);
    if (imported.transactions && Array.isArray(imported.transactions)) setTransactions(imported.transactions);
    if (imported.categories && Array.isArray(imported.categories)) setCategories(imported.categories);
    if (imported.goals && Array.isArray(imported.goals)) setGoals(imported.goals);
    if (imported.preferences) setUserPreferences(imported.preferences);
  };

  const handleAddCategory = (newCat: Omit<Category, 'id'>) => {
    const cat: Category = {
      ...newCat,
      id: 'cat-custom-' + Date.now(),
    };
    setCategories(prev => [...prev, cat]);
  };

  const handleDeleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const handleResetAllData = async () => {
    try {
      await resetAppData();
    } catch {
      // fallback
    }
    setInitialBalance(2500000);
    setMonthlyBudget(4000000);
    setTransactions(INITIAL_SEED_TRANSACTIONS);
    setGoals(DEFAULT_GOALS);
    setCategories([...DEFAULT_INCOME_CATEGORIES, ...DEFAULT_EXPENSE_CATEGORIES]);
    setMessages([
      {
        id: 'msg-welcome',
        sender: 'assistant',
        text: 'Halo! Saya asisten ChatKeuangan AI Anda. Anda cukup mengetik pengeluaran atau pemasukan dengan bahasa sehari-hari, contohnya:\n\n• "Beli bensin 50 ribu"\n• "Makan siang 25 ribu dan kopi 15 ribu"\n• "Terima gaji 5 juta"\n• "Berapa sisa uang saya bulan ini?"\n\nSilakan coba ketik transaksi Anda di bawah atau klik salah satu saran cepat!',
        timestamp: new Date().toISOString(),
        intent: 'general',
      },
    ]);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  // Calculations for Navbar preview
  const currentMonth = new Date().toISOString().slice(0, 7);
  const totalIncomeAll = transactions
    .filter(t => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);
  const totalExpenseAll = transactions
    .filter(t => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);
  const totalBalance = initialBalance + totalIncomeAll - totalExpenseAll;

  const totalIncomeMonth = transactions
    .filter(t => t.type === 'income' && t.date.startsWith(currentMonth))
    .reduce((s, t) => s + t.amount, 0);
  const totalExpenseMonth = transactions
    .filter(t => t.type === 'expense' && t.date.startsWith(currentMonth))
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased flex flex-col w-full max-w-full overflow-x-hidden">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalBalance={totalBalance}
        totalIncomeMonth={totalIncomeMonth}
        totalExpenseMonth={totalExpenseMonth}
        onOpenManualModal={() => {
          setEditingTransaction(null);
          setIsManualModalOpen(true);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-full overflow-x-hidden min-w-0">
        {activeTab === 'chat' && (
          <ChatView
            messages={messages}
            setMessages={setMessages}
            transactions={transactions}
            onSaveTransactions={handleSaveTransactions}
            onDeleteTransaction={handleDeleteTransaction}
            onUpdateTransaction={handleUpdateTransaction}
            categories={categories}
            userPreferences={userPreferences}
            initialBalance={initialBalance}
            monthlyBudget={monthlyBudget}
            onNavigateToTransactions={() => setActiveTab('transactions')}
            onNavigateToDashboard={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardView
            initialBalance={initialBalance}
            transactions={transactions}
            categories={categories}
            onNavigateToTransactions={() => setActiveTab('transactions')}
            onNavigateToChat={() => setActiveTab('chat')}
          />
        )}

        {activeTab === 'goals' && (
          <GoalsView
            goals={goals}
            onAddGoal={handleAddGoal}
            onUpdateGoal={handleUpdateGoal}
            onDeleteGoal={handleDeleteGoal}
            monthlyBudget={monthlyBudget}
            onUpdateMonthlyBudget={setMonthlyBudget}
            transactions={transactions}
            initialBalance={initialBalance}
            onImportAppData={handleImportAppData}
            onNavigateToChat={() => setActiveTab('chat')}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsView
            transactions={transactions}
            categories={categories}
            onEditTransaction={tx => {
              setEditingTransaction(tx);
              setIsManualModalOpen(true);
            }}
            onDeleteTransaction={handleDeleteTransaction}
            onOpenManualModal={() => {
              setEditingTransaction(null);
              setIsManualModalOpen(true);
            }}
            onNavigateToChat={() => setActiveTab('chat')}
          />
        )}

        {activeTab === 'categories' && (
          <CategoriesView
            categories={categories}
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategory}
            initialBalance={initialBalance}
            onUpdateInitialBalance={setInitialBalance}
            userPreferences={userPreferences}
            onResetAllData={handleResetAllData}
          />
        )}
      </main>

      {/* Elegant Footer */}
      <footer className="mt-auto border-t border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md py-3 px-4 transition-colors z-30 w-full max-w-full overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
            <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 flex items-center justify-center text-white text-[10px] font-bold shadow-xs">
              CK
            </div>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              ChatKeuangan AI
            </span>
            <span className="hidden sm:inline text-slate-400 dark:text-slate-500">•</span>
            <span className="hidden sm:inline text-slate-500 dark:text-slate-400">
              Asisten Pencatatan Keuangan Pintar
            </span>
          </div>

          <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-400">
            <span>Created By</span>
            <a
              href="mailto:soebahri82@gmail.com"
              title="Kirim email ke soebahri82@gmail.com"
              className="inline-flex items-center space-x-1 font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline transition"
            >
              <span>@soebahri82</span>
            </a>
          </div>
        </div>
      </footer>

      {/* Manual / Edit Transaction Modal */}
      <TransactionModal
        isOpen={isManualModalOpen}
        onClose={() => {
          setIsManualModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveManualModal}
        initialData={editingTransaction}
        categories={categories}
      />

      {/* Offline Status Toast */}
      <OfflineIndicator />
    </div>
  );
}
