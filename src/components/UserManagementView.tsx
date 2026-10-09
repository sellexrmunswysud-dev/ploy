import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Check, 
  X, 
  Edit3, 
  Trash2, 
  Key, 
  Database, 
  Download, 
  Upload,
  Lock,
  Phone,
  Mail,
  UserCheck,
  Cloud
} from 'lucide-react';
import { UserProfile, UserRole, MedicalDebtItem } from '../types';
import { 
  saveSingleUserToSupabase, 
  saveUsersToSupabase, 
  deleteUserFromSupabase 
} from '../services/supabaseService';
import { isSupabaseConfigured } from '../lib/supabase';

interface UserManagementViewProps {
  users: UserProfile[];
  setUsers: React.Dispatch<React.SetStateAction<UserProfile[]>>;
  currentUser: UserProfile | null;
  setCurrentUser?: (user: UserProfile) => void;
  items: MedicalDebtItem[];
  setItems: React.Dispatch<React.SetStateAction<MedicalDebtItem[]>>;
  onLogout?: () => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  users,
  setUsers,
  currentUser,
  setCurrentUser,
  items,
  setItems,
  onLogout,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [newUser, setNewUser] = useState<Partial<UserProfile>>({
    fullName: '',
    username: '',
    position: '',
    department: 'กลุ่มงานประกันสุขภาพ ยุทธศาสตร์และสารสนเทศ',
    role: 'accountant',
    email: '',
    phone: '',
    avatar: '👤',
    password: 'password123',
    isActive: true,
  });

  const isSuperAdmin = currentUser?.role === 'superadmin';

