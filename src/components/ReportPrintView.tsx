import React, { useState } from 'react';
import { 
  Printer, 
  Download, 
  Edit3, 
  CheckCircle2, 
  ShieldCheck, 
  Calendar, 
  FileText,
  Save,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { MedicalDebtItem, SignatoryInfo, UserProfile } from '../types';
import { formatCurrency, calculateSummaryStats } from '../utils/calculator';
import { exportDebtToExcel } from '../utils/exportExcel';
import { SangkhlaburiLogo } from './SangkhlaburiLogo';

interface ReportPrintViewProps {
  items: MedicalDebtItem[];
  currentUser: UserProfile;
  monthText: string;
  yearBE: number;
  signatories: SignatoryInfo;
  setSignatories: React.Dispatch<React.SetStateAction<SignatoryInfo>>;
}

export const ReportPrintView: React.FC<ReportPrintViewProps> = ({
  items,
  currentUser,
  monthText,
  yearBE,
  signatories,
  setSignatories,
}) => {
  const [reportTitle, setReportTitle] = useState('รายงานสรุปการเรียกเก็บลูกหนี้และยอดคงเหลือลูกหนี้แต่ละสิทธิ');
  const [departmentTitle, setDepartmentTitle] = useState('งานประกันสุขภาพฯ โรงพยาบาลสังขละบุรี จังหวัดกาญจนบุรี');
  const [periodTitle, setPeriodTitle] = useState(`ประจำเดือน...${monthText}...${yearBE}.......`);
  const [customMonth, setCustomMonth] = useState(monthText);
  const [customYear, setCustomYear] = useState(yearBE);
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);

  const stats = calculateSummaryStats(items);
  const govItems = items.filter((i) => i.category === 'government');
  const extItems = items.filter((i) => i.category === 'external');

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    exportDebtToExcel(items, customMonth, customYear, signatories);
  };

  const handleSignDigital = (roleType: 'reporter' | 'verifier' | 'approver') => {
    const todayStr = `${new Date().getDate()} ${customMonth} ${customYear}`;
    if (roleType === 'reporter') {
      setSignatories((prev) => ({
        ...prev,
        reporterName: currentUser.fullName,
        reporterPosition: currentUser.position,
        reporterStatus: 'approved',
        reporterDate: todayStr,
      }));
    } else if (roleType === 'verifier') {
      setSignatories((prev) => ({
        ...prev,
        verifierName: currentUser.fullName,
        verifierPosition: currentUser.position,
        verifierStatus: 'approved',
        verifierDate: todayStr,
      }));
    } else if (roleType === 'approver') {
      setSignatories((prev) => ({
        ...prev,
        approverName: currentUser.fullName,
        approverPosition: currentUser.position,
        approverStatus: 'approved',
        approverDate: todayStr,
      }));
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Action Toolbar (Hidden in Print) */}
      <div className="no-print bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Printer className="w-5 h-5 text-emerald-600" />
              พิมพ์รายงานประจำเดือนเสนอผู้บริหาร (Official Print)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              มาตรฐานราชการ รพ.สังขละบุรี
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            จัดหน้ากระดาษ A4 แนวนอนอัตโนมัติ (Print CSS) ซ่อนเมนูและปุ่มคำสั่งขณะพิมพ์ พร้อมช่องลงนาม 3 ลำดับชั้นตามเอกสารจริง
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsEditingHeader(!isEditingHeader)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors cursor-pointer"
          >
            <Edit3 className="w-4 h-4 text-emerald-600" />
            <span>ปรับแก้หัวกระดาษ/ผู้ลงนาม</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>ส่งออก Excel (.xlsx)</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์รายงาน / บันทึก PDF (A4)</span>
          </button>
        </div>
      </div>

      {/* Header and Signatory Editor Modal/Drawer (Hidden in Print) */}
      {isEditingHeader && (
        <div className="no-print bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-inner space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-emerald-600" />
              แก้ไขข้อมูลหัวรายงานและผู้ลงนามก่อนพิมพ์
            </h3>
            <button
              onClick={() => setIsEditingHeader(false)}
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              ปิดแถบแก้ไข
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                ชื่อรายงานหลัก
              </label>
              <input
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                ประจำเดือนและปี
              </label>
              <input
                type="text"
                value={periodTitle}
                onChange={(e) => setPeriodTitle(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                หน่วยงานผู้จัดทำ
              </label>
              <input
                type="text"
                value={departmentTitle}
                onChange={(e) => setDepartmentTitle(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
          </div>

          {/* Signatories 3 Tiers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
            {/* 1. Reporter */}
            <div className="space-y-1.5 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">1. ผู้รายงาน</span>
                <button
                  onClick={() => handleSignDigital('reporter')}
                  className="text-[10px] text-emerald-600 hover:underline font-semibold"
                >
                  ใช้ชื่อฉันลงนาม
                </button>
              </div>
              <input
                type="text"
                value={signatories.reporterName}
                onChange={(e) => setSignatories({ ...signatories, reporterName: e.target.value })}
                className="w-full text-xs p-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850"
                placeholder="ชื่อ-สกุล"
              />
              <input
                type="text"
                value={signatories.reporterPosition}
                onChange={(e) => setSignatories({ ...signatories, reporterPosition: e.target.value })}
                className="w-full text-xs p-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850"
                placeholder="ตำแหน่ง"
              />
            </div>

            {/* 2. Verifier */}
            <div className="space-y-1.5 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">2. ผู้ตรวจสอบ</span>
                <button
                  onClick={() => handleSignDigital('verifier')}
                  className="text-[10px] text-emerald-600 hover:underline font-semibold"
                >
                  ใช้ชื่อฉันลงนาม
                </button>
              </div>
              <input
                type="text"
                value={signatories.verifierName}
                onChange={(e) => setSignatories({ ...signatories, verifierName: e.target.value })}
                className="w-full text-xs p-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850"
                placeholder="ชื่อ-สกุล"
              />
              <input
                type="text"
                value={signatories.verifierPosition}
                onChange={(e) => setSignatories({ ...signatories, verifierPosition: e.target.value })}
                className="w-full text-xs p-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850"
                placeholder="ตำแหน่ง"
              />
            </div>

            {/* 3. Approver */}
            <div className="space-y-1.5 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">3. ผู้รับรอง (ผอ.รพ.)</span>
                <button
                  onClick={() => handleSignDigital('approver')}
                  className="text-[10px] text-emerald-600 hover:underline font-semibold"
                >
                  ใช้ชื่อฉันลงนาม
                </button>
              </div>
              <input
                type="text"
                value={signatories.approverName}
                onChange={(e) => setSignatories({ ...signatories, approverName: e.target.value })}
                className="w-full text-xs p-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850"
                placeholder="ชื่อ-สกุล"
              />
              <input
                type="text"
                value={signatories.approverPosition}
                onChange={(e) => setSignatories({ ...signatories, approverPosition: e.target.value })}
                className="w-full text-xs p-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850"
                placeholder="ตำแหน่ง"
              />
            </div>
          </div>
        </div>
      )}

      {/* Official Government Print Document Preview Container */}
      {/* Uses authentic Thai government typography font-sarabun with standard border styling */}
      <div className="print-container bg-white text-black p-8 sm:p-12 rounded-2xl shadow-xl border border-slate-200 max-w-[1240px] mx-auto font-sarabun">
        
        {/* Hospital Emblem & Document Header */}
        <div className="text-center mb-6 relative">
          {/* Logo */}
          <div className="flex justify-center mb-2">
            <SangkhlaburiLogo size={80} />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-black">
            {reportTitle}
          </h2>
          <p className="text-base sm:text-lg font-medium text-black mt-1">
            {periodTitle}
          </p>
          <p className="text-sm sm:text-base font-medium text-black">
            {departmentTitle}
          </p>
        </div>

        {/* 52 Rights Standard Government Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] sm:text-xs border-collapse border border-black">
            <thead>
              <tr className="bg-slate-100 print:bg-slate-100 text-black font-bold">
                <th className="border border-black py-2 px-1 text-center w-10">ลำดับ</th>
                <th className="border border-black py-2 px-2 text-center w-32">รหัส</th>
                <th className="border border-black py-2 px-2 min-w-[230px] text-center">รายการ</th>
                <th className="border border-black py-2 px-2 text-right w-28">
                  ยอดลูกหนี้ยกมา<br />
                  <span className="text-[10px] font-normal">ณ..31 กรกฎาคม.69..</span>
                </th>
                <th className="border border-black py-2 px-2 text-right w-28">
                  ยอดลูกหนี้ของเดือน<br />
                  <span className="text-[10px] font-normal">(ยอดตั้งใหม่)</span>
                </th>
                <th className="border border-black py-2 px-2 text-right w-28">
                  ยอดรับชำระ<br />
                  <span className="text-[10px] font-normal">ระหว่างเดือน</span>
                </th>
                <th className="border border-black py-2 px-2 text-right w-28">
                  ยอดลูกหนี้ยกไป<br />
                  <span className="text-[10px] font-normal">ณ..31 สิงหาคม 69..</span>
                </th>
                <th className="border border-black py-2 px-2 text-center w-32">หมายเหตุ</th>
              </tr>
            </thead>

            <tbody>
              {/* Category 1 Header */}
              <tr className="bg-slate-200/60 print:bg-slate-200/60 font-bold">
                <td colSpan={8} className="border border-black py-1.5 px-2 text-left">
                  ลูกหนี้การค้า-หน่วยงานภาครัฐ (รหัส 1102050101)
                </td>
              </tr>

              {/* Gov Items (1 to 33) */}
              {govItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="border border-black py-1 px-1 text-center">
                    {item.orderNumber}
                  </td>
                  <td className="border border-black py-1 px-2 font-mono text-[11px]">
                    {item.code}
                  </td>
                  <td className="border border-black py-1 px-2">
                    {item.name}
                  </td>
                  <td className="border border-black py-1 px-2 text-right font-mono">
                    {formatCurrency(item.initialBalance)}
                  </td>
                  <td className="border border-black py-1 px-2 text-right font-mono">
                    {formatCurrency(item.currentPeriodAdded)}
                  </td>
                  <td className="border border-black py-1 px-2 text-right font-mono">
                    {formatCurrency(item.receivedPayment)}
                  </td>
                  <td className="border border-black py-1 px-2 text-right font-mono font-semibold">
                    {formatCurrency(item.remainingBalance)}
                  </td>
                  <td className="border border-black py-1 px-2 text-center text-[10px]">
                    {item.remarks || ''}
                  </td>
                </tr>
              ))}

              {/* Gov Subtotal */}
              <tr className="bg-slate-100 print:bg-slate-100 font-bold">
                <td colSpan={3} className="border border-black py-1.5 px-2 text-center">
                  รวมลูกหนี้การค้า-หน่วยงานภาครัฐ
                </td>
                <td className="border border-black py-1.5 px-2 text-right font-mono">
                  {formatCurrency(stats.govSummary.initial)}
                </td>
                <td className="border border-black py-1.5 px-2 text-right font-mono">
                  {formatCurrency(stats.govSummary.added)}
                </td>
                <td className="border border-black py-1.5 px-2 text-right font-mono">
                  {formatCurrency(stats.govSummary.received)}
                </td>
                <td className="border border-black py-1.5 px-2 text-right font-mono font-bold">
                  {formatCurrency(stats.govSummary.remaining)}
                </td>
                <td className="border border-black py-1.5 px-2 text-center text-[10px]"></td>
              </tr>

              {/* Category 2 Header */}
              <tr className="bg-slate-200/60 print:bg-slate-200/60 font-bold">
                <td colSpan={8} className="border border-black py-1.5 px-2 text-left">
                  ลูกหนี้การค้า - บุคคลภายนอก (รหัส 1102050102)
                </td>
              </tr>

              {/* Ext Items (34 to 52) */}
              {extItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="border border-black py-1 px-1 text-center">
                    {item.orderNumber}
                  </td>
                  <td className="border border-black py-1 px-2 font-mono text-[11px]">
                    {item.code}
                  </td>
                  <td className="border border-black py-1 px-2">
                    {item.name}
                  </td>
                  <td className="border border-black py-1 px-2 text-right font-mono">
                    {formatCurrency(item.initialBalance)}
                  </td>
                  <td className="border border-black py-1 px-2 text-right font-mono">
                    {formatCurrency(item.currentPeriodAdded)}
                  </td>
                  <td className="border border-black py-1 px-2 text-right font-mono">
                    {formatCurrency(item.receivedPayment)}
                  </td>
                  <td className="border border-black py-1 px-2 text-right font-mono font-semibold">
                    {formatCurrency(item.remainingBalance)}
                  </td>
                  <td className="border border-black py-1 px-2 text-center text-[10px]">
                    {item.remarks || ''}
                  </td>
                </tr>
              ))}

              {/* Ext Subtotal */}
              <tr className="bg-slate-100 print:bg-slate-100 font-bold">
                <td colSpan={3} className="border border-black py-1.5 px-2 text-center">
                  รวมลูกหนี้การค้า - บุคคลภายนอก
                </td>
                <td className="border border-black py-1.5 px-2 text-right font-mono">
                  {formatCurrency(stats.extSummary.initial)}
                </td>
                <td className="border border-black py-1.5 px-2 text-right font-mono">
                  {formatCurrency(stats.extSummary.added)}
                </td>
                <td className="border border-black py-1.5 px-2 text-right font-mono">
                  {formatCurrency(stats.extSummary.received)}
                </td>
                <td className="border border-black py-1.5 px-2 text-right font-mono font-bold">
                  {formatCurrency(stats.extSummary.remaining)}
                </td>
                <td className="border border-black py-1.5 px-2 text-center text-[10px]"></td>
              </tr>

              {/* Grand Total */}
              <tr className="bg-slate-200 print:bg-slate-200 font-bold text-sm">
                <td colSpan={3} className="border border-black py-2 px-2 text-center">
                  รวมทั้งหมด (Grand Total)
                </td>
                <td className="border border-black py-2 px-2 text-right font-mono font-bold">
                  {formatCurrency(stats.totalInitial)}
                </td>
                <td className="border border-black py-2 px-2 text-right font-mono font-bold">
                  {formatCurrency(stats.totalAdded)}
                </td>
                <td className="border border-black py-2 px-2 text-right font-mono font-bold">
                  {formatCurrency(stats.totalReceived)}
                </td>
                <td className="border border-black py-2 px-2 text-right font-mono font-bold">
                  {formatCurrency(stats.totalRemaining)}
                </td>
                <td className="border border-black py-2 px-2 text-center text-[10px]"></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 3-Tier Signatory Block matching official document */}
        <div className="mt-12 pt-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center text-xs sm:text-sm">
          
          {/* 1. ผู้รายงาน */}
          <div className="space-y-1">
            <div className="mb-2">
              (......{signatories.reporterName}......)
            </div>
            <div className="text-slate-700">
              ตำแหน่ง ....{signatories.reporterPosition}....
            </div>
            <div className="font-bold text-slate-900 pt-1">
              ผู้รายงาน
            </div>
            {signatories.reporterStatus === 'approved' && (
              <div className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium mt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>ตรวจสอบข้อมูลถูกต้อง</span>
              </div>
            )}
          </div>

          {/* 2. ผู้ตรวจสอบ */}
          <div className="space-y-1">
            <div className="mb-2">
              (......{signatories.verifierName}......)
            </div>
            <div className="text-slate-700">
              ตำแหน่ง ...{signatories.verifierPosition}...
            </div>
            <div className="font-bold text-slate-900 pt-1">
              ผู้ตรวจสอบ
            </div>
            {signatories.verifierStatus === 'approved' && (
              <div className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium mt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>ผ่านการกระทบยอด HIS</span>
              </div>
            )}
          </div>

          {/* 3. ผู้รับรอง */}
          <div className="space-y-1">
            <div className="mb-2">
              (.....{signatories.approverName}.....)
            </div>
            <div className="text-slate-700 max-w-xs mx-auto leading-tight">
              ตำแหน่ง ......{signatories.approverPosition}......
            </div>
            <div className="font-bold text-slate-900 pt-1">
              ผู้รับรอง
            </div>
            {signatories.approverStatus === 'approved' && (
              <div className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium mt-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>รับรองและอนุมัติรายงานแล้ว</span>
              </div>
            )}
          </div>

        </div>

        {/* Hospital Seal & Document Verification Footer Note */}
        <div className="mt-8 pt-4 border-t border-slate-300 text-[10px] text-slate-500 text-center flex justify-between items-center">
          <span>เอกสารทางการ รพ.สังขละบุรี • พิมพ์จากระบบ SKB Management System</span>
          <span>วันที่ประมวลผล: {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>

      </div>
    </div>
  );
};
