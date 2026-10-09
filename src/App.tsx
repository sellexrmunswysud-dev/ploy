import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { SupabaseModal } from './components/SupabaseModal';
import { AuthModal } from './components/AuthModal';
import { DashboardView } from './components/DashboardView';
import { LedgerView } from './components/LedgerView';
import { ReportPrintView } from './components/ReportPrintView';
import { NotificationView } from './components/NotificationView';
import { UserManagementView } from './components/UserManagementView';
import { ReconciliationView } from './components/ReconciliationView';
import { 
  INITIAL_DEBT_ITEMS, 
  INITIAL_USERS, 
  DEFAULT_SIGNATORIES, 
  INITIAL_NOTIFICATION_LOGS 
} from './data/initialData';
import { MedicalDebtItem, UserProfile, SignatoryInfo, NotificationLog } from './types';
import { calculateSummaryStats } from './utils/calculator';
import { isSupabaseConfigured } from './lib/supabase';
import { 
  saveMedicalDebtItemsToSupabase, 
  fetchMedicalDebtItemsFromSupabase,
  fetchUsersFromSupabase,
  saveSingleUserToSupabase
} from './services/supabaseService';
import confetti from 'canvas-confetti';

const STORAGE_KEY_ITEMS = 'skb_medical_debt_items_v1';
const STORAGE_KEY_USERS = 'skb_users_v1';
const STORAGE_KEY_LOGS = 'skb_notif_logs_v1';
const STORAGE_KEY_SIGN = 'skb_signatories_v1';
const STORAGE_KEY_LAST_SAVED = 'skb_last_saved_time_v1';
const STORAGE_KEY_IS_AUTH = 'skb_is_auth_session_v1';
const STORAGE_KEY_CURRENT_USER = 'skb_auth_current_user_v1';

