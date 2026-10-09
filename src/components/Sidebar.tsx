import React from 'react';
import { 
  BarChart3, 
  FileSpreadsheet, 
  Printer, 
  Bell, 
  Users, 
  RefreshCw, 
  Moon, 
  Sun, 
  AlertTriangle,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Calendar,
  Building2,
  X,
  Database,
  LogOut,
  LogIn,
  UserPlus
} from 'lucide-react';
import { SangkhlaburiLogo } from './SangkhlaburiLogo';
import { UserProfile, UserRole } from '../types';
import { isSupabaseConfigured } from '../lib/supabase';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  onOpenAuthModal: () => void;
  onLogout: () => void;
  isDark: boolean;
  onToggleDark: () => void;
  overdueCount: number;
  onFilterOverdue: () => void;
  monthText: string;
  yearBE: number;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  onOpenSupabaseModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  isAuthenticated,
  onOpenAuthModal,
  onLogout,
  isDark,
  onToggleDark,
  overdueCount,
  onFilterOverdue,
  monthText,
  yearBE,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
  onOpenSupabaseModal,
}) => {
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  const navItems = [
    {
      group: 'ระบบทะเบียนคุม',
      items: [
        { id: 'dashboard', label: 'ภาพรวมการเงิน', icon: BarChart3, badge: 'Realtime' },
        { id: 'ledger', label: 'ทะเบียนคุม 52 สิทธิ์', icon: FileSpreadsheet, badge: '52 สิทธิ' },
        { id: 'reconcile', label: 'นำเข้า & เปรียบเทียบ HIS', icon: RefreshCw, badge: 'Auto' },
      ],
    },
    {
      group: 'เอกสาร & การแจ้งเตือน',
      items: [
        { id: 'report', label: 'พิมพ์รายงานราชการ (A4)', icon: Printer, badge: null },
        { id: 'notifications', label: 'แจ้งเตือน SMS / Email', icon: Bell, badge: 'Logs' },
        { id: 'users', label: 'จัดการสิทธิ์ RBAC', icon: ShieldCheck, badge: null },
      ],
    },
  ];

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'executive': return { text: 'ผอ.รพ. / ผู้บริหาร', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300' };
      case 'statistician': return { text: 'เวชสถิติชำนาญงาน', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300' };
      case 'accountant': return { text: 'การเงิน/ธุรการ', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300' };
      case 'superadmin': return { text: 'Super Admin', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300' };
    }
  };

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="no-print fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`no-print fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out shadow-lg lg:shadow-none ${
          isCollapsed ? 'w-20' : 'w-72'
        } ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header / Brand */}
        <div className="h-20 flex items-center justify-between px-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div 
            onClick={() => handleNavClick('dashboard')}
            className={`flex items-center gap-3 cursor-pointer overflow-hidden ${isCollapsed ? 'justify-center w-full' : ''}`}
          >
            <div className="shrink-0 relative">
              <SangkhlaburiLogo size={isCollapsed ? 36 : 42} />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
            </div>
            
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="font-display font-bold text-slate-900 dark:text-white text-base tracking-tight leading-none truncate">
                  รพ.สังขละบุรี
                </span>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1 truncate">
                  SKB Management
                </span>
              </div>
            )}
          </div>

          {/* Mobile close button */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Period Badge */}
        {!isCollapsed && (
          <div className="px-4 py-2.5 mx-3 mt-3 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-xl border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-medium">
              <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>ประจำเดือน {monthText} {yearBE}</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
        )}

        {/* Navigation Items (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navItems.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 pb-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {group.group}
                </div>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group cursor-pointer ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                    } ${isCollapsed ? 'justify-center px-0' : ''}`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400'
                    }`} />
                    
                    {!isCollapsed && (
                      <div className="flex-1 flex items-center justify-between text-left truncate">
                        <span className="truncate">{item.label}</span>
                        {item.badge && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {/* Urgent Overdue Alarm Quick Link inside Sidebar */}
          {overdueCount > 0 && (
            <div className="pt-2">
              <button
                onClick={() => {
                  onFilterOverdue();
                  setIsMobileOpen(false);
                }}
                className={`w-full p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs font-bold transition-all hover:bg-rose-100 dark:hover:bg-rose-900/60 cursor-pointer flex items-center ${
                  isCollapsed ? 'justify-center p-2.5' : 'justify-between'
                }`}
                title={`ตรวจพบลูกหนี้เกิน 30 วัน ${overdueCount} รายการ คลิกกรองด่วน`}
              >
                <div className="flex items-center gap-2">
                  <div className="relative w-7 h-7 rounded-lg bg-rose-500 text-white flex items-center justify-center shrink-0 animate-urgent">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  {!isCollapsed && (
                    <div className="text-left">
                      <div className="text-[11px] leading-tight">หนี้เกิน 30 วัน</div>
                      <div className="text-[10px] text-rose-600 dark:text-rose-300 font-normal">เร่งรัดติดตาม</div>
                    </div>
                  )}
                </div>

                {!isCollapsed && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[11px] font-mono font-bold">
                    {overdueCount}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer: Eye-comfort Dark Mode + User Card */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-2 shrink-0 bg-slate-50/50 dark:bg-slate-900/80">
          
          {/* Supabase Cloud Database Status Button */}
          {onOpenSupabaseModal && (
            <button
              onClick={onOpenSupabaseModal}
              className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isSupabaseConfigured()
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                  : 'bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-750 hover:bg-slate-100'
              } ${isCollapsed ? 'justify-center' : 'justify-between'}`}
              title="ตรวจสอบสถานะฐานข้อมูล Supabase และคัดลอก SQL"
            >
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                {!isCollapsed && <span>ฐานข้อมูล Supabase</span>}
              </div>
              {!isCollapsed && (
                <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured() ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></span>
              )}
            </button>
          )}

          {/* Eye Comfort Mode (Dark Mode) Button */}
          <button
            onClick={onToggleDark}
            className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              isDark
                ? 'bg-slate-800 text-amber-300 hover:bg-slate-750 border border-slate-700'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            } ${isCollapsed ? 'justify-center' : 'justify-between'}`}
            title={isDark ? 'เปลี่ยนเป็นโหมดสว่าง' : 'เปิดโหมดถนอมสายตา (กลางคืน)'}
          >
            <div className="flex items-center gap-2">
              {isDark ? (
                <Moon className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
              {!isCollapsed && (
                <span className="truncate">
                  {isDark ? 'โหมดถนอมสายตา (เปิดอยู่)' : 'โหมดสว่าง (Light Mode)'}
                </span>
              )}
            </div>
            {!isCollapsed && (
              <span className={`w-8 h-4.5 rounded-full flex items-center p-0.5 transition-colors ${
                isDark ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
              }`}>
                <span className="w-3.5 h-3.5 rounded-full bg-white shadow-xs"></span>
              </span>
            )}
          </button>

          {/* Active User Card & Dedicated Logout Button (No User Switching) */}
          {isAuthenticated && currentUser ? (
            <div className="space-y-2">
              {/* User Profile Card */}
              <div
                className={`p-2.5 rounded-2xl bg-slate-100/90 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 ${
                  isCollapsed ? 'flex justify-center' : ''
                }`}
                title={`เข้าใช้งานในชื่อ: ${currentUser.fullName} (${currentUser.position})`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center text-lg shrink-0 shadow-2xs">
                    {currentUser.avatar || '👤'}
                  </div>
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {currentUser.fullName}
                      </div>
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold truncate flex items-center gap-1 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                        <span className="truncate">{getRoleLabel(currentUser.role).text}</span>
                      </div>
                      <div className="text-[9px] text-slate-400 dark:text-slate-500 truncate">
                        {currentUser.position}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Dedicated Logout Button (Logout when wanting to change user or re-enter) */}
              <button
                onClick={onLogout}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300 hover:text-white bg-rose-50 hover:bg-rose-600 dark:bg-rose-950/50 dark:hover:bg-rose-600 border border-rose-200 dark:border-rose-900/80 hover:border-transparent transition-all shadow-2xs cursor-pointer group ${
                  isCollapsed ? 'justify-center' : 'justify-start'
                }`}
                title="ออกจากระบบเมื่อต้องการเข้าระบบใหม่ (Logout)"
              >
                <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-400 group-hover:text-white shrink-0 transition-colors" />
                {!isCollapsed && (
                  <div className="flex flex-col text-left">
                    <span className="leading-tight">ออกจากระบบ</span>
                    <span className="text-[9px] font-normal text-rose-500 dark:text-rose-400 group-hover:text-rose-100 transition-colors">
                      เมื่อต้องการเข้าระบบใหม่
                    </span>
                  </div>
                )}
              </button>
            </div>
          ) : (
            /* Logged Out: Button to Login */
            <button
              onClick={onOpenAuthModal}
              className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer ${
                isCollapsed ? 'justify-center' : 'justify-between'
              }`}
              title="เข้าสู่ระบบ เพื่อใช้งาน SKB Management System"
            >
              <div className="flex items-center gap-2">
                <LogIn className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span>เข้าสู่ระบบ</span>}
              </div>
              {!isCollapsed && (
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping"></span>
              )}
            </button>
          )}

          {/* Desktop Sidebar Collapse Toggle */}
          <div className="hidden lg:flex justify-end pt-1">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={isCollapsed ? 'ขยายเมนู' : 'ย่อเมนู'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

        </div>
      </aside>
    </>
  );
};
