import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Phone, Mail, User, Check, CheckCheck, Search, Sparkles } from 'lucide-react';
import { apiRequest } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { wsClient } from '../services/websocket';

const CANNED_RESPONSES = [
  {
    label: '👋 Saludo cordial',
    template: 'Hola {{name}}, un placer saludarte desde DAMA CRM. ¿En qué podemos ayudarte hoy?',
  },
  {
    label: '📅 Confirmar cita',
    template: 'Hola {{name}}, te confirmamos la sesión para revisar los detalles del proyecto. ¿Te viene bien el horario?',
  },
  {
    label: '📑 Presupuesto enviado',
    template: 'Estimado/a {{name}}, te hemos emitido y enviado la propuesta económica. Quedamos a tu disposición para cualquier duda.',
  },
  {
    label: '⏳ Seguimiento',
    template: 'Hola {{name}}, ¿has tenido oportunidad de revisar la propuesta enviada? Nos encantaría conocer tu opinión.',
  },
  {
    label: '✅ Agradecimiento',
    template: '¡Muchas gracias por tu confianza, {{name}}! Nuestro equipo ya está trabajando en tu cuenta.',
  },
];

export const Omnichannel: React.FC = () => {
  const { t } = useLanguage();
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [replyContent, setReplyContent] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<'WHATSAPP' | 'EMAIL'>('WHATSAPP');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    if (selectedContact) {
      loadMessages(selectedContact.id);
    }

    const unsub = wsClient.on('omnichannel:message', (msg: any) => {
      if (selectedContact && msg.contactId === selectedContact.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    });

    return unsub;
  }, [selectedContact]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const applyCannedResponse = (template: string) => {
    if (!selectedContact) return;
    const name = selectedContact.firstName || 'estimado/a';
    const filled = template.replace(/\{\{name\}\}/g, name);
    setReplyContent(filled);
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !selectedContact) return;

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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
          {t('omnichannel')}
        </h1>
        <p className="text-xs text-gray-500 dark:text-slate-400">
          Bandeja de entrada unificada de WhatsApp Meta Cloud API y correos electrónicos
        </p>
      </div>

      {/* Two-Column Chat Box */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-xs h-[calc(100vh-210px)] flex">
        {/* Left: Contacts List */}
        <div className="w-1/3 border-r border-gray-200 dark:border-slate-800 flex flex-col">
          <div className="p-3 border-b border-gray-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-gray-700 dark:text-slate-300">
              <span>Conversaciones</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-800 text-gray-500">
                {filteredContacts.length}
              </span>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar contacto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800/60">
            {filteredContacts.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-400">
                No se encontraron contactos
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
                    {c.firstName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900 dark:text-white truncate">
                        {c.firstName} {c.lastName}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-slate-400 truncate">
                      {c.company?.name || c.phone || c.email}
                    </div>
                  </div>
                </button>
              );
            })
          )}
          </div>
        </div>

        {/* Right: Message Thread & Sender */}
        <div className="w-2/3 flex flex-col bg-gray-50/50 dark:bg-slate-950/40">
          {/* Thread Header */}
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
            <div className="p-3 text-xs text-gray-400">Seleccione un contacto</div>
          )}

          {/* Messages Bubble Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="py-20 text-center text-xs text-gray-400">
                Sin mensajes en la conversación. Puedes enviar el primer mensaje a continuación.
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
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Canned Responses */}
          {selectedContact && (
            <div className="px-3 pt-2 pb-1.5 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 flex items-center space-x-1.5 overflow-x-auto scrollbar-none">
              <div className="flex items-center space-x-1 text-[10px] font-bold text-gray-400 dark:text-slate-500 shrink-0 mr-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Rápidas:</span>
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
              onChange={(e) => setReplyContent(e.target.value)}
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
    </div>
  );
};
