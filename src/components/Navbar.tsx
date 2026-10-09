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
  ChevronDown
} from 'lucide-react';
import { SangkhlaburiLogo } from './SangkhlaburiLogo';
import { UserProfile, UserRole } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: UserProfile;
  users: UserProfile[];
  onSwitchUser: (user: UserProfile) => void;
  isDark: boolean;
  onToggleDark: () => void;
  overdueCount: number;
  onFilterOverdue: () => void;
  monthText: string;
  yearBE: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  users,
  onSwitchUser,
  isDark,
  onToggleDark,
  overdueCount,
  onFilterOverdue,
  monthText,
  yearBE,
}) => {
  const [showUserDropdown, setShowUserDropdown] = React.useState(false);

  const navItems = [
    { id: 'dashboard', label: 'ภาพรวมการเงิน', icon: BarChart3 },
    { id: 'ledger', label: 'ทะเบียนคุม 52 สิทธิ์', icon: FileSpreadsheet },
    { id: 'report', label: 'พิมพ์รายงานราชการ', icon: Printer },
    { id: 'reconcile', label: 'นำเข้า & เปรียบเทียบ HIS', icon: RefreshCw },
    { id: 'notifications', label: 'แจ้งเตือน SMS/Email', icon: Bell },
    { id: 'users', label: 'จัดการสิทธิ์ RBAC', icon: Users },
  ];

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'executive':
        return { label: 'ผู้บริหาร / ผอ.รพ.', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' };
      case 'statistician':
        return { label: 'เจ้าพนักงานเวชสถิติ', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' };
      case 'accountant':
        return { label: 'เจ้าหน้าที่การเงิน/ธุรการ', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' };
      case 'superadmin':
        return { label: 'ผู้ดูแลระบบ Super Admin', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' };
    }
  };

  return (
    <header className="no-print sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <SangkhlaburiLogo size={42} />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white text-base tracking-tight leading-none">
                  รพ.สังขละบุรี
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-sm bg-emerald-600 text-white tracking-wide">
                  SKB System
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 hidden sm:block">
                ระบบทะเบียนคุมลูกหนี้ 52 สิทธิ์การรักษา • ประจำเดือน {monthText} {yearBE}
              </p>
            </div>
          </div>

          {/* Navigation Links - Desktop */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700 dark:text-emerald-400' : ''}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action Icons & User Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Urgent Overdue Alert Flashing Button */}
            {overdueCount > 0 && (
              <button
                onClick={onFilterOverdue}
                title={`มีลูกหนี้ค้างชำระเกิน 30 วัน จำนวน ${overdueCount} รายการ คลิกเพื่อดูด่วน`}
                className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-semibold border border-rose-200 dark:border-rose-800/60 transition-all cursor-pointer"
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
                </span>
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 animate-urgent" />
                <span className="hidden sm:inline">หนี้เกิน 30 วัน</span>
                <span className="px-1.5 py-0.2 bg-rose-600 text-white rounded-full text-[10px] font-bold">
                  {overdueCount}
                </span>
              </button>
            )}

            {/* Dark Mode Toggle */}
            <button
              onClick={onToggleDark}
              aria-label="เปลี่ยนโหมดกลางคืน/สว่าง"
              className="p-2 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={isDark ? 'โหมดสว่าง (Light Mode)' : 'โหมดมืดถนอมสายตา (Dark Mode)'}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* User Profile / RBAC Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
              >
                <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm">
                  {currentUser.avatar || '👤'}
                </div>
                <div className="hidden md:block">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[130px]">
                    {currentUser.fullName}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[130px]">
                    {currentUser.position.split(' ')[0]}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-850 rounded-xl shadow-xl border border-slate-200 dark:border-slate-750 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-500 dark:text-slate-400">เข้าสู่ระบบในชื่อ</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {currentUser.fullName}
                    </p>
                    <span className={`inline-block mt-1 text-[11px] font-medium px-2 py-0.5 rounded-sm ${getRoleBadge(currentUser.role).color}`}>
                      {getRoleBadge(currentUser.role).label}
                    </span>
                  </div>

                  <div className="py-1">
                    <p className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      สลับบทบาทผู้ใช้งาน (RBAC Simulation)
                    </p>
                    {users.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          onSwitchUser(u);
                          setShowUserDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                          u.id === currentUser.id
                            ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300 font-semibold'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span>{u.avatar}</span>
                          <div className="truncate">
                            <div className="truncate font-medium">{u.fullName}</div>
                            <div className="text-[10px] text-slate-400 truncate">{u.position}</div>
                          </div>
                        </div>
                        {u.id === currentUser.id && (
                          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 pt-1 mt-1">
                    <button
                      onClick={() => {
                        setActiveTab('users');
                        setShowUserDropdown(false);
                      }}
                      className="w-full text-center px-3 py-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-medium hover:underline"
                    >
                      จัดการผู้ใช้งานทั้งหมดในระบบ →
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Mobile Tab Bar */}
      <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around overflow-x-auto gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center py-1 px-2 rounded-md text-[11px] whitespace-nowrap transition-colors ${
                isActive
                  ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span>{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
