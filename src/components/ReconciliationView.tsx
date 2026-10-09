import React, { useState } from 'react';
import { 
  RefreshCw, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Zap, 
  Check, 
  FileText,
  RotateCcw,
  Sparkles,
  Cloud
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { MedicalDebtItem, UserProfile } from '../types';
import { formatCurrency, calculateRowRemaining } from '../utils/calculator';
import confetti from 'canvas-confetti';
import { saveHisReconciliationLogToSupabase } from '../services/supabaseService';
import { isSupabaseConfigured } from '../lib/supabase';

interface ReconciliationViewProps {
  items: MedicalDebtItem[];
  setItems: React.Dispatch<React.SetStateAction<MedicalDebtItem[]>>;
  currentUser: UserProfile;
}

interface DiffRow {
  code: string;
  name: string;
  category: 'government' | 'external';
  currentBalance: number;
  hisBalance: number;
  diff: number; // his - current
  isMatch: boolean;
}

export const ReconciliationView: React.FC<ReconciliationViewProps> = ({
  items,
  setItems,
  currentUser,
}) => {
  // Imported HIS data state
  const [hisDataMap, setHisDataMap] = useState<Record<string, number>>(() => {
    // Generate initial realistic test HIS data matching official document with 4 minor audit adjustments
    const initialMap: Record<string, number> = {};
    items.forEach((item) => {
      // Create slight variations on 4 items to demonstrate difference highlighting!
      if (item.code === '1102050101.203') {
        initialMap[item.code] = item.remainingBalance - 1500; // HIS has lower balance (1500 collected via provincial clearing)
      } else if (item.code === '1102050101.401') {
        initialMap[item.code] = item.remainingBalance - 12450.50; // HIS e-Claim re-billed
      } else if (item.code === '1102050102.106') {
        initialMap[item.code] = item.remainingBalance + 3200; // HIS registered delayed self-pay invoice
      } else if (item.code === '1102050102.602') {
        initialMap[item.code] = item.remainingBalance - 5000; // Traffic Act fund settled
      } else {
        initialMap[item.code] = item.remainingBalance;
      }
    });
    return initialMap;
  });

  const [hasImported, setHasImported] = useState(true);
  const [filterMode, setFilterMode] = useState<'all' | 'diff_only' | 'matched_only'>('all');

  // Compute differences
  const diffRows: DiffRow[] = items.map((item) => {
    const hisVal = hisDataMap[item.code] !== undefined ? hisDataMap[item.code] : item.remainingBalance;
    const diff = Number((hisVal - item.remainingBalance).toFixed(2));
    const isMatch = Math.abs(diff) < 0.01;

    return {
      code: item.code,
      name: item.name,
      category: item.category,
      currentBalance: item.remainingBalance,
      hisBalance: hisVal,
      diff,
      isMatch,
    };
  });

  const matchedCount = diffRows.filter((r) => r.isMatch).length;
  const mismatchCount = diffRows.filter((r) => !r.isMatch).length;
  const totalNetDiff = diffRows.reduce((acc, cur) => acc + cur.diff, 0);

  // Filter rows
  const displayedRows = diffRows.filter((row) => {
    if (filterMode === 'diff_only') return !row.isMatch;
    if (filterMode === 'matched_only') return row.isMatch;
    return true;
  });

  // Handle Excel/CSV file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<any>(sheet);

        const newMap: Record<string, number> = {};
        json.forEach((row: any) => {
          // Detect code and balance columns flexibly
          const code = row['รหัสบัญชี'] || row['รหัส'] || row['code'] || row['Code'];
          const balance = parseFloat(
            row['ยอดลูกหนี้ยกไป'] || row['ยอดคงเหลือ'] || row['balance'] || row['Remaining'] || 0
          );
          if (code) {
            newMap[String(code).trim()] = isNaN(balance) ? 0 : balance;
          }
        });

        if (Object.keys(newMap).length > 0) {
          setHisDataMap(newMap);
          setHasImported(true);
        } else {
          alert('ไม่พบข้อมูลรหัสบัญชีและยอดคงเหลือในไฟล์ที่นำเข้า');
        }
      } catch (err) {
        alert('เกิดข้อผิดพลาดในการอ่านไฟล์ Excel/CSV');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Re-simulate / sample HIS data
  const handleReloadSimulatedHIS = () => {
    const freshMap: Record<string, number> = {};
    items.forEach((item) => {
      if (item.code === '1102050101.203') {
        freshMap[item.code] = item.remainingBalance - 1500;
      } else if (item.code === '1102050101.401') {
        freshMap[item.code] = item.remainingBalance - 12450.50;
      } else if (item.code === '1102050102.106') {
        freshMap[item.code] = item.remainingBalance + 3200;
      } else if (item.code === '1102050102.602') {
        freshMap[item.code] = item.remainingBalance - 5000;
      } else {
        freshMap[item.code] = item.remainingBalance;
      }
    });
    setHisDataMap(freshMap);
    setHasImported(true);
  };

  // One-Click Auto-Reconcile: Adjust current system balances to match HIS!
  const handleOneClickReconcileAll = () => {
    if (mismatchCount === 0) {
      alert('ยอดลูกหนี้ทั้ง 52 สิทธิ์ตรงกันสมบูรณ์แล้ว ไม่จำเป็นต้องปรับยอด');
      return;
    }

    if (
      window.confirm(
        `ยืนยันการปรับยอดลูกหนี้อัตโนมัติให้ตรงกับระบบ HIS สำหรับทั้ง ${mismatchCount} รายการที่มีผลต่างหรือไม่?`
      )
    ) {
      setItems((prev) =>
        prev.map((item) => {
          const hisVal = hisDataMap[item.code];
          if (hisVal !== undefined && hisVal !== item.remainingBalance) {
            const difference = hisVal - item.remainingBalance;
            // Adjust currentPeriodAdded or receivedPayment so formula balances out
            if (difference > 0) {
              return {
                ...item,
                currentPeriodAdded: Number((item.currentPeriodAdded + difference).toFixed(2)),
                remainingBalance: hisVal,
                remarks: item.remarks ? `${item.remarks} (ปรับยอดตาม HIS +${formatCurrency(difference)})` : 'ปรับยอดตาม HIS',
              };
            } else {
              return {
                ...item,
                receivedPayment: Number((item.receivedPayment + Math.abs(difference)).toFixed(2)),
                remainingBalance: hisVal,
                remarks: item.remarks ? `${item.remarks} (ปรับรับชำระตาม HIS +${formatCurrency(Math.abs(difference))})` : 'ปรับยอดตาม HIS',
              };
            }
          }
          return item;
        })
      );

      // Trigger Confetti
      try {
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.5 },
        });
      } catch (e) {}

      // Save reconciliation snapshot to Supabase
      if (isSupabaseConfigured()) {
        saveHisReconciliationLogToSupabase({
          comparedBy: currentUser.fullName,
          referenceMonth: 'สิงหาคม 2569',
          totalRights: items.length,
          matchedCount: items.length,
          mismatchCount: 0,
          netDifference: 0,
          itemsDiff: diffRows.map((d) => ({
            code: d.code,
            name: d.name,
            diff: d.diff,
            isMatch: true,
          })),
          autoSynced: true,
        }).then((res) => {
          if (res.success) {
            alert('ปรับยอดและบันทึกผลการกระทบยอดลง Supabase เรียบร้อยแล้ว');
          }
        }).catch(console.error);
      }
    }
  };

  const handleManualSaveReconciliation = async () => {
    const res = await saveHisReconciliationLogToSupabase({
      comparedBy: currentUser.fullName,
      referenceMonth: 'สิงหาคม 2569',
      totalRights: items.length,
      matchedCount,
      mismatchCount,
      netDifference: totalNetDiff,
      itemsDiff: diffRows.map((d) => ({
        code: d.code,
        name: d.name,
        current: d.currentBalance,
        his: d.hisBalance,
        diff: d.diff,
        isMatch: d.isMatch,
      })),
      autoSynced: false,
    });
    alert(res.message);
  };

  // Sync single item
  const handleSyncSingleItem = (code: string, hisBalance: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.code === code) {
          const difference = hisBalance - item.remainingBalance;
          return {
            ...item,
            remainingBalance: hisBalance,
            receivedPayment: difference < 0 ? Number((item.receivedPayment + Math.abs(difference)).toFixed(2)) : item.receivedPayment,
            currentPeriodAdded: difference > 0 ? Number((item.currentPeriodAdded + difference).toFixed(2)) : item.currentPeriodAdded,
            remarks: `${item.remarks || ''} [ปรับตรง HIS แล้ว]`,
          };
        }
        return item;
      })
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <RefreshCw className="w-6 h-6 text-emerald-600" />
              ระบบนำเข้าและเปรียบเทียบข้อมูลลูกหนี้อัตโนมัติ (HIS Reconcile)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              Auto-Reconciliation
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            เปรียบเทียบยอดลูกหนี้คงเหลือ 52 สิทธิระหว่างระบบทะเบียนคุมและฐานข้อมูลโรงพยาบาล (HIS/HOSxP) ไฮไลต์ผลต่างสีส้ม/เขียว พร้อมปุ่มคลิกเดียวปรับยอดให้ตรงกันทันที
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* File Upload */}
          <label className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer">
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>นำเข้าไฟล์ HIS (Excel/CSV)</span>
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="hidden" />
          </label>

          {/* Simulated Loader */}
          <button
            onClick={handleReloadSimulatedHIS}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors cursor-pointer"
            title="โหลดชุดข้อมูลจำลองจาก HIS เพื่อทดสอบการเปรียบเทียบ"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>จำลองข้อมูล HIS</span>
          </button>

          {/* Save to Supabase */}
          <button
            onClick={handleManualSaveReconciliation}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-semibold transition-colors cursor-pointer"
            title="บันทึกผลการเปรียบเทียบและการกระทบยอดปัจจุบันลงฐานข้อมูล Supabase"
          >
            <Cloud className="w-4 h-4 text-emerald-600" />
            <span>บันทึกประวัติลง Supabase</span>
          </button>

          {/* ONE-CLICK SYNC BUTTON */}
          <button
            onClick={handleOneClickReconcileAll}
            disabled={mismatchCount === 0}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer ${
              mismatchCount > 0
                ? 'bg-linear-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white animate-pulse'
                : 'bg-emerald-600 text-white opacity-60 cursor-not-allowed'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>คลิกเดียวปรับยอดให้ตรงกับระบบเดิมทันที ({mismatchCount})</span>
          </button>
        </div>
      </div>

      {/* 3 Status KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Matched */}
        <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              ยอดตรงกันสมบูรณ์ (Matched)
            </div>
            <div className="text-2xl font-bold text-emerald-800 dark:text-emerald-200 mt-1">
              {matchedCount} / 52 สิทธิ
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              ไฮไลต์สีเขียว พร้อมรับรองความถูกต้อง
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Discrepancy */}
        <div className={`rounded-2xl p-5 shadow-xs flex items-center justify-between border transition-all ${
          mismatchCount > 0
            ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
        }`}>
          <div>
            <div className="text-xs font-semibold text-amber-700 dark:text-amber-400">
              พบยอดผลต่าง (Discrepancy)
            </div>
            <div className="text-2xl font-bold text-amber-900 dark:text-amber-200 mt-1">
              {mismatchCount} สิทธิ
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              ไฮไลต์สีส้ม รอการปรับกระทบยอด
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Net Difference Amount */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              มูลค่าผลต่างสุทธิ (Net Difference)
            </div>
            <div className={`text-2xl font-bold mt-1 font-mono ${
              totalNetDiff === 0 ? 'text-emerald-600' : 'text-amber-600'
            }`}>
              ฿{formatCurrency(totalNetDiff)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {totalNetDiff === 0 ? 'ยอดรวมสองระบบเท่ากัน 100%' : 'ผลกระทบทางการเงินรวม'}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-200/70 dark:bg-slate-800/80 p-1 rounded-xl w-fit">
        <button
          onClick={() => setFilterMode('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            filterMode === 'all'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          ทั้งหมด (52 สิทธิ)
        </button>
        <button
          onClick={() => setFilterMode('diff_only')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            filterMode === 'diff_only'
              ? 'bg-amber-600 text-white shadow-xs font-bold'
              : 'text-amber-700 dark:text-amber-400'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>แสดงเฉพาะยอดผลต่าง ({mismatchCount})</span>
        </button>
        <button
          onClick={() => setFilterMode('matched_only')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            filterMode === 'matched_only'
              ? 'bg-emerald-600 text-white shadow-xs font-bold'
              : 'text-emerald-700 dark:text-emerald-400'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>แสดงเฉพาะยอดที่ตรงกัน ({matchedCount})</span>
        </button>
      </div>

      {/* Comparison Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold select-none">
                <th className="py-3 px-3 w-36">รหัสบัญชี</th>
                <th className="py-3 px-3 min-w-[240px]">สิทธิการรักษาพยาบาล</th>
                <th className="py-3 px-3">หมวด</th>
                <th className="py-3 px-3 text-right min-w-[140px]">ยอดในระบบปัจจุบัน</th>
                <th className="py-3 px-3 text-right min-w-[140px]">ยอดนำเข้าจาก HIS</th>
                <th className="py-3 px-3 text-right min-w-[120px]">ผลต่าง (Difference)</th>
                <th className="py-3 px-3 text-center w-36">สถานะการกระทบยอด</th>
                <th className="py-3 px-3 text-center w-28">การจัดการ</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {displayedRows.map((row) => (
                <tr
                  key={row.code}
                  className={`transition-colors ${
                    !row.isMatch
                      ? 'bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100/40'
                      : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <td className="py-3 px-3 font-mono font-medium text-slate-700 dark:text-slate-300">
                    {row.code}
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-900 dark:text-white">
                    {row.name}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded-sm text-[10px] font-semibold ${
                      row.category === 'government'
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      {row.category === 'government' ? 'ภาครัฐ' : 'บุคคลภายนอก'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-800 dark:text-slate-200">
                    ฿{formatCurrency(row.currentBalance)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900 dark:text-white">
                    ฿{formatCurrency(row.hisBalance)}
                  </td>
                  <td className={`py-3 px-3 text-right font-mono font-bold ${
                    row.isMatch
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : row.diff > 0
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {row.diff > 0 ? `+฿${formatCurrency(row.diff)}` : row.diff < 0 ? `-฿${formatCurrency(Math.abs(row.diff))}` : '0.00'}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {row.isMatch ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300/40">
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>ยอดตรงกัน (Matched)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">
                        <AlertTriangle className="w-3 h-3 text-amber-600 animate-pulse" />
                        <span>ผลต่าง ฿{formatCurrency(Math.abs(row.diff))}</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {!row.isMatch ? (
                      <button
                        onClick={() => handleSyncSingleItem(row.code, row.hisBalance)}
                        className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-semibold transition-colors shadow-xs cursor-pointer"
                        title="ปรับยอดเฉพาะรายการนี้ให้ตรงกับ HIS"
                      >
                        ปรับยอด
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400">
                        สมบูรณ์
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
