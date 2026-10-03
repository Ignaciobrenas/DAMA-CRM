import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Users,
  Server,
  Activity,
  DollarSign,
  Briefcase,
  AlertTriangle,
  FileText
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { apiRequest } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { ThinkingOrb } from 'thinking-orbs';

const COLORS = ['#2563EB', '#64748B', '#F59E0B', '#10B981', '#EF4444'];

export const AdminBI: React.FC = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const res = await apiRequest('/reports/admin-bi');
      if (res.success) {
        setData(res.data);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <ThinkingOrb state="working" size={64} />
        <p className="mt-6 text-sm font-semibold text-slate-500 animate-pulse">Analizando ecosistema...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-slate-500">
        <AlertTriangle className="w-10 h-10 mb-4 opacity-50" />
        <p className="font-semibold text-sm">Error cargando métricas BI</p>
      </div>
    );
  }

  const { system, database, charts, auditLogs } = data;

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('bi.title', 'Business Intelligence')}</h1>
        <p className="text-sm text-slate-500 mt-1">
          {t('bi.description', 'Métricas de uso, crecimiento y rendimiento del ecosistema completo.')}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Facturación Global', value: `${(database.totalPaidRevenue || 0).toLocaleString('es-ES')} €`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
          { label: 'Usuarios Activos', value: database.userCount, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/30' },
          { label: 'Deals & Oportunidades', value: database.dealCount, icon: Briefcase, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/30' },
          { label: 'Uso de Memoria (RAM)', value: `${system.memoryUsageMb.heapUsed} MB`, icon: Server, color: 'text-slate-600', bg: 'bg-slate-100 dark:bg-slate-800' },
        ].map((kpi, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm flex items-center gap-4"
          >
            <div className={`p-3 rounded-2xl ${kpi.bg}`}>
              <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{kpi.label}</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{kpi.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Revenue Line Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6">Crecimiento de Facturación (Últimos Meses)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer>
              <LineChart data={charts?.revenueByMonth || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dx={-10} tickFormatter={(val) => `${val}€`} />
                <Tooltip 
                  cursor={{ stroke: '#E2E8F0', strokeWidth: 2 }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="total" stroke="#2563EB" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Deals Status Pie Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6">Distribución de Oportunidades (Deals)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={charts?.dealsByStatus || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(charts?.dealsByStatus || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* System Health & Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-slate-900 text-white rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Server className="w-32 h-32" />
          </div>
          <h3 className="text-sm font-bold mb-6">Salud del Servidor</h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-400">Plataforma</p>
              <p className="font-semibold">{system.platform} / {system.nodeVersion}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Uptime</p>
              <p className="font-semibold">{Math.floor(system.uptimeSeconds / 3600)} horas, {Math.floor((system.uptimeSeconds % 3600) / 60)} mins</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Carga de Memoria RSS</p>
              <div className="w-full bg-slate-800 rounded-full h-2 mt-2">
                <div className="bg-emerald-400 h-2 rounded-full" style={{ width: `${Math.min((system.memoryUsageMb.rss / 1024) * 100, 100)}%` }}></div>
              </div>
              <p className="text-xs text-right mt-1 text-slate-400">{system.memoryUsageMb.rss} MB</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <Activity className="w-5 h-5 text-slate-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Últimas Acciones Registradas (Auditoría)</h3>
          </div>
          <div className="flex-1 overflow-auto hide-scrollbar p-0">
            <table className="w-full text-left text-xs">
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {auditLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="px-5 py-3 font-semibold text-slate-700 dark:text-slate-300">{log.action}</td>
                    <td className="px-5 py-3 text-slate-500">{log.entity}</td>
                    <td className="px-5 py-3 text-slate-400 text-right">{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
};