  const roleDefinitions = [
    {
      role: 'executive' as UserRole,
      title: 'ผู้บริหาร (Executive / ผอ.รพ.)',
      description: 'ดูแดชบอร์ดภาพรวม, รับรองและลงนามรายงานทางการ, รับ SMS/Email สรุปยอดรายเดือน',
      color: 'border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20 text-purple-900 dark:text-purple-200',
      badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300',
      permissions: [
        'ดูแดชบอร์ดสถานะการเงินแบบเรียลไทม์',
        'ลงนามรับรองรายงานเสนอผู้บริหาร (Digital Approval)',
        'รับ SMS / Email สรุปยอดปิดรอบ',
        'ส่งออกรายงาน Excel / PDF',
      ],
    },
    {
      role: 'statistician' as UserRole,
      title: 'เจ้าพนักงานเวชสถิติ (Statistician)',
      description: 'ตรวจสอบความถูกต้องของสิทธิการรักษา, เปรียบเทียบกระทบยอด HIS, ตรวจสอบรายงาน',
      color: 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 text-blue-900 dark:text-blue-200',
      badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300',
      permissions: [
        'ตรวจสอบความถูกต้องยอดลูกหนี้ 52 สิทธิ',
        'นำเข้าและเปรียบเทียบข้อมูลระบบ HIS (One-click Reconcile)',
        'ลงนามในฐานะผู้ตรวจสอบ',
        'ค้นหาและกรองรายการลูกหนี้',
      ],
    },
    {
      role: 'accountant' as UserRole,
      title: 'เจ้าหน้าที่การเงิน/ธุรการ (Accountant)',
      description: 'บันทึกรับชำระเงิน, ตั้งหนี้ใหม่ของเดือน, ตัดหนี้สูญ, สรุปปิดรอบ, ออกรายงาน',
      color: 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200',
      badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
      permissions: [
        'บันทึกตั้งหนี้ใหม่และรับชำระระหว่างเดือน',
        'บันทึกตัดหนี้สูญและแก้ไขยอดคงเหลือ',
        'เลือกวันที่จะบันทึกบัญชีผ่านปฏิทิน',
        'ลงนามในฐานะผู้รายงาน',
      ],
    },
    {
      role: 'superadmin' as UserRole,
      title: 'ผู้ดูแลระบบ (Super Admin)',
      description: 'จัดการผู้ใช้งานทั้งหมด, กำหนดสิทธิ์ RBAC, สำรองและกู้คืนฐานข้อมูลระบบ',
      color: 'border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200',
      badge: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300',
      permissions: [
        'เพิ่ม ลบ แก้ไข ข้อมูลผู้ใช้งานในระบบ',
        'กำหนดสิทธิ์การเข้าถึง (RBAC)',
        'สำรองและกู้คืนฐานข้อมูล (Backup & Restore)',
        'สิทธิ์เข้าถึงทุกฟังก์ชันในระบบ 100%',
      ],
    },
  ];

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.fullName || !newUser.username) return;

    const created: UserProfile = {
      id: `usr-${Date.now()}`,
      username: newUser.username.trim(),
      fullName: newUser.fullName.trim(),
      position: newUser.position || 'เจ้าหน้าที่',
      role: (newUser.role as UserRole) || 'accountant',
      email: newUser.email || '',
      phone: newUser.phone || '',
      avatar: newUser.avatar || '👤',
      isActive: true,
    };

    setUsers((prev) => [...prev, created]);

    if (isSupabaseConfigured()) {
      saveSingleUserToSupabase(created).then((res) => {
        if (res.success) {
          alert('บันทึกข้อมูลผู้ใช้งานลง Supabase เรียบร้อยแล้ว');
        }
      }).catch(console.error);
    }

    setShowAddModal(false);
    setNewUser({
      fullName: '',
      username: '',
      position: '',
      role: 'accountant',
      email: '',
      phone: '',
      avatar: '👤',
      isActive: true,
    });
  };

  const handleDeleteUser = (id: string, name: string) => {
    if (users.length <= 1) {
      alert('ไม่สามารถลบผู้ใช้งานคนสุดท้ายของระบบได้');
      return;
    }
    if (window.confirm(`ยืนยันการลบผู้ใช้ "${name}" หรือไม่?`)) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
      if (currentUser?.id === id) {
        if (onLogout) {
          onLogout();
        } else if (setCurrentUser) {
          const remaining = users.filter((u) => u.id !== id);
          if (remaining.length > 0) setCurrentUser(remaining[0]);
        }
      }
      if (isSupabaseConfigured()) {
        deleteUserFromSupabase(id).catch(console.error);
      }
    }
  };

  const handleSyncUsersToSupabase = async () => {
    const res = await saveUsersToSupabase(users);
    alert(res.message);
  };

  const handleExportBackup = () => {
    const backupData = {
      hospital: 'โรงพยาบาลสังขละบุรี',
      exportDate: new Date().toISOString(),
      items,
      users,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SKB_System_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.items && Array.isArray(parsed.items)) {
          setItems(parsed.items);
        }
        if (parsed.users && Array.isArray(parsed.users)) {
          setUsers(parsed.users);
        }
        alert('กู้คืนฐานข้อมูลสำเร็จเรียบร้อยแล้ว!');
      } catch (err) {
        alert('ไฟล์ข้อมูลสำรองไม่ถูกต้อง');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-emerald-600" />
              ระบบจัดการผู้ใช้งานตามลำดับชั้นข้อมูล (RBAC)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              Role-Based Access Control
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            ควบคุมความปลอดภัยในการเข้าถึงข้อมูลลูกหนี้ทางการแพทย์ แยกตามหน้าที่: ผู้บริหาร, เจ้าพนักงานเวชสถิติ, เจ้าหน้าที่การเงิน/ธุรการ, และผู้ดูแลระบบ
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Sync to Supabase */}
          <button
            onClick={handleSyncUsersToSupabase}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-semibold transition-colors cursor-pointer"
            title="บันทึกรายชื่อผู้ใช้และสิทธิ์ทั้งหมดลงฐานข้อมูล Supabase"
          >
            <Cloud className="w-4 h-4 text-emerald-600" />
            <span>บันทึกสิทธิ์ลง Supabase</span>
          </button>

          {/* Backup / Export */}
          <button
            onClick={handleExportBackup}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors cursor-pointer"
            title="สำรองฐานข้อมูลทั้งหมดเป็นไฟล์ JSON"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>สำรองข้อมูล</span>
          </button>

          {/* Restore / Import */}
          <label className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors cursor-pointer">
            <Upload className="w-4 h-4 text-blue-600" />
            <span>กู้คืนข้อมูล (Restore)</span>
            <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
          </label>

          {/* Add User */}
          {isSuperAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>เพิ่มผู้ใช้งานใหม่</span>
            </button>
          )}
        </div>
      </div>

      {/* RBAC Role Matrix Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {roleDefinitions.map((def) => {
          const countInRole = users.filter((u) => u.role === def.role).length;
          return (
            <div
              key={def.role}
              className={`rounded-2xl p-5 border ${def.color} shadow-xs flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${def.badge}`}>
                    {def.title.split(' ')[0]}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {countInRole} คน
                  </span>
                </div>
                <h3 className="font-bold text-sm mb-1">{def.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
                  {def.description}
                </p>

                <div className="space-y-1.5 border-t border-slate-200/60 dark:border-slate-700/60 pt-3">
                  <span className="text-[10px] uppercase font-semibold text-slate-400">สิทธิ์ในระบบ:</span>
                  {def.permissions.map((p, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="text-[11px] leading-tight">{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* User Accounts List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-600" />
            รายชื่อผู้ใช้งานและบทบาทในระบบ (Active Accounts)
          </h2>
          <span className="text-xs text-slate-400">
            ระบบความปลอดภัย: หากต้องการเข้าใช้งานด้วยบัญชีอื่น กรุณากด "ออกจากระบบ" ก่อน
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {users.map((user) => {
            const isCurrent = currentUser?.id === user.id;

            return (
              <div
                key={user.id}
                className={`p-4 rounded-xl border transition-all ${
                  isCurrent
                    ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-xs ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl shrink-0">
                      {user.avatar || '👤'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {user.fullName}
                        </h4>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                            บัญชีปัจจุบัน
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {user.position}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          @{user.username}
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-600">
                          {user.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isCurrent ? (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold border border-emerald-300 dark:border-emerald-800">
                        ใช้งานอยู่
                      </span>
                    ) : (
                      <span 
                        className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 text-[10px] font-medium"
                        title="หากต้องการใช้งานบัญชีนี้ ให้กดออกจากระบบแล้วเข้าสู่ระบบใหม่"
                      >
                        ต้องออกจากระบบก่อน
                      </span>
                    )}
                    {isSuperAdmin && (
                      <button
                        onClick={() => handleDeleteUser(user.id, user.fullName)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors cursor-pointer"
                        title="ลบผู้ใช้"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 font-mono text-[11px]">
                      <Phone className="w-3.5 h-3.5 text-slate-400" /> {user.phone || '-'}
                    </span>
                    <span className="flex items-center gap-1 text-[11px]">
                      <Mail className="w-3.5 h-3.5 text-slate-400" /> {user.email || '-'}
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-600 font-medium">
                    สถานะ: ใช้งานได้ปกติ
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                เพิ่มผู้ใช้งานใหม่เข้าสู่ระบบ
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ชื่อ-นามสกุล
                </label>
                <input
                  type="text"
                  required
                  value={newUser.fullName}
                  onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850"
                  placeholder="เช่น นายสมชาย ใจดี"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ชื่อผู้ใช้งาน (Username)
                  </label>
                  <input
                    type="text"
                    required
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 font-mono"
                    placeholder="somchai_skb"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    บทบาท (Role)
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850"
                  >
                    <option value="executive">ผู้บริหาร (Executive)</option>
                    <option value="statistician">เจ้าพนักงานเวชสถิติ</option>
                    <option value="accountant">เจ้าหน้าที่การเงิน/ธุรการ</option>
                    <option value="superadmin">ผู้ดูแลระบบ (Super Admin)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ตำแหน่งทางราชการ
                </label>
                <input
                  type="text"
                  value={newUser.position}
                  onChange={(e) => setNewUser({ ...newUser, position: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850"
                  placeholder="เช่น เจ้าหน้าที่การเงินและบัญชีปฏิบัติงาน"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    เบอร์โทรศัพท์มือถือ
                  </label>
                  <input
                    type="text"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 font-mono"
                    placeholder="08X-XXX-XXXX"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    อีเมล
                  </label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 font-mono"
                    placeholder="user@skb-hospital.go.th"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                >
                  บันทึกผู้ใช้
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
