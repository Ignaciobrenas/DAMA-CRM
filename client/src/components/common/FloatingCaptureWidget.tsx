import React, { useState } from 'react';
import { MessageCircle, X, Send, CheckCircle2, ChevronUp } from 'lucide-react';
import { apiRequest } from '../../services/api';
import { LoadingSpinner } from './Loading';

export const FloatingCaptureWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !contactInfo) return;

    setIsLoading(true);
    const isEmail = contactInfo.includes('@');
    const res = await apiRequest('/lead-capture/chat-session', {
      method: 'POST',
      body: JSON.stringify({
        name,
        email: isEmail ? contactInfo : undefined,
        phone: !isEmail ? contactInfo : undefined,
        initialMessage: message || 'Consulta desde widget interactivo',
        channel: 'WHATSAPP',
      }),
    });

    setIsLoading(false);
    if (res.success) {
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setIsOpen(false);
        setName('');
        setContactInfo('');
        setMessage('');
      }, 4000);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Expanded Widget Window */}
      {isOpen ? (
        <div className="w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-4 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold leading-tight">¿Tienes dudas sobre DAMA-CRM?</div>
                <div className="text-[10px] text-emerald-100 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                  <span>Equipo en línea • Respuesta media: 5 min</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4">
            {submitted ? (
              <div className="py-6 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold text-gray-900 dark:text-white">
                  ¡Mensaje enviado al CRM!
                </div>
                <p className="text-[11px] text-gray-500 dark:text-slate-400">
                  Un especialista se pondrá en contacto contigo de inmediato.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <p className="text-[11px] text-gray-500 dark:text-slate-400">
                  Déjanos tus datos y te atenderemos por WhatsApp o email al instante:
                </p>

                <div>
                  <input
                    type="text"
                    required
                    placeholder="Tu nombre completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <input
                    type="text"
                    required
                    placeholder="Teléfono móvil o Email"
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <textarea
                    rows={2}
                    placeholder="¿En qué podemos ayudarte?"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center space-x-1.5 shadow-md transition-colors disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner size="xs" color="white" />
                      <span>Conectando...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Iniciar Conversación</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      ) : (
        /* Floating Launcher Bubble */
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center space-x-2.5 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <div className="relative">
            <MessageCircle className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-300 rounded-full border-2 border-emerald-700 animate-ping" />
          </div>
          <span className="text-xs font-bold tracking-tight pr-1">¿Hablamos?</span>
        </button>
      )}
    </div>
  );
};
