import express from 'express';
import http from 'http';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { parseIndonesianFinancialMessage } from './src/utils/localFinanceParser.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Persistence directory and file
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface StoredData {
  initialBalance: number;
  transactions: any[];
  categories: any[];
  messages: any[];
  preferences: {
    categoryKeywordMap: Record<string, string>;
  };
}

const DEFAULT_STORE: StoredData = {
  initialBalance: 2500000,
  transactions: [
    {
      id: 'tx-seed-1',
      type: 'income',
      amount: 5000000,
      category: 'Gaji',
      description: 'Gaji bulanan Oktober',
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
      description: 'Transfer masuk dari Budi',
      date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
  ],
  categories: [],
  messages: [
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: 'Halo! Saya asisten ChatKeuangan AI Anda. Anda cukup mengetik pengeluaran atau pemasukan dengan bahasa sehari-hari, contohnya:\n\n• "Beli bensin 50 ribu"\n• "Makan siang 25 ribu dan kopi 15 ribu"\n• "Terima gaji 5 juta"\n• "Berapa sisa uang saya bulan ini?"\n\nSilakan coba ketik transaksi Anda!',
      timestamp: new Date().toISOString(),
      intent: 'general',
    },
  ],
  preferences: {
    categoryKeywordMap: {
      bensin: 'Transportasi dan bensin',
      pertamax: 'Transportasi dan bensin',
      makan: 'Makanan dan minuman',
      kopi: 'Makanan dan minuman',
      gaji: 'Gaji',
      listrik: 'Tagihan listrik, air, dan internet',
    },
  },
};

function readDb(): StoredData {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading db.json:', err);
  }
  return DEFAULT_STORE;
}

function writeDb(data: StoredData): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing db.json:', err);
  }
}

// REST endpoints for persistence
app.get('/api/data', (req, res) => {
  const data = readDb();
  res.json(data);
});

app.post('/api/data', (req, res) => {
  const incoming = req.body;
  if (!incoming) {
    return res.status(400).json({ error: 'Missing data' });
  }
  const current = readDb();
  const merged: StoredData = {
    ...current,
    ...incoming,
  };
  writeDb(merged);
  res.json({ success: true, data: merged });
});

app.post('/api/reset-data', (req, res) => {
  writeDb(DEFAULT_STORE);
  res.json({ success: true, data: DEFAULT_STORE });
});

