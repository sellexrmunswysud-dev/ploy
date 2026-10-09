import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  RefreshCw, 
  X, 
  ExternalLink,
  ShieldCheck,
  Server,
  Cloud,
  Layers
} from 'lucide-react';
import { isSupabaseConfigured, checkSupabaseConnection, getSupabaseConfig } from '../lib/supabase';
import { 
  SUPABASE_SQL_SCHEMA, 
  saveMedicalDebtItemsToSupabase, 
  saveUsersToSupabase 
} from '../services/supabaseService';
import { MedicalDebtItem, UserProfile } from '../types';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: MedicalDebtItem[];
  users: UserProfile[];
  onSyncComplete?: (msg: string) => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  items,
  users,
  onSyncComplete,
}) => {
  const [copied, setCopied] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [connStatus, setConnStatus] = useState<{
    tested: boolean;
    connected: boolean;
    message: string;
    latencyMs?: number;
  }>({
    tested: false,
    connected: false,
    message: '',
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const isConfigured = isSupabaseConfigured();
  const config = getSupabaseConfig();

  const handleTestConnection = async () => {
    setIsChecking(true);
    const result = await checkSupabaseConnection();
    setConnStatus({
      tested: true,
      connected: result.connected,
      message: result.message,
      latencyMs: result.latencyMs,
    });
    setIsChecking(false);
  };

  useEffect(() => {
    if (isOpen) {
      handleTestConnection();
    }
  }, [isOpen]);

  const handleCopySQL = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSyncAllToSupabase = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);

    try {
      // 1. Sync 52 debts
      const debtRes = await saveMedicalDebtItemsToSupabase(items);
      // 2. Sync RBAC users
      const userRes = await saveUsersToSupabase(users);

      if (debtRes.success || userRes.success) {
        const msg = `ซิงค์ข้อมูลลง Supabase สำเร็จ: 52 สิทธิการรักษา และ ${users.length} บัญชีผู้ใช้งาน`;
        setSyncFeedback(msg);
        if (onSyncComplete) onSyncComplete(msg);
      } else {
        setSyncFeedback(debtRes.message || userRes.message);
      }
    } catch (err: any) {
      setSyncFeedback(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                สถานะการเชื่อมต่อฐานข้อมูล Supabase
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ระบบจัดการฐานข้อมูลกลาง รพ.สังขละบุรี (Cloud Database Integration)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
          
          {/* Status Box */}
          <div className={`p-4 rounded-2xl border ${
            connStatus.connected
              ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : isConfigured
              ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-300'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {connStatus.connected ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider">
                    {connStatus.connected ? 'เชื่อมต่อ Supabase สำเร็จ (Online)' : 'สถานะการเชื่อมต่อ (Connection Status)'}
                  </div>
                  <div className="text-sm font-semibold mt-0.5">
                    {connStatus.message || (isConfigured ? 'กำลังตรวจสอบ...' : 'ใช้ฐานข้อมูล Local Storage สำรอง (รอเพิ่ม Environment Variables)')}
                  </div>
                  {connStatus.latencyMs !== undefined && (
                    <div className="text-[11px] opacity-80 mt-1">
                      ความเร็วในการตอบสนอง (Latency): {connStatus.latencyMs} ms
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleTestConnection}
                disabled={isChecking}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 text-xs font-medium text-slate-700 dark:text-slate-200 shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                <span>ทดสอบใหม่</span>
              </button>
            </div>
          </div>

          {/* Config Keys Info */}
          <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Server className="w-4 h-4 text-emerald-600" />
              <span>ค่าคอนฟิกูเรชัน (Environment Variables)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">SUPABASE_URL</span>
                <span className="truncate block font-semibold text-slate-800 dark:text-slate-200">{config.url}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">SUPABASE_ANON_KEY</span>
                <span className="truncate block font-semibold text-slate-800 dark:text-slate-200">
                  {config.hasKey ? '••••••••••••••••••••' : 'ไม่ได้ตั้งค่า'}
                </span>
              </div>
            </div>
          </div>

          {/* Sync Action */}
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Cloud className="w-4 h-4 text-emerald-600" />
                  ซิงค์ข้อมูลฟอร์มทั้งหมดลง Supabase ทันที
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  บันทึกทะเบียนคุม 52 สิทธิ์, รายชื่อผู้ใช้งาน 4 บัญชี, และประวัติการกระทบยอด HIS
                </p>
              </div>

              <button
                onClick={handleSyncAllToSupabase}
                disabled={isSyncing}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-md transition-all shrink-0 cursor-pointer disabled:opacity-50"
              >
                {isSyncing ? 'กำลังบันทึกข้อมูล...' : 'บันทึกลง Supabase ตอนนี้'}
              </button>
            </div>

            {syncFeedback && (
              <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 p-2 rounded-lg bg-emerald-100/50 dark:bg-emerald-950/50">
                {syncFeedback}
              </div>
            )}
          </div>

          {/* SQL Schema Script Helper */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  คำสั่งสร้างตาราง SQL Schema (สำหรับ Supabase SQL Editor)
                </h4>
                <p className="text-[11px] text-slate-400">
                  หากตารางยังไม่ถูกสร้างใน Supabase สามารถคลิกคัดลอกคำสั่งด้านล่างไปวางในแท็บ SQL Editor บน Supabase Dashboard
                </p>
              </div>

              <button
                onClick={handleCopySQL}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'คัดลอกสำเร็จ!' : 'คัดลอก SQL'}</span>
              </button>
            </div>

            <pre className="p-3 rounded-2xl bg-slate-900 text-slate-200 text-[11px] font-mono overflow-x-auto max-h-40 border border-slate-800">
              {SUPABASE_SQL_SCHEMA}
            </pre>
          </div>

        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-400">
            รพ.สังขละบุรี • SKB Management System
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
};
