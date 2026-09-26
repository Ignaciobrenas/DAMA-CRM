const fs = require('fs');
const path = require('path');

const esPath = path.join(__dirname, '..', 'client', 'src', 'i18n', 'locales', 'es.json');
const caPath = path.join(__dirname, '..', 'client', 'src', 'i18n', 'locales', 'ca.json');

const es = JSON.parse(fs.readFileSync(esPath, 'utf8'));

// Vocabulary and phrases for Catalan localization
const translationsMap = {
  // Navigation & Core
  "dashboard": "Panell Principal",
  "pipeline": "Pipeline de Vendes",
  "contacts": "Contactes",
  "companies": "Empreses",
  "invoicing": "Facturació i Pressupostos",
  "projects": "Projectes & Scrum",
  "inventory": "Catàleg & PIM",
  "workflows": "Automatitzacions",
  "omnichannel": "Missatgeria & Omnicanal",
  "settings": "Configuració del Sistema",
  "portalEmpleado": "Portal de l'Empleat",
  "reports": "Informes & BI",
  "leadCapture": "Captació de Leads",
  "faq": "Preguntes Freqüents (FAQ)",
  "privacy": "Privacitat & RGPD",
  
  // General UI
  "search": "Cercar",
  "searchPlaceholder": "Cercar a tot el CRM...",
  "notifications": "Notificacions",
  "profile": "El meu Perfil",
  "logout": "Tancar Sessió",
  "login": "Iniciar Sessió",
  "save": "Desar",
  "saveChanges": "Desar Canvis",
  "cancel": "Cancel·lar",
  "delete": "Eliminar",
  "edit": "Editar",
  "create": "Crear",
  "new": "Nou",
  "add": "Afegir",
  "actions": "Accions",
  "status": "Estat",
  "date": "Data",
  "total": "Total",
  "subtotal": "Subtotal",
  "tax": "Impostos",
  "currency": "Moneda",
  "notes": "Notes",
  "description": "Descripció",
  "name": "Nom",
  "firstName": "Nom",
  "lastName": "Cognoms",
  "email": "Correu Electrònic",
  "phone": "Telèfon",
  "address": "Adreça",
  "city": "Ciutat",
  "country": "País",
  "zipCode": "Codi Postal",
  "website": "Lloc Web",
  "industry": "Sector / Indústria",
  "loading": "Carregant...",
  "success": "Èxit",
  "error": "Error",
  "warning": "Avís",
  "info": "Informació",
  "confirm": "Confirmar",
  "close": "Tancar",
  "back": "Enrere",
  "next": "Següent",
  "finish": "Finalitzar",
  "skip": "Ometre",
  "exportCsv": "Exportar CSV",
  "exportPdf": "Exportar PDF",
  
  // Pipeline & Deals
  "newDeal": "Nou Negoci",
  "dealTitle": "Títol del Negoci",
  "dealValue": "Valor (€)",
  "expectedCloseDate": "Data Prevista de Tancament",
  "probability": "Probabilitat (%)",
  "pipelineTotal": "Volum Total del Pipeline",
  "weightedValue": "Valor Ponderat",
  "wonSales": "Vendes Guanyades",
  "activeDeals": "Negocis Actius",
  "dealsInPipeline": "Negocis en curs al pipeline",
  "invoicedAndExecuted": "Facturat i executat aquest any",
  "stage": "Fase",
  "deals": "negocis",
  "ongoing": "en curs",
  
  // Invoicing & Quotes
  "newInvoice": "Nova Factura",
  "newQuote": "Nou Pressupost",
  "invoiceNumber": "Núm. Factura",
  "quoteNumber": "Núm. Pressupost",
  "issueDate": "Data d'Emissió",
  "dueDate": "Data de Venciment",
  "lineItems": "Línies de Concepte",
  "addLine": "Afegir línia",
  "conceptDescription": "Descripció del servei o producte",
  "quantity": "Quantitat",
  "unitPrice": "Preu Unitari (€)",
  "statusPaid": "Cobrada",
  "statusPending": "Pendent",
  "statusDraft": "Esborrany",
  "statusOverdue": "Vençuda",
  "convertToInvoice": "Convertir a Factura",
  "quotes": "Pressupostos",
  "deleteInvoice": "Eliminar Factura",
  "deleteQuote": "Eliminar Pressupost",
  "confirmDeleteInvoice": "Esteu segur que voleu eliminar aquesta factura?",
  "confirmDeleteQuote": "Esteu segur que voleu eliminar aquest pressupost?",
  
  // Multi-Tax & Bulk
  "invoicing.taxGeneral": "IVA General (21%)",
  "invoicing.taxReduced": "IVA Reduït (10%)",
  "invoicing.taxSuperReduced": "IVA Superreduït (4%)",
  "invoicing.taxExempt": "Exempt d'IVA (0%)",
  "invoicing.taxCanary": "IGIC Canàries (7%)",
  "invoicing.taxSelect": "Tipus d'Impost",
  "invoicing.subtotal": "Base Imposable",
  "invoicing.taxAmount": "Impostos",
  "invoicing.totalAmount": "Total Factura",
  "invoicing.filterAll": "Totes",
  "invoicing.filterPaid": "Cobrades",
  "invoicing.filterPending": "Pendents",
  "invoicing.filterDraft": "Esborranys",
  "invoicing.exportInvoicesCsv": "Exportar Factures (CSV)",
  "invoicing.exportQuotesCsv": "Exportar Pressupostos (CSV)",
  "invoicing.reminderSent": "Recordatori de cobrament enviat amb èxit",
  "invoicing.sendReminder": "Reclamar Pagament",
  
  "bulk.selectedCount": "{count} seleccionats",
  "bulk.exportCsv": "Exportar CSV",
  "bulk.exportAll": "Exportar Tot a CSV",
  "bulk.markAsClient": "Marcar com a Client",
  "bulk.markAsLead": "Marcar com a Lead",
  "bulk.deleteSelected": "Eliminar seleccionats",
  "bulk.deselectAll": "Desseleccionar",
  "bulk.confirmDelete": "Esteu segur que voleu eliminar els {count} elements seleccionats?",
  "bulk.deleteSuccess": "{count} elements eliminats amb èxit",
  "bulk.updateSuccess": "{count} elements actualitzats amb èxit",
  "bulk.error": "Error en realitzar l'operació per lots",
  
  "dashboard.periodSelector": "Període",
  "dashboard.today": "Avui",
  "dashboard.thisWeek": "Aquesta Setmana",
  "dashboard.thisMonth": "Aquest Mes",
  "dashboard.thisQuarter": "Aquest Trimestre",
  "dashboard.thisYear": "Any Fiscal",
  "dashboard.cashflowForecast": "Previsió de Cobraments & Caixa",
  "dashboard.forecast30": "Propers 30 dies",
  "dashboard.forecast60": "30 a 60 dies",
  "dashboard.forecast90": "60 a 90 dies",
  "dashboard.conversionRate": "Taxa de Conversió",
  "dashboard.pipelineWeighted": "Valor Ponderat de Pipeline",
  "dashboard.customizableDragDrop": "Personalitzable (Arrossegar & Deixar anar)",
  "dashboard.dragDropInstructions": "Organitza la teva vista executiva arrossegant les targetes. L'ordre es desa automàticament.",
  "dashboard.resetLayout": "Restablir Disseny",
  "dashboard.resetLayoutDefault": "Restablir a la disposició predeterminada",
  "dashboard.kpisTitle": "Indicadors Clau de Rendiment (KPIs)",
  "dashboard.kpisSubtitle": "Visió global financera i comercial de l'empresa",
  "dashboard.pipelineChartTitle": "Distribució de Pipeline per Etapes",
  "dashboard.pipelineChartSubtitle": "Seguiment de volum de negocis i etapes d'oportunitats",
  "dashboard.recentTasksTitle": "Les Meves Tasques Actives",
  "dashboard.recentTasksSubtitle": "Tasques del sprint assignades al teu equip",
  "dashboard.topDealsWidgetTitle": "Principals Oportunitats B2B",
  "dashboard.topDealsWidgetSubtitle": "Negocis amb major valor econòmic",
  "dashboard.quickActionsTitle": "Operacions Ràpides",
  "dashboard.quickActionsSubtitle": "Dreceres a mòduls centrals del CRM",
  
  // Audit Logs
  "audit.title": "Registre d'Auditoria & Traçabilitat Forense",
  "audit.subtitle": "Supervisió immutable de totes les accions, accessos, canvis de permisos i descàrregues de dades a la plataforma.",
  "audit.filterAction": "Filtrar per Acció",
  "audit.filterEntity": "Filtrar per Entitat",
  "audit.searchUserIp": "Cercar per usuari o IP...",
  "audit.exportAuditLogs": "Exportar Auditoria (CSV)",
  "audit.allActions": "Totes les accions",
  "audit.allEntities": "Totes les entitats",
  "audit.colTimestamp": "Data i Hora",
  "audit.colUser": "Usuari / Agent",
  "audit.colAction": "Acció",
  "audit.colEntity": "Entitat",
  "audit.colIp": "Adreça IP",
  "audit.colDetails": "Detalls de l'Esdeveniment",
  "audit.noLogsFound": "No s'han trobat registres d'auditoria amb els filtres seleccionats",
  
  // Portal Empleat
  "portal.title": "Portal de l'Empleat & Jornada Laboral",
  "portal.subtitle": "Registre horari oficial, consulta de nòmines i estat del torn segons l'Estatut dels Treballadors.",
  "portal.workShift": "Jornada Laboral & Fitxatge",
  "portal.clockIn": "Fitxar Entrada",
  "portal.clockOut": "Fitxar Sortida",
  "portal.currentStatus": "Estat Actual del Torn",
  "portal.clockedIn": "Treballant",
  "portal.clockedOut": "Fora de Jornada",
  "portal.workedToday": "Temps treballat avui",
  "portal.shiftHistory": "Historial de Fitxatges",
  "portal.myPayrolls": "Les Meves Nòmines",
  "portal.syncOdoo": "Sincronitzar amb Odoo HR",
  "portal.reason": "Motiu / Observacions",
  "portal.reasonStandard": "Jornada laboral ordinària",
  "portal.reasonOvertime": "Hores extraordinàries",
  "portal.reasonTelework": "Teletreball / Remot",
  "portal.reasonMedical": "Visita mèdica justificada",
  "portal.payrollsTitle": "Nòmines Oficials",
  "portal.payrollsSubtitle": "Descàrrega i revisió de rebuts salarials mensuals.",
  "portal.netSalary": "Salari Net",
  "portal.grossSalary": "Salari Brut",
  "portal.deductions": "Deduccions & IRPF",
  "portal.downloadPdf": "Descarregar Nòmina (PDF)"
};

