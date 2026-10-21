import { AppData, ChatMessage, Transaction, Category, UserPreferences, TransactionProposal } from '../types';
import { parseIndonesianFinancialMessage } from '../utils/localFinanceParser';

export interface ChatResponse {
  replyText: string;
  intent: 'record' | 'clarify' | 'query' | 'modify' | 'general';
  proposals: TransactionProposal[];
  clarificationPrompt?: string;
  modifyAction?: {
    action: 'delete' | 'update' | 'none';
    targetDescription?: string;
    targetTransactionId?: string;
    updatedAmount?: number;
    updatedCategory?: string;
  };
  quickStats?: { label: string; value: string }[];
}

export async function sendMessageToAI(payload: {
  message: string;
  history: ChatMessage[];
  transactions: Transaction[];
  categories: Category[];
  userPreferences: UserPreferences;
  currentDate: string;
  initialBalance: number;
  monthlyBudget?: number;
}): Promise<ChatResponse> {
  // Use AbortController for guaranteed fast response
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data && data.replyText) {
        return data;
      }
    }
  } catch (err: any) {
    console.warn('Backend /api/chat slow or offline, using instant local engine:', err?.message || err);
  } finally {
    clearTimeout(timeoutId);
  }

  // Instant local parsing fallback (< 10ms)
  return parseIndonesianFinancialMessage(payload.message, {
    currentDate: payload.currentDate,
    transactions: payload.transactions,
    categories: payload.categories,
    userPreferences: payload.userPreferences,
    initialBalance: payload.initialBalance,
    monthlyBudget: payload.monthlyBudget,
  });
}

export async function fetchAppData(): Promise<Partial<AppData>> {
  try {
    const res = await fetch('/api/data');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Could not fetch server data, falling back to local storage:', err);
  }
  return {};
}

export async function saveAppData(data: Partial<AppData>): Promise<void> {
  try {
    await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch (err) {
    console.warn('Failed to sync to server storage:', err);
  }
}

export async function resetAppData(): Promise<AppData> {
  const res = await fetch('/api/reset-data', { method: 'POST' });
  if (!res.ok) throw new Error('Gagal mereset data');
  const json = await res.json();
  return json.data;
}
