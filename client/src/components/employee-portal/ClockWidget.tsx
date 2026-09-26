import React, { useState, useEffect } from 'react';
import { Clock, Play, Square, CheckCircle2, AlertCircle, RefreshCw, MapPin } from 'lucide-react';
import { apiRequest } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';

export interface ClockStatus {
  isClockedIn: boolean;
  activeRecord: {
    id: string;
    clockIn: string;
    reason?: string;
    notes?: string;
  } | null;
  todayMinutes: number;
  todayRecordCount: number;
}

export const ClockWidget: React.FC<{ compact?: boolean; onStatusChange?: () => void }> = ({
  compact = false,
  onStatusChange,
}) => {
  const { t } = useLanguage();
  const toast = useToast();
  const [status, setStatus] = useState<ClockStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedReason, setSelectedReason] = useState<string>('OFFICE');
  const [notes, setNotes] = useState<string>('');
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  const fetchStatus = async () => {
    try {
      const res = await apiRequest('/employees/time-tracking/status');
      if (res.success && res.data) {
        setStatus(res.data);
      }
    } catch {
      // Ignored in background polling
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 60000); // 1 min poll
    return () => clearInterval(interval);
  }, []);

  // Timer counter when clocked in
  useEffect(() => {
    if (!status?.isClockedIn || !status.activeRecord?.clockIn) {
      setElapsedSeconds(0);
      return;
    }

    const startTime = new Date(status.activeRecord.clockIn).getTime();
    const updateElapsed = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((now - startTime) / 1000));
      setElapsedSeconds(diff);
    };

    updateElapsed();
    const timer = setInterval(updateElapsed, 1000);
    return () => clearInterval(timer);
  }, [status?.isClockedIn, status?.activeRecord?.clockIn]);

  const formatTimer = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const handleClockIn = async () => {
    setActionLoading(true);
    try {
      const res = await apiRequest('/employees/time-tracking/clock-in', {
        method: 'POST',
        body: JSON.stringify({
          reason: selectedReason,
          notes: notes.trim() || undefined,
        }),
      });

      if (res.success) {
        toast.success(t('timeTracking.clockInSuccess'));
        setIsModalOpen(false);
        setNotes('');
        await fetchStatus();
        if (onStatusChange) onStatusChange();
      } else {
        toast.error(res.message || t('timeTracking.clockInError'));
      }
    } catch {
      toast.error(t('timeTracking.clockInError'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    setActionLoading(true);
    try {
      const res = await apiRequest('/employees/time-tracking/clock-out', {
        method: 'POST',
        body: JSON.stringify({ notes: notes.trim() || undefined }),
      });

      if (res.success) {
        toast.success(t('timeTracking.clockOutSuccess'));
        setNotes('');
        await fetchStatus();
        if (onStatusChange) onStatusChange();
      } else {
        toast.error(res.message || t('timeTracking.clockOutError'));
      }
    } catch {
      toast.error(t('timeTracking.clockOutError'));
    } finally {
      setActionLoading(false);
    }
  };

  const reasons = [
    { value: 'OFFICE', label: t('timeTracking.reasonOffice') },
    { value: 'REMOTE', label: t('timeTracking.reasonRemote') },
    { value: 'CLIENT_VISIT', label: t('timeTracking.reasonClientVisit') },
    { value: 'TRAVEL', label: t('timeTracking.reasonTravel') },
    { value: 'MEDICAL', label: t('timeTracking.reasonMedical') },
    { value: 'OVERTIME', label: t('timeTracking.reasonOvertime') },
  ];

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        {status?.isClockedIn ? (
          <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-2.5 py-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
              {formatTimer(elapsedSeconds)}
            </span>
            <button
              onClick={handleClockOut}
              disabled={actionLoading}
              title={t('timeTracking.clockOut')}
              className="p-1 text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-500/10 rounded"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={actionLoading}
            className="flex items-center space-x-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition"
          >
            <Play className="w-3 h-3 fill-current" />
            <span className="hidden sm:inline">{t('timeTracking.clockIn')}</span>
          </button>
        )}

        {/* Modal de Fichaje Entrada */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-blue-50 dark:bg-blue-950/50 rounded-xl text-blue-600 dark:text-blue-400">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-base">
                      {t('timeTracking.modalTitle')}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      {t('timeTracking.modalSubtitle')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                    {t('timeTracking.selectReason')}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {reasons.map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setSelectedReason(r.value)}
                        className={`px-3 py-2 text-xs font-medium rounded-xl border text-left transition flex items-center justify-between ${
                          selectedReason === r.value
                            ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500'
                            : 'border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300'
                        }`}
                      >
                        <span>{r.label}</span>
                        {selectedReason === r.value && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 ml-1" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                    {t('timeTracking.notesOptional')}
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t('timeTracking.notesPlaceholder')}
                    className="w-full text-xs rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 p-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleClockIn}
                  disabled={actionLoading}
                  className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition flex items-center space-x-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{actionLoading ? t('loading') : t('timeTracking.confirmClockIn')}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Extended view for widgets or portal headers
  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              status?.isClockedIn
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/20'
                : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400'
            }`}
          >
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-gray-900 dark:text-white text-base">
                {status?.isClockedIn ? t('timeTracking.clockedInStatus') : t('timeTracking.notClockedInStatus')}
              </span>
              <span
                className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                  status?.isClockedIn
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                    : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                }`}
              >
                {status?.isClockedIn ? t('active') : t('inactive')}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              {status?.isClockedIn && status.activeRecord?.reason
                ? `${t('timeTracking.currentReason')}: ${status.activeRecord.reason}`
                : t('timeTracking.dailyLegalNotice')}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {status?.isClockedIn && (
            <div className="text-right mr-2">
              <div className="font-mono text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                {formatTimer(elapsedSeconds)}
              </div>
              <div className="text-[10px] text-gray-400 font-medium">
                {t('timeTracking.sessionTime')}
              </div>
            </div>
          )}

          {status?.isClockedIn ? (
            <button
              onClick={handleClockOut}
              disabled={actionLoading}
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-md hover:shadow-lg transition flex items-center space-x-2"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>{actionLoading ? t('loading') : t('timeTracking.clockOut')}</span>
            </button>
          ) : (
            <button
              onClick={() => setIsModalOpen(true)}
              disabled={actionLoading}
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition flex items-center space-x-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{actionLoading ? t('loading') : t('timeTracking.clockIn')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Modal de Fichaje Entrada */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/50 rounded-xl text-blue-600 dark:text-blue-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">
                    {t('timeTracking.modalTitle')}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    {t('timeTracking.modalSubtitle')}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                  {t('timeTracking.selectReason')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {reasons.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setSelectedReason(r.value)}
                      className={`px-3 py-2 text-xs font-medium rounded-xl border text-left transition flex items-center justify-between ${
                        selectedReason === r.value
                          ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500'
                          : 'border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300'
                      }`}
                    >
                      <span>{r.label}</span>
                      {selectedReason === r.value && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 ml-1" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                  {t('timeTracking.notesOptional')}
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('timeTracking.notesPlaceholder')}
                  className="w-full text-xs rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 p-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handleClockIn}
                disabled={actionLoading}
                className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition flex items-center space-x-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{actionLoading ? t('loading') : t('timeTracking.confirmClockIn')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
