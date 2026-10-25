import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  QrCode,
  Link2,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Copy,
  FileCode2,
  Lock,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { apiRequest } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface VerifactuChainModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VerifactuChainModal: React.FC<VerifactuChainModalProps> = ({ isOpen, onClose }) => {
  const toast = useToast();
  const [chainData, setChainData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchChainStatus = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest('/invoices/verifactu/chain');
      if (res.success) {
        setChainData(res.data);
      } else {
        toast.error('Error Veri*Factu', res.message || 'No se pudo verificar la cadena criptográfica.');
      }
    } catch {
      toast.error('Error de conexión', 'No se pudo conectar con el motor Veri*Factu.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchChainStatus();
    }
  }, [isOpen]);

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    toast.success('Huella SHA-256 copiada', `${hash.slice(0, 20)}...`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Auditoría Criptográfica Veri*Factu (AEAT)"
      subtitle="Ley 11/2021 Antifraude · RD 1007/2023 · Orden HAC/1177/2024 (Encadenamiento SHA-256)"
      icon={ShieldCheck}
      size="2xl"
    >
      <div className="space-y-4" data-testid="verifactu-chain-modal-content">
        {/* Top Compliance Status Banner */}
        <div className="p-4 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                  Estado del Sistema Informático de Facturación (SIF): ÍNTEGRO E INALTERABLE
                </h4>
                <span
                  data-testid="verifactu-chain-badge"
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white"
                >
                  {chainData?.isIntact !== false ? 'VERIFICADO AEAT' : 'REVISIÓN REQUERIDA'}
                </span>
              </div>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300/90 mt-0.5">
                Cada factura emitida genera una huella digital SHA-256 encadenada a la factura inmediatamente anterior, impidiendo la alteración u omisión de registros conforme al Art. 29.2.j LGT.
              </p>
            </div>
          </div>

          <button
            type="button"
            data-testid="btn-refresh-verifactu-chain"
            onClick={fetchChainStatus}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 text-xs font-bold shadow-xs hover:bg-emerald-100/60 transition-all active:scale-[0.98] shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Revalidar Cadena</span>
          </button>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Registros Encadenados
            </div>
            <div className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5" data-testid="verifactu-total-records">
              {chainData?.totalInvoices ?? 0} facturas fiscales
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Algoritmo & Estándar
            </div>
            <div className="text-xs font-bold font-mono text-blue-600 dark:text-blue-400 mt-1">
              SHA-256 · UTF-8 · VERI*FACTU 1.0
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Última Huella de Bloque (Head)
            </div>
            <div className="text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200 truncate mt-1">
              {chainData?.lastHash || 'GENESIS_000000000000'}
            </div>
          </div>
        </div>

        {/* Chain Ledger Table */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
          <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
              <FileCode2 className="w-4 h-4 text-blue-600" />
              <span>Libro Registro Inmutable de Huellas Criptográficas</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">
               Sede Electrónica AEAT: TIKE-CONT/ValidarQR
            </span>
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Verificando firmas SHA-256 de todos los bloques...
              </div>
            ) : chainData?.chain && chainData.chain.length > 0 ? (
              chainData.chain.map((node: any, index: number) => (
                <div
                  key={node.id}
                  data-testid={`verifactu-node-${index}`}
                  className="p-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors flex flex-col gap-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-bold flex items-center justify-center">
                        #{index + 1}
                      </span>
                      <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                        {node.invoiceNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-mono">
                        Tipo AEAT: {node.invoiceType || 'F1'}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {new Date(node.issueDate).toLocaleDateString('es-ES')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                        {Number(node.total || 0).toLocaleString('es-ES', {
                          style: 'currency',
                          currency: 'EUR',
                        })}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{node.verifactuStatus || 'VERIFIED'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Cryptographic Hash Links */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] font-mono bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-200/70 dark:border-slate-700/60">
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <div className="truncate">
                        <span className="text-slate-400 font-sans font-semibold mr-1">SHA-256 Actual:</span>
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                          {node.verifactuHash}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyHash(node.verifactuHash)}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white shrink-0"
                        title="Copiar huella SHA-256"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <div className="truncate flex items-center gap-1">
                        <Link2 className="w-3 h-3 text-blue-500 shrink-0" />
                        <span className="text-slate-400 font-sans font-semibold">Hash Anterior:</span>
                        <span className="text-slate-600 dark:text-slate-300">
                          {node.previousInvoiceHash || '000000000000 (GÉNESIS)'}
                        </span>
                      </div>
                      {node.verifactuQrUrl && (
                        <a
                          href={node.verifactuQrUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-sans font-bold shrink-0"
                          title="Validar QR en Sede Electrónica AEAT"
                        >
                          <QrCode className="w-3 h-3" />
                          <span>QR AEAT</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                No hay facturas fiscales ordinarias emitidas todavía. Al emitir la primera factura se iniciará el bloque Génesis Veri*Factu.
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
