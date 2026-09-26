import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  MapPin,
  FileSpreadsheet,
  Briefcase,
} from 'lucide-react';
import { apiRequest } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { ClockWidget } from './ClockWidget';

interface TimeRecord {
  id: string;
  employeeId: string;
  employee?: {
    id: string;
    jobTitle?: string;
    user?: {
      name: string;
      email: string;
    };
  };
  clockIn: string;
  clockOut?: string | null;
  durationMinutes?: number | null;
  reason?: string;
  ipAddress?: string;
  notes?: string;
  odooAttendanceId?: string | null;
  odooSyncStatus?: string;
}

export const TimeTrackingTab: React.FC<{ isManagerOrAdmin?: boolean }> = ({
  isManagerOrAdmin = false,
}) => {
  const { t } = useLanguage();
  const toast = useToast();
  const [records, setRecords] = useState<TimeRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncingOdoo, setSyncingOdoo] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [reasonFilter, setReasonFilter] = useState<string>('');

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (reasonFilter) params.reason = reasonFilter;

      const res = await apiRequest('/employees/time-tracking/history', { params });
      if (res.success && res.data) {
        setRecords(res.data);
      }
    } catch {
      toast.error(t('timeTracking.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [startDate, endDate, reasonFilter]);

  const handleSyncOdoo = async () => {
    setSyncingOdoo(true);
    try {
      const res = await apiRequest('/employees/time-tracking/sync-odoo', {
        method: 'POST',
      });
      if (res.success) {
        toast.success(t('timeTracking.odooSyncSuccess'));
        fetchRecords();
      } else {
        toast.error(res.message || t('timeTracking.odooSyncError'));
      }
    } catch {
      toast.error(t('timeTracking.odooSyncError'));
    } finally {
      setSyncingOdoo(false);
    }
  };

  const handleExportCSV = () => {
    if (records.length === 0) {
      toast.error(t('timeTracking.noRecordsToExport'));
      return;
    }

    const headers = ['ID', 'Empleado', 'Entrada', 'Salida', 'Duración (min)', 'Motivo', 'IP', 'Odoo Sync', 'Notas'];
    const rows = records.map((r) => [
      r.id,
      r.employee?.user?.name || 'N/A',
      new Date(r.clockIn).toLocaleString(),
      r.clockOut ? new Date(r.clockOut).toLocaleString() : 'En curso',
      r.durationMinutes || 0,
      r.reason || 'OFFICE',
      r.ipAddress || '127.0.0.1',
      r.odooSyncStatus || 'PENDING',
      r.notes || '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `fichajes_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(t('timeTracking.exportSuccess'));
  };

  // Calculations
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayMinutes = records
    .filter((r) => r.clockIn.startsWith(todayStr))
    .reduce((acc, r) => acc + (r.durationMinutes || 0), 0);

  const totalMinutes = records.reduce((acc, r) => acc + (r.durationMinutes || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const todayHours = (todayMinutes / 60).toFixed(1);

  const formatDuration = (mins?: number | null) => {
    if (!mins && mins !== 0) return '-';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const getReasonBadge = (reason?: string) => {
    const map: Record<string, { label: string; color: string }> = {
      OFFICE: { label: t('timeTracking.reasonOffice'), color: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300' },
      REMOTE: { label: t('timeTracking.reasonRemote'), color: 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300' },
      CLIENT_VISIT: { label: t('timeTracking.reasonClientVisit'), color: 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300' },
      TRAVEL: { label: t('timeTracking.reasonTravel'), color: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300' },
      MEDICAL: { label: t('timeTracking.reasonMedical'), color: 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300' },
      OVERTIME: { label: t('timeTracking.reasonOvertime'), color: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400' },
    };
    const r = map[reason || 'OFFICE'] || { label: reason || 'OFFICE', color: 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300' };
    return <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${r.color}`}>{r.label}</span>;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Real-time Clock Widget */}
      <ClockWidget onStatusChange={fetchRecords} />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">{t('timeTracking.kpiToday')}</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/50 rounded-xl text-blue-600 dark:text-blue-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-gray-900 dark:text-white">{todayHours}</span>
            <span className="text-xs text-gray-500">{t('timeTracking.hours')}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">{t('timeTracking.kpiTotal')}</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-gray-900 dark:text-white">{totalHours}</span>
            <span className="text-xs text-gray-500">{t('timeTracking.hours')}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">{t('timeTracking.kpiRecordsCount')}</span>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl text-indigo-600 dark:text-indigo-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-gray-900 dark:text-white">{records.length}</span>
            <span className="text-xs text-gray-500">{t('timeTracking.entries')}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">{t('timeTracking.kpiOdooSync')}</span>
            <div className="p-2 bg-purple-50 dark:bg-purple-950/50 rounded-xl text-purple-600 dark:text-purple-400">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              {records.filter((r) => r.odooSyncStatus === 'SYNCED').length} / {records.length}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Actions Bar */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-gray-400 mr-1" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-gray-700 dark:text-slate-200 focus:outline-none"
            />
            <span className="text-gray-400">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-gray-700 dark:text-slate-200 focus:outline-none"
            />
          </div>

          <select
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
            className="bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-gray-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="">{t('timeTracking.allReasons')}</option>
            <option value="OFFICE">{t('timeTracking.reasonOffice')}</option>
            <option value="REMOTE">{t('timeTracking.reasonRemote')}</option>
            <option value="CLIENT_VISIT">{t('timeTracking.reasonClientVisit')}</option>
            <option value="TRAVEL">{t('timeTracking.reasonTravel')}</option>
            <option value="MEDICAL">{t('timeTracking.reasonMedical')}</option>
            <option value="OVERTIME">{t('timeTracking.reasonOvertime')}</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-800 text-xs font-semibold text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('timeTracking.exportCSV')}</span>
          </button>

          <button
            onClick={handleSyncOdoo}
            disabled={syncingOdoo}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-xs font-bold text-white shadow-xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncingOdoo ? 'animate-spin' : ''}`} />
            <span>{syncingOdoo ? t('timeTracking.syncing') : t('timeTracking.syncOdoo')}</span>
          </button>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center space-x-2">
            <span>{t('timeTracking.recordsTitle')}</span>
            <span className="px-2 py-0.5 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 text-xs font-mono rounded-full">
              {records.length}
            </span>
          </h3>
          <span className="text-xs text-gray-400 font-medium">
            {t('timeTracking.legalRecordCompliance')}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/50 text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                {isManagerOrAdmin && <th className="py-3 px-4">{t('timeTracking.employeeCol')}</th>}
                <th className="py-3 px-4">{t('timeTracking.dateCol')}</th>
                <th className="py-3 px-4">{t('timeTracking.clockInCol')}</th>
                <th className="py-3 px-4">{t('timeTracking.clockOutCol')}</th>
                <th className="py-3 px-4">{t('timeTracking.durationCol')}</th>
                <th className="py-3 px-4">{t('timeTracking.reasonCol')}</th>
                <th className="py-3 px-4">{t('timeTracking.ipCol')}</th>
                <th className="py-3 px-4">{t('timeTracking.odooCol')}</th>
                <th className="py-3 px-4">{t('timeTracking.notesCol')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={isManagerOrAdmin ? 9 : 8} className="py-8 text-center text-gray-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                    {t('loading')}
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={isManagerOrAdmin ? 9 : 8} className="py-8 text-center text-gray-400">
                    {t('timeTracking.noRecordsFound')}
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/75 dark:hover:bg-slate-800/40 transition">
                    {isManagerOrAdmin && (
                      <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">
                        {r.employee?.user?.name || 'N/A'}
                      </td>
                    )}
                    <td className="py-3 px-4 text-gray-600 dark:text-slate-300 font-medium">
                      {new Date(r.clockIn).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      {new Date(r.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {r.clockOut ? (
                        <span className="font-semibold text-rose-600 dark:text-rose-400">
                          {new Date(r.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                          {t('active')}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      {formatDuration(r.durationMinutes)}
                    </td>
                    <td className="py-3 px-4">{getReasonBadge(r.reason)}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-gray-400">{r.ipAddress || '127.0.0.1'}</td>
                    <td className="py-3 px-4">
                      {r.odooSyncStatus === 'SYNCED' ? (
                        <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                          <CheckCircle className="w-3 h-3" />
                          <span>Odoo</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-400 font-mono">Local</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-500 dark:text-slate-400 italic max-w-[200px] truncate">
                      {r.notes || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
