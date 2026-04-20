import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
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
  Filter,
  Download,
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
  Smartphone,
  Tv,
  Flame,
  LayoutGrid,
  CreditCard,
  PieChart as PieChartIcon,
  X,
  User as UserIcon,
  Settings,
  Clock,
  Edit2
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
  dueTime?: string; // HH:mm format
  amount: number;
  status: 'pending' | 'automatic' | 'paid';
  category: string;
  icon: any;
  reminderTime?: string; // Legacy field
  reminders?: string[]; // Array of strings like '1_day_before', '2_hours_before', etc.
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
  'Elektrik': Zap,
  'Su': Droplets,
  'Doğalgaz': Flame,
  'İnternet': Wifi,
  'Telefon': Smartphone,
  'TV/Yayın': Tv,
  'Aidat': Building2,
};

const BILL_SUB_CATEGORIES = [
  { id: 'Elektrik', label: 'Elektrik', icon: Zap },
  { id: 'Su', label: 'Su', icon: Droplets },
  { id: 'Doğalgaz', label: 'Doğalgaz', icon: Flame },
  { id: 'İnternet', label: 'İnternet', icon: Wifi },
  { id: 'Telefon', label: 'Telefon', icon: Smartphone },
  { id: 'TV/Yayın', label: 'TV/Yayın', icon: Tv },
  { id: 'Aidat', label: 'Aidat', icon: Building2 },
];

// --- Components ---

interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
}

