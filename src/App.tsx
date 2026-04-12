import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  Plus, 
  Wallet, 
  BarChart3, 
  Bell,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Utensils,
  MoreVertical,
  ArrowDown,
  ArrowUp,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  HelpCircle,
  ShoppingBasket,
  Building2,
  Fuel,
  Zap,
  Wifi,
  Droplets,
  ReceiptText,
  List,
  LogOut,
  LogIn,
  Moon,
  Sun,
  Repeat,
  Trash2,
  LayoutGrid,
  CreditCard,
  PieChart as PieChartIcon
} from 'lucide-react';
import { cn } from './lib/utils';
import { 
  BarChart as ReBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  auth, 
  db, 
  loginWithGoogle, 
  logout, 
  onAuthStateChanged, 
  onSnapshot, 
  collection, 
  doc,
  updateDoc,
  query, 
  orderBy, 
  addDoc, 
  deleteDoc,
  getDocs,
  where,
  Timestamp,
  User,
  OperationType,
  handleFirestoreError
} from './firebase';

// --- Types ---
type Tab = 'home' | 'transactions' | 'add' | 'payments' | 'reports';

interface Transaction {
  id: string;
  title: string;
  date: any; // Firestore Timestamp or string
  amount: number;
  category: string;
  type: 'income' | 'expense';
  icon: any;
  location?: string;
  note?: string;
  isRecurring?: boolean;
  frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  lastGeneratedDate?: any;
  createdAt?: any;
  startDate?: any;
  endDate?: any;
  customRule?: string;
}

interface Payment {
  id: string;
  title: string;
  dueDate: any;
  amount: number;
  status: 'pending' | 'automatic' | 'paid';
  category: string;
  icon: any;
  reminderTime?: string; // e.g., '1_day_before', '2_hours_before'
}

const CATEGORY_ICONS: Record<string, any> = {
  'Market': ShoppingBasket,
  'Kira': Building2,
  'Maaş': Wallet,
  'Ulaşım': Fuel,
  'Yemek': Utensils,
  'Alışveriş': ShoppingBag,
  'Sabit Gider': ReceiptText,
  'Fatura': Zap,
  'Keyif': Utensils,
};

// --- Components ---

