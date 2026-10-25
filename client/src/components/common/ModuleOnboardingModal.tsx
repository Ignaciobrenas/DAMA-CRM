import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  HelpCircle,
  Building2,
  Users,
  TrendingUp,
  FileText,
  Receipt,
  Package,
  Truck,
  Kanban,
  Calendar,
  LifeBuoy,
  MessageSquare,
  Zap,
  Briefcase,
  Clock,
  ShieldCheck,
  BarChart3,
  Plug,
  Settings,
  LayoutDashboard,
  Lightbulb,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBranding } from '../../context/BrandingContext';

export interface ModuleTourStep {
  title: string;
  description: string;
  highlights: string[];
  proTip: string;
}

export interface ModuleTourConfig {
  route: string;
  moduleCode: string;
  moduleTitle: string;
  subtitle: string;
  accentColor: string;
  icon: React.ElementType;
  steps: ModuleTourStep[];
}

export const MODULE_TOURS: Record<string, ModuleTourConfig> = {
  '/': {
    route: '/',
    moduleCode: 'MÓDULO 19',
    moduleTitle: 'Dashboard Ejecutivo & Tesorería',
    subtitle: 'Centro de mando en tiempo real con widgets personalizables y previsión de caja.',
    accentColor: 'from-blue-600 to-indigo-600',
    icon: LayoutDashboard,
    steps: [
      {
        title: 'Métricas Comerciales y Financieras en Vivo',
        description:
          'Visualiza de un vistazo el valor total del embudo, las ventas ganadas y cobradas, la tasa de conversión y el estado de las tareas críticas del equipo.',
        highlights: [
          'KPIs ponderados automáticamente según la probabilidad de cada etapa comercial.',
          'Filtro temporal dinámico (Hoy, Semana, Mes, Trimestre y Año).',
          'Accesos rápidos para crear oportunidades o emitir facturas en un clic.',
        ],
        proTip: 'Usa el atajo global Ctrl+K (o ⌘K) desde cualquier lugar para saltar entre módulos al instante.',
      },
      {
        title: 'Previsión de Tesorería (Cashflow Forecast)',
        description:
          'Cruza las facturas ya cobradas con los vencimientos pendientes y el pipeline comercial ponderado para anticipar la liquidez de la empresa.',
        highlights: [
          'Control de cobros confirmados frente a deuda pendiente de clientes.',
          'Proyección realista de facturación a 30, 60 y 90 días.',
          'Detección temprana de desviaciones presupuestarias.',
        ],
        proTip: 'Haz clic en cualquier factura o trato destacado para navegar directamente a su ficha.',
      },
      {
        title: 'Diseño Modular Persistente en Base de Datos',
        description:
          'Adapta el orden de los bloques del Dashboard a tu forma de trabajar mediante Drag & Drop o los botones de subida y bajada.',
        highlights: [
          'Tu disposición de widgets se guarda automáticamente en tu perfil de usuario en PostgreSQL.',
          'Botón de restablecimiento rápido para volver al diseño ejecutivo original.',
          'Modo Claro Anti-Glare diseñado para jornadas intensivas sin fatiga visual.',
        ],
        proTip: 'Puedes volver a abrir esta guía en cualquier momento desde el botón "Guía del Módulo".',
      },
    ],
  },
  '/companies': {
    route: '/companies',
    moduleCode: 'MÓDULO 02',
    moduleTitle: 'Directorio de Empresas (Accounts)',
    subtitle: 'Gestión centralizada de cuentas corporativas, validación de CIF/NIF y visión 360º.',
    accentColor: 'from-indigo-600 to-blue-600',
    icon: Building2,
    steps: [
      {
        title: 'Ficha Mercantil y Validación Fiscal',
        description:
          'Registra tus clientes corporativos, proveedores y partners con validación integrada de CIF/NIF español y VAT intracomunitario.',
        highlights: [
          'Clasificación por sector industrial, ciudad, facturación anual y sitio web.',
          'Búsqueda instantánea con debounce y filtrado combinado por industria.',
          'Prevención de duplicados y trazabilidad completa por tenant.',
        ],
        proTip: 'Al vincular contactos y oportunidades a una empresa, su volumen de negocio se agrega automáticamente.',
      },
      {
        title: 'Visión 360º de Cuenta Corporativa',
        description:
          'Inspecciona desde una sola tarjeta todos los contactos directivos, tratos en curso y facturas emitidas para cada organización.',
        highlights: [
          'Acceso directo a los decisores de compra vinculados a la cuenta.',
          'Histórico financiero y estado de solvencia mercantil.',
          'Exportación a CSV homologado desde el módulo de Informes.',
        ],
        proTip: 'Las empresas registradas aquí están disponibles inmediatamente en Facturación, Logística y Portal de Clientes.',
      },
    ],
  },
  '/contacts': {
    route: '/contacts',
    moduleCode: 'MÓDULO 03',
    moduleTitle: 'Directorio de Contactos & Leads',
    subtitle: 'Gestión de interlocutores comerciales, cualificación de prospectos y ficha interactiva.',
    accentColor: 'from-emerald-600 to-teal-600',
    icon: Users,
    steps: [
      {
        title: 'Interlocutores y Prospectos Cualificados',
        description:
          'Organiza toda tu agenda de contactos profesionales diferenciando entre clientes activos y leads en fase de prospección.',
        highlights: [
          'Asociación directa con su empresa matriz, cargo y canales de contacto.',
          'Etiquetado semántico y segmentación rápida para campañas comerciales.',
          'Ficha modal centrada con historial de actividades, notas y oportunidades.',
        ],
        proTip: 'Desde la ficha de un contacto puedes iniciar una conversación omnicanal por WhatsApp o Email en un clic.',
      },
      {
        title: 'Trazabilidad RGPD y Portabilidad',
        description:
          'Todos los contactos cumplen con la normativa europea de protección de datos, registrando el origen y consentimiento.',
        highlights: [
          'Importación y exportación masiva en formato CSV estándar.',
          'Sincronización automática con los formularios web de captura de leads.',
          'Búsqueda ultrarrápida por nombre, email, teléfono o empresa.',
        ],
        proTip: 'Convierte un Lead en oportunidad comercial directamente desde el embudo de ventas.',
      },
    ],
  },
  '/lead-capture': {
    route: '/lead-capture',
    moduleCode: 'MÓDULO 03 · HUB',
    moduleTitle: 'Lead Capture Hub & Formularios Web',
    subtitle: 'Captación automatizada de prospectos con doble opt-in RGPD y webhooks entrantes.',
    accentColor: 'from-teal-600 to-cyan-600',
    icon: Sparkles,
    steps: [
      {
        title: 'Formularios Embebibles y Captación en Vivo',
        description:
          'Genera formularios listos para insertar en tu web corporativa o landing pages que inyectan leads directamente en PostgreSQL.',
        highlights: [
          'Casilla obligatoria de consentimiento explícito RGPD / LOPDGDD.',
          'Creación automática de Contacto, Empresa y Ticket/Oportunidad inicial.',
          'Notificación inmediata al equipo comercial ante cada nuevo registro.',
        ],
        proTip: 'Puedes probar el envío de un prospecto en vivo desde el simulador integrado en esta misma pantalla.',
      },
    ],
  },
  '/pipeline': {
    route: '/pipeline',
    moduleCode: 'MÓDULO 04',
    moduleTitle: 'Pipeline de Ventas & Tablero Kanban',
    subtitle: 'Embudo comercial interactivo con previsión ponderada y cierre de oportunidades.',
    accentColor: 'from-blue-600 to-violet-600',
    icon: TrendingUp,
    steps: [
      {
        title: 'Gestión Visual de Oportunidades (Deals)',
        description:
          'Mueve tus oportunidades a lo largo de las etapas del ciclo de venta mediante Drag & Drop o el selector rápido de etapa.',
        highlights: [
          'Cálculo automático de ingresos ponderados según la probabilidad de cada columna.',
          'Indicadores de temperatura comercial, fecha estimada de cierre y responsable.',
          'Filtros por estado (Abiertos, Ganados WON, Perdidos LOST) y buscador instantáneo.',
        ],
        proTip: 'Al marcar un trato como GANADO (WON), los informes de BI y las automatizaciones pueden disparar su factura automáticamente.',
      },
      {
        title: 'Actividades, Notas y Seguimiento Comercial',
        description:
          'Abre cualquier oportunidad para registrar llamadas, reuniones, presupuestos vinculados y próximos pasos.',
        highlights: [
          'Historial cronológico completo de interacciones con el cliente.',
          'Vinculación directa con Empresas y Contactos del CRM.',
          'Métricas de Win Rate y Ticket Medio actualizadas al instante.',
        ],
        proTip: 'Configura reglas en el módulo de Automatizaciones para crear tareas de seguimiento cuando un trato cambie de etapa.',
      },
    ],
  },
  '/invoicing': {
    route: '/invoicing',
    moduleCode: 'MÓDULO 05',
    moduleTitle: 'Facturación, Presupuestos & Veri*Factu AEAT',
    subtitle: 'Facturación legal con huella criptográfica SHA-256 encadenada, QR tributario y firma digital.',
    accentColor: 'from-indigo-600 to-purple-600',
    icon: FileText,
    steps: [
      {
        title: 'Cumplimiento Normativo Veri*Factu (RD 1007/2023)',
        description:
          'Cada factura emitida genera y guarda en base de datos una huella SHA-256 encadenada con la factura anterior, garantizando la inalterabilidad exigida por la AEAT.',
        highlights: [
          'Soporte para facturas Ordinarias (F1), Simplificadas (F2) y Rectificativas (R1).',
          'Código QR tributario oficial y huella técnica estampados en el PDF.',
          'Auditor de cadena criptográfica en vivo ("Verificar Cadena Veri*Factu").',
        ],
        proTip: 'Personaliza el diseño visual de tus facturas PDF (plantillas Stripe, Sage, Ejecutiva o Suiza) en Configuración -> Diseño PDF.',
      },
      {
        title: 'Presupuestos y Firma Digital Manuscrita',
        description:
          'Crea cotizaciones detalladas con descuentos por línea, IVA (21%, 10%, 4%, Exento) e IRPF, y envíalas para su firma online.',
        highlights: [
          'Enlace público seguro para que el cliente firme el presupuesto desde móvil o PC.',
          'Conversión automática de presupuesto aprobado en factura oficial en un clic.',
          'Uso automático del logotipo de tu empresa o del logotipo oficial de DAMA como fallback.',
        ],
        proTip: 'Usa el panel de Control de Morosidad (Aging) para vigilar vencimientos a 30, 60 y 90 días.',
      },
    ],
  },
  '/expenses': {
    route: '/expenses',
    moduleCode: 'MÓDULO 06',
    moduleTitle: 'Gastos, Proveedores & Margen P&L',
    subtitle: 'Control de facturas recibidas, IVA soportado deducible y cuenta de pérdidas y ganancias.',
    accentColor: 'from-rose-600 to-orange-600',
    icon: Receipt,
    steps: [
      {
        title: 'Registro Contable de Compras y Acreedores',
        description:
          'Registra todas las facturas de proveedores con su NIF/CIF, categoría fiscal, base imponible y tipo de IVA soportado.',
        highlights: [
          'Cálculo reactivo automático de cuota de IVA y total del gasto.',
          'Alternancia rápida de estado (Pagado / Pendiente) con un clic en la tabla.',
          'Edición completa en modal centrado y exportación de Libro de Facturas Recibidas (AEAT Mod. 303).',
        ],
        proTip: 'La franja superior de P&L cruza tus ingresos facturados con los gastos para mostrarte el Margen Neto y la liquidación de IVA en vivo.',
      },
    ],
  },
  '/inventory': {
    route: '/inventory',
    moduleCode: 'MÓDULO 07',
    moduleTitle: 'Inventario Multi-Almacén, Traspasos Sage & Kardex',
    subtitle: 'SGA Enterprise con traspasos legales en 2 fases (Art. 9 LIVA & LOTT), lotes FEFO y PMP.',
    accentColor: 'from-blue-700 to-cyan-600',
    icon: Package,
    steps: [
      {
        title: 'Multi-Almacén y Traspasos en 2 Fases (Estándar Sage 50/200)',
        description:
          'Gestiona existencias por almacén físico o furgoneta SAT y realiza movimientos internos de mercancía con plena validez contable y legal en España y la UE.',
        highlights: [
          'Fase 1 (Expedición): Descuenta stock en origen y lo sitúa en "Stock en Tránsito" hacia el destino.',
          'Fase 2 (Recepción): Confirma cantidades recibidas e imputa mermas (SHRINKAGE) automáticamente si hay roturas.',
          'Emisión de Albarán de Circulación Interno PDF (No sujeto a IVA ex Art. 9.1º LIVA y conforme a Orden FOM/2861/2012 LOTT).',
        ],
        proTip: 'Imprime siempre el Albarán de Circulación desde la pestaña de Traspasos para que acompañe al transportista en carretera.',
      },
      {
        title: 'Trazabilidad por Lotes FEFO y Libro Mayor Kardex PMP',
        description:
          'Controla números de lote/serie con prioridad de salida al primero en caducar (FEFO) y audita cada movimiento valorado a Precio Medio Ponderado.',
        highlights: [
          'Semáforo de caducidades por lote (Óptimo, Próximo a caducar, Caducado).',
          'Libro Mayor Kardex inmutable conforme a la Norma 10ª del Plan General de Contabilidad.',
          'Sincronización bidireccional con catálogo PIM (UnoPIM) y alertas de stock mínimo.',
        ],
        proTip: 'Filtra el catálogo por almacén superior para inspeccionar el stock disponible, reservado y en tránsito de cada sede.',
      },
    ],
  },
  '/logistics': {
    route: '/logistics',
    moduleCode: 'MÓDULO 08',
    moduleTitle: 'Logística, 22 Agencias & Etiquetas Térmicas 10x15',
    subtitle: 'Expediciones multi-transportista, comparador de tarifas en vivo y gestión de devoluciones RMA.',
    accentColor: 'from-amber-600 to-orange-600',
    icon: Truck,
    steps: [
      {
        title: '22 Transportistas Nacionales e Internacionales Integrados',
        description:
          'Gestiona envíos con identidad visual oficial para SEUR, MRW, Correos, Correos Express, GLS, NACEX, TIPSA, DHL, UPS, FedEx, Zeleris, CTT, InPost y más.',
        highlights: [
          'Comparador inteligente de tarifas por peso, urgencia (24h/48h/Frío) y destino.',
          'Generación de Etiqueta Térmica homologada 10x15 cm (DIN A6 PDF) con código de barras Code-128 y QR.',
          'Estampación automática del logotipo de tu empresa o del logotipo oficial de DAMA en la etiqueta.',
        ],
        proTip: 'Usa la pestaña de Devoluciones (RMA) para autorizar logísticas inversas y abonar o reponer mercancía.',
      },
    ],
  },
  '/agile': {
    route: '/agile',
    moduleCode: 'MÓDULO 09',
    moduleTitle: 'Tablero Ágil Scrum & Kanban',
    subtitle: 'Gestión de tareas técnicas, Story Points, control de horas y flujo de trabajo de ingeniería.',
    accentColor: 'from-violet-600 to-indigo-600',
    icon: Kanban,
    steps: [
      {
        title: 'Ejecución Ágil de Proyectos y Tareas',
        description:
          'Organiza el trabajo operativo en columnas (Por hacer, En progreso, En revisión y Completado) con estimación de esfuerzo e imputación de horas reales.',
        highlights: [
          'Métricas de velocidad de equipo, Story Points completados y horas registradas.',
          'Hilo de comentarios técnicos por tarea y asignación de responsables.',
          'Persistencia inmediata en PostgreSQL conectada con los informes de velocidad BI.',
        ],
        proTip: 'Combina este tablero con el Planificador de Sprints & Gantt (/planner) para una gestión de proyectos completa.',
      },
    ],
  },
  '/planner': {
    route: '/planner',
    moduleCode: 'MÓDULO 09 · PLANNER',
    moduleTitle: 'Planificador de Proyectos, Sprints & Gantt',
    subtitle: 'Hoja de ruta estratégica, cronograma Gantt, retrospectivas y notas de versión.',
    accentColor: 'from-purple-600 to-blue-600',
    icon: Kanban,
    steps: [
      {
        title: 'Cronograma Gantt, Sprints y Lanzamientos',
        description:
          'Planifica iteraciones (Sprints), visualiza dependencias en el diagrama de Gantt y documenta retrospectivas y releases en base de datos.',
        highlights: [
          'Creación de Sprints con objetivos, fechas de inicio/fin y capacidad del equipo.',
          'Bloc de notas de arquitectura y plantillas reutilizables de proyecto.',
          'Sincronización total con las tareas del Tablero Ágil.',
        ],
        proTip: 'Utiliza las plantillas predefinidas para desplegar la estructura de un nuevo proyecto cliente en segundos.',
      },
    ],
  },
  '/calendar': {
    route: '/calendar',
    moduleCode: 'MÓDULO 10',
    moduleTitle: 'Calendario Corporativo de Actividades',
    subtitle: 'Agenda unificada de reuniones comerciales, llamadas de seguimiento y vencimientos.',
    accentColor: 'from-sky-600 to-blue-600',
    icon: Calendar,
    steps: [
      {
        title: 'Agenda Mensual y Semanal Conectada al CRM',
        description:
          'Programa reuniones, llamadas y demostraciones vinculadas directamente a tus Contactos y Oportunidades de venta.',
        highlights: [
          'Vista mensual interactiva con código de colores según tipo de actividad.',
          'Modal centrado de creación rápida con recordatorios y notas de preparación.',
          'Preparado para sincronización bidireccional con Google Calendar.',
        ],
        proTip: 'Haz clic en cualquier día del calendario para agendar una nueva actividad en esa fecha exacta.',
      },
    ],
  },
  '/appointments': {
    route: '/appointments',
    moduleCode: 'MÓDULO 10 · CITAS',
    moduleTitle: 'Gestión de Citas & Reservas',
    subtitle: 'Administración de citas programadas con clientes, estados de asistencia y asignaciones.',
    accentColor: 'from-cyan-600 to-blue-600',
    icon: Calendar,
    steps: [
      {
        title: 'Control de Citas Comerciales y Técnicas',
        description:
          'Consulta y gestiona el listado cronológico de citas con clientes, confirmaciones de asistencia y enlaces de videollamada.',
        highlights: [
          'Filtrado rápido por estado de cita, modalidad (Presencial / Online) y comercial asignado.',
          'Vinculación directa con la ficha del cliente y registro de acuerdos alcanzados.',
        ],
        proTip: 'Todas las citas creadas aquí aparecen automáticamente en el Calendario Corporativo.',
      },
    ],
  },
  '/tickets': {
    route: '/tickets',
    moduleCode: 'MÓDULO 11',
    moduleTitle: 'Helpdesk, Tickets de Soporte & SLA',
    subtitle: 'Centro de atención al cliente con control de tiempos de respuesta (SLA) y notas internas.',
    accentColor: 'from-emerald-600 to-blue-600',
    icon: LifeBuoy,
    steps: [
      {
        title: 'Gestión de Incidencias con Acuerdos de Nivel de Servicio (SLA)',
        description:
          'Centraliza las solicitudes de soporte técnico recibidas desde el Portal de Clientes, email o formularios web.',
        highlights: [
          'Priorización crítica (Baja, Media, Alta, Urgente) con semáforo de cumplimiento SLA.',
          'Modal centrado de resolución con hilo de conversación público y Notas Internas privadas para el equipo.',
          'Asignación de agentes de soporte y métricas de tiempo medio de resolución.',
        ],
        proTip: 'Usa las "Notas Internas" dentro del ticket para colaborar con otros técnicos sin que el cliente final vea el mensaje.',
      },
    ],
  },
  '/omnichannel': {
    route: '/omnichannel',
    moduleCode: 'MÓDULO 12',
    moduleTitle: 'Centro Omnicanal 24/7 & Chat de Equipo',
    subtitle: 'Bandeja unificada de WhatsApp Business, Email, SMS y canales internos de colaboración.',
    accentColor: 'from-green-600 to-emerald-600',
    icon: MessageSquare,
    steps: [
      {
        title: 'Bandeja Externa (WhatsApp Meta Cloud / Email) y Chat Interno',
        description:
          'Responde a tus clientes por WhatsApp o Email desde una única interfaz y coordínate con tu equipo mediante canales temáticos estilo Slack.',
        highlights: [
          'Respuestas rápidas preconfiguradas y vinculación con la ficha del contacto CRM.',
          'Pestaña "Chat de Equipo" con canales persistentes en PostgreSQL (#general, #ventas, #soporte).',
          'Creación de nuevos canales departamentales en modal centrado.',
        ],
        proTip: 'Alterna entre "Bandeja de Clientes" y "Chat de Equipo" en la barra superior para comunicarte con clientes o compañeros.',
      },
    ],
  },
  '/workflows': {
    route: '/workflows',
    moduleCode: 'MÓDULO 13',
    moduleTitle: 'Flujos de Trabajo & Automatizaciones',
    subtitle: 'Motor de reglas Event-Driven para automatizar facturación, avisos y tareas comerciales.',
    accentColor: 'from-purple-600 to-pink-600',
    icon: Zap,
    steps: [
      {
        title: 'Automatización Sin Código (Disparador -> Condición -> Acción)',
        description:
          'Diseña reglas automáticas que reaccionan en tiempo real ante eventos del CRM (nuevo lead, trato ganado, factura vencida o stock bajo).',
        highlights: [
          'Catálogo de plantillas listas para activar en un clic.',
          'Botón de ejecución manual ("Probar Regla") con registro de auditoría en vivo.',
          'Enlace directo con webhooks de n8n y Zapier para flujos multi-aplicación.',
        ],
        proTip: 'Activa la plantilla de "Trato Ganado -> Generar Borrador de Factura" para acelerar el ciclo de cobro comercial.',
      },
    ],
  },
  '/portal-empleado': {
    route: '/portal-empleado',
    moduleCode: 'MÓDULO 14',
    moduleTitle: 'Portal del Empleado, RRHH & Nóminas PDF',
    subtitle: 'Gestión de capital humano, directorio de plantilla, control de jornada y recibos de salario.',
    accentColor: 'from-blue-600 to-indigo-700',
    icon: Briefcase,
    steps: [
      {
        title: 'Directorio de Plantilla, Fichajes y Emisión de Nóminas',
        description:
          'Administra los expedientes laborales de tu equipo, supervisa los registros horarios y emite nóminas oficiales con cálculo automático de IRPF y Seguridad Social.',
        highlights: [
          'Alta de empleados en base de datos con contrato, puesto, departamento y salario bruto.',
          'Generador de Nóminas con cálculo de Contingencias Comunes (4.70%), Desempleo/FP (1.65%) e IRPF.',
          'Recibo oficial de salarios imprimible con el logotipo corporativo oficial de DAMA.',
        ],
        proTip: 'Exporta el registro horario mensual en CSV homologado ante cualquier requerimiento de la Inspección de Trabajo.',
      },
    ],
  },
  '/my-time': {
    route: '/my-time',
    moduleCode: 'MÓDULO 14 · MI TIEMPO',
    moduleTitle: 'Mi Tiempo & Registro Horario Legal (RDL 8/2019)',
    subtitle: 'Fichaje diario de jornada laboral, pausas, modalidad presencial/teletrabajo y bolsa de horas.',
    accentColor: 'from-indigo-600 to-cyan-600',
    icon: Clock,
    steps: [
      {
        title: 'Control Horario Personal y Cumplimiento RDL 8/2019',
        description:
          'Registra tu entrada, pausas de descanso y salida diaria seleccionando tu modalidad de trabajo (Oficina Presencial o Teletrabajo Remoto).',
        highlights: [
          'Cronómetro de jornada activa sincronizado con el widget superior de la barra de navegación.',
          'Resumen semanal y mensual de horas efectivas trabajadas frente a jornada teórica.',
          'Historial inmutable de fichajes exportable en formato CSV.',
        ],
        proTip: 'También puedes fichar rápidamente tu entrada o pausa desde cualquier pantalla usando el reloj de la barra superior.',
      },
    ],
  },
  '/portal': {
    route: '/portal',
    moduleCode: 'MÓDULO 15',
    moduleTitle: 'Área Privada de Clientes (Self-Service)',
    subtitle: 'Portal externo para descarga de facturas PDF, apertura de tickets de soporte y portabilidad RGPD.',
    accentColor: 'from-slate-800 to-blue-700',
    icon: ShieldCheck,
    steps: [
      {
        title: 'Autogestión Transparente para tus Clientes',
        description:
          'Ofrece a tus clientes un espacio seguro con tu identidad corporativa donde consultar sus facturas, abrir tickets técnicos y ejercer sus derechos RGPD.',
        highlights: [
          'Simulador de vista por empresa cliente en la cabecera superior.',
          'Descarga directa de facturas oficiales en PDF y consulta de estado de pago.',
          'Exportación instantánea de todos los datos del cliente en formato JSON (Portabilidad Art. 20 RGPD).',
        ],
        proTip: 'Los tickets creados por el cliente en este portal entran directamente en el módulo de Helpdesk (/tickets) con SLA asignado.',
      },
    ],
  },
  '/reports': {
    route: '/reports',
    moduleCode: 'MÓDULO 16',
    moduleTitle: 'Informes Ejecutivos PDF, Libros IVA & BI',
    subtitle: 'Analítica avanzada de ventas, exportación de Libros Oficiales AEAT (Mod. 303) y dossier PDF.',
    accentColor: 'from-blue-700 to-indigo-800',
    icon: BarChart3,
    steps: [
      {
        title: 'Business Intelligence y Exportación Fiscal AEAT',
        description:
          'Analiza el rendimiento comercial y operativo de la organización y descarga informes listos para dirección o asesoría fiscal.',
        highlights: [
          'Generación de Informe Ejecutivo en PDF con logotipo corporativo y resumen financiero.',
          'Exportación CSV de Libros Registro de Facturas Expedidas y Recibidas para el Modelo 303 de la AEAT.',
          'Pestaña de Telemetría Admin con métricas de hardware, memoria Node.js y auditoría de base de datos.',
        ],
        proTip: 'Pulsa "Informe PDF" en la esquina superior derecha para descargar al instante el dossier ejecutivo completo.',
      },
    ],
  },
  '/admin-bi': {
    route: '/admin-bi',
    moduleCode: 'MÓDULO 16 · ADMIN BI',
    moduleTitle: 'Telemetría de Ecosistema & Admin BI',
    subtitle: 'Monitorización global de infraestructura, crecimiento de facturación y auditoría de seguridad.',
    accentColor: 'from-purple-700 to-indigo-700',
    icon: BarChart3,
    steps: [
      {
        title: 'Salud del Servidor y Métricas Globales Multi-Tenant',
        description:
          'Supervisa en tiempo real el consumo de memoria RAM (Heap/RSS), el tiempo de actividad (Uptime), la evolución de ingresos y las últimas acciones registradas.',
        highlights: [
          'Gráficas comparativas de crecimiento mensual de facturación y distribución de oportunidades.',
          'Registro inmutable de auditoría de seguridad (AuditLog) en tiempo real.',
        ],
        proTip: 'Combina esta vista con el conmutador God Mode de la barra superior para auditar cualquier organización del ecosistema.',
      },
    ],
  },
  '/integrations': {
    route: '/integrations',
    moduleCode: 'MÓDULO 17',
    moduleTitle: 'Conectores de Terceros, API & Webhooks',
    subtitle: 'Hub de integraciones con Odoo, WooCommerce, Shopify, Stripe, n8n, Zapier y UnoPIM.',
    accentColor: 'from-violet-600 to-fuchsia-600',
    icon: Plug,
    steps: [
      {
        title: 'Ecosistema Conectado y Auditoría de Trazas HTTP',
        description:
          'Configura claves API, secretos y webhooks bidireccionales para sincronizar tu CRM con pasarelas de pago, tiendas e-commerce y ERPs externos.',
        highlights: [
          'Test de conexión individual y auditoría masiva de latencia (Handshake 200 OK).',
          'Modal centrado de configuración protegido por permisos de Administrador (RBAC).',
          'Inspector centrado de Logs y Trazas HTTP para depurar sincronizaciones en tiempo real.',
        ],
        proTip: 'Usa el filtro "Ocultar no configuradas" para centrarte únicamente en las integraciones activas de tu empresa.',
      },
    ],
  },
  '/faq': {
    route: '/faq',
    moduleCode: 'MÓDULO 17 · FAQ',
    moduleTitle: 'Centro de Ayuda & Preguntas Frecuentes',
    subtitle: 'Base de conocimiento interactiva sobre seguridad, facturación Veri*Factu, integraciones y diseño.',
    accentColor: 'from-blue-600 to-cyan-600',
    icon: HelpCircle,
    steps: [
      {
        title: 'Respuestas Rápidas y Documentación Integrada',
        description:
          'Busca por palabra clave o filtra por categoría para resolver cualquier duda sobre el funcionamiento técnico y legal de DAMA-CRM.',
        highlights: [
          'Buscador instantáneo por términos clave y etiquetas (#verifactu, #odoo, #rgpd, #logo).',
          'Valoración de utilidad en cada artículo y enlace directo al soporte omnicanal.',
        ],
        proTip: 'Haz clic en las píldoras de categoría para filtrar preguntas de Seguridad, Ventas, Conectores o Identidad Visual.',
      },
    ],
  },
  '/settings': {
    route: '/settings',
    moduleCode: 'MÓDULO 18',
    moduleTitle: 'Configuración, Branding & Estudio de Diseño PDF',
    subtitle: 'Personalización de marca, plantillas PDF con vista previa A4 en vivo, RBAC, SMTP y 2FA.',
    accentColor: 'from-slate-800 to-indigo-700',
    icon: Settings,
    steps: [
      {
        title: 'Identidad Visual y Regla del Logotipo Inteligente',
        description:
          'Personaliza el nombre comercial, colores corporativos y logotipo de tu empresa. Si no subes un logo propio, el sistema utiliza automáticamente el logotipo oficial inmutable de DAMA como placeholder.',
        highlights: [
          'Conmutación adaptativa automática entre Modo Claro Anti-Glare y Modo Oscuro.',
          'Activación y desactivación modular de funcionalidades según las necesidades de tu PYME.',
        ],
        proTip: 'Cualquier cambio de logotipo o color corporativo se refleja al instante en toda la plataforma y en los documentos PDF.',
      },
      {
        title: 'Estudio de Diseño de Documentos & PDF (Lienzo A4 en Vivo)',
        description:
          'Accede a la pestaña "Diseño de Documentos & PDF" para personalizar por completo la estética y los textos legales de tus facturas, presupuestos y albaranes.',
        highlights: [
          '4 Plantillas profesionales: Moderna (Stripe), Corporativa (Sage ERP), Clásica Ejecutiva y Minimalista Suiza.',
          'Control de posición del logo (Izquierda/Derecha), colores, marca de agua, IBAN, sello QR Veri*Factu, Registro Mercantil y cláusula RGPD.',
          'Vista previa A4 interactiva en tiempo real y descarga de PDF de prueba.',
        ],
        proTip: 'Guarda tu diseño PDF y descárgalo con el botón "Descargar PDF de Prueba" para verificar el acabado exacto.',
      },
    ],
  },
};

