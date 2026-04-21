import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { useState, useEffect, useMemo, useRef, memo } from 'react';
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
  ChevronDown,
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
  CheckSquare,
  ListChecks,
  PieChart as PieChartIcon,
  X,
  User as UserIcon,
  Settings,
  Clock,
  Calendar,
  Edit2,
  Landmark,
  Receipt,
  FileText,
  Banknote,
  Coins,
  Copy,
  ShieldCheck
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
type Tab = 'home' | 'transactions' | 'add' | 'payments' | 'settings';

interface Transaction {
  id: string;
  title: string;
  date: any; // Firestore Timestamp or string
  amount: number;
  category: string;
  subCategory?: string;
  type: 'income' | 'expense';
  icon: any;
  location?: string;
  note?: string;
  description?: string;
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
  createdAt?: any;
  dueTime?: string; // HH:mm format
  amount: number;
  status: 'pending' | 'automatic' | 'paid';
  category: string;
  subCategory?: string;
  icon: any;
  note?: string;
  description?: string;
  reminderTime?: string; // Legacy field
  reminders?: string[]; // Array of strings like '1_day_before', '2_hours_before', etc.
  isRecurring?: boolean;
}

const CATEGORY_ICONS: Record<string, any> = {
  'Maaş': Wallet,
  'Kira': Building2,
  'Alışveriş': ShoppingBag,
  'Kredi': Landmark,
  'Kredi Kartı': CreditCard,
  'Fatura': FileText,
  'Diğer': HelpCircle,
  'Ek Gelir': Coins,
  'Sabit Gider': ReceiptText,
  'Elektrik': Zap,
  'Su': Droplets,
  'Doğalgaz': Flame,
  'İnternet': Wifi,
  'Telefon': Smartphone,
  'Abonelik': Repeat,
  'Market': ShoppingBag,
};

const CATEGORY_COLORS: Record<string, string> = {
  // Gelir (Income)
  'Maaş': 'bg-emerald-500/10 text-emerald-500',
  'Ek Gelir': 'bg-sky-500/10 text-sky-500',
  'Satış': 'bg-teal-500/10 text-teal-500',
  'Bonus': 'bg-lime-500/10 text-lime-600',
  
  // Gider (Expense)
  'Kredi': 'bg-violet-500/10 text-violet-500',
  'Kredi Kartı': 'bg-fuchsia-500/10 text-fuchsia-500',
  'Kira': 'bg-blue-600/10 text-blue-600',
  'Alışveriş': 'bg-rose-500/10 text-rose-500',
  'Abonelik': 'bg-indigo-600/10 text-indigo-600',
  'Sabit Gider': 'bg-slate-500/10 text-slate-500',
  
  // Alt Fatura/Ödeme Tipleri
  'Fatura': 'bg-amber-500/10 text-amber-500',
  'Elektrik': 'bg-yellow-500/10 text-yellow-600',
  'Su': 'bg-cyan-500/10 text-cyan-500',
  'Doğalgaz': 'bg-orange-600/10 text-orange-600',
  'İnternet': 'bg-blue-500/10 text-blue-500',
  'Telefon': 'bg-green-500/10 text-green-500',
  
  'Diğer': 'bg-zinc-500/10 text-zinc-500'
};

const COLOR_MAP: Record<string, string> = {
  'emerald-500': '#10b981',
  'sky-500': '#0ea5e9',
  'indigo-500': '#6366f1',
  'teal-500': '#14b8a6',
  'lime-500': '#84cc16',
  'lime-600': '#65a30d',
  'violet-500': '#8b5cf6',
  'fuchsia-500': '#d946ef',
  'blue-600': '#2563eb',
  'rose-500': '#f43f5e',
  'indigo-600': '#4f46e5',
  'slate-500': '#64748b',
  'amber-500': '#f59e0b',
  'yellow-500': '#eab308',
  'yellow-600': '#ca8a04',
  'cyan-500': '#06b6d4',
  'orange-600': '#ea580c',
  'blue-500': '#3b82f6',
  'green-500': '#22c55e',
  'zinc-500': '#71717a'
};

const getBorderColorValue = (categoryColor: string) => {
  const match = categoryColor.match(/text-([a-z0-9-]+)/);
  if (!match) return '#3b82f6'; // default primary
  const colorName = match[1];
  return COLOR_MAP[colorName] || '#3b82f6';
};

const BANK_OPTIONS = [
  'Ziraat Bankası',
  'İş Bankası',
  'Garanti BBVA',
  'Yapı Kredi',
  'Akbank',
  'QNB Finansbank',
  'DenizBank',
  'VakıfBank',
  'Halkbank',
  'TEB',
  'ING',
  'Enpara',
  'Diğer'
];

const BILL_SUB_CATEGORIES = [
  { id: 'Elektrik', label: 'Elektrik', icon: Zap, color: 'text-amber-500' },
  { id: 'Su', label: 'Su', icon: Droplets, color: 'text-blue-500' },
  { id: 'Doğalgaz', label: 'Doğalgaz', icon: Flame, color: 'text-orange-600' },
  { id: 'İnternet', label: 'İnternet', icon: Wifi, color: 'text-indigo-500' },
  { id: 'Telefon', label: 'Telefon', icon: Smartphone, color: 'text-green-500' },
];

const INCOME_CATEGORIES = [
  { id: 'inc-1', label: 'Maaş', icon: Wallet },
  { id: 'inc-2', label: 'Ek Gelir', icon: Coins },
  { id: 'inc-3', label: 'Satış', icon: ShoppingBag },
  { id: 'inc-4', label: 'Bonus', icon: Banknote },
  { id: 'inc-5', label: 'Diğer', icon: HelpCircle },
];

const EXPENSE_CATEGORIES = [
  { id: 'exp-1', label: 'Fatura', icon: FileText },
  { id: 'exp-2', label: 'Kredi', icon: Landmark },
  { id: 'exp-3', label: 'Kredi Kartı', icon: CreditCard },
  { id: 'exp-4', label: 'Kira', icon: Building2 },
  { id: 'exp-5', label: 'Abonelik', icon: Repeat },
  { id: 'exp-9', label: 'Diğer', icon: HelpCircle },
];

// --- Components ---

interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
}

const MONTH_NAMES_TR = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