// Helper to initialize GoogleGenAI safely
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Fallback Indonesian rule-based parser in case API is unavailable or rate-limited
function fallbackParseIndonesian(text: string, currentDate: string, categories: any[]) {
  const clean = text.toLowerCase();
  const incomeCats = categories.filter(c => c.type === 'income').map(c => c.name);
  const expenseCats = categories.filter(c => c.type === 'expense').map(c => c.name);

  // Parse relative date
  let date = currentDate;
  if (clean.includes('kemarin lusa') || clean.includes('2 hari lalu')) {
    const d = new Date(Date.now() - 86400000 * 2);
    date = d.toISOString().split('T')[0];
  } else if (clean.includes('kemarin')) {
    const d = new Date(Date.now() - 86400000);
    date = d.toISOString().split('T')[0];
  }

  // Regex to detect items separated by comma, 'dan', 'lalu', 'terus', newline
  const segments = text.split(/,|\bdan\b|\bterus\b|\blalu\b|\n/i).map(s => s.trim()).filter(Boolean);
  const proposals: any[] = [];

  for (const seg of segments) {
    const sLower = seg.toLowerCase();
    // Match nominals like 50 ribu, 50rb, 50k, 1,5 juta, 2jt, 250000, rp 50.000
    const match = sLower.match(/(?:rp\.?\s*)?(\d+(?:[.,]\d+)?)\s*(ribu|rb|k|juta|jt)?/i);
    if (!match) continue;

    let num = parseFloat(match[1].replace(',', '.'));
    const unit = match[2]?.toLowerCase();
    if (unit === 'ribu' || unit === 'rb' || unit === 'k') {
      num *= 1000;
    } else if (unit === 'juta' || unit === 'jt') {
      num *= 1000000;
    } else if (num < 1000 && (sLower.includes('ribu') || sLower.includes('rb'))) {
      num *= 1000;
    }

    const isIncome = sLower.includes('gaji') || sLower.includes('lembur') || sLower.includes('bonus') ||
      sLower.includes('terima') || sLower.includes('transfer masuk') || sLower.includes('pendapatan') || sLower.includes('dapat uang');

    let matchedCat = isIncome ? 'Pendapatan lainnya' : 'Pengeluaran lainnya';
    if (isIncome) {
      if (sLower.includes('gaji')) matchedCat = 'Gaji';
      else if (sLower.includes('lembur') || sLower.includes('bonus')) matchedCat = 'Bonus dan lembur';
      else if (sLower.includes('transfer')) matchedCat = 'Transfer masuk';
      else if (sLower.includes('investasi')) matchedCat = 'Hasil investasi';
      else if (sLower.includes('hadiah')) matchedCat = 'Hadiah';
    } else {
      if (sLower.includes('makan') || sLower.includes('kopi') || sLower.includes('minum') || sLower.includes('sarapan') || sLower.includes('nasi')) {
        matchedCat = 'Makanan dan minuman';
      } else if (sLower.includes('bensin') || sLower.includes('transport') || sLower.includes('ojol') || sLower.includes('parkir') || sLower.includes('tol')) {
        matchedCat = 'Transportasi dan bensin';
      } else if (sLower.includes('listrik') || sLower.includes('air') || sLower.includes('wifi') || sLower.includes('pulsa') || sLower.includes('internet') || sLower.includes('pln')) {
        matchedCat = 'Tagihan listrik, air, dan internet';
      } else if (sLower.includes('belanja') || sLower.includes('sabun') || sLower.includes('beras') || sLower.includes('sayur') || sLower.includes('pasar')) {
        matchedCat = 'Belanja rumah tangga';
      } else if (sLower.includes('obat') || sLower.includes('dokter') || sLower.includes('klinik') || sLower.includes('sehat')) {
        matchedCat = 'Kesehatan';
      } else if (sLower.includes('bioskop') || sLower.includes('game') || sLower.includes('nonton') || sLower.includes('hiburan')) {
        matchedCat = 'Hiburan';
      }
    }

    let desc = seg.replace(/(?:rp\.?\s*)?(\d+(?:[.,]\d+)?)\s*(ribu|rb|k|juta|jt)?/gi, '').replace(/^(beli|bayar|catat|tadi|untuk)\s+/i, '').trim();
    if (!desc) desc = seg.trim();

    proposals.push({
      tempId: 'prop-' + Math.random().toString(36).substring(2, 9),
      type: isIncome ? 'income' : 'expense',
      amount: Math.round(num),
      category: matchedCat,
      description: desc.charAt(0).toUpperCase() + desc.slice(1),
      date: date,
      confidence: 'high',
      status: 'pending',
    });
  }

  return proposals;
}

