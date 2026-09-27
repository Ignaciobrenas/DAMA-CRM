import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Phone,
  Mail,
  User,
  Check,
  CheckCheck,
  Search,
  Sparkles,
  Hash,
  Users,
  Shield,
  MessageCircle,
  Radio,
  Smile,
  Megaphone,
  Briefcase,
  Headphones,
  FolderKanban,
  CheckCircle2,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { wsClient } from '../services/websocket';
import { soundService } from '../services/sound';

const CANNED_RESPONSES = [
  {
    label: 'Saludo cordial',
    template: 'Hola {{name}}, un placer saludarte. ¿En qué podemos ayudarte hoy?',
  },
  {
    label: 'Confirmar cita',
    template: 'Hola {{name}}, te confirmamos la sesión para revisar los detalles del proyecto. ¿Te viene bien el horario?',
  },
  {
    label: 'Presupuesto enviado',
    template: 'Estimado/a {{name}}, te hemos emitido y enviado la propuesta económica. Quedamos a tu disposición para cualquier duda.',
  },
  {
    label: 'Seguimiento',
    template: 'Hola {{name}}, ¿has tenido oportunidad de revisar la propuesta enviada? Nos encantaría conocer tu opinión.',
  },
  {
    label: 'Agradecimiento',
    template: '¡Muchas gracias por tu confianza, {{name}}! Nuestro equipo ya está trabajando en tu cuenta.',
  },
];

const EMOJI_SHORTCUTS = ['👍', '🎉', '🚀', '💡', '✅', '🔥', '👀', '🙌'];

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  general: <Hash className="w-4 h-4 text-blue-500" />,
  ventas: <Briefcase className="w-4 h-4 text-emerald-500" />,
  soporte: <Headphones className="w-4 h-4 text-amber-500" />,
  proyectos: <FolderKanban className="w-4 h-4 text-purple-500" />,
  anuncios: <Megaphone className="w-4 h-4 text-rose-500" />,
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
  SALES: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  TECH: 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400 border-sky-200 dark:border-sky-800',
  SUPPORT: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  HR: 'bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-400 border-pink-200 dark:border-pink-800',
  EMPLOYEE: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  VIEWER: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700',
};

