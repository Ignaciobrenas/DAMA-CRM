const fs = require('fs');
const path = require('path');

const localesDir = path.resolve(__dirname, '../client/src/i18n/locales');

const newTranslations = {
  activeLanguage: {
    es: "Idioma activo",
    ca: "Idioma actiu",
    en: "Active language",
    fr: "Langue active",
    de: "Aktive Sprache",
    it: "Lingua attiva",
    pt: "Idioma ativo",
    ar: "اللغة النشطة",
    zh: "当前语言",
    ja: "使用言語",
    ru: "Активный язык"
  },
  searchLanguage: {
    es: "Buscar idioma...",
    ca: "Cercar idioma...",
    en: "Search language...",
    fr: "Rechercher une langue...",
    de: "Sprache suchen...",
    it: "Cerca lingua...",
    pt: "Procurar idioma...",
    ar: "البحث عن لغة...",
    zh: "搜索语言...",
    ja: "言語を検索...",
    ru: "Поиск языка..."
  },
  "common.edit": {
    es: "Editar",
    ca: "Editar",
    en: "Edit",
    fr: "Modifier",
    de: "Bearbeiten",
    it: "Modifica",
    pt: "Editar",
    ar: "تعديل",
    zh: "编辑",
    ja: "編集",
    ru: "Редактировать"
  },
  "omnichannel.subtitle": {
    es: "Bandeja de entrada unificada de WhatsApp Meta Cloud API y correos de clientes",
    ca: "Bústia d'entrada unificada de WhatsApp Meta Cloud API i correus de clients",
    en: "Unified inbox for WhatsApp Meta Cloud API and customer emails",
    fr: "Boîte de réception unifiée pour l'API WhatsApp Meta Cloud et les e-mails clients",
    de: "Einheitlicher Posteingang für WhatsApp Meta Cloud API und Kunden-E-Mails",
    it: "Casella di posta unificata per WhatsApp Meta Cloud API e le email dei clienti",
    pt: "Caixa de entrada unificada para a API WhatsApp Meta Cloud e e-mails de clientes",
    ar: "صندوق بريد موحد لواجهة برمجة تطبيقات WhatsApp Meta Cloud ورسائل البريد الإلكتروني للعملاء",
    zh: "WhatsApp Meta Cloud API 与客户邮件统一收件箱",
    ja: "WhatsApp Meta Cloud APIと顧客メールの統合インボックス",
    ru: "Единый почтовый ящик для WhatsApp Meta Cloud API и писем клиентов"
  },
  "omnichannel.internalSubtitle": {
    es: "Canales de equipo, salas por departamento y mensajes directos corporativos",
    ca: "Canals d'equip, sales per departament i missatges directes corporatius",
    en: "Team channels, department rooms, and corporate direct messages",
    fr: "Canaux d'équipe, salons par département et messages directs d'entreprise",
    de: "Teamkanäle, Abteilungsräume und direkte Unternehmensnachrichten",
    it: "Canali di team, stanze di reparto e messaggi diretti aziendali",
    pt: "Canais de equipe, salas de departamento e mensagens diretas corporativas",
    ar: "قنوات الفريق وغرف الأقسام والرسائل المباشرة للشركات",
    zh: "团队频道、部门讨论室及企业私信",
    ja: "チームチャンネル、部門ルーム、企業ダイレクトメッセージ",
    ru: "Командные каналы, комнаты отделов и корпоративные личные сообщения"
  },
  "omnichannel.tabWhatsApp": {
    es: "WhatsApp & Clientes",
    ca: "WhatsApp i Clients",
    en: "WhatsApp & Clients",
    fr: "WhatsApp & Clients",
    de: "WhatsApp & Kunden",
    it: "WhatsApp & Clienti",
    pt: "WhatsApp e Clientes",
    ar: "واتساب والعملاء",
    zh: "WhatsApp 与客户",
    ja: "WhatsApp & 顧客",
    ru: "WhatsApp и Клиенты"
  },
  "omnichannel.tabInternal": {
    es: "Chat Interno de Equipo",
    ca: "Xat Intern d'Equip",
    en: "Internal Team Chat",
    fr: "Chat d'équipe interne",
    de: "Interner Team-Chat",
    it: "Chat interna di team",
    pt: "Chat Interno da Equipe",
    ar: "الدردشة الداخلية للفريق",
    zh: "内部团队聊天",
    ja: "社内チームチャット",
    ru: "Внутренний чат команды"
  },
  "omnichannel.wsLive": {
    es: "En Vivo",
    ca: "En Viu",
    en: "Live",
    fr: "En direct",
    de: "Live",
    it: "In diretta",
    pt: "Ao Vivo",
    ar: "مباشر",
    zh: "在线",
    ja: "ライブ",
    ru: "В сети"
  },
  "omnichannel.wsReconnecting": {
    es: "Reconectando...",
    ca: "Reconnectant...",
    en: "Reconnecting...",
    fr: "Reconnexion...",
    de: "Neu verbinden...",
    it: "Riconnessione...",
    pt: "Reconectando...",
    ar: "إعادة الاتصال...",
    zh: "正在重新连接...",
    ja: "再接続中...",
    ru: "Переподключение..."
  },
  "omnichannel.internalDirectory": {
    es: "Canales & Compañeros",
    ca: "Canals i Companys",
    en: "Channels & Teammates",
    fr: "Canaux & Collègues",
    de: "Kanäle & Teammitglieder",
    it: "Canali & Colleghi",
    pt: "Canais e Colegas",
    ar: "القنوات وزملاء الفريق",
    zh: "频道与团队成员",
    ja: "チャンネル & チームメンバー",
    ru: "Каналы и коллеги"
  },
  "omnichannel.searchTeamPlaceholder": {
    es: "Buscar canal o compañero...",
    ca: "Cercar canal o company...",
    en: "Search channel or teammate...",
    fr: "Rechercher un canal ou un collègue...",
    de: "Kanal oder Teammitglied suchen...",
    it: "Cerca canale o collega...",
    pt: "Buscar canal ou colega...",
    ar: "البحث عن قناة أو زميل...",
    zh: "搜索频道或同事...",
    ja: "チャンネルまたは同僚を検索...",
    ru: "Поиск канала или коллеги..."
  },
  "omnichannel.channelsTitle": {
    es: "Canales Corporativos",
    ca: "Canals Corporatius",
    en: "Corporate Channels",
    fr: "Canaux d'entreprise",
    de: "Unternehmenskanäle",
    it: "Canali aziendali",
    pt: "Canais Corporativos",
    ar: "القنوات المؤسسية",
    zh: "企业频道",
    ja: "企業チャンネル",
    ru: "Корпоративные каналы"
  },
  "omnichannel.teamDMsTitle": {
    es: "Mensajes Directos",
    ca: "Missatges Directes",
    en: "Direct Messages",
    fr: "Messages directs",
    de: "Direktnachrichten",
    it: "Messaggi diretti",
    pt: "Mensagens Diretas",
    ar: "الرسائل المباشرة",
    zh: "私信消息",
    ja: "ダイレクトメッセージ",
    ru: "Личные сообщения"
  },
  "omnichannel.emptyConversation": {
    es: "Sin mensajes en la conversación. Puedes enviar el primer mensaje a continuación.",
    ca: "Sense missatges a la conversa. Podeu enviar el primer missatge a continuació.",
    en: "No messages in this conversation yet. Send the first message below.",
    fr: "Aucun message dans cette conversation. Vous pouvez envoyer le premier message ci-dessous.",
    de: "Noch keine Nachrichten in dieser Unterhaltung. Senden Sie die erste Nachricht unten.",
    it: "Nessun messaggio in questa conversazione. Invia il primo messaggio qui sotto.",
    pt: "Nenhuma mensagem nesta conversa ainda. Envie a primeira mensagem abaixo.",
    ar: "لا توجد رسائل في هذه المحادثة حتى الآن. يمكنك إرسال الرسالة الأولى أدناه.",
    zh: "暂无消息。您可以在下方发送第一条消息。",
    ja: "この会話にはまだメッセージがありません。以下から最初のメッセージを送信してください。",
    ru: "В этой беседе пока нет сообщений. Отправьте первое сообщение ниже."
  },
  "omnichannel.noContacts": {
    es: "No se encontraron contactos",
    ca: "No s'han trobat contactes",
    en: "No contacts found",
    fr: "Aucun contact trouvé",
    de: "Keine Kontakte gefunden",
    it: "Nessun contatto trovato",
    pt: "Nenhum contato encontrado",
    ar: "لم يتم العثور على جهات اتصال",
    zh: "未找到联系人",
    ja: "連絡先が見つかりません",
    ru: "Контакты не найдены"
  },
  "settings.users.auditTitle": {
    es: "Auditoría & Actividad de Usuario",
    ca: "Auditoria i Activitat d'Usuari",
    en: "User Audit & Activity",
    fr: "Audit & Activité Utilisateur",
    de: "Benutzer-Audit & Aktivität",
    it: "Audit e Attività Utente",
    pt: "Auditoria e Atividade do Usuário",
    ar: "تدقيق ونشاط المستخدم",
    zh: "用户审计与活动",
    ja: "ユーザー監査とアクティビティ",
    ru: "Аудит и активность пользователя"
  },
  "settings.users.auditSubtitle": {
    es: "Historial de inicios de sesión, cambios en la plataforma y permisos asignados",
    ca: "Historial d'inicis de sessió, canvis a la plataforma i permisos assignats",
    en: "Login history, platform audit modifications, and assigned permissions",
    fr: "Historique des connexions, modifications de plateforme et autorisations",
    de: "Anmeldeverlauf, Plattform-Änderungen und zugewiesene Berechtigungen",
    it: "Cronologia accessi, modifiche di controllo e autorizzazioni assegnate",
    pt: "Histórico de logins, modificações na plataforma e permissões atribuídas",
    ar: "سجل تسجيل الدخول وتعديلات النظام والأذونات المعينة",
    zh: "登录历史、平台审计变更与已分配权限",
    ja: "ログイン履歴、プラットフォーム変更監査、割り当てられた権限",
    ru: "История входов, аудит изменений на платформе и назначенные права"
  },
  "settings.users.tabLogins": {
    es: "Inicios de Sesión",
    ca: "Inicis de Sessió",
    en: "Logins History",
    fr: "Historique des connexions",
    de: "Anmeldeverlauf",
    it: "Cronologia accessi",
    pt: "Histórico de Logins",
    ar: "سجل تسجيلات الدخول",
    zh: "登录记录",
    ja: "ログイン履歴",
    ru: "История входов"
  },
  "settings.users.tabAudit": {
    es: "Registro de Cambios",
    ca: "Registre de Canvis",
    en: "Change Log & Audit",
    fr: "Journal des modifications",
    de: "Änderungsprotokoll",
    it: "Registro modifiche",
    pt: "Registro de Alterações",
    ar: "سجل التغييرات",
    zh: "变更记录",
    ja: "変更履歴",
    ru: "Журнал изменений"
  },
  "settings.users.tabPermissions": {
    es: "Permisos Activos",
    ca: "Permisos Actius",
    en: "Active Permissions",
    fr: "Autorisations actives",
    de: "Aktive Berechtigungen",
    it: "Autorizzazioni attive",
    pt: "Permissões Ativas",
    ar: "الأذونات النشطة",
    zh: "有效权限",
    ja: "有効な権限",
    ru: "Активные разрешения"
  },
  "settings.users.noLogins": {
    es: "No hay registros de inicio de sesión para este usuario",
    ca: "No hi ha registres d'inici de sessió per a aquest usuari",
    en: "No login records found for this user",
    fr: "Aucun enregistrement de connexion pour cet utilisateur",
    de: "Keine Anmeldedaten für diesen Benutzer gefunden",
    it: "Nessun record di accesso trovato per questo utente",
    pt: "Nenhum registro de login encontrado para este usuário",
    ar: "لا توجد سجلات تسجيل دخول لهذا المستخدم",
    zh: "未找到该用户的登录记录",
    ja: "このユーザーのログイン記録は見つかりませんでした",
    ru: "Нет записей о входе для этого пользователя"
  },
  "settings.users.noAudit": {
    es: "No se han registrado modificaciones o eventos de auditoría para este usuario",
    ca: "No s'han registrat modificacions o esdeveniments d'auditoria per a aquest usuari",
    en: "No audit events or modifications recorded for this user",
    fr: "Aucune modification ou événement d'audit enregistré pour cet utilisateur",
    de: "Keine Audit-Ereignisse oder Änderungen für diesen Benutzer erfasst",
    it: "Nessun evento di controllo o modifica registrato per questo utente",
    pt: "Nenhum evento de auditoria ou modificação registrado para este usuário",
    ar: "لم يتم تسجيل أي تعديلات أو أحداث تدقيق لهذا المستخدم",
    zh: "未记录该用户的任何修改或审计事件",
    ja: "このユーザーの監査イベントや変更は記録されていません",
    ru: "Для этого пользователя не зарегистрировано изменений или событий аудита"
  },
  "settings.users.viewAudit": {
    es: "Ver Actividad y Logins",
    ca: "Veure Activitat i Inicis",
    en: "View Activity & Logins",
    fr: "Voir l'activité et connexions",
    de: "Aktivität & Anmeldungen anzeigen",
    it: "Visualizza attività e accessi",
    pt: "Ver Atividade e Logins",
    ar: "عرض النشاط وتسجيلات الدخول",
    zh: "查看活动与登录",
    ja: "アクティビティとログインを表示",
    ru: "Просмотреть активность и входы"
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

  // Sort keys alphabetically
  const sorted = {};
  for (const k of Object.keys(data).sort()) {
    sorted[k] = data[k];
  }

  fs.writeFileSync(filePath, JSON.stringify(sorted, null, 2) + '\n', 'utf8');
  console.log(`Updated ${lang}.json (${Object.keys(sorted).length} keys)`);
}

console.log('✅ All translations applied successfully!');