// Main AI Chat Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const {
      message,
      history = [],
      transactions = [],
      categories = [],
      userPreferences = {},
      currentDate = new Date().toISOString().split('T')[0],
      initialBalance = 0,
    } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Pesan tidak boleh kosong' });
    }

    const ai = getGeminiClient();

    // Calculate helpful current stats for context
    const currentMonth = currentDate.slice(0, 7); // YYYY-MM
    const currentMonthTxs = transactions.filter((t: any) => t.date && t.date.startsWith(currentMonth));
    const incomeMonth = currentMonthTxs.filter((t: any) => t.type === 'income').reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
    const expenseMonth = currentMonthTxs.filter((t: any) => t.type === 'expense').reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
    const allIncome = transactions.filter((t: any) => t.type === 'income').reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
    const allExpense = transactions.filter((t: any) => t.type === 'expense').reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
    const currentTotalBalance = initialBalance + allIncome - allExpense;

    // Build categories description
    const incomeCatNames = categories.filter((c: any) => c.type === 'income').map((c: any) => c.name);
    const expenseCatNames = categories.filter((c: any) => c.type === 'expense').map((c: any) => c.name);

    if (!ai) {
      // Use smart fallback
      const proposals = fallbackParseIndonesian(message, currentDate, categories);
      if (proposals.length > 0) {
        const incTotal = proposals.filter(p => p.type === 'income').reduce((s, p) => s + p.amount, 0);
        const expTotal = proposals.filter(p => p.type === 'expense').reduce((s, p) => s + p.amount, 0);
        const selisih = incTotal - expTotal;
        const replyText = `Saya menemukan ${proposals.length} transaksi:\n\n` +
          proposals.map((p, i) => `${i + 1}. ${p.type === 'income' ? 'Pemasukan' : 'Pengeluaran'} ${p.description}: Rp ${p.amount.toLocaleString('id-ID')} (${p.category})`).join('\n') +
          `\n\nTotal Pemasukan: Rp ${incTotal.toLocaleString('id-ID')}\nTotal Pengeluaran: Rp ${expTotal.toLocaleString('id-ID')}\nSelisih: ${selisih >= 0 ? '+' : ''}Rp ${selisih.toLocaleString('id-ID')}\n\nApakah transaksi ini ingin disimpan?`;
        return res.json({
          replyText,
          intent: 'record',
          proposals,
        });
      }

      return res.json({
        replyText: `Saldo Anda saat ini adalah Rp ${currentTotalBalance.toLocaleString('id-ID')}. Total pemasukan bulan ini: Rp ${incomeMonth.toLocaleString('id-ID')}, dan total pengeluaran: Rp ${expenseMonth.toLocaleString('id-ID')}. Ada transaksi yang ingin dicatat?`,
        intent: 'query',
        proposals: [],
      });
    }

    // Call Gemini 3.8 Flash
    const systemInstruction = `Anda adalah ChatKeuangan AI, asisten keuangan pribadi pintar, interaktif, ramah, dan teliti dalam bahasa Indonesia.
Tanggal sistem hari ini adalah: ${currentDate}.
Saldo awal: Rp ${initialBalance}.
Total saldo saat ini: Rp ${currentTotalBalance}.
Total pemasukan bulan ini (${currentMonth}): Rp ${incomeMonth}.
Total pengeluaran bulan ini (${currentMonth}): Rp ${expenseMonth}.

Daftar Kategori Pemasukan yang tersedia:
${incomeCatNames.join(', ')}

Daftar Kategori Pengeluaran yang tersedia:
${expenseCatNames.join(', ')}

Preferensi Pengguna sebelumnya (keyword -> kategori):
${JSON.stringify(userPreferences.categoryKeywordMap || {})}

Daftar 20 Transaksi Terbaru Tersimpan:
${JSON.stringify(transactions.slice(-20).map((t: any) => ({
      id: t.id,
      date: t.date,
      type: t.type,
      amount: t.amount,
      category: t.category,
      description: t.description,
    })))}

Tugas Anda:
1. Menganalisis pesan pengguna dalam bahasa Indonesia sehari-hari.
2. Memahami angka/nominal: "50 ribu", "50rb", "50k", "1,5 juta", "2jt", "Rp 250.000", "250rb", dll.
3. Memahami tanggal relatif:
   - "hari ini" -> ${currentDate}
   - "kemarin" -> 1 hari sebelum ${currentDate}
   - "kemarin lusa" atau "2 hari lalu" -> 2 hari sebelum ${currentDate}
   - "minggu lalu" -> 7 hari sebelum ${currentDate}
   - tanggal spesifik (misal "15 Oktober") -> tahun berjalan (${currentDate.split('-')[0]}-10-15)
4. Mampu mendeteksi BANYAK transaksi sekaligus dalam satu pesan (multi-transaction extraction), misal:
   "Tadi beli bensin 50 ribu, makan 30 ribu, terus dapat uang lembur 400 ribu." -> ekstrak 3 transaksi.
5. Menentukan Kategori secara cerdas berdasarkan konteks dan preferensi kata kunci.
6. PERIKSA AMBIGUITAS:
   - Jika pengguna menyebut tindakan keuangan tapi nominalnya tidak ada atau jenisnya belum jelas (contoh: "Tadi belanja barang", "Beli sesuatu"), set intent "clarify", tandai confidence "ambiguous", dan minta klarifikasi dengan sopan di "clarificationPrompt" atau "replyText". JANGAN menyimpan transaksi yang masih ambigu!
7. PEMBATALAN / KOREKSI:
   - Jika pengguna meminta membatalkan/menghapus/mengoreksi transaksi (misal: "Batalkan kopi tadi", "Hapus transaksi makan siang", "Koreksi makan siang jadi 30 ribu"), set intent "modify", dan tentukan targetTransactionId atau targetDescription di modifyAction.
8. PERTANYAAN KEUANGAN / ANALISIS:
   - Jika pengguna bertanya (misal: "Berapa sisa uang saya?", "Tampilkan pengeluaran minggu ini", "Kategori apa paling boros?", "Bandingkan bulan ini dan bulan lalu"), jawab dengan angka akurat berdasarkan data transaksi di atas, sertakan rincian dan tips hemat yang bersahabat.
9. Format output HARUS berupa JSON murni sesuai schema yang ditentukan.`;

    // Helper for timeout
    const withTimeout = <T>(promise: Promise<T>, ms: number, errorMsg: string): Promise<T> => {
      return Promise.race([
        promise,
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error(errorMsg)), ms)),
      ]);
    };

    const response = await withTimeout(
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [{ text: `Pesan pengguna: "${message}"` }],
          },
        ],
        config: {
          systemInstruction,
          temperature: 0.2,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              replyText: {
                type: Type.STRING,
                description: 'Teks jawaban ramah dalam bahasa Indonesia kepada pengguna. Jika ada transaksi yang ditemukan, buat ringkasan rapi seperti yang diminta.',
              },
              intent: {
                type: Type.STRING,
                description: 'record | clarify | query | modify | general',
              },
              proposals: {
                type: Type.ARRAY,
                description: 'Daftar transaksi yang terdeteksi dari pesan pengguna.',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: {
                      type: Type.STRING,
                      description: 'income | expense',
                    },
                    amount: {
                      type: Type.NUMBER,
                      description: 'Nominal transaksi dalam angka bulat rupiah',
                    },
                    category: {
                      type: Type.STRING,
                      description: 'Nama kategori yang paling cocok dari daftar kategori',
                    },
                    description: {
                      type: Type.STRING,
                      description: 'Deskripsi transaksi yang ringkas dan jelas',
                    },
                    date: {
                      type: Type.STRING,
                      description: 'Tanggal transaksi dalam format YYYY-MM-DD',
                    },
                    confidence: {
                      type: Type.STRING,
                      description: 'high | ambiguous',
                    },
                    notes: {
                      type: Type.STRING,
                      description: 'Catatan tambahan jika ada',
                    },
                  },
                  required: ['type', 'amount', 'category', 'description', 'date', 'confidence'],
                },
              },
              clarificationPrompt: {
                type: Type.STRING,
                description: 'Pertanyaan klarifikasi jika transaksi belum jelas',
              },
              modifyAction: {
                type: Type.OBJECT,
                properties: {
                  action: {
                    type: Type.STRING,
                    description: 'delete | update | none',
                  },
                  targetDescription: {
                    type: Type.STRING,
                    description: 'Deskripsi transaksi yang ingin dihapus atau diedit',
                  },
                  targetTransactionId: {
                    type: Type.STRING,
                    description: 'ID transaksi jika teridentifikasi dari riwayat',
                  },
                  updatedAmount: {
                    type: Type.NUMBER,
                    description: 'Nominal baru jika ada koreksi',
                  },
                  updatedCategory: {
                    type: Type.STRING,
                    description: 'Kategori baru jika ada koreksi',
                  },
                },
              },
              quickStats: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    value: { type: Type.STRING },
                  },
                  required: ['label', 'value'],
                },
              },
            },
            required: ['replyText', 'intent', 'proposals'],
          },
        },
      }),
      5500,
      'Gemini AI request timeout'
    );

    const rawText = response.text || '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(rawText);
    } catch (e) {
      console.error('Failed to parse Gemini JSON output:', rawText);
      parsed = {
        replyText: rawText,
        intent: 'general',
        proposals: [],
      };
    }

    // Attach unique tempId and status for frontend interaction
    if (Array.isArray(parsed.proposals)) {
      parsed.proposals = parsed.proposals.map((p: any, idx: number) => ({
        ...p,
        tempId: 'prop-' + Date.now() + '-' + idx,
        status: 'pending',
      }));
    }

    res.json(parsed);
  } catch (error: any) {
    console.warn('API /chat fallback activated (fast rescue):', error?.message || error);
    // Silent instant fallback to guarantee immediate response with zero lag
    const fallback = parseIndonesianFinancialMessage(req.body.message || '', {
      currentDate: req.body.currentDate || new Date().toISOString().split('T')[0],
      transactions: req.body.transactions || [],
      categories: req.body.categories || [],
      userPreferences: req.body.userPreferences || {},
      initialBalance: req.body.initialBalance || 0,
      monthlyBudget: req.body.monthlyBudget,
    });
    res.json(fallback);
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const httpServer = http.createServer(app);

  if (!isProd) {
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`ChatKeuangan AI Server running on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
