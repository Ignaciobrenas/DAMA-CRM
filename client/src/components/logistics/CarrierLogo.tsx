import React, { useState } from 'react';

export interface CarrierMetadata {
  code: string;
  name: string;
  shortName: string;
  color: string;
  textColor: string;
  bgBadge: string;
  logoFile?: string;
  serviceType: string;
  slaHours: number;
  baseRateEur: number;
}

export const CARRIERS_CATALOG: Record<string, CarrierMetadata> = {
  GLS: {
    code: 'GLS',
    name: 'GLS Spain (BusinessParcel)',
    shortName: 'GLS',
    color: '#002B7F',
    textColor: '#FFB800',
    bgBadge: 'bg-blue-50 text-blue-900 dark:bg-blue-950/60 dark:text-blue-200 border-blue-200 dark:border-blue-800',
    logoFile: './assets/carriers/gls.svg',
    serviceType: 'BusinessParcel 24h',
    slaHours: 24,
    baseRateEur: 5.45,
  },
  NACEX: {
    code: 'NACEX',
    name: 'NACEX (e-N@cex 19:00h)',
    shortName: 'NACEX',
    color: '#FF5000',
    textColor: '#FFFFFF',
    bgBadge: 'bg-orange-50 text-orange-900 dark:bg-orange-950/60 dark:text-orange-200 border-orange-200 dark:border-orange-800',
    logoFile: './assets/carriers/nacex.svg',
    serviceType: 'NACEX 19:00h Garantizado',
    slaHours: 19,
    baseRateEur: 6.2,
  },
  AMAZON: {
    code: 'AMAZON',
    name: 'Amazon Shipping / FBA',
    shortName: 'Amazon',
    color: '#232F3E',
    textColor: '#FF9900',
    bgBadge: 'bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 border-amber-200 dark:border-amber-800',
    logoFile: './assets/carriers/amazon.svg',
    serviceType: 'Amazon Prime Logistics',
    slaHours: 24,
    baseRateEur: 4.95,
  },
  CORREOS_EXPRESS: {
    code: 'CORREOS_EXPRESS',
    name: 'Correos Express (Paq 24)',
    shortName: 'Correos Exp.',
    color: '#002E5D',
    textColor: '#FFCD00',
    bgBadge: 'bg-yellow-50 text-yellow-900 dark:bg-yellow-950/60 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800',
    logoFile: './assets/carriers/correos-express.svg',
    serviceType: 'Paq 24 Empresarial',
    slaHours: 24,
    baseRateEur: 5.15,
  },
  CORREOS: {
    code: 'CORREOS',
    name: 'Correos España (Paq Estándar)',
    shortName: 'Correos',
    color: '#FFCD00',
    textColor: '#002E5D',
    bgBadge: 'bg-amber-50 text-blue-950 dark:bg-amber-950/60 dark:text-amber-200 border-amber-300',
    logoFile: './assets/carriers/correos.svg',
    serviceType: 'Paq Estándar 48/72h',
    slaHours: 48,
    baseRateEur: 3.9,
  },
  DHL: {
    code: 'DHL',
    name: 'DHL Express / Parcel Iberia',
    shortName: 'DHL',
    color: '#D40511',
    textColor: '#FFCC00',
    bgBadge: 'bg-red-50 text-red-900 dark:bg-red-950/60 dark:text-red-200 border-red-200 dark:border-red-800',
    logoFile: './assets/carriers/dhl.svg',
    serviceType: 'DHL Express Worldwide',
    slaHours: 24,
    baseRateEur: 8.5,
  },
  SEUR: {
    code: 'SEUR',
    name: 'SEUR Geopost (SEUR 24)',
    shortName: 'SEUR',
    color: '#003399',
    textColor: '#FFFFFF',
    bgBadge: 'bg-indigo-50 text-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-200 border-indigo-200 dark:border-indigo-800',
    logoFile: './assets/carriers/seur.svg',
    serviceType: 'SEUR 24 Classic',
    slaHours: 24,
    baseRateEur: 5.85,
  },
  MRW: {
    code: 'MRW',
    name: 'MRW Urgente (14:00h / 19:00h)',
    shortName: 'MRW',
    color: '#E31B23',
    textColor: '#FFFFFF',
    bgBadge: 'bg-rose-50 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200 border-rose-200 dark:border-rose-800',
    logoFile: './assets/carriers/mrw.svg',
    serviceType: 'MRW Urgente 19h',
    slaHours: 19,
    baseRateEur: 6.4,
  },
  UPS: {
    code: 'UPS',
    name: 'UPS Standard & Express Saver',
    shortName: 'UPS',
    color: '#351C15',
    textColor: '#FFB500',
    bgBadge: 'bg-amber-50 text-amber-950 dark:bg-amber-950/60 dark:text-amber-200 border-amber-300',
    logoFile: './assets/carriers/ups.svg',
    serviceType: 'UPS Express Saver EU',
    slaHours: 24,
    baseRateEur: 7.9,
  },
  FEDEX: {
    code: 'FEDEX',
    name: 'FedEx International Priority',
    shortName: 'FedEx',
    color: '#4D148C',
    textColor: '#FF6600',
    bgBadge: 'bg-purple-50 text-purple-900 dark:bg-purple-950/60 dark:text-purple-200 border-purple-200 dark:border-purple-800',
    logoFile: './assets/carriers/fedex.svg',
    serviceType: 'FedEx Priority',
    slaHours: 24,
    baseRateEur: 9.2,
  },
  TNT: {
    code: 'TNT',
    name: 'TNT Express (FedEx Group)',
    shortName: 'TNT',
    color: '#FF6600',
    textColor: '#FFFFFF',
    bgBadge: 'bg-orange-50 text-orange-900 dark:bg-orange-950/60 dark:text-orange-200 border-orange-200',
    logoFile: './assets/carriers/tnt.svg',
    serviceType: 'TNT Economy Express',
    slaHours: 48,
    baseRateEur: 7.1,
  },
  TIPSA: {
    code: 'TIPSA',
    name: 'TIPSA Transporte Integral Paquetería',
    shortName: 'TIPSA',
    color: '#004A99',
    textColor: '#E30613',
    bgBadge: 'bg-sky-50 text-sky-900 dark:bg-sky-950/60 dark:text-sky-200 border-sky-200',
    logoFile: './assets/carriers/tipsa.svg',
    serviceType: 'TIPSA 19:00h Farma/Tech',
    slaHours: 24,
    baseRateEur: 5.25,
  },
  ZELERIS: {
    code: 'ZELERIS',
    name: 'Zeleris (Telefónica Logística)',
    shortName: 'Zeleris',
    color: '#0066CC',
    textColor: '#FFFFFF',
    bgBadge: 'bg-cyan-50 text-cyan-900 dark:bg-cyan-950/60 dark:text-cyan-200 border-cyan-200',
    logoFile: './assets/carriers/zeleris.svg',
    serviceType: 'Zeleris Día Siguiente',
    slaHours: 24,
    baseRateEur: 5.5,
  },
  INPOST: {
    code: 'INPOST',
    name: 'InPost / Mondial Relay (Punto Pack)',
    shortName: 'InPost',
    color: '#FFCC00',
    textColor: '#111827',
    bgBadge: 'bg-yellow-50 text-slate-900 dark:bg-yellow-950/60 dark:text-yellow-200 border-yellow-300',
    logoFile: './assets/carriers/inpost.svg',
    serviceType: 'Locker / Punto Pack 48h',
    slaHours: 48,
    baseRateEur: 3.45,
  },
  PACKLINK: {
    code: 'PACKLINK',
    name: 'Packlink PRO Enterprise',
    shortName: 'Packlink',
    color: '#10B981',
    textColor: '#FFFFFF',
    bgBadge: 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200 border-emerald-200',
    logoFile: './assets/carriers/packlink.svg',
    serviceType: 'Multicarrier Consolidado',
    slaHours: 24,
    baseRateEur: 4.6,
  },
  CABIFY: {
    code: 'CABIFY',
    name: 'Cabify Logistics (Same-Day Urbano)',
    shortName: 'Cabify',
    color: '#7145D6',
    textColor: '#FFFFFF',
    bgBadge: 'bg-violet-50 text-violet-900 dark:bg-violet-950/60 dark:text-violet-200 border-violet-200',
    logoFile: './assets/carriers/cabify.svg',
    serviceType: 'Entrega Inmediata 2h',
    slaHours: 2,
    baseRateEur: 7.5,
  },
  DPD: {
    code: 'DPD',
    name: 'DPD Group Europe',
    shortName: 'DPD',
    color: '#DC0032',
    textColor: '#FFFFFF',
    bgBadge: 'bg-rose-50 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200 border-rose-200',
    logoFile: './assets/carriers/dpd.svg',
    serviceType: 'DPD Classic Road EU',
    slaHours: 48,
    baseRateEur: 8.1,
  },
  CHRONOPOST: {
    code: 'CHRONOPOST',
    name: 'Chronopost International',
    shortName: 'Chronopost',
    color: '#003DA5',
    textColor: '#FFFFFF',
    bgBadge: 'bg-blue-50 text-blue-900 dark:bg-blue-950/60 dark:text-blue-200 border-blue-200',
    logoFile: './assets/carriers/chronopost.svg',
    serviceType: 'Chrono Express EU',
    slaHours: 24,
    baseRateEur: 8.4,
  },
  CTT_EXPRESS: {
    code: 'CTT_EXPRESS',
    name: 'CTT Express Ibérica (e-Commerce 24h)',
    shortName: 'CTT Express',
    color: '#DA291C',
    textColor: '#FFFFFF',
    bgBadge: 'bg-red-50 text-red-900 dark:bg-red-950/60 dark:text-red-200 border-red-200',
    serviceType: 'CTT Express 24h Ibérica',
    slaHours: 24,
    baseRateEur: 4.85,
  },
  ENVIALIA: {
    code: 'ENVIALIA',
    name: 'Envialia Urgente (72h / 24h)',
    shortName: 'Envialia',
    color: '#E63312',
    textColor: '#FFFFFF',
    bgBadge: 'bg-orange-50 text-orange-900 dark:bg-orange-950/60 dark:text-orange-200 border-orange-200',
    serviceType: 'Envialia 24h',
    slaHours: 24,
    baseRateEur: 5.1,
  },
  PAACK: {
    code: 'PAACK',
    name: 'Paack Scheduled Delivery',
    shortName: 'Paack',
    color: '#0F172A',
    textColor: '#38BDF8',
    bgBadge: 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-200 border-slate-300',
    serviceType: 'Franja Horaria Sostenible',
    slaHours: 24,
    baseRateEur: 5.65,
  },
  DB_SCHENKER: {
    code: 'DB_SCHENKER',
    name: 'DB Schenker Paletería Industrial',
    shortName: 'DB Schenker',
    color: '#EC0016',
    textColor: '#FFFFFF',
    bgBadge: 'bg-rose-50 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200 border-rose-200',
    serviceType: 'System Freight / Palets',
    slaHours: 48,
    baseRateEur: 19.5,
  },
};

