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
  Mic,
  MicOff,
  Paperclip,
  Pin,
  PinOff,
  Reply,
  Copy,
  Play,
  Pause,
  Volume2,
  X,
  FileText,
  Image,
  Download,
  MoreVertical,
  CornerDownRight,
  Filter,
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

const EMOJI_SHORTCUTS = ['👍', '🎉', '🚀', '💡', '✅', '🔥', '👀', '🙌', '❤️', '👏'];

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

// Simulated Audio Note Player Component
interface AudioNotePlayerProps {
  durationSeconds?: number;
  isOutbound?: boolean;
}

const AudioNotePlayer: React.FC<AudioNotePlayerProps> = ({ durationSeconds = 18, isOutbound = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 1.5 | 2>(1);
  const timerRef = useRef<any>(null);

  const togglePlay = () => {
    if (isPlaying) {
      clearInterval(timerRef.current);
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      timerRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timerRef.current);
            setIsPlaying(false);
            return 0;
          }
          return prev + (100 / (durationSeconds * 10)) * playbackSpeed;
        });
      }, 100);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const changeSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (playbackSpeed === 1) setPlaybackSpeed(1.5);
    else if (playbackSpeed === 1.5) setPlaybackSpeed(2);
    else setPlaybackSpeed(1);
  };

  return (
    <div
      className={`flex items-center space-x-2.5 p-2 rounded-xl transition-all ${
        isOutbound
          ? 'bg-blue-700/60 text-white'
          : 'bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white'
      }`}
    >
      <button
        type="button"
        onClick={togglePlay}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-105 shrink-0 ${
          isOutbound
            ? 'bg-white text-blue-600'
            : 'bg-emerald-600 text-white dark:bg-emerald-500'
        }`}
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
      </button>

      {/* Waveform Visualization Bars */}
      <div className="flex-1 flex items-center space-x-0.5 h-6 cursor-pointer">
        {[40, 70, 30, 90, 60, 100, 45, 80, 20, 65, 85, 40, 75, 55, 95, 30, 70, 50, 85, 35].map(
          (height, idx) => {
            const barProgress = (idx / 20) * 100;
            const isFilled = progress >= barProgress;
            return (
              <span
                key={idx}
                className={`w-1 rounded-full transition-all duration-150 ${
                  isFilled
                    ? isOutbound
                      ? 'bg-white'
                      : 'bg-emerald-500'
                    : isOutbound
                    ? 'bg-blue-300/50'
                    : 'bg-gray-300 dark:bg-slate-600'
                }`}
                style={{ height: `${height}%` }}
              />
            );
          }
        )}
      </div>

      <div className="flex items-center space-x-1.5 shrink-0">
        <span className="text-[10px] font-mono opacity-80">
          0:{Math.floor((durationSeconds * (100 - progress)) / 100).toString().padStart(2, '0')}
        </span>
        <button
          type="button"
          onClick={changeSpeed}
          className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${
            isOutbound ? 'bg-blue-800 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300'
          }`}
        >
          {playbackSpeed}x
        </button>
      </div>
    </div>
  );
};

