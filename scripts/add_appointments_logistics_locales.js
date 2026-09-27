const fs = require('fs');
const path = require('path');

const localesDir = path.resolve(__dirname, '../client/src/i18n/locales');

const newTranslations = {
  "sidebar.appointments": {
    es: "Citas & Salón",
    ca: "Cites & Saló",
    en: "Appointments & Salon",
    fr: "Rendez-vous & Salon",
    de: "Termine & Salon",
    it: "Appuntamenti e Salone",
    pt: "Agendamentos & Salão",
    ar: "المواعيد والصالون",
    zh: "预约与沙龙",
    ja: "予約 & サロン",
    ru: "Записи и Салон"
  },
  "sidebar.logistics": {
    es: "Logística & Paquetería",
    ca: "Logística & Paqueteria",
    en: "Logistics & Courier",
    fr: "Logistique & Colis",
    de: "Logistik & Paketversand",
    it: "Logistica e Spedizioni",
    pt: "Logística & Encomendas",
    ar: "اللوجستيات والشحن",
    zh: "物流与快递追踪",
    ja: "物流 & 宅配便追跡",
    ru: "Логистика и Доставка"
  },
  "appointments.title": {
    es: "Citas, Salón & Estimación de Ingresos",
    ca: "Cites, Saló & Estimació d'Ingressos",
    en: "Appointments, Salon & Revenue Estimation",
    fr: "Rendez-vous, Salon & Estimation des Revenus",
    de: "Termine, Salon & Umsatzprognose",
    it: "Appuntamenti, Salone e Stima Ricavi",
    pt: "Agendamentos, Salão e Estimativa de Receita",
    ar: "المواعيد وصالون التجميل وتقدير الإيرادات",
    zh: "预约、沙龙与预估收入管理",
    ja: "予約・サロン・収益予測管理",
    ru: "Записи, Салон и Оценка Доходов"
  },
  "appointments.subtitle": {
    es: "Gestión integral de reservas, cálculo automático de ganancias por cita y control de insumos",
    ca: "Gestió integral de reserves, càlcul automàtic de guanys per cita i control d'insums",
    en: "Comprehensive booking management, automatic per-appointment profit calculation, and supply control",
    fr: "Gestion complète des réservations, calcul automatique des bénéfices par rendez-vous et contrôle des fournitures",
    de: "Umfassende Buchungsverwaltung, automatische Gewinnberechnung pro Termin und Materialkontrolle",
    it: "Gestione completa delle prenotazioni, calcolo automatico del profitto per appuntamento e controllo forniture",
    pt: "Gestão completa de agendamentos, cálculo automático de lucro por atendimento e controle de insumos",
    ar: "إدارة شاملة للحجوزات وحساب تلقائي لأرباح كل موعد ومراقبة استهلاك المواد",
    zh: "全方位预约管理，自动核算单次服务利润并掌控耗材成本",
    ja: "予約の一元管理、予約ごとの利益自動計算、消耗品コストの追跡",
    ru: "Полное управление записями, автоматический расчет прибыли за процедуру и учет расходников"
  },
  "appointments.addService": {
    es: "+ Servicio / Tarifa",
    ca: "+ Servei / Tarifa",
    en: "+ Service / Rate",
    fr: "+ Service / Tarif",
    de: "+ Dienstleistung / Tarif",
    it: "+ Servizio / Tariffa",
    pt: "+ Serviço / Tarifa",
    ar: "+ خدمة / تسعيرة",
    zh: "+ 新增服务/价格",
    ja: "+ サービス・料金追加",
    ru: "+ Услуга / Тариф"
  },
  "appointments.newAppointment": {
    es: "Nueva Cita",
    ca: "Nova Cita",
    en: "New Appointment",
    fr: "Nouveau rendez-vous",
    de: "Neuer Termin",
    it: "Nuovo Appuntamento",
    pt: "Novo Agendamento",
    ar: "موعد جديد",
    zh: "新增预约",
    ja: "新規予約",
    ru: "Новая запись"
  },
  "appointments.tabAppointments": {
    es: "Agenda de Citas",
    ca: "Agenda de Cites",
    en: "Appointments Schedule",
    fr: "Planning des rendez-vous",
    de: "Terminplaner",
    it: "Agenda Appuntamenti",
    pt: "Agenda de Citas",
    ar: "جدول المواعيد",
    zh: "预约日程表",
    ja: "予約スケジュール",
    ru: "График записей"
  },
  "appointments.tabServices": {
    es: "Catálogo de Servicios & Costes",
    ca: "Catàleg de Serveis & Costos",
    en: "Services Catalog & Costs",
    fr: "Catalogue de services et coûts",
    de: "Dienstleistungskatalog & Kosten",
    it: "Catalogo Servizi e Costi",
    pt: "Catálogo de Serviços e Custos",
    ar: "كتالوج الخدمات والتكاليف",
    zh: "服务项目目录与成本",
    ja: "サービス一覧と原価",
    ru: "Каталог услуг и затрат"
  },
  "appointments.tabAnalytics": {
    es: "Rendimiento de Estilistas",
    ca: "Rendiment d'Estilistes",
    en: "Stylist Performance",
    fr: "Performance des stylistes",
    de: "Stylisten-Leistung",
    it: "Prestazioni Stilisti",
    pt: "Desempenho dos Profissionais",
    ar: "أداء مصففي الشعر والموظفين",
    zh: "发型师与技师业绩",
    ja: "スタイリスト実績分析",
    ru: "Эффективность мастеров"
  },
  "logistics.title": {
    es: "Logística, Paquetería & Envíos",
    ca: "Logística, Paqueteria & Enviaments",
    en: "Logistics, Parcels & Shipping",
    fr: "Logistique, Colis & Expéditions",
    de: "Logistik, Pakete & Versand",
    it: "Logistica, Pacchi e Spedizioni",
    pt: "Logística, Encomendas e Envios",
    ar: "اللوجستيات والطرود والشحن",
    zh: "物流、包裹与快递追踪",
    ja: "物流・小包・配送管理",
    ru: "Логистика, Посылки и Отправка"
  },
  "logistics.subtitle": {
    es: "Seguimiento de paquetes en tiempo real, cálculo de costes de envío y sincronización con agencias de transporte",
    ca: "Seguiment de paquets en temps real, càlcul de costos d'enviament i sincronització amb agències de transport",
    en: "Real-time parcel tracking, shipping cost estimation, and carrier synchronization",
    fr: "Suivi des colis en temps réel, calcul des frais de port et synchronisation avec les transporteurs",
    de: "Echtzeit-Paketverfolgung, Versandkostenberechnung und Speditionssynchronisierung",
    it: "Tracciamento pacchi in tempo reale, calcolo costi di spedizione e sincronizzazione corrieri",
    pt: "Rastreamento de encomendas em tempo real, cálculo de frete e sincronização com transportadoras",
    ar: "تتبع الطرود في الوقت الفعلي وحساب تكاليف الشحن والمزامنة مع شركات النقل",
    zh: "包裹实时物流追踪、运费核算及各大快递物流公司无缝同步",
    ja: "荷物のリアルタイム追跡、配送料金の自動計算、運送会社連携",
    ru: "Отслеживание посылок в реальном времени, расчет стоимости доставки и синхронизация со службами"
  },
  "logistics.newShipment": {
    es: "Nuevo Envío / Paquete",
    ca: "Nou Enviament / Paquet",
    en: "New Shipment / Parcel",
    fr: "Nouvelle expédition / Colis",
    de: "Neue Sendung / Paket",
    it: "Nuova Spedizione / Pacco",
    pt: "Novo Envio / Pacote",
    ar: "شحنة / طرد جديد",
    zh: "创建新发货/包裹",
    ja: "新規発送・荷物作成",
    ru: "Новая отправка / Посылка"
  },
  "logistics.tabShipments": {
    es: "Lista de Envíos & Tracking",
    ca: "Llista d'Enviaments & Tracking",
    en: "Shipments List & Tracking",
    fr: "Liste des expéditions & Suivi",
    de: "Sendungsliste & Tracking",
    it: "Lista Spedizioni e Tracking",
    pt: "Lista de Envios e Rastreio",
    ar: "قائمة الشحنات والتتبع",
    zh: "发货列表与物流追踪",
    ja: "配送リスト & 追跡",
    ru: "Список отправлений и трекинг"
  },
  "logistics.tabAnalytics": {
    es: "Métricas de Transportistas",
    ca: "Mètriques de Transportistes",
    en: "Carrier Performance Metrics",
    fr: "Métriques des transporteurs",
    de: "Speditions-Kennzahlen",
    it: "Metriche Corrieri",
    pt: "Métricas das Transportadoras",
    ar: "مقاييس شركات الشحن",
    zh: "快递承运商绩效分析",
    ja: "配送業者パフォーマンス指標",
    ru: "Метрики курьерских служб"
  },
  "logistics.tabConnectors": {
    es: "Conectores de Agencias",
    ca: "Connectors d'Agències",
    en: "Agency & Courier Connectors",
    fr: "Connecteurs de transporteurs",
    de: "Speditions-Konnektoren",
    it: "Connettori Agenzie",
    pt: "Conectores de Agências",
    ar: "موصلات شركات النقل",
    zh: "物流服务商 API 连接器",
    ja: "配送業者 API コネクタ",
    ru: "Коннекторы служб доставки"
  }
};

const languages = ['es', 'ca', 'en', 'fr', 'de', 'it', 'pt', 'ar', 'zh', 'ja', 'ru'];

for (const lang of languages) {
  const filePath = path.join(localesDir, `${lang}.json`);
  let data = {};
  if (fs.existsSync(filePath)) {
    data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  for (const [key, translationsMap] of Object.entries(newTranslations)) {
    data[key] = translationsMap[lang] || translationsMap.es || key;
  }

  const sorted = {};
  for (const k of Object.keys(data).sort()) {
    sorted[k] = data[k];
  }

  fs.writeFileSync(filePath, JSON.stringify(sorted, null, 2) + '\n', 'utf8');
  console.log(`Updated ${lang}.json (${Object.keys(sorted).length} keys)`);
}

console.log('✅ Appointments and Logistics translations applied successfully!');
