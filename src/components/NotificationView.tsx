import React, { useState } from 'react';
import { 
  Bell, 
  Send, 
  Smartphone, 
  Mail, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Settings, 
  PhoneCall, 
  User, 
  RefreshCw,
  MessageSquare,
  ShieldCheck,
  CheckCheck
} from 'lucide-react';
import { NotificationLog, UserProfile, MedicalDebtItem } from '../types';
import { calculateSummaryStats, formatCurrency } from '../utils/calculator';
import confetti from 'canvas-confetti';

interface NotificationViewProps {
  items: MedicalDebtItem[];
  currentUser: UserProfile;
  monthText: string;
  yearBE: number;
  notificationLogs: NotificationLog[];
  setNotificationLogs: React.Dispatch<React.SetStateAction<NotificationLog[]>>;
}

export const NotificationView: React.FC<NotificationViewProps> = ({
  items,
  currentUser,
  monthText,
  yearBE,
  notificationLogs,
  setNotificationLogs,
}) => {
  const stats = calculateSummaryStats(items);

  // Recipient profiles
  const [directorContact, setDirectorContact] = useState({
    name: 'นายแพทย์จิรวัฒน์ วงษ์สวัสดิ์',
    position: 'รักษาการผู้อำนวยการโรงพยาบาลสังขละบุรี',
    phone: '081-892-4512',
    email: 'director.skb@moph.mail.go.th',
    sendSms: true,
    sendEmail: true,
  });

  const [financeContact, setFinanceContact] = useState({
    name: 'นางสาวสุดลัดดา จันทวุฒิ',
    position: 'เจ้าหน้าที่ธุรการ / การเงิน รพ.สังขละบุรี',
    phone: '089-765-2144',
    email: 'sudladda.finance@skb-hospital.go.th',
    sendSms: true,
    sendEmail: true,
  });

  const [statContact, setStatContact] = useState({
    name: 'นางสาวมยุรา ปรางจันทร์',
    position: 'เจ้าพนักงานเวชสถิติชำนาญงาน',
    phone: '086-431-7789',
    email: 'mayura.prang@skb-hospital.go.th',
    sendSms: true,
    sendEmail: true,
  });

  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);
  const [activePreviewChannel, setActivePreviewChannel] = useState<'SMS' | 'EMAIL'>('SMS');

  const defaultSmsTemplate = `[รพ.สังขละบุรี] ปิดสรุปยอดทะเบียนคุมลูกหนี้ 52 สิทธิ์ ประจำเดือน ${monthText} ${yearBE} สำเร็จ: ยอดตั้งใหม่ ${(stats.totalAdded / 1000000).toFixed(2)} ลบ., รับชำระ ${(stats.totalReceived / 1000000).toFixed(2)} ลบ. (จัดเก็บ ${stats.overallRecoveryRate}%), คงเหลือ ${(stats.totalRemaining / 1000000).toFixed(2)} ลบ. ตรวจสอบรายงานได้ทางระบบ SKB`;
  const defaultEmailSubject = `[SKB Management] รายงานสรุปการเรียกเก็บลูกหนี้ ประจำเดือน ${monthText} ${yearBE} - รพ.สังขละบุรี`;

  const handleBroadcastClosing = () => {
    setIsBroadcasting(true);
    setBroadcastSuccess(false);

    setTimeout(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const dateStr = now.toISOString().split('T')[0];
      const fullTime = `${dateStr} ${timeStr}`;

      const newLogs: NotificationLog[] = [];

      // Director SMS & Email
      if (directorContact.sendSms) {
        newLogs.push({
          id: `log-sms-dir-${Date.now()}`,
          timestamp: fullTime,
          channel: 'SMS',
          recipientName: directorContact.name,
          recipientPosition: directorContact.position,
          contactDetail: directorContact.phone,
          subject: 'ปิดสรุปยอดลูกหนี้รายเดือน',
          message: defaultSmsTemplate,
          status: 'DELIVERED',
          deliveryTime: `${dateStr} ${timeStr}`,
          referenceMonth: `${monthText} ${yearBE}`,
        });
      }
      if (directorContact.sendEmail) {
        newLogs.push({
          id: `log-email-dir-${Date.now()}`,
          timestamp: fullTime,
          channel: 'EMAIL',
          recipientName: directorContact.name,
          recipientPosition: directorContact.position,
          contactDetail: directorContact.email,
          subject: defaultEmailSubject,
          message: `เรียน ผู้อำนวยการโรงพยาบาลสังขละบุรี\n\nงานประกันสุขภาพฯ ขอรายงานผลการสรุปปิดยอดทะเบียนคุมลูกหนี้ 52 สิทธิ์ ประจำเดือน ${monthText} ${yearBE} ดังนี้:\n- ยอดตั้งใหม่: ฿${formatCurrency(stats.totalAdded)}\n- ยอดรับชำระ: ฿${formatCurrency(stats.totalReceived)} (${stats.overallRecoveryRate}%)\n- หนี้คงเหลือยกไป: ฿${formatCurrency(stats.totalRemaining)}\n\nระบบเปิดให้ลงนามรับรองรายงานอิเล็กทรอนิกส์แล้วที่ระบบสารสนเทศ SKB Management System`,
          status: 'DELIVERED',
          deliveryTime: `${dateStr} ${timeStr}`,
          referenceMonth: `${monthText} ${yearBE}`,
        });
      }

      // Finance SMS & Email
      if (financeContact.sendSms) {
        newLogs.push({
          id: `log-sms-fin-${Date.now()}`,
          timestamp: fullTime,
          channel: 'SMS',
          recipientName: financeContact.name,
          recipientPosition: financeContact.position,
          contactDetail: financeContact.phone,
          subject: 'แจ้งเตือนปิดยอดเสร็จสิ้น',
          message: defaultSmsTemplate,
          status: 'DELIVERED',
          deliveryTime: `${dateStr} ${timeStr}`,
          referenceMonth: `${monthText} ${yearBE}`,
        });
      }

      setNotificationLogs((prev) => [...newLogs, ...prev]);
      setIsBroadcasting(false);
      setBroadcastSuccess(true);

      // Trigger Confetti effect
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // ignore if not supported
      }

      setTimeout(() => setBroadcastSuccess(false), 5000);
    }, 1200);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="w-6 h-6 text-emerald-600" />
                ระบบแจ้งเตือนผ่านเบอร์มือถือ (SMS) และอีเมล (Email)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                พร้อมใช้งาน (Active)
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              ส่งแจ้งเตือนผู้อำนวยการและเจ้าหน้าที่การเงินอัตโนมัติเมื่อปิดสรุปยอดรายเดือนสำเร็จ พร้อมเก็บบันทึกประวัติการส่ง (Notification Logs) และสถานะส่งถึงแล้ว (Delivered)
            </p>
          </div>

          {/* Trigger Broadcast Button */}
          <button
            onClick={handleBroadcastClosing}
            disabled={isBroadcasting}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md transition-all shrink-0 disabled:opacity-50 cursor-pointer"
          >
            {isBroadcasting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>กำลังส่งข้อความ SMS & Email...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>ปิดสรุปยอด & ส่งแจ้งเตือนผู้บริหารทันที</span>
              </>
            )}
          </button>
        </div>

        {broadcastSuccess && (
          <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center gap-3 animate-in fade-in duration-200">
            <CheckCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="text-xs text-emerald-900 dark:text-emerald-200">
              <strong>ส่งข้อความแจ้งเตือนสำเร็จแล้ว!</strong> ระบบส่งข้อความผ่าน SMS และ Email ไปยังผู้อำนวยการและเจ้าหน้าที่การเงินเรียบร้อยแล้ว สถานะ Delivered (ส่งถึงแล้ว)
            </div>
          </div>
        )}
      </div>

      {/* 2-Columns: Recipient Profiles Configuration & Message Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Recipient Settings (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-emerald-600" />
              การตั้งค่าผู้รับแจ้งเตือนประจำตำแหน่ง (Recipient Profiles)
            </h2>
            <span className="text-xs text-slate-400">แก้ไขเบอร์โทรและอีเมลได้</span>
          </div>

          {/* Card 1: Hospital Director */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 flex items-center justify-center text-lg">
                  👨‍⚕️
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {directorContact.name}
                  </h3>
                  <p className="text-xs text-purple-700 dark:text-purple-300 font-medium">
                    {directorContact.position}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200">
                ผู้บริหารระดับสูง
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                  เบอร์มือถือรับ SMS
                </label>
                <input
                  type="text"
                  value={directorContact.phone}
                  onChange={(e) => setDirectorContact({ ...directorContact, phone: e.target.value })}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  อีเมลรับรายงาน
                </label>
                <input
                  type="email"
                  value={directorContact.email}
                  onChange={(e) => setDirectorContact({ ...directorContact, email: e.target.value })}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 pt-1 text-xs text-slate-600 dark:text-slate-400">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={directorContact.sendSms}
                  onChange={(e) => setDirectorContact({ ...directorContact, sendSms: e.target.checked })}
                  className="rounded-sm text-emerald-600 focus:ring-emerald-500"
                />
                <span>ส่ง SMS สรุปยอด</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={directorContact.sendEmail}
                  onChange={(e) => setDirectorContact({ ...directorContact, sendEmail: e.target.checked })}
                  className="rounded-sm text-emerald-600 focus:ring-emerald-500"
                />
                <span>ส่ง Email รายงานฉบับเต็ม</span>
              </label>
            </div>
          </div>

          {/* Card 2: Finance Staff */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-lg">
                  👩‍💻
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {financeContact.name}
                  </h3>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                    {financeContact.position}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200">
                ผู้รายงาน / การเงิน
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                  เบอร์มือถือรับ SMS
                </label>
                <input
                  type="text"
                  value={financeContact.phone}
                  onChange={(e) => setFinanceContact({ ...financeContact, phone: e.target.value })}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  อีเมลรับสำเนารายงาน
                </label>
                <input
                  type="email"
                  value={financeContact.email}
                  onChange={(e) => setFinanceContact({ ...financeContact, email: e.target.value })}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 pt-1 text-xs text-slate-600 dark:text-slate-400">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={financeContact.sendSms}
                  onChange={(e) => setFinanceContact({ ...financeContact, sendSms: e.target.checked })}
                  className="rounded-sm text-emerald-600"
                />
                <span>ส่ง SMS แจ้งผล</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={financeContact.sendEmail}
                  onChange={(e) => setFinanceContact({ ...financeContact, sendEmail: e.target.checked })}
                  className="rounded-sm text-emerald-600"
                />
                <span>ส่ง Email สำเนา</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Live Message Preview (Phone / Email Simulator) (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-600" />
              ตัวอย่างข้อความแจ้งเตือน (Simulator)
            </h2>
            <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
              <button
                onClick={() => setActivePreviewChannel('SMS')}
                className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                  activePreviewChannel === 'SMS'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                SMS
              </button>
              <button
                onClick={() => setActivePreviewChannel('EMAIL')}
                className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                  activePreviewChannel === 'EMAIL'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Email
              </button>
            </div>
          </div>

          {/* SMS Bubble Preview */}
          {activePreviewChannel === 'SMS' ? (
            <div className="bg-slate-100 dark:bg-slate-800/60 rounded-3xl p-5 border border-slate-200 dark:border-slate-750 shadow-inner max-w-sm mx-auto">
              {/* Phone Top Notch */}
              <div className="w-24 h-4 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4"></div>
              
              <div className="text-center mb-3">
                <span className="text-[11px] font-semibold text-slate-500">ข้อความ SMS ทางการ • SKB-HOSPITAL</span>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">ถึง: {directorContact.phone}</p>
              </div>

              {/* Message Bubble */}
              <div className="bg-emerald-600 text-white rounded-2xl rounded-tl-xs p-4 text-xs leading-relaxed shadow-sm">
                <p className="font-semibold mb-1 text-emerald-100">[รพ.สังขละบุรี - สรุปยอดลูกหนี้]</p>
                <p>
                  ปิดยอดทะเบียนคุม 52 สิทธิ์ เดือน {monthText} {yearBE} สำเร็จ:
                </p>
                <ul className="mt-1.5 space-y-0.5 text-[11px] text-emerald-50">
                  <li>• ยอดตั้งใหม่: ฿{formatCurrency(stats.totalAdded)}</li>
                  <li>• ยอดรับชำระ: ฿{formatCurrency(stats.totalReceived)} ({stats.overallRecoveryRate}%)</li>
                  <li>• คงเหลือยกไป: ฿{formatCurrency(stats.totalRemaining)}</li>
                </ul>
                <p className="mt-2 text-[10px] text-emerald-200">
                  กรุณาเข้าตรวจรับรองรายงานทางระบบ SKB Management
                </p>
              </div>

              <div className="mt-2 text-right">
                <span className="text-[10px] text-slate-400 flex items-center justify-end gap-1">
                  <CheckCheck className="w-3 h-3 text-emerald-600" /> ส่งถึงแล้วทันที (Delivered)
                </span>
              </div>
            </div>
          ) : (
            /* Email Preview */
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="text-xs text-slate-500">
                  <strong>จาก:</strong> notification-skb@moph.mail.go.th
                </div>
                <div className="text-xs text-slate-500">
                  <strong>ถึง:</strong> {directorContact.email}
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                  เรื่อง: {defaultEmailSubject}
                </div>
              </div>

              <div className="text-xs text-slate-700 dark:text-slate-300 space-y-2 leading-relaxed">
                <p>เรียน นายแพทย์จิรวัฒน์ วงษ์สวัสดิ์ (รักษาการ ผอ.รพ.สังขละบุรี)</p>
                <p>
                  งานประกันสุขภาพและกลุ่มงานการเงิน ได้ทำการปิดสรุปยอดทะเบียนคุมลูกหนี้ทางการแพทย์ 52 สิทธิ ประจำเดือน {monthText} พ.ศ. {yearBE} เป็นที่เรียบร้อยแล้ว รายละเอียดสรุป:
                </p>
                <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl space-y-1 font-mono text-[11px]">
                  <div>1. ยอดลูกหนี้ยกมา: ฿{formatCurrency(stats.totalInitial)}</div>
                  <div>2. ยอดตั้งใหม่ของเดือน: ฿{formatCurrency(stats.totalAdded)}</div>
                  <div>3. ยอดรับชำระระหว่างเดือน: ฿{formatCurrency(stats.totalReceived)} (จัดเก็บ {stats.overallRecoveryRate}%)</div>
                  <div>4. ยอดลูกหนี้คงเหลือยกไป: ฿{formatCurrency(stats.totalRemaining)}</div>
                </div>
                <p className="text-[11px] text-slate-500">
                  รายงานมาตรฐานราชการพร้อมช่องลงนามถูกสร้างในระบบเรียบร้อยแล้ว
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Notification Logs Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              ประวัติการส่งข้อความแจ้งเตือน (Notification Logs)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              บันทึกการส่ง SMS และ Email พร้อมสถานะส่งถึงแล้ว (Delivered)
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            ทั้งหมด {notificationLogs.length} รายการ
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-medium">
                <th className="py-2.5 px-3">วัน-เวลา</th>
                <th className="py-2.5 px-3 text-center">ช่องทาง</th>
                <th className="py-2.5 px-3">ผู้รับ</th>
                <th className="py-2.5 px-3">เบอร์ / อีเมล</th>
                <th className="py-2.5 px-3">หัวข้อ / ข้อความ</th>
                <th className="py-2.5 px-3 text-center">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {notificationLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-3 font-mono text-slate-500 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      log.channel === 'SMS'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                    }`}>
                      {log.channel === 'SMS' ? <Smartphone className="w-3 h-3" /> : <Mail className="w-3 h-3" />}
                      {log.channel}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {log.recipientName}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {log.recipientPosition}
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300">
                    {log.contactDetail}
                  </td>
                  <td className="py-3 px-3 max-w-xs">
                    <div className="font-medium text-slate-800 dark:text-slate-200 truncate">
                      {log.subject}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate" title={log.message}>
                      {log.message}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300/40">
                      <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{log.status === 'DELIVERED' ? 'Delivered (ส่งถึงแล้ว)' : log.status}</span>
                    </span>
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