export default function App() {
  // Dark mode (Eye Comfort) state
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('skb_theme_mode');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Sidebar collapse states
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [ledgerInitialFilter, setLedgerInitialFilter] = useState<'all' | 'gov' | 'ext' | 'overdue'>('all');

  // Month and period state
  const [monthText, setMonthText] = useState('สิงหาคม');
  const [yearBE, setYearBE] = useState(2569);
  const [recordDate, setRecordDate] = useState('2026-08-31');

  // Persistence data states
  const [items, setItems] = useState<MedicalDebtItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ITEMS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_DEBT_ITEMS;
  });

  const [users, setUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_USERS;
  });

  // Authentication State: Require login upon entering the system unless an active session exists
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const savedAuth = localStorage.getItem(STORAGE_KEY_IS_AUTH);
      if (savedAuth === 'true') {
        const savedCurrent = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
        if (savedCurrent) {
          const parsed = JSON.parse(savedCurrent);
          if (parsed && parsed.id) return true;
        }
      }
    } catch (e) {}
    // Default to requiring login when entering the system
    return false;
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const savedAuth = localStorage.getItem(STORAGE_KEY_IS_AUTH);
      if (savedAuth === 'true') {
        const savedCurrent = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
        if (savedCurrent) {
          const parsed = JSON.parse(savedCurrent);
          if (parsed && parsed.id) return parsed;
        }
      }
    } catch (e) {}
    return null;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [signatories, setSignatories] = useState<SignatoryInfo>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SIGN);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_SIGNATORIES;
  });

  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LOGS);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_NOTIFICATION_LOGS;
  });

  const [lastSavedAt, setLastSavedAt] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY_LAST_SAVED) || '31 ส.ค. 2569 16:45:00';
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  // Auto-fetch data from Supabase if configured on initial load
  useEffect(() => {
    if (isSupabaseConfigured()) {
      fetchMedicalDebtItemsFromSupabase().then((res) => {
        if (res.success && res.items && res.items.length > 0) {
          setItems(res.items);
        }
      }).catch(console.error);

      fetchUsersFromSupabase().then((res) => {
        if (res.success && res.users && res.users.length > 0) {
          setUsers(res.users);
        }
      }).catch(console.error);
    }
  }, []);

  // Sync dark mode class with DOM
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('skb_theme_mode', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('skb_theme_mode', 'light');
    }
  }, [isDark]);

  const toggleDark = () => {
    setIsDark((prev) => !prev);
  };

  // Toast feedback helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Save all to database (Supabase + localStorage offline fallback)
  const handleSaveDatabase = async () => {
    try {
      localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items));
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
      localStorage.setItem(STORAGE_KEY_SIGN, JSON.stringify(signatories));
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(notificationLogs));
      
      const nowStr = new Date().toLocaleString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      localStorage.setItem(STORAGE_KEY_LAST_SAVED, nowStr);
      setLastSavedAt(nowStr);

      // Save to Supabase Cloud Database if configured
      if (isSupabaseConfigured()) {
        const res = await saveMedicalDebtItemsToSupabase(items);
        if (res.success) {
          showToast('บันทึก 52 สิทธิลงฐานข้อมูล Supabase สำเร็จ!');
        } else {
          showToast(res.message);
        }
      } else {
        showToast('บันทึกข้อมูล 52 สิทธิการรักษาพยาบาล เรียบร้อยแล้ว (แคชระบบ)');
      }

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
        });
      } catch (e) {}
    } catch (e) {
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  // Reset to original hospital figures
  const handleResetOriginal = () => {
    if (window.confirm('คุณต้องการรีเซ็ตข้อมูลทั้งหมดกลับเป็นค่ามาตรฐานทางการตามเอกสาร รพ.สังขละบุรี หรือไม่?')) {
      setItems(INITIAL_DEBT_ITEMS);
      setSignatories(DEFAULT_SIGNATORIES);
      localStorage.removeItem(STORAGE_KEY_ITEMS);
      localStorage.removeItem(STORAGE_KEY_SIGN);
      const nowStr = new Date().toLocaleString('th-TH');
      setLastSavedAt(nowStr);
      showToast('รีเซ็ตข้อมูลกลับเป็นตัวเลขทางการประจำเดือน สิงหาคม 2569 แล้ว');
    }
  };

  // Stats for alarms
  const stats = calculateSummaryStats(items);

  const handleFilterOverdue = () => {
    setLedgerInitialFilter('overdue');
    setActiveTab('ledger');
  };

  const handleNavigateToLedgerWithFilter = (filterType: 'all' | 'gov' | 'ext' | 'overdue' = 'all') => {
    setLedgerInitialFilter(filterType);
    setActiveTab('ledger');
  };

  // Authentication Handlers
  const handleLogin = (user: UserProfile) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem(STORAGE_KEY_IS_AUTH, 'true');
    localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(user));
    showToast(`ยินดีต้อนรับ ${user.fullName} (${user.position}) เข้าสู่ระบบ`);
    setIsAuthModalOpen(false);
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch (e) {}
  };

  const handleRegister = async (newUser: UserProfile): Promise<boolean> => {
    try {
      const updated = [...users, newUser];
      setUsers(updated);
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updated));

      if (isSupabaseConfigured()) {
        await saveSingleUserToSupabase(newUser);
      }

      showToast(`ลงทะเบียนผู้ใช้งาน ${newUser.fullName} เรียบร้อยแล้ว`);
      return true;
    } catch (err: any) {
      showToast('เกิดข้อผิดพลาดในการลงทะเบียนผู้ใช้');
      return false;
    }
  };

  const handleLogout = () => {
    if (window.confirm('คุณต้องการออกจากระบบ SKB Management System ใช่หรือไม่?\n\n(หากต้องการเปลี่ยนบัญชีผู้ใช้งานหรือเข้าใช้งานใหม่ กรุณาลงชื่อเข้าใช้ใหม่อีกครั้ง)')) {
      setIsAuthenticated(false);
      setCurrentUser(null);
      localStorage.setItem(STORAGE_KEY_IS_AUTH, 'false');
      localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
      showToast('ออกจากระบบเรียบร้อยแล้ว กรุณาเข้าสู่ระบบด้วยบัญชีที่ต้องการ');
      setIsAuthModalOpen(true);
    }
  };

  // Safe user profile for views (fallback to first user if not authenticated)
  const activeUser = currentUser || users[0] || INITIAL_USERS[0];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors font-sans flex">
      {/* 1. Left Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        isAuthenticated={isAuthenticated}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        isDark={isDark}
        onToggleDark={toggleDark}
        overdueCount={stats.overdue30Count}
        onFilterOverdue={handleFilterOverdue}
        monthText={monthText}
        yearBE={yearBE}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
      />

      {/* 2. Main Content Right Pane (Adjusts with Sidebar width) */}
      <div 
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-72'
        }`}
      >
        {/* Top Header Bar */}
        <TopBar
          onOpenMobileMenu={() => setIsMobileOpen(true)}
          activeTab={activeTab}
          monthText={monthText}
          yearBE={yearBE}
          recordDate={recordDate}
          setRecordDate={setRecordDate}
          overdueCount={stats.overdue30Count}
          onFilterOverdue={handleFilterOverdue}
          onSaveDatabase={handleSaveDatabase}
          lastSavedAt={lastSavedAt}
          currentUser={currentUser}
          isAuthenticated={isAuthenticated}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onLogout={handleLogout}
          onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        />

        {/* Dynamic View Content */}
        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 pt-6 pb-12 overflow-x-hidden">
          {/* Unauthenticated Alert Banner */}
          {!isAuthenticated && (
            <div className="no-print mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-amber-200/80 dark:bg-amber-900/60 flex items-center justify-center text-lg shrink-0">
                  🔐
                </span>
                <div>
                  <div className="font-bold text-sm text-amber-950 dark:text-amber-100">
                    ออกจากระบบแล้ว (Guest Mode)
                  </div>
                  <div className="text-[11px] text-amber-800 dark:text-amber-300">
                    กรุณาเข้าสู่ระบบ หรือ สมัครเข้าใช้งาน เพื่อบันทึกข้อมูลลูกหนี้และลงนามรับรองรายงานทางการ
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 text-xs shrink-0 transition-all cursor-pointer"
              >
                เข้าสู่ระบบ / สมัครสมาชิก
              </button>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <DashboardView
              items={items}
              currentUser={activeUser}
              monthText={monthText}
              yearBE={yearBE}
              onNavigateToLedger={handleNavigateToLedgerWithFilter}
              onNavigateToReport={() => setActiveTab('report')}
              onNavigateToNotification={() => setActiveTab('notifications')}
              onNavigateToReconcile={() => setActiveTab('reconcile')}
            />
          )}

          {activeTab === 'ledger' && (
            <LedgerView
              items={items}
              setItems={setItems}
              currentUser={activeUser}
              recordDate={recordDate}
              setRecordDate={setRecordDate}
              monthText={monthText}
              yearBE={yearBE}
              initialFilter={ledgerInitialFilter}
              onSaveDatabase={handleSaveDatabase}
              lastSavedAt={lastSavedAt}
              onResetOriginal={handleResetOriginal}
            />
          )}

          {activeTab === 'report' && (
            <ReportPrintView
              items={items}
              currentUser={activeUser}
              monthText={monthText}
              yearBE={yearBE}
              signatories={signatories}
              setSignatories={setSignatories}
            />
          )}

          {activeTab === 'reconcile' && (
            <ReconciliationView
              items={items}
              setItems={setItems}
              currentUser={activeUser}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationView
              items={items}
              currentUser={activeUser}
              monthText={monthText}
              yearBE={yearBE}
              notificationLogs={notificationLogs}
              setNotificationLogs={setNotificationLogs}
            />
          )}

          {activeTab === 'users' && (
            <UserManagementView
              users={users}
              setUsers={setUsers}
              currentUser={currentUser}
              items={items}
              setItems={setItems}
              onLogout={handleLogout}
            />
          )}
        </main>

        {/* Footer (Hidden in Print) */}
        <footer className="no-print border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 py-4 px-6 text-xs text-slate-500 dark:text-slate-400 mt-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 dark:text-slate-200">SKB Management System</span>
              <span>• โรงพยาบาลสังขละบุรี จังหวัดกาญจนบุรี</span>
            </div>
            <div className="text-[11px] text-slate-400">
              ระบบสารสนเทศบริหารจัดการทะเบียนคุมลูกหนี้ทางการแพทย์ 52 สิทธิ์การรักษาพยาบาล
            </div>
          </div>
        </footer>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="no-print fixed bottom-6 right-6 z-50 bg-slate-900 text-white dark:bg-emerald-950 dark:text-emerald-100 dark:border-emerald-700 px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-semibold flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Supabase Connection & Schema Modal */}
      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        items={items}
        users={users}
        onSyncComplete={(msg) => showToast(msg)}
      />

      {/* Authentication Modal (Login / Register Window) */}
      <AuthModal
        isOpen={isAuthModalOpen || !isAuthenticated}
        onClose={() => setIsAuthModalOpen(false)}
        canClose={isAuthenticated}
        currentUser={currentUser}
        users={users}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
    </div>
  );
}