const STORAGE_KEY_PREFIX = 'dama_completed_module_tours';
const STORAGE_SKIP_ALL_KEY = 'dama_skip_auto_module_tour';

interface ModuleOnboardingModalProps {
  currentRoute: string;
}

export const ModuleOnboardingModal: React.FC<ModuleOnboardingModalProps> = ({ currentRoute }) => {
  const { user, updatePreferences } = useAuth();
  const { branding } = useBranding();

  const tourConfig = useMemo(() => MODULE_TOURS[currentRoute] || null, [currentRoute]);

  const storageKey = useMemo(
    () => `${STORAGE_KEY_PREFIX}_${user?.id || 'default'}`,
    [user?.id]
  );

  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const getVisitedRoutes = (): string[] => {
    try {
      const raw = localStorage.getItem(storageKey);
      const localList: string[] = raw ? JSON.parse(raw) : [];
      if (localStorage.getItem('dama_enable_auto_module_tour_test') === 'true') {
        return localList;
      }
      const dbList: string[] = Array.isArray(user?.preferences?.completedModuleTours)
        ? user!.preferences!.completedModuleTours!
        : [];
      return Array.from(new Set([...localList, ...dbList]));
    } catch {
      return [];
    }
  };

  // Automatically open when entering a module for the very first time
  useEffect(() => {
    if (!tourConfig || !user) {
      setIsOpen(false);
      return;
    }

    setStepIndex(0);

    // Check if auto-tour is globally muted (e.g. by automated background runner)
    const skipAuto =
      localStorage.getItem(STORAGE_SKIP_ALL_KEY) === 'true' ||
      (typeof navigator !== 'undefined' &&
        navigator.webdriver === true &&
        localStorage.getItem('dama_enable_auto_module_tour_test') !== 'true');
    if (skipAuto) {
      setIsOpen(false);
      return;
    }

    const visited = getVisitedRoutes();
    if (!visited.includes(tourConfig.route)) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [tourConfig, user?.id]);

  // Listen to custom event from Navbar "Guía del Módulo" button
  useEffect(() => {
    const onOpenTour = () => {
      setStepIndex(0);
      setIsOpen(true);
    };
    window.addEventListener('dama:open-module-tour', onOpenTour);
    return () => window.removeEventListener('dama:open-module-tour', onOpenTour);
  }, []);

  const markModuleVisited = async (route: string) => {
    try {
      const current = getVisitedRoutes();
      if (!current.includes(route)) {
        const updated = [...current, route];
        localStorage.setItem(storageKey, JSON.stringify(updated));
        await updatePreferences({ completedModuleTours: updated });
      }
    } catch {
      // ignore storage errors
    }
  };

  const handleCloseAndComplete = async () => {
    setIsOpen(false);
    if (tourConfig) {
      await markModuleVisited(tourConfig.route);
    }
  };

  const handleManualOpen = () => {
    setStepIndex(0);
    setIsOpen(true);
  };

  // Close with Escape key
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseAndComplete();
      } else if (e.key === 'ArrowRight' && tourConfig && stepIndex < tourConfig.steps.length - 1) {
        setStepIndex((prev) => prev + 1);
      } else if (e.key === 'ArrowLeft' && stepIndex > 0) {
        setStepIndex((prev) => prev - 1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, stepIndex, tourConfig]);

  if (!tourConfig) return null;

  const Icon = tourConfig.icon;
  const currentStep = tourConfig.steps[stepIndex] || tourConfig.steps[0];
  const isLastStep = stepIndex === tourConfig.steps.length - 1;

  return (
    <>
      {/* Only show standalone trigger on /portal where global Navbar is not rendered */}
      {currentRoute === '/portal' && (
        <div className="mb-3 flex items-center justify-end">
          <button
            type="button"
            onClick={handleManualOpen}
            data-testid="reopen-module-onboarding-btn"
            aria-label={`Abrir guía de inicio rápido de ${tourConfig.moduleTitle}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 shadow-2xs transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-slate-500" />
            <span>Guía del Módulo</span>
          </button>
        </div>
      )}

      {/* Strictly Centered First-Visit Module Onboarding Modal (Rule #3 — Linear / Emil Kowalski Design) */}
      <AnimatePresence>
        {isOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="module-onboarding-title"
            data-testid="module-onboarding-modal"
            className="fixed top-14 inset-x-0 bottom-0 z-40 flex items-center justify-center p-4 m-auto bg-slate-950/40 backdrop-blur-xs overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: 'spring', stiffness: 450, damping: 32 }}
              className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden m-auto flex flex-col"
            >
              {/* Clean Minimalist Header */}
              <div className="p-6 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-2xs text-slate-900 dark:text-white">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {tourConfig.moduleCode} · GUÍA INTERACTIVA
                        </span>
                      </div>
                      <h2
                        id="module-onboarding-title"
                        data-testid="module-onboarding-title"
                        className="text-lg font-bold tracking-tight text-slate-900 dark:text-white mt-1.5"
                      >
                        {tourConfig.moduleTitle}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        {tourConfig.subtitle}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    aria-label="Cerrar guía del módulo"
                    data-testid="module-onboarding-close-btn"
                    onClick={handleCloseAndComplete}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Step Progress Pills */}
                {tourConfig.steps.length > 1 && (
                  <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
                    {tourConfig.steps.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        aria-label={`Ir al paso ${idx + 1}`}
                        data-testid={`module-onboarding-step-pill-${idx}`}
                        onClick={() => setStepIndex(idx)}
                        className={`h-1.5 rounded-full transition-all cursor-pointer ${
                          idx === stepIndex
                            ? 'w-7 bg-slate-900 dark:bg-white'
                            : 'w-2.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
                        }`}
                      />
                    ))}
                    <span className="ml-auto text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400">
                      Paso {stepIndex + 1} de {tourConfig.steps.length}
                    </span>
                  </div>
                )}
              </div>

              {/* Step Body */}
              <div className="p-6 space-y-4">
                <div>
                  <h3
                    data-testid="module-onboarding-step-title"
                    className="text-sm font-semibold text-slate-900 dark:text-white"
                  >
                    {currentStep.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {currentStep.description}
                  </p>
                </div>

                {/* Key Capabilities Checklist */}
                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 space-y-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                    Puntos clave de este módulo
                  </span>
                  {currentStep.highlights.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                {/* Pro Tip Box (Neutral Crisp Surface, Never Monochromatic AI Box) */}
                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 shadow-2xs">
                  <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white">Consejo: </span>
                    <span>{currentStep.proTip}</span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  data-testid="module-onboarding-skip-btn"
                  onClick={handleCloseAndComplete}
                  className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Omitir guía
                </button>

                <div className="flex items-center gap-2">
                  {stepIndex > 0 && (
                    <button
                      type="button"
                      data-testid="module-onboarding-prev-btn"
                      onClick={() => setStepIndex((prev) => prev - 1)}
                      className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-2xs"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Anterior</span>
                    </button>
                  )}

                  {!isLastStep ? (
                    <button
                      type="button"
                      data-testid="module-onboarding-next-btn"
                      onClick={() => setStepIndex((prev) => prev + 1)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 shadow-xs transition-colors cursor-pointer"
                    >
                      <span>Siguiente</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      data-testid="module-onboarding-complete-btn"
                      onClick={handleCloseAndComplete}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>¡Entendido, empezar!</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