// Full translation generation
const ca = {};

for (const [k, v] of Object.entries(es)) {
  if (translationsMap[k]) {
    ca[k] = translationsMap[k];
    continue;
  }
  
  if (typeof v !== 'string') {
    ca[k] = v;
    continue;
  }
  
  // Heuristic rule replacement for complete coverage
  let text = v
    .replace(/\bBienvenido a\b/gi, 'Benvingut a')
    .replace(/\bBienvenido\b/gi, 'Benvingut')
    .replace(/\bBienvenida\b/gi, 'Benvinguda')
    .replace(/\bIniciar Sesión\b/gi, 'Iniciar Sessió')
    .replace(/\bCerrar Sesión\b/gi, 'Tancar Sessió')
    .replace(/\bCrear Cuenta\b/gi, 'Crear Compte')
    .replace(/\bRegistrarse\b/gi, 'Registrar-se')
    .replace(/\bContraseña\b/gi, 'Contrasenya')
    .replace(/\bCorreo Electrónico\b/gi, 'Correu Electrònic')
    .replace(/\bCorreo\b/gi, 'Correu')
    .replace(/\bTeléfono\b/gi, 'Telèfon')
    .replace(/\bDirección\b/gi, 'Adreça')
    .replace(/\bCiudad\b/gi, 'Ciutat')
    .replace(/\bPaís\b/gi, 'País')
    .replace(/\bCódigo Postal\b/gi, 'Codi Postal')
    .replace(/\bNombre\b/gi, 'Nom')
    .replace(/\bApellidos\b/gi, 'Cognoms')
    .replace(/\bApellido\b/gi, 'Cognom')
    .replace(/\bDescripción\b/gi, 'Descripció')
    .replace(/\bGuardar Cambios\b/gi, 'Desar Canvis')
    .replace(/\bGuardar\b/gi, 'Desar')
    .replace(/\bCancelar\b/gi, 'Cancel·lar')
    .replace(/\bEliminar\b/gi, 'Eliminar')
    .replace(/\bEditar\b/gi, 'Editar')
    .replace(/\bBuscar\b/gi, 'Cercar')
    .replace(/\bConfiguración\b/gi, 'Configuració')
    .replace(/\bInformes\b/gi, 'Informes')
    .replace(/\bFacturación\b/gi, 'Facturació')
    .replace(/\bFacturas\b/gi, 'Factures')
    .replace(/\bFactura\b/gi, 'Factura')
    .replace(/\bPresupuestos\b/gi, 'Pressupostos')
    .replace(/\bPresupuesto\b/gi, 'Pressupost')
    .replace(/\bContactos\b/gi, 'Contactes')
    .replace(/\bContacto\b/gi, 'Contacte')
    .replace(/\bEmpresas\b/gi, 'Empreses')
    .replace(/\bEmpresa\b/gi, 'Empresa')
    .replace(/\bNegocios\b/gi, 'Negocis')
    .replace(/\bNegocio\b/gi, 'Negoci')
    .replace(/\bOportunidades\b/gi, 'Oportunitats')
    .replace(/\bOportunidad\b/gi, 'Oportunitat')
    .replace(/\bProyectos\b/gi, 'Projectes')
    .replace(/\bProyecto\b/gi, 'Projecte')
    .replace(/\bTareas\b/gi, 'Tasques')
    .replace(/\bTarea\b/gi, 'Tasca')
    .replace(/\bUsuarios\b/gi, 'Usuaris')
    .replace(/\bUsuario\b/gi, 'Usuari')
    .replace(/\bAuditoría\b/gi, 'Auditoria')
    .replace(/\bNotificaciones\b/gi, 'Notificacions')
    .replace(/\bNotificación\b/gi, 'Notificació')
    .replace(/\bNóminas\b/gi, 'Nòmines')
    .replace(/\bNómina\b/gi, 'Nòmina')
    .replace(/\bPortal del Empleado\b/gi, "Portal de l'Empleat")
    .replace(/\bFichaje\b/gi, 'Fitxatge')
    .replace(/\bFichajes\b/gi, 'Fitxatges')
    .replace(/\bEntrada\b/gi, 'Entrada')
    .replace(/\bSalida\b/gi, 'Sortida')
    .replace(/\bJornada\b/gi, 'Jornada')
    .replace(/\bFecha\b/gi, 'Data')
    .replace(/\bHora\b/gi, 'Hora')
    .replace(/\bEstado\b/gi, 'Estat')
    .replace(/\bAcciones\b/gi, 'Accions')
    .replace(/\bAcción\b/gi, 'Acció')
    .replace(/\bDetalles\b/gi, 'Detalls')
    .replace(/\bDetalle\b/gi, 'Detall')
    .replace(/\bPendiente\b/gi, 'Pendent')
    .replace(/\bPendientes\b/gi, 'Pendents')
    .replace(/\bCompletado\b/gi, 'Completat')
    .replace(/\bCompletada\b/gi, 'Completada')
    .replace(/\bEn Progreso\b/gi, 'En Curs')
    .replace(/\bPor Hacer\b/gi, 'Per Fer')
    .replace(/\bRevisión\b/gi, 'Revisió')
    .replace(/\bBaja\b/gi, 'Baixa')
    .replace(/\bMedia\b/gi, 'Mitjana')
    .replace(/\bAlta\b/gi, 'Alta')
    .replace(/\bUrgente\b/gi, 'Urgent')
    .replace(/\bPrioridad\b/gi, 'Prioritat')
    .replace(/\bAsignado a\b/gi, 'Assignat a')
    .replace(/\bTodas\b/gi, 'Totes')
    .replace(/\bTodos\b/gi, 'Tots')
    .replace(/\bTodo\b/gi, 'Tot')
    .replace(/\bHoy\b/gi, 'Avui')
    .replace(/\bEsta Semana\b/gi, 'Aquesta Setmana')
    .replace(/\bEste Mes\b/gi, 'Aquest Mes')
    .replace(/\bEste Trimestre\b/gi, 'Aquest Trimestre')
    .replace(/\bAño Fiscal\b/gi, 'Any Fiscal')
    .replace(/\bPrevisión de Cobros & Caja\b/gi, 'Previsió de Cobraments i Caixa')
    .replace(/\bPróximos 30 días\b/gi, 'Propers 30 dies')
    .replace(/\b30 a 60 días\b/gi, '30 a 60 dies')
    .replace(/\b60 a 90 días\b/gi, '60 a 90 dies')
    .replace(/\bTasa de Conversión\b/gi, 'Taxa de Conversió')
    .replace(/\bValor Ponderado de Pipeline\b/gi, 'Valor Ponderat del Pipeline')
    .replace(/\bBase Imponible\b/gi, 'Base Imposable')
    .replace(/\bImpuestos\b/gi, 'Impostos')
    .replace(/\bTotal Factura\b/gi, 'Total Factura')
    .replace(/\bCobradas\b/gi, 'Cobrades')
    .replace(/\bBorradores\b/gi, 'Esborranys')
    .replace(/\bBorrador\b/gi, 'Esborrany')
    .replace(/\bReclamar Pago\b/gi, 'Reclamar Pagament')
    .replace(/\bRecordatorio de cobro enviado con éxito\b/gi, 'Recordatori de cobrament enviat amb èxit')
    .replace(/\bExportar Facturas \(CSV\)\b/gi, 'Exportar Factures (CSV)')
    .replace(/\bExportar Presupuestos \(CSV\)\b/gi, 'Exportar Pressupostos (CSV)')
    .replace(/\bExportar Todo a CSV\b/gi, 'Exportar Tot a CSV')
    .replace(/\bMarcar como Cliente\b/gi, 'Marcar com a Client')
    .replace(/\bMarcar como Lead\b/gi, 'Marcar com a Lead')
    .replace(/\bEliminar seleccionados\b/gi, 'Eliminar seleccionats')
    .replace(/\bDeseleccionar\b/gi, 'Desseleccionar')
    .replace(/\bseleccionados\b/gi, 'seleccionats')
    .replace(/\bcon éxito\b/gi, 'amb èxit')
    .replace(/\bcorrectamente\b/gi, 'correctament')
    .replace(/\bal menos\b/gi, 'almenys')
    .replace(/\bpor favor\b/gi, 'si us plau')
    .replace(/\bPor favor\b/gi, 'Si us plau')
    .replace(/\b¿Estás seguro de que deseas eliminar\b/gi, 'Segur que voleu eliminar')
    .replace(/\b¿Está seguro de que desea eliminar\b/gi, 'Segur que voleu eliminar')
    .replace(/\bNo se encontraron resultados\b/gi, "No s'han trobat resultats")
    .replace(/\bNo hay\b/gi, 'No hi ha')
    .replace(/\bCargando\b/gi, 'Carregant')
    .replace(/\bSiguiente\b/gi, 'Següent')
    .replace(/\bAnterior\b/gi, 'Anterior')
    .replace(/\bFinalizar\b/gi, 'Finalitzar')
    .replace(/\bOmitir\b/gi, 'Ometre')
    .replace(/\bContinuar\b/gi, 'Continuar')
    .replace(/\bAtrás\b/gi, 'Enrere')
    .replace(/\bSí\b/gi, 'Sí')
    .replace(/\bNo\b/gi, 'No')
    .replace(/\bActivo\b/gi, 'Actiu')
    .replace(/\bActiva\b/gi, 'Activa')
    .replace(/\bInactivo\b/gi, 'Inactiu')
    .replace(/\bInactiva\b/gi, 'Inactiva')
    .replace(/\bDesactivar\b/gi, 'Desactivar')
    .replace(/\bActivar\b/gi, 'Activar')
    .replace(/\bHabilitado\b/gi, 'Habilitat')
    .replace(/\bDeshabilitado\b/gi, 'Deshabilitat')
    .replace(/\bTamaño\b/gi, 'Mida')
    .replace(/\bFuente\b/gi, 'Font')
    .replace(/\bEscala\b/gi, 'Escala')
    .replace(/\bIconos\b/gi, 'Icones')
    .replace(/\bTema\b/gi, 'Tema')
    .replace(/\bClaro\b/gi, 'Clar')
    .replace(/\bOscuro\b/gi, 'Fosc')
    .replace(/\bAutomático\b/gi, 'Automàtic');
    
  ca[k] = text;
}

fs.writeFileSync(caPath, JSON.stringify(ca, null, 2), 'utf8');
console.log('Successfully written ca.json with ' + Object.keys(ca).length + ' keys.');
