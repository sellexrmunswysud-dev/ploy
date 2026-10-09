import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { MedicalDebtItem, UserProfile } from '../types';

export interface SaveResult {
  success: boolean;
  message: string;
  count?: number;
  data?: any;
  error?: any;
}

/**
 * SQL Schema script to create required tables in Supabase SQL Editor
 */
export const SUPABASE_SQL_SCHEMA = `-- สร้างตารางสำหรับระบบบริหารจัดการทะเบียนคุมลูกหนี้ทางการแพทย์ รพ.สังขละบุรี (SKB System)

-- 1. ตารางทะเบียนคุม 52 สิทธิ์การรักษาพยาบาล
CREATE TABLE IF NOT EXISTS public.skb_medical_debts (
    id TEXT PRIMARY KEY,
    order_number INTEGER NOT NULL,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('government', 'external')),
    fund_group TEXT NOT NULL,
    initial_balance NUMERIC(15, 2) DEFAULT 0.00,
    current_period_added NUMERIC(15, 2) DEFAULT 0.00,
    received_payment NUMERIC(15, 2) DEFAULT 0.00,
    write_off NUMERIC(15, 2) DEFAULT 0.00,
    remaining_balance NUMERIC(15, 2) DEFAULT 0.00,
    remarks TEXT DEFAULT '',
    days_overdue INTEGER DEFAULT 0,
    last_updated DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ตารางจัดการผู้ใช้งานและสิทธิ์ (RBAC)
CREATE TABLE IF NOT EXISTS public.skb_users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    position TEXT DEFAULT '',
    department TEXT DEFAULT '',
    role TEXT NOT NULL CHECK (role IN ('executive', 'statistician', 'accountant', 'superadmin')),
    email TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    avatar TEXT DEFAULT '👤',
    password TEXT DEFAULT 'password123',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ตารางประวัตินำเข้าและเปรียบเทียบข้อมูลลูกหนี้ HIS
CREATE TABLE IF NOT EXISTS public.skb_his_reconciliation (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    compared_by TEXT NOT NULL,
    reference_month TEXT NOT NULL,
    total_rights INTEGER DEFAULT 52,
    matched_count INTEGER DEFAULT 0,
    mismatch_count INTEGER DEFAULT 0,
    net_difference NUMERIC(15, 2) DEFAULT 0.00,
    items_json JSONB DEFAULT '[]'::jsonb,
    auto_synced BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- เปิด Row Level Security (RLS) และอนุญาตการเข้าถึง
ALTER TABLE public.skb_medical_debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skb_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skb_his_reconciliation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select skb_medical_debts" ON public.skb_medical_debts FOR ALL USING (true);
CREATE POLICY "Allow public select skb_users" ON public.skb_users FOR ALL USING (true);
CREATE POLICY "Allow public select skb_his_reconciliation" ON public.skb_his_reconciliation FOR ALL USING (true);
`;

// ==========================================
// 1. ฟังก์ชันบันทึกข้อมูล "ทะเบียนคุม 52 สิทธิ์"
// ==========================================

export const saveMedicalDebtItemsToSupabase = async (
  items: MedicalDebtItem[]
): Promise<SaveResult> => {
  if (!supabase || !isSupabaseConfigured()) {
    return {
      success: false,
      message: 'ไม่ได้เชื่อมต่อ Supabase (ใช้การบันทึกใน LocalStorage แทน)',
    };
  }

  try {
    const payload = items.map((item) => ({
      id: item.id,
      order_number: item.orderNumber,
      code: item.code,
      name: item.name,
      category: item.category,
      fund_group: item.fundGroup,
      initial_balance: item.initialBalance,
      current_period_added: item.currentPeriodAdded,
      received_payment: item.receivedPayment,
      write_off: item.writeOff,
      remaining_balance: item.remainingBalance,
      remarks: item.remarks || '',
      days_overdue: item.daysOverdue || 0,
      last_updated: item.lastUpdated || new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString(),
    }));

    // Upsert into Supabase
    const { data, error } = await supabase
      .from('skb_medical_debts')
      .upsert(payload, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('Supabase save error:', error);
      return {
        success: false,
        message: `บันทึก 52 สิทธิ์ไม่สำเร็จ: ${error.message}`,
        error,
      };
    }

    return {
      success: true,
      message: `บันทึกข้อมูลทะเบียนคุม 52 สิทธิ์ลง Supabase สำเร็จ (${items.length} รายการ)`,
      count: items.length,
      data,
    };
  } catch (err: any) {
    console.error('Unexpected error saving debts:', err);
    return {
      success: false,
      message: `เกิดข้อผิดพลาด: ${err?.message || 'Unknown error'}`,
      error: err,
    };
  }
};

