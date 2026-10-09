import React from 'react';
import { 
  Menu, 
  Calendar, 
  AlertTriangle, 
  Printer, 
  Save, 
  Search,
  Bell,
  Sparkles,
  Database,
  Cloud,
  LogOut,
  LogIn,
  UserCheck
} from 'lucide-react';
import { UserProfile } from '../types';
import { isSupabaseConfigured } from '../lib/supabase';

interface TopBarProps {
  onOpenMobileMenu: () => void;
  activeTab: string;
  monthText: string;
  yearBE: number;
  recordDate: string;
  setRecordDate: (date: string) => void;
  overdueCount: number;
  onFilterOverdue: () => void;
  onSaveDatabase: () => void;
  lastSavedAt: string | null;
  currentUser: UserProfile | null;
  isAuthenticated?: boolean;
  onOpenAuthModal?: () => void;
  onLogout?: () => void;
  onOpenSupabaseModal?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenMobileMenu,
  activeTab,
  monthText,
  yearBE,
  recordDate,
  setRecordDate,
  overdueCount,
  onFilterOverdue,
  onSaveDatabase,
  lastSavedAt,
  currentUser,
  isAuthenticated = true,
  onOpenAuthModal,
  onLogout,
  onOpenSupabaseModal,
}) => {
  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return {
          title: 'แดชบอร์ดสรุปสถานะการเงินเรียลไทม์',
          sub: 'โรงพยาบาลสังขละบุรี • ทะเบียนคุม 52 สิทธิ์การรักษาพยาบาล',
          tag: 'ภาพรวมผู้บริหาร',
        };
      case 'ledger':
        return {
          title: 'ทะเบียนคุมลูกหนี้ 52 สิทธิ์การรักษาพยาบาล',
          sub: 'คำนวณอัตโนมัติ: ยอดตั้งต้น + ตั้งใหม่ − รับชำระ − ตัดหนี้สูญ = คงเหลือยกไป',
          tag: 'แบบฟอร์มบันทึกบัญชี',
        };
      case 'report':
        return {
          title: 'ระบบพิมพ์รายงานประจำเดือนเสนอผู้บริหาร',
          sub: 'มาตรฐานราชการ รพ.สังขละบุรี พร้อมตราสัญลักษณ์ และช่องลงนาม 3 ลำดับชั้น',
          tag: 'Official Print A4',
        };
      case 'reconcile':
        return {
          title: 'นำเข้าและเปรียบเทียบข้อมูลลูกหนี้ HIS',
          sub: 'กระทบยอดระหว่างระบบทะเบียนคุมและ HIS ไฮไลต์ผลต่างสีส้ม/เขียว',
          tag: 'Auto-Reconciliation',
        };
      case 'notifications':
        return {
          title: 'ระบบแจ้งเตือนผ่าน SMS & Email อัตโนมัติ',
          sub: 'ส่งข้อความแจ้งเตือนผู้อำนวยการและเจ้าหน้าที่การเงินเมื่อปิดรอบเสร็จ',
          tag: 'SMS / Email Gateway',
        };
      case 'users':
        return {
          title: 'จัดการผู้ใช้งานตามลำดับชั้นข้อมูล (RBAC)',
          sub: 'ควบคุมสิทธิ์ 4 ลำดับชั้น: ผู้บริหาร, เวชสถิติ, การเงิน/ธุรการ, ผู้ดูแลระบบ',
          tag: 'Security & Access',
        };
      default:
        return {
          title: 'ระบบสารสนเทศบริหารจัดการทะเบียนคุมลูกหนี้',
          sub: 'โรงพยาบาลสังขละบุรี จังหวัดกาญจนบุรี',
          tag: 'SKB Hospital',
        };
    }
  };

  const info = getTabTitle();

  return (
    <header className="no-print bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-30 transition-colors">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        
        {/* Left: Mobile Toggle & Eye-catching Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileMenu}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden cursor-pointer shrink-0"
            aria-label="เปิดเมนูด้านซ้าย"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 tracking-wide uppercase">
                {info.tag}
              </span>
              <h1 className="font-display font-bold text-lg sm:text-xl lg:text-2xl text-slate-900 dark:text-white tracking-tight truncate">
                {info.title}
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate hidden sm:block mt-0.5">
              {info.sub}
            </p>
          </div>
        </div>

        {/* Right Action Widgets */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Quick Date Picker */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
            <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <input
              type="date"
              value={recordDate}
              onChange={(e) => setRecordDate(e.target.value)}
              className="bg-transparent text-slate-700 dark:text-slate-300 font-medium focus:outline-hidden text-xs cursor-pointer"
              title="เลือกวันที่บันทึกบัญชี"
            />
          </div>

          {/* Urgent Overdue Flashing Icon */}
          {overdueCount > 0 && (
            <button
              onClick={onFilterOverdue}
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold border border-rose-200 dark:border-rose-800 transition-all cursor-pointer"
              title={`มีลูกหนี้เกิน 30 วัน ${overdueCount} รายการ คลิกเพื่อดูทันที`}
            >
              <AlertTriangle className="w-4 h-4 text-rose-600 animate-urgent" />
              <span className="hidden xl:inline">ค้างชำระ &gt; 30 วัน</span>
              <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-mono">
                {overdueCount}
              </span>
            </button>
          )}

          {/* Supabase Status / Setup Modal Button */}
          {onOpenSupabaseModal && (
            <button
              onClick={onOpenSupabaseModal}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                isSupabaseConfigured()
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
              title="ตรวจสอบสถานะการเชื่อมต่อฐานข้อมูล Supabase และคัดลอก SQL Schema"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Supabase</span>
              <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured() ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></span>
            </button>
          )}

          {/* Quick Save to Database Button */}
          <button
            onClick={onSaveDatabase}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
            title="บันทึกข้อมูลเข้าฐานข้อมูลระบบ"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">บันทึกฐานข้อมูล</span>
          </button>

          {/* User Auth Info & Logout / Login Button */}
          {isAuthenticated && currentUser ? (
            <div className="flex items-center gap-1 sm:gap-2 pl-1 border-l border-slate-200 dark:border-slate-700">
              {/* Current User Profile Pill (No direct switch) */}
              <div
                className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs border border-slate-200/60 dark:border-slate-700/60"
                title={`เข้าใช้งานในชื่อ: ${currentUser.fullName} (${currentUser.position}) - ออกจากระบบหากต้องการเปลี่ยนบัญชี`}
              >
                <span className="text-sm">{currentUser.avatar || '👤'}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 max-w-[120px] truncate">
                  {currentUser.fullName.split(' ')[0]}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
              </div>

              {/* TopBar Logout Button (Required to switch or enter anew) */}
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:text-white dark:text-rose-400 dark:hover:text-white bg-rose-50 hover:bg-rose-600 dark:bg-rose-950/50 dark:hover:bg-rose-600 border border-rose-200 dark:border-rose-900/80 hover:border-transparent transition-all cursor-pointer shadow-2xs group"
                  title="ออกจากระบบเมื่อต้องการเข้าระบบใหม่ หรือเปลี่ยนบัญชีผู้ใช้งาน"
                >
                  <LogOut className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  <span className="hidden lg:inline text-[11px] font-bold">ออกจากระบบ</span>
                </button>
              )}
            </div>
          ) : onOpenAuthModal ? (
            /* Logged Out: Button to Login */
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="เข้าสู่ระบบ หรือ สมัครเข้าใช้งาน"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>เข้าสู่ระบบ</span>
            </button>
          ) : null}
        </div>

      </div>
    </header>
  );
};
