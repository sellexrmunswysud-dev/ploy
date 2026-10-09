import React, { useState } from 'react';
import { 
  LogIn, 
  UserPlus, 
  Lock, 
  Mail, 
  User, 
  Phone, 
  Building2, 
  Briefcase, 
  Eye, 
  EyeOff, 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  Database,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { SangkhlaburiLogo } from './SangkhlaburiLogo';
import { UserProfile, UserRole } from '../types';
import { isSupabaseConfigured } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  canClose: boolean;
  currentUser: UserProfile | null;
  users: UserProfile[];
  onLogin: (user: UserProfile) => void;
  onRegister: (newUser: UserProfile) => Promise<boolean> | boolean;
  initialMode?: 'login' | 'register';
}

const AVATAR_OPTIONS = ['👨‍⚕️', '👩‍⚕️', '👩‍💼', '👨‍💼', '👩‍💻', '👨‍💻', '🩺', '👤'];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  canClose,
  currentUser,
  users,
  onLogin,
  onRegister,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  
  // Login fields
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Register fields
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regDepartment, setRegDepartment] = useState('กลุ่มงานประกันสุขภาพ ยุทธศาสตร์และสารสนเทศ');
  const [regPosition, setRegPosition] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('statistician');
  const [regAvatar, setRegAvatar] = useState('👩‍💼');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const identifier = loginIdentifier.trim().toLowerCase();
    const password = loginPassword.trim();

    if (!identifier) {
      setLoginError('กรุณากรอกชื่อผู้ใช้หรืออีเมล');
      return;
    }

    setIsSubmitting(true);

    // Search in current users registry
    const matchedUser = users.find(
      (u) =>
        u.username.toLowerCase() === identifier ||
        u.email.toLowerCase() === identifier
    );

    if (!matchedUser) {
      setIsSubmitting(false);
      setLoginError('ไม่พบชื่อผู้ใช้หรืออีเมลนี้ในระบบ');
      return;
    }

    if (!matchedUser.isActive) {
      setIsSubmitting(false);
      setLoginError('บัญชีผู้ใช้นี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ');
      return;
    }

    // Check password if set on user, otherwise accept demo password or standard 'password123'
    if (matchedUser.password && password && matchedUser.password !== password) {
      setIsSubmitting(false);
      setLoginError('รหัสผ่านไม่ถูกต้อง (รหัสผ่านทดสอบเริ่มต้น: password123)');
      return;
    }

    // Success login
    setTimeout(() => {
      setIsSubmitting(false);
      onLogin(matchedUser);
      onClose();
    }, 400);
  };

  const handleQuickLogin = (user: UserProfile) => {
    setLoginError(null);
    onLogin(user);
    onClose();
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);

    // Validation
    if (!regFullName.trim()) {
      setRegError('กรุณาระบุชื่อ-นามสกุล');
      return;
    }
    if (!regUsername.trim()) {
      setRegError('กรุณาระบุชื่อผู้ใช้งาน (Username)');
      return;
    }
    if (regUsername.trim().length < 3) {
      setRegError('ชื่อผู้ใช้งานต้องมีความยาวอย่างน้อย 3 ตัวอักษร');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setRegError('กรุณาระบุอีเมลที่ถูกต้อง');
      return;
    }
    if (!regPosition.trim()) {
      setRegError('กรุณาระบุตำแหน่งงาน');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setRegError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    // Check duplicate
    const isDup = users.some(
      (u) =>
        u.username.toLowerCase() === regUsername.trim().toLowerCase() ||
        u.email.toLowerCase() === regEmail.trim().toLowerCase()
    );
    if (isDup) {
      setRegError('ชื่อผู้ใช้หรืออีเมลนี้มีอยู่ในระบบแล้ว');
      return;
    }

    setIsSubmitting(true);

    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      username: regUsername.trim(),
      fullName: regFullName.trim(),
      position: regPosition.trim(),
      department: regDepartment.trim(),
      role: regRole,
      email: regEmail.trim(),
      phone: regPhone.trim() || '08x-xxx-xxxx',
      avatar: regAvatar,
      isActive: true,
      password: regPassword,
      createdAt: new Date().toISOString(),
    };

    try {
      const res = await onRegister(newUser);
      setIsSubmitting(false);
      if (res !== false) {
        setRegSuccess('สมัครเข้าใช้งานสำเร็จ! เข้าสู่ระบบให้อัตโนมัติ...');
        setTimeout(() => {
          onLogin(newUser);
          onClose();
        }, 800);
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setRegError(err?.message || 'เกิดข้อผิดพลาดในการลงทะเบียน');
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'executive':
        return { label: 'ผู้บริหาร / ผอ.', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300' };
      case 'statistician':
        return { label: 'เวชสถิติ', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300' };
      case 'accountant':
        return { label: 'การเงิน/ธุรการ', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300' };
      case 'superadmin':
        return { label: 'Super Admin', color: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        
        {/* Top Header Card with Emblem */}
        <div className="relative bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-900 p-6 text-white overflow-hidden">
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>

          {canClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="ปิดหน้าต่าง"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="relative flex items-center gap-4">
            <div className="p-1 bg-white rounded-2xl shadow-md shrink-0">
              <SangkhlaburiLogo size={52} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 text-[10px] font-bold uppercase tracking-wider">
                  SKB Management System
                </span>
                {isSupabaseConfigured() ? (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-200 font-semibold">
                    <Database className="w-3 h-3 text-emerald-300" />
                    Supabase Connected
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-300">
                    Offline / Local Cache
                  </span>
                )}
              </div>
              <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
                โรงพยาบาลสังขละบุรี
              </h2>
              <p className="text-xs text-emerald-100 font-medium opacity-90">
                ระบบสารสนเทศบริหารจัดการทะเบียนคุมลูกหนี้ทางการแพทย์ 52 สิทธิ์
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="mt-5 flex p-1 bg-emerald-950/50 rounded-2xl border border-emerald-600/30">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setLoginError(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-emerald-900 shadow-md font-bold'
                  : 'text-emerald-100 hover:text-white hover:bg-white/5'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>เข้าสู่ระบบ (Sign In)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setRegError(null);
                setRegSuccess(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                mode === 'register'
                  ? 'bg-white text-emerald-900 shadow-md font-bold'
                  : 'text-emerald-100 hover:text-white hover:bg-white/5'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>สมัครเข้าใช้งาน (Register)</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">

          {/* ================================================== */}
          {/* TAB 1: LOGIN FORM */}
          {/* ================================================== */}
          {mode === 'login' && (
            <div className="space-y-5">
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {loginError && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-200 text-xs flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{loginError}</span>
                  </div>
                )}

                {/* Username / Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    ชื่อผู้ใช้งาน หรือ อีเมล (Username / Email)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="เช่น director_skb, mayura_stat หรืออีเมล"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      รหัสผ่าน (Password)
                    </label>
                    <span className="text-[11px] text-slate-400">
                      รหัสเริ่มต้น: password123
                    </span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="กรอกรหัสผ่านของคุณ"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      title={showLoginPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>กำลังตรวจสอบสิทธิ์...</span>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>เข้าสู่ระบบ SKB Management</span>
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative flex items-center justify-center py-2">
                <div className="border-t border-slate-200 dark:border-slate-800 w-full"></div>
                <span className="bg-white dark:bg-slate-900 px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                  บัญชีทดสอบระบบ (คลิกเพื่อใส่ชื่อและรหัสผ่าน)
                </span>
              </div>

              {/* Quick Fill Account Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {users.slice(0, 4).map((u) => {
                  const badge = getRoleBadge(u.role);
                  const isSelected = loginIdentifier.toLowerCase() === u.username.toLowerCase();
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        setLoginIdentifier(u.username);
                        setLoginPassword(u.password || 'skb1234');
                        setLoginError(null);
                      }}
                      className={`p-3 rounded-2xl border text-left transition-all group cursor-pointer flex items-center gap-3 ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 ring-1 ring-emerald-500/30'
                          : 'border-slate-200 dark:border-slate-800 hover:border-emerald-400 bg-slate-50/70 hover:bg-emerald-50/30 dark:bg-slate-850 dark:hover:bg-slate-800'
                      }`}
                      title={`คลิกเพื่อใส่ข้อมูลบัญชี: ${u.fullName} (${u.position})`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                        {u.avatar || '👤'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                            {u.fullName}
                          </span>
                          {isSelected && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {u.position}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded-md ${badge.color}`}>
                            {badge.label}
                          </span>
                          <span className="text-[9px] font-mono text-slate-400 truncate">
                            @{u.username}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="text-center pt-1">
                <p className="text-[11px] text-slate-400">
                  ยังไม่มีบัญชีผู้ใช้งาน?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    คลิกสมัครสมาชิกใหม่ที่นี่
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* ================================================== */}
          {/* TAB 2: REGISTER FORM */}
          {/* ================================================== */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {regError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-200 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{regError}</span>
                </div>
              )}

              {regSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{regSuccess}</span>
                </div>
              )}

              {/* Avatar Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  เลือกไอคอนประจำตัว (Avatar)
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {AVATAR_OPTIONS.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setRegAvatar(av)}
                      className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center border transition-all cursor-pointer ${
                        regAvatar === av
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 scale-110 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              {/* Full Name & Username */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ชื่อ-นามสกุล <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="เช่น น.ส.สุภาพร มีสุข"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ชื่อผู้ใช้ (Username ภาษาอังกฤษ) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value.replace(/\s+/g, '').toLowerCase())}
                    placeholder="เช่น suphaporn_skb"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    อีเมลราชการ/ส่วนตัว <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="name@skb-hospital.go.th"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    เบอร์โทรศัพท์ (รับแจ้งเตือน SMS)
                  </label>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="08x-xxx-xxxx"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Department & Position */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    กลุ่มงาน / แผนก
                  </label>
                  <input
                    type="text"
                    value={regDepartment}
                    onChange={(e) => setRegDepartment(e.target.value)}
                    placeholder="กลุ่มงานประกันสุขภาพ"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ตำแหน่งงาน <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={regPosition}
                    onChange={(e) => setRegPosition(e.target.value)}
                    placeholder="เช่น เจ้าพนักงานการเงิน, พยาบาล"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  ระดับสิทธิ์การเข้าใช้งานระบบ (RBAC Role) <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'statistician', title: 'เวชสถิติ', sub: 'กระทบยอด HIS' },
                    { id: 'accountant', title: 'การเงิน/ธุรการ', sub: 'บันทึก 52 สิทธิ' },
                    { id: 'executive', title: 'ผู้บริหาร', sub: 'ดูสรุปและลงนาม' },
                    { id: 'superadmin', title: 'ผู้ดูแลระบบ', sub: 'จัดการระบบ' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRegRole(r.id as UserRole)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        regRole === r.id
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{r.title}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">{r.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    รหัสผ่าน (อย่างน้อย 6 ตัวอักษร) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="ตั้งรหัสผ่าน"
                      className="w-full pl-3.5 pr-9 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ยืนยันรหัสผ่านอีกครั้ง <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="ยืนยันรหัสผ่าน"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              {/* Submit Register Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>กำลังบันทึกข้อมูลและสร้างบัญชี...</span>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>ยืนยันการสมัครเข้าใช้งานระบบ</span>
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                <p className="text-[11px] text-slate-400">
                  มีบัญชีผู้ใช้งานอยู่แล้ว?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    เข้าสู่ระบบที่นี่
                  </button>
                </p>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