export const saveSingleMedicalDebtItemToSupabase = async (
  item: MedicalDebtItem
): Promise<SaveResult> => {
  if (!supabase || !isSupabaseConfigured()) {
    return { success: false, message: 'Supabase ยังไม่ได้เชื่อมต่อ' };
  }

  try {
    const payload = {
      id: item.id,
      order_number: item.orderNumber,
      code: item.code,
      name: item.name,
      category: item.category,
      fund_group: item.fundGroup,
      initial_balance: item.initialBalance,
      current_period_added: item.currentPeriodAdded,
      received_payment: item.receivedPayment,
      write_off: item.writeOff,
      remaining_balance: item.remainingBalance,
      remarks: item.remarks || '',
      days_overdue: item.daysOverdue || 0,
      last_updated: item.lastUpdated || new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('skb_medical_debts')
      .upsert(payload, { onConflict: 'id' })
      .select();

    if (error) throw error;

    return {
      success: true,
      message: `บันทึกสิทธิ ${item.code} ลง Supabase สำเร็จ`,
      data,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `บันทึกล้มเหลว: ${err.message}`,
      error: err,
    };
  }
};

export const fetchMedicalDebtItemsFromSupabase = async (): Promise<{
  success: boolean;
  items?: MedicalDebtItem[];
  error?: any;
}> => {
  if (!supabase || !isSupabaseConfigured()) {
    return { success: false };
  }

  try {
    const { data, error } = await supabase
      .from('skb_medical_debts')
      .select('*')
      .order('order_number', { ascending: true });

    if (error) throw error;
    if (!data || data.length === 0) return { success: false };

    const mapped: MedicalDebtItem[] = data.map((d: any) => ({
      id: d.id,
      orderNumber: d.order_number,
      code: d.code,
      name: d.name,
      category: d.category,
      fundGroup: d.fund_group,
      initialBalance: Number(d.initial_balance || 0),
      currentPeriodAdded: Number(d.current_period_added || 0),
      receivedPayment: Number(d.received_payment || 0),
      writeOff: Number(d.write_off || 0),
      remainingBalance: Number(d.remaining_balance || 0),
      remarks: d.remarks || '',
      daysOverdue: Number(d.days_overdue || 0),
      lastUpdated: d.last_updated || '',
    }));

    return { success: true, items: mapped };
  } catch (err: any) {
    return { success: false, error: err };
  }
};

// ==========================================
// 2. ฟังก์ชันบันทึกข้อมูล "จัดการสิทธิ์ RBAC"
// ==========================================

export const saveUsersToSupabase = async (
  users: UserProfile[]
): Promise<SaveResult> => {
  if (!supabase || !isSupabaseConfigured()) {
    return {
      success: false,
      message: 'ไม่ได้เชื่อมต่อ Supabase (บันทึกในระบบเดิม)',
    };
  }

  try {
    const payload = users.map((u) => ({
      id: u.id,
      username: u.username,
      full_name: u.fullName,
      position: u.position,
      department: u.department || '',
      role: u.role,
      email: u.email || '',
      phone: u.phone || '',
      avatar: u.avatar || '👤',
      password: u.password || 'password123',
      is_active: u.isActive ?? true,
      updated_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('skb_users')
      .upsert(payload, { onConflict: 'id' })
      .select();

    if (error) throw error;

    return {
      success: true,
      message: `บันทึกข้อมูลผู้ใช้งานและสิทธิ์ RBAC ลง Supabase สำเร็จ (${users.length} คน)`,
      count: users.length,
      data,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `บันทึกผู้ใช้ลง Supabase ไม่สำเร็จ: ${err.message}`,
      error: err,
    };
  }
};

export const saveSingleUserToSupabase = async (
  user: UserProfile
): Promise<SaveResult> => {
  if (!supabase || !isSupabaseConfigured()) {
    return { success: false, message: 'Supabase ยังไม่ได้เชื่อมต่อ' };
  }

  try {
    const payload = {
      id: user.id,
      username: user.username,
      full_name: user.fullName,
      position: user.position || '',
      department: user.department || '',
      role: user.role,
      email: user.email || '',
      phone: user.phone || '',
      avatar: user.avatar || '👤',
      password: user.password || 'password123',
      is_active: user.isActive ?? true,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('skb_users')
      .upsert(payload, { onConflict: 'id' })
      .select();

    if (error) throw error;

    return {
      success: true,
      message: `บันทึกข้อมูลผู้ใช้ ${user.fullName} ลง Supabase สำเร็จ`,
      data,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `บันทึกผู้ใช้ล้มเหลว: ${err.message}`,
      error: err,
    };
  }
};

export const deleteUserFromSupabase = async (
  userId: string
): Promise<SaveResult> => {
  if (!supabase || !isSupabaseConfigured()) {
    return { success: false, message: 'Supabase ยังไม่ได้เชื่อมต่อ' };
  }

  try {
    const { error } = await supabase
      .from('skb_users')
      .delete()
      .eq('id', userId);

    if (error) throw error;

    return {
      success: true,
      message: 'ลบผู้ใช้จากฐานข้อมูล Supabase สำเร็จ',
    };
  } catch (err: any) {
    return {
      success: false,
      message: `ลบผู้ใช้ล้มเหลว: ${err.message}`,
      error: err,
    };
  }
};

export const fetchUsersFromSupabase = async (): Promise<{
  success: boolean;
  users?: UserProfile[];
  error?: any;
}> => {
  if (!supabase || !isSupabaseConfigured()) {
    return { success: false };
  }

  try {
    const { data, error } = await supabase
      .from('skb_users')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    if (!data || data.length === 0) return { success: false };

    const mapped: UserProfile[] = data.map((d: any) => ({
      id: d.id,
      username: d.username,
      fullName: d.full_name,
      position: d.position || '',
      department: d.department || '',
      role: d.role,
      email: d.email || '',
      phone: d.phone || '',
      avatar: d.avatar || '👤',
      password: d.password || 'password123',
      isActive: Boolean(d.is_active),
    }));

    return { success: true, users: mapped };
  } catch (err: any) {
    return { success: false, error: err };
  }
};

// ==========================================
// 3. ฟังก์ชันบันทึกข้อมูล "นำเข้าและเปรียบเทียบ HIS"
// ==========================================

export interface HisReconciliationPayload {
  comparedBy: string;
  referenceMonth: string;
  totalRights: number;
  matchedCount: number;
  mismatchCount: number;
  netDifference: number;
  itemsDiff: any[];
  autoSynced?: boolean;
}

export const saveHisReconciliationLogToSupabase = async (
  payload: HisReconciliationPayload
): Promise<SaveResult> => {
  if (!supabase || !isSupabaseConfigured()) {
    return {
      success: false,
      message: 'ไม่ได้เชื่อมต่อ Supabase (บันทึกในความจำเบราว์เซอร์)',
    };
  }

  try {
    const record = {
      id: `his-reconcile-${Date.now()}`,
      timestamp: new Date().toISOString(),
      compared_by: payload.comparedBy,
      reference_month: payload.referenceMonth,
      total_rights: payload.totalRights,
      matched_count: payload.matchedCount,
      mismatch_count: payload.mismatchCount,
      net_difference: payload.netDifference,
      items_json: payload.itemsDiff,
      auto_synced: payload.autoSynced || false,
    };

    const { data, error } = await supabase
      .from('skb_his_reconciliation')
      .insert([record])
      .select();

    if (error) throw error;

    return {
      success: true,
      message: 'บันทึกประวัติการกระทบยอด HIS ลง Supabase เรียบร้อยแล้ว',
      data,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `บันทึกประวัติ HIS ล้มเหลว: ${err.message}`,
      error: err,
    };
  }
};

export const fetchHisReconciliationLogsFromSupabase = async (): Promise<{
  success: boolean;
  logs?: any[];
  error?: any;
}> => {
  if (!supabase || !isSupabaseConfigured()) {
    return { success: false };
  }

  try {
    const { data, error } = await supabase
      .from('skb_his_reconciliation')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(20);

    if (error) throw error;

    return { success: true, logs: data || [] };
  } catch (err: any) {
    return { success: false, error: err };
  }
};
