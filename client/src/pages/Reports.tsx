import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Download, PieChart, CheckCircle2, DollarSign, Target, Award, ArrowDownToLine } from 'lucide-react';
import { apiRequest } from '../services/api';

export const Reports: React.FC = () => {
  const [salesData, setSalesData] = useState<any>(null);
  const [agileData, setAgileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const handleExport = async (type: 'deals' | 'contacts') => {
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
    }
  };

  const kpis = salesData?.kpis || {};

  return (
    <div className="space-y-6">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            Informes y Business Intelligence (BI)
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Análisis de rendimiento comercial, tasa de conversión y velocidad de entrega ágil
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleExport('deals')}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <ArrowDownToLine className="w-3.5 h-3.5 text-blue-600" />
            <span>Exportar Ventas (CSV)</span>
          </button>
          <button
            onClick={() => handleExport('contacts')}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-600" />
            <span>Exportar Contactos (CSV)</span>
          </button>
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

      {/* Main Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Projection Bar Chart */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span>Evolución Mensual de Facturación</span>
            </h2>
            <span className="text-[11px] text-gray-400">Últimos 6 Meses</span>
          </div>

          <div className="h-44 flex items-end justify-between gap-3 pt-6 px-2 border-b border-gray-200 dark:border-slate-800">
            {salesData?.monthlyRevenue?.map((m: any, idx: number) => {
              const maxVal = Math.max(...salesData.monthlyRevenue.map((item: any) => item.revenue));
              const heightPercent = maxVal > 0 ? (m.revenue / maxVal) * 100 : 20;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {(m.revenue / 1000).toFixed(0)}k€
                  </div>
                  <div
                    className="w-full bg-blue-600 hover:bg-blue-700 rounded-t-md transition-all duration-300 shadow-xs"
                    style={{ height: `${Math.max(heightPercent, 12)}%` }}
                  />
                  <span className="text-[11px] font-medium text-gray-500 mt-1">{m.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top 5 Accounts / Companies by Revenue */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center space-x-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Top 5 Clientes por Volumen de Negocio</span>
            </h2>
          </div>

          <div className="space-y-2.5 pt-2">
            {salesData?.topCompanies?.map((comp: any, idx: number) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-gray-900 dark:text-white">{comp.name}</div>
                    <div className="text-[10px] text-gray-500">{comp.dealsCount} tratos asociados</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-gray-900 dark:text-white">
                  {comp.total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
