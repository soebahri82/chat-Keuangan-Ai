import { Transaction, Category, TransactionProposal, UserPreferences } from '../types';
import { formatRupiah, formatDateIndo } from './formatters';

export interface LocalParsedResult {
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

export function parseIndonesianFinancialMessage(
  message: string,
  context: {
    currentDate: string;
    transactions: Transaction[];
    categories: Category[];
    userPreferences: UserPreferences;
    initialBalance: number;
    monthlyBudget?: number;
  }
): LocalParsedResult {
  const text = message.trim();
  const lower = text.toLowerCase();
  const { currentDate, transactions, categories, userPreferences, initialBalance, monthlyBudget = 4000000 } = context;

  // 1. Check for Query / Analytics Intent
  const currentMonth = currentDate.slice(0, 7);
  const monthTxs = transactions.filter(t => t.date && t.date.startsWith(currentMonth));
  const monthIncome = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const monthExpense = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const allIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const allExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const totalBalance = initialBalance + allIncome - allExpense;

  // Query: Sisa uang / Saldo
  if (
    lower.includes('sisa uang') ||
    lower.includes('sisa saldo') ||
    lower.includes('berapa saldo') ||
    lower.includes('total uang') ||
    lower.includes('saldo saya') ||
    lower.includes('cek saldo')
  ) {
    const sisaBudget = monthlyBudget - monthExpense;
    return {
      intent: 'query',
      proposals: [],
      replyText: `Berikut ringkasan saldo keuangan Anda:\n\n• Total Saldo Aktif: ${formatRupiah(totalBalance)}\n• Pemasukan Bulan Ini: +${formatRupiah(monthIncome)}\n• Pengeluaran Bulan Ini: -${formatRupiah(monthExpense)}\n• Arus Kas Bersih: ${monthIncome - monthExpense >= 0 ? '+' : ''}${formatRupiah(monthIncome - monthExpense)}\n• Sisa Anggaran Bulanan: ${sisaBudget >= 0 ? formatRupiah(sisaBudget) : 'Defisit ' + formatRupiah(Math.abs(sisaBudget))}\n\nIngin mencatat pemasukan atau pengeluaran baru?`,
      quickStats: [
        { label: 'Total Saldo', value: formatRupiah(totalBalance) },
        { label: 'Selisih Bulan Ini', value: formatRupiah(monthIncome - monthExpense) },
      ],
    };
  }

  // Query: Ringkasan hari ini
  if (lower.includes('hari ini') && (lower.includes('ringkasan') || lower.includes('pengeluaran') || lower.includes('laporan') || lower.includes('catatan'))) {
    const todayTxs = transactions.filter(t => t.date === currentDate);
    const todayIncome = todayTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const todayExpense = todayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    const list = todayTxs.length > 0
      ? todayTxs.map((t, i) => `${i + 1}. ${t.type === 'income' ? '🟢' : '🔴'} ${t.description}: ${formatRupiah(t.amount)} (${t.category})`).join('\n')
      : 'Belum ada transaksi yang tercatat hari ini.';

    return {
      intent: 'query',
      proposals: [],
      replyText: `📅 Ringkasan Transaksi Hari Ini (${formatDateIndo(currentDate)}):\n\n${list}\n\n• Pemasukan: +${formatRupiah(todayIncome)}\n• Pengeluaran: -${formatRupiah(todayExpense)}\n• Selisih Hari Ini: ${todayIncome - todayExpense >= 0 ? '+' : ''}${formatRupiah(todayIncome - todayExpense)}`,
      quickStats: [
        { label: 'Pengeluaran Hari Ini', value: formatRupiah(todayExpense) },
        { label: 'Transaksi Hari Ini', value: `${todayTxs.length} item` },
      ],
    };
  }

  // Query: Kategori paling boros / terbesar
  if (lower.includes('paling banyak') || lower.includes('paling boros') || lower.includes('kategori apa') || lower.includes('terbesar')) {
    const catMap: Record<string, number> = {};
    monthTxs.filter(t => t.type === 'expense').forEach(t => {
      catMap[t.category] = (catMap[t.category] || 0) + t.amount;
    });
    const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]);

    if (sorted.length === 0) {
      return {
        intent: 'query',
        proposals: [],
        replyText: 'Belum ada data pengeluaran yang tercatat pada bulan ini.',
      };
    }

    const top = sorted[0];
    const topPct = monthExpense > 0 ? Math.round((top[1] / monthExpense) * 100) : 0;
    const breakdownStr = sorted.slice(0, 4).map((c, i) => `${i + 1}. ${c[0]}: ${formatRupiah(c[1])} (${monthExpense > 0 ? Math.round((c[1] / monthExpense) * 100) : 0}%)`).join('\n');

