import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  Database,
  FileText,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { soundService } from '../../services/sound';
import { apiRequest } from '../../services/api';

export type ImportTargetType = 'invoices' | 'inventory' | 'contacts';

interface ExcelCsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: ImportTargetType;
  onSuccess?: () => void;
  onImportSuccess?: () => void;
}

export const ExcelCsvImportModal: React.FC<ExcelCsvImportModalProps> = ({
  isOpen,
  onClose,
  targetType,
  onSuccess,
  onImportSuccess,
}) => {
  const { t } = useLanguage();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  const targetConfig = {
    invoices: {
      title: 'Importador Masivo de Facturas & Cobros',
      subtitle: 'Carga archivos Excel o CSV con tus facturas para registrarlas de forma automática en la base de datos.',
      endpoint: '/invoices/import',
      templateName: 'plantilla_facturas_dama.csv',
      exampleColumns: 'NumeroFactura, Cliente, BaseImponible, IVA_Pct, Total, FechaEmision, Estado',
      sampleHeader: 'invoiceNumber,clientName,subtotal,taxRate,total,issueDate,status',
      sampleRow: 'FAC-2026-901,Acme Corporation S.L.,1500.00,21,1815.00,2026-09-27,PAID',
    },
    inventory: {
      title: 'Importador Masivo de Catálogo & Existencias',
      subtitle: 'Actualiza el inventario completo, crea nuevos productos y sincroniza precios de compra/venta.',
      endpoint: '/inventory/import',
      templateName: 'plantilla_inventario_dama.csv',
      exampleColumns: 'SKU, Nombre, Categoria, PrecioVenta, PrecioCoste, Stock, StockMinimo, Ubicacion',
      sampleHeader: 'sku,name,category,price,costPrice,stock,minStock,location,supplierName',
      sampleRow: 'SKU-LOG-01,Router Fibra Pro AX6000,Redes,189.90,95.00,45,10,Pasillo A-04,Tech Supplies SL',
    },
    contacts: {
      title: 'Importador Masivo de Contactos & Cuentas',
      subtitle: 'Importa listas de contactos, leads comerciales o clientes desde tu hoja de cálculo.',
      endpoint: '/contacts/import',
      templateName: 'plantilla_contactos_dama.csv',
      exampleColumns: 'Nombre, Apellidos, Email, Telefono, Empresa, Cargo, EsLead',
      sampleHeader: 'firstName,lastName,email,phone,company,position,isLead',
      sampleRow: 'Laura,Martínez,laura.m@empresa.com,+34 600 112 233,Innova Corp,Directora de Operaciones,false',
    },
  }[targetType];

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const csvContent = '\uFEFF' + `${targetConfig.sampleHeader}\r\n${targetConfig.sampleRow}\r\n`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = targetConfig.templateName;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
    toast.info('Plantilla Descargada', `Se ha generado el archivo modelo ${targetConfig.templateName}`);
  };

  const parseCsvText = (text: string) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      throw new Error('El archivo no contiene suficientes filas para importar.');
    }

    // Determine delimiter (; or ,)
    const delimiter = lines[0].includes(';') ? ';' : ',';
    const rawHeaders = lines[0].split(delimiter).map((h) => h.replace(/^["']|["']$/g, '').trim());
    setHeaders(rawHeaders);

    const rows: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(delimiter).map((p) => p.replace(/^["']|["']$/g, '').trim());
      const rowObj: any = {};
      rawHeaders.forEach((header, index) => {
        const key = header.toLowerCase().replace(/[^a-z0-9]/g, '');
        rowObj[key] = parts[index] || '';
      });

      // Normalize common keys based on targetType
      if (targetType === 'invoices') {
        rows.push({
          invoiceNumber: rowObj.numerofactura || rowObj.invoicenumber || rowObj.codigo || `IMP-${i}`,
          clientName: rowObj.cliente || rowObj.clientname || rowObj.empresa || rowObj.company || 'Cliente Importado',
          clientTaxId: rowObj.cif || rowObj.nif || rowObj.taxid || null,
          subtotal: parseFloat(rowObj.baseimponible || rowObj.subtotal || rowObj.base || '0') || 0,
          taxRate: parseFloat(rowObj.ivapct || rowObj.taxrate || rowObj.iva || '21') || 21,
          total: parseFloat(rowObj.total || rowObj.importe || '0') || undefined,
          issueDate: rowObj.fechaemision || rowObj.issuedate || rowObj.fecha || new Date().toISOString(),
          status: rowObj.estado || rowObj.status || 'PAID',
        });
      } else if (targetType === 'inventory') {
        rows.push({
          sku: rowObj.sku || rowObj.codigo || `SKU-IMP-${i}`,
          name: rowObj.nombre || rowObj.productname || rowObj.producto || `Artículo ${i}`,
          category: rowObj.categoria || rowObj.category || 'General',
          price: parseFloat(rowObj.precioventa || rowObj.price || rowObj.pvp || '0') || 0,
          costPrice: parseFloat(rowObj.preciocoste || rowObj.costprice || rowObj.coste || '0') || 0,
          stock: parseInt(rowObj.stock || rowObj.existencias || rowObj.cantidad || '0', 10) || 0,
          minStock: parseInt(rowObj.stockminimo || rowObj.minstock || '5', 10) || 5,
          location: rowObj.ubicacion || rowObj.location || '',
          supplierName: rowObj.proveedor || rowObj.suppliername || '',
          barcode: rowObj.codigobarras || rowObj.barcode || '',
          isActive: true,
        });
      } else if (targetType === 'contacts') {
        rows.push({
          firstName: rowObj.nombre || rowObj.firstname || `Contacto ${i}`,
          lastName: rowObj.apellidos || rowObj.lastname || '',
          email: rowObj.email || rowObj.correo || `importado_${i}@dama.local`,
          phone: rowObj.telefono || rowObj.phone || '',
          company: rowObj.empresa || rowObj.company || '',
          position: rowObj.cargo || rowObj.position || '',
          isLead: rowObj.eslead === 'true' || rowObj.eslead === '1' || rowObj.lead === 'true',
        });
      }
    }

    setParsedRows(rows);
  };

  const handleFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        parseCsvText(text);
        soundService.play('action');
        toast.success('Archivo Procesado', `Se han detectado ${file.name} con datos listos para validar.`);
      } catch (err: any) {
        toast.error('Error de lectura', err.message || 'El formato del archivo no es compatible.');
        setParsedRows([]);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleExecuteImport = async () => {
    if (parsedRows.length === 0) return;
    setIsProcessing(true);
    setImportProgress(25);

    try {
      setImportProgress(60);
      const res = await apiRequest(targetConfig.endpoint, {
        method: 'POST',
        body: JSON.stringify({ items: parsedRows }),
      });

      setImportProgress(100);

      if (res.success) {
        soundService.play('success');
        toast.success(
          'Importación Exitosa',
          res.message || `Se han guardado ${parsedRows.length} registros en la base de datos.`
        );
        if (onSuccess) onSuccess();
        if (onImportSuccess) onImportSuccess();
        onClose();
      } else {
        soundService.play('alert');
        toast.error('Fallo en la importación', res.message || 'Verifica los datos del archivo.');
      }
    } catch (err: any) {
      toast.error('Error de servidor', err.message || 'No se pudo completar la operación.');
    } finally {
      setIsProcessing(false);
      setImportProgress(0);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl border border-gray-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 to-transparent">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                {targetConfig.title}
              </h2>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                {targetConfig.subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Dropzone Area */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-3 ${
              isDragging
                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 scale-[1.01]'
                : 'border-gray-300 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/30 hover:bg-gray-100/60 dark:hover:bg-slate-800/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,.txt"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFile(e.target.files[0]);
                }
              }}
            />

            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
              <UploadCloud className="w-6 h-6 animate-bounce-subtle" />
            </div>

            <div>
              <p className="text-xs font-bold text-gray-800 dark:text-slate-200">
                Arrastra tu archivo Excel / CSV aquí o haz clic para seleccionarlo
              </p>
              <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">
                Formatos soportados: .CSV (separado por comas o punto y coma), .XLS, .XLSX
              </p>
            </div>

            {fileName && (
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono text-[11px] font-semibold border border-emerald-300 dark:border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{fileName} ({parsedRows.length} filas detectadas)</span>
              </div>
            )}
          </div>

          {/* Template helper banner */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 text-xs">
            <div className="flex items-center space-x-2 text-blue-900 dark:text-blue-300">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>¿Necesitas una plantilla de ejemplo estructurada?</span>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
            >
              <span>Descargar Modelo CSV</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Table Preview Grid */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-800 dark:text-slate-200">
                  Vista Previa de Filas a Ingerir ({parsedRows.length} registros listos):
                </span>
                <span className="text-gray-400 text-[11px]">Mostrando las primeras 5 filas</span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-800 max-h-56">
                <table className="w-full text-left text-[11px] text-gray-600 dark:text-slate-300">
                  <thead className="bg-gray-50 dark:bg-slate-800/80 font-bold text-gray-700 dark:text-slate-300 border-b border-gray-200 dark:border-slate-800 sticky top-0">
                    <tr>
                      {Object.keys(parsedRows[0] || {}).map((key) => (
                        <th key={key} className="px-3 py-2 whitespace-nowrap uppercase">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60 font-mono">
                    {parsedRows.slice(0, 5).map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30">
                        {Object.values(row).map((val: any, j) => (
                          <td key={j} className="px-3 py-1.5 whitespace-nowrap">
                            {String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gray-50/50 dark:bg-slate-900/50">
          <span className="text-[11px] text-gray-400">
            Los registros importados se asignan de forma aislada a tu empresa.
          </span>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={parsedRows.length === 0 || isProcessing}
              className="inline-flex items-center space-x-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-95 disabled:opacity-50"
            >
              <Database className="w-4 h-4" />
              <span>{isProcessing ? 'Ingiriendo datos...' : `Importar ${parsedRows.length} Registros`}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