export const Omnichannel: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();

  // Tab State: 'whatsapp' (External WhatsApp/Customer Chat) vs 'internal' (Team Internal Chat)
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'internal'>('whatsapp');

  // WhatsApp / Omnichannel External Chat State
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [replyContent, setReplyContent] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<'WHATSAPP' | 'EMAIL'>('WHATSAPP');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isWsConnected, setIsWsConnected] = useState<boolean>(wsClient.isWsConnected());
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<{ [contactId: string]: number }>({});
  const [lastMessages, setLastMessages] = useState<{ [contactId: string]: { content: string; time?: string } }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  // Internal Team Chat State
  const [internalChannels, setInternalChannels] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [selectedInternalTarget, setSelectedInternalTarget] = useState<any | null>(null);
  const [internalMessages, setInternalMessages] = useState<any[]>([]);
  const [internalInputText, setInternalInputText] = useState('');
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const [internalUnreadCounts, setInternalUnreadCounts] = useState<{ [targetId: string]: number }>({});
  const internalMessagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollInternalToBottom = () => {
    internalMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadContacts = async () => {
    setIsLoading(true);
    const res = await apiRequest('/contacts?limit=50');
    if (res.success && res.data) {
      setContacts(res.data);
      if (res.data.length > 0 && !selectedContact) {
        setSelectedContact(res.data[0]);
      }
    }
    setIsLoading(false);
  };

  const loadMessages = async (contactId: string) => {
    const res = await apiRequest(`/omnichannel/messages?contactId=${contactId}`);
    if (res.success && res.data) {
      setMessages(res.data.reverse()); // Chronological order
    }
  };

  // Internal Chat Loaders
  const loadInternalChannels = async () => {
    const res = await apiRequest('/omnichannel/internal/channels');
    if (res.success && res.data) {
      setInternalChannels(res.data.channels || []);
      setTeamMembers(res.data.users || []);

      if (!selectedInternalTarget && (res.data.channels?.length > 0 || res.data.users?.length > 0)) {
        setSelectedInternalTarget(res.data.channels[0]);
      }
    }
  };

  const loadInternalMessages = async (targetId: string) => {
    const res = await apiRequest(`/omnichannel/internal/messages?channelId=${encodeURIComponent(targetId)}&limit=60`);
    if (res.success && res.data) {
      setInternalMessages(res.data);
    }
  };

  // External Chat Initial Effect
  useEffect(() => {
    loadContacts();
    loadInternalChannels();

    // Listen to WebSocket connection state changes
    const unsubConn = wsClient.on('connection:change', ({ connected }) => {
      setIsWsConnected(connected);
    });

    // Listen to incoming real-time external messages
    const unsubMsg = wsClient.on('omnichannel:message', (msg: any) => {
      if (msg.direction === 'INBOUND') {
        soundService.playMessageChime();
      }

      if (msg.contactId) {
        setLastMessages((prev) => ({
          ...prev,
          [msg.contactId]: { content: msg.content, time: msg.timestamp },
        }));
      }

      setSelectedContact((currentSelected: any) => {
        if (currentSelected && msg.contactId === currentSelected.id) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        } else if (msg.contactId) {
          setUnreadCounts((prev) => ({
            ...prev,
            [msg.contactId]: (prev[msg.contactId] || 0) + 1,
          }));
        }
        return currentSelected;
      });
    });

    // Listen for real-time typing events from external peers
    const unsubTyping = wsClient.on('omnichannel:typing', (data: any) => {
      setSelectedContact((currentSelected: any) => {
        if (currentSelected && data.contactId === currentSelected.id) {
          setIsPartnerTyping(Boolean(data.isTyping));
          if (data.isTyping) {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => setIsPartnerTyping(false), 3500);
          }
        }
        return currentSelected;
      });
    });

    // Listen to real-time internal team messages
    const unsubInternalMsg = wsClient.on('internal_chat:message', (msg: any) => {
      // Play soft notification sound
      soundService.playMessageChime();

      setSelectedInternalTarget((currentTarget: any) => {
        const isCurrentActive =
          currentTarget &&
          (currentTarget.id === msg.channelId ||
            (currentTarget.type === 'dm' && (msg.senderId === currentTarget.id || msg.channelId === `dm_${user?.id}`)));

        if (isCurrentActive) {
          setInternalMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        } else {
          setInternalUnreadCounts((prev) => ({
            ...prev,
            [msg.channelId]: (prev[msg.channelId] || 0) + 1,
          }));
        }
        return currentTarget;
      });
    });

    return () => {
      unsubConn();
      unsubMsg();
      unsubTyping();
      unsubInternalMsg();
    };
  }, [user?.id]);

  useEffect(() => {
    if (selectedContact) {
      loadMessages(selectedContact.id);
      setIsPartnerTyping(false);
      setUnreadCounts((prev) => ({ ...prev, [selectedContact.id]: 0 }));
    }
  }, [selectedContact]);

  useEffect(() => {
    if (selectedInternalTarget) {
      loadInternalMessages(selectedInternalTarget.id);
      setInternalUnreadCounts((prev) => ({ ...prev, [selectedInternalTarget.id]: 0 }));
    }
  }, [selectedInternalTarget]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isPartnerTyping]);

  useEffect(() => {
    scrollInternalToBottom();
  }, [internalMessages]);

  const applyCannedResponse = (template: string) => {
    if (!selectedContact) return;
    const name = selectedContact.firstName || 'estimado/a';
    const filled = template.replace(/\{\{name\}\}/g, name);
    setReplyContent(filled);
  };

  const handleTypingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReplyContent(e.target.value);
    if (!selectedContact) return;
    wsClient.send('omnichannel:typing', { contactId: selectedContact.id, isTyping: true });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      wsClient.send('omnichannel:typing', { contactId: selectedContact.id, isTyping: false });
    }, 2000);
  };

  const filteredContacts = contacts.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const fullName = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
    const company = (c.company?.name || '').toLowerCase();
    const phone = (c.phone || '').toLowerCase();
    const email = (c.email || '').toLowerCase();
    return fullName.includes(q) || company.includes(q) || phone.includes(q) || email.includes(q);
  });

  const filteredInternalChannels = internalChannels.filter((ch) => {
    if (!internalSearchQuery.trim()) return true;
    const q = internalSearchQuery.toLowerCase();
    return ch.name?.toLowerCase().includes(q) || ch.displayName?.toLowerCase().includes(q);
  });

  const filteredTeamMembers = teamMembers.filter((u) => {
    if (!internalSearchQuery.trim()) return true;
    const q = internalSearchQuery.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !selectedContact) return;

    wsClient.send('omnichannel:typing', { contactId: selectedContact.id, isTyping: false });

    const res = await apiRequest('/omnichannel/messages', {
      method: 'POST',
      body: JSON.stringify({
        contactId: selectedContact.id,
        channel: selectedChannel,
        content: replyContent.trim(),
      }),
    });

    if (res.success) {
      setReplyContent('');
      loadMessages(selectedContact.id);
    }
  };

  const handleSendInternalMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!internalInputText.trim() || !selectedInternalTarget) return;

    const channelTargetId = selectedInternalTarget.id;
    const text = internalInputText.trim();
    setInternalInputText('');

    const res = await apiRequest('/omnichannel/internal/messages', {
      method: 'POST',
      body: JSON.stringify({
        channelId: channelTargetId,
        content: text,
      }),
    });

    if (res.success && res.data) {
      setInternalMessages((prev) => {
        if (prev.some((m) => m.id === res.data.id)) return prev;
        return [...prev, res.data];
      });
      scrollInternalToBottom();
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              {t('omnichannel', 'Comunicaciones & Chat')}
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800">
              Omnicanal
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
            {activeTab === 'whatsapp'
              ? t('omnichannel.subtitle', 'Bandeja de entrada unificada de WhatsApp Meta Cloud API y correos de clientes')
              : t('omnichannel.internalSubtitle', 'Canales de equipo, salas por departamento y mensajes directos corporativos')}
          </p>
        </div>

        {/* Tab Buttons & Real-time status */}
        <div className="flex items-center space-x-3">
          <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('whatsapp')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'whatsapp'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
              <span>{t('omnichannel.tabWhatsApp', 'WhatsApp & Clientes')}</span>
            </button>

            <button
              onClick={() => setActiveTab('internal')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'internal'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-indigo-500" />
              <span>{t('omnichannel.tabInternal', 'Chat Interno de Equipo')}</span>
            </button>
          </div>

          <span
            className={`inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors ${
              isWsConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isWsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span className="hidden sm:inline">
              {isWsConnected ? t('omnichannel.wsLive', 'En Vivo') : t('omnichannel.wsReconnecting', 'Reconectando...')}
            </span>
          </span>
        </div>
      </div>

      {/* VIEW 1: WhatsApp & External Clients Chat */}
      {activeTab === 'whatsapp' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-xs h-[calc(100vh-230px)] flex">
          {/* Left: Contacts List */}
          <div className="w-1/3 min-w-[240px] max-w-[340px] border-r border-gray-200 dark:border-slate-800 flex flex-col">
            <div className="p-3 border-b border-gray-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-gray-700 dark:text-slate-300">
                <span>{t('omnichannel.conversations', 'Conversaciones')}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-800 text-gray-500">
                  {filteredContacts.length}
                </span>
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('omnichannel.searchContactPlaceholder', 'Buscar por cliente, empresa...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800/60">
              {filteredContacts.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-400">
                  {t('omnichannel.noContacts', 'No se encontraron contactos')}
                </div>
              ) : (
                filteredContacts.map((c) => {
                  const isSelected = selectedContact?.id === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedContact(c)}
                      className={`w-full text-left p-3 flex items-start space-x-2.5 transition-colors ${
                        isSelected
                          ? 'bg-blue-50/80 dark:bg-blue-950/40 border-l-4 border-blue-600'
                          : 'hover:bg-gray-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {c.firstName ? c.firstName.charAt(0) : 'C'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-900 dark:text-white truncate">
                            {c.firstName} {c.lastName}
                          </span>
                          {unreadCounts[c.id] > 0 && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-600 text-white shrink-0">
                              {unreadCounts[c.id]}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-500 dark:text-slate-400 truncate">
                          {lastMessages[c.id]?.content || c.company?.name || c.phone || c.email}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Message Thread & Sender */}
          <div className="flex-1 flex flex-col bg-gray-50/50 dark:bg-slate-950/40">
            {selectedContact ? (
              <div className="p-3 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-gray-900 dark:text-white">
                    {selectedContact.firstName} {selectedContact.lastName}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    {selectedContact.phone} • {selectedContact.email}
                  </div>
                </div>

                {/* Channel Selector */}
                <div className="flex bg-gray-100 dark:bg-slate-800 p-0.5 rounded-lg text-[11px] font-semibold">
                  <button
                    onClick={() => setSelectedChannel('WHATSAPP')}
                    className={`px-2 py-1 rounded-md transition-colors ${
                      selectedChannel === 'WHATSAPP'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-gray-600 dark:text-slate-400'
                    }`}
                  >
                    WhatsApp
                  </button>
                  <button
                    onClick={() => setSelectedChannel('EMAIL')}
                    className={`px-2 py-1 rounded-md transition-colors ${
                      selectedChannel === 'EMAIL'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-gray-600 dark:text-slate-400'
                    }`}
                  >
                    Email
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 text-xs text-gray-400">{t('omnichannel.selectContactPrompt', 'Selecciona un contacto')}</div>
            )}

            {/* Messages Bubble Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="py-20 text-center text-xs text-gray-400">
                  {t('omnichannel.emptyConversation', 'Sin mensajes en la conversación. Puedes enviar el primer mensaje a continuación.')}
                </div>
              ) : (
                messages.map((m) => {
                  const isOutbound = m.direction === 'OUTBOUND';
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isOutbound ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-md p-3 rounded-xl text-xs space-y-1 shadow-xs ${
                          isOutbound
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 rounded-bl-none'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[9px] opacity-75 space-x-2">
                          <span>{m.sender}</span>
                          <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="leading-relaxed">{m.content}</p>
                      </div>
                    </div>
                  );
                })
              )}
              {isPartnerTyping && (
                <div className="flex items-start animate-in fade-in duration-150">
                  <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-3 py-2 rounded-xl rounded-bl-none shadow-xs flex items-center space-x-2 text-xs text-gray-500">
                    <span className="text-[11px] font-semibold text-gray-700 dark:text-slate-300">
                      {selectedContact?.firstName} está escribiendo
                    </span>
                    <span className="flex space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Canned Responses */}
            {selectedContact && (
              <div className="px-3 pt-2 pb-1.5 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 flex items-center space-x-1.5 overflow-x-auto scrollbar-none">
                <div className="flex items-center space-x-1 text-[10px] font-bold text-gray-400 dark:text-slate-500 shrink-0 mr-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>{t('omnichannel.cannedResponsesLabel', 'Plantillas:')}</span>
                </div>
                {CANNED_RESPONSES.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyCannedResponse(item.template)}
                    className="shrink-0 px-2.5 py-1 text-[11px] font-medium bg-gray-100 hover:bg-blue-50 hover:text-blue-600 dark:bg-slate-800 dark:hover:bg-blue-950/50 dark:hover:text-blue-400 text-gray-600 dark:text-slate-300 rounded-md transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}

            {/* Reply Form */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 flex items-center space-x-2"
            >
              <input
                type="text"
                required
                value={replyContent}
                onChange={handleTypingChange}
                placeholder={`Escribe un mensaje por ${selectedChannel === 'WHATSAPP' ? 'WhatsApp' : 'Email'}...`}
                className="flex-1 px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
              />
              <button
                type="submit"
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs transition-colors shrink-0"
                title="Enviar"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* VIEW 2: Internal Team Chat */}
      {activeTab === 'internal' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-xs h-[calc(100vh-230px)] flex">
          {/* Left: Channels & Teammates List */}
          <div className="w-1/3 min-w-[240px] max-w-[340px] border-r border-gray-200 dark:border-slate-800 flex flex-col bg-gray-50/40 dark:bg-slate-950/20">
            <div className="p-3 border-b border-gray-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-gray-800 dark:text-slate-200">
                <span>{t('omnichannel.internalDirectory', 'Canales & Compañeros')}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-800">
                  {internalChannels.length + teamMembers.length}
                </span>
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('omnichannel.searchTeamPlaceholder', 'Buscar canal o compañero...')}
                  value={internalSearchQuery}
                  onChange={(e) => setInternalSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1 text-xs bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-3">
              {/* Section 1: Public Department Channels */}
              <div>
                <div className="px-2 py-1 text-[10px] font-bold text-gray-400 dark:text-slate-500 tracking-wider uppercase flex items-center space-x-1">
                  <Hash className="w-3 h-3" />
                  <span>{t('omnichannel.channelsTitle', 'Canales Corporativos')}</span>
                </div>
                <div className="space-y-0.5 mt-1">
                  {filteredInternalChannels.map((ch) => {
                    const isSelected = selectedInternalTarget?.id === ch.id;
                    const unread = internalUnreadCounts[ch.id] || 0;
                    return (
                      <button
                        key={ch.id}
                        onClick={() => setSelectedInternalTarget(ch)}
                        className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                            : 'hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2 min-w-0">
                          <span className={isSelected ? 'text-white' : ''}>
                            {CHANNEL_ICONS[ch.name] || <Hash className="w-4 h-4 text-gray-400" />}
                          </span>
                          <div className="truncate text-xs">
                            <span>#{ch.name}</span>
                          </div>
                        </div>
                        {unread > 0 && (
                          <span
                            className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                              isSelected ? 'bg-white text-indigo-700' : 'bg-indigo-600 text-white'
                            }`}
                          >
                            {unread}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: Direct Messages / Team Members */}
              <div>
                <div className="px-2 py-1 text-[10px] font-bold text-gray-400 dark:text-slate-500 tracking-wider uppercase flex items-center space-x-1">
                  <User className="w-3 h-3" />
                  <span>{t('omnichannel.teamDMsTitle', 'Mensajes Directos')}</span>
                </div>
                <div className="space-y-0.5 mt-1">
                  {filteredTeamMembers.map((tm) => {
                    const isSelected = selectedInternalTarget?.id === tm.id;
                    const unread = internalUnreadCounts[tm.id] || 0;
                    const isMe = tm.id === user?.id;
                    return (
                      <button
                        key={tm.id}
                        onClick={() => setSelectedInternalTarget(tm)}
                        className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                            : 'hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div className="relative">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                                isSelected ? 'bg-white text-indigo-700' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200'
                              }`}
                            >
                              {tm.name?.charAt(0) || 'U'}
                            </div>
                            <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900 absolute -bottom-0.5 -right-0.5" />
                          </div>
                          <div className="truncate">
                            <div className="text-xs truncate flex items-center space-x-1.5">
                              <span>{tm.name}</span>
                              {isMe && (
                                <span className={`text-[9px] px-1 rounded ${isSelected ? 'bg-indigo-700 text-indigo-100' : 'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-300'}`}>
                                  Tú
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1">
                          {tm.role && (
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded border font-mono ${
                                isSelected
                                  ? 'bg-indigo-700/60 border-indigo-400 text-white'
                                  : ROLE_COLORS[tm.role] || 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {tm.role}
                            </span>
                          )}
                          {unread > 0 && (
                            <span
                              className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                                isSelected ? 'bg-white text-indigo-700' : 'bg-indigo-600 text-white'
                              }`}
                            >
                              {unread}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Internal Channel / Direct Message Feed */}
          <div className="flex-1 flex flex-col bg-gray-50/50 dark:bg-slate-950/40">
            {/* Active Channel / DM Header */}
            {selectedInternalTarget ? (
              <div className="p-3 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
                    {selectedInternalTarget.type === 'channel' ? (
                      CHANNEL_ICONS[selectedInternalTarget.name] || <Hash className="w-5 h-5" />
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                      <span>
                        {selectedInternalTarget.type === 'channel'
                          ? `#${selectedInternalTarget.name}`
                          : selectedInternalTarget.name}
                      </span>
                      {selectedInternalTarget.role && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded border font-mono ${
                            ROLE_COLORS[selectedInternalTarget.role] || 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {selectedInternalTarget.role}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-500 dark:text-slate-400">
                      {selectedInternalTarget.type === 'channel'
                        ? selectedInternalTarget.description || 'Canal de discusión y avisos del equipo'
                        : selectedInternalTarget.email}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-[11px] text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-slate-700">
                  <Shield className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Cifrado & Aislado por Empresa</span>
                </div>
              </div>
            ) : (
              <div className="p-3 text-xs text-gray-400">Selecciona un canal o compañero para conversar</div>
            )}

            {/* Internal Message Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {internalMessages.length === 0 ? (
                <div className="py-20 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto border border-indigo-200 dark:border-indigo-800">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-xs font-bold text-gray-800 dark:text-slate-200">
                    {selectedInternalTarget?.type === 'channel'
                      ? `Bienvenido a #${selectedInternalTarget?.name}`
                      : `Conversación con ${selectedInternalTarget?.name}`}
                  </h3>
                  <p className="text-[11px] text-gray-500 max-w-sm mx-auto">
                    {selectedInternalTarget?.type === 'channel'
                      ? 'Este es el comienzo del canal. Comparte ideas, actualizaciones o coordina tareas con todo el equipo.'
                      : 'Envía un mensaje directo privado para coordinar proyectos y tareas.'}
                  </p>
                </div>
              ) : (
                internalMessages.map((msg) => {
                  const isOwn = msg.senderId === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-start space-x-2.5 ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                          isOwn
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {msg.senderName?.charAt(0) || 'U'}
                      </div>
                      <div className={`max-w-lg space-y-1 ${isOwn ? 'items-end text-right' : 'items-start text-left'}`}>
                        <div className="flex items-center space-x-1.5 text-[10px] text-gray-500 dark:text-slate-400">
                          <span className="font-bold text-gray-800 dark:text-slate-200">{msg.senderName}</span>
                          {msg.senderRole && (
                            <span
                              className={`text-[8px] px-1 py-0.2 rounded border font-mono ${
                                ROLE_COLORS[msg.senderRole] || 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {msg.senderRole}
                            </span>
                          )}
                          <span>•</span>
                          <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div
                          className={`p-3 rounded-xl text-xs shadow-xs leading-relaxed ${
                            isOwn
                              ? 'bg-indigo-600 text-white rounded-tr-none'
                              : 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 rounded-tl-none'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={internalMessagesEndRef} />
            </div>

            {/* Quick Emoji Reaction Bar */}
            <div className="px-3 pt-2 pb-1 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 flex items-center space-x-1.5">
              <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 mr-1">Reacciones rápidas:</span>
              {EMOJI_SHORTCUTS.map((emoji, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setInternalInputText((prev) => `${prev} ${emoji} `.trim())}
                  className="px-2 py-0.5 text-xs hover:bg-gray-100 dark:hover:bg-slate-800 rounded transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Internal Message Composer */}
            <form
              onSubmit={handleSendInternalMessage}
              className="p-3 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 flex items-center space-x-2"
            >
              <input
                type="text"
                required
                value={internalInputText}
                onChange={(e) => setInternalInputText(e.target.value)}
                placeholder={
                  selectedInternalTarget?.type === 'channel'
                    ? `Escribe un mensaje en #${selectedInternalTarget.name}...`
                    : `Mensaje directo para ${selectedInternalTarget?.name || 'compañero'}...`
                }
                className="flex-1 px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-indigo-600"
              />
              <button
                type="submit"
                className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs transition-colors shrink-0"
                title="Enviar al equipo"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
