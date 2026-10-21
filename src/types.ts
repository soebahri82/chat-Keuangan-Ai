export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string; // YYYY-MM-DD
  createdAt: string; // ISO
  notes?: string;
  sourceMessageId?: string;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  isCustom?: boolean;
}

export interface TransactionProposal {
  tempId: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string; // YYYY-MM-DD
  notes?: string;
  confidence: 'high' | 'ambiguous';
  status: 'pending' | 'saved' | 'cancelled';
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  intent?: 'record' | 'clarify' | 'query' | 'modify' | 'general';
  proposals?: TransactionProposal[];
  confirmedCount?: number;
  clarificationPrompt?: string;
  deletedTransactionId?: string;
  editedTransactionId?: string;
  metadata?: {
    incomeTotal?: number;
    expenseTotal?: number;
    netTotal?: number;
    quickStats?: { label: string; value: string }[];
  };
}

export interface UserPreferences {
  categoryKeywordMap: Record<string, string>;
  monthlyBudget?: number;
}

export interface FinancialGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  category?: string;
  color: string;
  icon?: string;
}

export interface AppData {
  initialBalance: number;
  monthlyBudget: number;
  transactions: Transaction[];
  categories: Category[];
  messages: ChatMessage[];
  preferences: UserPreferences;
  goals: FinancialGoal[];
}

export const DEFAULT_GOALS: FinancialGoal[] = [
  {
    id: 'goal-1',
    title: 'Dana Darurat 6 Bulan',
    targetAmount: 15000000,
    currentAmount: 6500000,
    targetDate: '2026-12-31',
    category: 'Tabungan',
    color: 'emerald',
    icon: 'ShieldCheck',
  },
  {
    id: 'goal-2',
    title: 'Beli Laptop Baru',
    targetAmount: 12000000,
    currentAmount: 7200000,
    targetDate: '2026-11-30',
    category: 'Elektronik',
    color: 'cyan',
    icon: 'Laptop',
  },
  {
    id: 'goal-3',
    title: 'Liburan Akhir Tahun',
    targetAmount: 5000000,
    currentAmount: 2500000,
    targetDate: '2026-12-25',
    category: 'Liburan',
    color: 'amber',
    icon: 'Plane',
  },
];

export const DEFAULT_INCOME_CATEGORIES: Category[] = [
  { id: 'inc-1', name: 'Gaji', type: 'income', icon: 'Briefcase', color: 'emerald' },
  { id: 'inc-2', name: 'Usaha', type: 'income', icon: 'Store', color: 'teal' },
  { id: 'inc-3', name: 'Bonus dan lembur', type: 'income', icon: 'Sparkles', color: 'cyan' },
  { id: 'inc-4', name: 'Hasil investasi', type: 'income', icon: 'TrendingUp', color: 'blue' },
  { id: 'inc-5', name: 'Transfer masuk', type: 'income', icon: 'ArrowDownLeft', color: 'indigo' },
  { id: 'inc-6', name: 'Hadiah', type: 'income', icon: 'Gift', color: 'purple' },
  { id: 'inc-7', name: 'Pendapatan lainnya', type: 'income', icon: 'Coins', color: 'slate' },
];

export const DEFAULT_EXPENSE_CATEGORIES: Category[] = [
  { id: 'exp-1', name: 'Makanan dan minuman', type: 'expense', icon: 'Utensils', color: 'amber' },
  { id: 'exp-2', name: 'Transportasi dan bensin', type: 'expense', icon: 'Car', color: 'orange' },
  { id: 'exp-3', name: 'Belanja rumah tangga', type: 'expense', icon: 'ShoppingBag', color: 'rose' },
  { id: 'exp-4', name: 'Tagihan listrik, air, dan internet', type: 'expense', icon: 'Zap', color: 'yellow' },
  { id: 'exp-5', name: 'Pendidikan', type: 'expense', icon: 'GraduationCap', color: 'violet' },
  { id: 'exp-6', name: 'Kesehatan', type: 'expense', icon: 'HeartPulse', color: 'red' },
  { id: 'exp-7', name: 'Tempat tinggal', type: 'expense', icon: 'Home', color: 'indigo' },
  { id: 'exp-8', name: 'Cicilan dan utang', type: 'expense', icon: 'CreditCard', color: 'pink' },
  { id: 'exp-9', name: 'Hiburan', type: 'expense', icon: 'Gamepad2', color: 'fuchsia' },
  { id: 'exp-10', name: 'Belanja pribadi', type: 'expense', icon: 'Shirt', color: 'sky' },
  { id: 'exp-11', name: 'Transfer keluar', type: 'expense', icon: 'ArrowUpRight', color: 'slate' },
  { id: 'exp-12', name: 'Donasi', type: 'expense', icon: 'HandHeart', color: 'lime' },
  { id: 'exp-13', name: 'Pengeluaran lainnya', type: 'expense', icon: 'MoreHorizontal', color: 'zinc' },
];

export const INITIAL_SEED_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-seed-1',
    type: 'income',
    amount: 5000000,
    category: 'Gaji',
    description: 'Gaji bulanan',
    date: new Date().toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
  },
  {
    id: 'tx-seed-2',
    type: 'expense',
    amount: 50000,
    category: 'Transportasi dan bensin',
    description: 'Beli bensin Pertamax',
    date: new Date().toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'tx-seed-3',
    type: 'expense',
    amount: 35000,
    category: 'Makanan dan minuman',
    description: 'Makan siang nasi padang dan es teh',
    date: new Date().toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
  {
    id: 'tx-seed-4',
    type: 'expense',
    amount: 350000,
    category: 'Tagihan listrik, air, dan internet',
    description: 'Bayar token listrik PLN',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'tx-seed-5',
    type: 'income',
    amount: 750000,
    category: 'Transfer masuk',
    description: 'Transfer masuk dari Budi pelunasan project',
    date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];