const DatePickerModal = ({ 
  isOpen, 
  onClose, 
  value, 
  onChange, 
  title = "Son Ödeme Tarihi" 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  value: string; 
  onChange: (date: string) => void;
  title?: string;
}) => {
  const [tempDay, setTempDay] = useState(1);
  const [tempMonth, setTempMonth] = useState(0); // 0-indexed
  const [tempYear, setTempYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (isOpen && value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setTempDay(d.getDate());
        setTempMonth(d.getMonth());
        setTempYear(d.getFullYear());
      }
    }
  }, [isOpen, value]);

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const result = [];
    for (let i = currentYear - 5; i <= currentYear + 10; i++) {
      result.push(i);
    }
    return result;
  }, []);

  const daysInMonth = useMemo(() => {
    return new Date(tempYear, tempMonth + 1, 0).getDate();
  }, [tempYear, tempMonth]);

  const days = useMemo(() => {
    const result = [];
    for (let i = 1; i <= daysInMonth; i++) {
      result.push(i);
    }
    return result;
  }, [daysInMonth]);

  useEffect(() => {
    if (tempDay > daysInMonth) {
      setTempDay(daysInMonth);
    }
  }, [daysInMonth, tempDay]);

  const handleSave = () => {
    const d = new Date(tempYear, tempMonth, tempDay);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
    onClose();
  };

  const Column = memo(({ 
    items, 
    value, 
    onChange 
  }: { 
    items: (string | number)[], 
    value: number, 
    onChange: (val: number) => void 
  }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const itemHeight = 44;
    const [activeIndex, setActiveIndex] = useState(0);
    const isScrolling = useRef(false);
    const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

    // Initial positioning
    useEffect(() => {
      let targetIndex = -1;
      if (typeof items[0] === 'string') {
        targetIndex = value; 
      } else {
        targetIndex = items.indexOf(value);
      }

      if (scrollRef.current && targetIndex !== -1 && !isScrolling.current) {
        scrollRef.current.scrollTop = targetIndex * itemHeight;
        setActiveIndex(targetIndex);
      }
    }, [value, items]);

    const handleScroll = () => {
      if (!scrollRef.current) return;
      isScrolling.current = true;
      
      const scrollPos = scrollRef.current.scrollTop;
      const index = Math.round(scrollPos / itemHeight);
      
      if (index !== activeIndex && index >= 0 && index < items.length) {
        setActiveIndex(index);
      }

      // Clear existing timeout
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);

      // We update parent state slightly delayed or when scroll settles
      // but to keep it feeling fast we use 30ms - feels instant but breaks the re-render loop
      scrollTimeout.current = setTimeout(() => {
        isScrolling.current = false;
        if (index >= 0 && index < items.length) {
          let newValue: number;
          if (typeof items[index] === 'string') {
            newValue = index;
          } else {
            newValue = items[index] as number;
          }
          onChange(newValue);
        }
      }, 30);
    };

    return (
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto no-scrollbar snap-y snap-mandatory h-[220px] py-[88px] overscroll-none touch-pan-y"
      >
        {items.map((item, i) => (
          <div 
            key={i}
            className={cn(
              "h-[44px] flex items-center justify-center snap-center text-lg pointer-events-none transition-colors duration-150",
              i === activeIndex 
                ? "text-primary font-bold" 
                : "text-on-surface-variant/20"
            )}
          >
            {item}
          </div>
        ))}
      </div>
    );
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-full max-w-lg bg-surface rounded-t-[32px] overflow-hidden shadow-2xl pb-safe"
          >
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-outline-variant/10">
              <button 
                onClick={onClose} 
                className="text-on-surface-variant font-bold text-base hover:opacity-70 transition-opacity"
              >
                İptal
              </button>
              <h3 className="font-headline font-bold text-on-surface text-lg">{title}</h3>
              <button 
                onClick={handleSave} 
                className="text-primary font-bold text-base hover:opacity-70 transition-opacity"
              >
                Kaydet
              </button>
            </div>

            {/* Content */}
            <div className="p-6 relative bg-surface-container-lowest">
              {/* Highlight Bar */}
              <div className="absolute top-1/2 left-6 right-6 h-11 -translate-y-1/2 bg-primary/5 rounded-2xl pointer-events-none border border-primary/10 shadow-inner" />
              
              <div className="flex gap-4">
                <Column items={days} value={tempDay} onChange={setTempDay} />
                <Column items={MONTH_NAMES_TR} value={tempMonth} onChange={setTempMonth} />
                <Column items={years} value={tempYear} onChange={setTempYear} />
              </div>
            </div>

            {/* Grabber for touch devices */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-outline-variant/30" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const TopBar = ({ 
  user, 
  isDarkMode, 
  onToggleTheme, 
  onLogout, 
  notifications, 
  activeTab,
  showMenu,
  setShowMenu,
  showNotifications,
  setShowNotifications,
  toggleMenu,
  toggleNotifications,
}: { 
  user: User | null, 
  isDarkMode: boolean, 
  onToggleTheme: () => void, 
  onLogout: () => void,
  notifications: AppNotification[],
  activeTab: Tab,
  showMenu: boolean,
  setShowMenu: (v: boolean) => void,
  showNotifications: boolean,
  setShowNotifications: (v: boolean) => void,
  toggleMenu: () => void,
  toggleNotifications: () => void,
}) => {
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
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button 
              onClick={toggleNotifications}
              className="p-2 rounded-xl bg-surface-container-low hover:bg-outline-variant/30 transition-all active:scale-95 duration-200 border border-outline-variant/50 relative"
            >
              <Bell className="w-4.5 h-4.5 text-primary" strokeWidth={2} />
              {notifications.some(n => !n.isRead) && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-error rounded-full border-2 border-surface animate-pulse"></span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

const BottomNav = ({ activeTab, onTabChange }: { activeTab: Tab, onTabChange: (tab: Tab) => void }) => {
  const tabs = [
    { id: 'home', label: 'Anasayfa', icon: LayoutGrid },
    { id: 'transactions', label: 'Hareketler', icon: ReceiptText },
    { id: 'add', label: 'Ekle', icon: Plus, isCenter: true },
    { id: 'payments', label: 'Planlı', icon: CheckSquare },
    { id: 'settings', label: 'Ayarlar', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[96%] max-w-md">
      <div className="bg-surface/90 backdrop-blur-xl rounded-2xl p-2 flex items-center justify-between shadow-2xl border border-outline-variant/30">
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
                  ? "w-14 h-14 -mt-8 bg-primary rounded-[1.25rem] shadow-lg hover:scale-105 active:scale-95 z-10 border-[5px] border-surface" 
                  : "flex-1 py-2.5 px-1 rounded-xl",
                !tab.isCenter && (isActive ? "text-primary" : "text-on-surface-variant hover:text-primary")
              )}
            >
              {isActive && !tab.isCenter && (
                <motion.div 
                  layoutId="activeTabUnderline"
                  className="absolute bottom-0 w-1.5 h-1.5 bg-primary rounded-full"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon 
                strokeWidth={isActive || tab.isCenter ? 2.5 : 2}
                className={cn(
                  "transition-all duration-300",
                  tab.isCenter ? "w-6 h-6 text-surface" : "w-[22px] h-[22px] mb-1",
                  isActive && !tab.isCenter ? "scale-110" : "opacity-70"
                )} 
              />
              {!tab.isCenter && (
                <span className={cn(
                  "text-[9px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                  isActive ? "opacity-100" : "opacity-50"
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

// --- Components ---

function ConfirmModal({ title, message, onConfirm, onCancel, confirmText = "Sil", cancelText = "Vazgeç", type = "danger" }: any) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-surface rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 w-full max-w-sm shadow-2xl border border-outline-variant/20"
      >
        <div className={cn(
          "w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6",
          type === 'danger' ? "bg-error/10 text-error" : "bg-primary/10 text-primary"
        )}>
          {type === 'danger' ? <Trash2 className="w-6 h-6 sm:w-8 sm:h-8" /> : <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8" />}
        </div>
        
        <h3 className="text-lg sm:text-xl font-headline font-extrabold text-center text-on-surface mb-1 sm:mb-2">{title}</h3>
        <p className="text-on-surface-variant text-center text-[13px] sm:text-sm font-medium mb-6 sm:mb-8 leading-relaxed max-w-[240px] mx-auto">
          {message}
        </p>

        <div className="flex flex-col gap-2.5 sm:gap-3">
          <button 
            onClick={onConfirm}
            className={cn(
              "w-full py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold font-headline shadow-lg active:scale-[0.98] transition-all text-sm sm:text-base",
              type === 'danger' ? "bg-error text-white" : "wealth-gradient text-white"
            )}
          >
            {confirmText}
          </button>
          <button 
            onClick={onCancel}
            className="w-full py-3 sm:py-4 text-on-surface-variant font-bold text-xs sm:text-sm hover:bg-surface-container-low rounded-xl sm:rounded-2xl transition-all"
          >
            {cancelText}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ReminderSettingsModal({ bill, currentReminders, handleToggleReminder, onClose }: any) {
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
            <X className="w-5 h-5 text-on-surface-variant" />
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
}

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

  const recentActivity = useMemo(() => {
    const combined = [
      ...transactions.map(tx => ({
        id: tx.id,
        title: tx.title,
        amount: Math.abs(tx.amount), // ensure absolute, sign via type
        type: tx.type,
        category: tx.category,
        subCategory: tx.subCategory,
        date: tx.date,
        createdAt: tx.createdAt instanceof Timestamp ? tx.createdAt.toDate().getTime() : (tx.date instanceof Timestamp ? tx.date.toDate().getTime() : new Date(tx.date).getTime()),
        isRecurring: tx.isRecurring,
        location: tx.location
      })),
      ...payments.map(p => ({
        id: `payment-${p.id}`,
        title: p.title,
        amount: Math.abs(p.amount),
        type: 'expense' as const,
        category: p.category,
        subCategory: p.subCategory,
        date: p.dueDate,
        createdAt: p.createdAt instanceof Timestamp ? p.createdAt.toDate().getTime() : (p.dueDate instanceof Timestamp ? p.dueDate.toDate().getTime() : new Date(p.dueDate).getTime()),
        isRecurring: false,
        location: 'Ödeme' // or Fatura
      }))
    ];
    
    // Sort by createdAt descending (most recently entered first)
    return combined.sort((a, b) => b.createdAt - a.createdAt).slice(0, 3);
  }, [transactions, payments]);

  const [chartFilter, setChartFilter] = useState<'income' | 'expense'>('expense');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const pieData = useMemo(() => {
    const categories: Record<string, { name: string, value: number, color: string, count: number }> = {};
    const BILL_CATEGORIES = ['Elektrik', 'Su', 'Doğalgaz', 'İnternet', 'Telefon', 'TV/Yayın', 'Aidat'];
    
    // Filter pending payments for the current month
    const pendingPaymentsInMonth = payments.filter(p => {
      if (p.status === 'paid') return false;
      const pDate = p.dueDate instanceof Timestamp ? p.dueDate.toDate() : new Date(p.dueDate);
      return pDate.getMonth() === today.getMonth() && pDate.getFullYear() === today.getFullYear();
    });

    currentMonthTransactions.forEach(tx => {
      if (tx.type !== chartFilter) return;
      
      const key = BILL_CATEGORIES.includes(tx.category) ? 'Fatura' : tx.category;
      if (!categories[key]) {
        categories[key] = { 
          name: key, 
          value: 0, 
          color: '', 
          count: 0 
        };
      }
      categories[key].value += Math.abs(tx.amount);
      categories[key].count += 1;
    });

    // Add pending payments to the distribution if not filtering for income
    if (chartFilter !== 'income') {
      pendingPaymentsInMonth.forEach(payment => {
        const rawCategory = payment.category || 'Ödeme';
        const key = BILL_CATEGORIES.includes(rawCategory) ? 'Fatura' : rawCategory;
        if (!categories[key]) {
          categories[key] = { 
            name: key, 
            value: 0, 
            color: '', 
            count: 0 
          };
        }
        categories[key].value += payment.amount;
        categories[key].count += 1;
      });
    }

    const categoryPalette = [
      '#6366f1', // Indigo
      '#ec4899', // Pink
      '#f59e0b', // Amber
      '#10b981', // Emerald
      '#3b82f6', // Blue
      '#8b5cf6', // Violet
      '#f43f5e', // Rose
      '#06b6d4', // Cyan
      '#eab308', // Yellow
      '#14b8a6', // Teal
      '#f97316'  // Orange
    ];
    
    return Object.values(categories)
      .sort((a, b) => b.value - a.value)
      .map((cat, i) => ({
        ...cat,
        color: categoryPalette[i % categoryPalette.length]
      }));
  }, [currentMonthTransactions, payments, chartFilter, today]);

  const totalValue = pieData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6 sm:space-y-8"
    >
      {/* Hero Card */}
      <section className="relative wealth-gradient rounded-3xl p-5 sm:p-8 text-white overflow-hidden shadow-2xl border border-white/10">
        <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2 opacity-80">
              <Wallet className="w-3.5 h-3.5" />
              <p className="text-[10px] font-bold tracking-widest uppercase">Toplam Bakiye</p>
            </div>
            <div className="px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[9px] font-bold uppercase tracking-wider">
              {today.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-headline font-extrabold tracking-tighter mb-4 sm:mb-6 flex items-baseline gap-1 overflow-hidden">
            <span className="text-base sm:text-xl opacity-60 font-medium">₺</span>
            <span className="data-value truncate">{totalBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
          </h1>
          
          <div className="grid grid-cols-2 gap-4 pt-4 sm:pt-6 border-t border-white/20">
            <div className="space-y-2">
              <div className="flex items-center gap-2 opacity-70">
                <div className="w-5 h-5 rounded-full bg-tertiary/20 flex items-center justify-center text-white shrink-0">
                  <ArrowUp className="w-3 h-3" strokeWidth={3} />
                </div>
                <p className="text-[9px] font-bold uppercase tracking-widest truncate">Gelir</p>
              </div>
              <p className="font-headline font-bold text-base sm:text-lg leading-none truncate">₺{monthlyIncome.toLocaleString('tr-TR')}</p>
            </div>
            
            <div className="space-y-2 border-l border-white/10 pl-5">
              <div className="flex items-center gap-2 opacity-70">
                <div className="w-5 h-5 rounded-full bg-error/20 flex items-center justify-center text-white shrink-0">
                  <ArrowDown className="w-3 h-3" strokeWidth={3} />
                </div>
                <p className="text-[9px] font-bold uppercase tracking-widest truncate">Gider</p>
              </div>
              <p className="font-headline font-bold text-base sm:text-lg leading-none truncate">₺{monthlyExpense.toLocaleString('tr-TR')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Analytics Chart Section */}
      <section className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-bold font-headline tracking-tight leading-tight max-w-[200px]">Gelir Gider Analizi</h2>
          
          <div className="relative">
            <button 
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-low border border-outline-variant/50 rounded-xl text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-outline-variant/20 transition-all shadow-sm z-10"
            >
              <Filter className="w-2.5 h-2.5" />
              {chartFilter === 'income' ? 'Gelirler' : 'Giderler'}
            </button>

            <AnimatePresence>
              {showFilterDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowFilterDropdown(false)} />
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-40 bg-surface border border-outline-variant/50 rounded-2xl shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="p-1">
                      {[
                        { id: 'income', label: 'Gelirler', icon: ArrowUp, color: 'text-tertiary' },
                        { id: 'expense', label: 'Giderler', icon: ArrowDown, color: 'text-error' }
                      ].map((option) => (
                        <button
                          key={option.id}
                          onClick={() => {
                            setChartFilter(option.id as any);
                            setShowFilterDropdown(false);
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors",
                            chartFilter === option.id ? "bg-primary/10 text-primary" : "hover:bg-surface-container-low text-on-surface-variant"
                          )}
                        >
                          <option.icon className={cn("w-4 h-4", option.color || "text-primary")} />
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="bg-surface-container-low rounded-3xl p-4 sm:p-6 border border-outline-variant/50 shadow-sm flex flex-row items-center gap-3 sm:gap-8">
          <div className="w-[140px] h-[140px] sm:w-[200px] sm:h-[200px] shrink-0 relative">
            <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
                <RePieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius="65%"
                    outerRadius="85%"
                    paddingAngle={4}
                    minAngle={15}
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={800}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                </RePieChart>
              </ResponsiveContainer>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-2 z-10 overflow-hidden rounded-full">
              <p className="text-[8px] sm:text-[10px] font-bold text-outline uppercase tracking-widest leading-none mb-1">Toplam</p>
              <p className="text-xs sm:text-base font-bold font-headline text-primary w-full text-center truncate px-2 sm:px-3">
                ₺{totalValue.toLocaleString('tr-TR')}
              </p>
            </div>
          </div>

          <div className="w-full flex-1 overflow-y-auto no-scrollbar h-[140px] sm:h-[200px] pr-1">
            {pieData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full opacity-40">
                <PieChartIcon className="w-5 h-5 mb-1" />
                <p className="text-[9px] font-bold uppercase tracking-widest text-center">Veri Yok</p>
              </div>
            ) : (
              pieData.map((item, i) => (
                <motion.div 
                  key={item.name}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between py-1.5 border-b border-outline-variant/10 last:border-0 hover:bg-surface-container-low px-1 transition-all group"
                >
                  <div className="flex items-center gap-1.5 min-w-0 pr-2">
                    <div 
                      className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0" 
                      style={{ backgroundColor: item.color }} 
                    />
                    <span className="text-[9px] sm:text-[10px] font-bold text-on-surface uppercase tracking-tight truncate">
                      {item.name}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[9px] sm:text-[10px] font-bold text-primary">
                      ₺{item.value.toLocaleString('tr-TR')}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>

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
        <div className="space-y-2">
          {recentActivity.map((tx, i) => {
            const Icon = (tx.subCategory && CATEGORY_ICONS[tx.subCategory]) || CATEGORY_ICONS[tx.category] || ShoppingBag;
            const categoryColor = (tx.subCategory && CATEGORY_COLORS[tx.subCategory]) || CATEGORY_COLORS[tx.category] || (tx.type === 'income' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500");
            return (
              <motion.div 
                key={tx.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-surface-container-low p-3.5 sm:p-4 rounded-2xl flex items-center gap-3 transition-all hover:shadow-md group border border-outline-variant/30 shadow-sm overflow-hidden relative"
                style={{ borderLeft: `6px solid ${getBorderColorValue(categoryColor)}` }}
              >
                <div className={cn(
                  "w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm border border-outline-variant/30 shrink-0",
                  categoryColor
                )}>
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-headline font-bold text-on-surface text-sm sm:text-base truncate leading-tight line-clamp-1">{tx.title}</h4>
                    {tx.isRecurring && <Repeat className="w-3 h-3 text-primary opacity-40 shrink-0" />}
                  </div>
                  <p className="text-[11px] text-on-surface-variant font-semibold truncate mt-1">
                    {tx.subCategory || tx.category} • {tx.date instanceof Timestamp ? tx.date.toDate().toLocaleDateString('tr-TR') : String(tx.date).split('-').reverse().join('/')}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className={cn(
                    "font-bold text-base sm:text-lg data-value tracking-tighter",
                    tx.type === 'income' ? "text-emerald-500" : "text-rose-500"
                  )}>
                    {tx.type === 'income' ? '+' : '-'}₺{Math.abs(tx.amount).toLocaleString('tr-TR')}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Upcoming Payments */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-bold font-headline tracking-tight">Yaklaşan Ödemeler</h2>
        </div>
        <div className="space-y-2">
          {payments.filter(p => {
            if (p.status === 'paid') return false;
            const dueDate = p.dueDate instanceof Timestamp ? p.dueDate.toDate() : new Date(p.dueDate);
            dueDate.setHours(23, 59, 59, 999);
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            
            const diffTime = dueDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            // Show unpaid payments that are either overdue (diffDays < 0) or due within the next 15 days
            return diffDays <= 15;
          }).sort((a, b) => {
            const dateA = a.dueDate instanceof Timestamp ? a.dueDate.toDate() : new Date(a.dueDate);
            const dateB = b.dueDate instanceof Timestamp ? b.dueDate.toDate() : new Date(b.dueDate);
            return dateA.getTime() - dateB.getTime();
          }).map((p, i) => {
            const dueDate = p.dueDate instanceof Timestamp ? p.dueDate.toDate() : new Date(p.dueDate);
            dueDate.setHours(23, 59, 59, 999);
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            const diffTime = dueDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            const Icon = (p.subCategory && CATEGORY_ICONS[p.subCategory]) || CATEGORY_ICONS[p.category] || Zap;
            const categoryColor = (p.subCategory && CATEGORY_COLORS[p.subCategory]) || CATEGORY_COLORS[p.category] || "bg-primary/10 text-primary";
            
            return (
              <motion.div 
                key={p.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => setActiveTab('payments')}
                className="bg-surface-container-low p-3.5 sm:p-4 rounded-2xl flex items-center gap-3 transition-all hover:shadow-md group border border-outline-variant/30 cursor-pointer shadow-sm overflow-hidden relative"
                style={{ borderLeft: `6px solid ${getBorderColorValue(categoryColor)}` }}
              >
                <div className={cn(
                  "w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm border border-outline-variant/30 shrink-0",
                  categoryColor
                )}>
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-headline font-bold text-on-surface text-sm sm:text-base truncate leading-tight line-clamp-1">{p.title}</h4>
                  </div>
                  <p className={cn(
                    "text-[11px] font-semibold truncate mt-1",
                    diffDays < 0 ? "text-rose-500" : "text-on-surface-variant"
                  )}>
                    {diffDays === 0 ? 'Bugün' : diffDays < 0 ? `${Math.abs(diffDays)} gün gecikti` : `${diffDays} gün kaldı`}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className={cn(
                    "font-bold text-base sm:text-lg data-value tracking-tighter text-rose-500"
                  )}>
                    -₺{Math.abs(p.amount).toLocaleString('tr-TR')}
                  </p>
                </div>
              </motion.div>
            );
          })}
          
          {payments.filter(p => {
             if (p.status === 'paid') return false;
             const dueDate = p.dueDate instanceof Timestamp ? p.dueDate.toDate() : new Date(p.dueDate);
             dueDate.setHours(23, 59, 59, 999);
             const now = new Date();
             now.setHours(0, 0, 0, 0);
             const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
             return diffDays >= 0 && diffDays <= 7;
          }).length === 0 && (
            <div className="text-center py-6 bg-surface-container-low rounded-xl border border-outline-variant/50">
              <CheckCircle2 className="w-10 h-10 text-tertiary mx-auto mb-2 opacity-20" />
              <p className="text-sm text-on-surface-variant font-medium">Bu hafta bekleyen ödemeniz bulunmuyor.</p>
            </div>
          )}
        </div>
      </section>
    </motion.div>
  );
};

const TransactionsScreen = ({ user, transactions, payments, onEdit, onDuplicate }: { 
  user: User, 
  transactions: Transaction[], 
  payments: Payment[],
  onEdit: (item: any) => void,
  onDuplicate: (item: any) => void
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedActionId, setExpandedActionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('Tümü');

  const { currentMonthExpense, previousMonthExpense, expenseChangePercentage } = useMemo(() => {
    const now = new Date();
    
    // Current Month Range
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    
    // Previous Month Range
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const calcExpense = (start: Date, end: Date) => {
      let total = 0;
      
      // Transactions (Paid bills are also here as they are saved as transactions when paid)
      total += Math.abs(transactions.filter(tx => {
        const txDate = tx.date instanceof Timestamp ? tx.date.toDate() : new Date(tx.date);
        return tx.type === 'expense' && txDate >= start && txDate <= end;
      }).reduce((acc, tx) => acc + tx.amount, 0));
      
      // Pending Payments
      total += payments.filter(p => {
        if (p.status === 'paid') return false; // Already in transactions
        const pDate = p.dueDate instanceof Timestamp ? p.dueDate.toDate() : new Date(p.dueDate);
        return pDate >= start && pDate <= end;
      }).reduce((acc, p) => acc + p.amount, 0);
      
      return total;
    };

    const current = calcExpense(startOfCurrentMonth, endOfCurrentMonth);
    const prev = calcExpense(startOfPrevMonth, endOfPrevMonth);
    
    let change = 0;
    if (prev === 0 && current > 0) change = 100;
    else if (prev > 0) change = ((current - prev) / prev) * 100;

    return { 
      currentMonthExpense: current, 
      previousMonthExpense: prev, 
      expenseChangePercentage: change 
    };
  }, [transactions, payments]);

  const filteredTransactions = useMemo(() => {
    const combined = [
      ...transactions.map(tx => ({
        id: tx.id,
        title: tx.title,
        amount: Math.abs(tx.amount),
        type: tx.type,
        category: tx.category,
        subCategory: tx.subCategory || null,
        date: tx.date,
        createdAt: tx.createdAt instanceof Timestamp ? tx.createdAt.toDate().getTime() : (tx.date instanceof Timestamp ? tx.date.toDate().getTime() : new Date(tx.date).getTime()),
        isRecurring: tx.isRecurring,
        location: tx.location,
        isPayment: false
      })),
      ...payments.map(p => ({
        id: `payment-${p.id}`,
        dbId: p.id,
        title: p.title,
        amount: Math.abs(p.amount),
        type: 'expense' as const,
        category: p.category,
        subCategory: p.subCategory || null,
        date: p.dueDate,
        createdAt: p.createdAt instanceof Timestamp ? p.createdAt.toDate().getTime() : (p.dueDate instanceof Timestamp ? p.dueDate.toDate().getTime() : new Date(p.dueDate).getTime()),
        isRecurring: false,
        location: 'Ödeme',
        isPayment: true
      }))
    ];

    return combined.filter(tx => {
      const matchesSearch = tx.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           tx.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesFilter = activeFilter === 'Tümü';
      if (!matchesFilter) {
        if (activeFilter === 'Gelir') {
          matchesFilter = tx.type === 'income';
        } else if (activeFilter === 'Fatura') {
          const faturaCategories = ['Fatura', ...BILL_SUB_CATEGORIES.map(b => b.label)];
          matchesFilter = faturaCategories.includes(tx.category) || tx.category.toLowerCase().includes('fatura');
        } else if (activeFilter === 'Kredi') {
          matchesFilter = tx.category === 'Kredi' || tx.category.toLowerCase().includes('kredi ödemesi');
        } else if (activeFilter === 'Kredi Kartı') {
          matchesFilter = tx.category === 'Kredi Kartı' || tx.category.toLowerCase().includes('kredi kartı');
        } else {
          matchesFilter = tx.category === activeFilter;
        }
      }
      
      return matchesSearch && matchesFilter;
    }).sort((a, b) => {
      return b.createdAt - a.createdAt;
    });
  }, [transactions, payments, searchQuery, activeFilter]);

  const handleDelete = async (id: string, isPayment?: boolean) => {
    const path = isPayment ? `users/${user.uid}/payments/${id}` : `users/${user.uid}/transactions/${id}`;
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
      {deletingId && (
        <ConfirmModal 
          title="İşlemi Sil"
          message="Bu harcamayı veya geliri silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
          onConfirm={() => {
            const item = filteredTransactions.find(t => (t.isPayment ? t.dbId : t.id) === deletingId);
            if (item) handleDelete(deletingId, item.isPayment);
          }}
          onCancel={() => setDeletingId(null)}
        />
      )}

      {/* Spending Hero */}
      <section className="relative overflow-hidden rounded-[20px] p-5 sm:p-6 bg-primary text-surface shadow-md border border-outline-variant/10">
        <div className="relative z-10 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3">
          <div>
            <p className="text-surface/80 text-[10px] font-bold tracking-widest mb-1 uppercase">Bu Ayki Harcama</p>
            <h2 className="font-headline text-3xl font-extrabold tracking-tighter">
              ₺{currentMonthExpense.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </h2>
          </div>
          <div className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold",
            expenseChangePercentage > 0 ? "bg-rose-500/20 text-rose-100" : "bg-emerald-500/20 text-emerald-100"
          )}>
            {expenseChangePercentage > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span>Geçen aya göre %{Math.abs(expenseChangePercentage).toFixed(1)} {expenseChangePercentage > 0 ? 'arttı' : 'azaldı'}</span>
          </div>
        </div>
        <div className="absolute top-0 right-0 -mr-4 -mt-4 w-32 h-32 bg-tertiary/20 rounded-full blur-2xl"></div>
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
          {['Tümü', 'Fatura', 'Kredi', 'Kredi Kartı', 'Kira', 'Gelir', 'Diğer'].map((filter) => (
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
          <div className="space-y-2">
            {filteredTransactions.map((tx, i) => {
              const Icon = (tx.subCategory && CATEGORY_ICONS[tx.subCategory]) || CATEGORY_ICONS[tx.category] || ShoppingBag;
              const categoryColor = (tx.subCategory && CATEGORY_COLORS[tx.subCategory]) || CATEGORY_COLORS[tx.category] || (tx.type === 'income' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500");
              return (
                <div key={tx.id} className="flex flex-col">
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setExpandedActionId(expandedActionId === tx.id ? null : tx.id)}
                    className={cn(
                      "flex items-center p-4 sm:p-5 bg-surface-container-low shadow-sm hover:shadow-md transition-all border border-outline-variant/30 group relative cursor-pointer",
                      expandedActionId === tx.id ? "rounded-t-2xl border-b-0" : "rounded-2xl"
                    )}
                    style={{ borderLeft: `6px solid ${getBorderColorValue(categoryColor)}` }}
                  >
                    <div className={cn(
                      "w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm border border-outline-variant/30 shrink-0",
                      categoryColor
                    )}>
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
                    </div>
                    <div className="ml-3.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-headline font-bold text-on-surface text-sm sm:text-base truncate leading-tight line-clamp-1">{tx.title}</h4>
                        {tx.isRecurring && <Repeat className="w-3 h-3 text-primary opacity-40 shrink-0" />}
                      </div>
                      <p className="text-[11px] text-on-surface-variant font-semibold truncate mt-1">
                        {tx.subCategory || tx.category} • {tx.date instanceof Timestamp ? tx.date.toDate().toLocaleDateString('tr-TR') : String(tx.date).split('-').reverse().join('/')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-1">
                      <div className="text-right">
                        <span className={cn(
                          "font-bold text-base sm:text-lg block data-value tracking-tighter",
                          tx.type === 'income' ? "text-emerald-500" : "text-rose-500"
                        )}>
                          {tx.type === 'income' ? '+' : '-'}₺{Math.abs(tx.amount).toLocaleString('tr-TR')}
                        </span>
                      </div>
                      <ChevronDown className={cn(
                        "w-4 h-4 text-outline-variant transition-transform",
                        expandedActionId === tx.id && "rotate-180"
                      )} />
                    </div>
                  </motion.div>
                  
                  <AnimatePresence>
                    {expandedActionId === tx.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-surface-container-lowest border border-t-0 border-outline-variant/30 rounded-b-2xl shadow-sm"
                        style={{ borderLeft: `6px solid ${getBorderColorValue(categoryColor)}` }}
                      >
                        <div className="flex p-3 gap-3">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(tx);
                              setExpandedActionId(null);
                            }}
                            className="flex-1 py-2.5 text-[12px] font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors flex items-center justify-center gap-2"
                          >
                            <Edit2 className="w-4 h-4" />
                            Düzenle
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingId(tx.isPayment ? tx.dbId : tx.id);
                              setExpandedActionId(null);
                            }}
                            className="flex-1 py-2.5 text-[12px] font-bold text-error bg-error/10 hover:bg-error/20 rounded-xl transition-colors flex items-center justify-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Sil
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
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

const AddSelectionScreen = ({ onSelect, onClose }: { onSelect: (type: 'transaction' | 'payment') => void, onClose: () => void }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="space-y-6 sm:space-y-10 flex flex-col items-center pt-8 md:pt-16"
    >
      <div className="text-center space-y-2 mb-4">
        <h2 className="text-2xl font-headline font-extrabold text-primary tracking-tighter">Ne Eklemek İstersiniz?</h2>
        <p className="text-on-surface-variant text-sm max-w-[280px] mx-auto">Lütfen eklemek istediğiniz kayıt türünü seçin.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
        <button 
          onClick={() => onSelect('transaction')}
          className="bg-surface-container-low border border-outline-variant/30 p-6 rounded-3xl flex flex-col items-center justify-center gap-4 hover:shadow-lg hover:-translate-y-1 active:scale-95 transition-all text-center group"
        >
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
            <ReceiptText className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-headline font-bold text-lg text-on-surface">Gerçekleşen İşlem</h3>
            <p className="text-xs text-on-surface-variant mt-1">Geçmiş veya anlık bir harcama/gelir ekleyin.</p>
          </div>
        </button>

        <button 
          onClick={() => onSelect('payment')}
          className="bg-surface-container-low border border-outline-variant/30 p-6 rounded-3xl flex flex-col items-center justify-center gap-4 hover:shadow-lg hover:-translate-y-1 active:scale-95 transition-all text-center group"
        >
          <div className="w-16 h-16 bg-tertiary/10 rounded-2xl flex items-center justify-center text-tertiary group-hover:scale-110 transition-transform">
            <CheckSquare className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-headline font-bold text-lg text-on-surface">Planlı Ödeme</h3>
            <p className="text-xs text-on-surface-variant mt-1">Gelecekte ödenecek bir fatura veya plan kaydı oluşturun.</p>
          </div>
        </button>
      </div>

      <button 
        onClick={onClose}
        className="mt-6 font-bold text-on-surface-variant hover:text-error transition-colors px-6 py-3"
      >
        Vazgeç
      </button>
    </motion.div>
  );
};

const AddTransactionScreen = ({ user, onComplete, onCancel, editData, duplicateData }: { 
  user: User, 
  onComplete: () => void,
  onCancel: () => void,
  editData?: Transaction | null,
  duplicateData?: Transaction | null
}) => {
  const sourceData = editData || duplicateData;
  
  const [amount, setAmount] = useState(sourceData ? Math.abs(sourceData.amount).toString() : '');
  const [title, setTitle] = useState(sourceData?.title || '');
  const [type, setType] = useState<'income' | 'expense'>(sourceData?.type || 'expense');
  const [category, setCategory] = useState(sourceData?.category || (sourceData?.type === 'income' ? INCOME_CATEGORIES[0].label : EXPENSE_CATEGORIES[0].label));
  const [subCategory, setSubCategory] = useState(sourceData?.subCategory || '');
  const [description, setDescription] = useState(sourceData?.description || '');
  const [isRecurring, setIsRecurring] = useState(sourceData?.isRecurring || false);
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>(sourceData?.frequency || 'monthly');
  const [startDate, setStartDate] = useState(
    sourceData?.date ? (
      sourceData.date instanceof Timestamp 
        ? sourceData.date.toDate().toISOString().split('T')[0] 
        : new Date(sourceData.date).toISOString().split('T')[0]
    ) : new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    sourceData?.endDate ? (
      sourceData.endDate instanceof Timestamp 
        ? sourceData.endDate.toDate().toISOString().split('T')[0] 
        : new Date(sourceData.endDate).toISOString().split('T')[0]
    ) : ''
  );
  const [useCustomRule, setUseCustomRule] = useState(!!sourceData?.customRule);
  const [customWeekIndex, setCustomWeekIndex] = useState(sourceData?.customRule?.split(':')[0] || '1');
  const [customWeekday, setCustomWeekday] = useState(sourceData?.customRule?.split(':')[1] || '1');
  const [loading, setLoading] = useState(false);
  const [showEndDateConfirm, setShowEndDateConfirm] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleSave = async () => {
    if (!amount || !title) return;
    
    if (isRecurring && endDate && !showEndDateConfirm) {
      setShowEndDateConfirm(true);
      return;
    }

    setLoading(true);
    const path = `users/${user.uid}/transactions`;
    const baseAmount = type === 'expense' ? -Math.abs(Number(amount)) : Math.abs(Number(amount));

    try {
      const data: any = {
        userId: user.uid,
        title,
        amount: baseAmount,
        type,
        category: category,
        subCategory: subCategory || null,
        description,
        isRecurring: isRecurring,
        frequency: isRecurring ? frequency : null,
        startDate: isRecurring ? Timestamp.fromDate(new Date(startDate)) : null,
        endDate: isRecurring && endDate ? Timestamp.fromDate(new Date(endDate)) : null,
        customRule: isRecurring && useCustomRule ? `${customWeekIndex}:${customWeekday}` : null,
        date: Timestamp.fromDate(new Date(startDate)),
        createdAt: editData ? (editData.createdAt || Timestamp.now()) : Timestamp.now()
      };

      if (editData) {
        await updateDoc(doc(db, path, editData.id), data);
      } else {
        await addDoc(collection(db, path), data);
      }

      // If recurring, also add to planned payments for reminders (only if it's new or duplicated)
      if (!editData && isRecurring && type === 'expense') {
        const payPath = `users/${user.uid}/payments`;
        await addDoc(collection(db, payPath), {
          userId: user.uid,
          title,
          amount: Math.abs(Number(amount)),
          dueDate: startDate, 
          dueTime: '09:00',
          category: category,
          subCategory: subCategory || null,
          description,
          status: 'pending',
          reminders: [],
          isRecurring: true,
          createdAt: Timestamp.now()
        });
      }
      onComplete();
    } catch (error) {
      handleFirestoreError(error, editData ? OperationType.UPDATE : OperationType.CREATE, path);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="space-y-6 sm:space-y-10"
    >
      <div className="flex items-center gap-4">
        <button onClick={onCancel} className="p-2 rounded-full hover:bg-surface-container-low transition-colors">
          <ChevronLeft className="w-6 h-6 text-primary" />
        </button>
        <h2 className="text-2xl font-headline font-extrabold text-primary tracking-tighter">
          {editData ? 'İşlemi Düzenle' : duplicateData ? 'İşlemi Kopyala' : 'Yeni İşlem Ekle'}
        </h2>
      </div>

      {/* Type Toggle */}
      <div className="bg-surface-container-low p-1.5 rounded-2xl flex items-center gap-1 border border-outline-variant/30 relative">
        <button 
          onClick={() => {
            setType('expense');
            setCategory(EXPENSE_CATEGORIES[0].label);
            setSubCategory('');
            setTitle(''); // Clear title when switching tabs
          }}
          className={cn(
            "relative z-10 flex-1 py-3 sm:py-4 px-6 rounded-xl font-headline font-bold text-sm transition-all duration-500",
            type === 'expense' ? "text-surface" : "text-on-surface-variant hover:text-primary"
          )}
        >
          {type === 'expense' && (
            <motion.div 
              layoutId="typeToggle"
              className="absolute inset-0 bg-error rounded-xl shadow-lg shadow-error/20"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="relative z-10">Gider</span>
        </button>
        <button 
          onClick={() => {
            setType('income');
            setCategory(INCOME_CATEGORIES[0].label);
            setSubCategory('');
            setTitle(''); // Clear title when switching tabs
          }}
          className={cn(
            "relative z-10 flex-1 py-3 sm:py-4 px-6 rounded-xl font-headline font-bold text-sm transition-all duration-500",
            type === 'income' ? "text-surface" : "text-on-surface-variant hover:text-primary"
          )}
        >
          {type === 'income' && (
            <motion.div 
              layoutId="typeToggle"
              className="absolute inset-0 bg-tertiary rounded-xl shadow-lg shadow-tertiary/20"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="relative z-10">Gelir</span>
        </button>
      </div>

      {/* Amount Input */}
      <div className="text-center py-2">
        <label className="block text-[10px] font-bold tracking-widest text-on-surface-variant uppercase mb-4">TUTAR GİRİN</label>
        <div className="flex items-center justify-center gap-2">
          <span className="font-headline text-3xl sm:text-4xl font-bold text-primary">₺</span>
          <input 
            type="number" 
            placeholder="0,00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full max-w-[280px] bg-transparent border-none text-center font-headline text-[40px] sm:text-6xl font-extrabold text-primary placeholder:text-surface-container-highest focus:ring-0 outline-none"
          />
        </div>
      </div>

      {/* Form Bento */}
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-surface-container-low rounded-3xl p-2 sm:p-3 border border-outline-variant/50">
          <h3 className="text-[10px] font-bold text-on-surface-variant mb-1 flex items-center gap-2 uppercase tracking-wider pl-1">
            { (() => {
                const activeCat = (type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).find(c => c.label === category);
                const Icon = activeCat?.icon || ShoppingBag;
                return <Icon className="w-4 h-4" />;
            })() } KATEGORİ
          </h3>
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar snap-x pb-2 pt-1 -mx-2 px-2">
            {(type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(cat => (
              <div 
                key={cat.id} 
                onClick={() => {
                  setCategory(cat.label);
                  if (cat.label !== 'Fatura') setSubCategory('');
                }}
                className="flex flex-col items-center gap-1.5 cursor-pointer group shrink-0 w-[4.5rem] snap-center"
              >
                  <div className={cn(
                    "w-14 h-14 sm:w-16 sm:h-16 rounded-[1.25rem] flex items-center justify-center transition-all shadow-sm",
                    category === cat.label ? "border-[2.5px] border-black dark:border-white shadow-md scale-105" : "border border-outline-variant/30 hover:border-primary/40",
                    "bg-surface-container-highest/20"
                  )}>
                    <cat.icon className={cn(
                      "w-6 h-6 sm:w-7 sm:h-7 transition-colors",
                      CATEGORY_COLORS[cat.label]?.split(' ')[1] || "text-on-surface-variant"
                    )} />
                  </div>
                <span className={cn(
                  "text-[9px] sm:text-[10px] font-bold text-center leading-tight truncate w-full px-1", 
                  category === cat.label ? "text-primary" : "text-on-surface-variant/80"
                )}>
                  {cat.label}
                </span>
              </div>
            ))}
          </div>

          <AnimatePresence>
            {category === 'Fatura' && (
              <motion.div 
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="overflow-hidden border-t border-outline-variant/10 pt-1"
              >
                <h4 className="text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-widest pl-1">FATURA ÇEŞİDİ</h4>
                <div className="flex gap-2.5 overflow-x-auto no-scrollbar snap-x pb-2 pt-1 -mx-2 px-2">
                  {BILL_SUB_CATEGORIES.map(sub => (
                    <button
                      key={sub.id}
                      onClick={() => {
                        setSubCategory(sub.label);
                        setTitle(`${sub.label} Faturası`);
                      }}
                      className="flex flex-col items-center gap-1.5 p-0.5 transition-all rounded-xl shrink-0 w-[4.2rem] snap-center"
                    >
                      <div className={cn(
                        "w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center transition-colors shadow-sm",
                        subCategory === sub.label ? "border-[2px] border-black dark:border-white shadow-md scale-105" : "border border-outline-variant/30 hover:border-primary/40",
                        "bg-surface-container-highest/20"
                      )}>
                        <sub.icon className={cn(
                          "w-5 h-5 sm:w-6 sm:h-6",
                          sub.color
                        )} />
                      </div>
                      <span className={cn(
                        "text-[9px] sm:text-[10px] font-bold text-center leading-tight truncate w-full px-1",
                        subCategory === sub.label ? "text-primary" : "text-on-surface-variant/70"
                      )}>
                        {sub.label}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="bg-surface-container-low rounded-[1.5rem] p-6">
          <h3 className="text-[10px] font-bold text-on-surface-variant mb-3 flex items-center gap-2 uppercase tracking-wider">
            <ReceiptText className="w-4 h-4" /> {type === 'income' ? 'GELİR ADI' : 'ÖDEME ADI'}
          </h3>
          <div className="space-y-3">
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === 'income' ? "Örn: Maaş, Satış, Bonus..." : "Örn: Kira, Fatura, Kredi..."}
              className="w-full bg-surface-container-lowest rounded-xl border-none text-primary font-medium p-3 text-sm focus:ring-0 shadow-sm" 
            />
            
            {(category === 'Kredi' || category === 'Kredi Kartı') && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {BANK_OPTIONS.map(bank => (
                  <button
                    key={bank}
                    onClick={() => setTitle(`${bank} ${category}`)}
                    className="whitespace-nowrap px-3 py-1.5 rounded-full bg-surface-container-lowest text-[10px] font-bold text-primary border border-outline-variant/30 hover:bg-primary hover:text-surface transition-all"
                  >
                    {bank}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-surface-container-low rounded-[1.5rem] p-6">
          <h3 className="text-[10px] font-bold text-on-surface-variant mb-3 flex items-center gap-2 uppercase tracking-wider pl-1">
            <Calendar className="w-4 h-4" /> TARİH SEÇİMİ
          </h3>
          <div 
            onClick={() => setShowDatePicker(true)}
            className="w-full bg-surface-container-lowest rounded-xl border-none text-primary font-bold p-4 text-base focus:ring-0 shadow-sm cursor-pointer hover:bg-primary/5 transition-colors flex justify-between items-center"
          >
            {startDate.split('-').reverse().join('/')}
            <Calendar className="w-4 h-4 opacity-40" />
          </div>
          
          <DatePickerModal 
            isOpen={showDatePicker}
            onClose={() => setShowDatePicker(false)}
            value={startDate}
            onChange={setStartDate}
            title={type === 'income' ? "Gelir Tarihi" : "İşlem Tarihi"}
          />
        </div>

        <div className="bg-surface-container-low rounded-3xl p-6 border border-outline-variant/30">
          <h3 className="text-[10px] font-bold text-on-surface-variant mb-3 flex items-center gap-2 uppercase tracking-wider pl-1">
            <FileText className="w-4 h-4" /> AÇIKLAMA (NOTLAR)
          </h3>
          <textarea 
            placeholder="İşlemle ilgili notlarınızı buraya yazabilirsiniz..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full bg-surface-container-lowest rounded-xl border-none text-on-surface font-medium p-4 text-sm focus:ring-0 shadow-sm resize-none"
          />
        </div>

        {type === 'expense' && (
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
              </div>
            )}
          </div>
        )}
      </div>

      <button 
        onClick={handleSave}
        disabled={loading || !amount || !title}
        className="w-full wealth-gradient text-white py-3.5 rounded-full font-headline font-bold text-base shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? 'Kaydediliyor...' : (
          <>
            <CheckCircle2 className="w-6 h-6" />
            {editData ? 'Güncelle' : (duplicateData ? 'Kopyasını Kaydet' : 'İşlemi Kaydet')}
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

const AddPaymentScreen = ({ user, onComplete, onCancel, editData }: { user: User, onComplete: () => void, onCancel: () => void, editData?: Payment | null }) => {
  const [amount, setAmount] = useState(editData?.amount?.toString() || '');
  const [title, setTitle] = useState(editData?.title || '');
  const [dueDate, setDueDate] = useState(editData?.dueDate || new Date().toISOString().split('T')[0]);
  const [remindOnDue, setRemindOnDue] = useState(editData?.reminders?.includes('day_of') || false);
  const [remindOneDayBefore, setRemindOneDayBefore] = useState(editData?.reminders?.includes('one_day_before') || false);
  const [recurrence, setRecurrence] = useState<'none' | 'weekly' | 'monthly' | 'yearly'>('none');
  const [category, setCategory] = useState(editData?.category || 'Fatura');
  const [subCategory, setSubCategory] = useState(editData?.subCategory || '');
  const [description, setDescription] = useState(editData?.description || '');
  const [isRecurring, setIsRecurring] = useState(editData?.isRecurring || false);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleSave = async () => {
    if (!amount || !title) return;
    setLoading(true);
    const path = `users/${user.uid}/payments`;
    try {
      const data: any = {
        userId: user.uid,
        title,
        amount: Number(amount),
        dueDate,
        reminders: [
          ...(remindOnDue ? ['day_of'] : []),
          ...(remindOneDayBefore ? ['one_day_before'] : [])
        ],
        category,
        subCategory: subCategory || null,
        description,
        recurrence,
        status: editData?.status || 'pending',
        isRecurring: recurrence !== 'none',
        createdAt: editData?.createdAt || Timestamp.now()
      };

      if (editData) {
        await updateDoc(doc(db, path, editData.id), data);
      } else {
        await addDoc(collection(db, path), data);
      }
      onComplete();
    } catch (error) {
      handleFirestoreError(error, editData ? OperationType.UPDATE : OperationType.CREATE, path);
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
        <button onClick={onCancel} className="p-2 rounded-full hover:bg-surface-container-low transition-colors">
          <ChevronLeft className="w-6 h-6 text-primary" />
        </button>
        <h2 className="text-2xl font-headline font-extrabold text-primary tracking-tighter">
          {editData ? 'Ödemeyi Düzenle' : 'Yeni Ödeme Ekle'}
        </h2>
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
            className="w-full max-w-[200px] bg-transparent border-none text-center font-headline text-[40px] font-extrabold text-primary placeholder:text-surface-container-highest focus:ring-0 outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface-container-low rounded-[1.5rem] p-6 col-span-full">
          <h3 className="text-[10px] font-bold text-on-surface-variant mb-3 uppercase tracking-wider">KATEGORİ & TİP</h3>
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
              <option value="Abonelik">Abonelik</option>
              <option value="Kredi">Kredi Ödemesi</option>
              <option value="Kredi Kartı">Kredi Kartı Borcu</option>
              <option value="Kira">Kira</option>
              <option value="Diğer">Diğer</option>
            </select>
            
            {(category === 'Kredi' || category === 'Kredi Kartı') && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-2 overflow-x-auto no-scrollbar py-1"
              >
                {BANK_OPTIONS.map(bank => (
                  <button
                    key={bank}
                    onClick={() => {
                      setTitle(`${bank} ${category}`);
                      setSubCategory(bank);
                    }}
                    className={cn(
                      "whitespace-nowrap px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border",
                      subCategory === bank ? "bg-primary text-surface border-primary" : "bg-surface-container-lowest text-primary border-outline-variant/30"
                    )}
                  >
                    {bank}
                  </button>
                ))}
              </motion.div>
            )}
            
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

        <div className="bg-surface-container-low rounded-[1.5rem] p-6 col-span-full">
          <h3 className="text-[10px] font-bold text-on-surface-variant mb-3 uppercase tracking-wider">SON ÖDEME TARİHİ</h3>
          <div 
            onClick={() => setShowDatePicker(true)}
            className="w-full bg-surface-container-lowest rounded-xl border-none text-primary font-bold p-4 text-base focus:ring-0 shadow-sm cursor-pointer hover:bg-primary/5 transition-colors flex justify-between items-center"
          >
            {dueDate.split('-').reverse().join('/')}
            <Calendar className="w-5 h-5 opacity-40" />
          </div>

          <DatePickerModal 
            isOpen={showDatePicker}
            onClose={() => setShowDatePicker(false)}
            value={dueDate}
            onChange={setDueDate}
            title="Son Ödeme Tarihi"
          />
        </div>

        <div className="bg-surface-container-low rounded-[1.5rem] p-6 col-span-full">
          <h3 className="text-[10px] font-bold text-on-surface-variant mb-3 uppercase tracking-wider">HATIRLATMALAR</h3>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => setRemindOnDue(!remindOnDue)}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/10"
            >
              <span className="text-sm font-bold text-on-surface">Son ödeme gününde hatırlat</span>
              <div className={cn("w-10 h-5 rounded-full relative transition-colors", remindOnDue ? "bg-primary" : "bg-outline-variant")}>
                <div className={cn("absolute top-1 w-3 h-3 rounded-full transition-all", remindOnDue ? "left-6 bg-surface" : "left-1 bg-white")} />
              </div>
            </button>
            <button 
              onClick={() => setRemindOneDayBefore(!remindOneDayBefore)}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/10"
            >
              <span className="text-sm font-bold text-on-surface">1 gün önce hatırlat</span>
              <div className={cn("w-10 h-5 rounded-full relative transition-colors", remindOneDayBefore ? "bg-primary" : "bg-outline-variant")}>
                <div className={cn("absolute top-1 w-3 h-3 rounded-full transition-all", remindOneDayBefore ? "left-6 bg-surface" : "left-1 bg-white")} />
              </div>
            </button>
          </div>
        </div>

        <div className="bg-surface-container-low rounded-[1.5rem] p-6 col-span-full">
          <h3 className="text-[10px] font-bold text-on-surface-variant mb-3 uppercase tracking-wider">TEKRARLAMA</h3>
          <div className="grid grid-cols-4 gap-2">
            {(['none', 'weekly', 'monthly', 'yearly'] as const).map(option => (
              <button
                key={option}
                onClick={() => setRecurrence(option)}
                className={cn(
                  "py-2 rounded-xl text-[10px] font-bold transition-all border",
                  recurrence === option ? "bg-primary text-surface border-primary" : "bg-surface-container-lowest text-primary border-outline-variant/30"
                )}
              >
                {option === 'none' ? 'Yok' : option === 'weekly' ? 'Haftalık' : option === 'monthly' ? 'Aylık' : 'Yıllık'}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-surface-container-low rounded-[1.5rem] p-6 col-span-full">
          <h3 className="text-[10px] font-bold text-on-surface-variant mb-3 uppercase tracking-wider">AÇIKLAMA</h3>
          <textarea 
            placeholder="Ödeme ile ilgili notlarınızı buraya yazabilirsiniz..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full bg-surface-container-lowest rounded-xl border-none text-on-surface font-medium p-3 text-sm focus:ring-0 shadow-sm resize-none"
          />
        </div>
      </div>

      <button 
        onClick={handleSave}
        disabled={loading || !amount || !title}
        className="w-full wealth-gradient text-white py-3.5 rounded-full font-headline font-bold text-base shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? 'Kaydediliyor...' : (editData ? 'Güncelle' : 'Ödemeyi Kaydet')}
      </button>
    </motion.div>
  );
};

const SettingsScreen = ({ user, onLogout, onToggleTheme, isDarkMode, handleDataRepair, enableNotifications, setEnableNotifications, setToast }: { 
  user: User, 
  onLogout: () => void, 
  onToggleTheme: () => void, 
  isDarkMode: boolean, 
  handleDataRepair: () => void,
  enableNotifications: boolean,
  setEnableNotifications: (v: boolean) => void,
  setToast: (t: {title: string, message: string} | null) => void
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6 pb-20"
    >
      <h2 className="font-headline text-3xl font-extrabold tracking-tight text-primary">Ayarlar</h2>
      
      <div className="bg-surface-container-low rounded-3xl p-6 border border-outline-variant/30 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <UserIcon className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-on-surface">{user.email}</h3>
            <p className="text-on-surface-variant text-sm">Hesap Bilgileri</p>
          </div>
        </div>
        
        <div className="space-y-2">
            <button className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-surface-container-high transition-all text-sm font-bold text-on-surface border border-outline-variant/20">
              <Settings className="w-5 h-5 text-primary" /> Genel Ayarlar
            </button>
            <button 
              onClick={handleDataRepair}
              className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-surface-container-high transition-all text-sm font-bold text-on-surface border border-outline-variant/20"
            >
              <ShieldCheck className="w-5 h-5 text-tertiary" /> Verileri Optimize Et (Onar)
            </button>
            <button 
              onClick={onToggleTheme}
              className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-surface-container-high transition-all text-sm font-bold text-on-surface border border-outline-variant/20"
            >
              <div className="flex items-center gap-4">
                {isDarkMode ? <Sun className="w-5 h-5 text-primary" /> : <Moon className="w-5 h-5 text-primary" />}
                {isDarkMode ? 'Aydınlık Mod' : 'Karanlık Mod'}
              </div>
            </button>
            <button 
              onClick={() => {
                setToast({ title: 'Test Bildirimi', message: 'Bu, ödeme hatırlatıcılarının nasıl görüneceğidir!' });
                setTimeout(() => setToast(null), 5000);
              }}
              className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-surface-container-high transition-all text-sm font-bold text-on-surface border border-outline-variant/20"
            >
              <div className="flex items-center gap-4">
                <Bell className="w-5 h-5 text-primary" /> Bildirim Test Et
              </div>
            </button>
            <button 
              onClick={() => setEnableNotifications(!enableNotifications)}
              className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-surface-container-high transition-all text-sm font-bold text-on-surface border border-outline-variant/20"
            >
              <div className="flex items-center gap-4">
                <Bell className="w-5 h-5 text-primary" /> Bildirimler
              </div>
              <div className={cn(
                "w-12 h-6 rounded-full relative transition-colors",
                enableNotifications ? "bg-primary" : "bg-outline-variant"
              )}>
                <div className={cn(
                  "absolute top-1 w-4 h-4 rounded-full transition-all",
                  enableNotifications ? "left-7 bg-surface" : "left-1 bg-white"
                )} />
              </div>
            </button>
        </div>
      </div>

      <button 
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-2 py-4 bg-error/10 text-error rounded-2xl font-bold hover:bg-error/20 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Güvenli Çıkış
      </button>
    </motion.div>
  );
};

// ... (No residual trash here)

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

const NewPaymentsScreen = ({ user, payments, onAddPayment, onEdit }: { user: User, payments: Payment[], onAddPayment: () => void, onEdit: (item: any) => void }) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'paid'>('pending');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const next15Days = new Date(now);
  next15Days.setDate(now.getDate() + 15);

  const upcomingNeeds = payments
    .filter(p => p.status !== 'paid')
    .filter(p => {
      const pDate = p.dueDate instanceof Timestamp ? p.dueDate.toDate() : new Date(p.dueDate);
      return pDate >= now && pDate <= next15Days;
    })
    .reduce((acc, p) => acc + p.amount, 0);

  const handleMarkAsPaid = async (billId: string) => {
    const bill = payments.find(p => p.id === billId);
    if (!bill) return;

    const path = `users/${user.uid}/payments/${billId}`;
    const txPath = `users/${user.uid}/transactions`;
    try {
      await updateDoc(doc(db, path), { status: 'paid' });
      
      await addDoc(collection(db, txPath), {
        userId: user.uid,
        title: bill.title,
        amount: -Math.abs(bill.amount),
        type: 'expense',
        category: bill.category,
        date: Timestamp.now(),
        createdAt: Timestamp.now(),
        paymentId: billId
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleUndoPaid = async (billId: string) => {
    const bill = payments.find(p => p.id === billId);
    if (!bill) return;

    const path = `users/${user.uid}/payments/${billId}`;
    const txPath = `users/${user.uid}/transactions`;
    try {
      await updateDoc(doc(db, path), { status: 'pending' });
      
      const q = query(collection(db, txPath), where('paymentId', '==', billId));
      const querySnapshot = await getDocs(q);
      
      const deletePromises = querySnapshot.docs.map(document => deleteDoc(document.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleDeletePayment = async () => {
    if (!deleteId) return;
    const path = `users/${user.uid}/payments/${deleteId}`;
    try {
      await deleteDoc(doc(db, path));
      setDeleteId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const pendingBills = payments.filter(p => p.status !== 'paid');
  const paidBills = payments.filter(p => p.status === 'paid');

  let activeList = pendingBills;
  if (activeTab === 'paid') activeList = paidBills;

  activeList.sort((a, b) => {
    const dateA = a.dueDate instanceof Timestamp ? a.dueDate.toDate() : new Date(a.dueDate);
    const dateB = b.dueDate instanceof Timestamp ? b.dueDate.toDate() : new Date(b.dueDate);
    return dateA.getTime() - dateB.getTime();
  });

  const renderBillCard = (bill: Payment) => {
    // Determine category and icon directly from bill.category and subCategory
    const Icon = (bill.subCategory && CATEGORY_ICONS[bill.subCategory]) || CATEGORY_ICONS[bill.category] || FileText;
    const categoryColor = (bill.subCategory && CATEGORY_COLORS[bill.subCategory]) || CATEGORY_COLORS[bill.category] || "bg-primary/10 text-primary";
    
    const formatDate = (date: any) => {
      try {
        let dateStr = '';
        if (date instanceof Timestamp) dateStr = date.toDate().toISOString().split('T')[0];
        else if (date instanceof Date) dateStr = date.toISOString().split('T')[0];
        else dateStr = String(date);
        
        const parts = dateStr.split('-');
        if (parts.length !== 3) return dateStr;
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      } catch (e) {
        return String(date);
      }
    };

    const isPaid = bill.status === 'paid';

    return (
      <motion.div 
        key={bill.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "bg-surface-container-low p-4 sm:p-5 rounded-[24px] flex items-center justify-between gap-3 sm:gap-4 group transition-all border border-outline-variant/30 shadow-sm overflow-hidden relative",
          isPaid ? "opacity-75" : "hover:shadow-md"
        )}
        style={{ borderLeft: `6px solid ${getBorderColorValue(categoryColor)}` }}
      >
        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
          <div className={cn("w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm border", categoryColor)}>
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className={cn("font-headline font-bold text-on-surface text-sm sm:text-base truncate", isPaid && "opacity-70")}>
              {bill.title}
            </h4>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
              <p className="text-[10px] sm:text-[11px] text-on-surface-variant font-bold uppercase tracking-widest truncate">
                {formatDate(bill.dueDate)}
              </p>
              {!isPaid && (
                <p className={cn(
                  "text-[10px] sm:text-[11px] font-bold uppercase tracking-widest truncate",
                  (() => {
                    const dDate = bill.dueDate instanceof Timestamp ? bill.dueDate.toDate() : new Date(bill.dueDate);
                    dDate.setHours(23, 59, 59, 999);
                    const n = new Date();
                    n.setHours(0, 0, 0, 0);
                    const diff = Math.ceil((dDate.getTime() - n.getTime()) / (1000 * 60 * 60 * 24));
                    return diff < 0 ? "text-rose-500" : "text-primary";
                  })()
                )}>
                  {(() => {
                    const dDate = bill.dueDate instanceof Timestamp ? bill.dueDate.toDate() : new Date(bill.dueDate);
                    dDate.setHours(23, 59, 59, 999);
                    const n = new Date();
                    n.setHours(0, 0, 0, 0);
                    const diff = Math.ceil((dDate.getTime() - n.getTime()) / (1000 * 60 * 60 * 24));
                    return diff === 0 ? 'Bugün' : diff < 0 ? `${Math.abs(diff)} Gün Gecikti` : `${diff} Gün Kaldı`;
                  })()}
                </p>
              )}
              {isPaid && (
                <span className="flex items-center gap-0.5 text-[8px] font-extrabold text-tertiary bg-tertiary/10 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
                  <CheckCircle2 className="w-2 h-2" />
                  ÖDENDİ
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 sm:gap-5">
          <div className="flex flex-col items-end shrink-0">
            <p className={cn("font-headline font-extrabold text-sm sm:text-lg tracking-tight leading-none", isPaid ? "text-on-surface-variant" : "text-primary")}>
              ₺{bill.amount.toLocaleString('tr-TR')}
            </p>
            {!isPaid && (
              <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onEdit(bill)} className="p-1 text-outline hover:text-primary rounded" title="Düzenle"><Edit2 className="w-3.5 h-3.5" /></button>
                <button onClick={() => setDeleteId(bill.id)} className="p-1 text-outline hover:text-error rounded" title="Sil"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            )}
          </div>

          {!isPaid ? (
            <button 
              onClick={() => handleMarkAsPaid(bill.id)}
              className="bg-primary text-surface px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all hover:bg-primary/90 shrink-0"
            >
              ÖDE
            </button>
          ) : (
            <button 
              onClick={() => handleUndoPaid(bill.id)}
              className="bg-surface-container-highest text-on-surface-variant px-3 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest border border-outline-variant/30 active:scale-95 transition-all hover:bg-surface-container-high shrink-0"
            >
              GERİ AL
            </button>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <section className="relative overflow-hidden rounded-[24px] p-6 bg-gradient-to-br from-[#1E293B] to-[#0F172A] text-white shadow-xl border border-outline-variant/10">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full mb-3 text-white">
              <ListChecks className="w-3.5 h-3.5" />
              <p className="text-[10px] font-bold tracking-widest uppercase">15 Günlük Nakit İhtiyacı</p>
            </div>
            <h2 className="font-headline text-4xl sm:text-5xl font-extrabold tracking-tighter text-white">
              ₺{upcomingNeeds.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </h2>
          </div>
          <button 
            onClick={onAddPayment}
            className="flex items-center justify-center gap-2 bg-primary text-surface px-5 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all hover:bg-primary/90 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            Yeni Ekle
          </button>
        </div>
      </section>

      <section>
        <div className="flex gap-1.5 sm:gap-2 p-1.5 bg-surface-container-low rounded-[18px] mb-4 sm:mb-6 border border-outline-variant/30 flex-wrap">
          <button 
            onClick={() => setActiveTab('pending')}
            className={cn("flex-1 py-2.5 sm:py-3 px-4 rounded-xl text-[11px] sm:text-xs font-bold transition-all min-w-[40%]", activeTab === 'pending' ? "bg-surface shadow-sm text-primary" : "text-outline hover:text-primary hover:bg-surface/50")}
          >
            Bekleyenler
          </button>
          <button 
            onClick={() => setActiveTab('paid')}
            className={cn("flex-1 py-2.5 sm:py-3 px-4 rounded-xl text-[11px] sm:text-xs font-bold transition-all min-w-[40%]", activeTab === 'paid' ? "bg-surface shadow-sm text-primary" : "text-outline hover:text-primary hover:bg-surface/50")}
          >
            Ödenenler
          </button>
        </div>

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {activeList.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-center py-12 bg-surface-container-lowest rounded-[24px] border border-outline-variant/20 shadow-sm"
              >
                <div className="w-16 h-16 bg-surface-container-high rounded-3xl flex items-center justify-center mx-auto mb-4 rotate-3">
                  <CheckSquare className="w-8 h-8 text-outline" />
                </div>
                <h3 className="text-sm font-bold text-primary mb-1">Harika Seçim</h3>
                <p className="text-on-surface-variant text-[11px] font-medium uppercase tracking-widest">Bu listede kayıt yok.</p>
              </motion.div>
            ) : (
              activeList.map(bill => renderBillCard(bill))
            )}
          </AnimatePresence>
        </div>
      </section>

      {deleteId && (
        <ConfirmModal 
          title="Kaydı Sil"
          message="Bu ödeme planını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
          onConfirm={handleDeletePayment}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </motion.div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [toast, setToast] = useState<{title: string, message: string} | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [editingItem, setEditingItem] = useState<{item: any, type: 'transaction' | 'payment'} | null>(null);
  const [duplicatingItem, setDuplicatingItem] = useState<{item: any, type: 'transaction' | 'payment'} | null>(null);
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
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const toggleMenu = () => {
    setShowMenu(!showMenu);
    if (!showMenu) setShowNotifications(false);
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) setShowMenu(false);
  };

  const handleDataRepair = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const txCollection = collection(db, `users/${user.uid}/transactions`);
      const snapshot = await getDocs(txCollection);
      
      let fixedCount = 0;
      const updates = snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        let needsUpdate = false;
        const changes: any = {};

        // Fix 1: Sync icons with categories if missing or generic
        const expectedIcon = (data.subCategory && CATEGORY_ICONS[data.subCategory]) || CATEGORY_ICONS[data.category];
        if (expectedIcon && (!data.icon || data.icon === 'ShoppingBag')) {
          // If the record has a generic icon but we have a more specific one based on category/subCategory
          changes.icon = expectedIcon.name || 'ShoppingBag'; 
          needsUpdate = true;
        }

        if (needsUpdate) {
          await updateDoc(docSnap.ref, changes);
          fixedCount++;
        }
      });

      await Promise.all(updates);
      
      addNotification('Veri Onarımı Tamamlandı', `${fixedCount} adet kayıt başarıyla optimize edildi.`);
      setShowNotifications(true);
    } catch (error) {
      console.error("Data repair failed:", error);
    } finally {
      setLoading(false);
      setShowMenu(false);
    }
  };

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

  // Toast Checker
  useEffect(() => {
    if (!enableNotifications || !payments.length) return;
    
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const triggeredReminders = new Set<string>();

    payments.forEach(p => {
        const dueDate = p.dueDate instanceof Timestamp ? p.dueDate.toDate() : new Date(p.dueDate);
        dueDate.setHours(0,0,0,0);
        
        const dayBefore = new Date(dueDate);
        dayBefore.setDate(dayBefore.getDate() - 1);
        
        if (p.reminders?.includes('day_of') && dueDate.getTime() === today.getTime()) {
            setToast({ title: 'Ödeme Hatırlatıcı', message: `${p.title} bugün ödenmeli!` });
        } else if (p.reminders?.includes('one_day_before') && dayBefore.getTime() === today.getTime()) {
            setToast({ title: 'Ödeme Hatırlatıcı', message: `${p.title} yarın ödenmeli!` });
        }
    });

    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [payments, enableNotifications]);

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
      case 'transactions': return (
        <TransactionsScreen 
          user={user} 
          transactions={transactions} 
          payments={payments} 
          onEdit={(item: any) => {
            setEditingItem({ item, type: 'transaction' });
            setActiveTab('add_transaction');
          }}
          onDuplicate={(item: any) => {
            setDuplicatingItem({ item, type: 'transaction' });
            setActiveTab('add_transaction');
          }}
        />
      );
      case 'add': return (
        <AddSelectionScreen 
          onSelect={(type) => {
            if (type === 'transaction') {
              setEditingItem(null);
              setDuplicatingItem(null);
              setActiveTab('add_transaction');
            } else {
              setEditingItem(null);
              setActiveTab('add_payment');
            }
          }}
          onClose={() => setActiveTab('home')}
        />
      );
      case 'add_transaction': return (
        <AddTransactionScreen 
          user={user} 
          editData={editingItem?.type === 'transaction' ? editingItem.item : null}
          duplicateData={duplicatingItem?.type === 'transaction' ? duplicatingItem.item : null}
          onComplete={() => {
            const wasEditing = editingItem?.type === 'transaction';
            setEditingItem(null);
            setDuplicatingItem(null);
            setActiveTab(wasEditing ? 'transactions' : 'home');
          }} 
          onCancel={() => {
            const wasEditing = editingItem?.type === 'transaction';
            setEditingItem(null);
            setDuplicatingItem(null);
            setActiveTab(wasEditing ? 'transactions' : 'add');
          }}
        />
      );
      case 'payments': return (
        <NewPaymentsScreen 
          user={user} 
          payments={payments} 
          onAddPayment={() => setActiveTab('add_payment')}
          onEdit={(item: any) => {
            setEditingItem({ item, type: 'payment' });
            setActiveTab('add_payment');
          }}
        />
      );
      case 'add_payment': return (
        <AddPaymentScreen 
          user={user} 
          editData={editingItem?.type === 'payment' ? editingItem.item : null}
          onComplete={() => {
            setEditingItem(null);
            setActiveTab('payments');
          }} 
          onCancel={() => {
            const wasEditing = editingItem?.type === 'payment';
            setEditingItem(null);
            setActiveTab(wasEditing ? 'payments' : 'add');
          }}
        />
      );
      case 'settings': return <SettingsScreen 
        user={user} 
        onLogout={logout} 
        isDarkMode={isDarkMode} 
        onToggleTheme={() => setIsDarkMode(!isDarkMode)} 
        handleDataRepair={handleDataRepair} 
        enableNotifications={enableNotifications}
        setEnableNotifications={setEnableNotifications}
        setToast={setToast}
      />;
      default: return <HomeScreen user={user} transactions={transactions} payments={payments} setActiveTab={setActiveTab} />;
    }
  };

  const getTitle = () => {
    switch (activeTab) {
      case 'home': return '';
      case 'transactions': return 'Hesap Hareketleri';
      case 'add': return 'Yeni İşlem';
      case 'payments': return 'Planlı Ödemeler';
      case 'settings': return 'Ayarlar';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen pb-32 bg-surface transition-colors duration-300">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-[200] p-4 pt-10"
          >
            <div className="bg-surface border border-outline-variant shadow-xl rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-bold text-on-surface">{toast.title}</h4>
                <p className="text-sm text-on-surface-variant font-medium">{toast.message}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <TopBar 
        user={user} 
        isDarkMode={isDarkMode} 
        onToggleTheme={() => setIsDarkMode(!isDarkMode)} 
        onLogout={logout}
        notifications={notifications}
        activeTab={activeTab}
        showMenu={showMenu}
        setShowMenu={setShowMenu}
        showNotifications={showNotifications}
        setShowNotifications={setShowNotifications}
        toggleMenu={toggleMenu}
        toggleNotifications={toggleNotifications}
      />
      
      <main className="pt-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {renderScreen()}
        </AnimatePresence>
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Drawer Components rendered outside TopBar to fix positioning issues */}
      <AnimatePresence>
        {showNotifications && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm" 
              onClick={() => setShowNotifications(false)} 
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-surface border-t border-outline-variant shadow-2xl rounded-t-[32px] overflow-hidden z-[110] max-h-[85vh] flex flex-col"
            >
              <div className="w-12 h-1.5 bg-outline-variant/30 rounded-full mx-auto my-3 shrink-0" />
              
              <div className="px-6 py-4 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-low">
                <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Bildirimler</h3>
                {notifications.length > 0 && (
                  <button onClick={() => setNotifications([])} className="text-xs font-bold text-error uppercase hover:underline">Tümünü Temizle</button>
                )}
              </div>
              <div className="overflow-y-auto no-scrollbar pb-10">
                {notifications.length === 0 ? (
                  <div className="p-12 text-center bg-surface">
                    <Bell className="w-12 h-12 text-outline-variant mx-auto mb-4 opacity-20" />
                    <p className="text-sm font-medium text-on-surface-variant">Yeni bildirim bulunmuyor</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className="p-5 border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors bg-surface">
                      <p className="text-sm font-bold text-primary mb-1">{n.title}</p>
                      <p className="text-xs text-on-surface-variant leading-relaxed mb-2 font-medium">{n.message}</p>
                      <p className="text-[10px] font-bold text-outline opacity-60 uppercase">{n.timestamp.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMenu && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm" 
              onClick={() => setShowMenu(false)} 
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-surface border-t border-outline-variant shadow-2xl rounded-t-[32px] overflow-hidden z-[110] p-6 flex flex-col"
            >
              <div className="w-12 h-1.5 bg-outline-variant/30 rounded-full mx-auto mb-6 shrink-0" />

              <div className="p-5 mb-6 flex items-center gap-4 bg-surface-container-low rounded-2xl border border-outline-variant/30">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-headline font-bold text-xl border border-primary/20">
                  {user?.displayName?.charAt(0) || 'K'}
                </div>
                <div>
                  <p className="text-base font-bold text-primary">{user?.displayName || 'Kullanıcı'}</p>
                  <p className="text-xs text-on-surface-variant font-medium">{user?.email}</p>
                </div>
              </div>

              <div className="space-y-2 mb-8">
                <button className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-surface-container-low transition-all text-sm font-bold text-on-surface border border-transparent hover:border-outline-variant/50">
                  <UserIcon className="w-5 h-5 text-primary" /> Hesap Bilgileri
                </button>
                <button className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-surface-container-low transition-all text-sm font-bold text-on-surface border border-transparent hover:border-outline-variant/50">
                  <Settings className="w-5 h-5 text-primary" /> Genel Ayarlar
                </button>
                <button 
                  onClick={handleDataRepair}
                  className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-surface-container-low transition-all text-sm font-bold text-on-surface border border-transparent hover:border-outline-variant/50"
                >
                  <ShieldCheck className="w-5 h-5 text-tertiary" /> Verileri Optimize Et (Onar)
                </button>
                <button 
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-surface-container-low transition-all text-sm font-bold text-on-surface border border-transparent hover:border-outline-variant/50"
                >
                  <div className="flex items-center gap-4">
                    {isDarkMode ? <Sun className="w-5 h-5 text-primary" /> : <Moon className="w-5 h-5 text-primary" />}
                    {isDarkMode ? 'Aydınlık Mod' : 'Karanlık Mod'}
                  </div>
                  <div className={cn(
                    "w-12 h-6 rounded-full relative transition-colors",
                    isDarkMode ? "bg-primary" : "bg-outline-variant"
                  )}>
                    <div className={cn(
                      "absolute top-1 w-4 h-4 rounded-full transition-all",
                      isDarkMode ? "left-7 bg-surface" : "left-1 bg-white"
                    )} />
                  </div>
                </button>
              </div>

              <div className="border-t border-outline-variant/30 pt-4 mb-10">
                <button 
                  onClick={logout}
                  className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-error/10 transition-all text-sm font-bold text-error border border-transparent hover:border-error/20"
                >
                  <LogOut className="w-5 h-5" /> Güvenli Çıkış
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