    return {
      intent: 'query',
      proposals: [],
      replyText: `📊 Kategori pengeluaran terbesar Anda bulan ini adalah ${top[0]} sebesar ${formatRupiah(top[1])} (${topPct}% dari seluruh pengeluaran).\n\nRincian kategori teratas:\n${breakdownStr}\n\n💡 Tips Finansial: Cobalah evaluasi kembali pos "${top[0]}" agar pengeluaran akhir bulan tetap aman dan terkendali.`,
      quickStats: [
        { label: 'Kategori Terbesar', value: top[0] },
        { label: 'Nominal', value: formatRupiah(top[1]) },
      ],
    };
  }

  // Query: Laporan bulanan / Analisis keuangan
  if (lower.includes('laporan bulanan') || lower.includes('analisis keuangan') || lower.includes('bandingkan')) {
    const savingsRate = monthIncome > 0 ? Math.max(0, Math.round(((monthIncome - monthExpense) / monthIncome) * 100)) : 0;
    return {
      intent: 'query',
      proposals: [],
      replyText: `📈 Laporan Analisis Keuangan Bulan Ini:\n\n• Total Pemasukan: +${formatRupiah(monthIncome)}\n• Total Pengeluaran: -${formatRupiah(monthExpense)}\n• Arus Kas Bersih: ${monthIncome - monthExpense >= 0 ? '+' : ''}${formatRupiah(monthIncome - monthExpense)}\n• Rasio Tabungan: ${savingsRate}%\n• Status Anggaran: ${monthIncome - monthExpense >= 0 ? 'Surplus (Kondisi Sehat ✅)' : 'Defisit (Waspada Pengeluaran ⚠️)'}\n\nIngin melihat rincian visual lengkap? Anda juga dapat membuka tab "Dashboard & Grafik".`,
      quickStats: [
        { label: 'Rasio Tabungan', value: `${savingsRate}%` },
        { label: 'Arus Kas', value: formatRupiah(monthIncome - monthExpense) },
      ],
    };
  }

  // 2. Check for Cancel / Delete / Modify Request
  if (lower.includes('batalkan') || lower.includes('hapus') || lower.includes('koreksi')) {
    let target = '';
    if (lower.includes('kopi')) target = 'kopi';
    else if (lower.includes('makan')) target = 'makan';
    else if (lower.includes('bensin')) target = 'bensin';
    else if (lower.includes('listrik')) target = 'listrik';
    else if (lower.includes('pulsa')) target = 'pulsa';

    return {
      intent: 'modify',
      proposals: [],
      replyText: `Permintaan Anda untuk ${lower.includes('hapus') || lower.includes('batalkan') ? 'menghapus / membatalkan' : 'mengoreksi'} transaksi ${target ? `"${target}"` : ''} telah diproses. Anda juga dapat mengelola riwayat secara langsung melalui tab "Transaksi".`,
      modifyAction: {
        action: lower.includes('koreksi') ? 'update' : 'delete',
        targetDescription: target || undefined,
      },
    };
  }

  // 3. Ambiguity Check: mentions financial action without numbers
  const hasFinancialAction =
    lower.includes('beli') ||
    lower.includes('bayar') ||
    lower.includes('belanja') ||
    lower.includes('pesan') ||
    lower.includes('transfer') ||
    lower.includes('gaji') ||
    lower.includes('dapat uang') ||
    lower.includes('ongkos');

  const hasDigits = /\d/.test(lower);

  if (hasFinancialAction && !hasDigits) {
    return {
      intent: 'clarify',
      proposals: [],
      replyText: `Saya mendeteksi Anda ingin mencatat keuangan, namun nominalnya belum tertera dengan jelas.\n\nBerapa nominal dan untuk keperluan apa transaksi tersebut? Contoh:\n• "Beli bensin 50 ribu"\n• "Makan siang 25 ribu"`,
      clarificationPrompt: 'Berapa nominal transaksinya?',
    };
  }

  // 4. Parse Multi-Transaction or Single Transaction
  // Detect date:
  let txDate = currentDate;
  if (lower.includes('kemarin lusa') || lower.includes('2 hari lalu')) {
    txDate = new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0];
  } else if (lower.includes('kemarin')) {
    txDate = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  } else if (lower.includes('minggu lalu')) {
    txDate = new Date(Date.now() - 86400000 * 7).toISOString().split('T')[0];
  } else {
    // Check specific date e.g. "15 oktober", "10 nov", etc.
    const dateMatch = lower.match(/tanggal\s+(\d{1,2})\s+([a-zA-Z]+)/i);
    if (dateMatch) {
      const dayNum = parseInt(dateMatch[1], 10);
      const monthName = dateMatch[2].toLowerCase();
      const months = ['januari', 'februari', 'maret', 'april', 'mei', 'juni', 'juli', 'agustus', 'september', 'oktober', 'november', 'desember'];
      const mIdx = months.findIndex(m => m.startsWith(monthName.slice(0, 3)));
      if (mIdx !== -1) {
        const year = currentDate.split('-')[0];
        const mStr = String(mIdx + 1).padStart(2, '0');
        const dStr = String(dayNum).padStart(2, '0');
        txDate = `${year}-${mStr}-${dStr}`;
      }
    }
  }

  // Split clauses
  const rawSegments = text.split(/,|\bdan\b|\bterus\b|\blalu\b|\nserta\b|\n/i).map(s => s.trim()).filter(Boolean);
  const proposals: TransactionProposal[] = [];

  for (const seg of rawSegments) {
    const sLower = seg.toLowerCase();

    // Match numbers like: 5.000.000, 50 ribu, 50rb, 50k, 1,5 juta, 2jt, 250000, rp 50.000, rp50.000
    const numRegex = /(?:rp\.?\s*)?(\d{1,3}(?:[.,]\d{3})*|\d+(?:[.,]\d+)?)\s*(ribu|rb|k|juta|jt)?/i;
    const match = sLower.match(numRegex);
    if (!match) continue;

    let rawNumStr = match[1].replace(/\./g, '').replace(',', '.');
    let amount = parseFloat(rawNumStr);
    const unit = match[2]?.toLowerCase();

    if (unit === 'ribu' || unit === 'rb' || unit === 'k') {
      amount *= 1000;
    } else if (unit === 'juta' || unit === 'jt') {
      amount *= 1000000;
    } else if (amount < 1000 && (sLower.includes('ribu') || sLower.includes('rb'))) {
      amount *= 1000;
    }

    if (isNaN(amount) || amount <= 0) continue;

    // Detect income vs expense
    const isIncome =
      sLower.includes('gaji') ||
      sLower.includes('lembur') ||
      sLower.includes('bonus') ||
      sLower.includes('menerima') ||
      sLower.includes('terima') ||
      sLower.includes('transfer masuk') ||
      sLower.includes('pendapatan') ||
      sLower.includes('dapat uang') ||
      sLower.includes('penjualan') ||
      sLower.includes('dividen') ||
      sLower.includes('hasil usaha');

    // Categorization
    let category = isIncome ? 'Pendapatan lainnya' : 'Pengeluaran lainnya';

    // Check user preference keywords first!
    let matchedFromPref = false;
    if (userPreferences?.categoryKeywordMap) {
      for (const [kw, catName] of Object.entries(userPreferences.categoryKeywordMap)) {
        if (sLower.includes(kw.toLowerCase())) {
          category = catName;
          matchedFromPref = true;
          break;
        }
      }
    }

    if (!matchedFromPref) {
      if (isIncome) {
        if (sLower.includes('gaji')) category = 'Gaji';
        else if (sLower.includes('lembur') || sLower.includes('bonus')) category = 'Bonus dan lembur';
        else if (sLower.includes('investasi') || sLower.includes('dividen') || sLower.includes('reksadana') || sLower.includes('crypto')) category = 'Hasil investasi';
        else if (sLower.includes('transfer') || sLower.includes('kiriman')) category = 'Transfer masuk';
        else if (sLower.includes('hadiah') || sLower.includes('angpau') || sLower.includes('saweran')) category = 'Hadiah';
        else if (sLower.includes('usaha') || sLower.includes('dagang') || sLower.includes('toko') || sLower.includes('omset')) category = 'Usaha';
      } else {
        if (sLower.includes('makan') || sLower.includes('kopi') || sLower.includes('minum') || sLower.includes('sarapan') || sLower.includes('nasi') || sLower.includes('mie') || sLower.includes('snack') || sLower.includes('bakso') || sLower.includes('cafe')) {
          category = 'Makanan dan minuman';
        } else if (sLower.includes('bensin') || sLower.includes('pertamax') || sLower.includes('pertalite') || sLower.includes('transport') || sLower.includes('ojol') || sLower.includes('gojek') || sLower.includes('grab') || sLower.includes('parkir') || sLower.includes('tol') || sLower.includes('bus') || sLower.includes('kereta')) {
          category = 'Transportasi dan bensin';
        } else if (sLower.includes('listrik') || sLower.includes('air') || sLower.includes('pdam') || sLower.includes('wifi') || sLower.includes('indihome') || sLower.includes('pulsa') || sLower.includes('kuota') || sLower.includes('internet') || sLower.includes('pln')) {
          category = 'Tagihan listrik, air, dan internet';
        } else if (sLower.includes('belanja') || sLower.includes('sabun') || sLower.includes('beras') || sLower.includes('minyak') || sLower.includes('sayur') || sLower.includes('supermarket') || sLower.includes('pasar') || sLower.includes('indomaret') || sLower.includes('alfamart')) {
          category = 'Belanja rumah tangga';
        } else if (sLower.includes('obat') || sLower.includes('dokter') || sLower.includes('klinik') || sLower.includes('apotek') || sLower.includes('vitamin') || sLower.includes('rumah sakit')) {
          category = 'Kesehatan';
        } else if (sLower.includes('sekolah') || sLower.includes('kuliah') || sLower.includes('spp') || sLower.includes('buku') || sLower.includes('kursus') || sLower.includes('pendidikan')) {
          category = 'Pendidikan';
        } else if (sLower.includes('kos') || sLower.includes('kontrakan') || sLower.includes('sewa rumah') || sLower.includes('apartemen')) {
          category = 'Tempat tinggal';
        } else if (sLower.includes('cicilan') || sLower.includes('utang') || sLower.includes('pinjaman') || sLower.includes('paylater') || sLower.includes('kredit')) {
          category = 'Cicilan dan utang';
        } else if (sLower.includes('bioskop') || sLower.includes('nonton') || sLower.includes('game') || sLower.includes('netflix') || sLower.includes('spotify') || sLower.includes('karaoke') || sLower.includes('liburan') || sLower.includes('wisata')) {
          category = 'Hiburan';
        } else if (sLower.includes('baju') || sLower.includes('sepatu') || sLower.includes('skincare') || sLower.includes('salon') || sLower.includes('potong rambut') || sLower.includes('tas')) {
          category = 'Belanja pribadi';
        } else if (sLower.includes('sedekah') || sLower.includes('donasi') || sLower.includes('zakat') || sLower.includes('infaq')) {
          category = 'Donasi';
        } else if (sLower.includes('transfer keluar') || sLower.includes('kirim uang')) {
          category = 'Transfer keluar';
        }
      }
    }

    // Clean description
    let desc = seg
      .replace(/(?:rp\.?\s*)?(\d{1,3}(?:[.,]\d{3})*|\d+(?:[.,]\d+)?)\s*(ribu|rb|k|juta|jt)?/gi, '')
      .replace(/^(beli|bayar|catat|tadi|untuk|saya|menerima|hari ini|kemarin|pada)\s+/i, '')
      .trim();

    if (!desc) {
      desc = category;
    }

    // Capitalize first letter
    desc = desc.charAt(0).toUpperCase() + desc.slice(1);

    proposals.push({
      tempId: 'prop-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      type: isIncome ? 'income' : 'expense',
      amount: Math.round(amount),
      category,
      description: desc,
      date: txDate,
      confidence: 'high',
      status: 'pending',
    });
  }

  if (proposals.length > 0) {
    const incTotal = proposals.filter(p => p.type === 'income').reduce((s, p) => s + p.amount, 0);
    const expTotal = proposals.filter(p => p.type === 'expense').reduce((s, p) => s + p.amount, 0);
    const selisih = incTotal - expTotal;

    const listStr = proposals
      .map(
        (p, i) =>
          `${i + 1}. ${p.type === 'income' ? '🟢 Pemasukan' : '🔴 Pengeluaran'} ${p.description}: ${formatRupiah(p.amount)} (${p.category})`
      )
      .join('\n');

    let replyText = `Saya menemukan ${proposals.length} transaksi:\n\n${listStr}\n\n`;
    if (incTotal > 0) replyText += `Total Pemasukan: +${formatRupiah(incTotal)}\n`;
    if (expTotal > 0) replyText += `Total Pengeluaran: -${formatRupiah(expTotal)}\n`;
    replyText += `Selisih Transaksi: ${selisih >= 0 ? '+' : ''}${formatRupiah(selisih)}\n\nApakah transaksi di atas ingin disimpan ke catatan keuangan?`;

    return {
      intent: 'record',
      proposals,
      replyText,
      quickStats: [
        { label: 'Terdeteksi', value: `${proposals.length} transaksi` },
        { label: 'Total Nominal', value: formatRupiah(incTotal + expTotal) },
      ],
    };
  }

  // Fallback friendly conversation
  return {
    intent: 'general',
    proposals: [],
    replyText: `Halo! Saya siap membantu Anda mengelola keuangan. Anda bisa mengetik langsung transaksi harian, seperti:\n\n• "Beli bensin 50 ribu"\n• "Makan siang 25 ribu dan kopi 15 ribu"\n• "Menerima gaji Rp5.000.000"\n• "Berapa sisa uang saya bulan ini?"\n\nSilakan coba ketik pengeluaran atau pemasukan Anda!`,
  };
}
