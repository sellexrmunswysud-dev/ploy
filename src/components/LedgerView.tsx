import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Calendar, 
  Save, 
  RotateCcw, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  AlertTriangle, 
  CheckCircle2,
  FileSpreadsheet,
  Download,
  Filter,
  Cloud
} from 'lucide-react';
import { MedicalDebtItem, CategoryType, FundGroup, UserProfile } from '../types';
import { formatCurrency, calculateRowRemaining, calculateSummaryStats } from '../utils/calculator';
import { exportDebtToExcel } from '../utils/exportExcel';
import { DEFAULT_SIGNATORIES } from '../data/initialData';
import { saveSingleMedicalDebtItemToSupabase } from '../services/supabaseService';
import { isSupabaseConfigured } from '../lib/supabase';

interface LedgerViewProps {
  items: MedicalDebtItem[];
  setItems: React.Dispatch<React.SetStateAction<MedicalDebtItem[]>>;
  currentUser: UserProfile;
  recordDate: string;
  setRecordDate: (date: string) => void;
  monthText: string;
  yearBE: number;
  initialFilter?: 'all' | 'gov' | 'ext' | 'overdue';
  onSaveDatabase: () => void;
  lastSavedAt: string | null;
  onResetOriginal: () => void;
}

export const LedgerView: React.FC<LedgerViewProps> = ({
  items,
  setItems,
  currentUser,
  recordDate,
  setRecordDate,
  monthText,
  yearBE,
  initialFilter = 'all',
  onSaveDatabase,
  lastSavedAt,
  onResetOriginal,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'gov' | 'ext' | 'overdue'>(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<MedicalDebtItem>>({});
  
  // Add modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState<{
    code: string;
    name: string;
    category: CategoryType;
    fundGroup: FundGroup;
    initialBalance: number;
    currentPeriodAdded: number;
    receivedPayment: number;
    writeOff: number;
    remarks: string;
    daysOverdue: number;
  }>({
    code: '1102050101.',
    name: '',
    category: 'government',
    fundGroup: 'uc',
    initialBalance: 0,
    currentPeriodAdded: 0,
    receivedPayment: 0,
    writeOff: 0,
    remarks: '',
    daysOverdue: 0,
  });

  const canEdit = currentUser.role === 'accountant' || currentUser.role === 'superadmin' || currentUser.role === 'statistician';

  // Filter items
  const filteredItems = items.filter((item) => {
    // Category filter
    if (filterType === 'gov' && item.category !== 'government') return false;
    if (filterType === 'ext' && item.category !== 'external') return false;
    if (filterType === 'overdue' && (item.daysOverdue <= 30 || item.remainingBalance <= 0)) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.code.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.remarks.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const stats = calculateSummaryStats(items);

  // Start inline editing
  const startEdit = (item: MedicalDebtItem) => {
    setEditingId(item.id);
    setEditForm({ ...item });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleEditChange = (field: keyof MedicalDebtItem, value: any) => {
    const updated = { ...editForm, [field]: value };
    if (
      field === 'initialBalance' ||
      field === 'currentPeriodAdded' ||
      field === 'receivedPayment' ||
      field === 'writeOff'
    ) {
      const initial = Number(field === 'initialBalance' ? value : updated.initialBalance || 0);
      const added = Number(field === 'currentPeriodAdded' ? value : updated.currentPeriodAdded || 0);
      const received = Number(field === 'receivedPayment' ? value : updated.receivedPayment || 0);
      const writeOff = Number(field === 'writeOff' ? value : updated.writeOff || 0);
      updated.remainingBalance = calculateRowRemaining(initial, added, received, writeOff);
    }
    setEditForm(updated);
  };

  const saveEdit = (id: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const initial = Number(editForm.initialBalance ?? item.initialBalance);
          const added = Number(editForm.currentPeriodAdded ?? item.currentPeriodAdded);
          const received = Number(editForm.receivedPayment ?? item.receivedPayment);
          const writeOff = Number(editForm.writeOff ?? item.writeOff);
          const remaining = calculateRowRemaining(initial, added, received, writeOff);

          const updatedItem = {
            ...item,
            ...editForm,
            initialBalance: initial,
            currentPeriodAdded: added,
            receivedPayment: received,
            writeOff: writeOff,
            remainingBalance: remaining,
            daysOverdue: Number(editForm.daysOverdue ?? item.daysOverdue),
            lastUpdated: new Date().toISOString().split('T')[0],
          };

          // Save single row to Supabase if connected
          if (isSupabaseConfigured()) {
            saveSingleMedicalDebtItemToSupabase(updatedItem).catch(console.error);
          }

          return updatedItem;
        }
        return item;
      })
    );
    setEditingId(null);
    setEditForm({});
  };

  const deleteItem = (id: string, name: string) => {
    if (window.confirm(`ยืนยันการลบรายการ "${name}" ออกจากทะเบียนคุมลูกหนี้หรือไม่?`)) {
      setItems((prev) => {
        const remaining = prev.filter((i) => i.id !== id);
        // reorder order numbers
        return remaining.map((it, idx) => ({ ...it, orderNumber: idx + 1 }));
      });
    }
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name.trim() || !newItem.code.trim()) {
      return;
    }

    const calculatedRemaining = calculateRowRemaining(
      Number(newItem.initialBalance),
      Number(newItem.currentPeriodAdded),
      Number(newItem.receivedPayment),
      Number(newItem.writeOff)
    );

    const created: MedicalDebtItem = {
      id: `custom-${Date.now()}`,
      orderNumber: items.length + 1,
      code: newItem.code.trim(),
      name: newItem.name.trim(),
      category: newItem.category,
      fundGroup: newItem.fundGroup,
      initialBalance: Number(newItem.initialBalance),
      currentPeriodAdded: Number(newItem.currentPeriodAdded),
      receivedPayment: Number(newItem.receivedPayment),
      writeOff: Number(newItem.writeOff),
      remainingBalance: calculatedRemaining,
      remarks: newItem.remarks.trim(),
      daysOverdue: Number(newItem.daysOverdue),
      lastUpdated: recordDate,
    };

    setItems((prev) => [...prev, created]);

    // Save newly created item to Supabase if connected
    if (isSupabaseConfigured()) {
      saveSingleMedicalDebtItemToSupabase(created).catch(console.error);
    }

    setShowAddModal(false);
    setNewItem({
      code: newItem.category === 'government' ? '1102050101.' : '1102050102.',
      name: '',
      category: 'government',
      fundGroup: 'uc',
      initialBalance: 0,
      currentPeriodAdded: 0,
      receivedPayment: 0,
      writeOff: 0,
      remarks: '',
      daysOverdue: 0,
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Action Bar & Date Picker */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                ทะเบียนคุมลูกหนี้ 52 สิทธิ์การรักษาพยาบาล
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                รพ.สังขละบุรี
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              ระบบคำนวณอัตโนมัติ: ยอดตั้งต้น + ยอดตั้งใหม่ − ยอดรับชำระ − ยอดตัดหนี้สูญ = ยอดลูกหนี้คงเหลือยกไป
            </p>
          </div>

          {/* Date Picker & Persistence Buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Calendar Date Picker */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-1.5 rounded-xl">
              <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <label htmlFor="record-date-input" className="text-xs text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
                วันที่บันทึก:
              </label>
              <input
                id="record-date-input"
                type="date"
                value={recordDate}
                onChange={(e) => setRecordDate(e.target.value)}
                className="bg-transparent text-xs text-slate-900 dark:text-white font-medium focus:outline-hidden"
              />
            </div>

            {/* Save to Database Button */}
            <button
              onClick={onSaveDatabase}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer"
              title="บันทึกข้อมูลลูกหนี้ทั้งหมดเข้าฐานข้อมูลระบบ"
            >
              <Save className="w-4 h-4" />
              <span>บันทึกเก็บเข้าฐานข้อมูล</span>
            </button>

            {/* Export Excel Button */}
            <button
              onClick={() => exportDebtToExcel(items, monthText, yearBE, DEFAULT_SIGNATORIES)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs transition-all cursor-pointer"
              title="ส่งออกรายงานเป็นไฟล์ Excel (.xlsx)"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">ส่งออก Excel</span>
            </button>

            {/* Add New Item Button */}
            {canEdit && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มสิทธิใหม่</span>
              </button>
            )}

            {/* Reset to Original Data */}
            <button
              onClick={onResetOriginal}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="รีเซ็ตเป็นข้อมูลตัวอย่างตามเอกสารจริง รพ.สังขละบุรี"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status Indicator Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            {lastSavedAt ? (
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                บันทึกในฐานข้อมูลล่าสุด: {lastSavedAt}
              </span>
            ) : (
              <span>สถานะ: ข้อมูลพร้อมบันทึก (52 รายการสิทธิ)</span>
            )}
          </div>
          <div className="text-[11px] text-slate-400">
            สิทธิ์ปัจจุบัน: <span className="font-semibold text-slate-700 dark:text-slate-300">{currentUser.fullName}</span> ({currentUser.role})
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category Segmented Buttons */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-200/70 dark:bg-slate-800/80 p-1 rounded-xl">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            ทั้งหมด (52 สิทธิ)
          </button>
          <button
            onClick={() => setFilterType('gov')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              filterType === 'gov'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            หมวด 1: ภาครัฐ (33)
          </button>
          <button
            onClick={() => setFilterType('ext')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              filterType === 'ext'
                ? 'bg-amber-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            หมวด 2: บุคคลภายนอก (19)
          </button>
          <button
            onClick={() => setFilterType('overdue')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              filterType === 'overdue'
                ? 'bg-rose-600 text-white shadow-xs font-bold'
                : 'text-rose-700 dark:text-rose-400 hover:text-rose-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>หนี้เกิน 30 วัน ({stats.overdue30Count})</span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="ค้นหารหัสบัญชี หรือชื่อสิทธิ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Table for 52 Rights */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold select-none">
                <th className="py-3 px-2 text-center w-12">ลำดับ</th>
                <th className="py-3 px-3 w-36">รหัสบัญชี</th>
                <th className="py-3 px-3 min-w-[240px]">รายการสิทธิการรักษาพยาบาล</th>
                <th className="py-3 px-3 text-right min-w-[130px]">
                  ยอดลูกหนี้ยกมา
                  <span className="block text-[10px] text-slate-400 font-normal">ณ 31 ก.ค. 69</span>
                </th>
                <th className="py-3 px-3 text-right min-w-[130px]">
                  ยอดลูกหนี้ของเดือน
                  <span className="block text-[10px] text-blue-500 font-normal">ยอดตั้งใหม่</span>
                </th>
                <th className="py-3 px-3 text-right min-w-[130px]">
                  ยอดรับชำระ
                  <span className="block text-[10px] text-emerald-500 font-normal">ระหว่างเดือน</span>
                </th>
                <th className="py-3 px-3 text-right min-w-[110px]">
                  ยอดตัดหนี้สูญ
                  <span className="block text-[10px] text-slate-400 font-normal">ตัดจำหน่าย</span>
                </th>
                <th className="py-3 px-3 text-right min-w-[140px] bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200 font-bold">
                  ยอดลูกหนี้ยกไป
                  <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">คำนวณอัตโนมัติ</span>
                </th>
                <th className="py-3 px-2 text-center w-28">อายุหนี้ / แจ้งเตือน</th>
                <th className="py-3 px-3 min-w-[140px]">หมายเหตุ</th>
                {canEdit && <th className="py-3 px-2 text-center w-20">จัดการ</th>}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    ไม่พบรายการสิทธิที่ตรงกับเงื่อนไขการค้นหา
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isEditing = editingId === item.id;
                  const isOverdue = item.daysOverdue > 30 && item.remainingBalance > 0;

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        isEditing
                          ? 'bg-amber-50/60 dark:bg-amber-950/30'
                          : isOverdue
                          ? 'bg-rose-50/30 dark:bg-rose-950/15 hover:bg-rose-50/60'
                          : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      {/* 1. ลำดับ */}
                      <td className="py-2.5 px-2 text-center text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {item.orderNumber}
                      </td>

                      {/* 2. รหัส */}
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-700 dark:text-slate-300">
                        {item.code}
                      </td>

                      {/* 3. รายการสิทธิ */}
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-slate-900 dark:text-white">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            item.category === 'government' ? 'bg-blue-500' : 'bg-amber-500'
                          }`}></span>
                          <span>{item.category === 'government' ? 'หมวด 1: ภาครัฐ' : 'หมวด 2: บุคคลภายนอก'}</span>
                        </div>
                      </td>

                      {/* 4. ยอดลูกหนี้ยกมา */}
                      <td className="py-2.5 px-3 text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editForm.initialBalance ?? ''}
                            onChange={(e) => handleEditChange('initialBalance', parseFloat(e.target.value) || 0)}
                            className="w-full text-right bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-1.5 py-1 text-xs font-mono"
                          />
                        ) : (
                          <span className="font-mono text-slate-700 dark:text-slate-300">
                            {formatCurrency(item.initialBalance)}
                          </span>
                        )}
                      </td>

                      {/* 5. ยอดลูกหนี้ของเดือน (ยอดตั้งใหม่) */}
                      <td className="py-2.5 px-3 text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editForm.currentPeriodAdded ?? ''}
                            onChange={(e) => handleEditChange('currentPeriodAdded', parseFloat(e.target.value) || 0)}
                            className="w-full text-right bg-white dark:bg-slate-800 border border-blue-400 dark:border-blue-600 rounded-md px-1.5 py-1 text-xs font-mono text-blue-700 dark:text-blue-300"
                          />
                        ) : (
                          <span className={`font-mono font-medium ${item.currentPeriodAdded > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}>
                            {formatCurrency(item.currentPeriodAdded)}
                          </span>
                        )}
                      </td>

                      {/* 6. ยอดรับชำระระหว่างเดือน */}
                      <td className="py-2.5 px-3 text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editForm.receivedPayment ?? ''}
                            onChange={(e) => handleEditChange('receivedPayment', parseFloat(e.target.value) || 0)}
                            className="w-full text-right bg-white dark:bg-slate-800 border border-emerald-400 dark:border-emerald-600 rounded-md px-1.5 py-1 text-xs font-mono text-emerald-700 dark:text-emerald-300"
                          />
                        ) : (
                          <span className={`font-mono font-medium ${item.receivedPayment > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                            {formatCurrency(item.receivedPayment)}
                          </span>
                        )}
                      </td>

                      {/* 7. ยอดตัดหนี้สูญ */}
                      <td className="py-2.5 px-3 text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editForm.writeOff ?? ''}
                            onChange={(e) => handleEditChange('writeOff', parseFloat(e.target.value) || 0)}
                            className="w-full text-right bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-1.5 py-1 text-xs font-mono text-slate-700"
                          />
                        ) : (
                          <span className="font-mono text-slate-500">
                            {formatCurrency(item.writeOff)}
                          </span>
                        )}
                      </td>

                      {/* 8. ยอดลูกหนี้ยกไป (คำนวณอัตโนมัติ) */}
                      <td className="py-2.5 px-3 text-right bg-emerald-50/30 dark:bg-emerald-950/10 font-bold font-mono text-slate-900 dark:text-white">
                        {isEditing ? (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            ฿{formatCurrency(editForm.remainingBalance)}
                          </span>
                        ) : (
                          <span className={item.remainingBalance > 0 ? 'text-slate-900 dark:text-white' : 'text-slate-400'}>
                            {formatCurrency(item.remainingBalance)}
                          </span>
                        )}
                      </td>

                      {/* 9. อายุหนี้ / แจ้งเตือน */}
                      <td className="py-2.5 px-2 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              value={editForm.daysOverdue ?? 0}
                              onChange={(e) => handleEditChange('daysOverdue', parseInt(e.target.value) || 0)}
                              className="w-16 text-center bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md py-1 text-xs"
                              placeholder="วัน"
                            />
                            <span className="text-[10px] text-slate-400">วัน</span>
                          </div>
                        ) : isOverdue ? (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-bold border border-rose-300/60 dark:border-rose-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                            <span>{item.daysOverdue} วัน</span>
                          </div>
                        ) : item.remainingBalance > 0 ? (
                          <span className="text-[10px] text-slate-500 font-medium">
                            {item.daysOverdue > 0 ? `${item.daysOverdue} วัน` : 'รอบปัจจุบัน'}
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                            ครบถ้วน
                          </span>
                        )}
                      </td>

                      {/* 10. หมายเหตุ */}
                      <td className="py-2.5 px-3">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.remarks ?? ''}
                            onChange={(e) => handleEditChange('remarks', e.target.value)}
                            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-2 py-1 text-xs"
                            placeholder="หมายเหตุ..."
                          />
                        ) : (
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate block max-w-[160px]" title={item.remarks}>
                            {item.remarks || '-'}
                          </span>
                        )}
                      </td>

                      {/* 11. จัดการ */}
                      {canEdit && (
                        <td className="py-2.5 px-2 text-center">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => saveEdit(item.id)}
                                className="p-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                                title="บันทึก"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="p-1 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 transition-colors"
                                title="ยกเลิก"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1 opacity-70 hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => startEdit(item)}
                                className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
                                title="แก้ไขข้อมูลรายการนี้"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => deleteItem(item.id, item.name)}
                                className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                                title="ลบรายการ"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Table Footer with Summary Formulas */}
            <tfoot>
              {/* Category 1 Summary Row */}
              <tr className="bg-blue-50/70 dark:bg-blue-950/40 border-t-2 border-blue-200 dark:border-blue-900 font-bold text-xs text-blue-950 dark:text-blue-100">
                <td colSpan={3} className="py-3 px-3 text-right">
                  รวมหมวด 1: ลูกหนี้การค้า-หน่วยงานภาครัฐ (33 รายการ)
                </td>
                <td className="py-3 px-3 text-right font-mono">
                  {formatCurrency(stats.govSummary.initial)}
                </td>
                <td className="py-3 px-3 text-right font-mono text-blue-700 dark:text-blue-300">
                  {formatCurrency(stats.govSummary.added)}
                </td>
                <td className="py-3 px-3 text-right font-mono text-emerald-700 dark:text-emerald-400">
                  {formatCurrency(stats.govSummary.received)}
                </td>
                <td className="py-3 px-3 text-right font-mono">
                  {formatCurrency(stats.govSummary.writeOff)}
                </td>
                <td className="py-3 px-3 text-right font-mono text-blue-900 dark:text-blue-200 bg-blue-100/50 dark:bg-blue-900/30">
                  {formatCurrency(stats.govSummary.remaining)}
                </td>
                <td colSpan={3} className="py-3 px-3 text-center text-[11px] text-blue-800 dark:text-blue-300">
                  อัตราจัดเก็บ: {stats.govSummary.recoveryRate}%
                </td>
              </tr>

              {/* Category 2 Summary Row */}
              <tr className="bg-amber-50/70 dark:bg-amber-950/40 border-t border-amber-200 dark:border-amber-900 font-bold text-xs text-amber-950 dark:text-amber-100">
                <td colSpan={3} className="py-3 px-3 text-right">
                  รวมหมวด 2: ลูกหนี้การค้า - บุคคลภายนอก (19 รายการ)
                </td>
                <td className="py-3 px-3 text-right font-mono">
                  {formatCurrency(stats.extSummary.initial)}
                </td>
                <td className="py-3 px-3 text-right font-mono text-amber-700 dark:text-amber-300">
                  {formatCurrency(stats.extSummary.added)}
                </td>
                <td className="py-3 px-3 text-right font-mono text-emerald-700 dark:text-emerald-400">
                  {formatCurrency(stats.extSummary.received)}
                </td>
                <td className="py-3 px-3 text-right font-mono">
                  {formatCurrency(stats.extSummary.writeOff)}
                </td>
                <td className="py-3 px-3 text-right font-mono text-amber-900 dark:text-amber-200 bg-amber-100/50 dark:bg-amber-900/30">
                  {formatCurrency(stats.extSummary.remaining)}
                </td>
                <td colSpan={3} className="py-3 px-3 text-center text-[11px] text-amber-800 dark:text-amber-300">
                  อัตราจัดเก็บ: {stats.extSummary.recoveryRate}%
                </td>
              </tr>

              {/* Grand Total Row */}
              <tr className="bg-slate-900 text-white font-bold text-xs border-t-2 border-slate-700">
                <td colSpan={3} className="py-3.5 px-3 text-right uppercase tracking-wider text-emerald-400">
                  รวมทั้งสิ้น (Grand Total 52 สิทธิการรักษาพยาบาล)
                </td>
                <td className="py-3.5 px-3 text-right font-mono">
                  ฿{formatCurrency(stats.totalInitial)}
                </td>
                <td className="py-3.5 px-3 text-right font-mono text-blue-300">
                  ฿{formatCurrency(stats.totalAdded)}
                </td>
                <td className="py-3.5 px-3 text-right font-mono text-emerald-400">
                  ฿{formatCurrency(stats.totalReceived)}
                </td>
                <td className="py-3.5 px-3 text-right font-mono text-slate-300">
                  ฿{formatCurrency(stats.totalWriteOff)}
                </td>
                <td className="py-3.5 px-3 text-right font-mono text-emerald-300 bg-emerald-950/60">
                  ฿{formatCurrency(stats.totalRemaining)}
                </td>
                <td colSpan={3} className="py-3.5 px-3 text-center text-[11px] text-emerald-300">
                  จัดเก็บรวม {stats.overallRecoveryRate}% • หนี้คงเหลือ ณ 31 ส.ค. 69
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Add New Right Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                เพิ่มรายการสิทธิการรักษาพยาบาลใหม่
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    หมวดลูกหนี้
                  </label>
                  <select
                    value={newItem.category}
                    onChange={(e) => {
                      const cat = e.target.value as CategoryType;
                      setNewItem({
                        ...newItem,
                        category: cat,
                        code: cat === 'government' ? '1102050101.' : '1102050102.',
                      });
                    }}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850"
                  >
                    <option value="government">หมวด 1: ลูกหนี้ภาครัฐ (รหัส 1102050101)</option>
                    <option value="external">หมวด 2: บุคคลภายนอก (รหัส 1102050102)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    รหัสบัญชี
                  </label>
                  <input
                    type="text"
                    required
                    value={newItem.code}
                    onChange={(e) => setNewItem({ ...newItem, code: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 font-mono"
                    placeholder="e.g. 1102050101.999"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ชื่อสิทธิการรักษาพยาบาล
                </label>
                <input
                  type="text"
                  required
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850"
                  placeholder="e.g. ลูกหนี้ค่ารักษาพยาบาลกรณีพิเศษ..."
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    ยอดตั้งต้นยกมา
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newItem.initialBalance}
                    onChange={(e) => setNewItem({ ...newItem, initialBalance: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 font-mono text-right"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-blue-600 dark:text-blue-400 mb-1">
                    ยอดตั้งใหม่ของเดือน
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newItem.currentPeriodAdded}
                    onChange={(e) => setNewItem({ ...newItem, currentPeriodAdded: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs p-2 rounded-lg border border-blue-300 dark:border-blue-800 bg-white dark:bg-slate-850 font-mono text-right text-blue-700 dark:text-blue-300"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                    ยอดรับชำระ
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newItem.receivedPayment}
                    onChange={(e) => setNewItem({ ...newItem, receivedPayment: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs p-2 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-slate-850 font-mono text-right text-emerald-700 dark:text-emerald-300"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    ยอดตัดหนี้สูญ
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newItem.writeOff}
                    onChange={(e) => setNewItem({ ...newItem, writeOff: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 font-mono text-right"
                  />
                </div>
              </div>

              {/* Calculated Preview */}
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                  ยอดลูกหนี้คงเหลือยกไป (คำนวณอัตโนมัติ):
                </span>
                <span className="text-sm font-bold font-mono text-emerald-800 dark:text-emerald-300">
                  ฿{formatCurrency(calculateRowRemaining(newItem.initialBalance, newItem.currentPeriodAdded, newItem.receivedPayment, newItem.writeOff))}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    อายุหนี้ (จำนวนวัน)
                  </label>
                  <input
                    type="number"
                    value={newItem.daysOverdue}
                    onChange={(e) => setNewItem({ ...newItem, daysOverdue: parseInt(e.target.value) || 0 })}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    หมายเหตุ
                  </label>
                  <input
                    type="text"
                    value={newItem.remarks}
                    onChange={(e) => setNewItem({ ...newItem, remarks: e.target.value })}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850"
                    placeholder="เช่น รอผล e-Claim..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                >
                  เพิ่มรายการเข้าทะเบียนคุม
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
