import * as XLSX from 'xlsx';
import { MedicalDebtItem, SignatoryInfo } from '../types';
import { calculateSummaryStats, formatCurrency } from './calculator';

export const exportDebtToExcel = (
  items: MedicalDebtItem[],
  monthText: string,
  yearBE: number,
  signatories: SignatoryInfo
) => {
  const stats = calculateSummaryStats(items);
  const govItems = items.filter((i) => i.category === 'government');
  const extItems = items.filter((i) => i.category === 'external');

  // Sheet 1: ทะเบียนคุม 52 สิทธิ์ (แบบรายงานราชการ)
  const rows: any[][] = [];

  // Header Titles
  rows.push(['รายงานสรุปการเรียกเก็บลูกหนี้และยอดคงเหลือลูกหนี้แต่ละสิทธิ']);
  rows.push([`ประจำเดือน...${monthText}...${yearBE}.......`]);
  rows.push(['งานประกันสุขภาพฯ โรงพยาบาลสังขละบุรี จังหวัดกาญจนบุรี']);
  rows.push([]);

  // Table Headers
  rows.push([
    'ลำดับ',
    'รหัสบัญชี',
    'รายการสิทธิการรักษาพยาบาล',
    'ยอดลูกหนี้ยกมา',
    'ยอดลูกหนี้ของเดือน (ยอดตั้งใหม่)',
    'ยอดรับชำระระหว่างเดือน',
    'ยอดตัดหนี้สูญ',
    'ยอดลูกหนี้ยกไป',
    'อายุหนี้ (วัน)',
    'สถานะเร่งด่วน',
    'หมายเหตุ',
  ]);

  // Section 1 Header
  rows.push([
    '',
    '1102050101',
    'ลูกหนี้การค้า-หน่วยงานภาครัฐ (รหัส 1102050101)',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
  ]);

  govItems.forEach((item) => {
    rows.push([
      item.orderNumber,
      item.code,
      item.name,
      item.initialBalance,
      item.currentPeriodAdded,
      item.receivedPayment,
      item.writeOff,
      item.remainingBalance,
      item.daysOverdue,
      item.daysOverdue > 30 && item.remainingBalance > 0 ? 'เกิน 30 วัน' : 'ปกติ',
      item.remarks || '',
    ]);
  });

  // Gov Subtotal
  rows.push([
    '',
    'รวมหมวด 1',
    'รวมลูกหนี้การค้า-หน่วยงานภาครัฐ',
    stats.govSummary.initial,
    stats.govSummary.added,
    stats.govSummary.received,
    stats.govSummary.writeOff,
    stats.govSummary.remaining,
    '',
    '',
    `อัตราจัดเก็บ: ${stats.govSummary.recoveryRate}%`,
  ]);

  // Section 2 Header
  rows.push([
    '',
    '1102050102',
    'ลูกหนี้การค้า - บุคคลภายนอก (รหัส 1102050102)',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
  ]);

  extItems.forEach((item) => {
    rows.push([
      item.orderNumber,
      item.code,
      item.name,
      item.initialBalance,
      item.currentPeriodAdded,
      item.receivedPayment,
      item.writeOff,
      item.remainingBalance,
      item.daysOverdue,
      item.daysOverdue > 30 && item.remainingBalance > 0 ? 'เกิน 30 วัน' : 'ปกติ',
      item.remarks || '',
    ]);
  });

  // Ext Subtotal
  rows.push([
    '',
    'รวมหมวด 2',
    'รวมลูกหนี้การค้า - บุคคลภายนอก',
    stats.extSummary.initial,
    stats.extSummary.added,
    stats.extSummary.received,
    stats.extSummary.writeOff,
    stats.extSummary.remaining,
    '',
    '',
    `อัตราจัดเก็บ: ${stats.extSummary.recoveryRate}%`,
  ]);

  // Grand Total
  rows.push([
    '',
    'รวมทั้งหมด',
    'รวมลูกหนี้ทั้งสิ้น 52 สิทธิการรักษา',
    stats.totalInitial,
    stats.totalAdded,
    stats.totalReceived,
    stats.totalWriteOff,
    stats.totalRemaining,
    '',
    `หนี้เกิน 30 วัน: ${stats.overdue30Count} รายการ (${formatCurrency(stats.overdue30Amount)} บาท)`,
    `อัตราจัดเก็บรวม: ${stats.overallRecoveryRate}%`,
  ]);

  rows.push([]);
  rows.push([]);

  // Signatures
  rows.push([
    '',
    `(${signatories.reporterName})`,
    '',
    `(${signatories.verifierName})`,
    '',
    '',
    `(${signatories.approverName})`,
  ]);
  rows.push([
    '',
    `ตำแหน่ง ${signatories.reporterPosition}`,
    '',
    `ตำแหน่ง ${signatories.verifierPosition}`,
    '',
    '',
    `ตำแหน่ง ${signatories.approverPosition}`,
  ]);
  rows.push([
    '',
    'ผู้รายงาน',
    '',
    'ผู้ตรวจสอบ',
    '',
    '',
    'ผู้รับรอง',
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  // Column widths
  worksheet['!cols'] = [
    { wch: 6 },  // ลำดับ
    { wch: 18 }, // รหัส
    { wch: 45 }, // รายการ
    { wch: 16 }, // ยกมา
    { wch: 18 }, // ของเดือน
    { wch: 18 }, // รับชำระ
    { wch: 14 }, // ตัดหนี้สูญ
    { wch: 18 }, // ยกไป
    { wch: 14 }, // อายุหนี้
    { wch: 18 }, // แจ้งเตือน
    { wch: 32 }, // หมายเหตุ
  ];

  // Sheet 2: Summary Dashboard
  const summaryRows: any[][] = [];
  summaryRows.push(['สรุปสาระสำคัญทางการเงิน (Financial Executive Summary)']);
  summaryRows.push([`โรงพยาบาลสังขละบุรี - ประจำเดือน ${monthText} ${yearBE}`]);
  summaryRows.push([]);
  summaryRows.push(['หมวดตัวเลขหลัก', 'จำนวนเงิน (บาท)', 'หมายเหตุ']);
  summaryRows.push(['1. ยอดลูกหนี้ยกมา (ยอดตั้งต้น)', stats.totalInitial, '']);
  summaryRows.push(['2. ยอดลูกหนี้ของเดือน (ยอดตั้งใหม่)', stats.totalAdded, '']);
  summaryRows.push(['3. ยอดรับชำระระหว่างเดือน', stats.totalReceived, `อัตราเรียกเก็บได้ ${stats.overallRecoveryRate}%`]);
  summaryRows.push(['4. ยอดตัดหนี้สูญ', stats.totalWriteOff, '']);
  summaryRows.push(['5. ยอดลูกหนี้คงเหลือยกไป', stats.totalRemaining, '']);
  summaryRows.push([]);
  summaryRows.push(['รายการค้างชำระเร่งด่วน (> 30 วัน)', stats.overdue30Amount, `${stats.overdue30Count} รายการ`]);
  summaryRows.push([]);
  summaryRows.push(['สัดส่วนลูกหนี้แยกตามกองทุนหลัก']);
  summaryRows.push(['ชื่อกองทุน', 'ยอดคงเหลือ (บาท)', 'สัดส่วน (%)']);
  stats.fundBreakdown.forEach((fund) => {
    summaryRows.push([fund.name, fund.amount, `${fund.percentage}%`]);
  });

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
  summarySheet['!cols'] = [{ wch: 35 }, { wch: 20 }, { wch: 30 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'ทะเบียนคุม 52 สิทธิ์');
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'สรุปภาพรวมผู้บริหาร');

  const fileName = `รายงานทะเบียนคุมลูกหนี้_รพ.สังขละบุรี_${monthText}_${yearBE}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};