interface CarrierLogoProps {
  carrier: string;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}

export const CarrierLogo: React.FC<CarrierLogoProps> = ({
  carrier,
  size = 'md',
  showName = true,
}) => {
  const [imgError, setImgError] = useState(false);
  const meta = CARRIERS_CATALOG[carrier] || {
    code: carrier,
    name: carrier,
    shortName: carrier,
    color: '#1E293B',
    textColor: '#FFFFFF',
    bgBadge: 'bg-slate-100 text-slate-800 border-slate-200',
    serviceType: 'Estándar',
    slaHours: 24,
    baseRateEur: 5.99,
  };

  const sizeMap = {
    sm: 'h-5 px-2 text-[10px]',
    md: 'h-6 px-2.5 text-[11px]',
    lg: 'h-8 px-3 text-xs',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg font-bold border ${meta.bgBadge} ${sizeMap[size]}`}
      title={meta.name}
    >
      {meta.logoFile && !imgError ? (
        <img
          src={meta.logoFile}
          alt={meta.shortName}
          className={size === 'lg' ? 'h-4 max-w-[54px] object-contain' : 'h-3.5 max-w-[44px] object-contain'}
          onError={() => setImgError(true)}
        />
      ) : (
        <span
          className="px-1.5 py-0.5 rounded text-[9px] font-black tracking-tight uppercase shrink-0"
          style={{ backgroundColor: meta.color, color: meta.textColor }}
        >
          {meta.shortName}
        </span>
      )}
      {showName && <span>{meta.shortName}</span>}
    </span>
  );
};
