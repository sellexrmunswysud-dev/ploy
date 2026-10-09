import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve environment variables safely
const rawUrl = 
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.SUPABASE_URL) ||
  '';

const rawKey = 
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env?.SUPABASE_ANON_KEY) ||
  '';

export const supabaseUrl = typeof rawUrl === 'string' ? rawUrl.trim() : '';
export const supabaseAnonKey = typeof rawKey === 'string' ? rawKey.trim() : '';

/**
 * Validates that the provided URL is a valid HTTP/HTTPS URL
 * and not a dummy placeholder string
 */
export const isValidHttpUrl = (urlStr: string): boolean => {
  if (!urlStr || typeof urlStr !== 'string') return false;
  const trimmed = urlStr.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) return false;
  
  try {
    const parsed = new URL(trimmed);
    return (
      (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
      !trimmed.includes('your-project-id') &&
      !trimmed.includes('placeholder') &&
      !trimmed.includes('MY_SUPABASE') &&
      parsed.hostname.length > 0
    );
  } catch {
    return false;
  }
};

/**
 * Validates if Supabase is properly configured with valid URL & Key
 */
export const isSupabaseConfigured = (): boolean => {
  return isValidHttpUrl(supabaseUrl) && Boolean(supabaseAnonKey && supabaseAnonKey.length > 10);
};

/**
 * Safe initializer for Supabase client
 * Catches any validation errors so the application never crashes
 */
const initSupabaseClient = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  } catch (err) {
    console.warn('[SKB Supabase] Invalid Supabase configuration, running in resilient offline/cache mode:', err);
    return null;
  }
};

// Singleton instance (null when not configured or invalid URL)
export const supabase: SupabaseClient | null = initSupabaseClient();

export const getSupabaseConfig = () => {
  const ready = isSupabaseConfigured();
  return {
    url: ready && supabaseUrl ? `${supabaseUrl.slice(0, 24)}...` : (supabaseUrl ? 'URL ไม่ถูกต้อง (ต้องขึ้นต้นด้วย https://)' : 'ยังไม่ได้ตั้งค่า'),
    hasKey: Boolean(supabaseAnonKey && supabaseAnonKey.length > 10),
    isReady: ready,
  };
};

export const checkSupabaseConnection = async (): Promise<{
  connected: boolean;
  message: string;
  latencyMs?: number;
}> => {
  if (!supabase || !isSupabaseConfigured()) {
    return {
      connected: false,
      message: !supabaseUrl 
        ? 'ยังไม่ได้ระบุค่า SUPABASE_URL หรือ SUPABASE_ANON_KEY ใน Environment Variables'
        : 'SUPABASE_URL ไม่ถูกต้อง (ต้องเป็น URL ที่ขึ้นต้นด้วย https:// เช่น https://xyz.supabase.co)',
    };
  }

  const startTime = Date.now();
  try {
    // Attempt a lightweight ping query
    const { error } = await supabase.from('skb_medical_debts').select('id', { count: 'exact', head: true });
    const latencyMs = Date.now() - startTime;

    if (error) {
      // If table doesn't exist yet, connection is still valid!
      if (error.code === '42P01') {
        return {
          connected: true,
          message: 'เชื่อมต่อ Supabase ได้แล้ว (รอรันคำสั่งสร้างตาราง SQL Schema)',
          latencyMs,
        };
      }
      return {
        connected: false,
        message: `ข้อผิดพลาดจาก Supabase: ${error.message} (${error.code})`,
        latencyMs,
      };
    }

    return {
      connected: true,
      message: 'เชื่อมต่อฐานข้อมูล Supabase สำเร็จ พร้อมใช้งาน',
      latencyMs,
    };
  } catch (err: any) {
    return {
      connected: false,
      message: err?.message || 'ไม่สามารถเชื่อมต่อกับ Supabase ได้',
    };
  }
};
