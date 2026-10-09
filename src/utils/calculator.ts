import { MedicalDebtItem } from '../types';

export interface CategorySummary {
  count: number;
  initial: number;
  added: number;
  received: number;
  writeOff: number;
  remaining: number;
  recoveryRate: number;
}

export interface SummaryStats {
  totalInitial: number;
  totalAdded: number;
  totalReceived: number;
  totalWriteOff: number;
  totalRemaining: number;
  overallRecoveryRate: number;
  
  govSummary: CategorySummary;
  extSummary: CategorySummary;
  
  overdue30Count: number;
  overdue30Amount: number;
  overdueItems: MedicalDebtItem[];
  
  fundBreakdown: {
    name: string;
    key: string;
    amount: number;
    percentage: number;
    color: string;
  }[];
}

export const formatCurrency = (val: number | undefined | null): string => {
  if (val === undefined || val === null || isNaN(val)) return '0.00';
  return val.toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const calculateRowRemaining = (
  initial: number,
  added: number,
  received: number,
  writeOff: number
): number => {
  // ยอดตั้งต้น + ยอดตั้งใหม่ − ยอดรับชำระ − ยอดตัดหนี้สูญ = ยอดลูกหนี้คงเหลือยกไป
  return Number(((initial || 0) + (added || 0) - (received || 0) - (writeOff || 0)).toFixed(2));
};

export const calculateSummaryStats = (items: MedicalDebtItem[]): SummaryStats => {
  const govItems = items.filter((item) => item.category === 'government');
  const extItems = items.filter((item) => item.category === 'external');

  const calcCategory = (list: MedicalDebtItem[]): CategorySummary => {
    const initial = list.reduce((acc, cur) => acc + (cur.initialBalance || 0), 0);
    const added = list.reduce((acc, cur) => acc + (cur.currentPeriodAdded || 0), 0);
    const received = list.reduce((acc, cur) => acc + (cur.receivedPayment || 0), 0);
    const writeOff = list.reduce((acc, cur) => acc + (cur.writeOff || 0), 0);
    const remaining = list.reduce((acc, cur) => acc + (cur.remainingBalance || 0), 0);
    const denominator = initial + added;
    const recoveryRate = denominator > 0 ? (received / denominator) * 100 : 0;

    return {
      count: list.length,
      initial: Number(initial.toFixed(2)),
      added: Number(added.toFixed(2)),
      received: Number(received.toFixed(2)),
      writeOff: Number(writeOff.toFixed(2)),
      remaining: Number(remaining.toFixed(2)),
      recoveryRate: Number(recoveryRate.toFixed(2)),
    };
  };

  const govSummary = calcCategory(govItems);
  const extSummary = calcCategory(extItems);

  const totalInitial = Number((govSummary.initial + extSummary.initial).toFixed(2));
  const totalAdded = Number((govSummary.added + extSummary.added).toFixed(2));
  const totalReceived = Number((govSummary.received + extSummary.received).toFixed(2));
  const totalWriteOff = Number((govSummary.writeOff + extSummary.writeOff).toFixed(2));
  const totalRemaining = Number((govSummary.remaining + extSummary.remaining).toFixed(2));

  const totalDenominator = totalInitial + totalAdded;
  const overallRecoveryRate = totalDenominator > 0 ? Number(((totalReceived / totalDenominator) * 100).toFixed(2)) : 0;

  // Filter overdue > 30 days with pending balance
  const overdueItems = items.filter(
    (item) => item.remainingBalance > 0 && item.daysOverdue > 30
  );
  const overdue30Count = overdueItems.length;
  const overdue30Amount = overdueItems.reduce((acc, cur) => acc + cur.remainingBalance, 0);

  // Group by funds for visualization
  const fundMap: Record<string, { name: string; amount: number; color: string }> = {
    uc: { name: 'หลักประกันสุขภาพถ้วนหน้า (UC)', amount: 0, color: '#0284c7' }, // Sky
    social_security: { name: 'ประกันสังคม (SSS)', amount: 0, color: '#f59e0b' }, // Amber
    civil_servant: { name: 'ข้าราชการ/เบิกจ่ายตรง (CSMBS)', amount: 0, color: '#10b981' }, // Emerald
    migrant: { name: 'คนต่างด้าว/แรงงานต่างด้าว', amount: 0, color: '#8b5cf6' }, // Purple
    stateless: { name: 'บุคคลมีปัญหาสถานะ/สิทธิ', amount: 0, color: '#ec4899' }, // Pink
    traffic_act: { name: 'พรบ.ผู้ประสบภัยจากรถ', amount: 0, color: '#f97316' }, // Orange
    local_govt: { name: 'องค์กรปกครองส่วนท้องถิ่น (อปท.)', amount: 0, color: '#06b6d4' }, // Cyan
    self_pay: { name: 'ชำระเงินเอง/บุคคลภายนอก', amount: 0, color: '#ef4444' }, // Red
    emergency: { name: 'ระบบการแพทย์ฉุกเฉิน 1669', amount: 0, color: '#eab308' }, // Yellow
    agency: { name: 'หน่วยงานรัฐอื่น/ตรวจสุขภาพ', amount: 0, color: '#64748b' }, // Slate
  };

  items.forEach((item) => {
    if (fundMap[item.fundGroup]) {
      fundMap[item.fundGroup].amount += item.remainingBalance;
    }
  });

  const fundBreakdown = Object.entries(fundMap)
    .filter(([_, data]) => data.amount > 0)
    .map(([key, data]) => ({
      key,
      name: data.name,
      amount: Number(data.amount.toFixed(2)),
      percentage: totalRemaining > 0 ? Number(((data.amount / totalRemaining) * 100).toFixed(1)) : 0,
      color: data.color,
    }))
    .sort((a, b) => b.amount - a.amount);

  return {
    totalInitial,
    totalAdded,
    totalReceived,
    totalWriteOff,
    totalRemaining,
    overallRecoveryRate,
    govSummary,
    extSummary,
    overdue30Count,
    overdue30Amount: Number(overdue30Amount.toFixed(2)),
    overdueItems,
    fundBreakdown,
  };
};