export const Omnichannel: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();

  // Tab State: 'whatsapp' vs 'internal'
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'internal'>('whatsapp');

  // WhatsApp / External Chat State
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [replyContent, setReplyContent] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<'WHATSAPP' | 'EMAIL'>('WHATSAPP');
  const [searchQuery, setSearchQuery] = useState('');
  const [inChatSearchQuery, setInChatSearchQuery] = useState('');
  const [isInChatSearchOpen, setIsInChatSearchOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isWsConnected, setIsWsConnected] = useState<boolean>(wsClient.isWsConnected());
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<{ [contactId: string]: number }>({});
  const [lastMessages, setLastMessages] = useState<{ [contactId: string]: { content: string; time?: string } }>({});
  const [replyingToMessage, setReplyingToMessage] = useState<any | null>(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [pinnedMessageIds, setPinnedMessageIds] = useState<string[]>([]);
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);
  const recordingTimerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Internal Team Chat State
  const [internalChannels, setInternalChannels] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [selectedInternalTarget, setSelectedInternalTarget] = useState<any | null>(null);
  const [internalMessages, setInternalMessages] = useState<any[]>([]);
  const [internalInputText, setInternalInputText] = useState('');
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const [internalInChatSearchQuery, setInternalInChatSearchQuery] = useState('');
  const [isInternalInChatSearchOpen, setIsInternalInChatSearchOpen] = useState(false);
  const [internalUnreadCounts, setInternalUnreadCounts] = useState<{ [targetId: string]: number }>({});
  const [internalReplyingTo, setInternalReplyingTo] = useState<any | null>(null);
  const [internalPinnedIds, setInternalPinnedIds] = useState<string[]>([]);
  const [showInternalPinnedOnly, setShowInternalPinnedOnly] = useState(false);

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

    const unsubConn = wsClient.on('connection:change', ({ connected }) => {
      setIsWsConnected(connected);
    });

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

    const unsubInternalMsg = wsClient.on('internal_chat:message', (msg: any) => {
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
      setReplyingToMessage(null);
    }
  }, [selectedContact]);

  useEffect(() => {
    if (selectedInternalTarget) {
      loadInternalMessages(selectedInternalTarget.id);
      setInternalUnreadCounts((prev) => ({ ...prev, [selectedInternalTarget.id]: 0 }));
      setInternalReplyingTo(null);
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

  // Voice Recording Simulator
  const startRecordingVoice = () => {
    setIsRecordingVoice(true);
    setRecordingSeconds(0);
    recordingTimerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
  };

  const stopAndSendVoice = async () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setIsRecordingVoice(false);

    if (!selectedContact) return;

    const res = await apiRequest('/omnichannel/messages', {
      method: 'POST',
      body: JSON.stringify({
        contactId: selectedContact.id,
        channel: 'WHATSAPP',
        content: `🎤 [Nota de voz - ${recordingSeconds}s]`,
        isAudio: true,
        audioDuration: recordingSeconds,
      }),
    });

    if (res.success) {
      soundService.playSuccessChime();
      loadMessages(selectedContact.id);
    }
  };

  const cancelRecordingVoice = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setIsRecordingVoice(false);
    setRecordingSeconds(0);
  };

  const handleFileUploadSimulated = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedContact) return;

    setReplyContent((prev) => `${prev} 📎 Archivo adjunto: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`.trim());
  };

  const togglePinMessage = (msgId: string) => {
    setPinnedMessageIds((prev) =>
      prev.includes(msgId) ? prev.filter((id) => id !== msgId) : [...prev, msgId]
    );
  };

  const toggleInternalPinMessage = (msgId: string) => {
    setInternalPinnedIds((prev) =>
      prev.includes(msgId) ? prev.filter((id) => id !== msgId) : [...prev, msgId]
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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

    let finalContent = replyContent.trim();
    if (replyingToMessage) {
      finalContent = `> Replying to: "${replyingToMessage.content.slice(0, 40)}..."\n\n${finalContent}`;
    }

    const res = await apiRequest('/omnichannel/messages', {
      method: 'POST',
      body: JSON.stringify({
        contactId: selectedContact.id,
        channel: selectedChannel,
        content: finalContent,
      }),
    });

    if (res.success) {
      setReplyContent('');
      setReplyingToMessage(null);
      loadMessages(selectedContact.id);
    }
  };

  const handleSendInternalMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!internalInputText.trim() || !selectedInternalTarget) return;

    const channelTargetId = selectedInternalTarget.id;
    let text = internalInputText.trim();
    if (internalReplyingTo) {
      text = `> [${internalReplyingTo.senderName}]: "${internalReplyingTo.content.slice(0, 40)}..."\n\n${text}`;
    }

    setInternalInputText('');
    setInternalReplyingTo(null);

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

  const activeMessages = messages.filter((m) => {
    if (showPinnedOnly && !pinnedMessageIds.includes(m.id)) return false;
    if (inChatSearchQuery.trim()) {
      return m.content?.toLowerCase().includes(inChatSearchQuery.toLowerCase());
    }
    return true;
  });

  const activeInternalMessages = internalMessages.filter((m) => {
    if (showInternalPinnedOnly && !internalPinnedIds.includes(m.id)) return false;
    if (internalInChatSearchQuery.trim()) {
      return m.content?.toLowerCase().includes(internalInChatSearchQuery.toLowerCase());
    }
    return true;
  });

  const totalWhatsAppUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);
  const totalInternalUnread = Object.values(internalUnreadCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      {/* Top Header & Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-black tracking-tight text-gray-900 dark:text-white">
              {t('omnichannel', 'Comunicaciones & Chat')}
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800">
              Centro Unificado
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
            {activeTab === 'whatsapp'
              ? 'Bandeja unificada de WhatsApp Meta Cloud API y correos de clientes'
              : 'Canales de equipo, salas por departamento y mensajería directa corporativa'}
          </p>
        </div>

        {/* Tab Buttons & Real-time status */}
        <div className="flex items-center space-x-3">
          <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('whatsapp')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all relative ${
                activeTab === 'whatsapp'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
              <span>{t('omnichannel.tabWhatsApp', 'WhatsApp & Clientes')}</span>
              {totalWhatsAppUnread > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-600 text-white">
                  {totalWhatsAppUnread}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('internal')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all relative ${
                activeTab === 'internal'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-indigo-500" />
              <span>{t('omnichannel.tabInternal', 'Chat Interno de Equipo')}</span>
              {totalInternalUnread > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-indigo-600 text-white">
                  {totalInternalUnread}
                </span>
              )}
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
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-xs h-[calc(100vh-230px)] flex">
          {/* Left: Contacts List */}
          <div className="w-1/3 min-w-[260px] max-w-[340px] border-r border-gray-200 dark:border-slate-800 flex flex-col bg-gray-50/30 dark:bg-slate-950/20">
            <div className="p-3 border-b border-gray-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-gray-700 dark:text-slate-300">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>{t('omnichannel.conversations', 'Clientes & Contactos')}</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-800 text-gray-500">
                  {filteredContacts.length}
                </span>
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('omnichannel.searchContactPlaceholder', 'Buscar cliente, teléfono...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1 text-xs bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800/60">
              {filteredContacts.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-400">
                  {t('omnichannel.noContacts', 'No se encontraron contactos')}
                </div>
              ) : (
                filteredContacts.map((c) => {
                  const isSelected = selectedContact?.id === c.id;
                  const unread = unreadCounts[c.id] || 0;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedContact(c)}
                      className={`w-full text-left p-3 flex items-start space-x-2.5 transition-all ${
                        isSelected
                          ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-l-4 border-emerald-600 shadow-xs'
                          : 'hover:bg-gray-100/60 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                        {c.firstName ? c.firstName.charAt(0) : 'C'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-900 dark:text-white truncate">
                            {c.firstName} {c.lastName}
                          </span>
                          {unread > 0 && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-600 text-white shrink-0 animate-pulse">
                              {unread}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-slate-400 truncate mt-0.5">
                          {lastMessages[c.id]?.content || c.phone || c.email || 'Sin mensajes'}
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
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                    {selectedContact.firstName ? selectedContact.firstName.charAt(0) : 'C'}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                      <span>{selectedContact.firstName} {selectedContact.lastName}</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                        Meta WhatsApp API
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-500 flex items-center space-x-2">
                      <span>{selectedContact.phone || selectedContact.email}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* In-chat search toggle */}
                  <button
                    onClick={() => setIsInChatSearchOpen(!isInChatSearchOpen)}
                    className={`p-1.5 rounded-lg border text-xs transition-colors ${
                      isInChatSearchOpen
                        ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/50'
                        : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 border-gray-200 dark:border-slate-700'
                    }`}
                    title="Buscar en la conversación"
                  >
                    <Search className="w-3.5 h-3.5" />
                  </button>

                  {/* Pinned Messages toggle */}
                  <button
                    onClick={() => setShowPinnedOnly(!showPinnedOnly)}
                    className={`p-1.5 rounded-lg border text-xs transition-colors flex items-center space-x-1 ${
                      showPinnedOnly
                        ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/50'
                        : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 border-gray-200 dark:border-slate-700'
                    }`}
                    title="Ver solo mensajes fijados"
                  >
                    <Pin className="w-3.5 h-3.5" />
                    {pinnedMessageIds.length > 0 && (
                      <span className="text-[10px] font-bold">{pinnedMessageIds.length}</span>
                    )}
                  </button>

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
              </div>
            ) : (
              <div className="p-3 text-xs text-gray-400">{t('omnichannel.selectContactPrompt', 'Selecciona un contacto')}</div>
            )}

            {/* In-chat Search Input Bar */}
            {isInChatSearchOpen && (
              <div className="px-3 py-2 bg-blue-50/70 dark:bg-blue-950/30 border-b border-blue-200 dark:border-blue-900/60 flex items-center justify-between space-x-2 animate-in fade-in duration-150">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-blue-500" />
                  <input
                    type="text"
                    value={inChatSearchQuery}
                    onChange={(e) => setInChatSearchQuery(e.target.value)}
                    placeholder="Buscar en los mensajes de este chat..."
                    className="w-full pl-8 pr-2.5 py-1 text-xs bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                  />
                </div>
                {inChatSearchQuery && (
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold shrink-0">
                    {activeMessages.length} resultados
                  </span>
                )}
                <button
                  onClick={() => {
                    setIsInChatSearchOpen(false);
                    setInChatSearchQuery('');
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Messages Bubble Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activeMessages.length === 0 ? (
                <div className="py-20 text-center text-xs text-gray-400">
                  {showPinnedOnly
                    ? 'No hay mensajes fijados en esta conversación.'
                    : inChatSearchQuery
                    ? 'No se encontraron mensajes que coincidan con la búsqueda.'
                    : t('omnichannel.emptyConversation', 'Sin mensajes en la conversación. Puedes enviar el primer mensaje a continuación.')}
                </div>
              ) : (
                activeMessages.map((m) => {
                  const isOutbound = m.direction === 'OUTBOUND';
                  const isPinned = pinnedMessageIds.includes(m.id);
                  const isVoiceNote = m.isAudio || m.content?.includes('[Nota de voz');

                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col group ${isOutbound ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-md p-3 rounded-2xl text-xs space-y-1.5 shadow-xs relative transition-all ${
                          isOutbound
                            ? 'bg-blue-600 text-white rounded-br-xs'
                            : 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 rounded-bl-xs'
                        } ${isPinned ? 'ring-2 ring-amber-400 shadow-md' : ''}`}
                      >
                        {/* Pinned Badge */}
                        {isPinned && (
                          <div className="flex items-center space-x-1 text-[9px] font-bold text-amber-500 pb-0.5">
                            <Pin className="w-2.5 h-2.5 fill-current" />
                            <span>Mensaje fijado</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[9px] opacity-75 space-x-3">
                          <span className="font-semibold">{m.sender || (isOutbound ? 'Tú' : selectedContact?.firstName)}</span>
                          <div className="flex items-center space-x-1">
                            <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {isOutbound && <CheckCheck className="w-3 h-3 text-blue-200" />}
                          </div>
                        </div>

                        {/* Message Content or Audio Note */}
                        {isVoiceNote ? (
                          <AudioNotePlayer
                            durationSeconds={m.audioDuration || 18}
                            isOutbound={isOutbound}
                          />
                        ) : (
                          <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>
                        )}

                        {/* Hover Action Bar */}
                        <div
                          className={`absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-0.5 shadow-md ${
                            isOutbound ? 'right-0 -translate-y-6' : 'left-0 -translate-y-6'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setReplyingToMessage(m)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 hover:text-blue-600 rounded"
                            title="Responder"
                          >
                            <Reply className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => togglePinMessage(m.id)}
                            className={`p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded ${
                              isPinned ? 'text-amber-500' : 'text-gray-500 hover:text-amber-500'
                            }`}
                            title={isPinned ? 'Desfijar' : 'Fijar mensaje'}
                          >
                            <Pin className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(m.content)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 hover:text-emerald-600 rounded"
                            title="Copiar texto"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
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
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Replying To Message Banner */}
            {replyingToMessage && (
              <div className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/50 border-t border-blue-200 dark:border-blue-800 flex items-center justify-between text-xs text-blue-900 dark:text-blue-200">
                <div className="flex items-center space-x-2 truncate">
                  <CornerDownRight className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="font-semibold shrink-0">Respondiendo a:</span>
                  <span className="truncate italic opacity-80">"{replyingToMessage.content}"</span>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyingToMessage(null)}
                  className="p-1 hover:text-rose-500"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Quick Canned Responses */}
            {selectedContact && !isRecordingVoice && (
              <div className="px-3 pt-2 pb-1.5 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 flex items-center space-x-1.5 overflow-x-auto scrollbar-none">
                <div className="flex items-center space-x-1 text-[10px] font-bold text-gray-400 dark:text-slate-500 shrink-0 mr-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Plantillas:</span>
                </div>
                {CANNED_RESPONSES.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyCannedResponse(item.template)}
                    className="shrink-0 px-2.5 py-1 text-[11px] font-medium bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 dark:bg-slate-800 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-400 text-gray-600 dark:text-slate-300 rounded-lg transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUploadSimulated}
              className="hidden"
            />

            {/* Reply Form or Active Voice Recording Bar */}
            {isRecordingVoice ? (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border-t border-rose-200 dark:border-rose-900 flex items-center justify-between animate-in fade-in">
                <div className="flex items-center space-x-2 text-xs font-bold text-rose-600 dark:text-rose-400">
                  <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                  <span>Grabando nota de voz: {recordingSeconds}s</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={cancelRecordingVoice}
                    className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-rose-100 rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={stopAndSendVoice}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg flex items-center space-x-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar Audio</span>
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSendMessage}
                className="p-3 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 flex items-center space-x-2"
              >
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                  title="Adjuntar archivo o imagen"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  required
                  value={replyContent}
                  onChange={handleTypingChange}
                  placeholder={`Escribe un mensaje por ${selectedChannel === 'WHATSAPP' ? 'WhatsApp' : 'Email'}...`}
                  className="flex-1 px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                />

                <button
                  type="button"
                  onClick={startRecordingVoice}
                  className="p-2 text-gray-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                  title="Grabar nota de voz"
                >
                  <Mic className="w-4 h-4" />
                </button>

                <button
                  type="submit"
                  className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors shrink-0"
                  title="Enviar mensaje"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: Internal Team Chat */}
      {activeTab === 'internal' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-xs h-[calc(100vh-230px)] flex">
          {/* Left: Channels & Teammates List */}
          <div className="w-1/3 min-w-[260px] max-w-[340px] border-r border-gray-200 dark:border-slate-800 flex flex-col bg-gray-50/40 dark:bg-slate-950/20">
            <div className="p-3 border-b border-gray-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-gray-800 dark:text-slate-200">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span>{t('omnichannel.internalDirectory', 'Canales & Compañeros')}</span>
                </div>
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
                        className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-xs font-bold'
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
                        className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-xs font-bold'
                            : 'hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div className="relative">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] ${
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
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800 shadow-xs">
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

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsInternalInChatSearchOpen(!isInternalInChatSearchOpen)}
                    className={`p-1.5 rounded-lg border text-xs transition-colors ${
                      isInternalInChatSearchOpen
                        ? 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-950/50'
                        : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 border-gray-200 dark:border-slate-700'
                    }`}
                    title="Buscar mensajes en este canal"
                  >
                    <Search className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setShowInternalPinnedOnly(!showInternalPinnedOnly)}
                    className={`p-1.5 rounded-lg border text-xs transition-colors flex items-center space-x-1 ${
                      showInternalPinnedOnly
                        ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/50'
                        : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 border-gray-200 dark:border-slate-700'
                    }`}
                    title="Ver mensajes fijados del canal"
                  >
                    <Pin className="w-3.5 h-3.5" />
                    {internalPinnedIds.length > 0 && (
                      <span className="text-[10px] font-bold">{internalPinnedIds.length}</span>
                    )}
                  </button>

                  <div className="flex items-center space-x-1.5 text-[11px] text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-slate-700">
                    <Shield className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Aislado</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 text-xs text-gray-400">Selecciona un canal o compañero para conversar</div>
            )}

            {/* In-chat Search Input Bar */}
            {isInternalInChatSearchOpen && (
              <div className="px-3 py-2 bg-indigo-50/70 dark:bg-indigo-950/30 border-b border-indigo-200 dark:border-indigo-900/60 flex items-center justify-between space-x-2 animate-in fade-in duration-150">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-indigo-500" />
                  <input
                    type="text"
                    value={internalInChatSearchQuery}
                    onChange={(e) => setInternalInChatSearchQuery(e.target.value)}
                    placeholder="Buscar en los mensajes de este canal..."
                    className="w-full pl-8 pr-2.5 py-1 text-xs bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => {
                    setIsInternalInChatSearchOpen(false);
                    setInternalInChatSearchQuery('');
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Internal Message Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activeInternalMessages.length === 0 ? (
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
                activeInternalMessages.map((msg) => {
                  const isOwn = msg.senderId === user?.id;
                  const isPinned = internalPinnedIds.includes(msg.id);
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-start space-x-2.5 group ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 shadow-xs ${
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
                          {isPinned && (
                            <span className="text-[9px] font-bold text-amber-500 flex items-center space-x-0.5">
                              <Pin className="w-2.5 h-2.5 fill-current" />
                              <span>Fijado</span>
                            </span>
                          )}
                        </div>

                        <div className="relative">
                          <div
                            className={`p-3 rounded-2xl text-xs shadow-xs leading-relaxed whitespace-pre-wrap ${
                              isOwn
                                ? 'bg-indigo-600 text-white rounded-tr-xs'
                                : 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 rounded-tl-xs'
                            } ${isPinned ? 'ring-2 ring-amber-400' : ''}`}
                          >
                            {msg.content}
                          </div>

                          {/* Hover Action Bar */}
                          <div
                            className={`absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-0.5 shadow-md ${
                              isOwn ? 'right-0 -translate-y-6' : 'left-0 -translate-y-6'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => setInternalReplyingTo(msg)}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 hover:text-indigo-600 rounded"
                              title="Responder"
                            >
                              <Reply className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleInternalPinMessage(msg.id)}
                              className={`p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded ${
                                isPinned ? 'text-amber-500' : 'text-gray-500 hover:text-amber-500'
                              }`}
                              title={isPinned ? 'Desfijar' : 'Fijar mensaje'}
                            >
                              <Pin className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(msg.content)}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 hover:text-emerald-600 rounded"
                              title="Copiar texto"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={internalMessagesEndRef} />
            </div>

            {/* Replying Banner */}
            {internalReplyingTo && (
              <div className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/50 border-t border-indigo-200 dark:border-indigo-800 flex items-center justify-between text-xs text-indigo-900 dark:text-indigo-200">
                <div className="flex items-center space-x-2 truncate">
                  <CornerDownRight className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span className="font-semibold shrink-0">Respondiendo a {internalReplyingTo.senderName}:</span>
                  <span className="truncate italic opacity-80">"{internalReplyingTo.content}"</span>
                </div>
                <button
                  type="button"
                  onClick={() => setInternalReplyingTo(null)}
                  className="p-1 hover:text-rose-500"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Quick Emoji Reaction Bar */}
            <div className="px-3 pt-2 pb-1 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 flex items-center space-x-1.5">
              <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 mr-1">Reacciones:</span>
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
                className="flex-1 px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-indigo-600"
              />
              <button
                type="submit"
                className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors shrink-0"
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
