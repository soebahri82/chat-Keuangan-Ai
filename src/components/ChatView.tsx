import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Edit3,
  Trash2,
  Mic,
  MicOff,
  RotateCcw,
  Plus,
  Check,
  Calendar,
  Tag,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  ChatMessage,
  Transaction,
  TransactionProposal,
  Category,
  UserPreferences,
} from '../types';
import { formatRupiah, formatDateIndo, formatTimeIndo } from '../utils/formatters';
import { getCategoryColorClasses, getCategoryIcon } from '../utils/categoryIcons';
import { sendMessageToAI } from '../services/api';

interface ChatViewProps {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  transactions: Transaction[];
  onSaveTransactions: (proposals: TransactionProposal[]) => void;
  onDeleteTransaction: (id: string) => void;
  onUpdateTransaction: (transaction: Transaction) => void;
  categories: Category[];
  userPreferences: UserPreferences;
  initialBalance: number;
  monthlyBudget?: number;
  onNavigateToTransactions: () => void;
  onNavigateToDashboard: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  setMessages,
  transactions,
  onSaveTransactions,
  onDeleteTransaction,
  onUpdateTransaction,
  categories,
  userPreferences,
  initialBalance,
  monthlyBudget = 4000000,
  onNavigateToTransactions,
  onNavigateToDashboard,
}) => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editingProposal, setEditingProposal] = useState<{
    msgId: string;
    proposal: TransactionProposal;
  } | null>(null);
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Voice speech-to-text recognition setup (id-ID)
  const handleToggleVoice = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Fitur pengenalan suara tidak didukung di browser ini. Silakan ketik langsung pesan Anda.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'id-ID';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(prev => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error('Speech recognition error:', err);
      setIsListening(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    const userMessageId = 'msg-' + Date.now();
    const newUserMsg: ChatMessage = {
      id: userMessageId,
      sender: 'user',
      text,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const currentDate = new Date().toISOString().split('T')[0];
      const aiResponse = await sendMessageToAI({
        message: text,
        history: messages.slice(-10),
        transactions,
        categories,
        userPreferences,
        currentDate,
        initialBalance,
        monthlyBudget,
      });

      // Handle modification action (if AI detected user wants to delete/edit a transaction)
      let deletedId: string | undefined = undefined;
      let editedId: string | undefined = undefined;

      if (aiResponse.modifyAction && aiResponse.modifyAction.action !== 'none') {
        const { action, targetDescription, targetTransactionId, updatedAmount, updatedCategory } =
          aiResponse.modifyAction;

        let targetTx = targetTransactionId
          ? transactions.find(t => t.id === targetTransactionId)
          : undefined;

        if (!targetTx && targetDescription) {
          const lowerDesc = targetDescription.toLowerCase();
          targetTx = transactions.find(t =>
            t.description.toLowerCase().includes(lowerDesc) ||
            t.category.toLowerCase().includes(lowerDesc)
          );
        }

        if (targetTx) {
          if (action === 'delete') {
            onDeleteTransaction(targetTx.id);
            deletedId = targetTx.id;
          } else if (action === 'update') {
            const updated: Transaction = {
              ...targetTx,
              amount: updatedAmount ?? targetTx.amount,
              category: updatedCategory ?? targetTx.category,
            };
            onUpdateTransaction(updated);
            editedId = targetTx.id;
          }
        }
      }

      // Calculate totals for proposal card if present
      let incomeTotal = 0;
      let expenseTotal = 0;
      if (aiResponse.proposals && aiResponse.proposals.length > 0) {
        incomeTotal = aiResponse.proposals
          .filter(p => p.type === 'income')
          .reduce((s, p) => s + p.amount, 0);
        expenseTotal = aiResponse.proposals
          .filter(p => p.type === 'expense')
          .reduce((s, p) => s + p.amount, 0);
      }

      const assistantMessage: ChatMessage = {
        id: 'msg-ai-' + Date.now(),
        sender: 'assistant',
        text: aiResponse.replyText,
        timestamp: new Date().toISOString(),
        intent: aiResponse.intent,
        proposals: aiResponse.proposals,
        clarificationPrompt: aiResponse.clarificationPrompt,
        deletedTransactionId: deletedId,
        editedTransactionId: editedId,
        metadata: {
          incomeTotal,
          expenseTotal,
          netTotal: incomeTotal - expenseTotal,
          quickStats: aiResponse.quickStats,
        },
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: 'msg-err-' + Date.now(),
        sender: 'assistant',
        text:
          'Maaf, terjadi kendala saat memproses pesan. Mohon periksa koneksi atau coba formulasi kalimat lain, misalnya: "Beli bensin 50 ribu".',
        timestamp: new Date().toISOString(),
        intent: 'general',
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAll = (messageId: string, proposals: TransactionProposal[]) => {
    // Only save proposals with high confidence or confirmed
    const validProposals = proposals.filter(p => p.status === 'pending');
    if (!validProposals.length) return;

    onSaveTransactions(validProposals);

    // Update message state to show 'saved'
    setMessages(prev =>
      prev.map(msg => {
        if (msg.id === messageId) {
          return {
            ...msg,
            confirmedCount: validProposals.length,
            proposals: msg.proposals?.map(p => ({ ...p, status: 'saved' })),
          };
        }
        return msg;
      })
    );
  };

  const handleCancelProposals = (messageId: string) => {
    setMessages(prev =>
      prev.map(msg => {
        if (msg.id === messageId) {
          return {
            ...msg,
            proposals: msg.proposals?.map(p => ({ ...p, status: 'cancelled' })),
          };
        }
        return msg;
      })
    );
  };

  const handleSaveEditedProposal = (
    msgId: string,
    tempId: string,
    updated: Partial<TransactionProposal>
  ) => {
    setMessages(prev =>
      prev.map(msg => {
        if (msg.id === msgId) {
          const updatedProposals = msg.proposals?.map(p =>
            p.tempId === tempId ? { ...p, ...updated, confidence: 'high' as const } : p
          );
          return { ...msg, proposals: updatedProposals };
        }
        return msg;
      })
    );
    setEditingProposal(null);
  };

  // Quick suggestion chips
  const quickPrompts = [
    { label: '🛵 Beli bensin 50rb', prompt: 'Beli bensin 50 ribu' },
    { label: '🍱 Makan siang 30rb & kopi 15rb', prompt: 'Makan siang 30 ribu dan kopi 15 ribu' },
    { label: '💰 Terima gaji 5 juta', prompt: 'Hari ini saya menerima gaji Rp5.000.000' },
    { label: '⚡ Bayar listrik 350 ribu', prompt: 'Bayar listrik 350 ribu kemarin' },
    { label: '📊 Ringkasan hari ini', prompt: 'Tampilkan ringkasan transaksi hari ini' },
    { label: '💳 Berapa sisa uang saya?', prompt: 'Berapa sisa uang saya bulan ini?' },
    { label: '🎯 Sisa batas anggaran?', prompt: 'Berapa sisa anggaran bulanan saya?' },
    { label: '📉 Kategori paling boros?', prompt: 'Kategori apa yang paling banyak menghabiskan uang saya?' },
    { label: '⚖️ Analisis 50/30/20', prompt: 'Bagaimana analisis keuangan saya dengan kaidah 50/30/20?' },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] md:h-[calc(100vh-6.5rem)] max-w-5xl mx-auto px-2 sm:px-4 py-2">
      {/* Chat Messages Container */}
      <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-4 space-y-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 shadow-inner">
        {messages.map((msg, index) => {
          const isUser = msg.sender === 'user';
          const hasProposals = msg.proposals && msg.proposals.length > 0;
          const isSaved = msg.proposals?.every(p => p.status === 'saved');
          const isCancelled = msg.proposals?.every(p => p.status === 'cancelled');

          return (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${
                isUser ? 'flex-row-reverse space-x-reverse' : 'flex-row'
              } animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              {/* Avatar */}
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                  isUser
                    ? 'bg-gradient-to-tr from-slate-800 to-slate-950 text-white dark:from-slate-700 dark:to-slate-800'
                    : 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-emerald-500/20'
                }`}
              >
                {isUser ? <User className="w-5 h-5" /> : <Sparkles className="w-4 h-4" />}
              </div>

              {/* Message Content Bubble */}
              <div
                className={`max-w-[88%] sm:max-w-xl rounded-2xl p-4 text-sm leading-relaxed ${
                  isUser
                    ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white rounded-tr-xs shadow-sm'
                    : 'bg-white dark:bg-slate-800/95 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-tl-xs shadow-sm'
                }`}
              >
                {/* Text Body */}
                <div className="whitespace-pre-line break-words">{msg.text}</div>

                {/* Ambiguity clarification indicator */}
                {msg.intent === 'clarify' && (
                  <div className="mt-3 p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start space-x-2 text-amber-800 dark:text-amber-300 text-xs">
                    <HelpCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                    <div>
                      <p className="font-semibold">Perlu Klarifikasi</p>
                      <p className="text-[11px] opacity-90 mt-0.5">
                        Transaksi tidak akan dicatat sebelum nominal dan jenis transaksi jelas.
                      </p>
                    </div>
                  </div>
                )}

                {/* Quick Stats Highlights if query */}
                {msg.metadata?.quickStats && msg.metadata.quickStats.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {msg.metadata.quickStats.map((stat, i) => (
                      <div
                        key={i}
                        className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60"
                      >
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          {stat.label}
                        </div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                          {stat.value}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* TRANSACTION PROPOSALS CARD */}
                {hasProposals && (
                  <div className="mt-3.5 pt-3 border-t border-slate-200/80 dark:border-slate-700/80">
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <Tag className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Rincian Transaksi Terdeteksi ({msg.proposals!.length})</span>
                      </div>
                      {isSaved && (
                        <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Tersimpan</span>
                        </span>
                      )}
                      {isCancelled && (
                        <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full">
                          <span>Dibatalkan</span>
                        </span>
                      )}
                    </div>

                    {/* Proposal Items List */}
                    <div className="space-y-2">
                      {msg.proposals!.map((prop, pIndex) => {
                        const isIncome = prop.type === 'income';
                        const isPending = prop.status === 'pending';
                        const colorCls = getCategoryColorClasses(
                          isIncome ? 'emerald' : 'orange'
                        );

                        return (
                          <div
                            key={prop.tempId || pIndex}
                            className={`p-3 rounded-xl border transition-all ${
                              isPending
                                ? 'bg-slate-50/90 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700'
                                : prop.status === 'saved'
                                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                                : 'bg-slate-100/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-2.5">
                                <div
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                    isIncome
                                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                      : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                                  }`}
                                >
                                  {isIncome ? (
                                    <ArrowDownLeft className="w-4 h-4" />
                                  ) : (
                                    <ArrowUpRight className="w-4 h-4" />
                                  )}
                                </div>
                                <div>
                                  <div className="font-semibold text-xs text-slate-900 dark:text-white flex items-center space-x-2">
                                    <span>{prop.description}</span>
                                    {prop.confidence === 'ambiguous' && (
                                      <span className="text-[10px] text-amber-600 bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.2 rounded">
                                        Perlu Dicek
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                    <span className="font-medium bg-slate-200/70 dark:bg-slate-700/70 px-1.5 py-0.5 rounded">
                                      {prop.category}
                                    </span>
                                    <span>•</span>
                                    <span className="flex items-center space-x-1">
                                      <Calendar className="w-3 h-3" />
                                      <span>{formatDateIndo(prop.date)}</span>
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="text-right">
                                <div
                                  className={`text-xs font-bold ${
                                    isIncome
                                      ? 'text-emerald-600 dark:text-emerald-400'
                                      : 'text-rose-600 dark:text-rose-400'
                                  }`}
                                >
                                  {isIncome ? '+' : '-'}
                                  {formatRupiah(prop.amount)}
                                </div>
                                {isPending && (
                                  <button
                                    onClick={() =>
                                      setEditingProposal({ msgId: msg.id, proposal: prop })
                                    }
                                    className="text-[10px] text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 inline-flex items-center space-x-0.5 mt-1 font-medium"
                                  >
                                    <Edit3 className="w-2.5 h-2.5" />
                                    <span>Ubah</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Summary Totals of detected batch */}
                    {msg.metadata && (
                      <div className="mt-3 p-2.5 bg-slate-100/70 dark:bg-slate-900/50 rounded-xl text-xs space-y-1">
                        <div className="flex justify-between text-slate-600 dark:text-slate-300">
                          <span>Total Pemasukan:</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            +{formatRupiah(msg.metadata.incomeTotal || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-600 dark:text-slate-300">
                          <span>Total Pengeluaran:</span>
                          <span className="font-semibold text-rose-600 dark:text-rose-400">
                            -{formatRupiah(msg.metadata.expenseTotal || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white">
                          <span>Selisih:</span>
                          <span
                            className={
                              (msg.metadata.netTotal || 0) >= 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }
                          >
                            {(msg.metadata.netTotal || 0) >= 0 ? '+' : ''}
                            {formatRupiah(msg.metadata.netTotal || 0)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Action Confirmation Buttons */}
                    {!isSaved && !isCancelled && (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleConfirmAll(msg.id, msg.proposals!)}
                          className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Simpan Semua</span>
                        </button>
                        <button
                          onClick={() => onNavigateToTransactions()}
                          className="py-2 px-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition"
                        >
                          Periksa Transaksi
                        </button>
                        <button
                          onClick={() => handleCancelProposals(msg.id)}
                          className="py-2 px-3 text-slate-500 hover:text-rose-600 text-xs font-medium transition"
                        >
                          Batalkan
                        </button>
                      </div>
                    )}

                    {/* Jump to transactions link when saved */}
                    {isSaved && (
                      <div className="mt-2 text-right">
                        <button
                          onClick={onNavigateToTransactions}
                          className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline inline-flex items-center space-x-1"
                        >
                          <span>Buka di Halaman Transaksi &rarr;</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Timestamp */}
                <div
                  className={`mt-1.5 text-[10px] text-right ${
                    isUser
                      ? 'text-slate-300 dark:text-emerald-200'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {formatTimeIndo(msg.timestamp)}
                </div>
              </div>
            </div>
          );
        })}

        {/* AI Thinking Animation */}
        {isLoading && (
          <div className="flex items-center space-x-3 animate-in fade-in duration-200">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 animate-spin text-emerald-200" />
            </div>
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" />
                <div
                  className="w-2 h-2 rounded-full bg-teal-500 animate-bounce"
                  style={{ animationDelay: '0.15s' }}
                />
                <div
                  className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce"
                  style={{ animationDelay: '0.3s' }}
                />
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium ml-1">
                  AI sedang menganalisis percakapan Anda...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Chips Bar */}
      <div className="py-2.5 overflow-x-auto no-scrollbar flex items-center space-x-2">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 pl-1">
          Saran:
        </span>
        {quickPrompts.map((item, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(item.prompt)}
            disabled={isLoading}
            className="shrink-0 text-xs px-2.5 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 text-slate-600 dark:text-slate-300 transition shadow-2xs font-medium"
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="relative mt-1">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center space-x-2 bg-white dark:bg-slate-800/90 border border-slate-300/80 dark:border-slate-700/80 rounded-2xl p-1.5 shadow-sm focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition-all"
        >
          {/* Voice Input Mic Button */}
          <button
            type="button"
            onClick={handleToggleVoice}
            className={`p-2.5 rounded-xl transition ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
            title={isListening ? 'Mendengarkan... (Klik untuk stop)' : 'Bicara untuk input suara (Bahasa Indonesia)'}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Text Input */}
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder={
              isListening
                ? 'Silakan bicara sekarang dalam bahasa Indonesia...'
                : 'Ketik pesan, misal: "Makan siang 25 ribu dan kopi 15 ribu"...'
            }
            disabled={isLoading}
            className="flex-1 bg-transparent px-2 py-1.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className={`flex items-center justify-center p-2.5 rounded-xl text-white transition ${
              inputText.trim() && !isLoading
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-sm cursor-pointer'
                : 'bg-slate-300 dark:bg-slate-700 opacity-50 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 mt-1.5">
          AI memahami bahasa santai, nominal (50rb, 1.5jt), tanggal relatif (hari ini, kemarin), serta banyak transaksi sekaligus.
        </p>
      </div>

      {/* Proposal Inline Quick-Edit Modal */}
      {editingProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-5 space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Koreksi Transaksi Sebelum Simpan
            </h4>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Deskripsi
              </label>
              <input
                type="text"
                value={editingProposal.proposal.description}
                onChange={e =>
                  setEditingProposal({
                    ...editingProposal,
                    proposal: { ...editingProposal.proposal, description: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Nominal (Rp)
              </label>
              <input
                type="number"
                value={editingProposal.proposal.amount}
                onChange={e =>
                  setEditingProposal({
                    ...editingProposal,
                    proposal: {
                      ...editingProposal.proposal,
                      amount: parseFloat(e.target.value) || 0,
                    },
                  })
                }
                className="w-full px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Kategori
              </label>
              <select
                value={editingProposal.proposal.category}
                onChange={e =>
                  setEditingProposal({
                    ...editingProposal,
                    proposal: { ...editingProposal.proposal, category: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
              >
                {categories
                  .filter(c => c.type === editingProposal.proposal.type)
                  .map(c => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Tanggal
              </label>
              <input
                type="date"
                value={editingProposal.proposal.date}
                onChange={e =>
                  setEditingProposal({
                    ...editingProposal,
                    proposal: { ...editingProposal.proposal, date: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingProposal(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() =>
                  handleSaveEditedProposal(
                    editingProposal.msgId,
                    editingProposal.proposal.tempId,
                    editingProposal.proposal
                  )
                }
                className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl"
              >
                Terapkan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
