export type CategoryType = 'government' | 'external';

export type FundGroup = 
  | 'emergency' // ฉุกเฉิน
  | 'uc' // บัตรทอง UC
  | 'social_security' // ประกันสังคม
  | 'civil_servant' // กรมบัญชีกลาง / เบิกจ่ายตรง
  | 'migrant' // คนต่างด้าวและแรงงานต่างด้าว
  | 'stateless' // บุคคลที่มีปัญหาสถานะและสิทธิ
  | 'traffic_act' // พรบ.รถ
  | 'local_govt' // อปท.
  | 'agency' // หน่วยงานรัฐ / อื่นๆ
  | 'self_pay'; // ชำระเงินเอง

export interface MedicalDebtItem {
  id: string;
  orderNumber: number; // 1 to 52
  code: string; // e.g. 1102050101.102
  name: string; // e.g. ลูกหนี้ค่าสิ่งส่งตรวจหน่วยงานภาครัฐ
  category: CategoryType; // government: 1102050101 (33 items) | external: 1102050102 (19 items)
  fundGroup: FundGroup;
  initialBalance: number; // ยอดลูกหนี้ยกมา
  currentPeriodAdded: number; // ยอดลูกหนี้ของเดือน (ยอดตั้งใหม่)
  receivedPayment: number; // ยอดรับชำระระหว่างเดือน
  writeOff: number; // ยอดตัดหนี้สูญ
  remainingBalance: number; // ยอดลูกหนี้ยกไป = ยอดตั้งต้น + ยอดตั้งใหม่ − ยอดรับชำระ − ยอดตัดหนี้สูญ
  remarks: string; // หมายเหตุ
  daysOverdue: number; // จำนวนวันที่ค้างชำระ (e.g. 45 days)
  lastUpdated: string; // วันที่อัปเดตล่าสุด YYYY-MM-DD
}

export type UserRole = 'executive' | 'statistician' | 'accountant' | 'superadmin';

export interface UserProfile {
  id: string;
  username: string;
  fullName: string;
  position: string;
  department?: string;
  role: UserRole;
  email: string;
  phone: string;
  avatar?: string;
  isActive: boolean;
  password?: string;
  createdAt?: string;
}

export interface MonthlyPeriod {
  monthName: string;
  yearBE: number; // 2569
  monthIndex: number; // 0-11
  recordDate: string; // YYYY-MM-DD
  isClosed: boolean;
  closedAt?: string;
  closedBy?: string;
}

export interface SignatoryInfo {
  reporterName: string;
  reporterPosition: string;
  reporterStatus: 'approved' | 'pending';
  reporterDate?: string;
  
  verifierName: string;
  verifierPosition: string;
  verifierStatus: 'approved' | 'pending';
  verifierDate?: string;
  
  approverName: string;
  approverPosition: string;
  approverStatus: 'approved' | 'pending';
  approverDate?: string;
}

export interface NotificationLog {
  id: string;
  timestamp: string;
  channel: 'SMS' | 'EMAIL' | 'BOTH';
  recipientName: string;
  recipientPosition: string;
  contactDetail: string; // Phone or Email
  subject: string;
  message: string;
  status: 'DELIVERED' | 'SENT' | 'FAILED';
  deliveryTime?: string;
  referenceMonth: string;
}

export interface HISComparisonItem {
  code: string;
  name: string;
  category: CategoryType;
  currentSystemBalance: number;
  hisImportedBalance: number;
  diff: number; // current - his
  hasDiscrepancy: boolean;
  status: 'matched' | 'mismatch_surplus' | 'mismatch_deficit';
}
