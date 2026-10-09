import React from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  FileCheck, 
  AlertOctagon, 
  Printer, 
  ArrowRight, 
  Building2, 
  Users, 
  Calendar,
  Send,
  ShieldCheck,
  Percent
} from 'lucide-react';
import { MedicalDebtItem, UserProfile } from '../types';
import { calculateSummaryStats, formatCurrency } from '../utils/calculator';

interface DashboardViewProps {
  items: MedicalDebtItem[];
  currentUser: UserProfile;
  monthText: string;
  yearBE: number;
  onNavigateToLedger: (filterType?: 'all' | 'gov' | 'ext' | 'overdue') => void;
  onNavigateToReport: () => void;
  onNavigateToNotification: () => void;
  onNavigateToReconcile: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  items,
  currentUser,
  monthText,
  yearBE,
  onNavigateToLedger,
  onNavigateToReport,
  onNavigateToNotification,
  onNavigateToReconcile,
}) => {
  const stats = calculateSummaryStats(items);

  // Highest balance items
  const topPendingItems = [...items]
    .sort((a, b) => b.remainingBalance - a.remainingBalance)
    .slice(0, 5);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Welcome & Hospital Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-linear-to-r from-emerald-950 via-teal-950 to-slate-900 border border-emerald-900/40 text-white rounded-3xl p-6 shadow-md">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 uppercase tracking-wide">
              สถานะการเงินเรียลไทม์ (Real-time Status)
            </span>
            <span className="text-xs text-slate-300 flex items-center gap-1 font-medium">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" /> ประจำเดือน {monthText} พ.ศ. {yearBE}
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white drop-shadow-xs">
            ทะเบียนคุมลูกหนี้ทางการแพทย์ รพ.สังขละบุรี
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl font-normal leading-relaxed">
            สรุปการเรียกเก็บลูกหนี้ 52 สิทธิการรักษาพยาบาล (33 สิทธิภาครัฐ + 19 สิทธิบุคคลภายนอก) งานประกันสุขภาพและกลุ่มงานบริหารการเงิน
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={onNavigateToReport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-emerald-700" />
            <span>พิมพ์รายงานเสนอผู้บริหาร</span>
          </button>
          <button
            onClick={onNavigateToNotification}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>แจ้งเตือน SMS/Email</span>
          </button>
        </div>
      </div>

      {/* Urgent Flashing Alarm Banner for Overdue Debts (> 30 days) */}
      {stats.overdue30Count > 0 && (
        <div className="relative overflow-hidden bg-rose-50 dark:bg-rose-950/30 border-2 border-rose-300 dark:border-rose-800/80 rounded-3xl p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              {/* Flashing Pulse Alarm Icon */}
              <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-rose-500 text-white shadow-md animate-urgent shrink-0">
                <AlertOctagon className="w-7 h-7" />
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-700"></span>
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-base sm:text-lg font-bold text-rose-950 dark:text-rose-100">
                    แจ้งเตือนลูกหนี้ค้างชำระเกินกำหนดเวลา &gt; 30 วัน (1 เดือน)
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200">
                    ด่วนที่สุด
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-rose-700 dark:text-rose-300 mt-0.5">
                  ตรวจพบลูกหนี้ค้างชำระเกิน 1 เดือน จำนวน <strong className="underline font-bold text-rose-900 dark:text-rose-100">{stats.overdue30Count} รายการสิทธิ</strong> รวมเป็นเงินทั้งสิ้น <strong className="underline font-bold text-rose-900 dark:text-rose-100">{formatCurrency(stats.overdue30Amount)} บาท</strong> ที่ต้องเร่งรัดติดตามเรียกเก็บ
                </p>
              </div>
            </div>

            {/* Quick Filter Button */}
            <button
              onClick={() => onNavigateToLedger('overdue')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-semibold text-xs shadow-md transition-all shrink-0 cursor-pointer"
            >
              <span>กรองดูรายการเร่งด่วนทันที ({stats.overdue30Count})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 5 Main Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Card 1: ยอดตั้งต้น (ยกมา) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs relative overflow-hidden transition-all hover:border-slate-300 dark:hover:border-slate-700">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">1. ยอดตั้งต้น (ยกมา)</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            ฿{formatCurrency(stats.totalInitial)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>ยกมาจาก 31 ก.ค.</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">52 สิทธิ</span>
          </div>
        </div>

        {/* Card 2: ยอดตั้งใหม่ (ของเดือน) */}
        <div className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/50 rounded-3xl p-5 shadow-xs relative overflow-hidden transition-all hover:border-blue-300 dark:hover:border-blue-800">
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">2. ยอดตั้งใหม่ (ของเดือน)</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-xl sm:text-2xl font-bold text-blue-950 dark:text-blue-200 tracking-tight">
            ฿{formatCurrency(stats.totalAdded)}
          </div>
          <div className="mt-2 text-[11px] text-blue-700 dark:text-blue-300 flex items-center justify-between">
            <span>เรียกเก็บสิงหาคม</span>
            <span className="font-semibold">+10.53 ลบ.</span>
          </div>
        </div>

        {/* Card 3: ยอดรับชำระ (พร้อม % จัดเก็บ) */}
        <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/50 rounded-3xl p-5 shadow-xs relative overflow-hidden transition-all hover:border-emerald-300 dark:hover:border-emerald-800">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">3. ยอดรับชำระระหว่างเดือน</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-300 tracking-tight">
            ฿{formatCurrency(stats.totalReceived)}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
              <Percent className="w-3 h-3" />
              <span>จัดเก็บได้ {stats.overallRecoveryRate}%</span>
            </div>
            <span className="text-[10px] text-slate-400">ของหนี้รวม</span>
          </div>
        </div>

        {/* Card 4: ยอดตัดหนี้สูญ */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs relative overflow-hidden transition-all hover:border-slate-300 dark:hover:border-slate-700">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">4. ยอดตัดหนี้สูญ</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-xl sm:text-2xl font-bold text-slate-700 dark:text-slate-200 tracking-tight">
            ฿{formatCurrency(stats.totalWriteOff)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>ตัดจำหน่ายตามระเบียบ</span>
            <span className="font-medium text-emerald-600">0.00 บาท</span>
          </div>
        </div>

        {/* Card 5: ยอดคงเหลือยกไป */}
        <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500/40 dark:border-emerald-500/50 rounded-3xl p-5 shadow-xs relative overflow-hidden bg-linear-to-b from-white to-emerald-50/20 dark:from-slate-900 dark:to-emerald-950/20">
          <div className="flex items-center justify-between text-slate-900 dark:text-slate-100 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">5. ลูกหนี้คงเหลือยกไป</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              SKB
            </div>
          </div>
          <div className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            ฿{formatCurrency(stats.totalRemaining)}
          </div>
          <div className="mt-2 text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between">
            <span>ยอด ณ 31 ส.ค. 69</span>
            <span className="font-bold text-emerald-700 dark:text-emerald-400">สูตรคำนวณอัตโนมัติ</span>
          </div>
        </div>

      </div>

      {/* Comparison Sections: Government vs External & Fund Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Government vs External Comparison (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                เปรียบเทียบสัดส่วนลูกหนี้ภาครัฐ vs บุคคลภายนอก
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                หมวด 1: หน่วยงานภาครัฐ (33 รายการ) vs หมวด 2: บุคคลภายนอก (19 รายการ)
              </p>
            </div>
            <button
              onClick={() => onNavigateToLedger('all')}
              className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1"
            >
              ดูรายละเอียดในทะเบียนคุม <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Visual Bar Comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Gov Box */}
            <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                  <span className="text-xs font-bold text-blue-900 dark:text-blue-200">
                    ลูกหนี้ภาครัฐ (รหัส 1102050101)
                  </span>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-sm bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                  33 สิทธิ
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>ยอดตั้งต้นยกมา:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">฿{formatCurrency(stats.govSummary.initial)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>ยอดตั้งใหม่เดือนนี้:</span>
                  <span className="font-medium text-blue-700 dark:text-blue-300">฿{formatCurrency(stats.govSummary.added)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>ยอดรับชำระแล้ว:</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">฿{formatCurrency(stats.govSummary.received)}</span>
                </div>
                <div className="border-t border-blue-200 dark:border-blue-800 pt-2 flex justify-between font-bold text-sm text-blue-950 dark:text-blue-100">
                  <span>ยอดคงเหลือยกไป:</span>
                  <span className="text-blue-700 dark:text-blue-300">฿{formatCurrency(stats.govSummary.remaining)}</span>
                </div>
              </div>

              {/* Progress representation */}
              <div className="pt-1">
                <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                  <span>อัตราการจัดเก็บหนี้</span>
                  <span className="font-bold text-blue-700 dark:text-blue-300">{stats.govSummary.recoveryRate}%</span>
                </div>
                <div className="w-full bg-blue-200 dark:bg-blue-900/60 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(stats.govSummary.recoveryRate, 100)}%` }}
                  ></div>
                </div>
              </div>

              <button
                onClick={() => onNavigateToLedger('gov')}
                className="w-full py-1.5 text-center text-xs font-semibold text-blue-700 hover:text-blue-800 dark:text-blue-300 hover:underline"
              >
                ดู 33 สิทธิภาครัฐ →
              </button>
            </div>

            {/* External Box */}
            <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-600"></div>
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    บุคคลภายนอก (รหัส 1102050102)
                  </span>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-sm bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                  19 สิทธิ
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>ยอดตั้งต้นยกมา:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">฿{formatCurrency(stats.extSummary.initial)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>ยอดตั้งใหม่เดือนนี้:</span>
                  <span className="font-medium text-amber-700 dark:text-amber-300">฿{formatCurrency(stats.extSummary.added)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>ยอดรับชำระแล้ว:</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">฿{formatCurrency(stats.extSummary.received)}</span>
                </div>
                <div className="border-t border-amber-200 dark:border-amber-800 pt-2 flex justify-between font-bold text-sm text-amber-950 dark:text-amber-100">
                  <span>ยอดคงเหลือยกไป:</span>
                  <span className="text-amber-700 dark:text-amber-300">฿{formatCurrency(stats.extSummary.remaining)}</span>
                </div>
              </div>

              {/* Progress representation */}
              <div className="pt-1">
                <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                  <span>อัตราการจัดเก็บหนี้</span>
                  <span className="font-bold text-amber-700 dark:text-amber-300">{stats.extSummary.recoveryRate}%</span>
                </div>
                <div className="w-full bg-amber-200 dark:bg-amber-900/60 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-amber-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(stats.extSummary.recoveryRate, 100)}%` }}
                  ></div>
                </div>
              </div>

              <button
                onClick={() => onNavigateToLedger('ext')}
                className="w-full py-1.5 text-center text-xs font-semibold text-amber-700 hover:text-amber-800 dark:text-amber-300 hover:underline"
              >
                ดู 19 สิทธิบุคคลภายนอก →
              </button>
            </div>

          </div>

          {/* Quick Proportion Bar */}
          <div>
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
              <span>สัดส่วนยอดลูกหนี้คงเหลือยกไป</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                ภาครัฐ {((stats.govSummary.remaining / stats.totalRemaining) * 100).toFixed(1)}% | ภายนอก {((stats.extSummary.remaining / stats.totalRemaining) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="h-3.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
              <div 
                style={{ width: `${(stats.govSummary.remaining / stats.totalRemaining) * 100}%` }}
                className="bg-blue-600 h-full"
                title="ลูกหนี้ภาครัฐ"
              ></div>
              <div 
                style={{ width: `${(stats.extSummary.remaining / stats.totalRemaining) * 100}%` }}
                className="bg-amber-500 h-full"
                title="ลูกหนี้บุคคลภายนอก"
              ></div>
            </div>
          </div>
        </div>

        {/* Right Column: Fund Distribution Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              สัดส่วนแยกตามกองทุนสิทธิ
            </h2>
            <span className="text-xs text-slate-400 font-medium">ยอดคงเหลือ</span>
          </div>

          <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
            {stats.fundBreakdown.map((fund) => (
              <div key={fund.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-800 dark:text-slate-200 truncate pr-2 max-w-[210px]">
                    {fund.name}
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 shrink-0">
                    ฿{formatCurrency(fund.amount)} ({fund.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${fund.percentage}%`,
                      backgroundColor: fund.color,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>รวมยอดคงเหลือ 52 สิทธิ:</span>
            <span className="font-bold text-slate-900 dark:text-white">
              ฿{formatCurrency(stats.totalRemaining)} บาท
            </span>
          </div>
        </div>

      </div>

      {/* Top Pending Rights Table & Operational Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Top 5 High Balance Rights (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                5 รายการสิทธิที่มียอดลูกหนี้คงเหลือสูงสุด
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                รายการที่ต้องเร่งรัดติดตามการชดเชยค่ารักษาพยาบาล
              </p>
            </div>
            <button
              onClick={() => onNavigateToLedger('all')}
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              ดูทั้งหมด 52 สิทธิ →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-medium">
                  <th className="py-2.5 px-3">รหัส</th>
                  <th className="py-2.5 px-3">สิทธิการรักษาพยาบาล</th>
                  <th className="py-2.5 px-3">หมวด</th>
                  <th className="py-2.5 px-3 text-right">ยอดคงเหลือยกไป</th>
                  <th className="py-2.5 px-3 text-center">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {topPendingItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono text-slate-500 dark:text-slate-400">
                      {item.code}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                      {item.name}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-xs text-[10px] font-semibold ${
                        item.category === 'government'
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {item.category === 'government' ? 'ภาครัฐ' : 'บุคคลภายนอก'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                      ฿{formatCurrency(item.remainingBalance)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {item.daysOverdue > 30 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                          เกิน {item.daysOverdue} วัน
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          ปกติ
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Fast Actions (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            การดำเนินงานประจำเดือน
          </h3>

          <div className="space-y-2.5">
            <button
              onClick={() => onNavigateToLedger('all')}
              className="w-full text-left p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-all flex items-center justify-between group cursor-pointer"
            >
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                  1. บันทึกและปรับปรุงทะเบียนคุม 52 สิทธิ์
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  ตั้งหนี้ใหม่, รับชำระ, ตัดหนี้สูญ คำนวณอัตโนมัติ
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
            </button>

            <button
              onClick={onNavigateToReconcile}
              className="w-full text-left p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-all flex items-center justify-between group cursor-pointer"
            >
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                  2. เปรียบเทียบข้อมูล HIS อัตโนมัติ
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  กระทบยอดสถิติผู้ป่วยและสิทธิการรักษา
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
            </button>

            <button
              onClick={onNavigateToReport}
              className="w-full text-left p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-all flex items-center justify-between group cursor-pointer"
            >
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                  3. พิมพ์รายงานเสนอผู้บริหาร
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  แบบฟอร์มทางการพร้อมตรา รพ. และ 3 ช่องลงนาม
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
            </button>

            <button
              onClick={onNavigateToNotification}
              className="w-full text-left p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-all flex items-center justify-between group cursor-pointer"
            >
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                  4. ปิดรอบและส่งแจ้งเตือน SMS/Email
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  แจ้ง ผอ.รพ. และฝ่ายการเงินทันทีเมื่อสรุปยอดเสร็จ
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
            </button>
          </div>

          <div className="pt-2 text-[11px] text-slate-400 text-center">
            ผู้ใช้งานปัจจุบัน: <span className="font-semibold text-slate-700 dark:text-slate-300">{currentUser.fullName}</span> ({currentUser.role})
          </div>
        </div>

      </div>

    </div>
  );
};