const TopBar = ({ 
  title, 
  user, 
  isDarkMode, 
  onToggleTheme, 
  onLogout, 
  notifications, 
  onClearNotifications,
  activeTab 
}: { 
  title: string, 
  user: User | null, 
  isDarkMode: boolean, 
  onToggleTheme: () => void, 
  onLogout: () => void,
  notifications: AppNotification[],
  onClearNotifications: () => void,
  activeTab: Tab
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30">
      <div className="flex justify-between items-center px-6 h-20 w-full max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center overflow-hidden border border-outline-variant/50 shadow-sm">
                <img 
                  src={user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`} 
                  alt="User" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex flex-col">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest leading-none mb-1">Hoş Geldiniz</p>
                <h2 className="text-sm font-headline font-extrabold text-primary tracking-tight leading-none uppercase">
                  {user.displayName || 'Kullanıcı'}
                </h2>
              </div>
            </div>
          )}
          {activeTab !== 'home' && (
            <div className="flex items-center gap-2">
              <div className="w-px h-6 bg-outline-variant/50 ml-2"></div>
              <span className="font-headline font-extrabold text-primary text-xl tracking-tight uppercase">{title}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2.5 rounded-full bg-surface-container-low hover:bg-outline-variant/30 transition-all active:scale-95 duration-200 border border-outline-variant/50 relative"
            >
              <Bell className="w-5 h-5 text-primary" strokeWidth={2} />
              {notifications.some(n => !n.isRead) && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full border-2 border-surface animate-pulse"></span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <>
                  <div 
                    fixed="true" 
                    className="fixed inset-0 z-40 bg-black/5" 
                    onClick={() => setShowNotifications(false)} 
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-80 bg-surface border border-outline-variant shadow-2xl rounded-3xl overflow-hidden z-50 ring-1 ring-black/5"
                  >
                    <div className="p-4 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-low">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-primary">Bildirimler</h3>
                      {notifications.length > 0 && (
                        <button onClick={onClearNotifications} className="text-[10px] font-bold text-error uppercase hover:underline">Temizle</button>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto no-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center bg-surface">
                          <Bell className="w-10 h-10 text-outline-variant mx-auto mb-3 opacity-20" />
                          <p className="text-xs font-medium text-on-surface-variant">Yeni bildirim yok</p>
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} className="p-4 border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors bg-surface">
                            <p className="text-xs font-bold text-primary mb-1">{n.title}</p>
                            <p className="text-[11px] text-on-surface-variant leading-relaxed mb-2 font-medium">{n.message}</p>
                            <p className="text-[9px] font-bold text-outline opacity-60 uppercase">{n.timestamp.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-2.5 rounded-full bg-surface-container-low hover:bg-outline-variant/30 transition-all active:scale-95 duration-200 border border-outline-variant/50"
            >
              <Settings className="w-5 h-5 text-primary" strokeWidth={2} />
            </button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-64 bg-surface border border-outline-variant shadow-2xl rounded-3xl overflow-hidden z-50 p-2"
                >
                  <div className="p-3 mb-2 flex items-center gap-3 bg-surface-container-low rounded-2xl">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-headline font-bold">
                      {user?.displayName?.charAt(0) || 'K'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-primary">{user?.displayName || 'Kullanıcı'}</p>
                      <p className="text-[10px] text-on-surface-variant font-medium">{user?.email}</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-low transition-colors text-sm font-bold text-on-surface">
                      <UserIcon className="w-4 h-4" /> Hesap Bilgileri
                    </button>
                    <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-low transition-colors text-sm font-bold text-on-surface">
                      <Settings className="w-4 h-4" /> Genel Ayarlar
                    </button>
                    <button 
                      onClick={onToggleTheme}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-surface-container-low transition-colors text-sm font-bold text-on-surface"
                    >
                      <div className="flex items-center gap-3">
                        {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        {isDarkMode ? 'Aydınlık Mod' : 'Karanlık Mod'}
                      </div>
                      <div className={cn(
                        "w-10 h-5 rounded-full relative transition-colors",
                        isDarkMode ? "bg-primary" : "bg-outline-variant"
                      )}>
                        <div className={cn(
                          "absolute top-1 w-3 h-3 rounded-full transition-all",
                          isDarkMode ? "left-6 bg-surface" : "left-1 bg-white"
                        )} />
                      </div>
                    </button>
                  </div>

                  <div className="border-t border-outline-variant/30 mt-2 pt-2">
                    <button 
                      onClick={onLogout}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-error/10 transition-colors text-sm font-bold text-error"
                    >
                      <LogOut className="w-4 h-4" /> Güvenli Çıkış
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};

const BottomNav = ({ activeTab, onTabChange }: { activeTab: Tab, onTabChange: (tab: Tab) => void }) => {
  const tabs = [
    { id: 'home', label: 'Ana Sayfa', icon: LayoutGrid },
    { id: 'transactions', label: 'İşlemler', icon: ReceiptText },
    { id: 'add', label: 'Ekle', icon: Plus, isCenter: true },
    { id: 'payments', label: 'Ödemeler', icon: CreditCard },
    { id: 'reports', label: 'Raporlar', icon: PieChartIcon },
  ];

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md">
      <div className="bg-surface/90 backdrop-blur-xl rounded-full p-2 flex items-center justify-between shadow-xl border border-outline-variant/50">
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
                  ? "w-14 h-14 -mt-8 bg-primary text-surface rounded-full shadow-lg hover:scale-105 active:scale-95 z-10 border-4 border-surface" 
                  : "flex-1 py-2 px-1 rounded-full",
                !tab.isCenter && isActive ? "text-primary" : "text-on-surface-variant hover:text-primary hover:bg-outline-variant/30"
              )}
            >
              {isActive && !tab.isCenter && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary/5 rounded-full -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon 
                strokeWidth={isActive || tab.isCenter ? 2.5 : 2}
                className={cn(
                  "transition-all duration-300",
                  tab.isCenter ? "w-7 h-7" : "w-5 h-5 mb-1",
                  isActive && !tab.isCenter ? "scale-110" : ""
                )} 
              />
              {!tab.isCenter && (
                <span className={cn(
                  "text-[9px] font-bold uppercase tracking-wider transition-all",
                  isActive ? "opacity-100" : "opacity-60"
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
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  const pastTransactions = transactions.filter(tx => {
    const txDate = tx.date instanceof Timestamp ? tx.date.toDate() : new Date(tx.date);
    return txDate <= today;
  });

  const totalBalance = pastTransactions.reduce((acc, tx) => acc + tx.amount, 0);
  
  // For monthly income/expense, we should probably only look at the current month
  const currentMonthTransactions = pastTransactions.filter(tx => {
    const txDate = tx.date instanceof Timestamp ? tx.date.toDate() : new Date(tx.date);
    return txDate.getMonth() === today.getMonth() && txDate.getFullYear() === today.getFullYear();
  });

  const monthlyIncome = currentMonthTransactions.filter(tx => tx.type === 'income').reduce((acc, tx) => acc + tx.amount, 0);
  const monthlyExpense = useMemo(() => {
    const actualExpense = Math.abs(currentMonthTransactions.filter(tx => tx.type === 'expense').reduce((acc, tx) => acc + tx.amount, 0));
    const pendingPaymentsInMonth = payments
      .filter(p => {
        if (p.status === 'paid') return false;
        const pDate = p.dueDate instanceof Timestamp ? p.dueDate.toDate() : new Date(p.dueDate);
        return pDate.getMonth() === today.getMonth() && pDate.getFullYear() === today.getFullYear();
      })
      .reduce((acc, p) => acc + p.amount, 0);
    return actualExpense + pendingPaymentsInMonth;
  }, [currentMonthTransactions, payments, today]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      {/* Hero Card */}
      <section className="relative wealth-gradient rounded-3xl p-10 text-white overflow-hidden shadow-2xl border border-white/10">
        <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 opacity-80">
              <Wallet className="w-4 h-4" />
              <p className="text-[10px] font-bold tracking-widest uppercase">Toplam Bakiye</p>
            </div>
            <div className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-wider">
              {today.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
            </div>
          </div>
          <h1 className="text-5xl font-headline font-extrabold tracking-tighter mb-8 flex items-baseline gap-1">
            <span className="text-2xl opacity-60 font-medium">₺</span>
            <span className="data-value">{totalBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
          </h1>
          
          <div className="grid grid-cols-2 gap-4 pt-8 border-t border-white/20">
            <div className="space-y-3">
              <div className="flex items-center gap-2 opacity-70">
                <div className="w-6 h-6 rounded-full bg-tertiary/20 flex items-center justify-center text-white">
                  <ArrowUp className="w-3.5 h-3.5" strokeWidth={3} />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest">Gelir</p>
              </div>
              <p className="font-headline font-bold text-xl leading-none whitespace-nowrap">₺{monthlyIncome.toLocaleString('tr-TR')}</p>
            </div>
            
            <div className="space-y-3 border-l border-white/10 pl-6">
              <div className="flex items-center gap-2 opacity-70">
                <div className="w-6 h-6 rounded-full bg-error/20 flex items-center justify-center text-white">
                  <ArrowDown className="w-3.5 h-3.5" strokeWidth={3} />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest">Gider</p>
              </div>
              <p className="font-headline font-bold text-xl leading-none whitespace-nowrap">₺{monthlyExpense.toLocaleString('tr-TR')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bento */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface-container-low p-6 rounded-2xl flex items-center justify-between shadow-sm border border-outline-variant/50">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Aylık Gelir</p>
            <h3 className="text-2xl font-bold font-headline text-tertiary data-value">
              ₺{monthlyIncome.toLocaleString('tr-TR')}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary shadow-sm">
            <ArrowDown className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-surface-container-low p-6 rounded-2xl flex items-center justify-between shadow-sm border border-outline-variant/50">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Aylık Gider</p>
            <h3 className="text-2xl font-bold font-headline text-error data-value">
              ₺{monthlyExpense.toLocaleString('tr-TR')}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-error/10 flex items-center justify-center text-error shadow-sm">
            <ArrowUp className="w-6 h-6" />
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
                className="bg-surface-container-low p-4 rounded-2xl flex items-center gap-4 transition-all hover:shadow-md group border border-outline-variant/50"
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm border border-outline-variant/30",
                  tx.type === 'income' ? "bg-tertiary/10 text-tertiary" : "bg-primary/5 text-primary"
                )}>
                  <Icon className="w-5 h-5" strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-headline font-semibold text-on-surface text-sm">{tx.title}</h4>
                    {tx.isRecurring && <Repeat className="w-3 h-3 text-primary opacity-40" />}
                  </div>
                  <p className="text-[11px] text-on-surface-variant font-medium mt-0.5">
                    {tx.date instanceof Timestamp ? tx.date.toDate().toLocaleDateString('tr-TR') : tx.date} • {tx.location || tx.category}
                  </p>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "font-bold text-base data-value",
                    tx.type === 'income' ? "text-tertiary" : "text-on-surface"
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
        <div className="bg-surface-container-low rounded-3xl p-6 space-y-4 border border-outline-variant/50">
          {payments.filter(p => p.status !== 'paid').length > 0 ? (
            <div className="p-4 bg-surface rounded-2xl flex flex-col gap-3 shadow-sm border border-outline-variant/30">
              <div className="flex justify-between items-start">
                <span className="px-2 py-1 bg-primary text-surface text-[10px] font-bold rounded-md uppercase tracking-wider">
                  {payments.filter(p => p.status !== 'paid')[0].category}
                </span>
                <span className="text-xs font-semibold text-on-surface-variant">
                  Tarih: {payments.filter(p => p.status !== 'paid')[0].dueDate instanceof Timestamp ? (payments.filter(p => p.status !== 'paid')[0].dueDate as Timestamp).toDate().toLocaleDateString('tr-TR') : payments.filter(p => p.status !== 'paid')[0].dueDate}
                </span>
              </div>
              <div>
                <h4 className="font-bold text-lg">₺{payments.filter(p => p.status !== 'paid')[0].amount.toLocaleString('tr-TR')}</h4>
                <p className="text-xs text-on-surface-variant">{payments.filter(p => p.status !== 'paid')[0].title}</p>
              </div>
              <button 
                onClick={() => setActiveTab('payments')}
                className="w-full py-3 bg-primary text-surface rounded-xl text-sm font-semibold hover:opacity-90 active:scale-95 transition-all"
              >
                Ödemelere Git
              </button>
            </div>
          ) : (
            <div className="text-center py-6">
              <CheckCircle2 className="w-10 h-10 text-tertiary mx-auto mb-2 opacity-20" />
              <p className="text-sm text-on-surface-variant font-medium">Bekleyen ödemeniz bulunmuyor.</p>
            </div>
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
              className="relative bg-surface rounded-3xl p-8 w-full max-w-sm shadow-2xl border border-outline-variant/50"
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
      <section className="relative overflow-hidden rounded-3xl p-8 bg-primary text-surface shadow-xl">
        <div className="relative z-10">
          <p className="text-surface/80 text-[10px] font-bold tracking-widest mb-1 uppercase">TOPLAM HARCAMA</p>
          <h2 className="font-headline text-4xl font-extrabold tracking-tighter">
            ₺{monthlyExpense.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
          </h2>
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-surface/20 text-surface rounded-full text-xs font-medium">
            <TrendingDown className="w-3 h-3" />
            <span>Bu ay %4 azaldı</span>
          </div>
        </div>
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-48 h-48 bg-tertiary/20 rounded-full blur-3xl"></div>
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
              className="w-full pl-11 pr-4 py-3 bg-surface-container-low rounded-full border border-outline-variant/50 focus:ring-2 focus:ring-primary/20 text-sm font-medium transition-all outline-none shadow-sm"
            />
          </div>
          <button className="aspect-square bg-surface-container-low flex items-center justify-center p-3 rounded-full hover:bg-outline-variant/30 transition-colors active:scale-95 shadow-sm border border-outline-variant/50">
            <SlidersHorizontal className="w-5 h-5 text-primary" />
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {['Tümü', 'Market', 'Yemek', 'Ulaşım', 'Gelir'].map((filter) => (
            <button 
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={cn(
                "whitespace-nowrap px-5 py-2 rounded-full text-xs font-semibold transition-all border",
                activeFilter === filter ? "bg-primary text-surface border-primary" : "bg-surface-container-low text-on-surface-variant hover:bg-outline-variant/30 border-outline-variant/50 shadow-sm"
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
                  className="flex items-center p-4 bg-surface-container-low rounded-2xl shadow-sm hover:shadow-md transition-all border border-outline-variant/50 group"
                >
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm border border-outline-variant/30",
                    tx.type === 'income' ? "bg-tertiary/10 text-tertiary" : "bg-primary/5 text-primary"
                  )}>
                    <Icon className="w-5 h-5" strokeWidth={2} />
                  </div>
                  <div className="ml-4 flex-grow">
                    <div className="flex items-center gap-2">
                      <h4 className="font-headline font-semibold text-on-surface text-sm">{tx.title}</h4>
                      {tx.isRecurring && <Repeat className="w-3 h-3 text-primary opacity-40" />}
                    </div>
                    <p className="text-[11px] text-on-surface-variant font-medium mt-0.5">
                      {tx.date instanceof Timestamp ? tx.date.toDate().toLocaleDateString('tr-TR') : tx.date} • {tx.category}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className={cn(
                        "text-base font-bold block data-value",
                        tx.type === 'income' ? "text-tertiary" : "text-on-surface"
                      )}>
                        {tx.amount > 0 ? '+' : ''}₺{Math.abs(tx.amount).toLocaleString('tr-TR')}
                      </span>
                    </div>
                    <button 
                      onClick={() => setDeletingId(tx.id)}
                      className="p-2 text-outline hover:text-error transition-colors rounded-xl hover:bg-error/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
            {filteredTransactions.length === 0 && (
              <div className="text-center py-12 bg-surface-container-low/30 rounded-3xl border-2 border-dashed border-outline-variant/20">
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
    const baseAmount = type === 'expense' ? -Math.abs(Number(amount)) : Math.abs(Number(amount));
    const groupId = crypto.randomUUID();

    try {
      if (isRecurring) {
        const transactionsToCreate = [];
        let currentDate = new Date(startDate);
        // Default to 1 year if no end date is provided
        const finalDate = endDate ? new Date(endDate) : new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), currentDate.getDate());
        
        let count = 0;
        while (currentDate <= finalDate && count < 120) { // Max 120 occurrences to prevent infinite loops
          transactionsToCreate.push({
            userId: user.uid,
            title,
            amount: baseAmount,
            type,
            category,
            isRecurring: true,
            recurringGroupId: groupId,
            frequency,
            customRule,
            startDate: Timestamp.fromDate(new Date(startDate)),
            endDate: endDate ? Timestamp.fromDate(new Date(endDate)) : null,
            date: Timestamp.fromDate(new Date(currentDate)),
            createdAt: Timestamp.now()
          });

          // Increment date based on frequency
          if (frequency === 'daily') {
            currentDate.setDate(currentDate.getDate() + 1);
          } else if (frequency === 'weekly') {
            currentDate.setDate(currentDate.getDate() + 7);
          } else if (frequency === 'monthly') {
            currentDate.setMonth(currentDate.getMonth() + 1);
          } else if (frequency === 'yearly') {
            currentDate.setFullYear(currentDate.getFullYear() + 1);
          }
          count++;
        }

        // Save all generated transactions
        await Promise.all(transactionsToCreate.map(tx => addDoc(collection(db, path), tx)));
      } else {
        await addDoc(collection(db, path), {
          userId: user.uid,
          title,
          amount: baseAmount,
          type,
          category,
          isRecurring: false,
          date: Timestamp.fromDate(new Date(startDate)),
          createdAt: Timestamp.now()
        });
      }
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
      <div className="bg-surface-container-low p-1.5 rounded-full flex border border-outline-variant/30">
        <button 
          onClick={() => setType('expense')}
          className={cn(
            "flex-1 py-3 px-6 rounded-full font-headline font-bold text-sm transition-all duration-300",
            type === 'expense' ? "bg-primary text-surface shadow-lg" : "text-on-surface-variant hover:text-primary"
          )}
        >
          Gider
        </button>
        <button 
          onClick={() => setType('income')}
          className={cn(
            "flex-1 py-3 px-6 rounded-full font-headline font-bold text-sm transition-all duration-300",
            type === 'income' ? "bg-primary text-surface shadow-lg" : "text-on-surface-variant hover:text-primary"
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
        <div className="bg-surface-container-low rounded-3xl p-6 border border-outline-variant/50">
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
                    category === cat.label ? "bg-primary text-surface shadow-md" : "bg-surface text-primary"
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
                "absolute top-1 w-4 h-4 rounded-full transition-all",
                isRecurring ? "left-7 bg-surface" : "left-1 bg-white"
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
                      frequency === freq.id ? "bg-primary text-surface" : "bg-surface-container-lowest text-on-surface-variant"
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
              className="relative w-full max-w-sm bg-surface rounded-3xl p-8 shadow-2xl border border-outline-variant/50"
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
                    className="w-full py-4 bg-primary text-surface rounded-2xl font-bold shadow-lg active:scale-95 transition-transform"
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
  const [dueTime, setDueTime] = useState('09:00');
  const [category, setCategory] = useState('Fatura');
  const [subCategory, setSubCategory] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!amount || !title) return;
    setLoading(true);
    const finalCategory = category === 'Fatura' && subCategory ? subCategory : category;
    const path = `users/${user.uid}/payments`;
    try {
      await addDoc(collection(db, path), {
        userId: user.uid,
        title,
        amount: Number(amount),
        dueDate,
        dueTime,
        category: finalCategory,
        status: 'pending',
        reminders: [],
        createdAt: Timestamp.now()
      });
      onComplete();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (category === 'Fatura' && subCategory) {
      setTitle(`${subCategory} Faturası`);
    } else if (category === 'Kira') {
      setTitle('Ev Kirası');
    } else if (category === 'Abonelik') {
      setTitle('Dijital Abonelik');
    }
  }, [category, subCategory]);

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
        <h2 className="text-2xl font-headline font-extrabold text-primary tracking-tighter">Yeni Ödeme Ekle</h2>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface-container-low rounded-[1.5rem] p-6 col-span-full">
          <h3 className="text-[10px] font-bold text-on-surface-variant mb-3 uppercase tracking-wider">KATEGORİ</h3>
          <div className="flex flex-col gap-3">
            <select 
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                if (e.target.value !== 'Fatura') setSubCategory('');
              }}
              className="w-full bg-surface-container-lowest rounded-xl border-none text-primary font-medium p-3 text-sm focus:ring-0 shadow-sm"
            >
              <option value="Fatura">Fatura</option>
              <option value="Kira">Kira</option>
              <option value="Abonelik">Abonelik</option>
              <option value="Market">Market</option>
              <option value="Diğer">Diğer</option>
            </select>
            
            {category === 'Fatura' && (
              <motion.select 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                className="w-full bg-surface-container-lowest rounded-xl border-none text-primary font-medium p-3 text-sm focus:ring-0 shadow-sm"
              >
                <option value="">Fatura Tipi Seçin...</option>
                {BILL_SUB_CATEGORIES.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.label}</option>
                ))}
              </motion.select>
            )}
          </div>
        </div>

        <div className="bg-surface-container-low rounded-[1.5rem] p-6 col-span-full">
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
          <h3 className="text-[10px] font-bold text-on-surface-variant mb-3 uppercase tracking-wider">SON GÜN</h3>
          <input 
            type="date" 
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full bg-surface-container-lowest rounded-xl border-none text-primary font-medium p-3 text-sm focus:ring-0 shadow-sm" 
          />
        </div>

        <div className="bg-surface-container-low rounded-[1.5rem] p-6">
          <h3 className="text-[10px] font-bold text-on-surface-variant mb-3 uppercase tracking-wider">ÖDEME SAATİ</h3>
          <input 
            type="time" 
            value={dueTime}
            onChange={(e) => setDueTime(e.target.value)}
            className="w-full bg-surface-container-lowest rounded-xl border-none text-primary font-medium p-3 text-sm focus:ring-0 shadow-sm" 
          />
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
  const activeRemindersCount = payments.filter(p => (p.reminders && p.reminders.length > 0) || (p.reminderTime && p.reminderTime !== 'none')).length;
  const [reminderBillId, setReminderBillId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('list');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday, 1 is Monday

  const prevMonth = () => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };

  const nextMonth = () => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };

  const monthLabels = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

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
    const bill = payments.find(p => p.id === billId);
    if (!bill) return;

    const path = `users/${user.uid}/payments/${billId}`;
    const txPath = `users/${user.uid}/transactions`;
    try {
      await updateDoc(doc(db, path), { status: 'paid' });
      
      // Add as transaction
      await addDoc(collection(db, txPath), {
        userId: user.uid,
        title: bill.title,
        amount: -Math.abs(bill.amount),
        type: 'expense',
        category: bill.category,
        date: Timestamp.now(),
        createdAt: Timestamp.now(),
        paymentId: billId // Reference to source payment
      });
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

  const handleUpdatePayment = async (updatedBill: any) => {
    if (!editingPayment) return;
    const path = `users/${user.uid}/payments/${editingPayment.id}`;
    const txPath = `users/${user.uid}/transactions`;
    
    try {
      const wasNotPaid = editingPayment.status !== 'paid';
      const isNowPaid = updatedBill.status === 'paid';

      await updateDoc(doc(db, path), updatedBill);

      // If status changed to paid, create a transaction
      if (wasNotPaid && isNowPaid) {
        await addDoc(collection(db, txPath), {
          userId: user.uid,
          title: editingPayment.title,
          amount: -Math.abs(updatedBill.amount || editingPayment.amount),
          type: 'expense',
          category: editingPayment.category,
          date: Timestamp.now(),
          createdAt: Timestamp.now(),
          paymentId: editingPayment.id
        });
      }

      setEditingPayment(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const REMINDER_OPTIONS = [
    { value: '1_hour_before', label: '1 Saat Önce', type: 'time' },
    { value: '2_hours_before', label: '2 Saat Önce', type: 'time' },
    { value: '1_day_before', label: '1 Gün Önce', type: 'day' },
    { value: '2_days_before', label: '2 Gün Önce', type: 'day' },
  ];

  const renderBillCard = (bill: Payment) => {
    const Icon = CATEGORY_ICONS[bill.category] || Zap;
    const isEditingReminder = reminderBillId === bill.id;
    const currentReminders = bill.reminders || (bill.reminderTime && bill.reminderTime !== 'none' ? [bill.reminderTime] : []);

    const handleToggleReminder = async (billId: string, optionValue: string) => {
      const path = `users/${user.uid}/payments/${billId}`;
      let newReminders = [...currentReminders];
      if (newReminders.includes(optionValue)) {
        newReminders = newReminders.filter(r => r !== optionValue);
      } else {
        newReminders.push(optionValue);
      }
      
      try {
        await updateDoc(doc(db, path), {
          reminders: newReminders,
          reminderTime: newReminders.length > 0 ? newReminders[0] : 'none' // Backwards compatibility
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    };

    return (
      <motion.div 
        key={bill.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface-container-low p-6 rounded-3xl flex flex-col gap-5 group hover:shadow-lg transition-all shadow-sm relative overflow-hidden border border-outline-variant/50"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/5 group-hover:scale-110 transition-transform">
              <Icon className="w-7 h-7" strokeWidth={2.5} />
            </div>
            <div>
              <h4 className="font-bold text-on-surface text-base">{bill.title}</h4>
              <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest opacity-60">Son Gün: {bill.dueDate} {bill.dueTime && `• ${bill.dueTime}`}</p>
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
              <Bell className={cn("w-5 h-5 transition-all", currentReminders.length > 0 ? "text-primary fill-primary/20" : "text-outline opacity-40")} />
              {currentReminders.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(0,23,54,0.5)]" />
              )}
            </div>
            <div className="flex flex-col">
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-widest",
                currentReminders.length > 0 ? "text-primary" : "text-outline opacity-40"
              )}>
                Hatırlatıcılar
              </span>
              <span className={cn(
                "text-xs font-bold transition-all",
                currentReminders.length > 0 ? "text-primary" : "text-on-surface-variant opacity-40"
              )}>
                {currentReminders.length > 0 
                  ? `${currentReminders.length} Adet Aktif` 
                  : 'Ayarlanmadı'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setEditingPayment(bill)}
              className="p-2.5 text-outline hover:text-primary transition-colors rounded-xl hover:bg-primary/5"
            >
              <Search className="w-4.5 h-4.5" />
            </button>
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
        <ReminderSettingsModal 
          bill={bill} 
          currentReminders={currentReminders} 
          handleToggleReminder={handleToggleReminder}
          onClose={() => setReminderBillId(null)}
        />
      )}

      {editingPayment && (
        <EditPaymentModal 
          payment={editingPayment} 
          onSave={handleUpdatePayment} 
          onClose={() => setEditingPayment(null)} 
        />
      )}
    </motion.div>
  );
};

const ReminderSettingsModal = ({ bill, currentReminders, handleToggleReminder, onClose }: any) => {
  const REMINDER_OPTIONS = [
    { value: '1_hour_before', label: '1 Saat Önce' },
    { value: '2_hours_before', label: '2 Saat Önce' },
    { value: '1_day_before', label: '1 Gün Önce' },
    { value: '2_days_before', label: '2 Gün Önce' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/20 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-surface rounded-3xl p-8 w-full max-w-sm shadow-2xl space-y-6"
      >
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-headline font-bold text-primary">Hatırlatıcı Ayarları</h3>
          <button onClick={onClose} className="p-2 hover:bg-surface-container-low rounded-full">
            <Search className="w-5 h-5 text-on-surface-variant rotate-45" />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {REMINDER_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleToggleReminder(bill.id, option.value)}
              className={cn(
                "px-4 py-3 rounded-2xl text-sm font-bold transition-all border flex items-center justify-between",
                currentReminders.includes(option.value) 
                  ? "bg-primary text-surface border-primary shadow-md" 
                  : "bg-surface-container-low text-on-surface-variant border-outline-variant/10 hover:bg-surface-container-high"
              )}
            >
              {option.label}
              {currentReminders.includes(option.value) && <CheckCircle2 className="w-4 h-4" />}
            </button>
          ))}
        </div>
        <button 
          onClick={onClose}
          className="w-full wealth-gradient text-white py-4 rounded-2xl font-bold flex items-center justify-center"
        >
          Tamam
        </button>
      </motion.div>
    </div>
  );
};

const EditPaymentModal = ({ payment, onSave, onClose }: any) => {
  const [amount, setAmount] = useState(payment.amount.toString());
  const [dueDate, setDueDate] = useState(payment.dueDate);
  const [status, setStatus] = useState(payment.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/20 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-surface rounded-3xl p-8 w-full max-w-sm shadow-2xl space-y-6"
      >
        <h3 className="text-xl font-headline font-bold text-primary">Ödemeyi Düzenle</h3>
        
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-2">TUTAR</label>
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-surface-container-low p-4 rounded-2xl border-none focus:ring-0 font-bold text-primary"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-2">TARİH</label>
            <input 
              type="date" 
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-surface-container-low p-4 rounded-2xl border-none focus:ring-0 font-bold text-primary"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-2">DURUM</label>
            <select 
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-surface-container-low p-4 rounded-2xl border-none focus:ring-0 font-bold text-primary"
            >
              <option value="pending">BEKLİYOR</option>
              <option value="paid">ÖDENDİ</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-4 text-on-surface-variant font-bold hover:bg-surface-container-low rounded-2xl transition-colors">Vazgeç</button>
          <button 
            onClick={() => onSave({ amount: Number(amount), dueDate, status })}
            className="flex-1 wealth-gradient text-white py-4 rounded-2xl font-bold shadow-lg"
          >
            Kaydet
          </button>
        </div>
      </motion.div>
    </div>
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
      <section className="relative overflow-hidden rounded-3xl p-8 wealth-gradient text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <p className="text-on-primary-container text-xs font-semibold uppercase tracking-wider opacity-80">Toplam Bekleyen</p>
            <h2 className="font-headline text-4xl md:text-5xl font-bold mt-2 tracking-tight">
              ₺{totalPending.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </h2>
            {activeRemindersCount > 0 && (
              <div className="flex items-center gap-2 mt-4 bg-white/10 w-fit px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/10">
                <Bell className="w-3 h-3 fill-white/20" />
                <span className="text-[10px] font-bold uppercase tracking-wider">{activeRemindersCount} Aktif Hatırlatıcı</span>
              </div>
            )}
          </div>
          <button 
            onClick={onAddPayment}
            className="bg-surface text-primary px-6 py-3 rounded-full font-bold flex items-center gap-2 active:scale-95 duration-200 shadow-sm hover:bg-surface-container-low transition-colors"
          >
            <Plus className="w-5 h-5" />
            Ödeme Ekle
          </button>
        </div>
      </section>

      {/* Calendar & Bills */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-surface-container-low rounded-3xl p-6 space-y-6 border border-outline-variant/50">
          <div className="flex justify-between items-center">
            <h3 className="font-headline text-lg font-bold text-primary">Ödeme Takvimi</h3>
            <div className="flex items-center gap-3">
              <button 
                onClick={prevMonth}
                className="p-1 hover:bg-surface-container-high rounded-full transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-outline" />
              </button>
              <span className="text-sm font-bold min-w-[100px] text-center">
                {monthLabels[currentMonth]} {currentYear}
              </span>
              <button 
                onClick={nextMonth}
                className="p-1 hover:bg-surface-container-high rounded-full transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-outline" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold text-outline uppercase tracking-wider">
            {['Pz', 'Pt', 'Sa', 'Çr', 'Pş', 'Cu', 'Ct'].map(d => <div key={d}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={i} className="h-10"></div>)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const formattedDate = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
              const dayPayments = payments.filter(p => {
                const pDate = p.dueDate instanceof Timestamp ? p.dueDate.toDate().toISOString().split('T')[0] : p.dueDate;
                return pDate === formattedDate && p.status !== 'paid';
              });
              const today = new Date();
              const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

              return (
                <div 
                  key={day} 
                  className={cn(
                    "h-12 flex flex-col items-center justify-center rounded-xl text-sm font-bold transition-all relative border border-transparent",
                    isToday ? "bg-primary text-surface shadow-md" : "hover:bg-surface-container-high bg-surface-container-lowest"
                  )}
                >
                  <span className={cn(isToday ? "text-surface" : "text-on-surface")}>{day}</span>
                  {dayPayments.length > 0 && (
                    <div className="flex gap-0.5 mt-1">
                      {dayPayments.slice(0, 3).map((p, idx) => (
                        <div key={idx} className={cn("w-1.5 h-1.5 rounded-full", isToday ? "bg-surface" : "bg-primary shadow-sm")}></div>
                      ))}
                      {dayPayments.length > 3 && <div className={cn("w-1 h-1 rounded-full", isToday ? "bg-surface" : "bg-primary shadow-sm")}></div>}
                    </div>
                  )}
                </div>
              );
            })}
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
                  viewMode === 'list' ? "bg-primary text-surface shadow-sm" : "text-on-surface-variant hover:bg-surface-container-high"
                )}
              >
                Liste
              </button>
              <button 
                onClick={() => setViewMode('grouped')}
                className={cn(
                  "px-3 py-1.5 rounded-full text-[10px] font-bold transition-all",
                  viewMode === 'grouped' ? "bg-primary text-surface shadow-sm" : "text-on-surface-variant hover:bg-surface-container-high"
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

const ReportsScreen = ({ transactions, payments, isDarkMode }: { transactions: Transaction[], payments: Payment[], isDarkMode: boolean }) => {
  const [period, setPeriod] = useState<Period>('monthly');
  const [categoryFilter, setCategoryFilter] = useState<string>('Tümü');

  const categories = useMemo(() => {
    const cats = Array.from(new Set([...transactions.map(tx => tx.category), ...payments.map(p => p.category)]));
    return ['Tümü', ...cats.sort()];
  }, [transactions, payments]);

  const filteredData = useMemo(() => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);

    const checkPeriod = (date: Date) => {
      if (period === 'weekly') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return date >= weekAgo && date <= now;
      } else if (period === 'monthly') {
        const monthAgo = new Date();
        monthAgo.setMonth(now.getMonth() - 1);
        return date >= monthAgo && date <= now;
      } else {
        const yearAgo = new Date();
        yearAgo.setFullYear(now.getFullYear() - 1);
        return date >= yearAgo && date <= now;
      }
    };

    const txs = transactions.filter(tx => {
      const txDate = tx.date instanceof Timestamp ? tx.date.toDate() : new Date(tx.date);
      if (!checkPeriod(txDate)) return false;
      if (categoryFilter !== 'Tümü' && tx.category !== categoryFilter) return false;
      return true;
    }).map(tx => ({ ...tx, isPlanned: false }));

    const pays = payments.filter(p => {
      if (p.status === 'paid') return false; // Already in transactions
      const pDate = p.dueDate instanceof Timestamp ? p.dueDate.toDate() : new Date(p.dueDate);
      if (!checkPeriod(pDate)) return false;
      if (categoryFilter !== 'Tümü' && p.category !== categoryFilter) return false;
      return true;
    }).map(p => ({
      id: p.id,
      title: p.title,
      amount: -Math.abs(p.amount),
      type: 'expense' as const,
      category: p.category,
      date: p.dueDate,
      isPlanned: true
    }));

    return [...txs, ...pays].sort((a, b) => {
      const dateA = a.date instanceof Timestamp ? a.date.toDate() : new Date(a.date);
      const dateB = b.date instanceof Timestamp ? b.date.toDate() : new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });
  }, [transactions, payments, period, categoryFilter]);

  const pieData = useMemo(() => {
    const cats: Record<string, number> = {};
    filteredData.filter(item => item.type === 'expense').forEach(item => {
      cats[item.category] = (cats[item.category] || 0) + Math.abs(item.amount);
    });
    
    const total = Object.values(cats).reduce((acc, v) => acc + v, 0);
    const colors = isDarkMode 
      ? ['#60A5FA', '#34D399', '#F87171', '#FBBC05', '#A78BFA'] // Brighter in dark
      : ['#1E3A8A', '#059669', '#DC2626', '#EA580C', '#7C3AED'];
    
    return Object.entries(cats).map(([name, value], i) => ({
      name,
      value: total > 0 ? Math.round((value / total) * 100) : 0,
      amount: value,
      color: colors[i % colors.length]
    })).sort((a, b) => b.amount - a.amount);
  }, [filteredData, isDarkMode]);

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
      filteredData.forEach(item => {
        const d = item.date instanceof Timestamp ? item.date.toDate() : new Date(item.date);
        const key = d.toDateString();
        if (data[key]) {
          if (item.type === 'income') data[key].gelir += item.amount;
          else data[key].gider += Math.abs(item.amount);
        }
      });
    } else if (period === 'monthly') {
      for (let i = 3; i >= 0; i--) {
        const label = `${i + 1}. Hafta`;
        data[i] = { name: label, gelir: 0, gider: 0 };
      }
      filteredData.forEach(item => {
        const d = item.date instanceof Timestamp ? item.date.toDate() : new Date(item.date);
        const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
        const weekIndex = 3 - Math.floor(diffDays / 7);
        if (data[weekIndex] && weekIndex >= 0) {
          if (item.type === 'income') data[weekIndex].gelir += item.amount;
          else data[weekIndex].gider += Math.abs(item.amount);
        }
      });
    } else {
      for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setMonth(now.getMonth() - i);
        const label = d.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' });
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        data[key] = { name: label, gelir: 0, gider: 0 };
      }
      filteredData.forEach(item => {
        const d = item.date instanceof Timestamp ? item.date.toDate() : new Date(item.date);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (data[key]) {
          if (item.type === 'income') data[key].gelir += item.amount;
          else data[key].gider += Math.abs(item.amount);
        }
      });
    }

    return Object.values(data);
  }, [filteredData, period]);

  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Finansal Rapor", pageWidth / 2, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Donem: ${period === 'weekly' ? 'Haftalik' : period === 'monthly' ? 'Aylik' : 'Yillik'}`, 14, 30);
    doc.text(`Kategori: ${categoryFilter}`, 14, 35);
    doc.text(`Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}`, 14, 40);

    const totalInc = filteredData.filter(item => item.type === 'income').reduce((acc, item) => acc + item.amount, 0);
    const totalExp = filteredData.filter(item => item.type === 'expense').reduce((acc, item) => acc + Math.abs(item.amount), 0);
    const net = totalInc - totalExp;

    doc.setFont("helvetica", "bold");
    doc.text(`Toplam Gelir: ${totalInc.toLocaleString('tr-TR')} TL`, 14, 55);
    doc.text(`Toplam Gider: ${totalExp.toLocaleString('tr-TR')} TL`, 14, 62);
    doc.text(`Net Tasarruf: ${net.toLocaleString('tr-TR')} TL`, 14, 69);

    const headers = [['Tarih', 'Baslik', 'Kategori', 'Tur', 'Durum', 'Tutar']];
    const rows = filteredData.map(item => [
      item.date instanceof Timestamp ? item.date.toDate().toLocaleDateString('tr-TR') : item.date,
      item.title,
      item.category,
      item.type === 'income' ? 'Gelir' : 'Gider',
      item.isPlanned ? 'Planli' : 'Gerceklesmis',
      `${item.amount.toLocaleString('tr-TR')} TL`
    ]);

    (doc as any).autoTable({
      head: headers,
      body: rows,
      startY: 80,
      styles: { fontSize: 8 },
      headStyles: { fillStyle: '#001736' }
    });

    doc.save(`finansal_rapor_${period}.pdf`);
  };

  const totalIncome = filteredData.filter(item => item.type === 'income').reduce((acc, item) => acc + item.amount, 0);
  const totalExpense = filteredData.filter(item => item.type === 'expense').reduce((acc, item) => acc + Math.abs(item.amount), 0);
  const netSavings = totalIncome - totalExpense;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-8"
    >
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="font-headline text-3xl font-extrabold tracking-tight text-primary">Raporlar & Analiz</h2>
          <p className="text-on-surface-variant max-w-md text-sm">Finansal sağlığınızı detaylı grafikler ve planlı harcama analizleri ile takip edin.</p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="bg-surface-container-low px-4 py-1.5 rounded-full flex items-center gap-2 border border-outline-variant/30 shadow-sm">
            <Filter className="w-3.5 h-3.5 text-primary" />
                  <select 
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-transparent border-none text-[10px] font-bold uppercase tracking-widest text-primary focus:ring-0 cursor-pointer appearance-none pr-6"
                  >
                    {categories.map(c => <option key={c} value={c} className="bg-surface text-on-surface">{c}</option>)}
                  </select>
          </div>

          <div className="flex bg-surface-container-low p-1 rounded-full border border-outline-variant/30">
            {(['weekly', 'monthly', 'yearly'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-4 py-2 rounded-full text-xs font-bold transition-all",
                  period === p ? "bg-primary text-surface shadow-md" : "text-on-surface-variant hover:bg-surface-container-high"
                )}
              >
                {p === 'weekly' ? 'Haftalık' : p === 'monthly' ? 'Aylık' : 'Yıllık'}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-8 bg-surface-container-low rounded-3xl p-8 flex flex-col gap-6 shadow-sm border border-outline-variant/50">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-headline text-xl font-bold">Gelir vs Gider</h3>
              <p className="text-on-surface-variant text-xs font-medium">Trend analizi (Bekleyen ödemeler dahil)</p>
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
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--outline-variant)" opacity={0.5} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--on-surface-variant)' }} 
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: 'var(--on-surface-variant)', opacity: 0.1 }}
                  contentStyle={{ 
                    backgroundColor: 'var(--surface)', 
                    color: 'var(--on-surface)',
                    borderRadius: '16px', 
                    border: '1px solid var(--outline-variant)', 
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)' 
                  }}
                  itemStyle={{ color: 'var(--primary)', fontWeight: 'bold' }}
                  formatter={(value: number) => `₺${value.toLocaleString('tr-TR')}`}
                />
                <Bar dataKey="gelir" fill="var(--tertiary)" radius={[6, 6, 0, 0]} barSize={24} />
                <Bar dataKey="gider" fill="var(--error)" radius={[6, 6, 0, 0]} barSize={24} />
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        </div>

          <div className="md:col-span-4 wealth-gradient text-white rounded-3xl p-8 flex flex-col justify-between overflow-hidden relative shadow-xl min-h-[220px]">
          <div className="relative z-10">
            <h3 className="font-headline text-lg font-bold mb-1">Net Tasarruf</h3>
            <div className="flex items-center gap-2 text-tertiary-fixed">
              {netSavings >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5 text-error" />}
              <span className={cn("text-[10px] font-bold uppercase tracking-wider", netSavings < 0 && "text-error")}>
                {netSavings >= 0 ? 'Pozitif Bakiye' : 'Bütçe Aşımı'}
              </span>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-headline font-extrabold tracking-tight">
                ₺{netSavings.toLocaleString('tr-TR')}
              </span>
            </div>
          </div>
          <button 
            onClick={handleDownloadPdf}
            className="relative z-10 w-full bg-surface/10 hover:bg-surface/20 text-white backdrop-blur-md transition-colors py-3 rounded-xl font-bold text-[10px] mt-6 border border-white/10 flex items-center justify-center gap-2 uppercase tracking-widest"
          >
            <Download className="w-3.5 h-3.5" />
            Raporu İndir
          </button>
        </div>

        <div className="md:col-span-4 bg-surface-container-low rounded-3xl p-8 shadow-sm border border-outline-variant/50 flex flex-col justify-center">
          <h3 className="font-headline text-xl font-bold mb-8 text-primary">Harcama Dağılımı</h3>
          <div className="flex flex-col items-center gap-8">
            <div className="w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--surface)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    itemStyle={{ color: 'var(--on-surface)' }}
                    formatter={(value: number) => `₺${value.toLocaleString('tr-TR')}`} 
                  />
                  <Pie
                    data={pieData.length > 0 ? pieData : [{ name: 'Veri Yok', value: 100, color: 'var(--outline-variant)' }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={isDarkMode ? 55 : 60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="amount"
                    stroke="none"
                  >
                    {(pieData.length > 0 ? pieData : [{ color: 'var(--outline-variant)' }]).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </RePieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full space-y-3">
              {pieData.slice(0, 4).map(item => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{item.name}</span>
                  </div>
                  <p className="text-xs font-extrabold text-primary">%{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="md:col-span-8 bg-surface-container-low rounded-3xl p-8 shadow-sm border border-outline-variant/50">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline text-xl font-bold text-primary">İşlem Detayları</h3>
            <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-full uppercase tracking-widest">
              {filteredData.length} İşlem
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/30">
                  <th className="py-4 px-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Tarih</th>
                  <th className="py-4 px-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Başlık</th>
                  <th className="py-4 px-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Durum</th>
                  <th className="py-4 px-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest text-right">Tutar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {filteredData.map((item) => {
                  const Icon = CATEGORY_ICONS[item.category] || ShoppingBag;
                  return (
                    <tr key={item.id} className={cn("hover:bg-surface-container-high transition-colors", item.isPlanned && "bg-primary/5")}>
                      <td className="py-4 px-2">
                        <p className="text-xs font-bold text-on-surface-variant">
                          {item.date instanceof Timestamp ? item.date.toDate().toLocaleDateString('tr-TR') : typeof item.date === 'string' ? item.date : new Date(item.date).toLocaleDateString('tr-TR')}
                        </p>
                      </td>
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center shadow-sm",
                            item.type === 'income' ? "bg-tertiary/10 text-tertiary" : "bg-primary/5 text-primary"
                          )}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-on-surface">{item.title}</p>
                            <p className="text-[9px] font-bold text-on-surface-variant uppercase">{item.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <span className={cn(
                          "text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-tighter",
                          item.isPlanned ? "bg-primary/10 text-primary" : "bg-surface-container-highest text-on-surface-variant"
                        )}>
                          {item.isPlanned ? 'PLANLI' : 'ÖDENDİ'}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-right">
                        <p className={cn(
                          "text-sm font-extrabold data-value",
                          item.type === 'income' ? "text-tertiary" : "text-on-surface"
                        )}>
                          {item.type === 'income' ? '+' : '-'}₺{Math.abs(item.amount).toLocaleString('tr-TR')}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredData.length === 0 && (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-outline mx-auto mb-4 opacity-20" />
                <p className="text-sm text-on-surface-variant font-medium">Bu filtre ile sonuç bulunamadı.</p>
              </div>
            )}
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
    <h1 className="text-4xl font-headline font-extrabold text-primary mb-2 tracking-tighter">Ödeme Hatırlatıcı</h1>
    <p className="text-on-surface-variant text-center mb-12 max-w-xs font-medium">Finansal zekanızı geliştirin, harcamalarınızı kolayca takip edin.</p>
    
    <button 
      onClick={loginWithGoogle}
      className="w-full max-w-xs bg-primary text-surface py-4 rounded-full flex items-center justify-center gap-3 font-bold shadow-xl active:scale-95 transition-all"
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

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notifiedReminders, setNotifiedReminders] = useState<Set<string>>(new Set());

  const addNotification = (title: string, message: string) => {
    const newNote: AppNotification = {
      id: crypto.randomUUID(),
      title,
      message,
      timestamp: new Date(),
      isRead: false
    };
    setNotifications(prev => [newNote, ...prev].slice(0, 50));
  };

  useEffect(() => {
    if (!user || payments.length === 0) return;

    const checkReminders = () => {
      const now = new Date();
      const currentNotified = new Set(notifiedReminders);
      let changed = false;

      payments.forEach(p => {
        if (p.status === 'paid') return;
        const pDate = p.dueDate instanceof Timestamp ? p.dueDate.toDate() : new Date(p.dueDate);
        const [hours, minutes] = (p.dueTime || "09:00").split(':').map(Number);
        
        const billTime = new Date(pDate);
        billTime.setHours(hours, minutes, 0, 0);

        const activeReminders = p.reminders || (p.reminderTime && p.reminderTime !== 'none' ? [p.reminderTime] : []);

        activeReminders.forEach(rem => {
          let remTime = new Date(billTime);
          if (rem === '1_hour_before') remTime.setHours(remTime.getHours() - 1);
          else if (rem === '2_hours_before') remTime.setHours(remTime.getHours() - 2);
          else if (rem === '1_day_before') remTime.setDate(remTime.getDate() - 1);
          else if (rem === '2_days_before') remTime.setDate(remTime.getDate() - 2);

          const reminderKey = `${p.id}-${rem}`;
          
          // If remTime is in the past and we haven't notified for this specific reminder yet
          if (now >= remTime && !currentNotified.has(reminderKey)) {
            // Only notify if within last 24 hours to avoid historic spam on login
            if (now.getTime() - remTime.getTime() < 24 * 60 * 60 * 1000) {
              addNotification(`Ödeme Hatırlatıcı: ${p.title}`, `${p.title} faturanız için ödeme zamanı yaklaşıyor (${rem === '1_hour_before' ? '1 saat kaldı' : rem === '1_day_before' ? '1 gün kaldı' : rem}).`);
              currentNotified.add(reminderKey);
              changed = true;
            }
          }
        });
      });

      if (changed) {
        setNotifiedReminders(currentNotified);
      }
    };

    const interval = setInterval(checkReminders, 60000); // Check every minute
    checkReminders(); // Initial check

    return () => clearInterval(interval);
  }, [user, payments, notifiedReminders]);

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
      case 'reports': return <ReportsScreen transactions={transactions} payments={payments} isDarkMode={isDarkMode} />;
      default: return <HomeScreen user={user} transactions={transactions} payments={payments} setActiveTab={setActiveTab} />;
    }
  };

  const getTitle = () => {
    switch (activeTab) {
      case 'home': return '';
      case 'transactions': return 'İşlemler';
      case 'add': return 'Yeni İşlem';
      case 'payments': return 'Ödemeler';
      case 'reports': return 'Analiz';
      default: return '';
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
        notifications={notifications}
        onClearNotifications={() => setNotifications([])}
        activeTab={activeTab}
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
