import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  PieChart,
  CheckCircle2,
  DollarSign,
  Target,
  Award,
  ArrowDownToLine,
  Layers,
  ChevronDown,
  Building2,
  Users,
  FileSpreadsheet,
  Package,
  CheckSquare,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { BarChart, DonutChart } from '../components/ui/Charts';
import { useToast } from '../context/ToastContext';

export const Reports: React.FC = () => {
  const toast = useToast();
  const [salesData, setSalesData] = useState<any>(null);
  const [agileData, setAgileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [timePeriod, setTimePeriod] = useState<'30d' | '90d' | 'year'>('30d');

  useEffect(() => {
    async function loadReports() {
      setIsLoading(true);
      const [resSales, resAgile] = await Promise.all([
        apiRequest('/reports/sales'),
        apiRequest('/reports/velocity'),
      ]);

      if (resSales.success) setSalesData(resSales.data);
      if (resAgile.success) setAgileData(resAgile.data);
      setIsLoading(false);
    }
    loadReports();
  }, []);

  const handleExport = async (type: 'deals' | 'contacts' | 'companies' | 'invoices' | 'products' | 'tasks', label: string) => {
    setIsExportMenuOpen(false);
    toast.info('Generando exportación...', `Preparando archivo CSV de ${label}`);
    const res = await apiRequest(`/reports/export?type=${type}`);
    if (res.success && res.data) {
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv;charset=utf-8;' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Descarga completada', `Archivo CSV de ${label} descargado con éxito.`);
    } else {
      toast.error('Error al exportar', res.message || 'No se pudo generar el archivo.');
    }
  };

  const kpis = salesData?.kpis || {};

  const monthlyBarData =
    salesData?.monthlyRevenue?.map((m: any) => ({
      label: m.month,
      value: m.revenue,
      color: '#3B82F6',
    })) || [];

  const dealsDonutData = [
    { label: 'Ganadas', value: kpis.wonDealsCount || 0, color: '#10B981' },
    { label: 'Perdidas', value: kpis.lostDealsCount || 0, color: '#EF4444' },
    { label: 'En Curso', value: kpis.openDealsCount || 0, color: '#3B82F6' },
  ].filter((d) => d.value > 0);

  const agileDonutData = [
    { label: 'Hechas', value: agileData?.doneTasks || 0, color: '#10B981' },
    { label: 'En Curso', value: agileData?.inProgressTasks || 0, color: '#3B82F6' },
    { label: 'Revisión', value: agileData?.reviewTasks || 0, color: '#F59E0B' },
    { label: 'Por Hacer', value: agileData?.todoTasks || 0, color: '#8B5CF6' },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            Informes y Business Intelligence (BI)
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Análisis de rendimiento comercial, tasa de conversión y exportación universal de datos
          </p>
        </div>

        <div className="flex items-center space-x-2 relative">
          {/* Period selector */}
          <div className="flex bg-gray-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setTimePeriod('30d')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                timePeriod === '30d'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'
              }`}
            >
              30 días
            </button>
            <button
              onClick={() => setTimePeriod('90d')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                timePeriod === '90d'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'
              }`}
            >
              Trimestre
            </button>
            <button
              onClick={() => setTimePeriod('year')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                timePeriod === 'year'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'
              }`}
            >
              Año
            </button>
          </div>

          {/* Export Dropdown Menu */}
          <div className="relative">
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
              <span>Exportar Datos (CSV)</span>
              <ChevronDown className="w-3 h-3 ml-0.5" />
            </button>

            {isExportMenuOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-gray-200 dark:border-slate-800 py-1.5 z-20 animate-in fade-in">
                <button
                  onClick={() => handleExport('deals', 'Ventas y Oportunidades')}
                  className="w-full px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center space-x-2"
                >
                  <DollarSign className="w-3.5 h-3.5 text-blue-500" />
                  <span>Ventas y Oportunidades</span>
                </button>
                <button
                  onClick={() => handleExport('contacts', 'Contactos y Leads')}
                  className="w-full px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center space-x-2"
                >
                  <Users className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Contactos y Leads</span>
                </button>
                <button
                  onClick={() => handleExport('companies', 'Cuentas y Empresas')}
                  className="w-full px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center space-x-2"
                >
                  <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Cuentas y Empresas</span>
                </button>
                <button
                  onClick={() => handleExport('invoices', 'Facturas Emitidas')}
                  className="w-full px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center space-x-2"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-amber-500" />
                  <span>Facturas Emitidas</span>
                </button>
                <button
                  onClick={() => handleExport('products', 'Catálogo de Productos')}
                  className="w-full px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center space-x-2"
                >
                  <Package className="w-3.5 h-3.5 text-cyan-500" />
                  <span>Catálogo de Productos</span>
                </button>
                <button
                  onClick={() => handleExport('tasks', 'Tareas Técnicas')}
                  className="w-full px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center space-x-2"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-purple-500" />
                  <span>Tareas Técnicas Scrum</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">Ingresos Ganados</span>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {(kpis.totalWonRevenue || 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
          </div>
          <div className="mt-1 text-[11px] text-gray-500">
            {kpis.wonDealsCount || 0} acuerdos cerrados con éxito
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">Tasa de Cierre (Win Rate)</span>
          <div className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
            {kpis.winRate || 0}%
          </div>
          <div className="mt-1 text-[11px] text-gray-500">
            Ratio sobre oportunidades resueltas
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">Ticket Medio Ganado</span>
          <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {(kpis.averageDealSize || 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
          </div>
          <div className="mt-1 text-[11px] text-gray-500">
            Valor medio por venta cerrada
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">Tasa de Entrega Ágil</span>
          <div className="mt-2 text-2xl font-bold text-purple-600 dark:text-purple-400">
            {agileData?.completionRate || 0}%
          </div>
          <div className="mt-1 text-[11px] text-gray-500">
            {agileData?.doneTasks || 0} de {agileData?.totalTasks || 0} tareas completadas
          </div>
        </div>
      </div>

      {/* Main Analytics Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Projection Bar Chart */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span>Evolución Mensual de Facturación</span>
            </h2>
            <span className="text-[11px] text-gray-400">Tendencia Comercial</span>
          </div>

          <div className="pt-2">
            <BarChart
              data={monthlyBarData}
              height={220}
              valueFormatter={(val: number) => `${(val / 1000).toFixed(0)}k €`}
            />
          </div>
        </div>

        {/* Deals Status Distribution Donut Chart */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center space-x-2">
              <PieChart className="w-4 h-4 text-indigo-600" />
              <span>Distribución del Pipeline</span>
            </h2>
            <span className="text-[11px] text-gray-400">Total Oportunidades</span>
          </div>

          <div className="flex items-center justify-center pt-2">
            <DonutChart data={dealsDonutData} size={190} strokeWidth={24} />
          </div>
        </div>
      </div>

      {/* Sprint Velocity & Top Customers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sprint Velocity Tracking */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center space-x-2">
              <Layers className="w-4 h-4 text-purple-600" />
              <span>Velocidad de Sprints Técnicos</span>
            </h2>
            <span className="text-[11px] text-gray-400">Story Points</span>
          </div>

          <div className="space-y-3">
            {agileData?.sprintVelocity && agileData.sprintVelocity.length > 0 ? (
              agileData.sprintVelocity.map((s: any, idx: number) => {
                const pct = s.totalPoints > 0 ? Math.round((s.completedPoints / s.totalPoints) * 100) : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-gray-800 dark:text-slate-200">{s.name}</span>
                      <span className="text-gray-500 font-mono text-[11px]">
                        {s.completedPoints} / {s.totalPoints} pts ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-600 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-xs text-gray-400">
                No hay sprints registrados todavía.
              </div>
            )}
          </div>
        </div>

        {/* Top 5 Clients by Closed Revenue */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center space-x-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Top Clientes por Facturación</span>
            </h2>
            <span className="text-[11px] text-gray-400">Ranking Cartera</span>
          </div>

          <div className="space-y-2">
            {salesData?.topCompanies && salesData.topCompanies.length > 0 ? (
              salesData.topCompanies.map((c: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800"
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">
                      {c.name}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-gray-900 dark:text-white font-mono">
                    {c.total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-gray-400">
                No hay datos de clientes registrados aún.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