const TopBar = ({ title, user, isDarkMode, onToggleTheme, onLogout, showProfile = true }: { title: string, user: User | null, isDarkMode: boolean, onToggleTheme: () => void, onLogout: () => void, showProfile?: boolean }) => (
  <header className="fixed top-0 w-full z-50 glass-nav border-b border-outline-variant/10">
    <div className="flex justify-between items-center px-6 h-20 w-full max-w-7xl mx-auto">
      <div className="flex items-center gap-4">
        {showProfile && user && (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-10 h-10 rounded-2xl bg-primary-container flex items-center justify-center overflow-hidden border border-primary/10 shadow-sm"
          >
            <img 
              src={user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`} 
              alt="User" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        )}
        {!showProfile && (
          <button className="p-2 -ml-2 rounded-full hover:bg-surface-container-low transition-colors">
            <ChevronLeft className="w-6 h-6 text-primary" />
          </button>
        )}
        <span className="font-headline font-extrabold text-primary text-xl tracking-tight">{title}</span>
      </div>
      <div className="flex items-center gap-3">
        <button 
          onClick={onToggleTheme}
          className="p-2.5 rounded-full bg-primary/5 hover:bg-primary/10 transition-all active:scale-90 duration-200 border border-primary/5"
          title={isDarkMode ? "Aydınlık Mod" : "Karanlık Mod"}
        >
          {isDarkMode ? <Sun className="w-5 h-5 text-primary" strokeWidth={2.5} /> : <Moon className="w-5 h-5 text-primary" strokeWidth={2.5} />}
        </button>
        {user && (
          <button 
            onClick={onLogout}
            className="p-2.5 rounded-full bg-error/10 text-error hover:bg-error/20 transition-all active:scale-90 duration-200 border border-error/10"
            title="Çıkış Yap"
          >
            <LogOut className="w-5 h-5" strokeWidth={2.5} />
          </button>
        )}
      </div>
    </div>
  </header>
);

const BottomNav = ({ activeTab, onTabChange }: { activeTab: Tab, onTabChange: (tab: Tab) => void }) => {
  const tabs = [
    { id: 'home', label: 'Ana Sayfa', icon: LayoutGrid },
    { id: 'transactions', label: 'İşlemler', icon: ReceiptText },
    { id: 'add', label: 'Ekle', icon: Plus, isCenter: true },
    { id: 'payments', label: 'Ödemeler', icon: CreditCard },
    { id: 'reports', label: 'Raporlar', icon: PieChartIcon },
  ];

  return (
    <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md">
      <div className="glass-nav rounded-[2.5rem] p-2.5 flex items-center justify-between shadow-2xl border border-outline-variant/20">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id as Tab)}
              className={cn(
                "relative flex flex-col items-center justify-center transition-all duration-300",
                tab.isCenter 
                  ? "w-16 h-16 -mt-12 wealth-gradient rounded-full text-white shadow-xl hover:scale-110 active:scale-95 z-10" 
                  : "flex-1 py-3 px-1 rounded-2xl",
                !tab.isCenter && isActive ? "text-primary" : "text-on-surface-variant opacity-70 hover:opacity-100"
              )}
            >
              {isActive && !tab.isCenter && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary/15 rounded-2xl -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon 
                strokeWidth={isActive ? 2.5 : 2}
                className={cn(
                  "transition-all duration-300",
                  tab.isCenter ? "w-8 h-8" : "w-6 h-6 mb-1",
                  isActive && !tab.isCenter ? "scale-110 drop-shadow-[0_0_8px_rgba(0,23,54,0.2)]" : ""
                )} 
              />
              {!tab.isCenter && (
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-tighter transition-all",
                  isActive ? "opacity-100 scale-105" : "opacity-60"
                )}>
                  {tab.label}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

// --- Screens ---

const FINANCIAL_TIPS = [
  "Gelirinizin %20'sini biriktirmeyi hedefleyin.",
  "Küçük harcamalar birikince büyük farklar yaratır.",
  "Acil durum fonu için 3-6 aylık giderinizi kenara ayırın.",
  "İndirim dönemlerini takip ederek tasarruf edebilirsiniz.",
  "Dışarıda yemek yemek yerine evde pişirmek bütçenizi rahatlatır.",
  "Aboneliklerinizi düzenli olarak gözden geçirin.",
  "Yatırım yapmadan önce borçlarınızı kapatmaya odaklanın.",
  "Harcama yapmadan önce 24 saat kuralını uygulayın.",
];

const HomeScreen = ({ user, transactions, payments, setActiveTab }: { 
  user: User, 
  transactions: Transaction[], 
  payments: Payment[],
  setActiveTab: (tab: Tab) => void
}) => {
  const totalBalance = transactions.reduce((acc, tx) => acc + tx.amount, 0);
  const monthlyIncome = transactions.filter(tx => tx.type === 'income').reduce((acc, tx) => acc + tx.amount, 0);
  const monthlyExpense = Math.abs(transactions.filter(tx => tx.type === 'expense').reduce((acc, tx) => acc + tx.amount, 0));

  const randomTip = useMemo(() => FINANCIAL_TIPS[Math.floor(Math.random() * FINANCIAL_TIPS.length)], []);

  const recommendation = useMemo(() => {
    if (monthlyExpense > monthlyIncome * 0.8 && monthlyIncome > 0) {
      return "Harcamalarınız gelirinizin %80'ini aştı. Lütfen 'Keyif' kategorisindeki harcamalarınızı gözden geçirin.";
    }
    if (payments.some(p => p.status === 'pending')) {
      return "Bekleyen ödemeleriniz var. Gecikme faizinden kaçınmak için kontrol edin.";
    }
    return "Bütçeniz şu an dengeli görünüyor. Birikim yapmaya devam edin!";
  }, [monthlyIncome, monthlyExpense, payments]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      {/* Profile Section */}
      <section className="flex items-center gap-4 px-2">
        <div className="w-16 h-16 rounded-2xl bg-primary-container flex items-center justify-center overflow-hidden border-2 border-primary/10 shadow-sm">
          <img 
            src={user.photoURL || `https://picsum.photos/seed/${user.uid}/200/200`} 
            alt="Profile" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="flex flex-col">
          <h2 className="text-xl font-headline font-extrabold text-primary tracking-tight">
            Merhaba, {user.displayName?.split(' ')[0] || 'Kullanıcı'} 👋
          </h2>
          <p className="text-xs text-on-surface-variant font-medium opacity-70">
            {user.email}
          </p>
        </div>
      </section>

      {/* Hero Card */}
      <section className="relative wealth-gradient rounded-[2.5rem] p-10 text-white overflow-hidden shadow-2xl">
        <div className="relative z-10">
          <div className="flex items-center gap-2 opacity-70 mb-2">
            <Wallet className="w-4 h-4" />
            <p className="text-[10px] font-bold tracking-widest uppercase">Toplam Bakiye</p>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold font-headline tracking-tighter mb-10 flex items-baseline gap-2">
            <span className="text-2xl opacity-60">₺</span>
            <span className="data-value">{totalBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
          </h1>
          <div className="flex gap-10">
            <div className="flex flex-col">
              <span className="text-[10px] opacity-60 uppercase font-bold tracking-wider mb-1">İşlem Sayısı</span>
              <span className="text-xl font-bold data-value">{transactions.length}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] opacity-60 uppercase font-bold tracking-wider mb-1">Aylık Değişim</span>
              <span className="text-xl font-bold text-tertiary-fixed flex items-center gap-1 data-value">
                +12.4%
                <TrendingUp className="w-5 h-5" />
              </span>
            </div>
          </div>
        </div>
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute -left-10 -bottom-10 w-64 h-64 bg-tertiary-fixed/10 rounded-full blur-2xl"></div>
      </section>

      {/* AI Insights */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-primary-container/5 border border-primary/10 p-6 rounded-[2rem] flex items-start gap-5 transition-all hover:shadow-lg hover:bg-primary-container/10"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0 shadow-md">
            <Zap className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest">Finansal İpucu</h4>
            <p className="text-sm text-on-surface-variant leading-relaxed font-medium">{randomTip}</p>
          </div>
        </motion.div>
        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-tertiary-fixed/5 border border-tertiary-fixed/20 p-6 rounded-[2rem] flex items-start gap-5 transition-all hover:shadow-lg hover:bg-tertiary-fixed/10"
        >
          <div className="w-12 h-12 rounded-2xl bg-tertiary-container text-tertiary-fixed flex items-center justify-center shrink-0 shadow-md">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-[10px] font-bold text-tertiary-container uppercase tracking-widest">Kişiselleştirilmiş Öneri</h4>
            <p className="text-sm text-on-surface-variant leading-relaxed font-medium">{recommendation}</p>
          </div>
        </motion.div>
      </section>

      {/* Stats Bento */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface-container-lowest p-8 rounded-[2rem] flex items-center justify-between shadow-sm border border-outline-variant/10">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Aylık Gelir</p>
            <h3 className="text-3xl font-bold font-headline text-on-tertiary-container data-value">
              ₺{monthlyIncome.toLocaleString('tr-TR')}
            </h3>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-on-tertiary-container/10 flex items-center justify-center text-on-tertiary-container shadow-inner">
            <ArrowDown className="w-7 h-7" />
          </div>
        </div>
        <div className="bg-surface-container-lowest p-8 rounded-[2rem] flex items-center justify-between shadow-sm border border-outline-variant/10">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Aylık Gider</p>
            <h3 className="text-3xl font-bold font-headline text-error data-value">
              ₺{monthlyExpense.toLocaleString('tr-TR')}
            </h3>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-error/10 flex items-center justify-center text-error shadow-inner">
            <ArrowUp className="w-7 h-7" />
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-bold font-headline tracking-tight">Son İşlemler</h2>
          <button 
            onClick={() => setActiveTab('transactions')}
            className="text-sm font-semibold text-primary hover:underline"
          >
            Tümünü Gör
          </button>
        </div>
        <div className="space-y-3">
          {transactions.slice(0, 3).map((tx, i) => {
            const Icon = CATEGORY_ICONS[tx.category] || ShoppingBag;
            return (
              <motion.div 
                key={tx.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-surface-container-lowest p-5 rounded-3xl flex items-center gap-5 transition-all hover:bg-surface-container-low group shadow-sm border border-outline-variant/5"
              >
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm border border-outline-variant/5",
                  tx.type === 'income' ? "bg-on-tertiary-container/10 text-on-tertiary-container" : "bg-primary/5 text-primary"
                )}>
                  <Icon className="w-7 h-7" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-on-surface text-base">{tx.title}</h4>
                    {tx.isRecurring && <Repeat className="w-3.5 h-3.5 text-primary opacity-40" />}
                  </div>
                  <p className="text-xs text-on-surface-variant font-medium opacity-60">
                    {tx.date instanceof Timestamp ? tx.date.toDate().toLocaleDateString('tr-TR') : tx.date} • {tx.location || tx.category}
                  </p>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "font-extrabold text-lg data-value",
                    tx.type === 'income' ? "text-on-tertiary-container" : "text-on-surface"
                  )}>
                    {tx.amount > 0 ? '+' : ''}₺{Math.abs(tx.amount).toLocaleString('tr-TR')}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Upcoming Payments */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold font-headline tracking-tight px-2">Yaklaşan Ödemeler</h2>
        <div className="bg-surface-container-low rounded-[2rem] p-6 space-y-4">
          {payments.length > 0 ? (
            <div className="p-4 bg-surface-container-lowest rounded-2xl flex flex-col gap-3 shadow-sm">
              <div className="flex justify-between items-start">
                <span className="px-2 py-1 bg-primary text-white text-[10px] font-bold rounded-md uppercase tracking-wider">{payments[0].category}</span>
                <span className="text-xs font-semibold text-on-surface-variant">Tarih: {payments[0].dueDate}</span>
              </div>
              <div>
                <h4 className="font-bold text-lg">₺{payments[0].amount.toLocaleString('tr-TR')}</h4>
                <p className="text-xs text-on-surface-variant">{payments[0].title}</p>
              </div>
              <button 
                onClick={() => setActiveTab('payments')}
                className="w-full py-3 bg-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 active:scale-95 transition-all"
              >
                Ödemelere Git
              </button>
            </div>
          ) : (
            <p className="text-center text-on-surface-variant text-sm py-4">Yaklaşan ödeme bulunamadı.</p>
          )}
        </div>
      </section>
    </motion.div>
  );
};

const TransactionsScreen = ({ user, transactions }: { user: User, transactions: Transaction[] }) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('Tümü');

  const monthlyExpense = Math.abs(transactions.filter(tx => tx.type === 'expense').reduce((acc, tx) => acc + tx.amount, 0));

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchesSearch = tx.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           tx.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = activeFilter === 'Tümü' || 
                           (activeFilter === 'Gelir' ? tx.type === 'income' : tx.category === activeFilter);
      return matchesSearch && matchesFilter;
    });
  }, [transactions, searchQuery, activeFilter]);

  const handleDelete = async (id: string) => {
    const path = `users/${user.uid}/transactions/${id}`;
    try {
      await deleteDoc(doc(db, path));
      setDeletingId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6 relative"
    >
      {/* Confirmation Modal */}
      <AnimatePresence>
        {deletingId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingId(null)}
              className="absolute inset-0 bg-primary/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-surface rounded-[2rem] p-8 w-full max-w-sm shadow-2xl border border-outline-variant/10"
            >
              <div className="w-16 h-16 bg-error/10 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-headline font-extrabold text-primary text-center mb-2">İşlemi Sil?</h3>
              <p className="text-on-surface-variant text-center text-sm mb-8">Bu işlem geri alınamaz. Bu harcamayı/geliri silmek istediğinizden emin misiniz?</p>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => handleDelete(deletingId)}
                  className="w-full py-4 bg-error text-white rounded-full font-bold shadow-lg shadow-error/20 active:scale-95 transition-all"
                >
                  Evet, Sil
                </button>
                <button 
                  onClick={() => setDeletingId(null)}
                  className="w-full py-4 bg-surface-container-high text-primary rounded-full font-bold active:scale-95 transition-all"
                >
                  Vazgeç
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Spending Hero */}
      <section className="relative overflow-hidden rounded-[2rem] p-8 bg-primary text-white shadow-lg">
        <div className="relative z-10">
          <p className="text-on-primary-container text-[10px] font-bold tracking-widest mb-1 opacity-80 uppercase">TOPLAM HARCAMA</p>
          <h2 className="font-headline text-4xl font-extrabold tracking-tighter">
            ₺{monthlyExpense.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
          </h2>
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-on-tertiary-container/20 text-tertiary-fixed rounded-full text-xs font-medium">
            <TrendingDown className="w-3 h-3" />
            <span>Bu ay %4 azaldı</span>
          </div>
        </div>
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-48 h-48 bg-tertiary-container opacity-20 rounded-full blur-3xl"></div>
      </section>

      {/* Search & Filter */}
      <section className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-grow relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline w-4 h-4" />
            <input 
              type="text" 
              placeholder="İşlem ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-surface-container-lowest rounded-full border-none focus:ring-2 focus:ring-primary/20 text-sm font-medium transition-all outline-none shadow-sm"
            />
          </div>
          <button className="aspect-square bg-surface-container-lowest flex items-center justify-center p-3 rounded-full hover:bg-surface-container-high transition-colors active:scale-95 shadow-sm">
            <SlidersHorizontal className="w-5 h-5 text-primary" />
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {['Tümü', 'Market', 'Yemek', 'Ulaşım', 'Gelir'].map((filter) => (
            <button 
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={cn(
                "whitespace-nowrap px-5 py-2 rounded-full text-xs font-semibold transition-all",
                activeFilter === filter ? "bg-primary text-white" : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low shadow-sm"
              )}
            >
              {filter}
            </button>
          ))}
        </div>
      </section>

      {/* Transaction List */}
      <div className="space-y-8">
        <section>
          <div className="flex justify-between items-end mb-4 px-2">
            <h3 className="font-headline text-sm font-bold text-primary tracking-tight">
              {activeFilter !== 'Tümü' ? `${activeFilter} İşlemleri` : 'Tüm İşlemler'}
            </h3>
            <span className="text-[10px] font-bold text-outline uppercase">{filteredTransactions.length} Kayıt</span>
          </div>
          <div className="space-y-3">
            {filteredTransactions.map((tx, i) => {
              const Icon = CATEGORY_ICONS[tx.category] || ShoppingBag;
              return (
                <motion.div 
                  key={tx.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center p-5 bg-surface-container-lowest rounded-3xl shadow-sm hover:shadow-md transition-all border border-outline-variant/5 group"
                >
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm border border-outline-variant/5",
                    tx.type === 'income' ? "bg-on-tertiary-container/10 text-on-tertiary-container" : "bg-primary/5 text-primary"
                  )}>
                    <Icon className="w-7 h-7" strokeWidth={2.5} />
                  </div>
                  <div className="ml-5 flex-grow">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-on-surface text-base">{tx.title}</h4>
                      {tx.isRecurring && <Repeat className="w-3.5 h-3.5 text-primary opacity-40" />}
                    </div>
                    <p className="text-xs text-on-surface-variant font-medium opacity-60">
                      {tx.date instanceof Timestamp ? tx.date.toDate().toLocaleDateString('tr-TR') : tx.date} • {tx.category}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className={cn(
                        "text-lg font-extrabold block data-value",
                        tx.type === 'income' ? "text-on-tertiary-container" : "text-on-surface"
                      )}>
                        {tx.amount > 0 ? '+' : ''}₺{Math.abs(tx.amount).toLocaleString('tr-TR')}
                      </span>
                    </div>
                    <button 
                      onClick={() => setDeletingId(tx.id)}
                      className="p-2.5 text-outline hover:text-error transition-colors rounded-xl hover:bg-error/5"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
            {filteredTransactions.length === 0 && (
              <div className="text-center py-12 bg-surface-container-low/30 rounded-[2.5rem] border-2 border-dashed border-outline-variant/20">
                <p className="text-on-surface-variant text-sm font-medium">Aradığınız kriterlere uygun işlem bulunamadı.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </motion.div>
  );
};

const AddTransactionScreen = ({ user, onComplete }: { user: User, onComplete: () => void }) => {
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('Diğer');
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [useCustomRule, setUseCustomRule] = useState(false);
  const [customWeekIndex, setCustomWeekIndex] = useState('1');
  const [customWeekday, setCustomWeekday] = useState('1');
  const [loading, setLoading] = useState(false);
  const [showEndDateConfirm, setShowEndDateConfirm] = useState(false);

  const handleSave = async () => {
    if (!amount || !title) return;
    
    if (isRecurring && endDate && !showEndDateConfirm) {
      setShowEndDateConfirm(true);
      return;
    }

    setLoading(true);
    const path = `users/${user.uid}/transactions`;
    const customRule = useCustomRule ? `${customWeekIndex}:${customWeekday}` : null;
    try {
      await addDoc(collection(db, path), {
        userId: user.uid,
        title,
        amount: type === 'expense' ? -Math.abs(Number(amount)) : Math.abs(Number(amount)),
        type,
        category,
        isRecurring,
        frequency: isRecurring ? frequency : null,
        customRule: isRecurring ? customRule : null,
        lastGeneratedDate: isRecurring ? Timestamp.fromDate(new Date(startDate)) : null,
        startDate: isRecurring ? Timestamp.fromDate(new Date(startDate)) : null,
        endDate: isRecurring && endDate ? Timestamp.fromDate(new Date(endDate)) : null,
        date: Timestamp.fromDate(new Date(startDate)),
        createdAt: Timestamp.now()
      });
      onComplete();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="space-y-10"
    >
      {/* Type Toggle */}
      <div className="bg-surface-container-low p-1.5 rounded-full flex">
        <button 
          onClick={() => setType('expense')}
          className={cn(
            "flex-1 py-3 px-6 rounded-full font-headline font-bold text-sm transition-all duration-200",
            type === 'expense' ? "bg-white text-primary shadow-sm" : "text-on-surface opacity-60"
          )}
        >
          Gider
        </button>
        <button 
          onClick={() => setType('income')}
          className={cn(
            "flex-1 py-3 px-6 rounded-full font-headline font-medium text-sm transition-all duration-200",
            type === 'income' ? "bg-white text-primary shadow-sm" : "text-on-surface opacity-60"
          )}
        >
          Gelir
        </button>
      </div>

      {/* Amount Input */}
      <div className="text-center">
        <label className="block text-[10px] font-bold tracking-widest text-on-surface-variant uppercase mb-4">TUTAR GİRİN</label>
        <div className="flex items-center justify-center gap-2">
          <span className="font-headline text-4xl font-bold text-primary">₺</span>
          <input 
            type="number" 
            placeholder="0,00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full max-w-[280px] bg-transparent border-none text-center font-headline text-6xl font-extrabold text-primary placeholder:text-surface-container-highest focus:ring-0 outline-none"
          />
        </div>
        {amount && Number(amount) > 1000 && type === 'expense' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-primary/5 rounded-2xl inline-flex items-center gap-2 border border-primary/10"
          >
            <HelpCircle className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Bu harcama bütçenizi zorlayabilir mi?</span>
          </motion.div>
        )}
      </div>

      {/* Form Bento */}
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-surface-container-low rounded-[2rem] p-6">
          <h3 className="text-[10px] font-bold text-on-surface-variant mb-4 flex items-center gap-2 uppercase tracking-wider">
            <ShoppingBasket className="w-4 h-4" /> KATEGORİ
          </h3>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {[
              { id: '1', label: 'Market', icon: ShoppingBasket },
              { id: '2', label: 'Kira', icon: Building2 },
              { id: '3', label: 'Maaş', icon: Wallet },
              { id: '4', label: 'Ulaşım', icon: Fuel },
              { id: '5', label: 'Yemek', icon: Utensils },
            ].map(cat => (
              <div 
                key={cat.id} 
                onClick={() => setCategory(cat.label)}
                className="flex flex-col items-center gap-2 min-w-[72px] cursor-pointer group"
              >
                <div className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-sm",
                  category === cat.label ? "bg-primary text-white shadow-md" : "bg-surface-container-lowest text-primary"
                )}>
                  <cat.icon className="w-6 h-6" />
                </div>
                <span className={cn("text-[10px] font-medium", category === cat.label ? "text-primary font-bold" : "text-on-surface")}>
                  {cat.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface-container-low rounded-[1.5rem] p-6">
          <h3 className="text-[10px] font-bold text-on-surface-variant mb-3 flex items-center gap-2 uppercase tracking-wider">
            <ReceiptText className="w-4 h-4" /> İŞLEM BAŞLIĞI
          </h3>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Örn: Market Alışverişi"
            className="w-full bg-surface-container-lowest rounded-xl border-none text-primary font-medium p-3 text-sm focus:ring-0 shadow-sm" 
          />
        </div>

        <div className="bg-surface-container-low rounded-[1.5rem] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-bold text-on-surface-variant flex items-center gap-2 uppercase tracking-wider">
              <Repeat className="w-4 h-4" /> TEKRARLAYAN İŞLEM
            </h3>
            <button 
              onClick={() => setIsRecurring(!isRecurring)}
              className={cn(
                "w-12 h-6 rounded-full transition-all relative",
                isRecurring ? "bg-primary" : "bg-outline-variant"
              )}
            >
              <div className={cn(
                "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                isRecurring ? "left-7" : "left-1"
              )} />
            </button>
          </div>
          
          {isRecurring && (
            <div className="space-y-4 pt-2">
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {[
                  { id: 'daily', label: 'Günlük' },
                  { id: 'weekly', label: 'Haftalık' },
                  { id: 'monthly', label: 'Aylık' },
                  { id: 'yearly', label: 'Yıllık' },
                ].map(freq => (
                  <button
                    key={freq.id}
                    onClick={() => setFrequency(freq.id as any)}
                    className={cn(
                      "px-4 py-2 rounded-full text-[10px] font-bold transition-all whitespace-nowrap",
                      frequency === freq.id ? "bg-primary text-white" : "bg-surface-container-lowest text-on-surface-variant"
                    )}
                  >
                    {freq.label}
                  </button>
                ))}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Başlangıç</label>
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-surface-container-lowest rounded-xl border-none text-primary font-medium p-3 text-sm focus:ring-0 shadow-sm" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Bitiş (Opsiyonel)</label>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-surface-container-lowest rounded-xl border-none text-primary font-medium p-3 text-sm focus:ring-0 shadow-sm" 
                  />
                </div>
              </div>

              <div className="space-y-4 pt-2 border-t border-outline-variant/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-bold text-on-surface-variant flex items-center gap-2 uppercase tracking-wider">
                    ÖZEL KURAL (AYLIK)
                  </h3>
                  <button 
                    onClick={() => setUseCustomRule(!useCustomRule)}
                    className={cn(
                      "w-10 h-5 rounded-full transition-all relative",
                      useCustomRule ? "bg-primary" : "bg-outline-variant"
                    )}
                  >
                    <div className={cn(
                      "absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all",
                      useCustomRule ? "left-5" : "left-1"
                    )} />
                  </button>
                </div>
                
                {useCustomRule && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Hafta</label>
                      <select 
                        value={customWeekIndex}
                        onChange={(e) => setCustomWeekIndex(e.target.value)}
                        className="w-full bg-surface-container-lowest rounded-xl border-none text-primary font-medium p-3 text-sm focus:ring-0 shadow-sm"
                      >
                        <option value="1">1. Hafta</option>
                        <option value="2">2. Hafta</option>
                        <option value="3">3. Hafta</option>
                        <option value="4">4. Hafta</option>
                        <option value="last">Son Hafta</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Gün</label>
                      <select 
                        value={customWeekday}
                        onChange={(e) => setCustomWeekday(e.target.value)}
                        className="w-full bg-surface-container-lowest rounded-xl border-none text-primary font-medium p-3 text-sm focus:ring-0 shadow-sm"
                      >
                        <option value="1">Pazartesi</option>
                        <option value="2">Salı</option>
                        <option value="3">Çarşamba</option>
                        <option value="4">Perşembe</option>
                        <option value="5">Cuma</option>
                        <option value="6">Cumartesi</option>
                        <option value="0">Pazar</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <button 
        onClick={handleSave}
        disabled={loading || !amount || !title}
        className="w-full wealth-gradient text-white py-5 rounded-full font-headline font-bold text-lg shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
      >
        {loading ? 'Kaydediliyor...' : (
          <>
            <CheckCircle2 className="w-6 h-6" />
            İşlemi Kaydet
          </>
        )}
      </button>

      {/* End Date Confirmation Modal */}
      <AnimatePresence>
        {showEndDateConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEndDateConfirm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-surface-container-lowest rounded-[2.5rem] p-8 shadow-2xl border border-outline-variant/20"
            >
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Repeat className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-headline font-bold text-primary">Bitiş Tarihi Onayı</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    Bu işlem <span className="font-bold text-primary">{new Date(endDate).toLocaleDateString('tr-TR')}</span> tarihinde sonlanacak şekilde ayarlanacak. Onaylıyor musunuz?
                  </p>
                </div>
                <div className="flex flex-col w-full gap-3">
                  <button 
                    onClick={() => {
                      setShowEndDateConfirm(false);
                      handleSave();
                    }}
                    className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg active:scale-95 transition-transform"
                  >
                    Evet, Onayla
                  </button>
                  <button 
                    onClick={() => setShowEndDateConfirm(false)}
                    className="w-full py-4 text-on-surface-variant font-bold hover:bg-surface-container-low rounded-2xl transition-colors"
                  >
                    Vazgeç
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const AddPaymentScreen = ({ user, onComplete }: { user: User, onComplete: () => void }) => {
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Fatura');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!amount || !title) return;
    setLoading(true);
    const path = `users/${user.uid}/payments`;
    try {
      await addDoc(collection(db, path), {
        userId: user.uid,
        title,
        amount: Number(amount),
        dueDate,
        category,
        status: 'pending',
        reminderTime: 'none',
        createdAt: Timestamp.now()
      });
      onComplete();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="space-y-10"
    >
      <div className="flex items-center gap-4">
        <button onClick={onComplete} className="p-2 rounded-full hover:bg-surface-container-low">
          <ChevronLeft className="w-6 h-6 text-primary" />
        </button>
        <h2 className="text-2xl font-headline font-extrabold text-primary">Yeni Ödeme Ekle</h2>
      </div>

      <div className="text-center">
        <label className="block text-[10px] font-bold tracking-widest text-on-surface-variant uppercase mb-4">TUTAR</label>
        <div className="flex items-center justify-center gap-2">
          <span className="font-headline text-4xl font-bold text-primary">₺</span>
          <input 
            type="number" 
            placeholder="0,00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full max-w-[280px] bg-transparent border-none text-center font-headline text-6xl font-extrabold text-primary placeholder:text-surface-container-highest focus:ring-0 outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="bg-surface-container-low rounded-[1.5rem] p-6">
          <h3 className="text-[10px] font-bold text-on-surface-variant mb-3 uppercase tracking-wider">BAŞLIK</h3>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Örn: Elektrik Faturası"
            className="w-full bg-surface-container-lowest rounded-xl border-none text-primary font-medium p-3 text-sm focus:ring-0 shadow-sm" 
          />
        </div>

        <div className="bg-surface-container-low rounded-[1.5rem] p-6">
          <h3 className="text-[10px] font-bold text-on-surface-variant mb-3 uppercase tracking-wider">SON ÖDEME TARİHİ</h3>
          <input 
            type="date" 
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full bg-surface-container-lowest rounded-xl border-none text-primary font-medium p-3 text-sm focus:ring-0 shadow-sm" 
          />
        </div>

        <div className="bg-surface-container-low rounded-[1.5rem] p-6">
          <h3 className="text-[10px] font-bold text-on-surface-variant mb-3 uppercase tracking-wider">KATEGORİ</h3>
          <select 
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-surface-container-lowest rounded-xl border-none text-primary font-medium p-3 text-sm focus:ring-0 shadow-sm"
          >
            <option value="Fatura">Fatura</option>
            <option value="Kira">Kira</option>
            <option value="Abonelik">Abonelik</option>
            <option value="Diğer">Diğer</option>
          </select>
        </div>
      </div>

      <button 
        onClick={handleSave}
        disabled={loading || !amount || !title}
        className="w-full wealth-gradient text-white py-5 rounded-full font-headline font-bold text-lg shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
      >
        {loading ? 'Kaydediliyor...' : 'Ödemeyi Kaydet'}
      </button>
    </motion.div>
  );
};

const PaymentsScreen = ({ user, payments, onAddPayment }: { user: User, payments: Payment[], onAddPayment: () => void }) => {
  const totalPending = payments.filter(p => p.status !== 'paid').reduce((acc, p) => acc + p.amount, 0);
  const activeRemindersCount = payments.filter(p => p.reminderTime && p.reminderTime !== 'none').length;
  const [reminderBillId, setReminderBillId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('list');

  const groupedPayments = useMemo(() => {
    return payments.reduce((acc, bill) => {
      const cat = bill.category || 'Diğer';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(bill);
      return acc;
    }, {} as Record<string, Payment[]>);
  }, [payments]);

  const handleSetReminder = async (billId: string, time: string) => {
    const path = `users/${user.uid}/payments/${billId}`;
    try {
      await updateDoc(doc(db, path), {
        reminderTime: time
      });
      setReminderBillId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleMarkAsPaid = async (billId: string) => {
    const path = `users/${user.uid}/payments/${billId}`;
    try {
      await updateDoc(doc(db, path), { status: 'paid' });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleDeletePayment = async (billId: string) => {
    const path = `users/${user.uid}/payments/${billId}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const REMINDER_OPTIONS = [
    { value: 'none', label: 'Yok' },
    { value: '1_hour_before', label: '1 Saat Önce' },
    { value: '2_hours_before', label: '2 Saat Önce' },
    { value: '1_day_before', label: '1 Gün Önce' },
    { value: '2_days_before', label: '2 Gün Önce' },
  ];

  const renderBillCard = (bill: Payment) => {
    const Icon = CATEGORY_ICONS[bill.category] || Zap;
    const isEditingReminder = reminderBillId === bill.id;

    return (
      <motion.div 
        key={bill.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface-container-lowest p-6 rounded-[2rem] flex flex-col gap-5 group hover:shadow-lg transition-all shadow-sm relative overflow-hidden border border-outline-variant/5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/5 group-hover:scale-110 transition-transform">
              <Icon className="w-7 h-7" strokeWidth={2.5} />
            </div>
            <div>
              <h4 className="font-bold text-on-surface text-base">{bill.title}</h4>
              <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest opacity-60">Son Gün: {bill.dueDate}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-headline font-extrabold text-xl text-primary data-value">₺{bill.amount.toLocaleString('tr-TR')}</p>
            <div className="flex flex-col items-end gap-1">
              <span className={cn(
                "text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-md",
                bill.status === 'pending' ? "bg-error/10 text-error" : 
                bill.status === 'paid' ? "bg-on-tertiary-container/10 text-on-tertiary-container" : "bg-on-tertiary-container/10 text-on-tertiary-container"
              )}>
                {bill.status === 'pending' ? 'BEKLİYOR' : 
                 bill.status === 'paid' ? 'ÖDENDİ' : 'OTOMATİK'}
              </span>
              {bill.status === 'pending' && (
                <button 
                  onClick={() => handleMarkAsPaid(bill.id)}
                  className="text-[10px] font-bold text-primary hover:underline uppercase tracking-tighter"
                >
                  Öde
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-outline-variant/10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell className={cn("w-5 h-5 transition-all", bill.reminderTime && bill.reminderTime !== 'none' ? "text-primary fill-primary/20" : "text-outline opacity-40")} />
              {bill.reminderTime && bill.reminderTime !== 'none' && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(0,23,54,0.5)]" />
              )}
            </div>
            <div className="flex flex-col">
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-widest",
                bill.reminderTime && bill.reminderTime !== 'none' ? "text-primary" : "text-outline opacity-40"
              )}>
                Hatırlatıcı
              </span>
              <span className={cn(
                "text-xs font-bold transition-all",
                bill.reminderTime && bill.reminderTime !== 'none' ? "text-primary" : "text-on-surface-variant opacity-40"
              )}>
                {bill.reminderTime && bill.reminderTime !== 'none' ? REMINDER_OPTIONS.find(o => o.value === bill.reminderTime)?.label : 'Ayarlanmadı'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleDeletePayment(bill.id)}
              className="p-2.5 text-outline hover:text-error transition-colors rounded-xl hover:bg-error/5"
            >
              <Trash2 className="w-4.5 h-4.5" />
            </button>
            <button 
              onClick={() => setReminderBillId(isEditingReminder ? null : bill.id)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm",
                isEditingReminder ? "bg-surface-container-high text-primary" : "bg-primary/5 text-primary hover:bg-primary/10"
              )}
            >
              {isEditingReminder ? 'Kapat' : 'Ayarlar'}
            </button>
          </div>
        </div>

        {isEditingReminder && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="pt-4 grid grid-cols-2 gap-2"
          >
            {REMINDER_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSetReminder(bill.id, option.value)}
                className={cn(
                  "px-3 py-2.5 rounded-xl text-[10px] font-bold transition-all border",
                  bill.reminderTime === option.value 
                    ? "bg-primary text-white border-primary shadow-md" 
                    : "bg-surface-container-low text-on-surface-variant border-outline-variant/10 hover:bg-surface-container-high"
                )}
              >
                {option.label}
              </button>
            ))}
          </motion.div>
        )}
      </motion.div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      {/* Total Pending Hero */}
      <section className="relative overflow-hidden rounded-[2rem] p-8 bg-primary text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <p className="text-on-primary-container text-[10px] font-bold uppercase tracking-widest opacity-80">Toplam Bekleyen</p>
            <h2 className="font-headline text-4xl md:text-5xl font-extrabold mt-2 tracking-tighter">
              ₺{totalPending.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </h2>
            {activeRemindersCount > 0 && (
              <div className="flex items-center gap-2 mt-3 bg-white/10 w-fit px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/10">
                <Bell className="w-3 h-3 fill-white/20" />
                <span className="text-[10px] font-bold uppercase tracking-wider">{activeRemindersCount} Aktif Hatırlatıcı</span>
              </div>
            )}
          </div>
          <button 
            onClick={onAddPayment}
            className="bg-tertiary-fixed text-primary px-6 py-3 rounded-full font-bold flex items-center gap-2 active:scale-95 duration-200 shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Ödeme Ekle
          </button>
        </div>
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-tertiary-fixed/10 rounded-full blur-3xl"></div>
      </section>

      {/* Calendar & Bills */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-surface-container-low rounded-[2rem] p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-headline text-lg font-bold text-primary">Ödeme Takvimi</h3>
            <div className="flex items-center gap-3">
              <ChevronLeft className="w-5 h-5 text-outline cursor-pointer" />
              <span className="text-sm font-bold">Nisan 2026</span>
              <ChevronRight className="w-5 h-5 text-outline cursor-pointer" />
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold text-outline uppercase tracking-wider">
            {['Pt', 'Sa', 'Çr', 'Pş', 'Cu', 'Ct', 'Pz'].map(d => <div key={d}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-10"></div>)}
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(d => (
              <div 
                key={d} 
                className={cn(
                  "h-10 flex items-center justify-center rounded-xl text-sm font-bold transition-all",
                  d === 11 ? "bg-primary text-white shadow-md" : "hover:bg-surface-container-high"
                )}
              >
                {d}
              </div>
            ))}
          </div>
        </div>

        <section className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <h3 className="font-headline text-xl font-bold text-primary">Yaklaşan Faturalar</h3>
            <div className="bg-surface-container-low p-1 rounded-full flex gap-1">
              <button 
                onClick={() => setViewMode('list')}
                className={cn(
                  "px-3 py-1.5 rounded-full text-[10px] font-bold transition-all",
                  viewMode === 'list' ? "bg-primary text-white shadow-sm" : "text-on-surface-variant hover:bg-surface-container-high"
                )}
              >
                Liste
              </button>
              <button 
                onClick={() => setViewMode('grouped')}
                className={cn(
                  "px-3 py-1.5 rounded-full text-[10px] font-bold transition-all",
                  viewMode === 'grouped' ? "bg-primary text-white shadow-sm" : "text-on-surface-variant hover:bg-surface-container-high"
                )}
              >
                Kategori
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {viewMode === 'list' ? (
              <div className="space-y-3">
                {payments.map(bill => renderBillCard(bill))}
              </div>
            ) : (
              (Object.entries(groupedPayments) as [string, Payment[]][]).map(([category, categoryBills]) => (
                <div key={category} className="space-y-3">
                  <div className="flex items-center gap-2 px-2">
                    <div className="h-px flex-grow bg-outline-variant/20"></div>
                    <h4 className="text-[10px] font-bold text-outline uppercase tracking-widest">{category}</h4>
                    <div className="h-px flex-grow bg-outline-variant/20"></div>
                  </div>
                  <div className="space-y-3">
                    {categoryBills.map(bill => renderBillCard(bill))}
                  </div>
                </div>
              ))
            )}
            {payments.length === 0 && (
              <div className="text-center py-10 bg-surface-container-lowest rounded-2xl shadow-sm">
                <p className="text-on-surface-variant text-sm">Henüz fatura eklenmemiş.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </motion.div>
  );
};

type Period = 'weekly' | 'monthly' | 'yearly';

const ReportsScreen = ({ transactions }: { transactions: Transaction[] }) => {
  const [period, setPeriod] = useState<Period>('monthly');

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter(tx => {
      const txDate = tx.date instanceof Timestamp ? tx.date.toDate() : new Date(tx.date);
      if (period === 'weekly') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return txDate >= weekAgo;
      } else if (period === 'monthly') {
        const monthAgo = new Date();
        monthAgo.setMonth(now.getMonth() - 1);
        return txDate >= monthAgo;
      } else {
        const yearAgo = new Date();
        yearAgo.setFullYear(now.getFullYear() - 1);
        return txDate >= yearAgo;
      }
    });
  }, [transactions, period]);

  const pieData = useMemo(() => {
    const categories: Record<string, number> = {};
    filteredTransactions.filter(tx => tx.type === 'expense').forEach(tx => {
      categories[tx.category] = (categories[tx.category] || 0) + Math.abs(tx.amount);
    });
    
    const total = Object.values(categories).reduce((acc, v) => acc + v, 0);
    const colors = ['#001736', '#002b5b', '#7594ca', '#cde2f9', '#a9c7ff'];
    
    return Object.entries(categories).map(([name, value], i) => ({
      name,
      value: total > 0 ? Math.round((value / total) * 100) : 0,
      amount: value,
      color: colors[i % colors.length]
    })).sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions]);

  const trendData = useMemo(() => {
    const data: Record<string, { name: string, gelir: number, gider: number }> = {};
    const now = new Date();

    if (period === 'weekly') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const label = d.toLocaleDateString('tr-TR', { weekday: 'short' });
        data[d.toDateString()] = { name: label, gelir: 0, gider: 0 };
      }
      filteredTransactions.forEach(tx => {
        const d = tx.date instanceof Timestamp ? tx.date.toDate() : new Date(tx.date);
        const key = d.toDateString();
        if (data[key]) {
          if (tx.type === 'income') data[key].gelir += tx.amount;
          else data[key].gider += Math.abs(tx.amount);
        }
      });
    } else if (period === 'monthly') {
      // Group by weeks
      for (let i = 3; i >= 0; i--) {
        const label = `${i + 1}. Hafta`;
        data[i] = { name: label, gelir: 0, gider: 0 };
      }
      filteredTransactions.forEach(tx => {
        const d = tx.date instanceof Timestamp ? tx.date.toDate() : new Date(tx.date);
        const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
        const weekIndex = 3 - Math.floor(diffDays / 7);
        if (data[weekIndex]) {
          if (tx.type === 'income') data[weekIndex].gelir += tx.amount;
          else data[weekIndex].gider += Math.abs(tx.amount);
        }
      });
    } else {
      // Group by months
      for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setMonth(now.getMonth() - i);
        const label = d.toLocaleDateString('tr-TR', { month: 'short' });
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        data[key] = { name: label, gelir: 0, gider: 0 };
      }
      filteredTransactions.forEach(tx => {
        const d = tx.date instanceof Timestamp ? tx.date.toDate() : new Date(tx.date);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (data[key]) {
          if (tx.type === 'income') data[key].gelir += tx.amount;
          else data[key].gider += Math.abs(tx.amount);
        }
      });
    }

    return Object.values(data);
  }, [filteredTransactions, period]);

  const handleDownloadReport = () => {
    const headers = ['Tarih', 'Başlık', 'Kategori', 'Tür', 'Tutar'];
    const rows = filteredTransactions.map(tx => [
      tx.date instanceof Timestamp ? tx.date.toDate().toLocaleDateString('tr-TR') : tx.date,
      tx.title,
      tx.category,
      tx.type === 'income' ? 'Gelir' : 'Gider',
      tx.amount.toString()
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `finansal_rapor_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalIncome = filteredTransactions.filter(tx => tx.type === 'income').reduce((acc, tx) => acc + tx.amount, 0);
  const totalExpense = filteredTransactions.filter(tx => tx.type === 'expense').reduce((acc, tx) => acc + Math.abs(tx.amount), 0);
  const netSavings = totalIncome - totalExpense;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-8"
    >
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-headline text-3xl font-extrabold tracking-tight text-primary">Raporlar & Analiz</h2>
          <p className="text-on-surface-variant max-w-md text-sm">Finansal sağlığınızı detaylı grafikler ve kategorik harcama analizleri ile takip edin.</p>
        </div>
        <div className="flex bg-surface-container-low p-1 rounded-full self-start md:self-auto">
          {(['weekly', 'monthly', 'yearly'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-bold transition-all",
                period === p ? "bg-primary text-white shadow-md" : "text-on-surface-variant hover:bg-surface-container-high"
              )}
            >
              {p === 'weekly' ? 'Haftalık' : p === 'monthly' ? 'Aylık' : 'Yıllık'}
            </button>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Chart Card */}
        <div className="md:col-span-8 bg-surface-container-low rounded-[2rem] p-8 flex flex-col gap-6 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-headline text-xl font-bold">Gelir vs Gider</h3>
              <p className="text-on-surface-variant text-xs font-medium">Trend analizi</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                <span className="text-[10px] font-bold uppercase tracking-wider">Gelir</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-on-primary-container"></span>
                <span className="text-[10px] font-bold uppercase tracking-wider">Gider</span>
              </div>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e1e3e4" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#43474f' }} 
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value: number) => `₺${value.toLocaleString('tr-TR')}`}
                />
                <Bar dataKey="gelir" fill="#001736" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="gider" fill="#7594ca" radius={[4, 4, 0, 0]} barSize={20} />
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Saving Card */}
        <div className="md:col-span-4 bg-primary text-white rounded-[2rem] p-8 flex flex-col justify-between overflow-hidden relative shadow-xl">
          <div className="relative z-10">
            <h3 className="font-headline text-xl font-bold mb-2">Net Tasarruf</h3>
            <div className="flex items-center gap-2 text-tertiary-fixed">
              {netSavings >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4 text-error" />}
              <span className={cn("text-sm font-bold", netSavings < 0 && "text-error")}>
                {netSavings >= 0 ? 'Pozitif Bakiye' : 'Bütçe Aşımı'}
              </span>
            </div>
            <div className="mt-8">
              <span className="text-4xl font-headline font-extrabold tracking-tighter">
                ₺{netSavings.toLocaleString('tr-TR')}
              </span>
            </div>
          </div>
          <button 
            onClick={handleDownloadReport}
            className="relative z-10 w-full bg-white/10 hover:bg-white/20 transition-colors py-4 rounded-full font-bold text-sm mt-12"
          >
            Raporu İndir (.CSV)
          </button>
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 20% 150%, #6bfe9c 0%, transparent 50%)' }}></div>
        </div>

        {/* Pie Chart */}
        <div className="md:col-span-6 bg-surface-container-low rounded-[2rem] p-8 shadow-sm">
          <h3 className="font-headline text-xl font-bold mb-8 text-primary">Harcama Dağılımı</h3>
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={pieData.length > 0 ? pieData : [{ name: 'Veri Yok', value: 100, color: '#e1e3e4' }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="amount"
                  >
                    {(pieData.length > 0 ? pieData : [{ color: '#e1e3e4' }]).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `₺${value.toLocaleString('tr-TR')}`} />
                </RePieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 w-full space-y-4">
              {pieData.map(item => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                    <span className="text-sm font-bold text-on-surface-variant">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-primary">%{item.value}</p>
                    <p className="text-[10px] text-on-surface-variant">₺{item.amount.toLocaleString('tr-TR')}</p>
                  </div>
                </div>
              ))}
              {pieData.length === 0 && <p className="text-xs text-on-surface-variant">Henüz harcama verisi yok.</p>}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const LoginScreen = () => (
  <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-surface">
    <div className="w-20 h-20 wealth-gradient rounded-3xl flex items-center justify-center mb-8 shadow-xl">
      <Wallet className="w-10 h-10 text-white" />
    </div>
    <h1 className="text-3xl font-headline font-extrabold text-primary mb-2">Portföy</h1>
    <p className="text-on-surface-variant text-center mb-12 max-w-xs">Finansal zekanızı geliştirin, harcamalarınızı kolayca takip edin.</p>
    
    <button 
      onClick={loginWithGoogle}
      className="w-full max-w-xs bg-white border border-outline-variant/30 py-4 rounded-full flex items-center justify-center gap-3 font-bold text-primary shadow-sm active:scale-95 transition-all"
    >
      <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
      Google ile Giriş Yap
    </button>
  </div>
);

const getNthWeekdayOfMonth = (year: number, month: number, weekIndex: string, weekday: number) => {
  const date = new Date(year, month, 1);
  const firstDay = date.getDay();
  let dayOffset = (weekday - firstDay + 7) % 7;
  
  if (weekIndex === 'last') {
    const lastDay = new Date(year, month + 1, 0);
    const lastWeekday = lastDay.getDay();
    let backOffset = (lastWeekday - weekday + 7) % 7;
    return new Date(year, month + 1, -backOffset);
  } else {
    const n = parseInt(weekIndex);
    const day = 1 + dayOffset + (n - 1) * 7;
    return new Date(year, month, day);
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return true; // Default to dark mode
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const processRecurring = async () => {
      const txPath = `users/${user.uid}/transactions`;
      const q = query(collection(db, txPath), where('isRecurring', '==', true));
      
      try {
        const snapshot = await getDocs(q);
        const now = new Date();
        
        for (const docSnapshot of snapshot.docs) {
          const template = docSnapshot.data() as Transaction;
          const lastGen = template.lastGeneratedDate?.toDate() || template.date?.toDate() || new Date(template.createdAt?.toDate());
          
          let nextDate = new Date(lastGen);
          let shouldGenerate = false;
          let lastGeneratedDateInLoop: Date | null = null;

          const getNextOccurrence = (currentDate: Date) => {
            let next = new Date(currentDate);
            if (template.customRule) {
              const [weekIndex, weekdayStr] = template.customRule.split(':');
              const weekday = parseInt(weekdayStr);
              // Move to next month and calculate
              let year = next.getFullYear();
              let month = next.getMonth() + 1;
              return getNthWeekdayOfMonth(year, month, weekIndex, weekday);
            } else {
              if (template.frequency === 'daily') next.setDate(next.getDate() + 1);
              else if (template.frequency === 'weekly') next.setDate(next.getDate() + 7);
              else if (template.frequency === 'monthly') next.setMonth(next.getMonth() + 1);
              else if (template.frequency === 'yearly') next.setFullYear(next.getFullYear() + 1);
              return next;
            }
          };

          nextDate = getNextOccurrence(nextDate);

          // If next date is in the past or today, generate new transaction
          while (nextDate <= now) {
            // Check if we passed the end date
            if (template.endDate && nextDate > template.endDate.toDate()) {
              break;
            }

            shouldGenerate = true;
            lastGeneratedDateInLoop = new Date(nextDate);
            await addDoc(collection(db, txPath), {
              userId: user.uid,
              title: template.title,
              amount: template.amount,
              type: template.type,
              category: template.category,
              date: Timestamp.fromDate(new Date(nextDate)),
              createdAt: Timestamp.now(),
              isRecurring: false // The generated one is not a template itself
            });

            // Move to next occurrence
            nextDate = getNextOccurrence(nextDate);
          }

          if (shouldGenerate && lastGeneratedDateInLoop) {
            await updateDoc(doc(db, txPath, docSnapshot.id), {
              lastGeneratedDate: Timestamp.fromDate(lastGeneratedDateInLoop)
            });
          }
        }
      } catch (error) {
        console.error("Error processing recurring transactions:", error);
      }
    };

    processRecurring();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setPayments([]);
      return;
    }

    const txPath = `users/${user.uid}/transactions`;
    const txQuery = query(collection(db, txPath), orderBy('date', 'desc'));
    const unsubscribeTx = onSnapshot(txQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      setTransactions(data);
    }, (err) => handleFirestoreError(err, OperationType.LIST, txPath));

    const payPath = `users/${user.uid}/payments`;
    const unsubscribePay = onSnapshot(collection(db, payPath), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
      setPayments(data);
    }, (err) => handleFirestoreError(err, OperationType.LIST, payPath));

    return () => {
      unsubscribeTx();
      unsubscribePay();
    };
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  const renderScreen = () => {
    switch (activeTab) {
      case 'home': return <HomeScreen user={user} transactions={transactions} payments={payments} setActiveTab={setActiveTab} />;
      case 'transactions': return <TransactionsScreen user={user} transactions={transactions} />;
      case 'add': return <AddTransactionScreen user={user} onComplete={() => setActiveTab('home')} />;
      case 'payments': return <PaymentsScreen user={user} payments={payments} onAddPayment={() => setActiveTab('add_payment')} />;
      case 'add_payment': return <AddPaymentScreen user={user} onComplete={() => setActiveTab('payments')} />;
      case 'reports': return <ReportsScreen transactions={transactions} />;
      default: return <HomeScreen user={user} transactions={transactions} payments={payments} setActiveTab={setActiveTab} />;
    }
  };

  const getTitle = () => {
    switch (activeTab) {
      case 'home': return 'Portföy';
      case 'transactions': return 'İşlemler';
      case 'add': return 'Yeni İşlem';
      case 'payments': return 'Ödemeler';
      case 'reports': return 'Analiz';
      default: return 'Portföy';
    }
  };

  return (
    <div className="min-h-screen pb-32 bg-surface transition-colors duration-300">
      <TopBar 
        title={getTitle()} 
        user={user} 
        isDarkMode={isDarkMode} 
        onToggleTheme={() => setIsDarkMode(!isDarkMode)} 
        onLogout={logout}
        showProfile={activeTab !== 'add'} 
      />
      
      <main className="pt-24 px-6 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {renderScreen()}
        </AnimatePresence>
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
